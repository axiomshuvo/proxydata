"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { Server, Globe } from "@gravity-ui/icons";
import { useState, useRef, useEffect } from "react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("dataimpulse");
  
  // Simulated Upstream Balances
  const [diBalance, setDiBalance] = useState(654.32);
  const [nnBalance, setNnBalance] = useState(182.50);
  
  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [detectedJump, setDetectedJump] = useState<number | null>(null);

  // Purchase Form State
  const [gbBought, setGbBought] = useState(0);
  const [usdPrice, setUsdPrice] = useState(0.85);
  const [exchangeRate, setExchangeRate] = useState(122.5);
  
  const wholesaleFormRef = useRef<HTMLDivElement>(null);
  
  const totalUsd = gbBought * usdPrice;
  const totalBdt = totalUsd * exchangeRate;
  const costPerGbBdt = totalBdt / (gbBought || 1);

  const handleSync = () => {
    setIsSyncing(true);
    setDetectedJump(null);
    
    // Simulate API fetch delay
    setTimeout(() => {
      setIsSyncing(false);
      // Simulate detecting that the admin bought 50GB from the provider recently
      const jump = 50; 
      
      if (activeTab === "dataimpulse") setDiBalance(prev => prev + jump);
      else setNnBalance(prev => prev + jump);
      
      setDetectedJump(jump);
      setGbBought(jump);
      
      // Scroll to the wholesale form so they can enter the price
      if (wholesaleFormRef.current) {
        wholesaleFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1500);
  };

  const handleLogPurchase = () => {
    // In a real app, this would POST to the DB and update history.
    setDetectedJump(null);
    setGbBought(0);
    alert("Purchase successfully logged to financial history!");
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/settings" title="Provider Settings">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Configure provider APIs, set retail pricing, and log wholesale purchases.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-8">
        <button 
          onClick={() => { setActiveTab("dataimpulse"); setDetectedJump(null); }}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "dataimpulse" ? "border-cyan-400 text-cyan-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
        >
          <Server width={16} /> DataImpulse
        </button>
        <button 
          disabled
          className="pb-4 text-sm font-bold flex items-center gap-2 border-b-2 border-transparent text-zinc-600 cursor-not-allowed"
          title="Coming soon"
        >
          <span className="w-4 h-4 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">+</span> Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config & Pricing */}
        <div className="lg:col-span-5 space-y-6">
          
          <GlassCard className="!bg-zinc-900/60 p-6 rounded-2xl shadow-lg border-white/5 space-y-6">
            <div className="border-b border-white/5 pb-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xs font-bold ${"text-cyan-400"}`}>1. UPSTREAM CONNECTION</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">CONNECTED</span>
              </div>
              
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">API Login</label>
                  <input type="text" className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none" defaultValue={activeTab === "dataimpulse" ? "di_prod_1a2b3c" : "nn_prod_9x8y7z"} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">API Password</label>
                  <input type="password" className="w-full bg-zinc-950 border border-white/10 text-zinc-300 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none" defaultValue="****************" />
                </div>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Upstream Balance</p>
                  <p className="text-xl font-bold text-white">
                    {activeTab === "dataimpulse" ? diBalance.toFixed(2) : nnBalance.toFixed(2)} GB
                  </p>
                </div>
                <button 
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`p-2 rounded-lg bg-white/5 transition-all ${isSyncing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10 text-zinc-300 hover:text-white"}`} 
                  title="Sync with Provider"
                >
                  <svg className={isSyncing ? "animate-spin text-cyan-400" : ""} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
                </button>
              </div>
            </div>

            <div className="pb-2">
              <h3 className={`text-xs font-bold mb-4 ${"text-cyan-400"}`}>2. RETAIL PRICING (SELLING)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">{activeTab === "dataimpulse" ? "Datacenter" : "Mobile 4G/5G"} (৳/GB)</label>
                  <input type="number" className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2 font-bold focus:outline-none" defaultValue={activeTab === "dataimpulse" ? 150 : 850} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Residential (৳/GB)</label>
                  <input type="number" className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2 font-bold focus:outline-none" defaultValue={activeTab === "dataimpulse" ? 250 : 450} />
                </div>
              </div>
            </div>
            
            <Button className={`w-full py-3 font-bold rounded-lg text-sm transition-all ${activeTab === "dataimpulse" ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20" : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20"}`}>
              Save Settings
            </Button>
          </GlassCard>
        </div>

        {/* Right Column: Wholesale Inventory & History */}
        <div className="lg:col-span-7 space-y-6" ref={wholesaleFormRef}>
          <GlassCard className={`!bg-zinc-900/60 p-6 rounded-2xl shadow-lg transition-colors duration-500 ${detectedJump ? (activeTab === "dataimpulse" ? "border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.15)]" : "border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.15)]") : "border-white/5"}`}>
            
            {detectedJump && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 ${activeTab === "dataimpulse" ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-300" : "bg-purple-500/10 border border-purple-500/20 text-purple-300"}`}>
                <div className="mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold mb-1">Stock Addition Detected!</p>
                  <p className="text-xs opacity-80">The API sync detected that your Upstream Balance increased by <strong>{detectedJump} GB</strong>. Please confirm the price you paid for this batch to log it accurately in your financial history.</p>
                </div>
              </div>
            )}

            <h3 className={`text-xs font-bold mb-4 ${"text-cyan-400"}`}>RECORD WHOLESALE PURCHASE</h3>
            <p className="text-[10px] text-zinc-500 mb-6">Log bulk stock purchases from {"DataImpulse"} to track your spending and calculate BDT cost margins.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1.5 transition-colors ${detectedJump ? ("text-cyan-400") : "text-zinc-400"}`}>
                  Total GB Bought {detectedJump && "(Auto-filled)"}
                </label>
                <input type="number" value={gbBought} onChange={(e) => setGbBought(Number(e.target.value))} className={`w-full bg-zinc-950 text-white rounded-lg px-4 py-2 font-bold focus:outline-none transition-colors border ${detectedJump ? (activeTab === "dataimpulse" ? "border-cyan-500/50" : "border-purple-500/50") : "border-white/10"}`} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">Provider Price ($/GB)</label>
                <input type="number" step="0.01" value={usdPrice} onChange={(e) => setUsdPrice(Number(e.target.value))} className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2 font-bold focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-1.5 uppercase">USD to BDT Rate (৳)</label>
                <input type="number" step="0.1" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2 font-bold focus:outline-none" />
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between mb-6 ${activeTab === "dataimpulse" ? "bg-cyan-500/5 border-cyan-500/10" : "bg-purple-500/5 border-purple-500/10"}`}>
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Total Spending</p>
                <p className="text-lg font-bold text-white">${totalUsd.toFixed(2)} <span className="text-sm text-zinc-500">/ ৳{totalBdt.toFixed(2)}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Cost Margin (৳/GB)</p>
                <p className={`text-lg font-bold ${"text-cyan-400"}`}>৳{costPerGbBdt.toFixed(2)} / GB</p>
              </div>
            </div>

            <Button 
              onClick={handleLogPurchase}
              className={`font-bold py-2 px-6 rounded-lg text-xs w-full sm:w-auto transition-colors ${detectedJump ? (activeTab === "dataimpulse" ? "bg-cyan-600 hover:bg-cyan-500 text-white" : "bg-purple-600 hover:bg-purple-500 text-white") : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"}`}
            >
              Add to History
            </Button>
          </GlassCard>

          <GlassCard className="!bg-zinc-900/60 p-6 rounded-2xl shadow-lg border-white/5 overflow-x-auto">
            <h3 className="text-xs font-bold text-white mb-4">PURCHASE HISTORY</h3>
            <table className="w-full text-left text-sm text-zinc-300 min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Volume</th>
                  <th className="pb-3 font-semibold">Rate ($)</th>
                  <th className="pb-3 font-semibold">Ex. Rate (৳)</th>
                  <th className="pb-3 font-semibold">Total (৳)</th>
                  <th className="pb-3 font-semibold text-right">Cost (৳/GB)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-zinc-400">Sep 15, 2026</td>
                  <td className="py-4 text-white font-bold">1,000 GB</td>
                  <td className="py-4 text-zinc-300">$0.85/GB</td>
                  <td className="py-4 text-zinc-300">122.50</td>
                  <td className="py-4 text-zinc-300 font-mono">৳104,125</td>
                  <td className="py-4 text-right font-bold text-white">৳104.13</td>
                </tr>
                <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 text-zinc-400">Aug 02, 2026</td>
                  <td className="py-4 text-white font-bold">500 GB</td>
                  <td className="py-4 text-zinc-300">$0.90/GB</td>
                  <td className="py-4 text-zinc-300">121.00</td>
                  <td className="py-4 text-zinc-300 font-mono">৳54,450</td>
                  <td className="py-4 text-right font-bold text-white">৳108.90</td>
                </tr>
              </tbody>
            </table>
          </GlassCard>
        </div>

      </div>
    </AdminShell>
  );
}
