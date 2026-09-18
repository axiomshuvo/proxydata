"use client";

import { Navbar } from "../ui/Navbar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Sidebar } from "../ui/Sidebar";
import { notifySuccess } from "../ui/ToastProvider";
import type { ReactNode } from "react";

interface CustomerShellProps {
  children: ReactNode;
  activePath: string;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  unreadCount?: number;
  showAffiliate?: boolean;
  onSignOut?: () => void;
}

export function CustomerShell({
  children,
  activePath,
  showAffiliate = false,
}: CustomerShellProps) {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const avatarUrl = session?.user?.image || "";
  const publicId = (session?.user as any)?.publicUserId || "";
  // Affiliate area is invite-only: sidebar link appears solely for users
  // carrying CAPABILITY_AFFILIATE (granted by admin). Never advertised.
  const capabilities = ((session?.user as any)?.capabilities ?? []) as string[];
  const isAffiliate = showAffiliate || capabilities.includes("CAPABILITY_AFFILIATE");
  
  const handleSignOut = async () => {
    await authClient.signOut();
    notifySuccess("Signed out");
    router.push("/user/sign-in");
  };
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase() || "US";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar
        isAuthed
        links={[]}
        userName={userName}
        userEmail={userEmail}
        publicId={publicId}
        avatarUrl={avatarUrl}
        unreadCount={0}
        onSignOut={handleSignOut}
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar activePath={activePath} showAffiliate={isAffiliate} userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
