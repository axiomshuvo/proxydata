import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/ui/Navbar";

// Phase 3A - U6: /privacy-policy (static prose; final copy before launch).
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-400">
          <p>
            ProxyData collects the minimum data needed to operate your account: your email address,
            purchase records, and proxy usage metadata. We never sell personal data.
          </p>
          <p>
            Proxy credentials are stored encrypted and masked by default. Payment references are
            verified manually against mobile-money records; we never store card numbers.
          </p>
          <p>
            Support staff can only view usage details when you explicitly grant consent in your
            proxy configuration. You may request export or deletion of your data at any time via
            support@proxydata.com.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
