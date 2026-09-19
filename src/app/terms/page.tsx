"use client";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useEffect, useState } from "react";

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "description", title: "1. Description of Service" },
    { id: "security", title: "2. Data Privacy & Security" },
    { id: "accounts", title: "3. User Accounts" },
    { id: "rules", title: "4. Service Rules & Regulated Usage" },
    { id: "restrictions", title: "5. Content Restrictions & Blocking" },
    { id: "billing", title: "6. Billing & Payments" },
    { id: "refunds", title: "7. Refund Policy" },
    { id: "refusal", title: "8. Refusal of Service & Countries" },
    { id: "affiliates", title: "9. Affiliate Program" },
    { id: "disclaimer", title: "10. Disclaimer & Account Blocking" },
  ];

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
              Terms of <span className="text-cyan-400">Service</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl text-lg">
              The rules, regulations, and acceptable use policies for operating on the ProxyData infrastructure.
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
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  The following terms and conditions govern all use of the ProxyData website, and all content, services, and products available at or through the Website. The Website is offered subject to Your acceptance without modification of all of the terms and conditions contained herein and all other operating rules, policies (including our Privacy Policy), and procedures that may be published from time to time on this Website.
                </p>
                <p>
                  By accepting these Terms, or by accessing or using the Service or Site, You represent and acknowledge that You have read, understood, and agree to be bound by these Terms.
                </p>
              </div>
            </section>

            <section id="description" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">1. Description of Service</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  1.1 – The "Service" includes (a) the Site, (b) the ProxyData account, services, and products, and (c) all software, data, text, images, and content made available through the Site based on the plan purchased.
                </p>
                <p>
                  1.2 – We do our best to make the Service available constantly, except for: (a) planned downtime, or (b) unavailability caused by circumstances beyond Our reasonable control (acts of God, acts of government, technical failures, etc).
                </p>
              </div>
            </section>

            <section id="security" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">2. Data Privacy and Security</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  2.1 – We maintain appropriate administrative, physical, and technical safeguards to protect the security, confidentiality, and integrity of Your data and the personal data of Your end-users. These safeguards include encryption of Your data in transmission (using SSL or similar technologies).
                </p>
              </div>
            </section>

            <section id="accounts" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">3. User Accounts</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  3.1 – We track all activities on our platform and store detailed logs of user activities. These logs are necessary for maintaining the security and reliability of our services.
                </p>
                <p>
                  3.2 – You must provide accurate and complete information when creating Your User Account. You are responsible for all activities on your account. You agree to use a strong password for Your account. We strongly recommend not reusing passwords from other services.
                </p>
                <p>
                  3.3 – You may not share, sell, transfer, lend, or otherwise grant third parties access to Your account credentials, including passwords or API tokens. You remain responsible for all activity on Your account, whether or not authorized by You.
                </p>
              </div>
            </section>

            <section id="rules" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">4. Service Rules & Regulated Usage</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  4.1 – We provide proxy services only for authorized legal purposes. Examples of acceptable uses include web scraping, ad verification, brand protection, and streaming content delivery.
                </p>
                <p>
                  4.2 – We strictly prohibit the use of our proxy services for any illegal activities, including but not limited to hacking, spamming, phishing, distributing malware, unauthorized data collection, engaging in ad fraud or click fraud, conducting DDoS attacks, and sending spam.
                </p>
                <p>
                  4.3 – Any use of Services for activities that are illegal, fraudulent, or abusive is strictly prohibited. Any detected illegal activity will be reported to the competent authorities, including providing the complete history of activities conducted through our platform after official request.
                </p>
              </div>
            </section>

            <section id="restrictions" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">5. Content Restrictions & Blocking</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  5.1 – ProxyData proactively blocks certain web content, including adult content, governmental websites, harmful domains, and more, as determined in its sole and exclusive discretion.
                </p>
                <p>
                  5.2 – System Circumvention: We reserve the right to monitor and analyze usage patterns to detect attempts to circumvent our system's safeguards. If identified, we may restrict or disable access to specific features without prior notice.
                </p>
              </div>
            </section>



            <section id="billing" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">6. Billing & Payments</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  6.1 – The Service is made available on a pay-as-you-go basis or fixed bundle basis. ProxyData utilizes local mobile money services (bKash, Nagad) to manage the processing of payments.
                </p>
                <p>
                  6.2 – Accounts engaging in misuse of our services, including but not limited to fraudulent payments, manipulating TrxIDs, bypassing standard payment plans, or exploiting system vulnerabilities, will be subject to immediate suspension and permanent blocking without appeal.
                </p>
                <p>
                  6.3 – The fees associated with payment processing (cash-out fees, send-money fees) are the sole responsibility of the customer.
                </p>
              </div>
            </section>

            <section id="refunds" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">7. Refund Policy</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  7.1 – Due to the digital nature of proxy bandwidth, all mobile money transactions are generally final. There are no refunds for partial months of service, plan downgrades, or for unused time/data if You close Your account before your funds run out.
                </p>
                <p>
                  7.2 – If the system detects patterns of misuse, such as creating multiple accounts to exploit a refund policy by using allocated traffic and then requesting a refund, such actions are considered fraudulent and will result in a permanent ban.
                </p>
              </div>
            </section>

            <section id="refusal" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">8. Refusal of Service & Restricted Regions</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  8.1 – We reserve the right to refuse, cancel or suspend service, at our sole discretion.
                </p>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl mt-4">
                  <h4 className="font-bold text-white mb-2">Restricted Regions:</h4>
                  <p className="text-sm">For regulatory reasons, users in the following regions are currently unable to access our services: Cuba, Iran, North Korea, Syria, Russian Federation, Republic of Belarus, and occupied regions of Ukraine.</p>
                </div>
                <p className="mt-4">
                  8.2 – Duplicate Accounts: Users are prohibited from creating or maintaining multiple accounts, whether active or inactive, without explicit prior permission. If we detect the creation of duplicate accounts, all associated accounts will be subject to review and potential suspension.
                </p>
              </div>
            </section>

            <section id="affiliates" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">9. Affiliate Program</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  9.1 – Referral commissions are intended for referring other individuals, not for self-referral. Any attempt to manipulate the system by registering through your own affiliate link or using fake accounts is strictly prohibited. Your affiliate account will be permanently blocked without warning.
                </p>
                <p>
                  9.2 – Affiliate links must not be promoted via scam ads, misleading claims, or deceptive marketing. Bidding on ProxyData branded keywords in paid search advertisements (Google Ads, Bing Ads) is strictly prohibited.
                </p>
                <p>
                  9.3 – All first-time payout requests are subject to manual verification. We reserve the right to withhold payouts and review affiliate activity at any time, especially in cases of suspicious patterns.
                </p>
              </div>
            </section>

            <section id="disclaimer" className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-bold mb-4 text-white">10. Disclaimer & Third-Party Blocking</h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  10.1 – ProxyData cannot be held liable for system downtime, crashes, or data loss. Certain services provided are resold infrastructure. ProxyData holds no responsibility for the use of our clients’ accounts.
                </p>
                <p>
                  10.2 – We cannot guarantee constant access to a particular third-party software or platform. If Your account on any external software or platform (e.g. social media, ecommerce site) is suddenly blocked or restricted, it is not due to our proxy service but is a matter related to the policies and systems of the respective platform. 
                </p>
                <p className="text-white font-bold mt-4">
                  By using our service, You agree that ProxyData is not responsible for any account blocks or restrictions imposed by third-party platforms. You acknowledge that using proxies may violate the terms of some services and you use them entirely at your own risk.
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
