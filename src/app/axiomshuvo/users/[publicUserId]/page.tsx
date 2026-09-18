"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserDetails, setAffiliate, updateUserStatus } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

const GB = 1073741824;

export default function AdminUserDetailPage() {
  const params = useParams();
  const publicUserId = String(params.publicUserId ?? "");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const refresh = async () => {
    try {
      setData(await getUserDetails(publicUserId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicUserId]);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(okMsg);
      notifySuccess(okMsg);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Action failed.";
      setError(message);
      notifyError("Action failed", message);
    } finally {
      setBusy(false);
      setConfirmSuspend(false);
    }
  };

  const user = data?.user;
  const isAffiliate = (user?.capabilities ?? []).includes("CAPABILITY_AFFILIATE");

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/users" title={publicUserId}>
      <Link href="/axiomshuvo/users" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 mb-4 inline-block">
        ← All users
      </Link>

      {notice && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">{notice}</p>}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">{error}</p>}

      {loading || !user ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Identity */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{user.name ?? user.email}</h2>
                <p className="text-sm text-zinc-400">{user.email}</p>
                <p className="text-xs font-mono text-cyan-400 mt-1">{user.publicUserId}</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-white/5 text-zinc-300">{user.role}</span>
                  {isAffiliate && <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-amber-500/20 text-amber-400">Affiliate</span>}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {user.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isAffiliate ? (
                  <button onClick={() => run(() => setAffiliate(publicUserId, true), "Partner granted.")} disabled={busy} className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase rounded-xl disabled:opacity-40">Grant Affiliate</button>
                ) : (
                  <button onClick={() => run(() => setAffiliate(publicUserId, false), "Partner revoked.")} disabled={busy} className="px-3 py-2 bg-zinc-800 text-zinc-400 font-bold text-xs uppercase rounded-xl disabled:opacity-40">Revoke Affiliate</button>
                )}
                {user.status === "ACTIVE" ? (
                  <button onClick={() => setConfirmSuspend(true)} disabled={busy} className="px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs uppercase rounded-xl disabled:opacity-40">Suspend</button>
                ) : user.status === "SUSPENDED" ? (
                  <button onClick={() => run(() => updateUserStatus(publicUserId, "ACTIVE"), "Account restored.")} disabled={busy} className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs uppercase rounded-xl disabled:opacity-40">Restore</button>
                ) : null}
              </div>
            </div>
            {data.referredBy && (
              <p className="text-xs text-zinc-500 mt-3">Referred by <span className="text-zinc-300 font-mono">{String(data.referredBy.affiliateId).slice(-8)}</span> via code <span className="text-zinc-300 font-mono">{String(data.referredBy.codeUsed)}</span></p>
            )}
          </GlassCard>

          {/* Proxy inventory */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-4">Proxy inventory ({data.proxyAccounts.length})</h3>
            {data.proxyAccounts.length === 0 ? (
              <p className="text-sm text-zinc-500">No proxy accounts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-zinc-300 min-w-[560px]">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                      <th className="pb-2 font-semibold">Pool</th>
                      <th className="pb-2 font-semibold">Sub-user</th>
                      <th className="pb-2 font-semibold text-right">Purchased</th>
                      <th className="pb-2 font-semibold text-right">Remaining</th>
                      <th className="pb-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.proxyAccounts.map((a: any) => (
                      <tr key={a._id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 text-xs font-bold">{a.proxyType}</td>
                        <td className="py-3 font-mono text-xs text-zinc-400">#{a.providerSubUserId ?? a.providerSubId} · {a.login}</td>
                        <td className="py-3 text-right text-xs">{(((a.cumulativePurchasedBytes ?? 0)) / GB).toFixed(2)} GB</td>
                        <td className="py-3 text-right text-xs font-bold text-white">{(((a.cachedRemainingBytes ?? a.bandwidthBalanceBytes ?? 0)) / GB).toFixed(2)} GB</td>
                        <td className="py-3 text-right text-xs">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Transactions */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-4">Transactions ({data.transactions.length})</h3>
            {data.transactions.length === 0 ? (
              <p className="text-sm text-zinc-500">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-zinc-300 min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                      <th className="pb-2 font-semibold">TX</th>
                      <th className="pb-2 font-semibold">Plan</th>
                      <th className="pb-2 font-semibold text-right">GB</th>
                      <th className="pb-2 font-semibold text-right">Final ৳</th>
                      <th className="pb-2 font-semibold">TrxID</th>
                      <th className="pb-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((t: any) => (
                      <tr key={t._id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 font-mono text-xs text-cyan-400">{t.transactionId ?? String(t._id).slice(-8)}</td>
                        <td className="py-3 text-xs">{t.planSnapshot?.name ?? t.type}</td>
                        <td className="py-3 text-right text-xs">{t.bandwidthGb ?? (t.bandwidthBytes ? (t.bandwidthBytes / GB).toFixed(1) : "—")}</td>
                        <td className="py-3 text-right text-xs font-bold text-white">৳{(t.finalAmountBdt ?? t.amountTaka ?? 0).toLocaleString()}</td>
                        <td className="py-3 font-mono text-xs text-zinc-500">{t.paymentReference ?? "—"}</td>
                        <td className="py-3 text-right text-xs font-bold">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          {/* Partner */}
          {data.affiliate && (
            <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
              <h3 className="font-bold text-white mb-4">Partner activity</h3>
              <p className="text-xs text-zinc-400 mb-2">Codes: {data.affiliate.codes.map((c: any) => `${c.code} (${c.status})`).join(", ") || "—"}</p>
              <p className="text-xs text-zinc-400 mb-4">
                Earned ৳{data.affiliate.commissions.reduce((s: number, c: any) => s + (c.finalCommissionBdt ?? 0), 0).toLocaleString()} · Paid ৳{data.affiliate.payouts.reduce((s: number, p: any) => s + (p.amountBdt ?? 0), 0).toLocaleString()}
              </p>
              {data.affiliate.commissions.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-zinc-300 min-w-[480px]">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                        <th className="pb-2 font-semibold">Period</th>
                        <th className="pb-2 font-semibold text-right">Commission</th>
                        <th className="pb-2 font-semibold text-right">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.affiliate.commissions.slice(0, 20).map((c: any) => (
                        <tr key={c._id} className="border-b border-white/5 last:border-0">
                          <td className="py-2 text-xs">{c.accountingPeriod}</td>
                          <td className="py-2 text-right text-xs font-bold text-emerald-400">৳{(c.finalCommissionBdt ?? 0).toLocaleString()}</td>
                          <td className="py-2 text-right text-xs">{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          )}

          {/* Audit */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-4">Audit trail ({data.audit.length})</h3>
            {data.audit.length === 0 ? (
              <p className="text-sm text-zinc-500">No admin actions recorded for this user.</p>
            ) : (
              <ul className="space-y-2">
                {data.audit.map((a: any) => (
                  <li key={a._id} className="text-xs text-zinc-400 flex justify-between gap-4">
                    <span><span className="text-zinc-200 font-bold">{a.action}</span> by {String(a.actorId).slice(-8)}</span>
                    <span className="text-zinc-600">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </div>
      )}

      {confirmSuspend && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-md p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Suspend {publicUserId}?</h3>
            <p className="text-xs text-zinc-400 mb-4">Fail-closed: provider sub-users blocked first, sessions revoked, then the flip.</p>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmSuspend(false)} className="flex-1 bg-white/10 text-white font-bold rounded-xl">Cancel</Button>
              <Button onClick={() => run(() => updateUserStatus(publicUserId, "SUSPENDED"), "Account suspended.")} isDisabled={busy} className="flex-1 bg-red-600 text-white font-bold rounded-xl">
                {busy ? "Blocking…" : "Confirm suspend"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
