import Link from "next/link";
import { ShieldCheck, Lock } from "@gravity-ui/icons";

export function Footer() {
  return (
    <footer className="relative bg-zinc-950 overflow-hidden pt-16">
      {/* Subtle Top Glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-12">
          
          {/* Brand Column (Spans 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <p className="text-2xl font-black text-white tracking-tight">
                Proxy<span className="text-cyan-400">Data</span>
              </p>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Premium proxy infrastructure for data extraction, social media management, and enterprise automation. Fast, ethical, and completely pay-as-you-go.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Infrastructure</h3>
            <ul className="space-y-3">
              <li><Link href="/plans" className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors">Residential Proxies</Link></li>
              <li><Link href="/plans" className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors">Mobile Proxies</Link></li>
              <li><Link href="/plans" className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors">Datacenter Proxies</Link></li>
              <li><Link href="/use-cases" className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors">Use Cases</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link href="/terms" className="text-sm text-zinc-400 hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/user/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">Client Portal</Link></li>
            </ul>
          </div>

          {/* Trust & Payments */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-white mb-4">Secure Payments</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <img src="/providers/bkash.webp" alt="bKash" width={225} height={225} loading="lazy" decoding="async" className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                <img src="/providers/nagad.webp" alt="Nagad" width={225} height={225} loading="lazy" decoding="async" className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg">
                  <ShieldCheck width={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">100% Secure</p>
                  <p className="text-[11px] text-zinc-500">AES-256 Encryption</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 font-medium">
            © {new Date().getFullYear()} ProxyData. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs text-zinc-500 font-medium">
            <span className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"><Lock width={14} /> Anonymous Routing</span>
            <span className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors"><ShieldCheck width={14} /> Enterprise SLA</span>
          </div>
        </div>

        {/* Spacer so the fixed app-like bottom bar never covers footer content on small screens */}
        <div className="h-[72px] lg:hidden" />
      </div>
    </footer>
  );
}
