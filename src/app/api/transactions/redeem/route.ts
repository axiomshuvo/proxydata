import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import {
  addSubUserBalance,
  createSubUser,
  getSubUserBalance,
} from "@/lib/dataimpulse/client";
import { createInAppNotification } from "@/lib/notifications";

const GB = 1024 * 1024 * 1024;

function newTransactionId(): string {
  return `TX-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`;
}

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
    // Atomic claim ACTIVE → PROCESSING (exactly-once under concurrency, 01 §17).
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
          redeemedBy: session.user.publicUserId,
          redeemedAt: now,
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
      const bandwidthGb = Math.floor(lockedCode.bandwidthBytes / GB);
      
      // Look for an existing proxy account of this type for this user
      let proxyAccount = await db.collection("proxy_accounts").findOne({
        userId: session.user.publicUserId,
        providerId: lockedCode.providerId || "dataimpulse",
        proxyType: lockedCode.proxyType || "RESIDENTIAL"
      });

      let subUserId = proxyAccount ? Number(proxyAccount.providerSubUserId ?? proxyAccount.providerSubId) : null;

      if (!proxyAccount) {
        // Need to create a new sub-user at DataImpulse first
        const upstreamPoolType = String(lockedCode.proxyType || "RESIDENTIAL").toLowerCase() as "residential" | "mobile" | "datacenter" | "premium_residential";
        const newSubUser = await createSubUser({
          label: `px-${String(session.user.publicUserId).slice(-6)}-${upstreamPoolType}`,
          poolType: upstreamPoolType,
        });

        subUserId = newSubUser.id;

        // Save new proxy account in our DB (spec field names, 02 §9)
        await db.collection("proxy_accounts").insertOne({
          userId: session.user.publicUserId,
          providerId: "dataimpulse",
          providerSubUserId: subUserId,
          proxyType: lockedCode.proxyType || "RESIDENTIAL",
          poolTypeRaw: upstreamPoolType,
          login: newSubUser.login,
          // NOTE: encrypt with AES-256-GCM before ANY write (02 §43).
          password: newSubUser.password,
          cumulativePurchasedBytes: 0,
          cachedRemainingBytes: 0,
          lastBalanceSyncAt: new Date(),
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Add the balance upstream (DataImpulse) with op-log row first (02 §51).
      if (bandwidthGb > 0 && subUserId) {
        const txId = newTransactionId();
        await db.collection("provider_operation_logs").insertOne({
          transactionId: txId,
          operationType: "ADD_BALANCE",
          provider: "dataimpulse",
          payload: { subuser_id: subUserId, traffic: bandwidthGb },
          status: "PENDING",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await addSubUserBalance(subUserId, bandwidthGb);
        const post = await getSubUserBalance(subUserId).catch(() => null);
        await db.collection("provider_operation_logs").updateOne(
          { transactionId: txId, operationType: "ADD_BALANCE" },
          { $set: { status: "SUCCESS", updatedAt: new Date() } },
        );
      }

      // 3. Finalize: PROCESSING → PROVIDER_ALLOCATED → USED + REDEEM ledger row.
      // REDEEM transactions NEVER earn commission (worker branch, 01 §12.4).
      await db.collection("redeem_codes").updateOne(
        { _id: lockedCode._id, status: "PROCESSING" },
        { $set: { status: "PROVIDER_ALLOCATED", updatedAt: new Date() } },
      );
      await db.collection("transactions").insertOne({
        transactionId: newTransactionId(),
        userId: session.user.publicUserId,
        type: "REDEEM",
        status: "ACTIVE",
        bandwidthBytes: lockedCode.bandwidthBytes,
        bandwidthGb,
        basePriceBdt: 0,
        finalAmountBdt: 0,
        couponCode: code,
        createdAt: new Date(),
        activatedAt: new Date(),
        updatedAt: new Date(),
      });

      // Update Proxy Balance Locally
      await db.collection("proxy_accounts").updateOne(
        { userId: session.user.publicUserId, providerId: "dataimpulse", proxyType: lockedCode.proxyType || "RESIDENTIAL" },
        {
          $inc: { cumulativePurchasedBytes: lockedCode.bandwidthBytes },
          $set: { updatedAt: new Date() }
        }
      );

      // Mark the Code as permanently USED (never deleted)
      await db.collection("redeem_codes").updateOne(
        { _id: lockedCode._id },
        { $set: { status: "USED", redeemedAt: new Date(), updatedAt: new Date() } }
      );

      await createInAppNotification(
        session.user.publicUserId as string,
        "REDEEM_SUCCESS",
        "Code redeemed",
        `${bandwidthGb} GB has been credited to your proxy.`,
      );

      return NextResponse.json({ 
        success: true, 
        message: "Code successfully redeemed!", 
        allocatedGb: bandwidthGb 
      });

    } catch (allocationError) {
      // 4. Recovery: provider failure reverts PROCESSING → ACTIVE (retryable),
      // never silently to USED (01 §17). Stale PROCESSING (>15 min) is picked
      // up by the reconciler via addition-history + live balance/get.
      console.error("Upstream allocation failed, releasing code lock...", allocationError);

      await db.collection("redeem_codes").updateOne(
        { _id: lockedCode._id },
        {
          $set: {
            status: "ACTIVE",
            redeemedBy: null,
            redeemedAt: null,
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
