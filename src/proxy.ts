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

  // Fast check: Ensure a Better Auth session cookie exists.
  const hasCookie = request.cookies.getAll().some((c) => c.name.includes("better-auth.session_token"));

  // If they are logged in and trying to access a login/signup page, bounce to dashboard
  if (isAuthRoute && hasCookie) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  // If public route (landing page, etc., or auth routes when NOT logged in), allow immediately
  if (!isCustomerRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // If it's a protected route (dashboard or admin) and they have NO cookie, bounce to login
  if (!hasCookie) {
    return NextResponse.redirect(new URL("/user/sign-in", request.url));
  }

  // Otherwise, they are authenticated and authorized to proceed to the Layout checks
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
