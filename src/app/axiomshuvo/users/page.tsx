"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { Magnifier, Persons, Star, StarFill, Xmark } from "@gravity-ui/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllUsers, updateUserStatus } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  
  const [confirmStatusModal, setConfirmStatusModal] = useState<{ userId: string, email: string, name: string, currentStatus: string } | null>(null);

  const confirmToggleStatus = async () => {
    if (!confirmStatusModal) return;
    const { userId, currentStatus } = confirmStatusModal;
    setBusyId(userId);
    try {
      const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateUserStatus(userId, newStatus);
      notifySuccess("Success", `User has been ${newStatus === "SUSPENDED" ? "suspended" : "restored"}.`);
      setConfirmStatusModal(null);
      await refresh();
    } catch (err: any) {
      notifyError("Failed", err.message || "Failed to update user status.");
    } finally {
      setBusyId(null);
    }
  };

  const refresh = async () => {
    try {
      setUsers(await getAllUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);


  const isAffiliate = (u: any) => (u.capabilities ?? []).includes("CAPABILITY_AFFILIATE");

  const visible = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (q && !(u.email?.toLowerCase().includes(q) || u.publicUserId?.toLowerCase().includes(q))) return false;
    if (filter === "AFFILIATES" && !isAffiliate(u)) return false;
    if (filter === "NORMAL" && isAffiliate(u)) return false;
    if (filter === "SUSPENDED" && u.status !== "SUSPENDED") return false;
    if (filter === "ACTIVE" && u.status !== "ACTIVE") return false;
    return true;
  });

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/users" title="Manage Users">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Search customers, manage account statuses, and grant the invite-only partner capability.</p>
      </div>

      {notice && <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">{notice}</p>}
      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">{error}</p>}

      <GlassCard className="!bg-zinc-900/60 p-6 rounded-2xl border-white/5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
              placeholder="Search by email or PX- ID..."
            />
            <Magnifier width={16} className="absolute left-3 top-3 text-zinc-500" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors w-40">
            <option value="ALL">All Users</option>
            <option value="ACTIVE">Active</option>
            <option value="NORMAL">Normal Users</option>
            <option value="AFFILIATES">Affiliates</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-zinc-300 min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Public ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold text-center">Account Type</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr 
                    key={user._id} 
                    onClick={() => router.push(`/axiomshuvo/users/${user.publicUserId}`)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 font-mono font-bold text-cyan-400 text-xs">{user.publicUserId}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold border border-white/5 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                          <Persons width={14} />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{user.email}</p>
                          <p className="text-[10px] text-zinc-500 uppercase">{user.name ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      {isAffiliate(user) ? (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded flex items-center justify-center gap-1 w-max mx-auto">
                          <StarFill width={12} />
                          AFFILIATE
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded border ${user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : user.status === "SUSPENDED" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-800 text-zinc-400 border-white/10"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {user.status === "ACTIVE" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmStatusModal({ userId: user.publicUserId, email: user.email, name: user.name ?? "", currentStatus: user.status }); }}
                          disabled={busyId === user.publicUserId}
                          className="inline-flex items-center justify-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          {busyId === user.publicUserId ? "..." : "Suspend"}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmStatusModal({ userId: user.publicUserId, email: user.email, name: user.name ?? "", currentStatus: user.status }); }}
                          disabled={busyId === user.publicUserId}
                          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                        >
                          {busyId === user.publicUserId ? "..." : "Restore"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Confirmation Modal */}
      {confirmStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="relative !bg-zinc-950 !border-white/10 w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <button onClick={() => setConfirmStatusModal(null)} className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-full"><Xmark width={14}/></button>
            <h3 className="text-xl font-bold text-white mb-2">
              {confirmStatusModal.currentStatus === "ACTIVE" ? "Suspend User?" : "Restore User?"}
            </h3>
            
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">User ID:</span> <span className="text-white font-mono">{confirmStatusModal.userId}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Name:</span> <span className="text-white">{confirmStatusModal.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Email:</span> <span className="text-white">{confirmStatusModal.email}</span></div>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              {confirmStatusModal.currentStatus === "ACTIVE" 
                ? "Are you sure you want to suspend this user? They will be instantly kicked out and their proxies will be blocked."
                : "Are you sure you want to restore this user? Their dashboard access and proxies will be reactivated."}
            </p>
            <div className="flex gap-3 justify-end">
              <Button onPress={() => setConfirmStatusModal(null)} className="bg-white/5 text-white font-bold rounded-xl">Cancel</Button>
              <Button 
                onPress={confirmToggleStatus} 
                className={confirmStatusModal.currentStatus === "ACTIVE" ? "bg-red-600 text-white font-bold rounded-xl" : "bg-emerald-500 text-black font-bold rounded-xl"}
                isDisabled={!!busyId}
              >
                {confirmStatusModal.currentStatus === "ACTIVE" ? "Confirm Suspend" : "Confirm Restore"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
