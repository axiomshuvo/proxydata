"use client";

import { Navbar } from "../ui/Navbar";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Sidebar } from "../ui/Sidebar";
import { notifySuccess } from "../ui/ToastProvider";
import type { ReactNode } from "react";
import { ShieldCheck } from "@gravity-ui/icons";
import Link from "next/link";

interface CustomerShellProps {
  children: ReactNode;
  activePath: string;
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
  const isSuspended = (session?.user as any)?.status === "SUSPENDED";
  
  const handleSignOut = async () => {
    await authClient.signOut();
    notifySuccess("Signed out");
    router.push("/user/sign-in");
  };
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase() || "US";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {isSuspended && (
        <div className="w-full bg-red-600 text-white px-4 py-2 text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-2 z-[60] relative shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck width={16} />
            <span>ACCOUNT SUSPENDED</span>
          </div>
          <span className="hidden sm:inline">—</span>
          <span className="text-red-100 text-center font-normal">Your proxy access and purchasing abilities have been frozen.</span>
          <Link href="/contact" className="underline hover:text-white ml-2 text-white font-bold">Contact Support</Link>
        </div>
      )}
      <Navbar
        isAuthed
        links={[]}
        userName={userName}
        userEmail={userEmail}
        publicId={publicId}
        avatarUrl={avatarUrl}
        onSignOut={handleSignOut}
      />
      <div className="mx-auto flex max-w-7xl">
        <Sidebar activePath={activePath} showAffiliate={isAffiliate} userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
