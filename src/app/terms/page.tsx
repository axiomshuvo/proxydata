import Link from "next/link";
import { siteContent } from "@/lib/content";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Navbar Stub */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold text-lg">P</div>
            <span className="font-bold text-xl tracking-tight text-white">{siteContent.company.name}</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/user/sign-in" className="text-sm font-bold text-zinc-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/user/sign-up" className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-zinc-200 transition-colors">Create account</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 lg:py-20 relative">
        <div className="hero-glow"></div>
        
        <header className="mb-12">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
          <div className="text-zinc-400 text-lg whitespace-pre-wrap leading-relaxed max-w-2xl">
            {siteContent.termsOfService.intro}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-zinc-500">
            <p>Last updated: {siteContent.company.lastUpdated}</p>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <p>Applies to {siteContent.company.name} website and dashboard</p>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500/90 text-sm">
            {siteContent.termsOfService.note}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Table of Contents (Hidden on small mobile, sticky on desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">On this page</h3>
              <nav className="flex flex-col gap-3">
                {siteContent.termsOfService.sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors">
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-12">
            {siteContent.termsOfService.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                <div className="text-zinc-300 leading-relaxed space-y-4">
                  {section.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-zinc-500">&copy; 2026 {siteContent.company.name}. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
