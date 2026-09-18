"use client";

import { ChartPie, Gear, Globe, Layers, ListCheck, Persons, Tag, Wallet, Terminal } from "@gravity-ui/icons";
import Link from "next/link";

/*
  Phase 3 - Step 43: AdminSidebar (admin layout).
  All routes live under the server-side ADMIN_PATH — passed in as
  basePath so the literal path never appears in client code.
*/

interface AdminSidebarProps {
  basePath: string;
  activePath?: string;
  pendingApprovals?: number;
}

export function AdminSidebar({ basePath, activePath, pendingApprovals = 0 }: AdminSidebarProps) {
  const items = [
    { label: "Overview", href: basePath, Icon: ChartPie, badge: 0 },
    { label: "Approvals", href: `${basePath}/approvals`, Icon: ListCheck, badge: pendingApprovals },
    { label: "Plans", href: `${basePath}/plans`, Icon: Layers, badge: 0 },
    { label: "Providers", href: `${basePath}/providers`, Icon: Globe, badge: 0 },
    { label: "Users", href: `${basePath}/users`, Icon: Persons, badge: 0 },
    { label: "Codes", href: `${basePath}/codes`, Icon: Tag, badge: 0 },
    { label: "Affiliates", href: `${basePath}/affiliates`, Icon: Persons, badge: 0 },
    { label: "Payouts", href: `${basePath}/payouts`, Icon: Wallet, badge: 0 },
    { label: "System Logs", href: `${basePath}/logs`, Icon: Terminal, badge: 0 },
    { label: "Settings", href: `${basePath}/settings`, Icon: Gear, badge: 0 },
  ];

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 overflow-x-auto border-r border-white/5 p-4 lg:flex">
      {items.map((item) => {
        const active = activePath === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
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
    </aside>
  );
}
