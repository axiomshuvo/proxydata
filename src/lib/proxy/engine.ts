// DataImpulse Proxy Generator Engine
// Translates user preferences into exact grammatical syntax per docs/03 §6.
// The full proxy string (with secret) is composed SERVER-SIDE ONLY and
// returned on explicit user action — never assembled from client-held parts.

export const GATEWAY_HOST = "gw.dataimpulse.com"; // DNS preferred; IP fallback never primary (03 §8)
export const HTTP_ROTATING_PORT = 823;
export const SOCKS5_ROTATING_PORT = 824;

export interface ProxyTargetingParams {
  login: string;          // The base DataImpulse sub-user login (e.g. user123)
  password: string;       // The base DataImpulse sub-user password
  protocol: "http" | "socks5";
  mode: "rotating" | "sticky";
  stickyPort?: number;    // 10000–20000 from sticky_range (03 §8)
  country?: string;       // e.g., "us", "gb", "de" (comma separated allowed: "us,gb")
  state?: string;         // e.g., "ca"
  city?: string;          // e.g., "los_angeles"
  zip?: string;           // e.g., "90210"
  sessionId?: string;     // Random string for sticky sessions (30-min IP pin)
  sessionTtl?: number;    // Rotation interval in seconds (sessttl)
}

// Slug validation per 03 §6: ^[a-z0-9-]+$, length-capped (blocks credential
// injection via crafted city names). Commas survive only as multi-value
// separators inside an already-split list — never inside a single value.
function sanitize(val: string): string {
  return val.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 64);
}

function sanitizeList(val: string): string {
  return val
    .split(",")
    .map((v) => sanitize(v))
    .filter(Boolean)
    .join(",");
}

/**
 * Builds the canonical username suffix.
 * Rules:
 * - multi-value joins (`,` within a key, `;` across keys)
 * - MUST have a country before state/city/zip/asn can be applied.
 */
export function buildTargetingSuffix(params: Omit<ProxyTargetingParams, "protocol" | "password">): string {
  let username = params.login;
  const segments: string[] = [];

  // 1. Country (Required for any geo-targeting)
  if (params.country) {
    const countries = sanitizeList(params.country);
    if (countries) {
      segments.push(`cr.${countries}`);

      // 2. Sub-geo targeting (Only valid if country exists; 2x billing
      // except PREMIUM_RESIDENTIAL — surcharge line lives in checkout)
      if (params.state) {
        const v = sanitize(params.state);
        if (v) segments.push(`state.${v}`);
      }
      if (params.city) {
        const v = sanitizeList(params.city);
        if (v) segments.push(`city.${v}`);
      }
      if (params.zip) {
        const v = sanitize(params.zip);
        if (v) segments.push(`zip.${v}`);
      }
    }
  }

  // NOTE (03 §6): ASN-include/exclude username keys were NOT directly
  // verified. `exclude_asn` travels via set-default-pool-parameters
  // (verified); never emit an `asn.` suffix until sandbox confirms the key.
  // Sticky session pin (30-min semantics per live docs).
  if (params.mode === "sticky" && params.sessionId) {
    const v = sanitize(params.sessionId);
    if (v) segments.push(`sessid.${v}`);
  }
  if (params.mode === "sticky" && params.sessionTtl !== undefined) {
    const ttl = Math.floor(params.sessionTtl);
    if (Number.isFinite(ttl) && ttl > 0) segments.push(`sessttl.${ttl}`);
  }

  if (segments.length > 0) {
    username += "__" + segments.join(";");
  }

  return username;
}

/**
 * Generates the raw Username and Password pair
 */
export function buildCredentials(params: ProxyTargetingParams) {
  const username = buildTargetingSuffix(params);
  return {
    username,
    password: params.password,
  };
}

/**
 * Generates the final cURL command string.
 * LOCKED gateway table (03 §8): HTTP rotating :823, SOCKS5 rotating :824,
 * sticky :10000–20000 (port from sticky_range, never hardcoded per-config).
 */
export function buildCurlCommand(params: ProxyTargetingParams, targetUrl: string = "https://ipinfo.io"): string {
  const { username, password } = buildCredentials(params);

  const port =
    params.mode === "sticky" && params.stickyPort
      ? params.stickyPort
      : params.protocol === "socks5"
        ? SOCKS5_ROTATING_PORT
        : HTTP_ROTATING_PORT;
  const scheme = params.protocol;

  return `curl -x ${scheme}://${username}:${password}@${GATEWAY_HOST}:${port} ${targetUrl}`;
}
