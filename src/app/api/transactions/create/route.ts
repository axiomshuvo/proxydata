import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { createInAppNotification } from "@/lib/notifications";
import { loadProviderBilling, quoteDiscounts, quoteTiered } from "@/lib/pricing";


export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { planId, quantityGb, couponCode, affiliateCode } = body;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Suspended users: read-only quarantine (01 §7.2/§30 rule 5).
    const myUser = await db.collection("user").findOne({ publicUserId: session.user.publicUserId });
    if (myUser?.status === "SUSPENDED") {
      return NextResponse.json({ error: "Account suspended — new orders blocked." }, { status: 403 });
    }

    // 1. Validate the Plan
    const plan = await db.collection("plans").findOne({ 
      _id: new ObjectId(planId),
      status: "ACTIVE" 
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 });
    }

    // 2. Server-side pricing (client sends {planId, quantityGb?} — never amounts).
    // FIXED: exact bundle. TIERED: quantityGb 1..1000 priced from the tier table.
    let basePriceBdt = plan.retailPriceBdt;
    let bandwidthGb = plan.bandwidthGb;
    let unitRateBdt: number | null = null;
    if (plan.pricingMode === "TIERED") {
      const billing = await loadProviderBilling(db, plan.providerId ?? "dataimpulse");
      if (billing.status !== "ACTIVE") {
        return NextResponse.json({ error: "This plan's provider is not active." }, { status: 409 });
      }
      try {
        const quote = quoteTiered(plan.tiers ?? [], plan.proxyType, Number(quantityGb), {
          RESIDENTIAL: billing.baseBdt,
          MOBILE: billing.baseBdt,
          DATACENTER: billing.baseBdt,
          PREMIUM_RESIDENTIAL: billing.baseBdt,
        }, billing.coefficients);
        basePriceBdt = quote.subtotalBdt;
        bandwidthGb = quote.quantityGb;
        unitRateBdt = quote.unitRateBdt;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Invalid quantity.";
        const status = msg.startsWith("BELOW_COST") ? 409 : 400;
        return NextResponse.json({ error: msg }, { status });
      }
    } else if (quantityGb !== undefined && Number(quantityGb) !== plan.bandwidthGb) {
      return NextResponse.json({ error: "Fixed bundle — quantity must equal plan size." }, { status: 400 });
    }
    // Discounts: best-of-one offer vs coupon, server-computed (01 §14.1).
    // Invalid coupons fail closed here with the reason (fail-fast UX);
    // the binding claim still happens at approval (01 §15.3).
    let discount;
    try {
      discount = await quoteDiscounts(db, {
        plan: { _id: plan._id, retailPriceBdt: basePriceBdt },
        couponCode,
        userId: session.user.publicUserId as string,
      });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid coupon." }, { status: 400 });
    }
    const finalPriceBdt = discount.finalAmountBdt;

    // 3. Create the Transaction Record (Status: PENDING)
    // Price snapshot frozen at submission from server-side data only
    // (LOCKED 01 §16.2/§21 — client-sent prices are ignored; approval
    // re-validates and aborts on ANY drift).
    const transaction = {
      transactionId: `TX-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`,
      userId: session.user.publicUserId as string,
      type: "PURCHASE",
      status: "PENDING",

      // Price snapshot (LOCKED-SPEC 01 §16.2 - freeze the price at checkout)
      basePriceBdt,
      unitRateBdt,
      offerDiscountBdt: discount.offerDiscountBdt,
      couponDiscountBdt: discount.couponDiscountBdt,
      finalDiscountAppliedBdt: discount.finalDiscountAppliedBdt,
      discountSource: discount.discountSource,
      finalAmountBdt: discount.finalAmountBdt,

      // Associated data
      planId: plan._id.toString(),
      planSnapshot: { planId: plan._id.toString(), name: plan.name },
      proxyType: plan.proxyType,
      providerId: plan.providerId ?? "dataimpulse",
      bandwidthGb,
      bandwidthBytes: bandwidthGb * 1073741824,

      // Metadata — couponCode is the WINNING code only (losing coupons
      // consume nothing); affiliateCode is recorded inert for analytics.
      couponCode: discount.couponCode,
      affiliateCode: affiliateCode || null,
      
      // Timestamp
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("transactions").insertOne(transaction);

    // Phase 11: In-App Notification (Purchase Initiated — locked type).
    await createInAppNotification(
      session.user.publicUserId as string,
      "PURCHASE_RECEIVED",
      "Order placed",
      `Your order for ${plan.name} is now pending approval. Please complete your payment.`
    );
    
    // Alert the Admin via Email that an order needs approval
    const { sendEmail } = await import("@/lib/email");
    const { env } = await import("@/lib/env");
    await sendEmail({
      to: env.ADMIN_RECEIVER_EMAIL,
      subject: `🚨 New Order Pending: ${plan.name}`,
      html: `
        <h3>New Proxy Order Pending Approval</h3>
        <p>User <b>${session.user.email}</b> just placed an order for ${bandwidthGb} GB (${plan.name}).</p>
        <p>Transaction ID: ${transaction.transactionId}</p>
        <p>Amount: ৳${finalPriceBdt}</p>
        <br/>
        <a href="${env.NEXT_PUBLIC_APP_URL}/axiomshuvo/approvals">Click here to approve the transaction</a>
      `
    });


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
