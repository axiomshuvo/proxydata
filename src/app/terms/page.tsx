import Link from "next/link";
import { siteContent } from "@/lib/content";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/ui/Navbar";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <Navbar />

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

      <Footer />
    </div>
  );
}
