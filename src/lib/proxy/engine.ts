// DataImpulse Proxy Generator Engine
// Translates user preferences into exact grammatical syntax per docs/03 §6

export interface ProxyTargetingParams {
  login: string;          // The base DataImpulse sub-user login (e.g. user123)
  password: string;       // The base DataImpulse sub-user password
  protocol: "HTTP" | "SOCKS5";
  mode: "ROTATING" | "STICKY";
  country?: string;       // e.g., "us", "gb", "de" (comma separated allowed: "us,gb")
  state?: string;         // e.g., "ca"
  city?: string;          // e.g., "los_angeles"
  zip?: string;           // e.g., "90210"
  asn?: string;           // e.g., "7018"
  sessionId?: string;     // Random string for sticky sessions (e.g., "sess123")
}

// Slug validation to prevent injection/malformed strings
function sanitize(val: string): string {
  return val.trim().toLowerCase().replace(/[^a-z0-9_,]/g, "");
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
    segments.push(`cr.${sanitize(params.country)}`);
    
    // 2. Sub-geo targeting (Only valid if country exists)
    if (params.state) {
      segments.push(`state.${sanitize(params.state)}`);
    }
    if (params.city) {
      segments.push(`city.${sanitize(params.city)}`);
    }
    if (params.zip) {
      segments.push(`zip.${sanitize(params.zip)}`);
    }
  }

  // 3. ASN targeting
  if (params.asn) {
    segments.push(`asn.${sanitize(params.asn)}`);
  }

  // 4. Sticky Session PIN
  if (params.mode === "STICKY" && params.sessionId) {
    segments.push(`sessid.${sanitize(params.sessionId)}`);
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
 * Generates the final cURL command string
 */
export function buildCurlCommand(params: ProxyTargetingParams, targetUrl: string = "https://ipinfo.io"): string {
  const { username, password } = buildCredentials(params);
  
  // DataImpulse Default Ports:
  // HTTP: 8000
  // SOCKS5: 9000
  // Note: Sticky ranges (10000+) are usually handled by the provider endpoint, 
  // but DataImpulse docs state sessid.XYZ is the preferred sticky pinning method on default ports.
  const port = params.protocol === "SOCKS5" ? "9000" : "8000";
  const scheme = params.protocol.toLowerCase();
  
  return `curl -x ${scheme}://${username}:${password}@gw.dataimpulse.com:${port} ${targetUrl}`;
}
