"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "account", title: "2. Your Account & Site" },
    { id: "communication", title: "3. Communications" },
    { id: "cookies", title: "4. Cookies & Tracking" },
    { id: "data-protection", title: "5. Data Protection" },
    { id: "data-rights", title: "6. Your Data Rights" },
    { id: "payments", title: "7. Payment Processing" },
    { id: "collection", title: "8. Data We Collect" },
  ];

  // Optional: Add intersection observer here for active scrolling state
  useEffect(() => {
    const handleScroll = () => {
      let current = "";
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && window.scrollY >= el.offsetTop - 150) {
          current = section.id;
        }
      }
      setActiveSection(current || sections[0].id);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-cyan-500/30">
      <Navbar />

      <main className="relative">
        {/* Header Section */}
        <div className="border-b border-white/5 bg-zinc-900/50 pt-20 pb-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Privacy <span className="text-cyan-400">Policy</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl text-lg">
              We believe in full transparency. Here is exactly how we handle your data, protect your privacy, and secure your proxy infrastructure.
            </p>
            <p className="text-sm font-semibold text-cyan-500 mt-6 tracking-widest uppercase">
              Last Updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Content Layout */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 flex flex-col lg:flex-row gap-12">
          
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Table of Contents</h3>
              <nav className="space-y-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`block text-sm transition-colors ${
                      activeSection === section.id
                        ? "text-cyan-400 font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy Content */}
          <div className="flex-1 max-w-3xl prose prose-invert prose-zinc prose-headings:text-white prose-a:text-cyan-400 hover:prose-a:text-cyan-300">
            
            <section id="introduction" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">1. Introduction</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  The following terms and conditions govern all use of the ProxyData website and all content, services, and products available at or through the website. The Website is owned and operated by ProxyData.
                </p>
                <p>
                  By accessing or using any part of the website, you agree to become bound by the terms and conditions of this agreement. If you do not agree to all the terms and conditions, then you may not access the Website or use any services. The Website is available only to individuals who are at least 13 years old.
                </p>
              </div>
            </section>

            <section id="account" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">2. Your ProxyData Account & Site</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  If you create an account on the Website, you are responsible for maintaining the security of your account and its content, and you are fully responsible for all activities that occur under the account and any other actions taken in connection with the Website. 
                </p>
                <p>
                  You must immediately notify ProxyData of any unauthorized uses of your account or any other breaches of security. ProxyData will not be liable for any acts or omissions by You, including any damages of any kind incurred as a result of such acts or omissions.
                </p>
              </div>
            </section>

            <section id="communication" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">3. Communications</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  We may occasionally communicate with you regarding our products, services, news, and events. You have the option not to receive this information. We provide an opt-out function within all email communications of this nature.
                </p>
                <p>
                  The only kind of these communications that you may not "opt-out" of are those required to communicate announcements related to the Services, including information specific to your account, planned Services suspensions, and outages. We minimize this type of communication to protect your inbox.
                </p>
              </div>
            </section>

            <section id="cookies" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">4. Cookies & Tracking</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  The ProxyData website uses cookies, tracking pixels, and related technologies. Cookies are small data files that are served by our platform and stored on your device. 
                </p>
                <p>
                  Our site uses cookies dropped by us for a variety of purposes including to operate and personalize the website (such as keeping you logged in). Cookies may also be used to track how you use the site to ensure optimal performance.
                </p>
              </div>
            </section>

            <section id="data-protection" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">5. Data Protection</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <h3 className="text-white font-bold text-lg mt-6">General Data Protection</h3>
                <p>
                  ProxyData collects the absolute minimum data needed to operate your account. All data is stored on our secure servers. We do our best to protect and keep secure your personal and project data. Proxy credentials are stored encrypted and masked by default.
                </p>
                <h3 className="text-white font-bold text-lg mt-6">Data Retention</h3>
                <p>
                  All transactional logs and temporary tracking data stored for more than 30 days will be permanently deleted from our system to protect your privacy.
                </p>
              </div>
            </section>

            <section id="data-rights" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">6. Your Data Rights</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <h3 className="text-white font-bold text-lg mt-6">Access & Erasure</h3>
                <p>
                  You have the right to access, rectification, opposition, erasure (“right to be forgotten”), and restriction of the processing your personal data. You can exercise these rights by sending us an email to <a href="mailto:support@dataproxy.store">support@dataproxy.store</a>.
                </p>
                <h3 className="text-white font-bold text-lg mt-6">Account Deletion</h3>
                <p>
                  Users seeking to delete their accounts and all associated data permanently can initiate the process by contacting our Support team through the Contact page on our website or via email. Upon request, the account will be deleted, and all data will be permanently removed from our servers, with no possibility of restoration.
                </p>
              </div>
            </section>

            <section id="payments" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">7. Payment Processing</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  All payments are facilitated through trusted, local manual verification processes (such as bKash and Nagad). Payment references are verified manually against mobile-money records.
                </p>
                <p>
                  <strong>We never store credit card numbers or highly sensitive financial data on our servers.</strong> We only store the transaction ID (TrxID) provided by you during the checkout process to verify the payment.
                </p>
              </div>
            </section>

            <section id="collection" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">8. Data We Collect</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>We collect information related to a platform user and our Services usage:</p>
                <ul className="list-disc pl-5 space-y-2 mt-4">
                  <li><strong>Registration information:</strong> Information you provide when filling up the registration form (e.g., Email or Google Auth).</li>
                  <li><strong>Profile details:</strong> You can view and edit various preferences as well as personal details on your Profile settings.</li>
                  <li><strong>ProxyData usage data:</strong> We store your proxy bandwidth allocation and usage statistics for you.</li>
                  <li><strong>Billing info:</strong> We store information about the Plans you choose. We don’t store any raw payment details.</li>
                </ul>
                <p className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 font-medium">
                  We do not sell or share your personal data with any 3rd parties. Period.
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
