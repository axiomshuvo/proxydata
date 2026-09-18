"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { getPayoutsAdmin, recordPayout } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminPayoutsPage() {
  const [ledger, setLedger] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payFor, setPayFor] = useState<any | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const data = await getPayoutsAdmin();
      setLedger(data.ledger);
      setHistory(data.history);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openPay = (row: any) => {
    setPayFor(row);
    setAmount(String(row.unpaid));
    setReference("");
    setError(null);
  };

  const handleSave = async () => {
    if (!payFor) return;
    setSaving(true);
    setError(null);
    try {
      await recordPayout({ affiliateUserId: payFor.userId, amountBdt: Number(amount), reference });
      setPayFor(null);
      setNotice(`৳${amount} payout recorded for ${payFor.userId}. Partner notified in-app.`);
      notifySuccess("Payout recorded", `৳${amount} → ${payFor.userId}`);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setError(message);
      notifyError("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/payouts" title="Affiliate Payouts">
      {notice && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">{notice}</p>}

      <h3 className="font-bold text-white mb-3">Unpaid balances</h3>
      <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3 text-right">Earned</th>
                  <th className="px-5 py-3 text-right">Unpaid</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {ledger.filter((r) => r.unpaid > 0).map((r) => (
                  <tr key={r.userId} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-300">{r.userId}</td>
                    <td className="px-5 py-3 text-right text-sm">৳{r.earned.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-amber-400">৳{r.unpaid.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => openPay(r)} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] rounded-lg">
                        Record payout
                      </button>
                    </td>
                  </tr>
                ))}
                {ledger.filter((r) => r.unpaid > 0).length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-500 text-sm">Nothing owed right now.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      <h3 className="font-bold text-white mb-3">Payout history</h3>
      <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                <th className="px-5 py-3">Partner</th>
                <th className="px-5 py-3">Period</th>
                <th className="px-5 py-3">Reference</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id} className="border-b border-white/5 last:border-0">
                  <td className="px-5 py-3 font-mono text-xs text-zinc-300">{h.affiliateId}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{h.accountingPeriod}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">{h.reference}</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-emerald-400">৳{Number(h.amountBdt).toLocaleString()}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-zinc-500 text-sm">No payouts recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {payFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-md p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Record payout</h3>
            <p className="text-xs text-zinc-500 mb-4 font-mono">{payFor.userId} · unpaid ৳{payFor.unpaid.toLocaleString()} (overpay blocked)</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">AMOUNT (৳ BDT)</label>
                <input type="number" min="1" max={payFor.unpaid} value={amount} onChange={(e) => setAmount(e.target.value)} className="custom-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">REFERENCE (e.g. bKash TrxID)</label>
                <input value={reference} onChange={(e) => setReference(e.target.value)} className="custom-input" placeholder="TRX9F8A…" />
              </div>
              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>}
              <div className="flex gap-3">
                <Button onClick={() => setPayFor(null)} className="flex-1 bg-white/10 text-white font-bold rounded-xl">Cancel</Button>
                <Button onClick={handleSave} isDisabled={saving} className="flex-1 bg-cyan-600 text-white font-bold rounded-xl">
                  {saving ? "Saving…" : "Confirm payout"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
