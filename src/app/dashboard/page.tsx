"use client";

import { CopyBox } from "@/components/ui/CopyBox";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, Globe, Shield, Video } from "@gravity-ui/icons";
import { Button, Select, SelectItem } from "@heroui/react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Navbar Stub */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight text-white">
            ProxyData
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                alt="Avatar"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header & Plan Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Proxy Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Manage your active plans and generate credentials.
            </p>
          </div>
          <div className="w-full sm:w-72 relative">
            <Select
              label="Active Plan / Provider"
              labelPlacement="outside"
              defaultSelectedKeys={["1"]}
              variant="faded"
              classNames={{
                trigger:
                  "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10",
                value: "text-cyan-50 font-bold",
                label:
                  "text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1",
              }}
            >
              <SelectItem key="1" value="1">
                Datacenter (DataImpulse) - 6.64 GB
              </SelectItem>
              <SelectItem key="2" value="2">
                Residential (DataImpulse) - 12.0 GB
              </SelectItem>
              <SelectItem key="3" value="3">
                Mobile (Provider B) - 2.5 GB
              </SelectItem>
            </Select>
          </div>
        </div>

        {/* Top Section: Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Proxy Access Card */}
          <GlassCard className="relative overflow-hidden md:col-span-1 lg:col-span-1 !bg-zinc-900/60 !border-white/10 !shadow-none">
            <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-widest shadow-lg">
              Datacenter
            </div>
            <h2 className="text-sm font-semibold text-white mb-4">
              Proxy Access
            </h2>

            <div className="space-y-3">
              <div className="flex items-center">
                <label className="w-20 text-xs text-zinc-400">Login:</label>
                <div className="flex-1">
                  <CopyBox text="3d1679d0e86cd4e30374" />
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-20 text-xs text-zinc-400">Password:</label>
                <div className="flex-1">
                  <CopyBox text="40c8680828f18ac8" />
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-20 text-xs text-zinc-400">Host:</label>
                <div className="flex-1">
                  <CopyBox text="gw.dataimpulse.com" />
                </div>
              </div>
              <div className="flex items-center">
                <label className="w-20 text-xs text-zinc-400">Port:</label>
                <div className="flex-1">
                  <CopyBox text="823" />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Usage Card */}
          <GlassCard className="flex flex-col justify-between !bg-zinc-900/60 !border-white/10 !shadow-none">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-white">Usage</h2>
                <div className="flex bg-black/50 border border-white/5 rounded-md p-0.5">
                  <button className="px-2 py-1 text-[10px] font-bold bg-zinc-700 text-white rounded shadow">
                    GB
                  </button>
                  <button className="px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white rounded">
                    MB
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <div className="text-xs text-zinc-400 mb-1">Traffic left:</div>
                <div className="text-3xl font-bold text-cyan-400">6.64 GB</div>
              </div>
            </div>
            <Button
              color="primary"
              className="w-full mt-6 shadow-lg shadow-cyan-500/20 font-bold"
            >
              Add GBs to this Plan
            </Button>
          </GlassCard>

          {/* Resources Card */}
          <GlassCard className="!bg-zinc-900/60 !border-white/10 !shadow-none">
            <h2 className="text-sm font-semibold text-white mb-4">Resources</h2>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <Globe width={16} /> Manage Whitelist IPs
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <Shield width={16} /> Manage Blocked Hosts
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <FileText width={16} /> API Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                >
                  <Video width={16} /> Video Tutorials
                </Link>
              </li>
            </ul>
          </GlassCard>
        </div>

        {/* Bottom Section: Proxy Configuration Generator */}
        <GlassCard className="shadow-xl !bg-zinc-900/60 !border-white/10">
          <h2 className="text-lg font-semibold text-white mb-6 border-b border-white/5 pb-4">
            Proxy Configuration
          </h2>
          <div className="text-center py-12 text-zinc-500 text-sm">
            (The Radio Toggles, Country Selectors, and Proxy List area will be
            wired up here to the Active Plan selector above.)
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
