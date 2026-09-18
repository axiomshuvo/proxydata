"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { getPendingTransactions, approveTransaction, rejectTransaction } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminApprovalsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setTxns(await getPendingTransactions());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await approveTransaction(id);
      setNotice("Approved — allocation pipeline started.");
      notifySuccess("Approved", "Allocation pipeline started.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Approve failed.";
      setError(message);
      notifyError("Approve failed", message);
    } finally {
      setBusyId(null);
      await refresh();
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setBusyId(rejectId);
    setError(null);
    try {
      await rejectTransaction(rejectId, reason);
      setRejectId(null);
      setReason("");
      setNotice("Order rejected — user notified in-app.");
      notifySuccess("Order rejected");
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Reject failed.";
      setError(message);
      notifyError("Reject failed", message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/approvals" title="Transaction Approvals" pendingApprovals={txns.length}>
      {notice && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">{notice}</p>}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">{error}</p>}

      <GlassCard className="!bg-zinc-900/60 p-6 overflow-x-auto rounded-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : txns.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-10">No pending transactions. All caught up!</p>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300 min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Plan</th>
                <th className="pb-3 font-semibold">TrxID / Sender</th>
                <th className="pb-3 font-semibold text-right">Amount</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr key={tx._id} className="border-b border-white/5 last:border-0">
                  <td className="py-4 font-mono text-xs text-zinc-400">{tx.userId}</td>
                  <td className="py-4">
                    <div className="font-bold text-white text-sm">{tx.planSnapshot?.name ?? `${tx.bandwidthGb ?? "?"} GB`}</div>
                    <div className="text-[11px] text-zinc-500">{tx.proxyType} · {tx.transactionId}</div>
                  </td>
                  <td className="py-4 font-mono text-xs text-cyan-400">
                    {tx.paymentReference ?? "—"}
                    <div className="text-zinc-500">{tx.senderNumber ?? ""}</div>
                  </td>
                  <td className="py-4 text-right font-bold text-white">৳{(tx.finalAmountBdt ?? 0).toLocaleString()}</td>
                  <td className="py-4 text-zinc-500 text-xs">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ""}</td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(tx._id)}
                        disabled={busyId === tx._id}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded hover:bg-emerald-500/30 disabled:opacity-40"
                      >
                        {busyId === tx._id ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => { setRejectId(tx._id); setReason(""); }}
                        disabled={busyId === tx._id}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 font-bold text-xs rounded hover:bg-red-500/30 disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {rejectId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-md p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Reject order</h3>
            <p className="text-xs text-zinc-500 mb-4">A reason is required — the user sees it in-app.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. TrxID not found in bKash statement"
              className="custom-input w-full"
            />
            <div className="flex gap-3 mt-4">
              <Button onClick={() => setRejectId(null)} className="flex-1 bg-white/10 text-white font-bold rounded-xl">Cancel</Button>
              <Button onClick={handleReject} isDisabled={busyId === rejectId || reason.trim().length < 3} className="flex-1 bg-red-600 text-white font-bold rounded-xl">
                {busyId === rejectId ? "Rejecting…" : "Confirm reject"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
