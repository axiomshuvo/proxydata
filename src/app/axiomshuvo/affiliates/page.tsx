"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { getAffiliatesAdmin, inviteAffiliateByEmail } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminAffiliatesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setRows(await getAffiliatesAdmin());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleInvite = async () => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      await inviteAffiliateByEmail(email);
      setNotice(`Partner capability granted to ${email.trim().toLowerCase()}.`);
      notifySuccess("Partner granted", email.trim().toLowerCase());
      setEmail("");
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Invite failed.";
      setError(message);
      notifyError("Invite failed", message);
    } finally {
      setBusy(false);
    }
  };

  const totals = rows.reduce(
    (s, r) => ({ earned: s.earned + r.earned, paid: s.paid + r.paid, unpaid: s.unpaid + r.unpaid }),
    { earned: 0, paid: 0, unpaid: 0 },
  );

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/affiliates" title="Affiliate Management">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          ["Total Earned", totals.earned],
          ["Paid Out", totals.paid],
          ["Unpaid", totals.unpaid],
        ].map(([label, v]) => (
          <GlassCard key={label} className="!bg-zinc-900/60 !border-white/10 p-5 rounded-3xl">
            <p className="text-xs text-zinc-500 font-bold uppercase">{label}</p>
            <p className="text-2xl font-extrabold text-white mt-1">৳{(v as number).toLocaleString()}</p>
          </GlassCard>
        ))}
      </div>

      {notice && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">{notice}</p>}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">{error}</p>}

      <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl mb-6">
        <h3 className="font-bold text-white mb-1">Invite partner</h3>
        <p className="text-xs text-zinc-500 mb-4">Account must already exist (they register first). Grants the invite-only capability + opens their dashboard.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="partner@example.com"
            className="custom-input flex-1"
          />
          <Button onClick={handleInvite} isDisabled={busy || !email.includes("@")} className="bg-cyan-600 text-white font-bold rounded-xl px-6">
            {busy ? "Granting…" : "Grant access"}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                  <th className="px-5 py-3">Partner</th>
                  <th className="px-5 py-3">Active codes</th>
                  <th className="px-5 py-3 text-right">Referrals</th>
                  <th className="px-5 py-3 text-right">Earned</th>
                  <th className="px-5 py-3 text-right">Unpaid</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-bold text-white text-sm">{r.email}</div>
                      <div className="font-mono text-[11px] text-zinc-500">{r.userId}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-cyan-400">{r.activeCodes.join(", ") || "—"}</td>
                    <td className="px-5 py-3 text-right text-sm">{r.referrals}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-white">৳{r.earned.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-amber-400">৳{r.unpaid.toLocaleString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-500 text-sm">No partners yet — invite one above.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </AdminShell>
  );
}
