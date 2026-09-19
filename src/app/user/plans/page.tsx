"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";
import { Check } from "@gravity-ui/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COEFF: Record<string, number> = { RESIDENTIAL: 1, DATACENTER: 0.5, MOBILE: 2, PREMIUM_RESIDENTIAL: 5 };

function quoteForQty(plan: any, qty: number): { rate: number; total: number } | null {
  const tiers = [...(plan.tiers ?? [])].sort((a: any, b: any) => a.minGb - b.minGb);
  const hit = tiers.find((t: any) => qty >= t.minGb && (t.maxGb === null || qty <= t.maxGb));
  if (!hit) return null;
  return { rate: hit.pricePerGbBdt, total: qty * hit.pricePerGbBdt };
}

function FlexBuyer({ plan, onBuy, buying }: { plan: any; onBuy: (qty: number) => void; buying: boolean }) {
  const coeff = plan.poolCoefficient ?? COEFF[plan.proxyType] ?? 1;
  const stockGb = plan.stockKnown === false ? 1000 : Math.floor((plan.upstreamGbAvailable ?? 0) / coeff);
  const max = Math.max(1, Math.min(100, stockGb || 100));
  const [qty, setQty] = useState(1);
  const safeQty = Math.max(1, qty);
  const quote = quoteForQty(plan, safeQty);
  
  return (
    <div className="flex-1 flex flex-col justify-between mt-2">
      
      {/* Slider & Input Group */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Data Amount</label>
          {quote && <span className="text-xs font-bold text-emerald-400">৳{quote.rate} / GB</span>}
        </div>
        
        <div className="mb-6 px-1">
          <input
            type="range"
            min="1"
            max={max}
            step="1"
            value={safeQty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer outline-none transition-all hover:bg-zinc-700
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-6
              [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:bg-cyan-400
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-glow-dot"
          />
        </div>

        <div className="flex items-center bg-zinc-950 rounded-xl border border-white/5 overflow-hidden">
          <button onClick={() => setQty(Math.max(1, safeQty - 1))} className="w-14 h-12 flex items-center justify-center bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-2xl font-light">−</button>
          <div className="flex-1 flex items-center justify-center border-x border-white/5 h-12 bg-black/20">
            <input type="number" min="1" value={safeQty} onChange={(e) => setQty(Number(e.target.value) || 1)} className="w-full bg-transparent text-center text-xl font-bold text-white focus:outline-none" />
            <span className="text-sm font-bold text-zinc-500 mr-4">GB</span>
          </div>
          <button onClick={() => setQty(safeQty + 1)} className="w-14 h-12 flex items-center justify-center bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-2xl font-light">+</button>
        </div>
      </div>
      
      {/* Soft Volume Discounts Line */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Volume Discounts</p>
        <div className="flex flex-wrap gap-2">
          {(plan.tiers ?? []).map((t: any, i: number) => (
            <span key={i} className="text-xs font-semibold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
              {t.minGb}{t.maxGb === null ? "+" : `-${t.maxGb}`}GB @ <span className="text-cyan-400">৳{t.pricePerGbBdt}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Massive Full-Width Purchase Button */}
      <Button 
        onPress={() => quote && onBuy(safeQty)} 
        isDisabled={plan.outOfStock || buying || !quote} 
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-14 rounded-xl text-lg shadow-glow-lg transition-all flex items-center justify-center gap-2"
      >
        {buying ? "Processing..." : quote ? `Pay ৳${(quote.total ?? 0).toLocaleString()}` : "Unavailable"}
      </Button>
    </div>
  );
}

export default function PlansPage() {
  // Same catalog policy as public /plans: 1 fetch/min/tab, no focus refetch.
  const [localCache] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("catalog_cache");
      if (stored) return JSON.parse(stored);
    }
    return null;
  });

  const customFetcher = async (url: string) => {
    const res = await fetch(url);
    const json = await res.json();
    if (typeof window !== "undefined") localStorage.setItem("catalog_cache", JSON.stringify(json));
    return json;
  };

  // Mount gate (same SSR/hydration rationale as public /plans): the
  // localStorage cache is browser-only, so force the loading state until
  // mount to keep server and first client render identical.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading: swrLoading } = useSWR("/api/plans", customFetcher, {
    fallbackData: localCache,
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });

  const isLoading = (swrLoading && !data) || !mounted;
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const plans = data?.plans || [];
  
  const providers = Array.from(new Set(plans.map((p: any) => p.providerName || p.providerId || "Other"))) as string[];
  
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0]);
    }
  }, [providers, selectedProvider]);

  const visiblePlans = plans.filter((p: any) => (p.providerName || p.providerId || "Other") === selectedProvider);


  const handleBuy = async (planId: string, quantityGb?: number) => {
    setBuyingId(planId);
    try {
      const res = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quantityGb !== undefined ? { planId, quantityGb } : { planId })
      });
      const result = await res.json();
      if (result.error) {
        notifyError("Order failed", result.error);
        setCheckoutResult({ error: result.error });
      } else {
        notifySuccess("Order placed", `Send ৳${result.amount} via bKash to complete.`);
        setCheckoutResult(result);
      }
    } catch (e) {
      console.error(e);
      notifyError("Order failed", "Could not reach the server.");
      alert("Error initiating checkout");
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <CustomerShell activePath="/user/plans">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Purchase Bandwidth</h1>
        <p className="text-sm text-zinc-400 mt-2">Instantly add data to your proxy pools.</p>
      </div>

      {checkoutResult && !checkoutResult.error && (
        <div className="!bg-emerald-900/20 !border-emerald-500/30 p-6 rounded-3xl mb-8">
          <h3 className="text-emerald-400 font-bold mb-2">Order Initiated (PENDING)</h3>
          <p className="text-sm text-emerald-100/70 mb-4">
            Your transaction has been locked. Please send exactly <b>৳{checkoutResult.amount} BDT</b> via bKash.
          </p>
          <div className="text-xs text-zinc-400 font-mono">TxID: {checkoutResult.transactionId}</div>
        </div>
      )}

      {checkoutResult?.error && (
        <div className="!bg-red-900/20 !border-red-500/30 p-6 rounded-3xl mb-8">
          <h3 className="text-red-400 font-bold mb-2">Order failed</h3>
          <p className="text-sm text-red-100/70">{checkoutResult.error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Mobile-first horizontal provider scroll */}
          {providers.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-6 mb-4 snap-x" style={{ scrollbarWidth: 'none' }}>
              {providers.map((prov) => (
                <button 
                  key={prov} 
                  onClick={() => setSelectedProvider(prov)}
                  className={`snap-start px-6 py-3.5 rounded-2xl font-black tracking-wide whitespace-nowrap transition-all flex items-center justify-center min-w-[150px] ${
                    selectedProvider === prov 
                      ? "bg-zinc-900 border-2 border-cyan-500 text-cyan-400 shadow-glow-lg" 
                      : "bg-zinc-900 border-2 border-white/5 text-zinc-500 hover:text-white hover:bg-zinc-800 hover:border-white/10"
                  }`}
                >
                  {prov.toLowerCase() === "dataimpulse" ? (
                    <img src="/providers/dataimpulse-light.webp" alt="DataImpulse" width={988} height={201} className={`h-6 w-auto transition-all ${selectedProvider !== prov ? "opacity-40 grayscale" : "drop-shadow-soft"}`} />
                  ) : (
                    prov
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visiblePlans.map((plan: any) => (
            <div key={plan._id} className="bg-zinc-900 border border-white/5 hover:border-cyan-500/30 p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col transition-all shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              {plan.outOfStock && (
                <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  Out of Stock
                </div>
              )}
              
              <div className="mb-4">
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">{plan.proxyType}{plan.providerName ? ` · ${plan.providerName}` : ""}</span>
                <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                {plan.pricingMode === "TIERED" && plan.fromRateBdt !== null && (
                  <p className="text-xs text-zinc-500 mt-1">from ৳{plan.fromRateBdt}/GB · you pick the amount</p>
                )}
              </div>

              {plan.pricingMode === "TIERED" && (plan.tiers ?? []).length > 0 ? (
                <FlexBuyer plan={plan} buying={buyingId === plan._id} onBuy={(qty) => handleBuy(plan._id, qty)} />
              ) : (
                <>
                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">৳{plan.retailPriceBdt}</span>
                    <span className="text-sm font-semibold text-zinc-500">/ {plan.bandwidthGb} GB</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check width={16} className="text-cyan-500" />
                      Access to {plan.providerId === 'dataimpulse' ? 'DataImpulse' : 'NetNut'} pool
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check width={16} className="text-cyan-500" />
                      HTTP(S) & SOCKS5 Support
                    </li>
                  </ul>

                  <Button
                    onPress={() => handleBuy(plan._id)}
                    isDisabled={plan.outOfStock || buyingId === plan._id}
                    className="w-full bg-white text-black font-bold hover:bg-zinc-200 rounded-xl"
                  >
                    {buyingId === plan._id ? "Processing..." : "Buy Now"}
                  </Button>
                </>
              )}
            </div>
          ))}
          
          {visiblePlans.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <p className="text-zinc-500">No active plans available at the moment.</p>
            </div>
          )}
        </div>
        </div>
      )}
    </CustomerShell>
  );
}
