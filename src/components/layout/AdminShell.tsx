"use client";

import {
  Envelope,
  Bars,
  Bell,
  ChartPie,
  Ellipsis,
  Gear,
  Globe,
  Layers,
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
import useSWR from "swr";

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
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: session } = authClient.useSession();
  const authed = !!session?.user;
  const router = useRouter();
  
  // Fetch global admin badges
  const { data: badges } = useSWR(authed ? "/api/axiomshuvo/badges" : null, (url: string) => fetch(url).then(r => r.json()), { refreshInterval: 60000 });
  const realPendingApprovals = badges?.pendingApprovals ?? pendingApprovals ?? 0;
  const realOpenTickets = badges?.openTickets ?? 0;
  
  const { data: notifData, mutate: mutateNotifs } = useSWR(authed ? "/api/notifications" : null, (url: string) => fetch(url).then(r => r.json()), { refreshInterval: 60000 });
  const realUnreadCount = notifData?.unreadCount ?? 0;
  const notifications = notifData?.notifications ?? [];
  
  const handleMarkAllRead = async () => {
    if (!authed) return;
    await fetch("/api/notifications/read", { method: "POST" });
    mutateNotifs({ ...notifData, unreadCount: 0, notifications: notifications.map((n: any) => ({ ...n, read: true })) });
  };

  const handleNotificationClick = async (n: any) => {
    setNotifOpen(false);
    if (!n.read) {
      fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: n._id }) });
      const updated = notifications.map((notif: any) => notif._id === n._id ? { ...notif, read: true } : notif);
      mutateNotifs({ ...notifData, unreadCount: Math.max(0, realUnreadCount - 1), notifications: updated }, false);
    }
    if (n.targetUrl) {
      router.push(n.targetUrl);
    }
  };

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
    { label: "Plans", href: `${basePath}/plans`, Icon: Layers, badge: 0 },
{ label: "Providers", href: `${basePath}/providers`, Icon: Globe, badge: 0 },
    { label: "Tickets", href: `${basePath}/tickets`, Icon: Envelope, badge: 0 },
    { label: "Users", href: `${basePath}/users`, Icon: Persons, badge: 0 },
    { label: "Codes", href: `${basePath}/codes`, Icon: Tag, badge: 0 },
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
              className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors focus:outline-none"
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
                {realUnreadCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-black border border-zinc-950">
                    {realUnreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 pb-2 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                    {realUnreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] text-cyan-400 hover:underline">Mark all as read</button>
                    )}
                  </div>
                  <div className="flex flex-col max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-zinc-500 text-xs">No notifications yet.</div>
                    ) : (
                      notifications.map((n: any) => (
                        <div 
                          key={n._id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex gap-3 transition-colors ${n.read ? 'opacity-60' : ''}`}
                        >
                          {!n.read && <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 shadow-glow-dot"></div>}
                          <div className={n.read ? 'ml-5' : ''}>
                            <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{n.title}</p>
                            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-zinc-500 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))
                    )}
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
        <div className="fixed inset-0 z-50 flex lg:hidden">
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
          pendingApprovals={realPendingApprovals}
          openTickets={realOpenTickets}
        />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 lg:pb-10">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
          {children}
        </main>
      </div>

      {/* App-like bottom bar on phones/tablets (desktop uses the sidebar).
          Overview · Approvals · Plans · More — approvals badge included. */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4">
          {items.slice(0, 3).map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-cyan-400" : "text-zinc-500"}`}
              >
                <item.Icon width={22} />
                {item.label}
                {item.badge > 0 && (
                  <span className="absolute top-2 right-1/2 translate-x-5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${moreOpen ? "text-cyan-400" : "text-zinc-500"}`}
          >
            <Ellipsis width={22} />
            More
          </button>
        </div>
        {moreOpen && (
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
            {items.slice(3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm font-medium text-zinc-300"
              >
                <item.Icon width={16} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
