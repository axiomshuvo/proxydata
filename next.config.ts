import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Turbopack for `next dev` (SW is disabled in dev, so the Serwist webpack
  // plugin sitting idle is harmless). Production `build` stays on --webpack
  // where Serwist precaching actually runs.
  turbopack: {},
  // Split HeroUI's 72-component barrel per import — faster dev compiles,
  // smaller client bundles. Zero API change.
  experimental: {
    optimizePackageImports: ["@heroui/react"],
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
