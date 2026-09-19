import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

declare const self: {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Strict override: Never cache API, user, or admin routes (Security P0-2)
const customCaching = [
  {
    matcher: ({ url }: { url: URL }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/user/") || url.pathname.startsWith("/axiomshuvo/"),
    handler: new NetworkOnly(),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? []), { url: "/offline", revision: "v1" }],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: customCaching,
});

// Failed document navigations (offline) fall back to the precached page.
serwist.setCatchHandler(async ({ request }) => {
  if (request.destination === "document") {
    const offline = await serwist.matchPrecache("/offline");
    if (offline) return offline;
  }
  return Response.error();
});

serwist.addEventListeners();
