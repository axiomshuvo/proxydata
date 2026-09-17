"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useState } from "react";
import { Plus, Shuffle } from "@gravity-ui/icons";

export default function AdminCouponsPage() {
  const [showModal, setShowModal] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState("GB");

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "PD-";
    for (let i = 0; i < 8; i++) {
      if (i === 4) code += "-";
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromoCode(code);
  };

  const handleOpenModal = () => {
    generateCode();
    setShowModal(true);
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/coupons" title="Coupons">
      <div className="flex justify-between items-end mb-6">
        <p className="text-sm text-zinc-400">Manage promotional codes and gift bandwidth.</p>
        <Button 
          onClick={handleOpenModal}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
        >
          <Plus width={16} />
          Create Coupon
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-xl p-6 sm:p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">Create New Coupon</h3>
            
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setShowModal(false); }}>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-1">PROMO CODE (UPPERCASE)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900 border border-white/10 text-white rounded-lg pl-4 pr-12 py-3 font-mono font-bold tracking-widest focus:border-cyan-500 focus:outline-none" 
                    placeholder="e.g. FLASH50" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={generateCode}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-white/5 hover:bg-white/10 rounded-md text-cyan-400 flex items-center justify-center transition-colors"
                    title="Generate Random Code"
                  >
                    <Shuffle width={14} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">DISCOUNT TYPE</label>
                  <select 
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 text-white rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="GB">Free Bandwidth (GB)</option>
                    <option value="PERCENT">% Percentage off</option>
                    <option value="FIXED">৳ Fixed amount off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">
                    {discountType === "GB" ? "GIGABYTES TO GRANT" : "AMOUNT"}
                  </label>
                  <input type="number" step="0.01" className="w-full bg-zinc-900 border border-white/10 text-white font-bold rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none" placeholder={discountType === "GB" ? "e.g. 5" : "e.g. 50"} required />
                </div>
              </div>

              {discountType === "GB" && (
                <div className="grid grid-cols-2 gap-4 bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/10">
                  <div>
                    <label className="block text-xs font-bold text-cyan-500/80 mb-1">TARGET PROVIDER</label>
                    <select className="w-full bg-zinc-900 border border-white/10 text-white rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none">
                      <option value="dataimpulse">DataImpulse</option>
                      <option value="netnut">NetNut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyan-500/80 mb-1">PROXY TYPE</label>
                    <select className="w-full bg-zinc-900 border border-white/10 text-white rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none">
                      <option value="residential">Residential</option>
                      <option value="datacenter">Datacenter</option>
                      <option value="mobile">Mobile (4G/5G)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">MAX USAGE LIMIT</label>
                  <input type="number" className="w-full bg-zinc-900 border border-white/10 text-white rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none" placeholder="Leave empty for ∞" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">EXPIRY DATE</label>
                  <input type="date" className="w-full bg-zinc-900 border border-white/10 text-zinc-400 rounded-lg px-4 py-3 focus:border-cyan-500 focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                <Button onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg py-5">Cancel</Button>
                <Button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg py-5 shadow-lg shadow-cyan-500/20">Generate Coupon</Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      <GlassCard className="!bg-zinc-900/60 p-6 overflow-x-auto rounded-2xl shadow-lg border-white/5">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead>
            <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="pb-3 font-semibold">Code</th>
              <th className="pb-3 font-semibold">Reward</th>
              <th className="pb-3 font-semibold text-center">Usage</th>
              <th className="pb-3 font-semibold">Expires</th>
              <th className="pb-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 font-mono font-bold text-cyan-400">PD-FREE-5GB</td>
              <td className="py-4 text-white font-bold">5GB DataImpulse Resi</td>
              <td className="py-4 text-center">
                <span className="text-white">12</span> <span className="text-zinc-500">/ 100</span>
              </td>
              <td className="py-4 text-zinc-400">Dec 31, 2026</td>
              <td className="py-4 text-right">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">ACTIVE</span>
              </td>
            </tr>
            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-4 font-mono font-bold text-cyan-400">WELCOME50</td>
              <td className="py-4 text-white font-bold">50% OFF</td>
              <td className="py-4 text-center">
                <span className="text-white">50</span> <span className="text-zinc-500">/ 50</span>
              </td>
              <td className="py-4 text-zinc-400">Nov 01, 2026</td>
              <td className="py-4 text-right">
                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded">DEPLETED</span>
              </td>
            </tr>
          </tbody>
        </table>
      </GlassCard>
    </AdminShell>
  );
}
