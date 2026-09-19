import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProxyData — Premium Proxy Infrastructure",
  description: "Buy premium residential and datacenter proxies by the GB. Instant activation, local payments, and honest pricing.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "ProxyData",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "ProxyData — Premium Proxy Infrastructure",
    description: "Buy premium residential and datacenter proxies by the GB. Instant activation and zero minimum deposits.",
    siteName: "ProxyData",
    images: [{ url: "/icon-512x512.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProxyData",
    description: "Instant access to premium proxy networks.",
    images: ["/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}
      >
        {children}
        <ToastProvider />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
