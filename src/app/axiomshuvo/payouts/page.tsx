"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AdminPayoutsPage() {
  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/payouts" title="Affiliate Payouts">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <GlassCard className="!bg-zinc-900/60 p-6 border-l-4 !border-l-amber-500">
          <p className="text-zinc-400 text-sm font-medium">Pending Payouts</p>
          <p className="text-3xl font-bold text-white mt-2">৳4,250</p>
        </GlassCard>
        <GlassCard className="!bg-zinc-900/60 p-6">
          <p className="text-zinc-400 text-sm font-medium">Total Paid (All Time)</p>
          <p className="text-3xl font-bold text-white mt-2">৳124,500</p>
        </GlassCard>
      </div>

      <GlassCard className="!bg-zinc-900/60 p-6 overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">Affiliate User</th>
              <th className="pb-3 font-semibold">Method</th>
              <th className="pb-3 font-semibold">Account Details</th>
              <th className="pb-3 font-semibold">Amount</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4">
                <div className="font-bold text-white">influencer@youtube.com</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-0.5">YOUTUBE24</div>
              </td>
              <td className="py-4 text-pink-400 font-bold">bKash</td>
              <td className="py-4 font-mono text-white">01711223344</td>
              <td className="py-4 text-emerald-400 font-bold">৳3,300</td>
              <td className="py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded hover:bg-emerald-500/30 transition-colors">Mark Paid</button>
                  <button className="px-3 py-1.5 bg-red-500/20 text-red-400 font-bold text-xs rounded hover:bg-red-500/30 transition-colors">Reject</button>
                </div>
              </td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4">
                <div className="font-bold text-white">user99@gmail.com</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-0.5">PX-A74B92</div>
              </td>
              <td className="py-4 text-orange-400 font-bold">Nagad</td>
              <td className="py-4 font-mono text-white">01922334455</td>
              <td className="py-4 text-emerald-400 font-bold">৳950</td>
              <td className="py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded hover:bg-emerald-500/30 transition-colors">Mark Paid</button>
                  <button className="px-3 py-1.5 bg-red-500/20 text-red-400 font-bold text-xs rounded hover:bg-red-500/30 transition-colors">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </GlassCard>
    </AdminShell>
  );
}
