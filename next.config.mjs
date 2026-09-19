import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {},
  experimental: {
    optimizePackageImports: ["@heroui/react"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    // Strict lockdown for APIs (no scripts/styles render there); app pages
    // keep Next.js-compatible inline allowances (hydration + Tailwind/HeroUI).
    const apiCsp = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
    const pageCsp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.ibb.co https://lh3.googleusercontent.com; font-src 'self' data:; connect-src 'self' https://api.dataimpulse.com https://api.imgbb.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";
    return [
      {
        source: "/api/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Content-Security-Policy", value: apiCsp },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: pageCsp }
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
