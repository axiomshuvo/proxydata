"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyBox } from "@/components/ui/CopyBox";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import {
  createCoupon,
  disableRedeemCode,
  generateRedeemCode,
  getCouponUsages,
  getCouponsAdmin,
  getPlansAdmin,
  getProvidersAdmin,
  getRedeemCodesAdmin,
  setCouponStatus,
} from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

const mask = (code: string) => (code.length > 4 ? `${code.slice(0, 4)}••••••••` : "••••");

export default function AdminCodesPage() {
  const [tab, setTab] = useState<"redeem" | "coupon">("redeem");
  const [plans, setPlans] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Redeem form
  const [rProvider, setRProvider] = useState("dataimpulse");
  const [rPool, setRPool] = useState("RESIDENTIAL");
  const [rPlanId, setRPlanId] = useState("");
  const [rGb, setRGb] = useState("5");
  const [rValue, setRValue] = useState("");
  const [rDays, setRDays] = useState("30");
  const [minted, setMinted] = useState<string | null>(null);
  const [redeems, setRedeems] = useState<any[]>([]);

  // ---- Coupon form
  const [cProvider, setCProvider] = useState("dataimpulse");
  const [cPlanId, setCPlanId] = useState("");
  const [cType, setCType] = useState<"FIXED_AMOUNT" | "PERCENTAGE">("FIXED_AMOUNT");
  const [cValue, setCValue] = useState("");
  const [cCap, setCCap] = useState("");
  const [cOneTime, setCOneTime] = useState(true); // safety default: single-use
  const [cLimit, setCLimit] = useState("");
  const [cUser, setCUser] = useState("");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [mintedCoupon, setMintedCoupon] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [usageFor, setUsageFor] = useState<string | null>(null);
  const [usages, setUsages] = useState<any[]>([]);

  const refresh = async () => {
    try {
      const [p, provs, r, c] = await Promise.all([
        getPlansAdmin(),
        getProvidersAdmin(),
        getRedeemCodesAdmin(),
        getCouponsAdmin(),
      ]);
      setPlans(p);
      setProviders(provs);
      setRedeems(r);
      setCoupons(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const rPools: string[] =
    providers.find((p) => p.providerId === rProvider)?.pools?.length > 0
      ? providers.find((p) => p.providerId === rProvider).pools
      : ["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"];
  const rPlans = plans.filter((p) => p.providerId === rProvider && (rPool === "" || p.proxyType === rPool));
  const cPlans = plans.filter((p) => p.providerId === cProvider);

  const pickPlan = (id: string) => {
    setRPlanId(id);
    const plan = plans.find((p) => p._id === id);
    if (plan?.pricingMode === "FIXED" && plan.bandwidthGb) setRGb(String(plan.bandwidthGb));
  };

  const handleMintRedeem = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await generateRedeemCode({
        providerId: rProvider,
        proxyType: rPool as "RESIDENTIAL",
        planId: rPlanId || undefined,
        bandwidthGb: Number(rGb),
        monetaryValuationBdt: rValue.trim() === "" ? undefined : Number(rValue),
        validDays: Number(rDays) || 30,
      });
      setMinted(res.code);
      notifySuccess("Redeem code generated", "Copy it now — the list only shows a masked prefix.");
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Generation failed.";
      setFormError(message);
      notifyError("Generation failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleMintCoupon = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const res = await createCoupon({
        code: autoCouponCode(),
        type: cType,
        value: Number(cValue),
        maxDiscountAmount: cCap.trim() === "" ? undefined : Number(cCap),
        isOneTime: cOneTime,
        usageLimit: cLimit.trim() === "" ? undefined : Number(cLimit),
        planId: cPlanId || undefined,
        userEmail: cUser.trim() === "" ? undefined : cUser,
        validFrom: cFrom === "" ? undefined : cFrom,
        validTo: cTo === "" ? undefined : cTo,
      });
      setMintedCoupon(res.code);
      notifySuccess("Coupon generated", res.code);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Generation failed.";
      setFormError(message);
      notifyError("Generation failed", message);
    } finally {
      setSaving(false);
    }
  };

  // System-generated readable code (Crockford, no manual entry anywhere).
  const autoCouponCode = () => {
    const ABC = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    let s = "";
    for (let i = 0; i < 8; i++) s += ABC[arr[i] % ABC.length];
    return `PD-${s.slice(0, 4)}-${s.slice(4)}`;
  };

  const openUsage = async (code: string) => {
    setUsageFor(code);
    setUsages(await getCouponUsages(code).catch(() => []));
  };

  const toggleCoupon = async (c: any) => {
    try {
      await setCouponStatus(c.code, c.status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
      notifySuccess(c.status === "ACTIVE" ? "Coupon disabled" : "Coupon enabled", c.code);
      await refresh();
    } catch (e) {
      notifyError("Toggle failed", e instanceof Error ? e.message : "Toggle failed.");
    }
  };

  const disableRedeem = async (code: string) => {
    try {
      await disableRedeemCode(code);
      notifySuccess("Redeem code disabled", mask(code));
      await refresh();
    } catch (e) {
      notifyError("Disable failed", e instanceof Error ? e.message : "Disable failed.");
    }
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/codes" title="Codes">
      <p className="text-sm text-zinc-400 mb-5">
        One generation area. <span className="text-zinc-200 font-semibold">Redeem = bandwidth entitlement</span> (single-use, always).
        <span className="text-zinc-200 font-semibold"> Coupon = purchase discount</span> (single-use by default). All codes system-generated — never typed by hand.
      </p>

      <div className="flex gap-2 mb-6">
        {(["redeem", "coupon"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setFormError(null); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${tab === t ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300" : "border-white/10 text-zinc-500"}`}
          >
            {t === "redeem" ? "Redeem Code" : "Coupon"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : tab === "redeem" ? (
        <>
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl mb-6">
            <h3 className="font-bold text-white mb-4">Generate redeem code</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PROVIDER</label>
                <select value={rProvider} onChange={(e) => { setRProvider(e.target.value); setRPlanId(""); }} className="custom-select">
                  {providers.filter((p) => p.status === "ACTIVE").map((p) => (
                    <option key={p.providerId} value={p.providerId}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PROXY TYPE</label>
                <select value={rPool} onChange={(e) => setRPool(e.target.value)} className="custom-select">
                  {rPools.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PLAN (SETS GB)</label>
                <select value={rPlanId} onChange={(e) => pickPlan(e.target.value)} className="custom-select">
                  <option value="">— No plan link —</option>
                  {rPlans.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}{p.pricingMode === "FIXED" ? ` · ${p.bandwidthGb} GB` : " · flex"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">BANDWIDTH (GB)</label>
                <input type="number" min="1" max="1000" value={rGb} onChange={(e) => setRGb(e.target.value)} className="custom-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">VALUATION ৳ (OPTIONAL)</label>
                <input type="number" min="0" value={rValue} onChange={(e) => setRValue(e.target.value)} className="custom-input" placeholder="600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">VALIDITY (DAYS, DEFAULT 30)</label>
                <input type="number" min="1" max="365" value={rDays} onChange={(e) => setRDays(e.target.value)} className="custom-input" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-4">{formError}</p>}
            <Button onClick={handleMintRedeem} isDisabled={saving} className="mt-5 bg-cyan-600 text-white font-bold rounded-xl px-8">
              {saving ? "Generating…" : "Generate redeem code"}
            </Button>
            {minted && (
              <div className="mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <p className="text-xs font-bold text-emerald-400 mb-2">COPY NOW — the list only shows a masked prefix after this.</p>
                <CopyBox text={minted} />
              </div>
            )}
          </GlassCard>

          <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Scope</th>
                    <th className="px-5 py-3 text-right">GB</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {redeems.map((r) => (
                    <tr key={r._id} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 font-mono font-bold text-white">{mask(r.code)}</td>
                      <td className="px-5 py-3 text-zinc-400 text-xs">{r.providerId} · {r.proxyType}</td>
                      <td className="px-5 py-3 text-right text-xs">{((r.bandwidthBytes ?? 0) / 1073741824).toFixed(0)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${r.status === "USED" ? "bg-zinc-500/20 text-zinc-400" : r.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {r.status}{r.redeemedBy ? ` · ${String(r.redeemedBy).slice(-8)}` : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(r.status === "ACTIVE" || r.status === "GENERATED") && (
                          <button onClick={() => disableRedeem(r.code)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] rounded-lg">Disable</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {redeems.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-500 text-sm">No redeem codes yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      ) : (
        <>
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl mb-6">
            <h3 className="font-bold text-white mb-4">Generate coupon</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PROVIDER</label>
                <select value={cProvider} onChange={(e) => { setCProvider(e.target.value); setCPlanId(""); }} className="custom-select">
                  {providers.filter((p) => p.status === "ACTIVE").map((p) => (
                    <option key={p.providerId} value={p.providerId}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PLAN (COUPON WORKS ONLY HERE, OR ALL)</label>
                <select value={cPlanId} onChange={(e) => setCPlanId(e.target.value)} className="custom-select">
                  <option value="">All plans</option>
                  {cPlans.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}{p.pricingMode === "FIXED" ? ` · ${p.bandwidthGb} GB` : " · flex"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">DISCOUNT TYPE</label>
                <div className="flex gap-2">
                  {(["FIXED_AMOUNT", "PERCENTAGE"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setCType(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${cType === t ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300" : "border-white/10 text-zinc-500"}`}>
                      {t === "FIXED_AMOUNT" ? "Fixed ৳" : "Percent %"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">VALUE {cType === "PERCENTAGE" ? "(%)" : "(৳)"}</label>
                <input type="number" min="1" value={cValue} onChange={(e) => setCValue(e.target.value)} className="custom-input" placeholder={cType === "PERCENTAGE" ? "10" : "50"} />
                {cType === "FIXED_AMOUNT" && (
                  <div className="flex gap-2 mt-2">
                    {[10, 20, 30, 50].map((v) => (
                      <button key={v} type="button" onClick={() => setCValue(String(v))} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300">৳{v}</button>
                    ))}
                  </div>
                )}
              </div>
              {cType === "PERCENTAGE" && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">MAX DISCOUNT CAP ৳ (OPTIONAL)</label>
                  <input type="number" min="1" value={cCap} onChange={(e) => setCCap(e.target.value)} className="custom-input" placeholder="100" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">USAGE TYPE (DEFAULT: ONE-TIME)</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCOneTime(true)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${cOneTime ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" : "border-white/10 text-zinc-500"}`}>
                    One-Time Use
                  </button>
                  <button type="button" onClick={() => setCOneTime(false)} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${!cOneTime ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300" : "border-white/10 text-zinc-500"}`}>
                    Multiple Use
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">USAGE LIMIT (BLANK = UNLIMITED)</label>
                <input type="number" min="1" value={cLimit} onChange={(e) => setCLimit(e.target.value)} className="custom-input" placeholder="100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">USER EMAIL (OPTIONAL BIND)</label>
                <input value={cUser} onChange={(e) => setCUser(e.target.value)} className="custom-input" placeholder="someone@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">VALID FROM / TO (OPTIONAL)</label>
                <div className="flex gap-2">
                  <input type="date" value={cFrom} onChange={(e) => setCFrom(e.target.value)} className="custom-input" />
                  <input type="date" value={cTo} onChange={(e) => setCTo(e.target.value)} className="custom-input" />
                </div>
              </div>
            </div>
            {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-4">{formError}</p>}
            <Button onClick={handleMintCoupon} isDisabled={saving} className="mt-5 bg-cyan-600 text-white font-bold rounded-xl px-8">
              {saving ? "Generating…" : "Generate coupon"}
            </Button>
            {mintedCoupon && (
              <div className="mt-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <p className="text-xs font-bold text-emerald-400 mb-2">SYSTEM-GENERATED — share it with the customer.</p>
                <CopyBox text={mintedCoupon} />
              </div>
            )}
          </GlassCard>

          <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Discount</th>
                    <th className="px-5 py-3 text-right">Used</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <tr key={c._id} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 font-mono font-bold text-white">{c.code}</td>
                      <td className="px-5 py-3 text-zinc-300 text-xs">
                        {c.type === "PERCENTAGE" ? `${c.value}%${c.maxDiscountAmount ? ` (cap ৳${c.maxDiscountAmount})` : ""}` : `৳${c.value} off`}
                        {c.isOneTime ? " · one-time" : ""}
                        {c.usageLimit ? ` · max ${c.usageLimit}` : ""}
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-zinc-400">{c.usageCount ?? 0}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openUsage(c.code)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] rounded-lg">Usage</button>
                          <button onClick={() => toggleCoupon(c)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] rounded-lg">
                            {c.status === "ACTIVE" ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-zinc-500 text-sm">No coupons yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {usageFor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-lg p-6 rounded-2xl overflow-y-auto max-h-[80vh]">
            <h3 className="text-lg font-bold text-white mb-4">Usage — <span className="font-mono">{usageFor}</span></h3>
            {usages.length === 0 ? (
              <p className="text-sm text-zinc-500">Never used — history appears here permanently after first use.</p>
            ) : (
              <ul className="space-y-2">
                {usages.map((u) => (
                  <li key={u._id} className="text-xs text-zinc-400 flex justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="font-mono">{String(u.userId).slice(-8)} · {String(u.transactionId).slice(-8)}</span>
                    <span className="font-bold text-white">৳{u.discountAppliedBdt}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={() => setUsageFor(null)} className="w-full mt-4 bg-white/10 text-white font-bold rounded-xl">Close</Button>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
