import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import clientPromise from "@/lib/db/mongodb";
import { headers } from "next/headers";

export interface GuardedSession {
  user: {
    publicUserId: string;
    role?: string;
    status?: string;
    email?: string;
    id?: string;
  };
}

function deny(message: string, status: number, retryAfterMs?: number) {
  const init: ResponseInit = { status };
  if (retryAfterMs !== undefined) {
    init.headers = { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) };
  }
  return NextResponse.json({ error: message }, init);
}

/**
 * CSRF check for cookie-authed mutating routes. Same-origin requests
 * (fetch from our own pages) carry no Origin but are constrained by
 * SameSite=Lax; cross-site forged POSTs carry a foreign Origin/Referer.
 */
export function assertSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const expected = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  if (origin) {
    try {
      if (new URL(origin).origin !== expected) return deny("Forbidden origin.", 403);
    } catch {
      return deny("Forbidden origin.", 403);
    }
    return null;
  }
  if (referer) {
    try {
      if (new URL(referer).origin !== expected) return deny("Forbidden origin.", 403);
    } catch {
      return deny("Forbidden origin.", 403);
    }
  }
  return null;
}

/** Authenticated session or 401. */
export async function requireSession(): Promise<{ session: GuardedSession } | { response: NextResponse }> {
  const session = (await auth.api.getSession({ headers: await headers() })) as GuardedSession | null;
  if (!session?.user) return { response: deny("Unauthorized", 401) };
  return { session };
}

/**
 * Authenticated ACTIVE user or 401/403. SUSPENDED/DEACTIVATED accounts are
 * read-only quarantined — every balance-changing route must use this.
 */
export async function requireActiveUser(): Promise<{ session: GuardedSession } | { response: NextResponse }> {
  const got = await requireSession();
  if ("response" in got) return got;
  const publicUserId = String(got.session.user.publicUserId ?? "");
  if (!publicUserId) return { response: deny("Unauthorized", 401) };
  const db = (await clientPromise).db();
  const me = await db.collection("user").findOne({ publicUserId });
  if (!me) return { response: deny("Unauthorized", 401) };
  if (me.status !== "ACTIVE") {
    return { response: deny("Account suspended — this action is blocked.", 403) };
  }
  return { session: got.session };
}

/** Escape for safe $regex use (ReDoS guard). */
export function escapeRegex(q: string, max = 64): string {
  return String(q ?? "")
    .slice(0, max)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
