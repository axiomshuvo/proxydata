"use client";
import { siteContent } from "@/lib/content";

import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Navbar } from "@/components/ui/Navbar";
import { TextInput } from "@/components/ui/TextInput";
import { useState } from "react";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed.");
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      notifySuccess("Message sent", "We reply within 24 hours on business days.");
    } catch (err) {
      notifyError("Send failed", err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Contact support</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {siteContent.company.supportEmail} — we reply within 24 hours on business days.
        </p>
        <GlassCard className="mt-6 rounded-2xl p-6">
          {sent ? (
            <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              Received — we&apos;ll get back to you by email shortly.
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSend}>
              <TextInput label="Name" placeholder="Your name" isRequired value={name} onChange={(e) => setName(e.target.value)} />
              <TextInput label="Email" placeholder="you@example.com" type="email" isRequired value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextInput label="Message" placeholder="How can we help?" isRequired value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button className="w-full" type="submit" isDisabled={sending}>
                {sending ? "Sending…" : "Send message"}
              </Button>
            </form>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            Limited to 3 messages per hour per visitor. Never paste passwords or full proxy strings here.
          </p>
        </GlassCard>
      </main>
      <Footer />
    </div>
  );
}
