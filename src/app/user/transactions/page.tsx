"use client";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";

export default function TransactionsPage() {
  return (
    <CustomerShell activePath="/user/transactions">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Billing History</h1>
        <p className="text-sm text-zinc-400 mt-2">View your past purchases, active coupons, and balance adjustments.</p>
      </div>

      <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 overflow-x-auto rounded-3xl">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Transaction ID</th>
              <th className="pb-3 font-semibold">Description</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 text-zinc-400">Oct 12, 2026</td>
              <td className="py-4 font-mono text-cyan-400">9F8A7B6C</td>
              <td className="py-4">
                <div className="font-bold text-white">Datacenter (5 GB)</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Purchased via bKash</div>
              </td>
              <td className="py-4">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded">APPROVED</span>
              </td>
              <td className="py-4 text-right font-bold text-white">৳750</td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 text-zinc-400">Oct 05, 2026</td>
              <td className="py-4 font-mono text-cyan-400">RD-WELCOME50</td>
              <td className="py-4">
                <div className="font-bold text-white">Promo Code Redeemed</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Applied to Residential Plan</div>
              </td>
              <td className="py-4">
                <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold rounded">CLAIMED</span>
              </td>
              <td className="py-4 text-right font-bold text-emerald-400">- ৳500</td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors opacity-70">
              <td className="py-4 text-zinc-400">Sep 28, 2026</td>
              <td className="py-4 font-mono text-zinc-500">2A3B4C5D</td>
              <td className="py-4">
                <div className="font-bold text-zinc-300">Residential (1 GB)</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Purchased via Nagad</div>
              </td>
              <td className="py-4">
                <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded">REJECTED</span>
              </td>
              <td className="py-4 text-right font-bold text-zinc-400">৳500</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="py-4 text-zinc-400">Sep 01, 2026</td>
              <td className="py-4 font-mono text-cyan-400">ADJ-88F92</td>
              <td className="py-4">
                <div className="font-bold text-amber-300">Admin Adjustment</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Support Ticket #1042</div>
              </td>
              <td className="py-4">
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded">CREDITED</span>
              </td>
              <td className="py-4 text-right font-bold text-emerald-400">+ 1.5 GB</td>
            </tr>
          </tbody>
        </table>
        
        {/* Pagination Mock */}
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <button className="px-3 py-1 text-sm text-zinc-500 hover:text-white disabled:opacity-50" disabled>Previous</button>
          <span className="text-xs text-zinc-500">Page 1 of 1</span>
          <button className="px-3 py-1 text-sm text-zinc-400 hover:text-white">Next</button>
        </div>
      </GlassCard>
    </CustomerShell>
  );
}
