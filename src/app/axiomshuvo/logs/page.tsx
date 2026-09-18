"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useEffect, useState } from "react";

interface Health {
  resellerBalanceGb: number | null;
  adapterReachable: boolean;
  adapterLatencyMs: number;
  storageUsedMb: number;
  storageLimitMb: number;
  emailSentToday: number;
  emailLimit: number;
  time: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [provider, setProvider] = useState("ALL");
  const [q, setQ] = useState("");
  const [auto, setAuto] = useState(true);

  const fetchLogs = async () => {
    const params = new URLSearchParams({ level, source, provider, q, limit: "100" });
    const res = await fetch(`/api/axiomshuvo/logs?${params.toString()}`);
    const data = await res.json();
    if (data.logs) setLogs(data.logs);
    if (data.health) setHealth(data.health);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, source, provider]);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(fetchLogs, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, level, source, provider, q]);

  const storagePct = health ? Math.min(100, Math.round((health.storageUsedMb / health.storageLimitMb) * 100)) : 0;

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/logs" title="System Logs">
      {/* Runtime health strip */}
      {health && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Reseller stock</p>
            <p className="text-xl font-extrabold text-white mt-1">
              {health.resellerBalanceGb === null ? "Unknown" : `${health.resellerBalanceGb} GB`}
            </p>
            <p className={`text-[11px] mt-1 font-semibold ${health.adapterReachable ? "text-emerald-400" : "text-red-400"}`}>
              {health.adapterReachable ? `Reachable · ${health.adapterLatencyMs} ms` : "Unreachable"}
            </p>
          </GlassCard>
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase">DB storage</p>
            <p className="text-xl font-extrabold text-white mt-1">{health.storageUsedMb} <span className="text-xs text-zinc-500">/ {health.storageLimitMb} MB</span></p>
            <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full ${storagePct > 80 ? "bg-red-500" : "bg-cyan-500"}`} style={{ width: `${storagePct}%` }} />
            </div>
          </GlassCard>
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Email today</p>
            <p className="text-xl font-extrabold text-white mt-1">{health.emailSentToday}<span className="text-xs text-zinc-500"> / {health.emailLimit}</span></p>
            <p className="text-[11px] text-zinc-500 mt-1">100/day Hostinger cap</p>
          </GlassCard>
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Showing</p>
            <p className="text-xl font-extrabold text-white mt-1">{logs.length}</p>
            <p className="text-[11px] text-zinc-500 mt-1">newest first · op/audit kept forever, runtime 30d</p>
          </GlassCard>
        </div>
      )}

      {/* Filters */}
      <GlassCard className="!bg-zinc-900/60 !border-white/10 p-4 rounded-2xl mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
            placeholder="Search operation / message… (Enter)"
            className="custom-input flex-1"
          />
          <div className="flex gap-2">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="custom-select">
              <option value="ALL">All levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
            <select value={source} onChange={(e) => setSource(e.target.value)} className="custom-select">
              <option value="ALL">All sources</option>
              <option value="adapter">adapter</option>
              <option value="admin">admin</option>
              <option value="api">api</option>
              <option value="cron">cron</option>
              <option value="auth">auth</option>
              <option value="email">email</option>
              <option value="system">system</option>
            </select>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="custom-select">
              <option value="ALL">All providers</option>
              <option value="dataimpulse">dataimpulse</option>
            </select>
            <button
              onClick={() => setAuto(!auto)}
              className={`px-4 rounded-xl text-xs font-bold border ${auto ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300" : "border-white/10 text-zinc-500"}`}
            >
              {auto ? "Live" : "Paused"}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Stream */}
      <GlassCard className="!bg-zinc-900/60 !border-white/10 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-10">No log rows yet — approve an order or wait for runtime events.</p>
        ) : (
          <ul className="divide-y divide-white/5 font-mono text-xs max-h-[60vh] overflow-y-auto">
            {logs.map((l) => (
              <li key={`${l.source}-${l._id}`} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-zinc-600 whitespace-nowrap">{l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}</span>
                <span className={`font-bold w-12 shrink-0 ${l.level === "ERROR" ? "text-red-400" : l.level === "WARN" ? "text-amber-400" : "text-cyan-400"}`}>
                  {l.level}
                </span>
                <span className="text-zinc-500 w-16 shrink-0">{l.source}{l.provider ? `:${l.provider}` : ""}</span>
                <span className="text-zinc-200 flex-1 break-words">{l.operation ? `[${l.operation}] ` : ""}{l.message}</span>
                {l.refId && <span className="text-zinc-600 truncate max-w-[140px]">{String(l.refId).slice(-12)}</span>}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </AdminShell>
  );
}
