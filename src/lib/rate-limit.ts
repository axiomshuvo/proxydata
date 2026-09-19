/*
  Best-effort in-memory sliding-window rate limiter for custom API routes
  (Better Auth rate-limits only its own auth endpoints).
  Hostinger runs a persistent Node process, so this survives across requests;
  with multi-process (PM2 cluster) each process tracks its own window, so
  treat limits as approximate, not exact. The DB-backed pending-order cap in
  the transaction route is the exact guard; this is the flood control.
*/

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** ms until the oldest hit in the window expires (for Retry-After). */
  retryAfterMs: number;
}

export function hitRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    return { allowed: false, retryAfterMs: Math.max(0, oldest + windowMs - now) };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Opportunistic cleanup so idle keys don't accumulate forever.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || v[v.length - 1]! <= cutoff) buckets.delete(k);
      if (buckets.size <= 4000) break;
    }
  }
  return { allowed: true, retryAfterMs: 0 };
}
