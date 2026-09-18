"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { Magnifier, Persons, Star, StarFill } from "@gravity-ui/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllUsers, setAffiliate, updateUserStatus } from "@/app/actions/admin";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const run = async (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(okMsg);
      notifySuccess(okMsg);
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Action failed.";
      setError(message);
      notifyError("Action failed", message);
    } finally {
      setBusyId(null);
      setConfirmSuspend(null);
    }
  };

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
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Public ID</th>
                  <th className="pb-3 font-semibold text-center">Account Type</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((user) => (
                  <tr key={user._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold border border-white/5">
                          <Persons width={14} />
                        </div>
                        <div>
                          <p className="font-bold text-white">{user.email}</p>
                          <p className="text-[10px] text-zinc-500 uppercase">{user.name ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono font-bold text-zinc-400 text-xs">{user.publicUserId}</td>
                    <td className="py-4 text-center">
                      {isAffiliate(user) ? (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded flex items-center justify-center gap-1 w-max mx-auto">
                          <StarFill width={12} />
                          AFFILIATE
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded">
                          NORMAL USER
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded border ${user.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : user.status === "SUSPENDED" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-zinc-800 text-zinc-400 border-white/10"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/axiomshuvo/users/${user.publicUserId}`}
                          className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] uppercase rounded transition-colors"
                        >
                          View
                        </Link>
                        {!isAffiliate(user) ? (
                          <button
                            onClick={() => run(user.publicUserId, () => setAffiliate(user.publicUserId, true), "Partner capability granted.")}
                            disabled={busyId === user.publicUserId}
                            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase rounded transition-colors flex items-center gap-1.5 disabled:opacity-40"
                          >
                            <Star width={12} />
                            Grant Affiliate
                          </button>
                        ) : (
                          <button
                            onClick={() => run(user.publicUserId, () => setAffiliate(user.publicUserId, false), "Partner capability revoked (history kept).")}
                            disabled={busyId === user.publicUserId}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-[10px] uppercase rounded transition-colors disabled:opacity-40"
                          >
                            Revoke Affiliate
                          </button>
                        )}
                        {user.status === "ACTIVE" ? (
                          <button
                            onClick={() => setConfirmSuspend(user)}
                            disabled={busyId === user.publicUserId}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[10px] uppercase rounded transition-colors disabled:opacity-40"
                          >
                            Suspend
                          </button>
                        ) : user.status === "SUSPENDED" ? (
                          <button
                            onClick={() => run(user.publicUserId, () => updateUserStatus(user.publicUserId, "ACTIVE"), "Account restored.")}
                            disabled={busyId === user.publicUserId}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase rounded transition-colors disabled:opacity-40"
                          >
                            Restore
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-zinc-500 text-sm">No users match.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {confirmSuspend && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard className="!bg-zinc-950 !border-white/10 w-full max-w-md p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Suspend {confirmSuspend.email}?</h3>
            <p className="text-xs text-zinc-400 mb-4">Fail-closed: provider sub-users are blocked first, sessions revoked, then the account flips. Balances are kept for forensics.</p>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmSuspend(null)} className="flex-1 bg-white/10 text-white font-bold rounded-xl">Cancel</Button>
              <Button
                onClick={() => run(confirmSuspend.publicUserId, () => updateUserStatus(confirmSuspend.publicUserId, "SUSPENDED"), "Account suspended.")}
                isDisabled={busyId === confirmSuspend.publicUserId}
                className="flex-1 bg-red-600 text-white font-bold rounded-xl"
              >
                {busyId === confirmSuspend.publicUserId ? "Blocking…" : "Confirm suspend"}
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </AdminShell>
  );
}
