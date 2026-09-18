"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { siteContent } from "@/lib/content";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // Identical response either way (no account oracle). Rate limits apply.
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/user/reset-password",
      });
      if (error) throw new Error(error.message || "Send failed.");
      setSent(true);
      notifySuccess("Link sent", "Check your inbox for the secure reset link.");
    } catch (err) {
      notifyError("Send failed", err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

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
            <p className="text-sm text-zinc-400 mt-2">We&apos;ll send you a secure link to reset it.</p>
          </div>

          {sent ? (
            <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              If an account exists for {email}, a reset link is on its way (valid 24h, one request/day).
            </p>
          ) : (
            <form className="space-y-5" onSubmit={handleSend}>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="custom-input" placeholder="name@company.com" required />
              </div>

              <Button type="submit" isDisabled={sending} isPending={sending} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Sending…" : "Send Reset Link"}
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-zinc-400">
            Remembered it? <Link href="/user/sign-in" className="text-white font-bold hover:text-cyan-400 transition-colors">Return to Sign In</Link>
          </p>
        </GlassCard>
      </div>
    </main>
  );
}
