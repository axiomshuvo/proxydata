"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useEffect, useState } from "react";
import { Plus, Pencil } from "@gravity-ui/icons";
import {
  getProvidersAdmin,
  saveProvider,
  testProviderConnection,
  type ProviderInput,
} from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

const POOLS = ["RESIDENTIAL", "MOBILE", "DATACENTER", "PREMIUM_RESIDENTIAL"] as const;
const DEFAULT_COEFF: Record<string, number> = { RESIDENTIAL: 1, DATACENTER: 0.5, MOBILE: 2, PREMIUM_RESIDENTIAL: 5 };

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<Record<string, string>>({});

  const [providerId, setProviderId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("DISABLED");
  const [pools, setPools] = useState<string[]>([...POOLS]);
  const [base, setBase] = useState("");
  const [coeffs, setCoeffs] = useState<Record<string, string>>(
    Object.fromEntries(POOLS.map((p) => [p, String(DEFAULT_COEFF[p])])),
  );
  const [host, setHost] = useState("gw.dataimpulse.com");
  const [httpPort, setHttpPort] = useState("823");
  const [socksPort, setSocksPort] = useState("824");

  const refresh = async () => {
    const rows = await getProvidersAdmin();
    setProviders(rows);
    setLoading(false);
  };

  useEffect(() => {
    refresh().catch(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setProviderId("");
    setName("");
    setStatus("DISABLED");
    setPools([...POOLS]);
    setBase("");
    setCoeffs(Object.fromEntries(POOLS.map((p) => [p, String(DEFAULT_COEFF[p])])));
    setHost("");
    setHttpPort("");
    setSocksPort("");
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    setProviderId(row.providerId);
    setName(row.name);
    setStatus(row.status);
    setPools(row.pools ?? []);
    setBase(String(row.wholesaleBaseBdt ?? 0));
    const c: Record<string, string> = {};
    for (const p of POOLS) c[p] = String(row.coefficients?.[p] ?? DEFAULT_COEFF[p]);
    setCoeffs(c);
    setHost(row.gateway?.host ?? "");
    setHttpPort(String(row.gateway?.httpPort ?? ""));
    setSocksPort(String(row.gateway?.socks5Port ?? ""));
    setFormError(null);
    setShowModal(true);
  };

  const togglePool = (p: string) =>
    setPools(pools.includes(p) ? pools.filter((x) => x !== p) : [...pools, p]);

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const input: ProviderInput = {
        providerId,
        name,
        status: status as ProviderInput["status"],
        pools: pools as ProviderInput["pools"],
        wholesaleBaseBdt: Number(base),
        coefficients: Object.fromEntries(pools.map((p) => [p, Number(coeffs[p])])),
        gateway: { host, httpPort: Number(httpPort), socks5Port: Number(socksPort) },
      };
      await saveProvider(input);
      setShowModal(false);
      notifySuccess("Provider saved", name);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setFormError(message);
      notifyError("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestMsg({ ...testMsg, [id]: "Testing…" });
    const res = await testProviderConnection(id);
    setTestMsg({ ...testMsg, [id]: res.message });
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/providers" title="Providers">
      <div className="mb-6 flex items-end justify-between">
        <p className="text-sm text-zinc-400">Upstream vendors. Plans, floors and stock all follow the ACTIVE provider rows. Secrets stay in env, never here.</p>
        <Button onClick={openCreate} className="bg-cyan-600 font-bold text-white hover:bg-cyan-500 rounded-xl px-5">
          <Plus width={16} /> New Provider
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providers.map((row) => (
            <GlassCard key={row._id} className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{row.name}</h3>
                  <p className="text-xs font-mono text-zinc-500">{row.providerId}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${row.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : row.status === "MAINTENANCE" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                  {row.status === "DISABLED" ? "Coming Soon" : row.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400 space-y-1.5 mb-4">
                <p>Pools: <span className="text-zinc-200 font-semibold">{(row.pools ?? []).join(", ") || "—"}</span></p>
                <p>Buying cost: <span className="text-white font-bold">৳{row.wholesaleBaseBdt ?? 0}/GB</span></p>
                <p>Floors: {(row.pools ?? []).map((p: string) => `${p} ৳${Math.ceil((row.wholesaleBaseBdt ?? 0) * (row.coefficients?.[p] ?? 1))}`).join(" · ") || "—"}</p>
                <p>Gateway: <span className="font-mono">{row.gateway?.host}:{row.gateway?.httpPort}/{row.gateway?.socks5Port}</span></p>
              </div>
              {testMsg[row.providerId] && <p className="text-xs text-zinc-400 mb-3">{testMsg[row.providerId]}</p>}
              <div className="flex gap-2">
                <Button onPress={() => openEdit(row)} className="bg-white/10 text-white text-xs font-bold rounded-lg px-3 h-8">
                  <Pencil width={14} /> Edit
                </Button>
                <Button onPress={() => handleTest(row.providerId)} className="bg-white/10 text-white text-xs font-bold rounded-lg px-3 h-8">
                  Test connection
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-2xl p-6 rounded-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6">{editing ? "Edit Provider" : "New Provider"}</h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">PROVIDER ID</label>
                  <input value={providerId} onChange={(e) => setProviderId(e.target.value.toLowerCase())} disabled={!!editing} className="custom-input font-mono" placeholder="brightdata" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">DISPLAY NAME</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="custom-input" placeholder="Bright Data" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">STATUS</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="custom-select">
                  <option value="ACTIVE">ACTIVE — sells plans</option>
                  <option value="MAINTENANCE">MAINTENANCE — hidden temporarily</option>
                  <option value="DISABLED">DISABLED — Coming Soon</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">POOLS THIS VENDOR SELLS</label>
                <div className="flex flex-wrap gap-2">
                  {POOLS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePool(p)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border ${pools.includes(p) ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300" : "border-white/10 text-zinc-500"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">BUYING COST (৳/GB — ONE PRICE)</label>
                <input type="number" min="0" value={base} onChange={(e) => setBase(e.target.value)} className="custom-input sm:w-64" placeholder="130" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">BILLING RULE (GB MULTIPLIER PER POOL)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pools.map((p) => (
                    <div key={p}>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1">{p}</label>
                      <input type="number" min="0" step="0.5" value={coeffs[p] ?? ""} onChange={(e) => setCoeffs({ ...coeffs, [p]: e.target.value })} className="custom-input" />
                      <p className="text-[11px] text-zinc-500 mt-1">Floor ৳{Math.ceil(Number(base || 0) * Number(coeffs[p] || 0))}</p>
                    </div>
                  ))}
                  {pools.length === 0 && <p className="text-xs text-zinc-500">Pick a pool first.</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">GATEWAY HOST</label>
                  <input value={host} onChange={(e) => setHost(e.target.value)} className="custom-input font-mono" placeholder="gw.dataimpulse.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">HTTP PORT</label>
                  <input type="number" value={httpPort} onChange={(e) => setHttpPort(e.target.value)} className="custom-input" placeholder="823" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">SOCKS5 PORT</label>
                  <input type="number" value={socksPort} onChange={(e) => setSocksPort(e.target.value)} className="custom-input" placeholder="824" />
                </div>
              </div>

              {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <Button onClick={() => setShowModal(false)} className="flex-1 bg-white/10 text-white font-bold rounded-xl">Cancel</Button>
                <Button onClick={handleSave} isDisabled={saving} className="flex-1 bg-cyan-600 text-white font-bold rounded-xl">
                  {saving ? "Saving…" : editing ? "Save changes" : "Add provider"}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
