# ProxyData Caching Strategy

This document outlines the strict caching rules for ProxyData to protect the MongoDB database and upstream APIs (DataImpulse) while guaranteeing 0ms load times for clients.

## 1. Plans & Billing (On-Demand Revalidation)
- **Data Type:** Pricing, plan details, provider billing coefficients.
- **Server Cache:** Cached indefinitely via Next.js `unstable_cache` with `tags: ["plans"]`.
- **Client Cache:** SWR with `localStorage` fallback.
- **Update Trigger:** When an Admin modifies a plan or billing rule, the system MUST call `revalidateTag("plans")` to instantly purge the global cache. This guarantees zero lag on pricing updates.

## 2. Proxy Locations (1-Hour Automated Sync)
- **Data Type:** Available Countries, States, Cities, and ASNs from DataImpulse.
- **Server Cache:** Cached for **1 Hour (3600 seconds)**. The backend fetches from DataImpulse `GET /locations` only once per hour.
- **Client Cache:** SWR with `localStorage` fallback on the Proxy Config page to ensure dropdowns render instantly.
- **Update Trigger:** Automated background expiration.

## 3. Proxy Pool Stats (15-Minute Automated Sync)
- **Data Type:** Live online IPs, network health.
- **Server Cache:** Cached for **15 Minutes (900 seconds)**. The backend fetches from DataImpulse `GET /pool_stats` only once every 15 minutes.
- **Client Cache:** SWR with memory caching (no localStorage needed for volatile stats).
- **Update Trigger:** Automated background expiration.

## 4. UI/UX Rules for Cached Data
- Always use `fallbackData` in `useSWR` when rendering critical data (Plans, Locations) so the user experiences zero layout shift and 0ms loads.
- If upstream (DataImpulse) fails, the server should serve the stale cache rather than breaking the application ("stale-while-revalidate").
