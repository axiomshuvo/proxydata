"use client";

import { CustomerShell } from "@/components/layout/CustomerShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { CopyBox } from "@/components/ui/CopyBox";
import { Button, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { updateOwnName, updateOwnAvatar } from "@/app/actions/profile";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";
import { Lock, Person } from "@gravity-ui/icons";

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notifyError("File too large", "Please select an image under 5MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await updateOwnAvatar(formData);
      notifySuccess("Avatar updated successfully!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      notifyError("Upload failed", error instanceof Error ? error.message : "ImgBB upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

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
              <Person width={20} className="text-cyan-400" />
              Personal Information
            </h2>

            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/5">
              <label className="relative block w-20 h-20 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-2xl font-extrabold text-cyan-300 cursor-pointer overflow-hidden group hover:border-cyan-400/50 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                {me?.image ? (
                  <img src={me.image} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Spinner size="sm" color="current" />
                  </div>
                )}
                {!uploadingAvatar && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 pt-1 pb-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold text-white tracking-wider">EDIT</span>
                  </div>
                )}
              </label>
              <div className="flex flex-col gap-1 max-w-[220px]">
                <p className="text-[11px] font-semibold text-zinc-300">Profile Picture</p>
                <p className="text-[10px] text-zinc-500 leading-tight">JPG, PNG or GIF (Max 5MB). Hosted securely via ImgBB.</p>
              </div>
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
              <Lock width={20} className="text-amber-400" />
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
