import { createAdminNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { createInAppNotification } from "@/lib/notifications";
import { loadProviderBilling, quoteDiscounts, quoteTiered } from "@/lib/pricing";
import { hitRateLimit } from "@/lib/rate-limit";

// Spam / storage-exhaustion guards: exact pending-order cap (DB-backed) plus
// a best-effort per-user sliding window (in-memory, approximate under cluster).
const MAX_PENDING_ORDERS = 3;
const CREATE_LIMIT = 10;
const CREATE_WINDOW_MS = 10 * 60 * 1000;

const CreateBodySchema = z.object({
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid planId."),
  quantityGb: z.coerce.number().int().min(1).max(1000).optional(),
  couponCode: z.string().trim().max(32).optional(),
  affiliateCode: z.string().trim().max(32).optional(),
});


export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.publicUserId as string;

    // Flood control first (cheap, no DB) — 429 with Retry-After.
    const burst = hitRateLimit(`tx-create:${userId}`, CREATE_LIMIT, CREATE_WINDOW_MS);
    if (!burst.allowed) {
      return NextResponse.json(
        { error: "Too many order attempts. Please wait a few minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(burst.retryAfterMs / 1000)) },
        },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {

    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    const parsed = CreateBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }
    const { planId, quantityGb, couponCode, affiliateCode } = parsed.data;

    const client = await clientPromise;
    const db = client.db();

    // Suspended users: read-only quarantine (01 §7.2/§30 rule 5).
    const myUser = await db.collection("user").findOne({ publicUserId: session.user.publicUserId });
    if (myUser?.status === "SUSPENDED") {

    return NextResponse.json({ error: "Account suspended — new orders blocked." }, { status: 403 });
    }

    // Spam cap (exact, DB-backed): max unpaid PENDING orders per user.
    // Honest users finish or wait; scripts hitting Buy in a loop get 429.
    const pendingCount = await db.collection("transactions").countDocuments({
      userId,
      status: "PENDING",
    });
    if (pendingCount >= MAX_PENDING_ORDERS) {
      return NextResponse.json(
        { error: "You have too many unpaid orders. Please complete or wait for them first." },
        { status: 429 },
      );
    }

    // 1. Validate the Plan
    const plan = await db.collection("plans").findOne({ 
      _id: new ObjectId(planId),
      status: "ACTIVE" 
    });

    if (!plan) {

    return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 });
    }

    // Provider gate (ALL pricing modes): a paused/hidden provider sells
    // nothing anywhere — public lists already exclude it via the catalog,
    // this blocks direct/stale-client orders including fixed bundles.
    const billing = await loadProviderBilling(db, plan.providerId ?? "dataimpulse");
    if (billing.status !== "ACTIVE") {

    return NextResponse.json({ error: "This plan's provider is not active." }, { status: 409 });
    }

    // 2. Server-side pricing (client sends {planId, quantityGb?} — never amounts).
    // FIXED: exact bundle. TIERED: quantityGb 1..1000 priced from the tier table.
    let basePriceBdt = plan.retailPriceBdt;
    let bandwidthGb = plan.bandwidthGb;
    let unitRateBdt: number | null = null;
    if (plan.pricingMode === "TIERED") {
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
      userId,
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
    // NOTE: no email here by design. Outbound mail is capped at 100/day and
    // limited to the 01 §32 allowlist (password resets + 2 admin system mails).
    // Order alerts go to the in-app feed + admin approvals queue.
    await createInAppNotification(
      userId, // (publicUserId, auto-resolves in our new wrapper)
      "PURCHASE_RECEIVED",
      "Order placed",
      `Your order for ${plan.name} is now pending approval. Please complete your payment.`
    );

    // Notify admins of new pending manual order
    await createAdminNotification(
      "NEW_ORDER_RECEIVED",
      "New Manual Order",
      `${session.user?.email || "A user"} submitted an order for ${bandwidthGb}GB.`,
      "/axiomshuvo/approvals"
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
