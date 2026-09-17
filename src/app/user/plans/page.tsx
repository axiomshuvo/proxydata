"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PlansPage() {
  const { data, isLoading } = useSWR("/api/plans", fetcher);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const plans = data?.plans || [];

  const handleBuy = async (planId: string) => {
    setBuyingId(planId);
    try {
      const res = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId })
      });
      const result = await res.json();
      setCheckoutResult(result);
    } catch (e) {
      console.error(e);
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

      {checkoutResult && (
        <GlassCard className="!bg-emerald-900/20 !border-emerald-500/30 p-6 rounded-3xl mb-8">
          <h3 className="text-emerald-400 font-bold mb-2">Order Initiated (PENDING)</h3>
          <p className="text-sm text-emerald-100/70 mb-4">
            Your transaction has been locked. Please send exactly <b>৳{checkoutResult.amount} BDT</b> via bKash.
          </p>
          <div className="text-xs text-zinc-400 font-mono">TxID: {checkoutResult.transactionId}</div>
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
                <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">{plan.proxyType}</span>
                <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
              </div>
              
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
