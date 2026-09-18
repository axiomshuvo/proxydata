"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Spinner } from "@heroui/react";
import useSWR from "swr";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PlanExplorer } from "@/components/ui/PlanExplorer";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const POOL_BLURBS: Record<string, string> = {
  RESIDENTIAL: "Real household IPs. Best for everyday browsing, social and e-commerce.",
  MOBILE: "Carrier-grade mobile IPs. Highest trust for strict targets.",
  DATACENTER: "Blazing fast shared IPs. Best value for high-volume tasks.",
  PREMIUM_RESIDENTIAL: "Top-tier residential pool with all targeting filters included.",
};

export default function PublicPlansPage() {
  const router = useRouter();
  // Catalog barely moves (plans change ~1–2×/month; admin saves purge the
  // server cache instantly): one fetch/min/tab, no refetch on window focus.
  const { data, isLoading } = useSWR("/api/plans", fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });
  const plans = (data?.plans || []).filter((p: any) => !p.outOfStock);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="hero-glow" />
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">Proxy bandwidth, simplified</p>
            <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight">
              Pay per GB. <span className="text-cyan-400">Nothing else.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base text-zinc-400">
              Pick a pool, grab any amount from 1 GB up. The more you take, the cheaper each GB gets. Prices in Taka — no subscriptions, no traps.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="w-full sm:w-auto" onPress={() => router.push("/user/sign-up")}>
                Create account
              </Button>
              <Button className="w-full sm:w-auto" variant="secondary" onPress={() => router.push("/user/sign-in")}>
                Sign in to buy
              </Button>
            </div>
          </div>
        </section>

        {/* Pool cards */}
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="sm" />
            </div>
          ) : plans.length === 0 ? (
            <Card className="p-10 text-center">
              <Card.Header>
                <Card.Description>Plans are restocking right now — check back in a bit.</Card.Description>
              </Card.Header>
              <Card.Footer className="justify-center">
                <Button onPress={() => router.push("/user/sign-up")}>Notify me — create account</Button>
              </Card.Footer>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {plans.map((plan: any) => (
                <Card key={plan._id} className="p-6 sm:p-8">
                  <Card.Content className="flex flex-1 flex-col">
                    {plan.pricingMode === "TIERED" && (plan.tiers ?? []).length > 0 ? (
                      <PlanExplorer
                        plan={plan}
                        mode="explore"
                        ctaLabel="Get started"
                        onCta={() => router.push("/user/sign-up")}
                      />
                    ) : (
                      <>
                        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider">
                          {plan.providerName ?? plan.providerId} · {plan.proxyType}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1">{plan.name}</h3>
                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-3xl font-extrabold">৳{plan.retailPriceBdt}</span>
                          <span className="text-sm font-semibold text-zinc-500">/ {plan.bandwidthGb} GB</span>
                        </div>

                        <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                          <li>✓ HTTP(S) & SOCKS5 support</li>
                          <li>✓ Country targeting included</li>
                          <li>✓ Sticky & rotating sessions</li>
                        </ul>
                        <div className="flex-1" />
                        <Button fullWidth className="mt-5" onPress={() => router.push("/user/sign-up")}>
                          Get started
                        </Button>
                      </>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-white/5 bg-white/[.02]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              ["1. Create account", "30 seconds. Email or Google."],
              ["2. Pay with bKash / Nagad", "Manual verify, approved fast."],
              ["3. Get credentials", "Working proxy strings in minutes."],
            ].map(([t, d]) => (
              <div key={t}>
                <h4 className="font-bold">{t}</h4>
                <p className="text-sm text-zinc-400 mt-1">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Gift code teaser */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Card className="p-6 sm:p-8 text-center border-cyan-500/20">
            <Card.Header className="items-center">
              <Card.Title>Have a gift code?</Card.Title>
              <Card.Description>Sign in and redeem it for free bandwidth — no payment needed.</Card.Description>
            </Card.Header>
            <Card.Footer className="justify-center">
              <Button onPress={() => router.push("/user/sign-in")}>Sign in to redeem</Button>
            </Card.Footer>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
