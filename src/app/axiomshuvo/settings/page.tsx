"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProvidersAdmin, getSystemSettings, saveSystemSettings } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminSettingsPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [settings, setSettings] = useState({ pendingRequestExpiryDays: 7, affiliateMaxActiveCodes: 5, defaultCommissionPerGbBdt: 10, minimumOwnerProfitBdt: 15 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getProvidersAdmin(), getSystemSettings()])
      .then(([p, s]) => {
        setProviders(p);
        setSettings(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      await saveSystemSettings(settings);
      setNotice("System settings saved.");
      notifySuccess("Settings saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setError(message);
      notifyError("Save failed", message);
    } finally {
      setSaving(false);
    }
  };

  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/settings" title="System Settings">
      {notice && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">{notice}</p>}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Providers at a glance (managed on the Providers page) */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Providers</h3>
              <Link href="/axiomshuvo/providers" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">Manage →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providers.map((p) => (
                <div key={p.providerId} className="rounded-2xl bg-black/40 border border-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{p.providerId} · cost ৳{p.wholesaleBaseBdt ?? 0}/GB</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${p.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Business rules — exact keys only, no free-form env editing */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
            <h3 className="font-bold text-white mb-1">Business rules</h3>
            <p className="text-xs text-zinc-500 mb-5">Applies to new orders from save time. Transaction history is never rewritten.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PENDING ORDER EXPIRY (DAYS)</label>
                <input type="number" min="1" max="30" value={settings.pendingRequestExpiryDays} onChange={(e) => setSettings({ ...settings, pendingRequestExpiryDays: num(e.target.value, 7) })} className="custom-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">MAX ACTIVE PARTNER CODES</label>
                <input type="number" min="1" max="20" value={settings.affiliateMaxActiveCodes} onChange={(e) => setSettings({ ...settings, affiliateMaxActiveCodes: num(e.target.value, 5) })} className="custom-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">DEFAULT COMMISSION (৳/GB)</label>
                <input type="number" min="0" value={settings.defaultCommissionPerGbBdt} onChange={(e) => setSettings({ ...settings, defaultCommissionPerGbBdt: num(e.target.value, 10) })} className="custom-input" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">MINIMUM OWNER PROFIT (৳)</label>
                <input type="number" min="0" value={settings.minimumOwnerProfitBdt} onChange={(e) => setSettings({ ...settings, minimumOwnerProfitBdt: num(e.target.value, 15) })} className="custom-input" />
              </div>
            </div>
            <Button onClick={handleSave} isDisabled={saving} className="mt-5 bg-cyan-600 text-white font-bold rounded-xl px-8">
              {saving ? "Saving…" : "Save settings"}
            </Button>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
