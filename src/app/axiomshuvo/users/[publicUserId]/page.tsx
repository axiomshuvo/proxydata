"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { StarFill, Gift, Xmark } from "@gravity-ui/icons";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserDetails, setAffiliate, updateUserStatus, getPlansAdmin, adminActivatePackage, revokeUserPackage } from "@/app/actions/admin";
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
  const [confirmAffiliate, setConfirmAffiliate] = useState<"GRANT" | "REVOKE" | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<{subUserId: number, proxyType: string} | null>(null);

  const handleRevoke = async () => {
    if (!confirmRevoke) return;
    setBusy(true);
    try {
      await revokeUserPackage(confirmRevoke.subUserId, publicUserId);
      notifySuccess("Revoked", "The proxy package has been successfully revoked and bandwidth dropped.");
      setConfirmRevoke(null);
      refresh();
    } catch (e) {
      notifyError("Failed", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  
  // Activate Package State
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateStep, setActivateStep] = useState<1 | 2>(1);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activateGb, setActivateGb] = useState<number | "">(1);
  const [activating, setActivating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (showActivateModal && plans.length === 0) {
      getPlansAdmin().then(setPlans).catch(console.error);
    }
  }, [showActivateModal, plans.length]);

  useEffect(() => {
    if (selectedPlanId) {
      const p = plans.find(x => x._id === selectedPlanId);
      if (p && p.bandwidthGb) {
        setActivateGb(p.bandwidthGb);
      }
    }
  }, [selectedPlanId, plans]);

  const closeActivateModal = () => {
    setShowActivateModal(false);
    // Add a tiny delay so the modal fade out doesn't glitch visually before state clears
    setTimeout(() => {
      setActivateStep(1);
      setSelectedPlanId("");
      setActivateGb(1);
      setFormError(null);
    }, 150);
  };

  const handleActivateNext = () => {
    if (!selectedPlanId) return setFormError("Please select a provider and plan.");
    if (activateGb === "" || activateGb < 1 || !Number.isInteger(activateGb)) return setFormError("Bandwidth must be a positive integer.");
    setFormError(null);
    setActivateStep(2);
  };

  const handleActivatePackage = async () => {
    if (!selectedPlanId) return;
    setActivating(true);
    try {
      const keyBytes = new Uint8Array(16);
      crypto.getRandomValues(keyBytes);
      const idempotencyKey = Array.from(keyBytes, (b) => b.toString(16).padStart(2, "0")).join("");
      await adminActivatePackage(publicUserId, selectedPlanId, Number(activateGb), idempotencyKey);
      notifySuccess("Activated", `${activateGb} GB has been successfully allocated to the user.`);
      setShowActivateModal(false);
      setActivateStep(1);
      setSelectedPlanId("");
      refresh(); // Reload UI
    } catch (e) {
      notifyError("Gift Failed", e instanceof Error ? e.message : String(e));
    } finally {
      setActivating(false);
    }
  };

  const selectedPlanDetails = plans.find(p => p._id === selectedPlanId);

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
                  {isAffiliate && <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 flex items-center gap-1 shadow-amber-glow-lg"><StarFill width={12} className="text-amber-400" /> Authorized Affiliate</span>}
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    {user.status}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowActivateModal(true)} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold text-xs uppercase rounded-xl transition-colors disabled:opacity-40"><Gift width={14}/> Activate Package</button>
                {!isAffiliate ? (
                  <button onClick={() => setConfirmAffiliate("GRANT")} disabled={busy} className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs uppercase rounded-xl transition-colors disabled:opacity-40">Grant Affiliate</button>
                ) : (
                  <button onClick={() => setConfirmAffiliate("REVOKE")} disabled={busy} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs uppercase rounded-xl transition-colors disabled:opacity-40">Revoke Affiliate</button>
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
                      <th className="pb-2 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.proxyAccounts.map((a: any) => (
                      <tr key={a._id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 text-xs font-bold">{a.proxyType}</td>
                        <td className="py-3 font-mono text-xs text-zinc-400">#{a.providerSubUserId ?? a.providerSubId} · {a.login}</td>
                        <td className="py-3 text-right text-xs">{(((a.cumulativePurchasedBytes ?? 0)) / GB).toFixed(2)} GB</td>
                        <td className="py-3 text-right text-xs font-bold text-white">{(((a.cachedRemainingBytes ?? a.bandwidthBalanceBytes ?? 0)) / GB).toFixed(2)} GB</td>
                        <td className="py-3 text-right text-xs">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${a.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {a.status === 'ACTIVE' && (
                            <button
                              onClick={() => setConfirmRevoke({ subUserId: Number(a.providerSubUserId ?? a.providerSubId), proxyType: a.proxyType })}
                              className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-[10px] font-bold uppercase transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
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
            <h3 className="text-lg font-bold text-white mb-4">Suspend User?</h3>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-red-300">User ID:</span> <span className="text-white font-mono">{publicUserId}</span></div>
              <div className="flex justify-between"><span className="text-red-300">Name:</span> <span className="text-white">{user?.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-red-300">Email:</span> <span className="text-white">{user?.email || "—"}</span></div>
            </div>
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

      {/* Activate Package Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-white/10 p-6 shadow-2xl">
            <button onClick={closeActivateModal} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-full"><Xmark width={14}/></button>
            <h3 className="mb-4 font-bold text-white text-lg flex items-center gap-2"><Gift className="text-cyan-400"/> Activate Proxy Package</h3>
            
            {activateStep === 1 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-zinc-400">Select the underlying provider/plan and specify exactly how much bandwidth to allocate.</p>
                {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">{formError}</div>}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Provider & Plan Template</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 p-3 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Select a template...</option>
                    {plans.filter(p => p.status === "ACTIVE").map(p => (
                      <option key={p._id} value={p._id}>{p.providerId?.toUpperCase()} - {p.name} ({p.proxyType})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Amount (GB)</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={activateGb}
                    onChange={(e) => setActivateGb(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full rounded-xl bg-zinc-900 border border-white/10 p-3 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <Button onPress={closeActivateModal} className="bg-white/5 text-white font-bold rounded-xl">Cancel</Button>
                  <Button className="bg-cyan-500 text-black font-bold rounded-xl" onPress={handleActivateNext}>Next: Review</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {formError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">{formError}</div>}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex flex-col gap-2">
                  <h4 className="text-cyan-400 font-bold text-sm mb-1">Reconfirmation</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">User:</span>
                    <span className="text-white font-bold font-mono">{publicUserId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Name:</span>
                    <span className="text-white font-bold">{user?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Email:</span>
                    <span className="text-white font-bold">{user?.email || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Provider:</span>
                    <span className="text-white font-bold uppercase">{selectedPlanDetails?.providerId}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Type:</span>
                    <span className="text-white font-bold">{selectedPlanDetails?.proxyType}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Bandwidth:</span>
                    <span className="text-white font-bold">{activateGb} GB</span>
                  </div>
                  <div className="flex justify-between text-xs mt-2 pt-2 border-t border-cyan-500/20">
                    <span className="text-zinc-400">Cost to User:</span>
                    <span className="text-emerald-400 font-bold">0 BDT (Manual Allocation)</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-500 text-center">
                  This will instantly trigger upstream allocation and notify the user via their dashboard.
                </p>

                <div className="flex gap-2 justify-end mt-2">
                  <Button onPress={() => setActivateStep(1)} className="bg-white/5 text-white font-bold rounded-xl">Back</Button>
                  <Button className="bg-emerald-500 text-black font-bold rounded-xl" isDisabled={activating} onPress={handleActivatePackage}>
                    {activating ? "Allocating..." : "Confirm & Allocate"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Affiliate Modal */}
      {confirmAffiliate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="relative !bg-zinc-950 !border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <button onClick={() => setConfirmAffiliate(null)} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-full"><Xmark width={14}/></button>
            <h3 className="text-xl font-bold text-white mb-4">
              {confirmAffiliate === "GRANT" ? "Grant Affiliate Partner?" : "Revoke Affiliate Partner?"}
            </h3>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-amber-400">User ID:</span> <span className="text-white font-mono">{publicUserId}</span></div>
              <div className="flex justify-between"><span className="text-amber-400">Name:</span> <span className="text-white">{user?.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-amber-400">Email:</span> <span className="text-white">{user?.email || "—"}</span></div>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              {confirmAffiliate === "GRANT"
                ? "This will give the user a special badge and allow them to generate referral links to earn commissions."
                : "This will instantly remove their partner badge and stop their ability to earn from new referrals."}
            </p>
            <div className="flex gap-3 justify-end">
              <Button onPress={() => setConfirmAffiliate(null)} className="bg-white/5 text-white font-bold rounded-xl">Cancel</Button>
              <Button 
                onPress={() => {
                  const action = confirmAffiliate;
                  setConfirmAffiliate(null);
                  run(() => setAffiliate(publicUserId, action === "GRANT"), action === "GRANT" ? "Partner granted." : "Partner revoked.");
                }} 
                className={confirmAffiliate === "GRANT" ? "bg-amber-500 text-black font-bold rounded-xl" : "bg-red-600 text-white font-bold rounded-xl"}
                isDisabled={busy}
              >
                {confirmAffiliate === "GRANT" ? "Confirm Grant" : "Confirm Revoke"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

    </AdminShell>
  );
}
