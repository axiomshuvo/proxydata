"use client";
import { AdminShell } from "@/components/layout/AdminShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@heroui/react";
import { Magnifier, Persons, Sliders, Star, StarFill } from "@gravity-ui/icons";
import { useState } from "react";

const initialUsers = [
  { id: "PX-8F392K", email: "client@company.com", joined: "2 days ago", role: "NORMAL", status: "ACTIVE" },
  { id: "PX-A74B92", email: "influencer@youtube.com", joined: "1 month ago", role: "AFFILIATE", status: "ACTIVE" },
  { id: "PX-22L9M1", email: "dev@startup.io", joined: "5 hours ago", role: "NORMAL", status: "ACTIVE" },
  { id: "PX-X99Z88", email: "banned@hacker.com", joined: "2 months ago", role: "NORMAL", status: "SUSPENDED" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);

  const handleUpgrade = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: "AFFILIATE" } : u));
  };

  const handleRevoke = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: "NORMAL" } : u));
  };

  return (
    <AdminShell basePath="/axiomshuvo" activePath="/axiomshuvo/users" title="Manage Users">
      <div className="mb-8">
        <p className="text-sm text-zinc-400">Search customers, manage account statuses, and upgrade users to VIP Affiliate partners.</p>
      </div>

      <GlassCard className="!bg-zinc-900/60 p-6 rounded-2xl border-white/5 shadow-xl">
        
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="relative w-full max-w-sm">
            <input 
              type="text" 
              className="w-full bg-zinc-950 border border-white/10 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors" 
              placeholder="Search by email or PX- ID..." 
            />
            <Magnifier width={16} className="absolute left-3 top-3 text-zinc-500" />
          </div>
          <div className="flex gap-2">
            <select className="bg-zinc-950 border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm focus:border-cyan-500 focus:outline-none transition-colors w-40">
              <option>All Users</option>
              <option>Normal Users</option>
              <option>Affiliates</option>
              <option>Suspended</option>
            </select>
            <Button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors flex items-center justify-center">
              <Sliders width={16} />
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
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
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold border border-white/5">
                        <Persons width={14} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.email}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">Joined {user.joined}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono font-bold text-zinc-400 text-xs">{user.id}</td>
                  <td className="py-4 text-center">
                    {user.role === "AFFILIATE" ? (
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
                    {user.status === "ACTIVE" ? (
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">ACTIVE</span>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded border border-red-500/20">SUSPENDED</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.role === "NORMAL" ? (
                        <button 
                          onClick={() => handleUpgrade(user.id)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-[10px] uppercase rounded transition-colors flex items-center gap-1.5"
                        >
                          <Star width={12} />
                          Upgrade to Affiliate
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRevoke(user.id)}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-[10px] uppercase rounded transition-colors"
                        >
                          Revoke Affiliate
                        </button>
                      )}
                      <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] uppercase rounded transition-colors">
                        Manage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </AdminShell>
  );
}
