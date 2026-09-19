"use client";
import { CustomerShell } from "@/components/layout/CustomerShell";
import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const GB = 1073741824;

function statusStyle(status: string): string {
  if (status === "ACTIVE" || status === "APPROVED" || status === "PROVIDER_VERIFIED" || status === "ALLOCATING") 
    return "bg-green-500/10 text-green-400 border-green-500/20";
  if (status === "PENDING") 
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  return "bg-red-500/10 text-red-400 border-red-500/20";
}

function formatStatusText(status: string): string {
  if (status === "PENDING") return "Pending";
  if (status === "ACTIVE" || status === "APPROVED" || status === "PROVIDER_VERIFIED" || status === "ALLOCATING") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return status;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transaction History</h1>
          <p className="text-sm text-zinc-400 mt-1">Track your proxy plan purchases and bKash approvals.</p>
        </div>
        <Link 
          href="/user/plans" 
          className="w-full sm:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-cyan-500/20 text-center"
        >
          Buy Proxies
        </Link>
      </div>

      <div className="bg-[rgba(24,24,27,0.6)] backdrop-blur-[12px] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : txns.length === 0 ? (
            <p className="text-center text-zinc-500 text-sm py-10">No transactions yet — your orders will appear here.</p>
          ) : (
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="bg-white/[0.02] text-left px-4 py-3.5 text-[12px] uppercase tracking-wider text-zinc-400 border-b border-white/5">Date</th>
                  <th className="bg-white/[0.02] text-left px-4 py-3.5 text-[12px] uppercase tracking-wider text-zinc-400 border-b border-white/5">Plan</th>
                  <th className="bg-white/[0.02] text-left px-4 py-3.5 text-[12px] uppercase tracking-wider text-zinc-400 border-b border-white/5">TrxID / Ref</th>
                  <th className="bg-white/[0.02] text-left px-4 py-3.5 text-[12px] uppercase tracking-wider text-zinc-400 border-b border-white/5">Amount</th>
                  <th className="bg-white/[0.02] text-left px-4 py-3.5 text-[12px] uppercase tracking-wider text-zinc-400 border-b border-white/5">Status</th>
                </tr>
              </thead>
              <tbody>
                {txns.map((tx: any) => {
                  const gb = tx.bandwidthGb ?? (tx.bandwidthBytes ? (tx.bandwidthBytes / GB).toFixed(1) : null);
                  const dateObj = tx.createdAt ? new Date(tx.createdAt) : new Date();
                  const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

                  return (
                    <tr key={tx._id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 border-b border-white/5 group-last:border-none text-zinc-200 text-sm whitespace-nowrap">
                        <div className="font-medium text-white">{dateStr}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{timeStr}</div>
                      </td>
                      <td className="p-4 border-b border-white/5 group-last:border-none text-zinc-200 text-sm">
                        <div className="font-medium text-cyan-400">
                          {tx.planSnapshot?.name ?? (tx.type === "REDEEM" ? "Code redemption" : tx.type)}
                          {gb ? ` (${gb} GB)` : ""}
                        </div>
                        {tx.status === "REJECTED" && tx.rejectReason && (
                          <div className="mt-1.5 px-2 py-1.5 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 font-medium inline-block">
                            <span className="font-bold uppercase tracking-wider text-[9px] opacity-80 mr-1">Admin Note:</span>
                            {tx.rejectReason}
                          </div>
                        )}
                      </td>
                      <td className="p-4 border-b border-white/5 group-last:border-none text-zinc-200 text-sm whitespace-nowrap">
                        <span className="font-mono text-zinc-400 text-xs bg-black/50 px-2 py-1.5 rounded">
                          {tx.transactionId ?? String(tx._id).slice(-8)}
                        </span>
                      </td>
                      <td className="p-4 border-b border-white/5 group-last:border-none text-zinc-200 text-sm font-medium whitespace-nowrap">
                        ৳{(tx.finalAmountBdt ?? 0).toLocaleString()}
                      </td>
                      <td className="p-4 border-b border-white/5 group-last:border-none text-zinc-200 text-sm whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold border rounded-md ${statusStyle(tx.status)}`}>
                          {formatStatusText(tx.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination inside the card container at the bottom */}
        {txns.length > 0 && (
          <div className="px-4 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1 text-sm text-zinc-400 hover:text-white disabled:opacity-50 font-medium"
            >
              Previous
            </button>
            <span className="text-xs text-zinc-500 font-medium">Page {page} of {pages}</span>
            <button
              onClick={() => setPage(Math.min(pages, page + 1))}
              disabled={page >= pages}
              className="px-3 py-1 text-sm text-zinc-400 hover:text-white disabled:opacity-50 font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
