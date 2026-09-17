import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Navbar } from "@/components/ui/Navbar";
import Link from "next/link";

// Phase 3A - U2: public landing (replaces boilerplate).
const FEATURES = [
  { title: "Instant Activation", body: "Bandwidth lands on your proxy moments after approval." },
  { title: "Mobile-First", body: "Every flow designed for the phone in your hand." },
  { title: "4 Proxy Pools", body: "Residential, Mobile, Datacenter and Premium Residential." },
  { title: "Honest Pricing", body: "Per-GB pricing in Taka. No subscriptions, no traps." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main>
        <section className="mx-auto max-w-7xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">
            Proxy bandwidth, simplified
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Buy proxy data by the <span className="text-cyan-400">GB</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Pick a pool, pay with bKash or Nagad, get working credentials in minutes.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/user/sign-up">
              <Button className="w-full sm:w-auto">Create account</Button>
            </Link>
            <Link href="/plans">
              <Button variant="Secondary" className="w-full sm:w-auto">View plans</Button>
            </Link>
          </div>
        </section>
        <section className="border-y border-white/5 bg-white/[.02]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Supported providers
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200">
                DataImpulse
              </span>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <GlassCard key={f.title} title={f.title}>
                <p className="text-sm leading-6 text-zinc-400">{f.body}</p>
              </GlassCard>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/user/sign-up">
              <Button>Get started</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
