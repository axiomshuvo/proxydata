"use client";

import { Ellipsis, Copy, Check, Globe, House, Person, Persons, Receipt, ShoppingCart, Ticket } from "@gravity-ui/icons";
import Link from "next/link";
import { useState } from "react";

interface SidebarProps {
  activePath?: string;
  showAffiliate?: boolean;
  userName?: string;
  userEmail?: string;
  publicId?: string;
  avatarUrl?: string;
}

interface Item {
  label: string;
  href: string;
  Icon: typeof House;
}

const PRIMARY: Item[] = [
  { label: "Dashboard", href: "/user/dashboard", Icon: House },
  { label: "Plans", href: "/user/plans", Icon: ShoppingCart },
  { label: "Proxy Config", href: "/user/proxy-config", Icon: Globe },
];

const SECONDARY: Item[] = [
  { label: "Transactions", href: "/user/transactions", Icon: Receipt },
  { label: "Redeem", href: "/user/redeem", Icon: Ticket },
  { label: "Affiliate", href: "/user/affiliate", Icon: Persons },
  { label: "Profile", href: "/user/profile", Icon: Person },
];

export function Sidebar({ 
  activePath = "/user/dashboard", 
  showAffiliate = false, 
  userName, 
  userEmail, 
  publicId = "PX-8F392K",
  avatarUrl 
}: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const secondary = SECONDARY.filter((item) => item.href !== "/user/affiliate" || showAffiliate);

  return (
    <>
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 p-4 lg:flex min-h-[calc(100vh-4rem)] sticky top-16">
        
        {/* User Card at top of Desktop Sidebar */}
        <div className="mb-8 flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-4 relative overflow-hidden">
          {/* Subtle accent glow behind avatar */}
          <div className="absolute left-0 top-0 w-16 h-16 bg-cyan-500/10 blur-xl rounded-full"></div>
          
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-10 w-10 rounded-full object-cover border border-white/10 relative z-10 shadow-lg" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-400 relative z-10 shadow-lg">
                {userName?.[0] || 'U'}
              </div>
            )}
            <div className="flex flex-col overflow-hidden relative z-10 w-full">
              <span className="truncate text-sm font-bold text-white">{userName || 'Axiom Shuvo'}</span>
              <span className="truncate text-[10px] text-zinc-500">{userEmail || 'axiomshuvo@proxydata.com'}</span>
            </div>
          </div>
          <div className="mt-1 pt-3 border-t border-white/5 relative z-10 flex justify-between items-center group">
            <span className="text-[10px] text-zinc-500 font-semibold uppercase">Account ID</span>
            <div className="flex items-center gap-1 bg-cyan-500/10 pl-2 pr-1 py-0.5 rounded border border-transparent group-hover:border-cyan-500/30 transition-colors">
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">{publicId}</span>
              <button 
                onClick={(e) => { 
                  e.preventDefault();
                  navigator.clipboard.writeText(publicId); 
                  setIdCopied(true); 
                  setTimeout(() => setIdCopied(false), 2000); 
                }} 
                className="p-1 text-cyan-500 hover:text-white transition-colors focus:outline-none rounded hover:bg-cyan-500/20"
              >
                {idCopied ? <Check width={10} className="text-emerald-400" /> : <Copy width={10} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-600 mb-2 px-4">Main Menu</div>
          {[...PRIMARY, ...secondary].map((item) => {
            const active = activePath === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${active ? "bg-cyan-500/10 font-bold text-cyan-400" : "text-zinc-400 font-medium hover:bg-white/5 hover:text-white"}`}>
                <item.Icon width={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur-md lg:hidden">
        <div className="grid grid-cols-4">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${activePath === item.href ? "text-cyan-400" : "text-zinc-500"}`}>
              <item.Icon width={22} />
              {item.label}
            </Link>
          ))}
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${moreOpen ? "text-cyan-400" : "text-zinc-500"}`}>
            <Ellipsis width={22} />
            More
          </button>
        </div>
        {moreOpen && (
          <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
            {secondary.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/5 px-3 text-sm font-medium text-zinc-300">
                <item.Icon width={16} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}
