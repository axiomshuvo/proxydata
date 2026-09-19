import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { env } from "@/lib/env";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { SWRDefaults } from "@/components/ui/SWRDefaults";
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
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
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
      <head>
        {/* iOS PWA: standalone launch + splash (Safari ignores manifest for these). */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" />
        <link rel="apple-touch-startup-image" href="/apple-splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" />
      </head>
      <body suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased`}
      >
        <SWRDefaults>
          {children}
          <ToastProvider />
          <PWAInstallPrompt />
        </SWRDefaults>
      </body>
    </html>
  );
}
