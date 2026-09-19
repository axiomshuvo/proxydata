
"use client";

import { siteContent } from "@/lib/content";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Navbar } from "@/components/ui/Navbar";
import { TextInput } from "@/components/ui/TextInput";
import { useState } from "react";
import { notifyError, notifySuccess } from "@/components/ui/ToastProvider";
import { Envelope, ShieldCheck, CommentDot, CaretRight } from "@gravity-ui/icons";
import Link from "next/link";

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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
      
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:py-24 relative z-10 flex flex-col items-center">
        
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Get in touch
          </h1>
          <p className="text-lg text-zinc-400">
            Have questions about {siteContent.company.name}? Whether you need help setting up your proxies, configuring endpoints, or resolving payment issues, our team is ready to assist.
          </p>
        </div>

        {/* Content Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7">
            <GlassCard className="rounded-3xl p-6 sm:p-8 border-white/5 shadow-2xl relative overflow-hidden group">
              {/* Decorative inner glow */}
              <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl z-0" />
              
              <div className="relative z-10">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <CommentDot className="text-cyan-400" />
                    Send us a message
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">We typically reply within a few hours.</p>
                </div>

                {sent ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShieldCheck width={24} height={24} />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-400 mb-1">Message Received</h3>
                    <p className="text-sm text-emerald-100/70">
                      We have received your message and will get back to you at the email provided shortly.
                    </p>
                    <Button 
                      className="mt-6 w-full" 
                      variant="Secondary" 
                      onClick={() => setSent(false)}
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSend}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <TextInput 
                        label="Name" 
                        placeholder="Your name" 
                        isRequired 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                      />
                      <TextInput 
                        label="Email" 
                        placeholder="you@example.com" 
                        type="email" 
                        isRequired 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-400">Message <span className="text-red-400">*</span></label>
                      <textarea 
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-y min-h-[120px]"
                        placeholder="How can we help?"
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <Button className="w-full h-12 text-base font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)]" type="submit" isDisabled={sending}>
                      {sending ? "Sending..." : "Send Message"}
                    </Button>
                    <p className="text-xs text-zinc-500 text-center mt-2 flex items-center justify-center gap-1.5">
                      <ShieldCheck width={14} className="text-zinc-600" />
                      Never paste passwords or full proxy strings here.
                    </p>
                  </form>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Column: Info & FAQ */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Direct Contact Methods */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 flex flex-col gap-5">
              <h3 className="font-bold text-white text-lg">Direct Contact</h3>
              
              <a href={`mailto:${siteContent.company.supportEmail}`} className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Envelope width={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Email Support</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{siteContent.company.supportEmail}</p>
                </div>
              </a>

              <a href={siteContent.company.telegramUrl} target="_blank" rel="noreferrer" className="group flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.19-.08-.05-.19-.02-.27 0-.12.03-1.98 1.25-5.59 3.69-.53.36-1.01.53-1.44.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.29-.48.79-.74 3.08-1.34 5.14-2.23 6.17-2.66 2.93-1.22 3.54-1.43 3.94-1.43.09 0 .28.02.4.11.1.08.13.19.14.28-.01.07.01.21 0 .29z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">Telegram Community</p>
                  <p className="text-xs text-zinc-400 mt-0.5">@{siteContent.company.telegram}</p>
                </div>
              </a>
            </div>

            {/* Help / Guide CTA */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] pointer-events-none" />
              <h3 className="font-bold text-white text-lg mb-2">Need quick answers?</h3>
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                Before sending a ticket, make sure to check out our dashboard for proxy configuration guides and active session stats.
              </p>
              <Link href="/user/sign-in" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                Go to Dashboard <CaretRight width={16} />
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
