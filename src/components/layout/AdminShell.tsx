"use client";

import {
  Bars,
  Bell,
  ChartPie,
  Gear,
  ListCheck,
  Persons,
  Tag,
  Terminal,
  Wallet,
  Xmark,
} from "@gravity-ui/icons";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AdminSidebar } from "../ui/AdminSidebar";

interface AdminShellProps {
  children: ReactNode;
  basePath: string;
  activePath?: string;
  pendingApprovals?: number;
  title: string;
}

export function AdminShell({
  children,
  basePath,
  activePath,
  pendingApprovals = 0,
  title,
}: AdminShellProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const router = useRouter();

  const userName = session?.user?.name || "Admin";
  const userEmail = session?.user?.email || "";
  const avatarUrl = session?.user?.image || "";
  const publicId = (session?.user as any)?.publicUserId || "";
  
  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/user/sign-in");
  };

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { label: "Overview", href: basePath, Icon: ChartPie, badge: 0 },
    {
      label: "Approvals",
      href: `${basePath}/approvals`,
      Icon: ListCheck,
      badge: pendingApprovals,
    },
    { label: "Users", href: `${basePath}/users`, Icon: Persons, badge: 0 },
    { label: "Coupons", href: `${basePath}/coupons`, Icon: Tag, badge: 0 },
    {
      label: "Affiliates",
      href: `${basePath}/affiliates`,
      Icon: Persons,
      badge: 0,
    },
    { label: "Payouts", href: `${basePath}/payouts`, Icon: Wallet, badge: 0 },
    { label: "Settings", href: `${basePath}/settings`, Icon: Gear, badge: 0 },
    {
      label: "System Logs",
      href: `${basePath}/logs`,
      Icon: Terminal,
      badge: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
            >
              <Bars width={20} />
            </button>
            <Link href="/user/dashboard" className="flex items-center gap-2">
              <p className="text-lg font-bold text-white">
                Proxy<span className="text-cyan-400">Data</span>
                <span className="ml-2 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Admin
                </span>
              </p>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors focus:outline-none"
              >
                <Bell width={20} />
                <span className="absolute top-1 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center">
                    <p className="text-sm font-bold text-white">
                      System Alerts
                    </p>
                    <span className="text-[10px] font-bold bg-white/10 text-zinc-300 px-2 py-0.5 rounded">
                      3 New
                    </span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-amber-400 mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Low Stock Alert
                      </p>
                      <p className="text-[11px] text-zinc-300">
                        NetNut inventory dropped below 200 GB. Est runtime is 12
                        days.
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase">
                        10 minutes ago
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-emerald-400 mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        New Affiliate Signup
                      </p>
                      <p className="text-[11px] text-zinc-300">
                        User PX-99A1B2 generated their first affiliate referral.
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase">
                        1 hour ago
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-cyan-400 mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                        Daily Backup Complete
                      </p>
                      <p className="text-[11px] text-zinc-300">
                        MongoDB cluster snapshot saved successfully (14.2 MB).
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-1 uppercase">
                        5 hours ago
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 p-2 text-center">
                    <button className="text-xs text-zinc-400 hover:text-white font-semibold transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 focus:outline-none bg-white/5 hover:bg-white/10 rounded-full pr-0 sm:pr-3 transition-colors border border-white/5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-amber-500/30 bg-amber-500/10 text-sm font-bold text-amber-400">
                  {userName?.[0] || 'A'}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-bold text-white leading-tight">
                    {userName || 'Admin System'}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono tracking-widest">
                    OWNER
                  </span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-bold text-white">{userName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <div className="py-1">
                    
                    <Link
                      href={basePath + "/settings"}
                      className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                    >
                      System Config
                    </Link>
                  </div>
                  <div className="border-t border-white/5 py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 font-semibold"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="relative flex w-full max-w-xs flex-col bg-zinc-950 border-r border-white/5 animate-in slide-in-from-left-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <p className="text-lg font-bold text-white">
                Admin <span className="text-amber-400">Menu</span>
              </p>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
              >
                <Xmark width={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {items.map((item) => {
                const active = activePath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                      active
                        ? "bg-cyan-500/15 font-semibold text-cyan-300"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.Icon width={18} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-black">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        <AdminSidebar
          basePath={basePath}
          activePath={activePath}
          pendingApprovals={pendingApprovals}
        />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-10 sm:px-6">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
