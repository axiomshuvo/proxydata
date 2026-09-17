"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";

export default function AdminApprovalsPage() {
  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/approvals" title="Transaction Approvals" pendingApprovals={2}>
      <GlassCard className="!bg-zinc-900/60 p-6 overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">User</th>
              <th className="pb-3 font-semibold">Trx ID</th>
              <th className="pb-3 font-semibold">Amount</th>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5">
              <td className="py-4">test@example.com</td>
              <td className="py-4 font-mono text-cyan-400">7G9H8F2A</td>
              <td className="py-4 font-bold text-white">৳150</td>
              <td className="py-4 text-zinc-500">2 mins ago</td>
              <td className="py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded hover:bg-emerald-500/30">Approve</button>
                  <button className="px-3 py-1.5 bg-red-500/20 text-red-400 font-bold text-xs rounded hover:bg-red-500/30">Reject</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </GlassCard>
    </AdminShell>
  );
}
