"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import useSWR from "swr";
import { useState } from "react";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

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
  const max = Math.max(1, Math.min(1000, stockGb || 1000));
  const [qty, setQty] = useState(1);
  const safeQty = Math.min(Math.max(1, qty), max);
  const quote = quoteForQty(plan, safeQty);
  return (
    <div className="space-y-4 mb-6 flex-1">
      <div className="rounded-2xl bg-black/40 border border-white/5 p-3">
        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Volume rates</div>
        {(plan.tiers ?? []).map((t: any, i: number) => (
          <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0">
            <span className="text-zinc-400 font-semibold">{t.minGb}–{t.maxGb === null ? "∞" : t.maxGb} GB</span>
            <span className="text-white font-bold">৳{t.pricePerGbBdt}/GB</span>
          </div>
        ))}
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-zinc-400">AMOUNT (GB)</label>
          {quote && <span className="text-[11px] font-bold text-cyan-400">৳{quote.rate}/GB · Bulk rate</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQty(Math.max(1, safeQty - 1))}
            className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max={max}
            value={safeQty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            className="custom-input text-center font-bold"
          />
          <button
            onClick={() => setQty(Math.min(max, safeQty + 1))}
            className="w-10 h-10 rounded-xl bg-white/10 text-white font-bold text-lg hover:bg-white/20"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-white">৳{(quote?.total ?? 0).toLocaleString()}</span>
        <span className="text-sm font-semibold text-zinc-500">/ {safeQty} GB</span>
      </div>
      <Button
        onPress={() => quote && onBuy(safeQty)}
        isDisabled={plan.outOfStock || buying || !quote}
        className="w-full bg-white text-black font-bold hover:bg-zinc-200 rounded-xl"
      >
        {buying ? "Processing..." : quote ? `Buy ${safeQty} GB` : "Quantity unavailable"}
      </Button>
    </div>
  );
}

export default function PlansPage() {
  // Same catalog policy as public /plans: 1 fetch/min/tab, no focus refetch.
  const { data, isLoading } = useSWR("/api/plans", fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const plans = data?.plans || [];

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
        <GlassCard className="!bg-emerald-900/20 !border-emerald-500/30 p-6 rounded-3xl mb-8">
          <h3 className="text-emerald-400 font-bold mb-2">Order Initiated (PENDING)</h3>
          <p className="text-sm text-emerald-100/70 mb-4">
            Your transaction has been locked. Please send exactly <b>৳{checkoutResult.amount} BDT</b> via bKash.
          </p>
          <div className="text-xs text-zinc-400 font-mono">TxID: {checkoutResult.transactionId}</div>
        </GlassCard>
      )}

      {checkoutResult?.error && (
        <GlassCard className="!bg-red-900/20 !border-red-500/30 p-6 rounded-3xl mb-8">
          <h3 className="text-red-400 font-bold mb-2">Order failed</h3>
          <p className="text-sm text-red-100/70">{checkoutResult.error}</p>
        </GlassCard>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <GlassCard key={plan._id} className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col">
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
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      Access to {plan.providerId === 'dataimpulse' ? 'DataImpulse' : 'NetNut'} pool
                    </li>
                    <li className="flex items-center gap-3 text-sm text-zinc-300">
                      <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
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
            </GlassCard>
          ))}
          
          {plans.length === 0 && (
            <div className="col-span-3 text-center py-12">
              <p className="text-zinc-500">No active plans available at the moment.</p>
            </div>
          )}
        </div>
      )}
    </CustomerShell>
  );
}
