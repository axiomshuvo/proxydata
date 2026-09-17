"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { siteContent } from "@/lib/content";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      <div className="hero-glow"></div>
      
      <nav className="absolute top-0 w-full p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-lg">P</div>
          <span className="font-bold text-xl tracking-tight text-white">{siteContent.company.name}</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <GlassCard className="w-full max-w-md p-8 sm:p-10 !bg-zinc-900/80 !border-white/10 rounded-3xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Create New Password</h1>
            <p className="text-sm text-zinc-400 mt-2">Your password must be at least 8 characters.</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">New Password</label>
              <input type="password" className="custom-input" placeholder="••••••••" required minLength={8} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Confirm New Password</label>
              <input type="password" className="custom-input" placeholder="••••••••" required minLength={8} />
            </div>

            <button className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
              Save and Sign In
            </button>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
