"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { Plus, Pencil } from "@gravity-ui/icons";
import {
  createPlan,
  getPlansAdmin,
  getProvidersAdmin,
  updatePlan,
  type PlanInput,
} from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

const POOLS = ["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"] as const;
const FALLBACK_COEFF: Record<string, number> = { RESIDENTIAL: 1, DATACENTER: 0.5, MOBILE: 2, PREMIUM_RESIDENTIAL: 5 };

interface TierRow { minGb: string; maxGb: string; pricePerGbBdt: string }

const emptyTier = (min: number): TierRow => ({ minGb: String(min), maxGb: "", pricePerGbBdt: "" });

function tierError(rows: TierRow[]): string | null {
  const parsed = rows.map((r) => ({
    min: Number(r.minGb),
    max: r.maxGb.trim() === "" ? null : Number(r.maxGb),
    rate: Number(r.pricePerGbBdt),
  }));
  if (parsed.some((t) => !Number.isInteger(t.min) || t.min < 1)) return "Each tier needs min GB ≥ 1.";
  if (parsed.some((t) => t.max !== null && (!Number.isInteger(t.max) || t.max < t.min))) return "Max must be ≥ min (or blank = no limit).";
  if (parsed.some((t) => !Number.isInteger(t.rate) || t.rate < 1)) return "Each tier needs a rate ≥ ৳1/GB.";
  const sorted = [...parsed].sort((a, b) => a.min - b.min);
  if (sorted[0].min !== 1) return "First tier must start at 1 GB.";
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    if (prev.max === null) return `Tier ${i} is open-ended — no tiers allowed after it.`;
    if (cur.min !== prev.max + 1) return `Gap/overlap between tier ${i} (ends ${prev.max}) and tier ${i + 1} (starts ${cur.min}).`;
    if (!(cur.rate < prev.rate)) return `Tier ${i + 1} must be cheaper than tier ${i} (bulk = discount).`;
  }
  return null;
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [provider, setProvider] = useState("dataimpulse");
  const [name, setName] = useState("");
  const [pool, setPool] = useState<string>("RESIDENTIAL");
  const [mode, setMode] = useState<"FIXED" | "TIERED">("TIERED");
  const [bundleGb, setBundleGb] = useState("5");
  const [bundlePrice, setBundlePrice] = useState("");
  const [tiers, setTiers] = useState<TierRow[]>([emptyTier(1)]);
  const [status, setStatus] = useState("ACTIVE");

  const refresh = async () => {
    const [p, provs] = await Promise.all([getPlansAdmin(), getProvidersAdmin()]);
    setPlans(p);
    setProviders(provs);
    setLoading(false);
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, []);

  const providerOf = (id: string) => providers.find((p) => p.providerId === id);
  const coeffOf = (providerId: string, p: string) =>
    Number(providerOf(providerId)?.coefficients?.[p] ?? FALLBACK_COEFF[p] ?? 1);
  const floorFor = (providerId: string, p: string) =>
    Math.ceil(Number(providerOf(providerId)?.wholesaleBaseBdt ?? 0) * coeffOf(providerId, p));
  const poolsOf = (providerId: string): string[] => {
    const list = providerOf(providerId)?.pools;
    return Array.isArray(list) && list.length > 0 ? list : [...POOLS];
  };
  const activeProviders = providers.filter((p) => p.status === "ACTIVE");

  const openCreate = () => {
    setEditing(null);
    setProvider(activeProviders[0]?.providerId ?? "dataimpulse");
    setName("");
    setPool("RESIDENTIAL");
    setMode("TIERED");
    setBundleGb("5");
    setBundlePrice("");
    setTiers([
      { minGb: "1", maxGb: "3", pricePerGbBdt: "150" },
      { minGb: "4", maxGb: "10", pricePerGbBdt: "140" },
      { minGb: "11", maxGb: "", pricePerGbBdt: "130" },
    ]);
    setStatus("ACTIVE");
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (plan: any) => {
    setEditing(plan);
    setProvider(plan.providerId ?? "dataimpulse");
    setName(plan.name);
    setPool(plan.proxyType);
    setMode(plan.pricingMode ?? "FIXED");
    setBundleGb(String(plan.bandwidthGb ?? 5));
    setBundlePrice(String(plan.retailPriceBdt ?? ""));
    setTiers(
      (plan.tiers ?? []).map((t: any) => ({
        minGb: String(t.minGb),
        maxGb: t.maxGb === null ? "" : String(t.maxGb),
        pricePerGbBdt: String(t.pricePerGbBdt),
      })),
    );
    setStatus(plan.status);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const input: PlanInput = {
        name,
        providerId: provider,
        proxyType: pool as PlanInput["proxyType"],
        pricingMode: mode,
        bandwidthGb: Number(bundleGb),
        retailPriceBdt: Number(bundlePrice),
        tiers: tiers.map((t) => ({
          minGb: Number(t.minGb),
          maxGb: t.maxGb.trim() === "" ? null : Number(t.maxGb),
          pricePerGbBdt: Number(t.pricePerGbBdt),
        })),
        status: status as PlanInput["status"],
      };
      if (editing) await updatePlan(editing._id, input);
      else await createPlan(input);
      setShowModal(false);
      notifySuccess(editing ? "Plan updated" : "Plan created", name);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setFormError(message);
      notifyError("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  const tErr = mode === "TIERED" ? tierError(tiers) : null;
  const examples = [1, 3, 4, 10, 11, 50].map((gb) => {
    const hit = [...tiers]
      .map((t) => ({ min: Number(t.minGb), max: t.maxGb.trim() === "" ? null : Number(t.maxGb), rate: Number(t.pricePerGbBdt) }))
      .sort((a, b) => a.min - b.min)
      .find((t) => gb >= t.min && (t.max === null || gb <= t.max));
    return { gb, total: hit && Number.isInteger(hit.rate) ? gb * hit.rate : null };
  });

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/plans" title="Plans">
      <div className="mb-6 flex items-end justify-between">
        <p className="text-sm text-zinc-400">Fixed bundles + flex volume pricing. All prices integer ৳ BDT.</p>
        <Button onClick={openCreate} className="bg-cyan-600 font-bold text-white hover:bg-cyan-500 rounded-xl px-5">
          <Plus width={16} /> New Plan
        </Button>
      </div>

      {/* Buying cost lives on the Providers page (one price per vendor).
          Floors below derive from the selected provider's rule. */}
      <p className="text-xs text-zinc-500 mb-6">
        Buying costs live under <span className="text-zinc-300 font-semibold">Providers</span> — one price per vendor, floors per pool derive automatically.
      </p>

      {/* Plans table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/5">
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Pool</th>
                  <th className="px-5 py-3">Pricing</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan._id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3 font-bold text-white">{plan.name}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{providerOf(plan.providerId)?.name ?? plan.providerId}</td>
                    <td className="px-5 py-3 text-zinc-400 text-xs">{plan.proxyType}</td>
                    <td className="px-5 py-3 text-zinc-300 text-xs">
                      {plan.pricingMode === "TIERED" && plan.tiers?.length
                        ? plan.tiers.map((t: any) => `${t.minGb}–${t.maxGb ?? "∞"}: ৳${t.pricePerGbBdt}`).join(" · ")
                        : `৳${plan.retailPriceBdt} / ${plan.bandwidthGb} GB`}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${plan.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : plan.status === "ARCHIVED" ? "bg-zinc-500/20 text-zinc-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {plan.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button onPress={() => openEdit(plan)} className="bg-white/10 text-white text-xs font-bold rounded-lg px-3 h-8">
                        <Pencil width={14} /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
                {plans.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-zinc-500 text-sm">No plans yet — create your first flex plan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-2xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">{editing ? "Edit Plan" : "New Plan"}</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PLAN NAME</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="custom-input" placeholder="Residential Flex" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">PROVIDER</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const id = e.target.value;
                      setProvider(id);
                      const available = poolsOf(id);
                      if (!available.includes(pool)) setPool(available[0] ?? "RESIDENTIAL");
                    }}
                    className="custom-select"
                  >
                    {providers.map((p) => (
                      <option key={p.providerId} value={p.providerId} disabled={p.status !== "ACTIVE" && p.providerId !== editing?.providerId}>
                        {p.name} {p.status !== "ACTIVE" ? `(${p.status})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">POOL</label>
                  <select value={pool} onChange={(e) => setPool(e.target.value)} className="custom-select">
                    {poolsOf(provider).map((p) => <option key={p} value={p}>{p} (×{coeffOf(provider, p)})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="custom-select">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PRICING MODE</label>
                <div className="flex gap-2">
                  {(["TIERED", "FIXED"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${mode === m ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300" : "border-white/10 text-zinc-500"}`}
                    >
                      {m === "TIERED" ? "Flex — volume tiers" : "Fixed — one bundle"}
                    </button>
                  ))}
                </div>
              </div>

              {mode === "FIXED" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">BUNDLE (GB)</label>
                    <input type="number" min="1" value={bundleGb} onChange={(e) => setBundleGb(e.target.value)} className="custom-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">PRICE (৳ BDT)</label>
                    <input type="number" min="0" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} className="custom-input" />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-500">VOLUME TIERS (max blank = no limit · {providerOf(provider)?.name ?? provider} floor ৳{floorFor(provider, pool)}/GB)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const last = tiers[tiers.length - 1];
                        const nextMin = last && last.maxGb.trim() !== "" ? Number(last.maxGb) + 1 : tiers.length + 1;
                        setTiers([...tiers, emptyTier(Number.isInteger(nextMin) ? nextMin : 1)]);
                      }}
                      className="text-xs font-bold text-cyan-400"
                    >
                      + Add tier
                    </button>
                  </div>
                  <div className="space-y-2">
                    {tiers.map((t, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                        <input type="number" min="1" value={t.minGb} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], minGb: e.target.value }; setTiers(n); }} className="custom-input" placeholder="Min" />
                        <input type="number" min="1" value={t.maxGb} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], maxGb: e.target.value }; setTiers(n); }} className="custom-input" placeholder="Max (blank ∞)" />
                        <div className="relative">
                          <input type="number" min="1" value={t.pricePerGbBdt} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], pricePerGbBdt: e.target.value }; setTiers(n); }} className="custom-input pr-10" placeholder="৳/GB" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">৳</span>
                        </div>
                        <button
                          type="button"
                          disabled={tiers.length <= 1}
                          onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                          className="text-zinc-600 hover:text-red-400 text-lg px-1 disabled:opacity-30"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {tErr && <p className="text-xs text-red-400 mt-2">{tErr}</p>}
                  {!tErr && (
                    <div className="mt-3 rounded-xl bg-black/40 border border-white/5 p-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {examples.map((ex) => (
                        <div key={ex.gb} className="text-center">
                          <div className="text-[10px] text-zinc-500 font-bold">{ex.gb} GB</div>
                          <div className="text-xs font-bold text-white">{ex.total === null ? "—" : `৳${ex.total.toLocaleString()}`}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setShowModal(false)} className="flex-1 bg-white/10 text-white font-bold rounded-xl">Cancel</Button>
                <Button onClick={handleSave} isDisabled={saving || (mode === "TIERED" && !!tErr)} className="flex-1 bg-cyan-600 text-white font-bold rounded-xl">
                  {saving ? "Saving…" : editing ? "Save changes" : "Create plan"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
