"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { getAdminStats, getPendingTransactions, approveTransaction } from "@/app/actions/admin";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pendingTx, setPendingTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsData, txData] = await Promise.all([
        getAdminStats(),
        getPendingTransactions()
      ]);
      setStats(statsData);
      setPendingTx(txData);
    } catch (e) {
      console.error(e);
      alert("Failed to load admin data (Are you definitely an admin?)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (txId: string) => {
    if (!confirm("Are you sure you received the payment? This will grant live proxy bandwidth.")) return;
    
    setApprovingId(txId);
    try {
      await approveTransaction(txId);
      alert("Transaction approved! Bandwidth allocated successfully.");
      loadData(); // Refresh UI
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <AdminShell activePath="/axiomshuvo" basePath="/axiomshuvo" title="Executive Dashboard">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activePath="/axiomshuvo" basePath="/axiomshuvo" title="Executive Dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          <span className="text-amber-400">Admin</span> Control Center
        </h1>
        <p className="text-sm text-zinc-400 mt-2">Manage orders, approve payments, and view revenue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="!bg-zinc-900/60 !border-amber-500/20 p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-amber-500/80 uppercase tracking-wider mb-2">Total Revenue</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">৳{stats?.totalRevenue || 0}</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Total Users</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{stats?.totalUsers || 0}</span>
          </div>
        </GlassCard>

        <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pending Orders</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{stats?.pendingTxCount || 0}</span>
          </div>
        </GlassCard>
      </div>

      <div className="space-y-6">
        <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Pending Approvals</h2>
          </div>
          
          <div className="space-y-4">
            {pendingTx.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500 text-sm font-semibold">No pending transactions. All caught up!</p>
              </div>
            ) : (
              pendingTx.map((tx: any) => (
                <div key={tx._id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase">Pending</span>
                      <h4 className="text-sm font-bold text-white">{tx.planNameSnapshot}</h4>
                    </div>
                    <div className="text-xs font-mono text-zinc-500">TxID: {tx._id}</div>
                    <div className="text-xs text-zinc-400 mt-1">User: {tx.userId}</div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-3">
                    <div className="text-lg font-extrabold text-white">৳{tx.amountTaka}</div>
                    <Button 
                      onPress={() => handleApprove(tx._id)}
                      isDisabled={approvingId === tx._id}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg h-8 px-4 text-xs"
                    >
                      {approvingId === tx._id ? "Allocating..." : "Approve Payment"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </AdminShell>
  );
}
