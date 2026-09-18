"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { siteContent } from "@/lib/content";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    setClaiming(true);
    setResult(null);
    try {
      const res = await fetch("/api/transactions/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Redemption failed.");
      setResult({ ok: true, message: data.message || `Code redeemed — ${data.allocatedGb ?? ""} GB credited.`.trim() });
      notifySuccess("Code redeemed", `${data.allocatedGb ?? ""} GB credited to your proxy.`.trim());
      setCode("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Redemption failed.";
      setResult({ ok: false, message });
      notifyError("Redemption failed", message);
    } finally {
      setClaiming(false);
    }
  };
  return (
    <CustomerShell activePath="/user/redeem">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Redeem Rewards</h1>
        <p className="text-sm text-zinc-400 mt-2">Enter your promo code to claim bandwidth or account discounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl">
        
        {/* Main Redeem Column (Left) */}
        <div className="lg:col-span-7 space-y-8">
          <GlassCard className="w-full !bg-zinc-900/60 !border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center gap-5 mb-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                  <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Apply Promo Code</h2>
                <p className="text-sm text-zinc-400 mt-1">Gift cards, partner codes & discounts</p>
              </div>
            </div>

            <form className="relative z-10 space-y-5" onSubmit={handleClaim}>
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 rounded-xl px-4 py-5 text-center text-xl font-mono uppercase tracking-[0.2em] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
                  placeholder="ENTER-CODE-HERE"
                  maxLength={20}
                />
              </div>

              {result && (
                <p className={`text-sm font-semibold rounded-xl p-3 ${result.ok ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-red-400 bg-red-500/10 border border-red-500/20"}`}>
                  {result.message}
                </p>
              )}

              <Button
                type="submit"
                isDisabled={claiming || code.trim().length === 0}
                isPending={claiming}
                className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all text-base"
              >
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Claiming…" : "Claim Reward"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <span className="text-yellow-500 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
                <p className="text-xs text-yellow-500/90 leading-relaxed">
                  Coupons are strictly one-time use per account. Fraudulent redemption will result in immediate account suspension.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Supplementary Info Column (Right) */}
        <div className="lg:col-span-5 space-y-6">
          
          

          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Need a Promo Code?</h3>
              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                Join our Telegram channel for weekly drops and giveaways.
              </p>
              <div className="flex flex-col gap-3">
                <Link href={siteContent.company.telegramUrl} target="_blank">
                  <Button className="w-full bg-[#2AABEE]/10 text-[#2AABEE] hover:bg-[#2AABEE]/20 font-bold text-xs">
                    Join Telegram
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
          
        </div>
      </div>
    </CustomerShell>
  );
}
