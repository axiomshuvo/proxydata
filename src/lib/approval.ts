import { createInAppNotification } from "./notifications";
import type { Db } from "mongodb";

// Server-only approval helpers (01 §12.4/§15.3/§16.2). Kept outside the
// Server Actions module so the logic is importable without the "use server"
// boundary. Money-critical: covered by the P1 verification script.

export const GB_BYTES = 1073741824;

/**
 * Thrown to unwind an approval gracefully back to PENDING (price drift,
 * exhausted coupon, unreachable provider…). Callers MUST let this through
 * untouched — it is not a provider failure, so FAILED + op-log writes
 * must not run.
 */
export class ApprovalAbort extends Error {}

export function dhakaPeriod(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  }).format(d);
}

/**
 * Atomic coupon claim at approval (01 §15.3): re-validate the winning code,
 * insert the (couponId, transactionId) usage row (unique = no double-claim),
 * CAS-bump usageCount under the limit, flip one-time codes to INACTIVE.
 * Any failure aborts the approval back to PENDING via abortToPending.
 */
export async function claimCouponTx(
  db: Db,
  tx: Record<string, any>,
  abortToPending: (why: string) => Promise<never>,
): Promise<void> {
  if (tx.type !== "PURCHASE" || !tx.couponCode) return;
  const code = String(tx.couponCode).toUpperCase();
  const coupon = await db.collection("coupons").findOne({ code });
  const bad = (why: string) => abortToPending(`Coupon "${code}": ${why}`);
  if (!coupon) return bad("no longer exists.");
  if (coupon.status !== "ACTIVE") return bad("is no longer active.");
  const now = new Date();
  if (coupon.validFrom && new Date(coupon.validFrom) > now) return bad("is not yet valid.");
  if (coupon.validTo && new Date(coupon.validTo) < now) return bad("has expired.");
  if (coupon.planId && String(coupon.planId) !== String(tx.planId)) return bad("is bound to a different plan.");
  // Binding re-check at approval: create-time validation alone is not enough —
  // any path that skips quoteDiscounts must still fail closed here.
  if (coupon.userId && String(coupon.userId) !== String(tx.userId)) return bad("is assigned to a different account.");
  // Idempotent retry FIRST: this exact (coupon, transaction) already claimed.
  // (Must precede the exhaustion check — a retried approval of the same order
  // passes through even when the coupon is now fully claimed.)
  const already = await db.collection("coupon_usages").findOne({
    couponId: coupon._id.toString(),
    transactionId: tx.transactionId ?? String(tx._id),
  });
  if (already) return;
  const seen = Number(coupon.usageCount ?? 0);
  const limit = coupon.usageLimit !== undefined && coupon.usageLimit !== null ? Number(coupon.usageLimit) : null;
  if (limit !== null && seen >= limit) return bad("has been fully claimed.");
  try {
    await db.collection("coupon_usages").insertOne({
      couponId: coupon._id.toString(),
      userId: tx.userId,
      transactionId: tx.transactionId ?? String(tx._id),
      discountAppliedBdt: tx.couponDiscountBdt ?? tx.finalDiscountAppliedBdt ?? 0,
      createdAt: new Date(),
    });
  } catch {
    return bad("was just claimed by another approval (concurrency guard).");
  }
  // CAS bump: only succeeds if usageCount is still what we read.
  const bump: Record<string, unknown> = { $inc: { usageCount: 1 } };
  if (coupon.isOneTime) bump.$set = { status: "INACTIVE" };
  const bumped = await db.collection("coupons").updateOne(
    { _id: coupon._id, usageCount: seen },
    bump as never,
  );
  if (bumped.matchedCount === 0) {
    // Lost the race after inserting usage: roll our usage row back, abort.
    await db.collection("coupon_usages").deleteOne({
      couponId: coupon._id.toString(),
      transactionId: tx.transactionId ?? String(tx._id),
    });
    return bad("was just exhausted by another approval.");
  }
}

/**
 * Commission decision at PROVIDER_VERIFIED → ACTIVE (01 §12.4): exactly one
 * row per attributed PURCHASE, including explicit ৳0 (floor-capped, self-use).
 * Unattributed purchases get no row. REDEEM/ADMIN_ADJUSTMENT never qualify.
 * Unique (transactionId) makes retries idempotent. Never throws — an
 * unexpected failure degrades to an explicit ৳0 + runtime WARN (money-safe).
 */
export async function decideCommission(
  db: Db,
  tx: Record<string, any>,
  providerCostBdt: number,
): Promise<void> {
  const txKey = tx.transactionId ?? String(tx._id);
  try {
    if (tx.type !== "PURCHASE") return;
    const referral = await db.collection("affiliate_referrals").findOne({ referredUserId: tx.userId });
    if (!referral) return; // unattributed purchase: no decision row needed
    const affiliateId = String(referral.affiliateId);
    const qtyGb = Math.max(1, Math.round(Number(tx.bandwidthBytes ?? 0) / GB_BYTES) || Number(tx.bandwidthGb ?? 1) || 1);

    // Rule hierarchy: plan override → affiliate override → global default.
    const ownerProfile = await db.collection("affiliate_profiles").findOne({ userId: affiliateId }).catch(() => null);
    let ruleAmount = 0;
    let ruleBandwidth = 1;
    const planRule = (ownerProfile?.commissionRules as { planId: string; commissionAmountBdt: number; commissionBandwidthGb: number }[] | undefined)?.find(
      (r) => String(r.planId) === String(tx.planId),
    );
    if (planRule) {
      ruleAmount = Number(planRule.commissionAmountBdt);
      ruleBandwidth = Number(planRule.commissionBandwidthGb) || 1;
    } else if (
      ownerProfile?.globalCommissionOverride?.commissionAmountBdt !== undefined &&
      ownerProfile?.globalCommissionOverride?.commissionBandwidthGb
    ) {
      ruleAmount = Number(ownerProfile.globalCommissionOverride.commissionAmountBdt);
      ruleBandwidth = Number(ownerProfile.globalCommissionOverride.commissionBandwidthGb) || 1;
    } else {
      const settings = await db.collection("system_settings").findOne({ _id: "GLOBAL_SETTINGS" } as never).catch(() => null);
      ruleAmount = Number(settings?.defaultCommissionPerGbBdt ?? 10);
      ruleBandwidth = 1;
    }

    const selfUse = affiliateId === String(tx.userId);
    const normal = selfUse ? 0 : Math.floor((ruleAmount * qtyGb) / ruleBandwidth); // owner-favoring floor
    const settings = await db.collection("system_settings").findOne({ _id: "GLOBAL_SETTINGS" } as never).catch(() => null);
    const floor = Number(settings?.minimumOwnerProfitBdt ?? 15);
    const finalPrice = Number(tx.finalAmountBdt ?? 0);
    const margin = finalPrice - providerCostBdt;
    const safe = margin - floor;
    const final = selfUse ? 0 : Math.max(0, Math.min(normal, safe));

    try {
      await db.collection("affiliate_commissions").insertOne({
        affiliateId,
        referredUserId: String(tx.userId),
        transactionId: txKey,
        qualifyingBandwidthBytes: Number(tx.bandwidthBytes ?? qtyGb * GB_BYTES),
        commissionRuleAmountBdt: ruleAmount,
        commissionRuleBandwidthGb: ruleBandwidth,
        originalPlanPriceBdt: Number(tx.basePriceBdt ?? 0),
        providerCostBdt,
        offerDiscountBdt: Number(tx.offerDiscountBdt ?? 0),
        couponDiscountBdt: Number(tx.couponDiscountBdt ?? 0),
        finalCustomerPriceBdt: finalPrice,
        ownerMinimumProfitFloorBdt: floor,
        actualOwnerMarginBdt: margin,
        calculatedNormalCommissionBdt: normal,
        maximumSafeCommissionBdt: safe,
        finalCommissionBdt: final,
        accountingPeriod: dhakaPeriod(),
        status: "UNPAID",
        paidAmountBdt: 0,
        createdAt: new Date(),
      });
    } catch {
      // Duplicate key = decision already recorded (idempotent retry). Continue.
    }
  } catch (e) {
    const { logRuntime } = await import("@/lib/runtime-log");
    logRuntime({
      level: "WARN",
      source: "admin",
      operation: "COMMISSION_DECISION",
      status: "FAILED",
      message: `Commission compute failed for ${txKey} — recording explicit ৳0.`,
      refId: txKey,
    });
    try {
      await db.collection("affiliate_commissions").insertOne({
        affiliateId: "UNKNOWN",
        referredUserId: String(tx.userId),
        transactionId: txKey,
        qualifyingBandwidthBytes: Number(tx.bandwidthBytes ?? 0),
        commissionRuleAmountBdt: 0,
        commissionRuleBandwidthGb: 1,
        originalPlanPriceBdt: Number(tx.basePriceBdt ?? 0),
        providerCostBdt,
        offerDiscountBdt: 0,
        couponDiscountBdt: 0,
        finalCustomerPriceBdt: Number(tx.finalAmountBdt ?? 0),
        ownerMinimumProfitFloorBdt: 0,
        actualOwnerMarginBdt: 0,
        calculatedNormalCommissionBdt: 0,
        maximumSafeCommissionBdt: 0,
        finalCommissionBdt: 0,
        accountingPeriod: dhakaPeriod(),
        status: "UNPAID",
        paidAmountBdt: 0,
        createdAt: new Date(),
      });
    } catch {
      // Duplicate = already decided. Continue to activation.
    }
  }
}
