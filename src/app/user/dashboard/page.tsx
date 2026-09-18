"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import Link from "next/link";
import useSWR from "swr";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

// Standard SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserDashboard() {
  // 1. Fetch Live User Session
  const { data: session, isPending } = authClient.useSession();

  // Bind a pending referral once (OAuth round-trip stores it pre-redirect).
  useEffect(() => {
    const ref = sessionStorage.getItem("pending_ref");
    if (!ref || !session?.user) return;
    fetch("/api/affiliate/attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).finally(() => sessionStorage.removeItem("pending_ref"));
  }, [session?.user]);
  
  // 2. Fetch Live Proxy Accounts — balances are display data: share one
  // fetch/min/tab, no storm on window focus.
  const { data: proxyData, isLoading: proxiesLoading } = useSWR("/api/proxy/accounts", fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });

  // 3. Fetch Live Transactions
  const { data: txData, isLoading: txLoading } = useSWR("/api/transactions", fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });

  // Loading state
  if (isPending || proxiesLoading || txLoading) {
    return (
      <CustomerShell activePath="/user/dashboard">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </CustomerShell>
    );
  }

  const user = session?.user;
  const accounts = proxyData?.accounts || [];
  const transactions = txData?.transactions || [];

  // Calculate live stats — spec fields first, legacy rows fall back (02 §9).
  const bytesOf = (acc: any) =>
    acc.cachedRemainingBytes ?? acc.bandwidthBalanceBytes ?? 0;
  const totalGb = accounts.reduce((acc: number, curr: any) => acc + bytesOf(curr), 0) / 1073741824;
  const activeProxiesCount = accounts.length;
  
  // Get latest 5 transactions for the table
  const recentTx = transactions.slice(0, 5);

  return (
    <CustomerShell activePath="/user/dashboard">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome back, {user?.name || "User"}</h1>
          <p className="text-sm text-zinc-400 mt-2">Here is a summary of your proxy usage and active plans.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/user/plans">
            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl px-6">
              Buy Bandwidth
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Bandwidth Available</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{totalGb.toFixed(2)}</span>
              <span className="text-sm font-bold text-cyan-400">GB</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-500">
              <span>Across {activeProxiesCount} Active Pools</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Spent</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">
                ৳{transactions.reduce((sum: number, tx: any) => sum + (tx.status === "ACTIVE" ? (tx.finalAmountBdt ?? tx.amountTaka ?? 0) : 0), 0)}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active Subscription</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Active Proxies</h2>
              <Link href="/user/proxy-config" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">Open Generator &rarr;</Link>
            </div>
            
            <div className="space-y-4">
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-zinc-500 text-sm font-semibold">You don't have any active proxies yet.</p>
                  <Link href="/user/plans" className="text-cyan-500 text-sm font-bold mt-2 inline-block">Purchase a plan</Link>
                </div>
              ) : (
                accounts.map((acc: any) => (
                  <div key={acc._id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white capitalize">{acc.proxyType?.toLowerCase() || "Residential"} Network</h4>
                        <p className="text-xs font-semibold text-emerald-400">Active</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-white">{(((acc.cachedRemainingBytes ?? acc.bandwidthBalanceBytes ?? 0)) / 1073741824).toFixed(2)} GB</div>
                      <div className="text-xs font-semibold text-zinc-500">Remaining</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            </div>
            <div className="space-y-4">
              {recentTx.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">No transactions found.</p>
              ) : (
                recentTx.map((tx: any) => (
                  <div key={tx._id} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{tx.planSnapshot?.name || tx.planNameSnapshot || "Purchase"}</h4>
                      <p className="text-[10px] font-semibold text-zinc-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">৳{tx.finalAmountBdt ?? tx.amountTaka}</div>
                      <div className={`text-[10px] font-bold ${
                        tx.status === 'ACTIVE' ? 'text-emerald-400' :
                        tx.status === 'PENDING' ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </CustomerShell>
  );
}
