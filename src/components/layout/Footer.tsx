import Link from "next/link";

// Phase 3A - U1: public footer (pairs with Navbar in guest mode).
export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-2">
          <p className="text-lg font-bold text-white">
            Proxy<span className="text-cyan-400">Data</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-zinc-500">
            Mobile-first proxy bandwidth storefront. Instant activation, honest pricing.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Product</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/plans" className="text-zinc-400 hover:text-white">Plans</Link></li>
            <li><Link href="/contact" className="text-zinc-400 hover:text-white">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/terms" className="text-zinc-400 hover:text-white">Terms</Link></li>
            <li><Link href="/privacy-policy" className="text-zinc-400 hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-zinc-600">
        © 2026 ProxyData. All rights reserved.
      </div>
    </footer>
  );
}
