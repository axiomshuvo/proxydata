"use client";

import { useState } from "react";
import { Button, Label, Slider } from "@heroui/react";

export const POOL_BLURBS: Record<string, string> = {
  RESIDENTIAL: "Real household IPs. Best for everyday browsing, social and e-commerce.",
  MOBILE: "Carrier-grade mobile IPs. Highest trust for strict targets.",
  DATACENTER: "Blazing fast shared IPs. Best value for high-volume tasks.",
  PREMIUM_RESIDENTIAL: "Top-tier residential pool with all targeting filters included.",
};

const FALLBACK_COEFF: Record<string, number> = {
  RESIDENTIAL: 1,
  DATACENTER: 0.5,
  MOBILE: 2,
  PREMIUM_RESIDENTIAL: 5,
};

function quoteForQty(plan: any, qty: number): { rate: number; total: number } | null {
  const tiers = [...(plan.tiers ?? [])].sort((a: any, b: any) => a.minGb - b.minGb);
  const hit = tiers.find((t: any) => qty >= t.minGb && (t.maxGb === null || qty <= t.maxGb));
  if (!hit) return null;
  return { rate: hit.pricePerGbBdt, total: qty * hit.pricePerGbBdt };
}

interface PlanExplorerProps {
  plan: any;
  /** explore = marketing CTA; buy = quantity purchase button */
  mode: "explore" | "buy";
  buying?: boolean;
  onBuy?: (qty: number) => void;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * One interactive plan card shared by public /plans and /user/plans:
 * provider + pool header, tier table, smooth GB slider with live pricing.
 */
export function PlanExplorer({ plan, mode, buying, onBuy, ctaLabel, onCta }: PlanExplorerProps) {
  const coeff = plan.poolCoefficient ?? FALLBACK_COEFF[plan.proxyType] ?? 1;
  const stockCap =
    plan.stockKnown === false ? 1000 : Math.max(1, Math.floor((plan.upstreamGbAvailable ?? 0) / coeff));
  const sliderMax = Math.max(1, Math.min(stockCap, 1000));
  const [qty, setQty] = useState(1);
  const safeQty = Math.min(Math.max(1, qty), sliderMax);
  const quote = quoteForQty(plan, safeQty);

  return (
    <div className="flex flex-1 flex-col">
      <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">
        {plan.providerName ?? plan.providerId} · {plan.proxyType}
      </span>
      <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
      <p className="text-sm text-zinc-400 mt-2">{POOL_BLURBS[plan.proxyType] ?? ""}</p>

      <div className="mt-4 rounded-2xl bg-black/40 border border-white/5 p-3">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Volume rates — tap a row</div>
        {(plan.tiers ?? []).map((t: any, i: number) => {
          const active = quote && safeQty >= t.minGb && (t.maxGb === null || safeQty <= t.maxGb);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setQty(t.minGb)}
              className={`flex w-full justify-between text-sm py-1.5 border-b border-white/5 last:border-0 rounded px-1 ${active ? "bg-cyan-500/10" : ""}`}
            >
              <span className={`font-semibold ${active ? "text-cyan-300" : "text-zinc-400"}`}>
                {t.minGb}–{t.maxGb === null ? "∞" : t.maxGb} GB
              </span>
              <span className={`font-bold ${active ? "text-cyan-300" : "text-white"}`}>
                ৳{t.pricePerGbBdt}<span className="text-zinc-500 font-semibold">/GB</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs font-bold text-zinc-400">AMOUNT: {safeQty} GB</Label>
          {quote && <span className="text-[11px] font-bold text-cyan-400">৳{quote.rate}/GB · Bulk rate</span>}
        </div>
        <Slider
          aria-label="Bandwidth amount in GB"
          minValue={1}
          maxValue={sliderMax}
          step={1}
          value={safeQty}
          onChange={(v) => setQty(typeof v === "number" ? v : v[0] ?? 1)}
        >
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">৳{(quote?.total ?? 0).toLocaleString()}</span>
          <span className="text-sm font-semibold text-zinc-500">/ {safeQty} GB</span>
        </div>
      </div>

      <div className="mt-5 flex-1" />
      {mode === "buy" ? (
        <Button fullWidth isDisabled={plan.outOfStock || buying || !quote} onPress={() => quote && onBuy?.(safeQty)}>
          {buying ? "Processing..." : quote ? `Buy ${safeQty} GB` : plan.outOfStock ? "Restocking" : "Quantity unavailable"}
        </Button>
      ) : (
        <Button fullWidth onPress={onCta}>
          {ctaLabel ?? "Get started"}
        </Button>
      )}
    </div>
  );
}
