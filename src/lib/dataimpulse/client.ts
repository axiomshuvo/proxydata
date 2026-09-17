import { env } from "@/lib/env";

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
    token = await getAuthToken();
    response = await makeRequest(token);
  }

  if (!response.ok) {
    throw new Error(`DataImpulse API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// -----------------------------------------------------------------------------
// ADAPTER METHODS (Phase 7 Specifications)
// -----------------------------------------------------------------------------

export async function getResellerBalance(): Promise<number> {
  const data = await apiRequest<{ balance: number }>("/reseller/user/balance", { method: "GET" });
  return data.balance;
}

// Ensure the types perfectly mirror the ProxyData Database architecture
type UpstreamPoolType = "datacenter" | "residential" | "mobile" | "premium_residential";

export async function createSubUser(poolType: UpstreamPoolType) {
  const data = await apiRequest<any>("/reseller/sub-user/create", {
    method: "POST",
    body: JSON.stringify({ pool_type: poolType })
  });
  return data;
}

export async function deleteSubUser(subUserId: number) {
  // Typical dataimpulse spec for sub-user operations
  return await apiRequest<any>(`/reseller/sub-user/${subUserId}/delete`, {
    method: "POST"
  });
}

export async function getSubUserBalance(subUserId: number): Promise<number> {
  const data = await apiRequest<{ balance: number }>(`/reseller/sub-user/${subUserId}/balance`, { method: "GET" });
  return data.balance;
}

export async function addSubUserBalance(subUserId: number, trafficGb: number) {
  // "traffic: 1" = 1 GiB. Negative-subtract semantics if negative.
  return await apiRequest<any>(`/reseller/sub-user/${subUserId}/balance/add`, {
    method: "POST",
    body: JSON.stringify({ traffic: trafficGb })
  });
}

export async function setSubUserStatus(subUserId: number, isBlocked: boolean) {
  return await apiRequest<any>(`/reseller/sub-user/${subUserId}/status`, {
    method: "POST",
    body: JSON.stringify({ blocked: isBlocked })
  });
}
