import { PlanTierSchema, type PlanTier } from "@/lib/db/schema";

// Pool coefficients — the DataImpulse billing rule, LOCKED per 01 §10.2
// (live-verified). Other providers store their own rule on their provider doc
// (flat-rate vendors use 1 for every pool they sell).
export const POOL_COEFFICIENTS: Record<string, number> = {
  RESIDENTIAL: 1.0,
  DATACENTER: 0.5,
  MOBILE: 2.0,
  PREMIUM_RESIDENTIAL: 5.0,
};

export const MAX_TIERED_GB = 1000; // matches adapter edge (02 §41)

export type WholesaleCostMap = Record<string, number>; // base ৳/GB keyed per pool (legacy shape)
export type CoefficientMap = Record<string, number>;

export interface ProviderBilling {
  providerId: string;
  name: string;
  status: string;
  pools: string[];
  baseBdt: number; // single wholesale buying cost ৳/GB
  coefficients: CoefficientMap; // GB multiplier per pool
  gateway: { host: string; httpPort: number; socks5Port: number };
}

const DEFAULT_GATEWAY = { host: "gw.dataimpulse.com", httpPort: 823, socks5Port: 824 };

/** Load a provider's billing rule. Session-free — callers enforce auth. */
export async function loadProviderBilling(
  db: {
    collection: (name: string) => {
      findOne: (q: unknown) => Promise<Record<string, unknown> | null>;
    };
  },
  providerId: string,
): Promise<ProviderBilling> {
  const fallback: ProviderBilling = {
    providerId,
    name: providerId,
    status: providerId === "dataimpulse" ? "ACTIVE" : "DISABLED",
    pools: [],
    baseBdt: 0,
    coefficients: { ...POOL_COEFFICIENTS },
    gateway: { ...DEFAULT_GATEWAY },
  };
  try {
    const doc = await db.collection("providers").findOne({ providerId });
    if (!doc) return fallback;
    const base =
      Number(
        (doc.wholesaleBaseBdt as number | undefined) ??
          ((doc.costPerGbBdt as WholesaleCostMap | undefined)?.RESIDENTIAL ?? 0),
      ) || 0;
    const stored = (doc.coefficients ?? {}) as CoefficientMap;
    return {
      providerId,
      name: String(doc.name ?? providerId),
      status: String(doc.status ?? fallback.status),
      pools: (doc.pools as string[] | undefined) ?? [],
      baseBdt: base,
      coefficients: { ...POOL_COEFFICIENTS, ...stored },
      gateway: { ...DEFAULT_GATEWAY, ...((doc.gateway ?? {}) as Record<string, unknown>) } as ProviderBilling["gateway"],
    };
  } catch {
    return fallback;
  }
}

export const WHOLESALE_POOLS = ["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"] as const;

/** Load manual wholesale costs (02 §7). Session-free — callers enforce auth. */
export async function loadWholesaleCosts(db: {
  collection: (name: string) => { findOne: (q: unknown) => Promise<Record<string, unknown> | null> };
}): Promise<WholesaleCostMap> {
  const base: WholesaleCostMap = { RESIDENTIAL: 0, MOBILE: 0, DATACENTER: 0, PREMIUM_RESIDENTIAL: 0 };
  try {
    const doc = await db.collection("providers").findOne({ providerId: "dataimpulse" });
    const stored = (doc?.costPerGbBdt ?? {}) as WholesaleCostMap;
    return { ...base, ...stored };
  } catch {
    return base;
  }
}

/** Buying-cost floor per GB: ceil(base × pool coefficient). 0 base = floor disabled. */
export function floorPerGb(
  proxyType: string,
  costs: WholesaleCostMap,
  coefficients: CoefficientMap = POOL_COEFFICIENTS,
): number {
  const wholesale = Number(costs[proxyType] ?? costs.RESIDENTIAL ?? 0);
  if (!(wholesale > 0)) return 0; // unset cost = floor disabled (admin must set it)
  return Math.ceil(wholesale * (coefficients[proxyType] ?? 1));
}

/** Floor from a loaded provider billing (preferred — provider-aware). */
export function floorForProvider(proxyType: string, billing: ProviderBilling): number {
  if (!(billing.baseBdt > 0)) return 0;
  return Math.ceil(billing.baseBdt * (billing.coefficients[proxyType] ?? 1));
}

/** Validate a tier table: starts at 1, contiguous, no gaps/overlaps, rates decreasing. */
export function validateTiers(tiers: PlanTier[]): { ok: true } | { ok: false; error: string } {
  const parsed = PlanTierSchema.array().min(1).safeParse(tiers);
  if (!parsed.success) return { ok: false, error: "Each tier needs min GB ≥ 1, max GB ≥ min (or open), rate ≥ ৳1." };
  const sorted = [...parsed.data].sort((a, b) => a.minGb - b.minGb);
  if (sorted[0].minGb !== 1) return { ok: false, error: "First tier must start at 1 GB." };
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    if (t.maxGb !== null && t.maxGb < t.minGb) return { ok: false, error: `Tier ${i + 1}: max must be ≥ min.` };
    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.maxGb === null) return { ok: false, error: `Tier ${i} is open-ended — no tiers allowed after it.` };
      if (t.minGb !== prev.maxGb + 1)
        return { ok: false, error: `Gap/overlap between tier ${i} (ends ${prev.maxGb}) and tier ${i + 1} (starts ${t.minGb}).` };
      if (!(t.pricePerGbBdt < prev.pricePerGbBdt))
        return { ok: false, error: `Tier ${i + 1} rate must be cheaper than tier ${i} (bulk = discount).` };
    }
  }
  return { ok: true };
}

/** Find the tier covering qtyGb. Throws when uncovered (fail-closed). */
export function tierForQuantity(tiers: PlanTier[], qtyGb: number): PlanTier {
  const sorted = [...tiers].sort((a, b) => a.minGb - b.minGb);
  const hit = sorted.find(
    (t) => qtyGb >= t.minGb && (t.maxGb === null || qtyGb <= t.maxGb),
  );
  if (!hit) throw new Error(`No rate covers ${qtyGb} GB on this plan.`);
  return hit;
}

export interface TierQuote {
  quantityGb: number;
  unitRateBdt: number;
  subtotalBdt: number;
  floorPerGbBdt: number;
}

/** Quote a TIERED plan quantity. Throws BELOW_COST when rate is under buying cost. */
export function quoteTiered(
  tiers: PlanTier[],
  proxyType: string,
  qtyGb: number,
  costs: WholesaleCostMap,
  coefficients: CoefficientMap = POOL_COEFFICIENTS,
): TierQuote {
  if (!Number.isInteger(qtyGb) || qtyGb < 1 || qtyGb > MAX_TIERED_GB) {
    throw new Error(`Quantity must be an integer 1–${MAX_TIERED_GB} GB.`);
  }
  const tier = tierForQuantity(tiers, qtyGb);
  const floor = floorPerGb(proxyType, costs, coefficients);
  if (floor > 0 && tier.pricePerGbBdt < floor) {
    throw new Error(
      `BELOW_COST: tier rate ৳${tier.pricePerGbBdt}/GB is below buying cost ৳${floor}/GB for ${proxyType}.`,
    );
  }
  return {
    quantityGb: qtyGb,
    unitRateBdt: tier.pricePerGbBdt,
    subtotalBdt: qtyGb * tier.pricePerGbBdt,
    floorPerGbBdt: floor,
  };
}

/** Example totals for the admin preview (1, 3, 4, 10, 11, 50 GB where covered). */
export function tierExamples(tiers: PlanTier[]): { gb: number; total: number | null; rate: number | null }[] {
  return [1, 3, 4, 10, 11, 50].map((gb) => {
    try {
      const t = tierForQuantity(tiers, gb);
      return { gb, total: gb * t.pricePerGbBdt, rate: t.pricePerGbBdt };
    } catch {
      return { gb, total: null, rate: null };
    }
  });
}

/* ------------------------------------------------------------------ */
/* Discounts: best-of-one Offer vs Coupon (01 §14.1/§15.2, 02 §19)      */
/* ------------------------------------------------------------------ */

export interface DiscountQuote {
  basePriceBdt: number;
  offerDiscountBdt: number;
  couponDiscountBdt: number;
  finalDiscountAppliedBdt: number;
  discountSource: "OFFER" | "COUPON" | "NONE";
  couponCode: string | null;
  finalAmountBdt: number;
}

type DbLike = {
  collection: (name: string) => {
    findOne: (q: unknown) => Promise<Record<string, unknown> | null>;
  };
};

/** Percentage math rounds half-up to whole Taka (01 §14.1). */
function percentOff(base: number, pct: number, cap?: number): number {
  const raw = Math.round((base * pct) / 100);
  return cap !== undefined ? Math.min(raw, cap) : raw;
}

function inWindow(doc: Record<string, unknown>, now: Date): boolean {
  const from = doc.validFrom ? new Date(doc.validFrom as string) : null;
  const to = doc.validTo ? new Date(doc.validTo as string) : null;
  if (from && now < from) return false;
  if (to && now > to) return false;
  return true;
}

/**
 * Server-side discount computation. Throws on invalid coupon (fail-closed
 * with a human reason). Never trusts client amounts — only plan + code.
 */
export async function quoteDiscounts(
  db: DbLike,
  opts: {
    plan: { _id: unknown; retailPriceBdt: number };
    couponCode?: string;
    userId?: string;
  },
): Promise<DiscountQuote> {
  const base = Number(opts.plan.retailPriceBdt);
  const now = new Date();

  // Active offer bound to this plan (visible to everyone, no code needed).
  let offerDiscount = 0;
  try {
    const offer = await db.collection("offers").findOne({
      planId: String(opts.plan._id),
      status: "ACTIVE",
    });
    if (offer && inWindow(offer, now)) {
      offerDiscount =
        offer.discountType === "PERCENTAGE"
          ? percentOff(base, Number(offer.discountValue))
          : Math.max(0, Number(offer.discountValue) || 0);
    }
  } catch {
    offerDiscount = 0;
  }

  // Coupon path (advisory preview at submission; binding claim at approval).
  let couponDiscount = 0;
  let couponCode: string | null = null;
  const rawCode = String(opts.couponCode ?? "").trim().toUpperCase();
  if (rawCode) {
    const coupon = await db.collection("coupons").findOne({ code: rawCode });
    if (!coupon) throw new Error(`Coupon "${rawCode}" does not exist.`);
    if (coupon.status !== "ACTIVE") throw new Error(`Coupon "${rawCode}" is no longer active.`);
    if (!inWindow(coupon, now)) throw new Error(`Coupon "${rawCode}" is expired or not yet valid.`);
    if (coupon.planId && String(coupon.planId) !== String(opts.plan._id))
      throw new Error(`Coupon "${rawCode}" is only valid for a different plan.`);
    if (coupon.userId && opts.userId && String(coupon.userId) !== String(opts.userId))
      throw new Error(`Coupon "${rawCode}" is assigned to a different account.`);
    const used = Number(coupon.usageCount ?? 0);
    const limit = coupon.usageLimit !== undefined && coupon.usageLimit !== null ? Number(coupon.usageLimit) : null;
    if (limit !== null && used >= limit) throw new Error(`Coupon "${rawCode}" has been fully claimed.`);
    couponDiscount =
      coupon.type === "PERCENTAGE"
        ? percentOff(base, Number(coupon.value), coupon.maxDiscountAmount !== undefined ? Number(coupon.maxDiscountAmount) : undefined)
        : Math.max(0, Number(coupon.value) || 0);
    couponCode = rawCode;
  }

  // Best-of-one, tie goes to the offer (01 §15.2).
  const useCoupon = couponDiscount > offerDiscount;
  const applied = useCoupon ? couponDiscount : offerDiscount;
  return {
    basePriceBdt: base,
    offerDiscountBdt: offerDiscount,
    couponDiscountBdt: couponDiscount,
    finalDiscountAppliedBdt: applied,
    discountSource: applied <= 0 ? "NONE" : useCoupon ? "COUPON" : "OFFER",
    couponCode: useCoupon ? couponCode : null,
    finalAmountBdt: Math.max(0, base - applied),
  };
}
