"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useRouter } from "next/navigation";
import { Button, Chip } from "@heroui/react";
import {
  ChartLine,
  Code,
  Comment,
  Comments,
  Cpu,
  Gear,
  Globe,
  ShieldCheck,
  Tag,
  Target,
  Thunderbolt,
} from "@gravity-ui/icons";

const USE_CASES = [
  {
    title: "Web Scraping",
    category: "Data Extraction",
    desc: "Conquer rankings, extract data legally with global access points to ensure clean, unfiltered HTML responses.",
    span: "lg:col-span-2",
    icon: Code
  },
  {
    title: "Proxies for AI",
    category: "Machine Learning",
    desc: "Scrape vast, unstructured global datasets securely to train Large Language Models without hitting rate limits.",
    span: "lg:col-span-1",
    icon: Cpu
  },
  {
    title: "Sneaker Proxies",
    category: "Retail / E-Com",
    desc: "Elevate sneaker hunting, secure coveted releases, and boost your shoe business with lightning-fast residential IPs.",
    span: "lg:col-span-1",
    icon: Thunderbolt
  },
  {
    title: "SERP Tracking",
    category: "SEO",
    desc: "Track clients' website rankings on search engines accurately across 150+ countries without access interruptions.",
    span: "lg:col-span-1",
    icon: ChartLine
  },
  {
    title: "Proxies for Botting",
    category: "Automation",
    desc: "Optimize for zero captchas, fewer manual verifications, and get the absolute most out of using automation scripts.",
    span: "lg:col-span-1",
    icon: Gear
  },
  {
    title: "Ad Verification",
    category: "Marketing",
    desc: "Ensure paid ads appear in the correct geographic locations, maximizing their effectiveness and preventing click fraud.",
    span: "lg:col-span-1",
    icon: Target
  },
  {
    title: "Brand Protection",
    category: "Security",
    desc: "Safeguard your brand's reputation, ensuring a positive public presence globally without regional targeting bias.",
    span: "lg:col-span-2",
    icon: ShieldCheck
  },
  {
    title: "Proxies for Telegram",
    category: "Social Media",
    desc: "Stay connected, stay private. Manage multiple social accounts seamlessly without triggering anti-spam flags.",
    span: "lg:col-span-1",
    icon: Comments
  },
  {
    title: "Website Availability",
    category: "DevOps",
    desc: "Test infrastructure globally without involving real users, conquer challenges, and ensure multi-region accessibility.",
    span: "lg:col-span-1",
    icon: Globe
  },
  {
    title: "Price Comparison",
    category: "Retail / E-Com",
    desc: "Stay ahead in e-commerce with effortless multi-platform price comparison across different localized regions.",
    span: "lg:col-span-1",
    icon: Tag
  },
  {
    title: "Proxies for Discord",
    category: "Social Media",
    desc: "Find fellow thinkers and enjoy communication without safety issues, latency, or strict Discord usage interruptions.",
    span: "lg:col-span-1",
    icon: Comment
  }
];

export default function UseCasesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-cyan-500/30 flex flex-col">
      <Navbar />

      <main className="flex-1 relative">
        {/* Header Section */}
        <div className="border-b border-white/5 bg-zinc-950 pt-24 pb-20 overflow-hidden relative">
          
          {/* Abstract background graphics */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center relative z-10 flex flex-col items-center">
            
            <Chip size="sm"  className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold mb-6 tracking-widest uppercase">
              Solutions & Infrastructure
            </Chip>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white mb-6 leading-none">
              Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Scale.</span>
            </h1>
            
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg sm:text-xl leading-relaxed">
              Check the use cases listed below to find the solution you were looking for. Let us help your business scale globally and bring more results than ever before.
            </p>
          </div>
        </div>

        {/* Bento Grid Section */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-20 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(280px,auto)]">
              {USE_CASES.map((uc, i) => (
                <div
                  key={uc.title}
                className={`group relative rounded-3xl bg-zinc-900/40 border border-white/5 p-8 sm:p-10 overflow-hidden backdrop-blur-xl transition-all duration-500 hover:border-cyan-500/40 hover:-translate-y-1 hover:shadow-glow-lift flex flex-col ${uc.span}`}
              >
                {/* Dynamic Hover Gradient inside card */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-indigo-500/0 group-hover:from-cyan-500/10 group-hover:to-indigo-500/5 transition-all duration-700 pointer-events-none" />
                
                {/* Top Border Glow (Subtle) */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/0 to-transparent group-hover:via-cyan-400/50 transition-all duration-700" />
                
                {/* Massive Number Watermark */}
                <div className="absolute -bottom-6 -right-6 text-[120px] font-black text-white/[0.02] pointer-events-none select-none group-hover:text-cyan-500/[0.05] transition-colors duration-700">
                  {(i + 1).toString().padStart(2, '0')}
                </div>

                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="w-14 h-14 bg-zinc-800/80 text-cyan-400 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 group-hover:scale-110 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/30 transition-all duration-500">
                    <uc.icon width={24} />
                  </div>
                  
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-cyan-400 transition-colors duration-500 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                    {uc.category}
                  </span>
                </div>
                
                <div className="relative z-10 mt-auto">
                  <h3 className="text-2xl font-extrabold text-white mb-4 tracking-tight">
                    {uc.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium max-w-sm">
                    {uc.desc}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="border-t border-white/5 bg-zinc-950 py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-60" />
          
          <div className="relative mx-auto max-w-3xl px-4 text-center z-10">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">deploy?</span>
            </h2>
            <p className="text-zinc-400 mb-10 text-lg sm:text-xl font-medium max-w-xl mx-auto leading-relaxed">
              Generate credentials instantly and connect to our massive global proxy pool in seconds. No KYC bottlenecks.
            </p>
            <Button 
              size="lg" 
              className="bg-white text-black font-extrabold text-lg px-10 py-7 rounded-2xl shadow-soft-lg hover:scale-105 transition-transform" 
              onPress={() => router.push("/user/sign-up")}
            >
              Start Building Now
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
