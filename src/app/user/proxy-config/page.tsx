"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import Link from "next/link";
import useSWR from "swr";
import { useState, useEffect } from "react";
import { CopyBox } from "@/components/ui/CopyBox";
import { ArrowDownToLine, Copy } from "@gravity-ui/icons";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

// Instant client preview of the targeting suffix (display parts ONLY —
// the full proxy string with secret is composed server-side via the
// adapter's buildTargetingSuffix() on explicit Generate/Copy, 00 §6).
// Canonical grammar 03 §6; gateway table 03 §8. No `asn.` suffix: ASN keys
// were not verified — exclude_asn travels via set-default-pool-parameters.
function buildCurlCommand(params: any) {
  let username = params.login;
  const segments: string[] = [];

  if (params.country) {
    segments.push(`cr.${params.country.toLowerCase()}`);
    if (params.state) segments.push(`state.${params.state.toLowerCase()}`);
    if (params.city) segments.push(`city.${params.city.toLowerCase()}`);
    if (params.zip) segments.push(`zip.${params.zip.toLowerCase()}`);
  }

  if (params.mode === "STICKY" && params.sessionId) segments.push(`sessid.${params.sessionId}`);

  if (segments.length > 0) username += "__" + segments.join(";");

  const port =
    params.mode === "STICKY" && params.stickyPort
      ? params.stickyPort
      : params.protocol === "SOCKS5"
        ? "824"
        : "823";
  const scheme = params.protocol.toLowerCase();

  return `curl -x ${scheme}://${username}:${params.password}@gw.dataimpulse.com:${port} https://ipinfo.io`;
}

export default function ProxyConfigPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [localMeta] = useState(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("proxydata_meta");
      if (s) return JSON.parse(s);
    }
    return { locations: {}, stats: {} };
  });
  
  const { data: metaData } = useSWR("/api/proxy/meta", async (url: string) => {
    const res = await fetch(url);
    const json = await res.json();
    if (typeof window !== "undefined") localStorage.setItem("proxydata_meta", JSON.stringify(json));
    return json;
  }, { fallbackData: localMeta, revalidateOnFocus: false });

  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState<{ login: string; password: string } | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [config, setConfig] = useState({
    protocol: "HTTP",
    mode: "ROTATING",
    country: "",
    state: "",
    city: "",
    asn: "",
    sessionId: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const isDemo = accounts.length === 0;
  const demoAccount = {
    _id: "demo",
    proxyType: "PREMIUM_RESIDENTIAL",
    status: "ACTIVE",
    login: "demo_user_buy_bandwidth_to_unlock"
  };
  const activeList = isDemo ? [demoAccount] : accounts;
  const active = activeList[activeIdx] ?? null;

  useEffect(() => {
    fetch("/api/proxy/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, []);

  // Load the saved config whenever the pool tab changes.
  useEffect(() => {
    if (!active) return;
    setRevealed(null);
    setSaveMsg(null);
    fetch(`/api/proxy/config?proxyAccountId=${active._id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setConfig({
            protocol: d.config.protocol ?? "HTTP",
            mode: d.config.mode ?? "ROTATING",
            country: d.config.country ?? "",
            state: d.config.state ?? "",
            city: d.config.city ?? "",
            asn: "",
            sessionId: "",
          });
        }
      })
      .catch(() => {});
  }, [active?._id]);

  // Cascading updates
  const updateConfig = (key: string, value: string) => {
    const newConfig = { ...config, [key]: value };
    // Cascading rules: Changing country clears state/city. Changing state clears city.
    if (key === "country") {
      newConfig.state = "";
      newConfig.city = "";
    }
    if (key === "state") {
      newConfig.city = "";
    }
    if (key === "mode" && value === "STICKY") {
      newConfig.sessionId = Math.random().toString(36).substring(2, 10);
    }
    setConfig(newConfig);
  };

  const handleSave = async () => {
    if (!active) return;
    if (active._id === "demo") {
      notifyError("Demo Mode", "Purchase bandwidth to save configurations.");
      return;
    }
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/proxy/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, proxyAccountId: active._id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setSaveMsg("Configuration saved.");
      notifySuccess("Configuration saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Save failed.";
      setSaveMsg(message);
      notifyError("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReveal = async () => {
    if (!active) return;
    if (active._id === "demo") {
      setRevealing(true);
      setTimeout(() => {
        setRevealed({ login: active.login, password: "******************" });
        setRevealing(false);
      }, 600);
      return;
    }
    setRevealing(true);
    try {
      const res = await fetch("/api/proxy/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxyAccountId: active._id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reveal failed.");
      setRevealed({ login: data.login, password: data.password });
    } catch (e) {
      notifyError("Reveal failed", e instanceof Error ? e.message : "Reveal failed.");
    } finally {
      setRevealing(false);
    }
  };

  const login = revealed?.login ?? active?.login ?? "";
  const curlCommand = revealed
    ? buildCurlCommand({ ...config, login, password: revealed.password } as any)
    : "";
  const displayUsername = login
    ? buildCurlCommand({ ...config, login, password: "x" } as any).match(/:\/\/(.+?):/)?.[1] || login
    : "";

  const host = "gw.dataimpulse.com";
  const port = config.mode === "STICKY" && (config as any).stickyPort ? String((config as any).stickyPort) : config.protocol === "SOCKS5" ? "824" : "823";
  const finalUser = displayUsername || login;
  const pass = revealed ? revealed.password : "********";

  return (
    <CustomerShell activePath="/user/proxy-config">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/user/dashboard"
          className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors text-zinc-300"
        >
          &larr; Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Proxy Configuration
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure targeting and generate your proxy list.
          </p>
        </div>
      </div>

      {loadingAccounts ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
      <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={(e) => e.preventDefault()}>
          {/* Targeting Toggle */}
          <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="targeting_type" className="accent-cyan-500 w-4 h-4 mt-0.5" />
              <span className="text-sm font-medium text-zinc-300">Default Targeting</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="targeting_type" className="accent-cyan-500 w-4 h-4 mt-0.5" defaultChecked />
              <span className="text-sm font-medium text-cyan-400">Target Filters</span>
            </label>
            <div className="ml-auto flex gap-2">
              <button className="p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-zinc-400" title="Sort A-Z">&darr; A</button>
              <button className="p-1.5 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-zinc-400" title="Sort 9-1">&darr; 9</button>
            </div>
          </div>

          {/* Geo Targeting Fields */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex justify-between">
                Country
                {metaData?.locations ? <span className="text-emerald-400 text-[10px]">Live Sync</span> : <span className="text-zinc-500 text-[10px]">Loading...</span>}
              </label>
              <select 
                value={config.country} 
                onChange={(e) => { updateConfig("country", e.target.value); updateConfig("state", ""); updateConfig("city", ""); }}
                className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500"
              >
                <option value="">Select Country</option>
                {metaData?.locations && Array.isArray(metaData.locations) && metaData.locations.length > 0 ? (
                  metaData.locations.map((loc: any) => (
                    <option key={loc.country_code} value={loc.country_code.toLowerCase()}>
                      {loc.country_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="us">United States</option>
                    <option value="gb">United Kingdom</option>
                    <option value="de">Germany</option>
                    <option value="ca">Canada</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Region</label>
                <input 
                  type="text" 
                  value={config.state}
                  onChange={(e) => updateConfig("state", e.target.value)}
                  className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500" 
                  placeholder="All regions" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">City</label>
                <input 
                  type="text" 
                  value={config.city}
                  onChange={(e) => updateConfig("city", e.target.value)}
                  className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500" 
                  placeholder="All cities" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ISP</label>
                <select className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500">
                  <option>All ISPs</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ZIP</label>
                <select className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500">
                  <option>All zipcodes</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">ASN</label>
                <input 
                  type="text" 
                  value={config.asn}
                  onChange={(e) => updateConfig("asn", e.target.value)}
                  className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500" 
                  placeholder="All ASN's" 
                />
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
                Rotation interval <span className="w-3 h-3 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center text-zinc-300">?</span>
              </label>
              <input type="text" className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500" placeholder="type value from 0 to 120" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
                Exclude ASN <span className="w-3 h-3 rounded-full bg-zinc-700 text-[8px] flex items-center justify-center text-zinc-300">?</span>
              </label>
              <input type="text" className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500" placeholder="AS Numbers" />
            </div>
          </div>

          {/* Save/Clear Controls */}
          <div className="flex justify-end gap-4 border-b border-white/10 pb-8 mb-8">
            <button className="px-4 py-2 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium rounded-lg transition-colors">
              Clear configuration
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving || !active}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-cyan-500/20 transition-colors disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save configuration"}
            </button>
            {saveMsg && <span className="text-xs text-zinc-400 mt-2">{saveMsg}</span>}
          </div>

          {/* Protocol and Hostname */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Hostname</label>
              <select className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500">
                <option>DNS hostname (gw.dataimpulse.com)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Type</label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                  <input type="radio" name="proxy_mode" className="accent-cyan-500 w-4 h-4 mt-0.5" checked={config.mode === "ROTATING"} onChange={() => updateConfig("mode", "ROTATING")} />
                  Rotating
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-500">
                  <input type="radio" name="proxy_mode" className="accent-cyan-500 w-4 h-4 mt-0.5" checked={config.mode === "STICKY"} onChange={() => updateConfig("mode", "STICKY")} />
                  Sticky
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Protocol</label>
              <div className="space-y-2 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                  <input type="radio" name="proxy_protocol" className="accent-cyan-500 w-4 h-4 mt-0.5" checked={config.protocol === "HTTP"} onChange={() => updateConfig("protocol", "HTTP")} />
                  HTTP/HTTPS
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-500">
                  <input type="radio" name="proxy_protocol" className="accent-cyan-500 w-4 h-4 mt-0.5" checked={config.protocol === "SOCKS5"} onChange={() => updateConfig("protocol", "SOCKS5")} />
                  SOCKS5
                </label>
              </div>
            </div>
          </div>

          {/* Basic URL Example */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">
              Basic URL example
            </h3>
            <div className="bg-black/60 border border-white/10 rounded-lg p-4 flex items-center justify-between">
              <code className="text-xs text-zinc-400 font-mono overflow-x-auto whitespace-nowrap">
                {revealed ? (
                  <>curl -x <span className="text-green-400">"{config.protocol.toLowerCase()}://{finalUser}:{revealed.password}@{host}:{port}"</span> https://api.ipify.org/</>
                ) : (
                  <>Reveal password to generate cURL.</>
                )}
              </code>
              {revealed && (
              <button onClick={() => { navigator.clipboard.writeText(curlCommand); notifySuccess("Copied to clipboard"); }} className="ml-4 p-2 hover:bg-white/10 rounded text-zinc-500 hover:text-white transition-colors" title="Copy code" aria-label="Copy cURL command">
                <Copy width={16} />
              </button>
              )}
            </div>
          </div>

          {/* Output Generator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-semibold text-zinc-400">Proxy List</label>
                {!revealed && (
                  <button type="button" onClick={handleReveal} disabled={revealing} className="text-[10px] bg-cyan-600/20 text-cyan-400 px-2 py-1 rounded font-bold uppercase hover:bg-cyan-600/30">
                    {revealing ? "Revealing..." : "Reveal Password"}
                  </button>
                )}
              </div>
              <textarea 
                className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500 font-mono text-xs h-32 leading-relaxed resize-none" 
                readOnly 
                value={revealed ? `${host}:${port}:${finalUser}:${revealed.password}` : "********"}
              />
              <div className="flex gap-4 mt-4">
                <button onClick={() => { navigator.clipboard.writeText(`${host}:${port}:${finalUser}:${pass}`); notifySuccess("Copied"); }} className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={!revealed}>
                  <Copy width={16} />
                  Copy
                </button>
                <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50" disabled={!revealed}>
                  <ArrowDownToLine width={16} />
                  Download
                </button>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Quantity</label>
                <input type="number" className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500" defaultValue="1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Format</label>
                <select className="bg-zinc-900/80 border border-white/10 text-white px-3.5 py-2.5 rounded-lg text-sm w-full outline-none focus:border-cyan-500">
                  <option>hostname:port:login:password</option>
                  <option>login:password@hostname:port</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
      )}
    </CustomerShell>
  );
}
