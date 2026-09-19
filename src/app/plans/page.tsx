"use client";

import { useRouter } from "next/navigation";
import { Button, Spinner, Chip } from "@heroui/react";
import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PlanExplorer } from "@/components/ui/PlanExplorer";
import { Check, ShieldCheck } from "@gravity-ui/icons";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PublicPlansPage() {
  const router = useRouter();

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

  // Mount gate: localStorage cache exists only in the browser, so the
  // server always renders the loading state. Without this, SSR emits the
  // empty/restocking UI while hydration wants the spinner → hydration
  // bailout (full client re-render, TTI/FID hit on every catalog visit).
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
  
  const allPlans = (data?.plans || []).filter((p: any) => !p.outOfStock);
  
  // Group plans by provider
  const plansByProvider = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allPlans.forEach((plan: any) => {
      const pid = plan.providerId || "unknown";
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(plan);
    });
    return groups;
  }, [allPlans]);

  const providers = Object.keys(plansByProvider);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <Navbar />

      <main className="flex-1">
        {/* CATALOG HEADER */}
        <section className="border-b border-white/5 bg-zinc-950 pt-16 pb-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Proxy <span className="text-cyan-400">Catalog</span>
            </h1>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Select your preferred provider below. We offer flexible Pay-as-You-Go bandwidth and Static IP bundles.
            </p>
          </div>
        </section>

        {/* PRICING CATALOG (GROUPED BY PROVIDER) */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 relative min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner color="current" size="lg" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white mb-2">No plans available</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">We are currently restocking our entire network. Please check back later.</p>
            </div>
          ) : (
            <div className="space-y-24">
              {providers.map((providerId) => (
                <div key={providerId} className="flex flex-col">
                  {/* Premium Provider Header - Centered */}
                  <div className="flex flex-col items-center justify-center gap-4 mb-10 pb-8 border-b border-white/10 relative text-center">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-cyan-500/5 blur-[50px] pointer-events-none" />
                    
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      {providerId.toLowerCase() === "dataimpulse" ? (
                        <div className="flex items-center gap-3">
                          <img src="/providers/dataimpulse-light.webp" alt="DataImpulse" width={988} height={201} className="h-10 sm:h-14 w-auto drop-shadow-soft" />
                          <span className="text-2xl sm:text-4xl font-light text-zinc-600 tracking-widest uppercase hidden sm:block">| Network</span>
                        </div>
                      ) : (
                        <h2 className="text-4xl font-black text-white uppercase tracking-wider">{providerId} <span className="text-zinc-500 font-light">Network</span></h2>
                      )}

                      <div className="relative z-10 flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 px-4 py-2 rounded-full shadow-amber-glow-lg">
                        <ShieldCheck width={16} className="text-amber-400 drop-shadow-amber-dot" />
                        <span className="text-[10px] sm:text-xs font-bold text-amber-400 tracking-widest uppercase mt-0.5">Authorized Reseller</span>
                      </div>
                    </div>
                  </div>

                  {/* Provider's Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plansByProvider[providerId].map((plan: any) => (
                      <div key={plan._id} className="relative group rounded-3xl bg-zinc-900/40 border border-white/5 p-6 sm:p-8 overflow-hidden backdrop-blur-xl hover:border-cyan-500/30 transition-colors">
                        
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-purple-500/0 group-hover:from-cyan-500/5 group-hover:to-purple-500/5 transition-all pointer-events-none" />

                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <Chip size="sm" variant="soft" className="mb-3 bg-zinc-800 text-zinc-300 font-bold uppercase tracking-wider text-[10px]">
                              {plan.proxyType} • {plan.pricingMode === "TIERED" ? "PAYG" : "STATIC"}
                            </Chip>
                            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                          </div>
                        </div>

                        {plan.pricingMode === "TIERED" ? (
                          <div className="mt-4">
                            <PlanExplorer
                              plan={plan}
                              mode="explore"
                              ctaLabel="Get started"
                              onCta={() => router.push("/user/sign-up")}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col h-full">
                            <div className="mt-2 flex items-end gap-2">
                              <span className="text-4xl font-extrabold text-cyan-400">৳{plan.retailPriceBdt}</span>
                              <span className="text-sm font-semibold text-zinc-500 mb-1">/ {plan.bandwidthGb} GB</span>
                            </div>
                            
                            <div className="mt-8 space-y-4 flex-1">
                              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                                <Check width={18} className="text-cyan-400 shrink-0" />
                                <span>Instant Allocation to Dashboard</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                                <Check width={18} className="text-cyan-400 shrink-0" />
                                <span>SOCKS5 / HTTP Support</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-zinc-300 font-medium">
                                <Check width={18} className="text-cyan-400 shrink-0" />
                                <span>Advanced Country & City Targeting</span>
                              </div>
                            </div>

                            <Button 
                              size="lg" 
                              className="w-full mt-8 bg-white text-black font-bold hover:bg-zinc-200"
                              onPress={() => router.push("/user/sign-up")}
                            >
                              Buy Now
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
