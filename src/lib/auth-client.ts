import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same-origin at runtime: NEXT_PUBLIC_* is baked at build time, so a stale
  // build would point the live site at localhost and hang on "Connecting…".
  // window.location.origin always matches the serving domain (proxydata.store).
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});
