"use client";
import { CustomerShell } from "@/components/layout/CustomerShell";

export default function CheckoutPage() {
  return (
    <CustomerShell activePath="/user/plans">
      <h1 className="text-2xl font-bold text-white mb-6">Complete Purchase</h1>
      <div className="glass-panel rounded-2xl p-6 max-w-lg space-y-6">
        <div>
          <h3 className="text-lg font-bold text-cyan-400">Datacenter (DataImpulse)</h3>
          <p className="text-zinc-400 text-sm">Targeting Coefficient: 1x</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-zinc-400 mb-2">Bandwidth Amount (GB)</label>
          <input type="number" className="custom-input" defaultValue="1" min="1" />
        </div>
        <div className="pt-4 border-t border-white/10">
          <label className="block text-xs font-semibold text-zinc-400 mb-2">bKash / Nagad Transaction ID</label>
          <input type="text" className="custom-input" placeholder="e.g. 9F8A7B6C5D" />
        </div>
        <button className="w-full py-3 bg-cyan-600 text-white font-bold rounded-lg shadow-lg">Submit for Approval (৳150)</button>
      </div>
    </CustomerShell>
  );
}
