"use client";
import { siteContent } from "@/lib/content";

import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Navbar } from "@/components/ui/Navbar";
import { TextInput } from "@/components/ui/TextInput";

// Phase 3A - U5: /contact (mock — throttled + CAPTCHA enforced server-side later).
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Contact support</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {siteContent.company.supportEmail} — we reply within 24 hours on business days.
        </p>
        <GlassCard className="mt-6 rounded-2xl p-6">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <TextInput label="Name" placeholder="Your name" isRequired />
            <TextInput label="Email" placeholder="you@example.com" type="email" isRequired />
            <TextInput label="Message" placeholder="How can we help?" isRequired />
            <Button className="w-full">Send message</Button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Limited to 3 messages per hour per visitor. Never paste passwords or full proxy strings here.
          </p>
        </GlassCard>
      </main>
      <Footer />
    </div>
  );
}
