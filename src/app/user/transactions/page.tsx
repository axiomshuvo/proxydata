"use client";
import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const GB = 1073741824;

function statusStyle(status: string): string {
  if (status === "ACTIVE") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "PENDING" || status === "APPROVED" || status === "ALLOCATING" || status === "PROVIDER_VERIFIED")
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(`/api/transactions?page=${page}&limit=20`, fetcher, {
    dedupingInterval: 30000,
    revalidateOnFocus: false,
  });
  const txns = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <CustomerShell activePath="/user/transactions">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Billing History</h1>
        <p className="text-sm text-zinc-400 mt-2">Your purchases, redemptions and adjustments — newest first.</p>
      </div>

      <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 overflow-x-auto rounded-3xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : txns.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-10">No transactions yet — your orders will appear here.</p>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300 min-w-[640px]">
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
              {txns.map((tx: any) => {
                const gb = tx.bandwidthGb ?? (tx.bandwidthBytes ? (tx.bandwidthBytes / GB).toFixed(1) : null);
                return (
                  <tr key={tx._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 text-zinc-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}</td>
                    <td className="py-4 font-mono text-cyan-400">{tx.transactionId ?? String(tx._id).slice(-8)}</td>
                    <td className="py-4">
                      <div className="font-bold text-white">
                        {tx.planSnapshot?.name ?? (tx.type === "REDEEM" ? "Code redemption" : tx.type)}
                        {gb ? ` (${gb} GB)` : ""}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5">
                        {tx.type}
                        {tx.finalDiscountAppliedBdt > 0 ? ` · discount ৳${tx.finalDiscountAppliedBdt} (${tx.discountSource})` : ""}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 border text-[10px] font-bold rounded ${statusStyle(tx.status)}`}>{tx.status}</span>
                    </td>
                    <td className="py-4 text-right font-bold text-white">৳{(tx.finalAmountBdt ?? 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">Page {page} of {pages} · {total} total</span>
          <button
            onClick={() => setPage(Math.min(pages, page + 1))}
            disabled={page >= pages}
            className="px-3 py-1 text-sm text-zinc-400 hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </GlassCard>
    </CustomerShell>
  );
}
