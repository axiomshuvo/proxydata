"use client";

import { useState } from "react";
import { Button } from "@heroui/react";

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

export function PlanExplorer({ plan, mode, buying, onBuy, ctaLabel, onCta }: PlanExplorerProps) {
  const coeff = plan.poolCoefficient ?? FALLBACK_COEFF[plan.proxyType] ?? 1;
  const stockCap =
    plan.stockKnown === false ? 1000 : Math.max(1, Math.floor((plan.upstreamGbAvailable ?? 0) / coeff));
  
  // Set reasonable max for slider, but input can go up to stockCap
  const sliderMax = Math.min(100, stockCap); 
  const [qtyRaw, setQtyRaw] = useState<string>("1");
  
  const parsedQty = parseInt(qtyRaw, 10);
  const safeQty = isNaN(parsedQty) ? 1 : Math.min(Math.max(1, parsedQty), stockCap);
  
  const quote = quoteForQty(plan, safeQty);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQtyRaw(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQtyRaw(e.target.value);
  };

  const handleShortcut = (val: number) => {
    setQtyRaw(val.toString());
  };

  return (
    <div className="flex flex-1 flex-col mt-2">
      <p className="text-sm text-zinc-400 mb-6 font-medium">{POOL_BLURBS[plan.proxyType] ?? ""}</p>

      {/* Calculator Section */}
      <div className="bg-black/30 border border-white/5 rounded-2xl p-5 mb-6">
        
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold text-zinc-400 tracking-wider">BANDWIDTH (GB)</label>
          <div className="relative">
            <input 
              type="number" 
              min={1} 
              max={stockCap} 
              value={qtyRaw}
              onChange={handleInputChange}
              className="w-20 bg-zinc-900 border border-white/10 text-white font-bold text-center rounded-lg py-1.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-500 pointer-events-none">GB</span>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="mb-6">
          <input 
            type="range" 
            min="1" 
            max={sliderMax} 
            value={safeQty} 
            onChange={handleSliderChange}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] font-bold text-zinc-600 mt-2">
            <span>1 GB</span>
            <span>{sliderMax} GB</span>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="flex gap-2 mb-6">
          {[1, 3, 5, 10].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => handleShortcut(val)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                safeQty === val 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glow-sm' 
                : 'bg-zinc-900 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {val} GB
            </button>
          ))}
        </div>

        {/* Pricing Display */}
        <div className="pt-5 border-t border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Estimated Total</span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white">৳{(quote?.total ?? 0).toLocaleString()}</span>
          </div>
          {quote && (
            <span className="text-xs font-semibold text-cyan-400 mt-1">
              (৳{quote.rate} / GB calculated rate)
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto" />
      {mode === "buy" ? (
        <Button 
          size="lg"
          className="w-full bg-cyan-600 text-white font-bold hover:bg-cyan-500 shadow-lg shadow-cyan-500/20"
          isDisabled={plan.outOfStock || buying || !quote} 
          onPress={() => quote && onBuy?.(safeQty)}
        >
          {buying ? "Processing..." : quote ? `Purchase ${safeQty} GB` : plan.outOfStock ? "Restocking" : "Quantity unavailable"}
        </Button>
      ) : (
        <Button 
          size="lg"
          className="w-full bg-white text-black font-bold hover:bg-zinc-200 shadow-lg"
          onPress={onCta}
        >
          {ctaLabel ?? "Get started"}
        </Button>
      )}
    </div>
  );
}
