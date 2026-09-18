"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { siteContent } from "@/lib/content";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      notifyError("Passwords don't match", "Retype carefully.");
      return;
    }
    const token = new URLSearchParams(window.location.search).get("token") || "";
    if (!token) {
      notifyError("Invalid link", "This reset link is missing its token — request a fresh one.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await authClient.resetPassword({ newPassword: next, token });
      if (error) throw new Error(error.message || "Reset failed.");
      notifySuccess("Password saved", "Sign in with your new password.");
      router.push("/user/sign-in");
    } catch (err) {
      notifyError("Reset failed", err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Create New Password</h1>
            <p className="text-sm text-zinc-400 mt-2">Your password must be at least 8 characters.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSave}>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">New Password</label>
              <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="custom-input" placeholder="••••••••" required minLength={8} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Confirm New Password</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="custom-input" placeholder="••••••••" required minLength={8} />
            </div>

            <Button type="submit" isDisabled={saving} isPending={saving} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "Saving…" : "Save and Sign In"}
                </>
              )}
            </Button>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
