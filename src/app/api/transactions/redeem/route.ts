import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import { addSubUserBalance, createSubUser } from "@/lib/dataimpulse/client";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Missing redemption code" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Atomic Locking & Validation (Exactly-Once Semantics)
    // We look for a code that is GENERATED/ACTIVE and lock it to PROCESSING in one atomic step.
    const now = new Date();
    
    // Convert status GENERATED to ACTIVE if needed, but here we just lock any unused code.
    const lockedCode = await db.collection("redeem_codes").findOneAndUpdate(
      { 
        code,
        status: { $in: ["GENERATED", "ACTIVE"] },
        $or: [{ validFrom: { $exists: false } }, { validFrom: { $lte: now } }],
        validTo: { $gte: now }
      },
      { 
        $set: { 
          status: "PROCESSING", 
          claimedBy: session.user.publicUserId,
          updatedAt: now 
        } 
      },
      { returnDocument: "after" }
    );

    if (!lockedCode) {
      return NextResponse.json({ error: "Invalid, expired, or already claimed code" }, { status: 400 });
    }

    try {
      // 2. Upstream Allocation via DataImpulse Adapter
      // Determine how many GBs this code is worth (assume bytes -> GB conversion)
      const bandwidthGb = Math.floor(lockedCode.bandwidthBytes / (1024 * 1024 * 1024));
      
      // Look for an existing proxy account of this type for this user
      let proxyAccount = await db.collection("proxy_accounts").findOne({
        userId: session.user.publicUserId,
        providerId: lockedCode.providerId || "dataimpulse",
        proxyType: lockedCode.proxyType || "RESIDENTIAL"
      });

      let subUserId = proxyAccount ? Number(proxyAccount.providerSubId) : null;
      let login = proxyAccount ? proxyAccount.login : "";
      let password = proxyAccount ? proxyAccount.password : "";

      if (!proxyAccount) {
        // Need to create a new sub-user at DataImpulse first
        const upstreamPoolType = String(lockedCode.proxyType || "RESIDENTIAL").toLowerCase() as any;
        const newSubUser = await createSubUser(upstreamPoolType);
        
        subUserId = newSubUser.id;
        login = newSubUser.login;
        password = newSubUser.password;

        // Save new proxy account in our DB
        await db.collection("proxy_accounts").insertOne({
          userId: session.user.publicUserId,
          providerId: "dataimpulse",
          providerSubId: subUserId,
          proxyType: lockedCode.proxyType || "RESIDENTIAL",
          login,
          password,
          bandwidthBalanceBytes: 0,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Add the balance upstream (DataImpulse)
      if (bandwidthGb > 0 && subUserId) {
        await addSubUserBalance(subUserId, bandwidthGb);
      }

      // 3. Finalize: PROCESSING -> USED + Insert Transaction
      await db.collection("transactions").insertOne({
        userId: session.user.publicUserId,
        type: "REDEEM", // Spec: NEVER insert commissions for REDEEM
        status: "COMPLETED", // Because allocation succeeded
        amountTaka: 0,
        planGbSnapshot: bandwidthGb,
        couponCode: code,
        discountTaka: lockedCode.monetaryValuationBdt || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update Proxy Balance Locally
      await db.collection("proxy_accounts").updateOne(
        { userId: session.user.publicUserId, providerSubId: subUserId },
        { 
          $inc: { bandwidthBalanceBytes: lockedCode.bandwidthBytes },
          $set: { updatedAt: new Date() }
        }
      );

      // Mark the Code as permanently USED
      await db.collection("redeem_codes").updateOne(
        { _id: lockedCode._id },
        { $set: { status: "USED", updatedAt: new Date() } }
      );

      return NextResponse.json({ 
        success: true, 
        message: "Code successfully redeemed!", 
        allocatedGb: bandwidthGb 
      });

    } catch (allocationError) {
      // 4. Rollback: If upstream DataImpulse fails, release the lock back to GENERATED
      console.error("Upstream allocation failed, rolling back code...", allocationError);
      
      await db.collection("redeem_codes").updateOne(
        { _id: lockedCode._id },
        { 
          $set: { 
            status: "GENERATED", 
            claimedBy: null,
            updatedAt: new Date() 
          } 
        }
      );
      
      return NextResponse.json({ error: "Upstream allocation failed. Code not consumed." }, { status: 502 });
    }

  } catch (error) {
    console.error("POST /api/transactions/redeem Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
