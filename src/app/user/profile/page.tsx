"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyBox } from "@/components/ui/CopyBox";
import { Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { updateOwnName } from "@/app/actions/profile";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function ProfilePage() {
  const { data: session } = authClient.useSession();
  const me = session?.user as unknown as { name?: string; email?: string; publicUserId?: string; image?: string } | undefined;

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  useEffect(() => {
    if (me?.name) setName(me.name);
  }, [me?.name]);

  const initials = (name || me?.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      const res = await updateOwnName(name);
      setName(res.name);
      notifySuccess("Profile updated");
    } catch (e) {
      notifyError("Save failed", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      notifyError("Passwords don't match", "Retype the new password carefully.");
      return;
    }
    if (next.length < 8) {
      notifyError("Too short", "Use at least 8 characters.");
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      });
      if (error) throw new Error(error.message || "Change failed.");
      setCurrent("");
      setNext("");
      setConfirm("");
      notifySuccess("Password changed", "Other sessions were signed out.");
    } catch (err) {
      // OAuth users have no local password — the reset-link path covers them.
      notifyError("Change failed", err instanceof Error ? err.message : "Change failed.");
    } finally {
      setSavingPw(false);
    }
  };

  const handleSetupLink = async () => {
    if (!me?.email) return;
    setSendingLink(true);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: me.email,
        redirectTo: "/user/reset-password",
      });
      if (error) throw new Error(error.message || "Send failed.");
      notifySuccess("Link sent", "Check your inbox for the secure setup link.");
    } catch (err) {
      notifyError("Send failed", err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSendingLink(false);
    }
  };

  return (
    <CustomerShell activePath="/user/profile">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-zinc-400 mt-2">Manage your profile, security, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        <div className="space-y-8">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 sm:p-8 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Personal Information
            </h2>

            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
              <div className="w-20 h-20 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl font-extrabold text-cyan-300">
                {initials}
              </div>
              <p className="text-[11px] text-zinc-500 max-w-[220px]">Avatars are generated initials — uploads are disabled (no file storage in v1).</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="custom-input font-semibold" placeholder="Your name" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Email Address</label>
                <input type="email" className="custom-input opacity-60 cursor-not-allowed" readOnly value={me?.email ?? ""} />
                <p className="text-[10px] text-zinc-500 mt-1.5">Email is permanent — contact support for changes.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Public Account ID</label>
                <CopyBox text={me?.publicUserId ?? ""} />
                <p className="text-[10px] text-zinc-500 mt-1.5">Share this ID with support if you need assistance.</p>
              </div>
            </div>
            <div className="pt-6">
              <Button onPress={handleSaveName} isDisabled={savingName} isPending={savingName} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-colors mt-2">
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Saving…" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard className="!bg-zinc-900/60 !border-white/10 p-6 sm:p-8 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Security Settings
            </h2>

            <form className="space-y-5" onSubmit={handlePassword}>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Current Password</label>
                <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="custom-input" placeholder="••••••••" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">New Password</label>
                <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="custom-input" placeholder="Min. 8 characters" required minLength={8} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">Confirm New Password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="custom-input" placeholder="Min. 8 characters" required minLength={8} />
              </div>

              <div className="pt-2">
                <Button type="submit" isDisabled={savingPw} isPending={savingPw} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors">
                  {({ isPending }) => (
                    <>
                      {isPending ? <Spinner color="current" size="sm" /> : null}
                      {isPending ? "Updating…" : "Update Password"}
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-white/5 pt-5">
              <p className="text-xs text-zinc-500 mb-3">Signed up with Google and never set a password?</p>
              <Button onPress={handleSetupLink} isDisabled={sendingLink} isPending={sendingLink} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-sm">
                {({ isPending }) => (
                  <>
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Sending…" : "Email me a setup link"}
                  </>
                )}
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </CustomerShell>
  );
}
