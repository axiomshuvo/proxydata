import { env } from "@/lib/env";
import { logRuntime } from "@/lib/runtime-log";

const BASE_URL = "https://api.dataimpulse.com";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix timestamp in ms
let tokenRefreshPromise: Promise<string> | null = null;

// Basic JWT decoder to extract 'exp' without needing jsonwebtoken lib
function parseJwtExp(token: string): number {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // For Node.js (Edge compatible atob polyfill usually present, but Buffer is safer in Node)
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    const payload = JSON.parse(jsonPayload);
    // JWT exp is in seconds, convert to ms
    return payload.exp ? payload.exp * 1000 : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Single-flight token fetcher.
 */
async function fetchNewToken(): Promise<string> {
  const formData = new URLSearchParams();
  formData.append("login", env.DATAIMPULSE_API_LOGIN);
  formData.append("password", env.DATAIMPULSE_API_PASSWORD);

  const response = await fetch(`${BASE_URL}/reseller/user/token/get`, {
    method: "POST",
    body: formData,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error(`DataImpulse Auth Failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.token) {
    logRuntime({ level: "ERROR", source: "adapter", provider: "dataimpulse", operation: "TOKEN_REFRESH", status: "FAILED", message: "Token endpoint returned empty token." });
    throw new Error("DataImpulse returned empty token");
  }

  const expTime = parseJwtExp(data.token);
  // Default to 20h if no exp is found (fallback)
  const twentyHours = 20 * 60 * 60 * 1000;
  const calculatedExpiry = expTime ? expTime : Date.now() + twentyHours;

  cachedToken = data.token;
  // Refresh at min(exp - 1h, 20h from now)
  const oneHour = 60 * 60 * 1000;
  tokenExpiresAt = Math.min(calculatedExpiry - oneHour, Date.now() + twentyHours);

  return data.token;
}

export async function getAuthToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  // Prevent multiple concurrent requests for the same token
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = fetchNewToken().finally(() => {
      tokenRefreshPromise = null;
    });
  }

  return tokenRefreshPromise;
}

/**
 * Helper to make API requests with automatic token refresh on 401
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = await getAuthToken();
  
  const makeRequest = async (currentToken: string) => {
    const headers = {
      ...options.headers,
      "Token": currentToken,
      "Content-Type": "application/json"
    };

    return fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(token);

  // If unauthorized, token might have been manually revoked or expired edge case.
  // Re-auth exactly once per spec.
  if (response.status === 401) {
    cachedToken = null; // force refresh
    logRuntime({ level: "WARN", source: "adapter", provider: "dataimpulse", operation: "TOKEN_REFRESH", message: `401 on ${endpoint} — re-authenticating once.` });
    token = await getAuthToken();
    response = await makeRequest(token);
  }

  if (!response.ok) {
    logRuntime({ level: "ERROR", source: "adapter", provider: "dataimpulse", operation: "API_CALL", status: "FAILED", message: `${endpoint} → ${response.status} ${response.statusText}` });
    throw new Error(`DataImpulse API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// ADAPTER METHODS — wire shapes LOCKED per 03 (live-verified 2026-09-17).
// traffic unit = integer GB at the edge; balances = bytes (02 §41).
// -----------------------------------------------------------------------------

export async function getResellerBalance(): Promise<number> {
  const data = await apiRequest<{ balance: number }>("/reseller/user/balance", { method: "GET" });
  return data.balance;
}

// ---------------------------------------------------------------------------
// Short-TTL balance cache: DataImpulse has no webhook/stock feed, and every
// catalog view would otherwise burn an upstream call. 60s shared across all
// users (single-flight). Display-only — approval re-checks live (01 §10.2).
// ---------------------------------------------------------------------------
const BALANCE_TTL_MS = 60_000;
const BALANCE_FAIL_TTL_MS = 10_000; // negative cache: don't hammer a down upstream
let cachedBalance: number | null = null;
let balanceExpiresAt = 0;
let lastFailureAt = 0;
let lastFailure: unknown = null;
let balanceFlight: Promise<number> | null = null;

export async function getCachedResellerBalance(): Promise<{ balanceGb: number; fresh: boolean }> {
  if (cachedBalance !== null && Date.now() < balanceExpiresAt) {
    return { balanceGb: cachedBalance, fresh: false };
  }
  if (cachedBalance === null && lastFailure && Date.now() - lastFailureAt < BALANCE_FAIL_TTL_MS) {
    throw lastFailure; // recent failure, no good data — fail fast without retrying upstream
  }
  if (!balanceFlight) {
    balanceFlight = getResellerBalance()
      .then((b) => {
        cachedBalance = b;
        lastFailure = null;
        balanceExpiresAt = Date.now() + BALANCE_TTL_MS;
        return b;
      })
      .catch((e) => {
        lastFailure = e;
        lastFailureAt = Date.now();
        throw e;
      })
      .finally(() => {
        balanceFlight = null;
      });
  }
  return { balanceGb: await balanceFlight, fresh: true };
}

// Ensure the types perfectly mirror the ProxyData Database architecture
type UpstreamPoolType = "datacenter" | "residential" | "mobile" | "premium_residential";

export interface CreateSubUserArgs {
  label: string;
  poolType: UpstreamPoolType;
  threads?: number;
  stickyRange?: { start: number; end: number };
}

export async function createSubUser(args: CreateSubUserArgs | UpstreamPoolType) {
  // Back-compat: createSubUser("residential") still works (label auto-generated).
  const body =
    typeof args === "string"
      ? { label: `proxydata-${Date.now()}`, pool_type: args }
      : {
          label: args.label,
          pool_type: args.poolType,
          ...(args.threads !== undefined ? { threads: args.threads } : {}),
          ...(args.stickyRange ? { sticky_range: args.stickyRange } : {}),
        };
  const data = await apiRequest<{
    id: number;
    login: string;
    password: string;
  }>("/reseller/sub-user/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data;
}

export async function getSubUser(subUserId: number) {
  return await apiRequest<unknown>(`/reseller/sub-user/get?subuser_id=${subUserId}`, {
    method: "GET",
  });
}

export async function deleteSubUser(subUserId: number) {
  // LOCKED 03 §3: only after drop + verified balance == 0 + dual-confirmed admin action.
  return await apiRequest<{ success: boolean }>("/reseller/sub-user/delete", {
    method: "POST",
    body: JSON.stringify({ subuser_id: subUserId }),
  });
}

export interface SubUserBalance {
  balance: number;
  balance_format?: string;
  balance_total?: number;
  balance_total_format?: string;
  balance_used?: number;
  balance_used_format?: string;
  threads_used?: number;
}

export async function getSubUserBalance(subUserId: number): Promise<SubUserBalance> {
  const data = await apiRequest<SubUserBalance>(
    `/reseller/sub-user/balance/get?subuser_id=${subUserId}`,
    { method: "GET" },
  );
  return data;
}

export async function addSubUserBalance(
  subUserId: number,
  trafficGb: number,
  opts?: { allowNegative?: boolean },
) {
  // Integer GB (02 §41: adapter edge validates 1..1000). Negative values are
  // REJECTED by default — only server-side expiry/clawback may pass
  // { allowNegative: true }, each with its own audit row (03 §4).
  if (!Number.isInteger(trafficGb)) {
    throw new Error("trafficGb must be an integer (GB).");
  }
  if (opts?.allowNegative ? trafficGb === 0 : trafficGb < 1 || trafficGb > 1000) {
    throw new Error("trafficGb out of range (1..1000 GB).");
  }
  return await apiRequest<unknown>("/reseller/sub-user/balance/add", {
    method: "POST",
    body: JSON.stringify({ subuser_id: subUserId, traffic: trafficGb }),
  });
}

export async function dropSubUserBalance(subUserId: number) {
  return await apiRequest<unknown>("/reseller/sub-user/balance/drop", {
    method: "POST",
    body: JSON.stringify({ subuser_id: subUserId }),
  });
}

export async function getAdditionHistory(subUserId: number) {
  return await apiRequest<{
    history: { balance_charged: number; traffic_added: number; datetime: string }[];
  }>(`/reseller/sub-user/balance/addition-history?subuser_id=${subUserId}`, {
    method: "GET",
  });
}

export async function setSubUserStatus(subUserId: number, isBlocked: boolean) {
  return await apiRequest<unknown>("/reseller/sub-user/set-blocked", {
    method: "POST",
    body: JSON.stringify({ subuser_id: subUserId, blocked: isBlocked }),
  });
}

export async function resetSubUserPassword(subUserId: number) {
  return await apiRequest<{ login: string; password: string }>(
    "/reseller/sub-user/reset-password",
    {
      method: "POST",
      body: JSON.stringify({ subuser_id: subUserId }),
    },
  );
}

export interface DefaultPoolParameters {
  countries?: string[];
  exclude_asn?: string[];
  anonymous_filter?: boolean;
  rotation_interval?: number;
}

export async function setDefaultPoolParameters(
  subUserId: number,
  params: DefaultPoolParameters,
) {
  return await apiRequest<unknown>("/reseller/sub-user/set-default-pool-parameters", {
    method: "POST",
    body: JSON.stringify({ subuser_id: subUserId, default_pool_parameters: params }),
  });
}

/**
 * Fetch available geo-targeting locations from DataImpulse.
 */
export async function getLocations() {
  const token = await getAuthToken();
  const res = await fetch(`https://api.dataimpulse.com/reseller/common/locations?pool_type=residential`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return res.json();
}

/**
 * Fetch live network pool statistics from DataImpulse.
 */
export async function getPoolStats() {
  const token = await getAuthToken();
  const res = await fetch(`https://api.dataimpulse.com/reseller/common/pool_stats?pool_type=residential`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to fetch pool stats: ${res.status}`);
  return res.json();
}
