"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import Link from "next/link";
import useSWR from "swr";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { notifySuccess } from "@/components/ui/ToastProvider";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserDashboard() {
  const { data: session, isPending } = authClient.useSession();
  const publicUserId = (session?.user as unknown as { publicUserId?: string } | undefined)?.publicUserId;

  useEffect(() => {
    if (!publicUserId) return;
    // Canonical key shared with email signup ("ref"); the legacy
    // "pending_ref" key is still honored once, then both are cleared only
    // on success so a failed POST stays retryable.
    const ref = sessionStorage.getItem("pending_ref") || localStorage.getItem("ref");
    if (!ref || sessionStorage.getItem("attribution_done") === ref) return;
    fetch("/api/affiliate/attribution", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ref }),
    }).then((res) => {
      if (!res.ok) return;
      sessionStorage.setItem("attribution_done", ref);
      sessionStorage.removeItem("pending_ref");
      localStorage.removeItem("ref");
    }).catch(() => {});
  }, [publicUserId]);

  useEffect(() => {
    if (!session?.user || !sessionStorage.getItem("oauth_welcome")) return;
    sessionStorage.removeItem("oauth_welcome");
    const u = session.user as unknown as { name?: string; createdAt?: string };
    const firstName = (u.name || "there").split(" ")[0];
    const fresh = u.createdAt ? Date.now() - new Date(u.createdAt).getTime() < 2 * 60 * 1000 : false;
    notifySuccess(fresh ? `Welcome to ProxyData, ${firstName}` : `Welcome back, ${firstName}`);
  }, [session?.user]);
  
  const { data: proxyData, isLoading: proxiesLoading } = useSWR("/api/proxy/accounts", fetcher, {
    dedupingInterval: 60000,
    revalidateOnFocus: false,
  });

  const { data: txData, isLoading: txLoading } = useSWR("/api/transactions", fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  
  const accounts = proxyData?.accounts || [];
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0]._id);
    } else if (selectedAccountId && !accounts.some((a: any) => a._id === selectedAccountId)) {
      // Revoked/deleted account: fall back so select value and card agree.
      setSelectedAccountId(accounts.length > 0 ? accounts[0]._id : null);
    }
  }, [accounts, selectedAccountId]);

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
  const transactions = txData?.transactions || [];

  const activeAccount = accounts.find((a: any) => a._id === selectedAccountId) || accounts[0];

  return (
    <CustomerShell activePath="/user/dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Proxy Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your active plans and generate credentials.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
            Active Plan / Provider
          </label>
          <select value={selectedAccountId || ""} onChange={(e) => setSelectedAccountId(e.target.value)} className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500 cursor-pointer">
            {accounts.length > 0 ? accounts.map((acc: any) => {
               const gbRemaining = (((acc.cachedRemainingBytes ?? acc.bandwidthBalanceBytes ?? 0)) / 1073741824).toFixed(2);
               return <option key={acc._id} value={acc._id}>{acc.proxyType?.toLowerCase() || "Datacenter"} (DataImpulse) - {gbRemaining} GB</option>;
            }) : (
               <option>No Active Plans</option>
            )}
          </select>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-black/40">
          <p className="text-zinc-500 text-sm font-semibold">You don't have any active proxies yet.</p>
          <Link href="/user/plans" className="text-cyan-500 text-sm font-bold mt-2 inline-block hover:text-cyan-400">Purchase a plan &rarr;</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Proxy Access Card */}
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden lg:col-span-1">
            <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest shadow-lg">
              {activeAccount?.proxyType?.toLowerCase() || "Datacenter"}
            </div>
            <h2 className="text-sm font-semibold text-white mb-4">Proxy Access</h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <label className="w-20 text-xs text-zinc-400">Login:</label>
                <div className="flex items-center bg-black/50 border border-white/5 rounded-md overflow-hidden flex-1">
                  <input type="text" value={activeAccount?.login || ""} readOnly className="flex-1 bg-transparent border-none text-zinc-400 font-mono text-xs px-3 py-2 outline-none w-full" />
                  <button className="px-3 py-2 text-cyan-500 bg-cyan-500/10 border-l border-white/5 font-semibold text-xs hover:bg-cyan-500/20 transition-colors" onClick={() => navigator.clipboard.writeText(activeAccount?.login || "")}>COPY</button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <label className="w-20 text-xs text-zinc-400">Password:</label>
                <div className="flex items-center bg-black/50 border border-white/5 rounded-md overflow-hidden flex-1">
                  <input type="text" value="********" readOnly className="flex-1 bg-transparent border-none text-zinc-400 font-mono text-xs px-3 py-2 outline-none w-full" />
                  <Link href="/user/proxy-config" className="px-3 py-2 text-cyan-500 bg-cyan-500/10 border-l border-white/5 font-semibold text-xs hover:bg-cyan-500/20 transition-colors flex items-center justify-center">REVEAL</Link>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <label className="w-20 text-xs text-zinc-400">Host:</label>
                <div className="flex items-center bg-black/50 border border-white/5 rounded-md overflow-hidden flex-1">
                  <input type="text" value="gw.dataimpulse.com" readOnly className="flex-1 bg-transparent border-none text-zinc-400 font-mono text-xs px-3 py-2 outline-none w-full" />
                  <button className="px-3 py-2 text-cyan-500 bg-cyan-500/10 border-l border-white/5 font-semibold text-xs hover:bg-cyan-500/20 transition-colors" onClick={() => navigator.clipboard.writeText("gw.dataimpulse.com")}>COPY</button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                <label className="w-20 text-xs text-zinc-400">Port:</label>
                <div className="flex items-center bg-black/50 border border-white/5 rounded-md overflow-hidden flex-1">
                  <input type="text" value="823" readOnly className="flex-1 bg-transparent border-none text-zinc-400 font-mono text-xs px-3 py-2 outline-none w-full" />
                  <button className="px-3 py-2 text-cyan-500 bg-cyan-500/10 border-l border-white/5 font-semibold text-xs hover:bg-cyan-500/20 transition-colors" onClick={() => navigator.clipboard.writeText("823")}>COPY</button>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Card */}
          <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between lg:col-span-1">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-white">Usage</h2>
                <div className="flex bg-black/50 border border-white/5 rounded-md p-0.5">
                  <button className="px-3 py-1 text-[10px] font-bold bg-zinc-700 text-white rounded shadow">GB</button>
                  <button className="px-3 py-1 text-[10px] font-medium text-zinc-400 hover:text-white rounded">MB</button>
                </div>
              </div>
              <div className="mt-6">
                <div className="text-xs text-zinc-400 mb-1">Traffic left:</div>
                <div className="text-4xl font-bold text-cyan-400">{(((activeAccount?.cachedRemainingBytes ?? activeAccount?.bandwidthBalanceBytes ?? 0)) / 1073741824).toFixed(2)} GB</div>
              </div>
            </div>
            <Link href="/user/plans" className="block w-full">
              <button className="w-full mt-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-cyan-500/20">
                Add GBs
              </button>
            </Link>
          </div>
        </div>
      )}
    </CustomerShell>
  );
}
