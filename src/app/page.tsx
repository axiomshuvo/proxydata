"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Chip } from "@heroui/react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Check, ShieldCheck, Thunderbolt, Globe, Lock, Layers } from "@gravity-ui/icons";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <Navbar />
      <main className="flex-1">
        
        {/* PREMIUM HERO SECTION */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-cyan-500/20 via-purple-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 text-center">
            <Chip color="default" variant="soft" className="mb-6 bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Enterprise-Grade Network
            </Chip>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
              Premium Proxies for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Any Scale.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-400 mb-10">
              From rotating residential networks for heavy scraping, to high-speed dedicated IPs for social management. Choose the perfect infrastructure for your needs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="w-full sm:w-auto bg-cyan-500 text-black font-bold shadow-glow-lg" onPress={() => router.push("/user/sign-up")}>
                Create Free Account
              </Button>
              <Button size="lg" className="w-full sm:w-auto bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10" onPress={() => router.push("/plans")}>
                View Pricing
              </Button>
            </div>

            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-zinc-500">
              <span className="flex items-center gap-2"><ShieldCheck width={18} className="text-emerald-400" /> 99.9% Uptime</span>
              <span className="flex items-center gap-2"><Globe width={18} className="text-cyan-400" /> Global Targeting</span>
              <span className="flex items-center gap-2"><Lock width={18} className="text-purple-400" /> HTTP / SOCKS5</span>
            </div>
          </div>
        </section>

        {/* USE CASES & FEATURES */}
        <section className="border-t border-white/5 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Built for Performance</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">Our infrastructure is designed to handle everything from social media management to heavy-duty data extraction.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Globe, title: "Precise Targeting", desc: "Target down to the specific Country, State, or City level globally." },
                { icon: Thunderbolt, title: "Instant Delivery", desc: "Credentials are automatically generated and assigned the moment you pay." },
                { icon: ShieldCheck, title: "Secure & Private", desc: "100% anonymous routing. Your real IP is never exposed to targets." },
                { icon: Layers, title: "Sticky & Rotating", desc: "Keep the same IP for long sessions or rotate on every single request." },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                  <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon width={28} />
                  </div>
                  <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW TO BUY (bKash / Nagad) */}
        <section className="relative py-24 border-t border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-cyan-500/5" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold mb-16">Frictionless Checkout</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="w-12 h-12 bg-white text-black font-black text-xl rounded-full flex items-center justify-center mx-auto mb-6">1</div>
                <h4 className="font-bold text-lg mb-2">Create Account</h4>
                <p className="text-sm text-zinc-400">Sign up instantly with Email or Google.</p>
              </div>
              <div className="relative">
                <div className="hidden md:block absolute top-6 -left-1/2 w-full border-t-2 border-dashed border-white/10" />
                <div className="w-12 h-12 bg-cyan-500 text-black font-black text-xl rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">2</div>
                <h4 className="font-bold text-lg mb-2">Pay Securely</h4>
                <p className="text-sm text-zinc-400 mb-4">Manual verify, approved fast.</p>
                <div className="flex items-center justify-center gap-3">
                  {/* bKash Badge */}
                  <div className="bg-[#E2136E] text-white px-3 py-1 rounded-lg font-bold text-[11px] tracking-wider shadow-lg flex items-center gap-1">
                    bKash
                  </div>
                  {/* Nagad Badge */}
                  <div className="bg-[#ED1C24] text-white px-3 py-1 rounded-lg font-bold text-[11px] tracking-wider shadow-lg flex items-center gap-1">
                    Nagad
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="hidden md:block absolute top-6 -left-1/2 w-full border-t-2 border-dashed border-white/10" />
                <div className="w-12 h-12 bg-purple-500 text-white font-black text-xl rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">3</div>
                <h4 className="font-bold text-lg mb-2">Get Proxies</h4>
                <p className="text-sm text-zinc-400">Generate working proxy strings in seconds.</p>
              </div>
            </div>
            
            <div className="mt-16">
              <Button size="lg" className="w-full sm:w-auto bg-white text-black font-bold" onPress={() => router.push("/plans")}>
                Explore the Catalog
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
