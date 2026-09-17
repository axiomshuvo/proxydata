import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { createInAppNotification } from "@/lib/notifications";


export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planId, couponCode, affiliateCode } = body;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Validate the Plan
    const plan = await db.collection("plans").findOne({ 
      _id: new ObjectId(planId),
      status: "ACTIVE" 
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 });
    }

    // 2. Initialize Price (Assume no discounts initially)
    let finalPriceBdt = plan.retailPriceBdt;
    let discountApplied = 0;

    // TODO: (Phase 9) Implement Coupon validation logic here:
    // If couponCode exists, check redeem_codes, validate validFrom/validTo, 
    // calculate discount, and update finalPriceBdt.

    // 3. Create the Transaction Record (Status: PENDING)
    const transaction = {
      userId: session.user.publicUserId as string,
      type: "PURCHASE",
      status: "PENDING",
      
      // Price snapshot (LOCKED-SPEC 01 §16.2 - freeze the price at checkout)
      amountTaka: finalPriceBdt,
      
      // Associated data
      planId: plan._id.toString(),
      planNameSnapshot: plan.name,
      planGbSnapshot: plan.bandwidthGb,
      
      // Metadata
      couponCode: couponCode || null,
      affiliateCode: affiliateCode || null,
      discountTaka: discountApplied,
      
      // Timestamp
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("transactions").insertOne(transaction);

    // Phase 11: In-App Notification (Purchase Initiated)
    await createInAppNotification(
      session.user.publicUserId as string,
      "INFO",
      "Order Placed",
      `Your order for ${plan.name} is now pending approval. Please complete your bKash payment.`
    );


    return NextResponse.json({ 
      success: true, 
      transactionId: result.insertedId.toString(),
      amount: finalPriceBdt,
      status: "PENDING"
    });

  } catch (error) {
    console.error("POST /api/transactions/create Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
