"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import Link from "next/link";
import { siteContent } from "@/lib/content";

export default function ForgotPasswordPage() {
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
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Reset Password</h1>
            <p className="text-sm text-zinc-400 mt-2">We'll send you a secure link to reset it.</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Email Address</label>
              <input type="email" className="custom-input" placeholder="name@company.com" required />
            </div>

            <button className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
              Send Reset Link
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-400">
            Remembered it? <Link href="/user/sign-in" className="text-white font-bold hover:text-cyan-400 transition-colors">Return to Sign In</Link>
          </p>
        </GlassCard>
      </div>
    </main>
  );
}
