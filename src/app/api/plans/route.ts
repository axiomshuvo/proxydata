import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import clientPromise from "@/lib/db/mongodb";
import { getCachedResellerBalance } from "@/lib/dataimpulse/client";
import { loadProviderBilling } from "@/lib/pricing";

// Slow-moving catalog data (plans change ~1–2×/month): cached 5 min and
// purged instantly by tag whenever admin saves a plan/provider.
// Stock numbers are NOT in here — they resolve per-request below.
interface CatalogPlan {
  _id: unknown;
  providerId?: string;
  proxyType: string;
  pricingMode?: string;
  bandwidthGb?: number;
  tiers?: { minGb: number; maxGb: number | null; pricePerGbBdt: number }[];
  [key: string]: unknown;
}

const getCatalogBase = unstable_cache(
  async () => {
    const client = await clientPromise;
    const db = client.db();
    const plans = (await db.collection("plans").find({ status: "ACTIVE" }).toArray()) as unknown as CatalogPlan[];
    const billingCache = new Map<string, Awaited<ReturnType<typeof loadProviderBilling>>>();
    const billingOf = async (providerId: string) => {
      const key = providerId ?? "dataimpulse";
      if (!billingCache.has(key)) billingCache.set(key, await loadProviderBilling(db, key));
      return billingCache.get(key)!;
    };
    const items: { plan: CatalogPlan; billing: Awaited<ReturnType<typeof loadProviderBilling>> }[] = [];
    for (const plan of plans) {
      const billing = await billingOf(plan.providerId ?? "dataimpulse");
      if (billing.status !== "ACTIVE") continue; // provider paused/hidden
      items.push({ plan: { ...plan, _id: String(plan._id) }, billing });
    }
    return items;
  },
  ["catalog-base"],
  { revalidate: 3600, tags: ["plans"] },
);

export async function GET() {
  try {
    const items = await getCatalogBase();

    // 2. Reseller stock: 60s shared cache (single-flight). UNKNOWN on
    // upstream failure — never masquerade that as "empty".
    let upstreamGbAvailable = 0;
    let stockKnown = true;
    try {
      ({ balanceGb: upstreamGbAvailable } = await getCachedResellerBalance());
    } catch (e) {
      console.warn("Upstream balance unreachable — stock treated as unknown, not empty.", e);
      stockKnown = false;
    }

    // 3. Flag out-of-stock plans — coefficient-adjusted (01 §10.2):
    // requestedGb × poolCoefficient × 1x > resellerBalance → Restocking.
    // TIERED plans sell any 1..1000 GB: out-of-stock only when even 1 GB
    // (× coefficient) is unaffordable; the client caps the stepper at
    // floor(balance / coefficient) via upstreamGbAvailable.
    const catalog: Record<string, unknown>[] = [];
    for (const { plan, billing } of items) {
      const coeff = billing.coefficients[plan.proxyType] ?? 1;
      const known = stockKnown && plan.providerId !== "dataimpulse" ? false : stockKnown;
      const minGb = plan.pricingMode === "TIERED" ? 1 : (plan.bandwidthGb ?? 1);
      const isOutOfStock = known && minGb * coeff > upstreamGbAvailable;
      const tiers = (plan.tiers ?? []).map((t) => ({
        minGb: t.minGb,
        maxGb: t.maxGb,
        pricePerGbBdt: t.pricePerGbBdt,
      }));
      const fromRate = plan.pricingMode === "TIERED" && tiers.length > 0
        ? Math.min(...tiers.map((t) => t.pricePerGbBdt))
        : null;

      catalog.push({
        ...plan,
        outOfStock: isOutOfStock,
        stockKnown: known,
        providerName: billing.name,
        poolCoefficient: coeff,
        tiers,
        fromRateBdt: fromRate,
        // Optional: you can hide the exact upstreamGbAvailable from the user, just send boolean
        upstreamGbAvailable,
      });
    }

    return NextResponse.json(
      { plans: catalog },
      {
        headers: {
          // Catalog is display data: browsers/CDN may reuse 60s, serve stale
          // up to 5 min while revalidating. Price truth is enforced at
          // submission + approval, never from this payload.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/plans Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
