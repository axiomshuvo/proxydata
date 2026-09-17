"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { CopyBox } from "@/components/ui/CopyBox";

// Helper function to simulate the engine logic on the client for instant feedback
// (This exactly mirrors src/lib/proxy/engine.ts)
function buildCurlCommand(params: any) {
  let username = params.login;
  const segments: string[] = [];

  if (params.country) {
    segments.push(`cr.${params.country.toLowerCase()}`);
    if (params.state) segments.push(`state.${params.state.toLowerCase()}`);
    if (params.city) segments.push(`city.${params.city.toLowerCase()}`);
    if (params.zip) segments.push(`zip.${params.zip.toLowerCase()}`);
  }
  
  if (params.asn) segments.push(`asn.${params.asn.toLowerCase()}`);
  if (params.mode === "STICKY" && params.sessionId) segments.push(`sessid.${params.sessionId}`);

  if (segments.length > 0) username += "__" + segments.join(";");

  const port = params.protocol === "SOCKS5" ? "9000" : "8000";
  const scheme = params.protocol.toLowerCase();
  
  return `curl -x ${scheme}://${username}:${params.password}@gw.dataimpulse.com:${port} https://ipinfo.io`;
}

export default function ProxyConfigPage() {
  const [config, setConfig] = useState({
    login: "dataimpulse_user",
    password: "proxy_password_123",
    protocol: "HTTP",
    mode: "ROTATING",
    country: "",
    state: "",
    city: "",
    asn: "",
    sessionId: ""
  });

  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
    try {
      // Mock proxyAccountId for Phase 8 testing (Phase 9 will inject real IDs)
      await fetch("/api/proxy/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, proxyAccountId: "test-proxy-id-01" })
      });
      // Allow visual feedback
      setTimeout(() => setIsSaving(false), 500);
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  const curlCommand = buildCurlCommand(config);

  return (
    <CustomerShell activePath="/user/proxy-config">
      <div>
        <h1>Proxy Generator</h1>
        <p>Configure your targeting and generate connection strings.</p>
      </div>

      <div>
        
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
                isDisabled={isSaving}
               
              >
                {isSaving ? "Saving..." : "Save Configuration"}
              </Button>
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
                  <CopyBox text={config.protocol === "SOCKS5" ? "9000" : "8000"} />
                </div>
                <div>
                  <label>Protocol</label>
                  <CopyBox text={config.protocol.toLowerCase()} />
                </div>
              </div>

              <div>
                <label>Username</label>
                <CopyBox 
                  text={buildCurlCommand(config).match(/:\/\/(.+?):/)?.[1] || config.login} 
                  
                />
              </div>

              <div>
                <label>Password</label>
                <CopyBox text={config.password} isPassword />
              </div>
            </div>

            <div>
              <label>Quick Test (cURL)</label>
              <div>
                <textarea 
                  readOnly 
                  value={curlCommand}
                 
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(curlCommand)}
                 
                >
                  COPY
                </button>
              </div>
            </div>
            
          </GlassCard>
        </div>
      </div>
    </CustomerShell>
  );
}
