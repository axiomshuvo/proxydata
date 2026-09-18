import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 route guard (NOT middleware.ts).
// ADMIN_PATH lives ONLY in server env (never NEXT_PUBLIC_). The literal
// below is a non-production preview fallback so local UI work doesn't break;
// in production ADMIN_PATH MUST be set — otherwise admin routes stay locked
// (fail-closed) and the fallback is never used.
const ADMIN_PATH = process.env.ADMIN_PATH ?? (process.env.NODE_ENV === "production" ? "" : "/axiomshuvo");

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute =
    pathname.startsWith("/user/sign-in") ||
    pathname.startsWith("/user/sign-up") ||
    pathname.startsWith("/user/forgot-password") ||
    pathname.startsWith("/user/reset-password");

  const isCustomerRoute = pathname.startsWith("/user/") && !isAuthRoute;
  const isAdminRoute = ADMIN_PATH !== "" && (pathname === ADMIN_PATH || pathname.startsWith(`${ADMIN_PATH}/`));

  // If public route, allow immediately
  if (!isCustomerRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Fast check: Ensure a Better Auth session cookie exists.
  // Authoritative checks (role === ROLE_ADMIN on every admin route/action,
  // SUSPENDED 403 quarantine, DEACTIVATED login block, session revocation)
  // live in Server Components/layouts + Server Actions via requireAdmin()
  // (auth.api.getSession) — defense in depth. A self-fetch to
  // /api/auth/get-session from proxy.ts is intentionally avoided: on
  // localhost/edge it causes sporadic ECONNREFUSED/timeouts and would
  // turn every navigation into an N+1 session lookup.
  const hasCookie = request.cookies.getAll().some((c) => c.name.includes("better-auth.session_token"));
  if (!hasCookie) {
    return NextResponse.redirect(new URL("/user/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
