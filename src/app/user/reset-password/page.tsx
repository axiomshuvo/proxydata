"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button, Spinner } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { siteContent } from "@/lib/content";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  // Expired/invalid links arrive as ?error=INVALID_TOKEN with no token —
  // show that immediately instead of a form that can only fail on submit.
  const [linkInvalid, setLinkInvalid] = useState(false);
  // Whose password this link resets (resolved from the live token).
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const token = q.get("token") || "";
    if (q.get("error") && !token) {
      setLinkInvalid(true);
      return;
    }
    if (!token) return;
    let cancelled = false;
    fetch(`/api/auth/reset-identity?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.email) setAccountEmail(data.email);
        else setLinkInvalid(true);
      })
      .catch(() => {
        if (!cancelled) setLinkInvalid(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            <p className="text-sm text-zinc-400 mt-2">
              {accountEmail ? (
                <>Resetting password for <span className="font-bold text-cyan-300">{accountEmail}</span></>
              ) : (
                "Your password must be at least 8 characters."
              )}
            </p>
          </div>

          {linkInvalid ? (
            <div className="space-y-5 text-center">
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                This reset link is invalid or expired (links last 1 hour and work once).
              </p>
              <Link href="/user/forgot-password" className="inline-block w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors">
                Request a fresh link
              </Link>
            </div>
          ) : (
          <form className="space-y-5" onSubmit={handleSave}>
            <PasswordInput label="New Password" name="new-password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="••••••••" isRequired minLength={8} />

            <PasswordInput label="Confirm New Password" name="confirm-password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" isRequired minLength={8} />

            <Button type="submit" isDisabled={saving} isPending={saving} className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "Saving…" : "Save and Sign In"}
                </>
              )}
            </Button>
          </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
