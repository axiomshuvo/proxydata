"use client";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyBox } from "@/components/ui/CopyBox";
import { Button } from "@heroui/react";

export default function AffiliatePage() {
  return (
    <CustomerShell activePath="/user/affiliate" showAffiliate={true}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Affiliate Program</h1>
        <p className="text-sm text-zinc-400 mt-1">Earn commissions by referring new users to ProxyData.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="!bg-zinc-900/60 p-6">
          <p className="text-zinc-400 text-sm font-medium">Total Earnings</p>
          <p className="text-3xl font-bold text-white mt-2">৳3,450</p>
        </GlassCard>
        <GlassCard className="!bg-zinc-900/60 p-6">
          <p className="text-zinc-400 text-sm font-medium">Available Balance</p>
          <p className="text-3xl font-bold text-white mt-2">৳950</p>
        </GlassCard>
        <GlassCard className="!bg-zinc-900/60 p-6">
          <p className="text-zinc-400 text-sm font-medium">Total Referrals</p>
          <p className="text-3xl font-bold text-white mt-2">12</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <GlassCard className="!bg-zinc-900/60 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Your Referral Link</h2>
          <p className="text-sm text-zinc-400 mb-4">Share this link to earn a percentage of every purchase your referrals make.</p>
          <CopyBox text="https://proxydata.com/user/sign-up?ref=PX-DEMO123" />
          
          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="text-sm font-bold text-white mb-3">Custom Code (Optional)</h3>
            <div className="flex gap-4">
              <input type="text" className="custom-input flex-1" defaultValue="YOUTUBE24" maxLength={8} />
              <Button className="bg-cyan-600 text-white font-bold px-6">Save</Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="!bg-zinc-900/60 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Request Payout</h2>
            <p className="text-sm text-zinc-400 mb-6">
              You can request a payout to your bKash or Nagad account once your available balance reaches ৳500.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Payout Method</label>
                <select className="custom-select">
                  <option>bKash (Personal)</option>
                  <option>Nagad (Personal)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Account Number</label>
                <input type="text" className="custom-input" defaultValue="01711223344" />
              </div>
            </div>
          </div>
          <Button className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/20">Withdraw ৳950</Button>
        </GlassCard>
      </div>

      <GlassCard className="!bg-zinc-900/60 p-6 overflow-x-auto">
        <h2 className="text-lg font-bold text-white mb-4">Referred Users</h2>
        <table className="w-full text-left text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">Date Registered</th>
              <th className="pb-3 font-semibold">User ID</th>
              <th className="pb-3 font-semibold text-right">Commissions Earned</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 text-zinc-400">Oct 10, 2026</td>
              <td className="py-4 font-mono text-white">PX-99A1B2</td>
              <td className="py-4 text-right font-bold text-emerald-400">৳150</td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 text-zinc-400">Oct 02, 2026</td>
              <td className="py-4 font-mono text-white">PX-7B4C89</td>
              <td className="py-4 text-right font-bold text-emerald-400">৳3,200</td>
            </tr>
            <tr className="hover:bg-white/5 transition-colors">
              <td className="py-4 text-zinc-400">Sep 15, 2026</td>
              <td className="py-4 font-mono text-white">PX-2D3E4F</td>
              <td className="py-4 text-right font-bold text-zinc-500">৳0</td>
            </tr>
          </tbody>
        </table>
      </GlassCard>
    </CustomerShell>
  );
}
