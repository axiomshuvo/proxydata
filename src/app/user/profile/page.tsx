"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyBox } from "@/components/ui/CopyBox";
import { Button } from "@heroui/react";

export default function ProfilePage() {
  return (
    <CustomerShell activePath="/user/profile">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-zinc-400 mt-2">Manage your profile, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Left Column: Details */}
        <div className="space-y-8">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 sm:p-8 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Personal Information
            </h2>
            
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
              <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-xl" />
              <div>
                <Button className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors border border-white/5">
                  Change Avatar
                </Button>
                <p className="text-[10px] text-zinc-500 mt-2 max-w-[200px]">Supported formats: JPG, PNG, GIF. Max file size 2MB.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Full Name</label>
                <input type="text" className="custom-input font-semibold" defaultValue="Axiom Shuvo" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Email Address</label>
                <input type="email" className="custom-input opacity-60 cursor-not-allowed" readOnly value="axiomshuvo@proxydata.com" />
                <p className="text-[10px] text-zinc-500 mt-1.5">Contact support to change your email address.</p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Public Account ID</label>
                <CopyBox text="PX-8F392K" />
                <p className="text-[10px] text-zinc-500 mt-1.5">Share this ID with support if you need assistance.</p>
              </div>
            </div>
            <div className="pt-6">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Security */}
        <div className="space-y-8">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 sm:p-8 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Security Settings
            </h2>
            
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Current Password</label>
                <input type="password" className="custom-input" placeholder="••••••••" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">New Password</label>
                <input type="password" className="custom-input" placeholder="Min. 8 characters" required minLength={8} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Confirm New Password</label>
                <input type="password" className="custom-input" placeholder="Min. 8 characters" required minLength={8} />
              </div>

              <div className="pt-2">
                <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                  Update Password
                </Button>
              </div>
            </form>
          </GlassCard>

          </div>
      </div>
    </CustomerShell>
  );
}
