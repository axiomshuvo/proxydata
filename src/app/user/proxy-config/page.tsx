"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { CopyBox } from "@/components/ui/CopyBox";
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

  const active = accounts[activeIdx] ?? null;

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

  return (
    <CustomerShell activePath="/user/proxy-config">
      <div>
        <h1>Proxy Generator</h1>
        <p>Configure your targeting and generate connection strings.</p>
      </div>

      {loadingAccounts ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : accounts.length === 0 ? (
        <GlassCard>
          <p className="text-sm text-zinc-400">No proxy pools yet — buy bandwidth first, then configure it here.</p>
        </GlassCard>
      ) : (
      <div>
        {/* Pool tabs — entitled pools only (backend still 403s the rest) */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {accounts.map((a: any, i: number) => (
            <button
              key={a._id}
              onClick={() => setActiveIdx(i)}
              disabled={a.status !== "ACTIVE"}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${i === activeIdx ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-zinc-400"} disabled:opacity-40`}
            >
              {a.proxyType}{a.status !== "ACTIVE" ? " (locked)" : ""}
            </button>
          ))}
        </div>

        {/* Left Column: Configuration Controls */}
        <div>
          <GlassCard>
            <h2>Connection Settings</h2>
            
            <div>
              {/* Protocol */}
              <div>
                <label>Protocol</label>
                <div>
                  <button 
                    onClick={() => updateConfig("protocol", "HTTP")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${config.protocol === "HTTP" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    HTTP(S)
                  </button>
                  <button 
                    onClick={() => updateConfig("protocol", "SOCKS5")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${config.protocol === "SOCKS5" ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    SOCKS5
                  </button>
                </div>
              </div>

              {/* Session Mode */}
              <div>
                <label>Session Mode</label>
                <div>
                  <button 
                    onClick={() => updateConfig("mode", "ROTATING")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${config.mode === "ROTATING" ? "bg-purple-500/20 text-purple-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Rotating IP
                  </button>
                  <button 
                    onClick={() => updateConfig("mode", "STICKY")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${config.mode === "STICKY" ? "bg-purple-500/20 text-purple-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    Sticky IP
                  </button>
                </div>
              </div>
            </div>

            <h2>Geo-Targeting</h2>
            
            <div>
              {/* Country */}
              <div>
                <label>Country Code</label>
                <input 
                  type="text" 
                  value={config.country}
                  onChange={(e) => updateConfig("country", e.target.value)}
                  placeholder="e.g. us, de, gb" 
                 
                />
              </div>

              {/* State */}
              <div>
                <label>State (Optional)</label>
                <input 
                  type="text" 
                  value={config.state}
                  onChange={(e) => updateConfig("state", e.target.value)}
                  disabled={!config.country}
                  placeholder="e.g. ca, tx" 
                 
                />
              </div>

              {/* City */}
              <div>
                <label>City (Optional)</label>
                <input 
                  type="text" 
                  value={config.city}
                  onChange={(e) => updateConfig("city", e.target.value)}
                  disabled={!config.state}
                  placeholder="e.g. los_angeles" 
                 
                />
              </div>
            </div>

            <div>
              {/* ASN */}
              <div>
                <label>ISP / ASN (Optional)</label>
                <input 
                  type="text" 
                  value={config.asn}
                  onChange={(e) => updateConfig("asn", e.target.value)}
                  placeholder="e.g. 7018" 
                 
                />
              </div>
            </div>

            <div>
              <Button
                onPress={handleSave}
                isDisabled={isSaving || !active}

              >
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
              {saveMsg && <p className="text-xs text-zinc-400 mt-2">{saveMsg}</p>}
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Output Generator */}
        <div>
          <GlassCard>
            <div>
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
              </div>
              <div>
                <h3>Generated Proxy</h3>
                <p>Ready to use</p>
              </div>
            </div>

            <div>
              <div>
                <label>Gateway Host</label>
                <CopyBox text="gw.dataimpulse.com" />
              </div>
              
              <div>
                <div>
                  <label>Port</label>
                  <CopyBox text={config.mode === "STICKY" && (config as any).stickyPort ? String((config as any).stickyPort) : config.protocol === "SOCKS5" ? "824" : "823"} />
                </div>
                <div>
                  <label>Protocol</label>
                  <CopyBox text={config.protocol.toLowerCase()} />
                </div>
              </div>

              <div>
                <label>Username</label>
                <CopyBox
                  text={displayUsername || login}

                />
              </div>

              <div>
                <label>Password (masked — reveal once to use)</label>
                {revealed ? (
                  <CopyBox text={revealed.password} isPassword />
                ) : (
                  <Button
                    onPress={handleReveal}
                    isDisabled={revealing || !active}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs"
                  >
                    {revealing ? "Revealing…" : "Reveal password"}
                  </Button>
                )}
              </div>
            </div>

            <div>
              <label>Quick Test (cURL)</label>
              {revealed ? (
              <div>
                <textarea
                  readOnly
                  value={curlCommand}

                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(curlCommand);
                    notifySuccess("Copied to clipboard");
                  }}

                >
                  COPY
                </button>
              </div>
              ) : (
                <p className="text-xs text-zinc-500">Reveal the password to generate the full connection string.</p>
              )}
            </div>

          </GlassCard>
        </div>
      </div>
      )}
    </CustomerShell>
  );
}
