"use client";
import { ADMIN_PREVIEW_BASE } from "@/lib/admin";
import { Bell, Check, Copy, Envelope, House, Person, ShoppingCart } from "@gravity-ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  links?: NavLink[];
  isAuthed?: boolean;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  publicId?: string;
  avatarUrl?: string;
  unreadCount?: number;
  onSignOut?: () => void;
}

const PUBLIC_LINKS: NavLink[] = [
  { label: "Plans", href: "/plans" },
  { label: "Contact", href: "/contact" },
];

export function Navbar({
  links = PUBLIC_LINKS,
  isAuthed = false,
  userInitials = "US",
  userName = "User",
  userEmail = "user@example.com",
  publicId = "PX-8F392K",
  avatarUrl,
  unreadCount = 2,
  onSignOut,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const pathname = usePathname();
  // Session-aware: public pages render bare <Navbar/> — derive auth state here
  // so logged-in users never see the logged-out view (Sign In button, etc.).
  const { data: session } = authClient.useSession();
  const authed = isAuthed || !!session?.user;
  const sessionRole = (session?.user as unknown as { role?: string } | undefined)?.role;
  const isAdmin = sessionRole === "ROLE_ADMIN";
  // Props win when shells pass real user data; otherwise fall back to the
  // live session so public pages show the true logged-in identity (never placeholders).
  const su = session?.user as unknown as { name?: string; email?: string; image?: string; publicUserId?: string } | undefined;
  const displayName = userName !== "User" ? userName : (su?.name || "User");
  const displayEmail = userEmail !== "user@example.com" ? userEmail : (su?.email || "");
  const displayPublicId = publicId !== "PX-8F392K" ? publicId : (su?.publicUserId || "");
  const displayAvatar = avatarUrl || su?.image || "";
  const displayInitials = userInitials !== "US" ? userInitials : (displayName.split(" ").map((n) => n[0]).join("").toUpperCase() || "US");
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-lg">P</div>
          <span className="font-bold text-xl tracking-tight text-white hidden sm:block">Proxy<span className="text-cyan-400">Data</span></span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="min-h-11 content-center text-sm font-semibold text-zinc-400 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {authed ? (
            <>
              {/* Notifications Dropdown */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                  aria-label="Notifications" 
                  className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-400 hover:text-white transition-colors focus:outline-none"
                >
                  <Bell width={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-black border border-zinc-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl py-3 z-50">
                    <div className="px-4 pb-2 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bold text-white text-sm">Notifications</h3>
                      <button className="text-[10px] text-cyan-400 hover:underline">Mark all as read</button>
                    </div>
                    <div className="flex flex-col max-h-80 overflow-y-auto">
                      <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-bold text-white">Purchase Successful</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Your 5GB Datacenter bandwidth has been applied to your account.</p>
                          <p className="text-[10px] text-zinc-500 mt-1">2 hours ago</p>
                        </div>
                      </div>
                      <div className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-bold text-white">Promo Redeemed</p>
                          <p className="text-xs text-zinc-400 mt-0.5">You successfully claimed the WELCOME50 discount.</p>
                          <p className="text-[10px] text-zinc-500 mt-1">1 day ago</p>
                        </div>
                      </div>
                      <div className="px-4 py-3 hover:bg-white/5 cursor-pointer flex gap-3 opacity-60">
                        <div className="w-2 h-2 rounded-full bg-transparent mt-1.5 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-bold text-zinc-300">Welcome to ProxyData</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Setup your first proxy by navigating to the Proxy Config tab.</p>
                          <p className="text-[10px] text-zinc-500 mt-1">3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2 focus:outline-none bg-white/5 hover:bg-white/10 rounded-full pr-3 transition-colors border border-white/5"
                >
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Avatar" className="h-9 w-9 rounded-full object-cover border-2 border-zinc-950" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-zinc-950 bg-cyan-500/15 text-sm font-bold text-cyan-300">
                      {displayInitials}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-xs font-bold text-white leading-tight">{displayName}</span>
                    <span className="text-[10px] text-cyan-400 font-mono tracking-widest">{displayPublicId}</span>
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-sm font-bold text-white">{displayName}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{displayEmail}</p>
                      <div className="mt-2 bg-black/40 border border-white/5 rounded-md pl-2 pr-1 py-1 flex items-center justify-between group">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">ID</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-mono text-cyan-400">{displayPublicId}</span>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              navigator.clipboard.writeText(displayPublicId); 
                              setIdCopied(true); 
                              setTimeout(() => setIdCopied(false), 2000); 
                            }} 
                            className="p-1 text-zinc-500 hover:text-white transition-colors focus:outline-none rounded hover:bg-white/10"
                          >
                            {idCopied ? <Check width={12} className="text-emerald-400" /> : <Copy width={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link href="/user/profile" className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white">Account Settings</Link>
                      {/* Real authorization boundary: session role. Never a display-name check. */}
                      {isAdmin && (
                        <Link href={ADMIN_PREVIEW_BASE} className="block px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 font-bold border-t border-white/5 mt-1 pt-2">Admin Dashboard</Link>
                      )}
                    </div>
                    <div className="border-t border-white/5 py-1">
                      <button onClick={onSignOut || (() => window.location.href = '/user/sign-in')} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 font-semibold">Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link href="/user/sign-in" className="flex min-h-11 items-center rounded-xl bg-cyan-500 px-5 text-sm font-bold text-black hover:bg-cyan-400 shadow-lg shadow-cyan-500/20">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>

    {/* App-like bottom bar on small screens for public navigation.
        CustomerShell passes links={[]} (its Sidebar owns the authed bottom bar),
        so this renders on public pages only. Account resolves to dashboard when logged in. */}
    {links.length > 0 && (
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4">
          {[
            { label: "Home", href: "/", Icon: House },
            { label: "Plans", href: "/plans", Icon: ShoppingCart },
            { label: "Contact", href: "/contact", Icon: Envelope },
            { label: "Account", href: authed ? "/user/dashboard" : "/user/sign-in", Icon: Person },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${pathname === item.href ? "text-cyan-400" : "text-zinc-500"}`}
            >
              <item.Icon width={22} />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    )}
    </>
  );
}
