import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATH = "/axiomshuvo"; // STRICT ENFORCEMENT

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isAuthRoute = pathname.startsWith("/user/sign-in") || 
                      pathname.startsWith("/user/sign-up") || 
                      pathname.startsWith("/user/forgot-password") || 
                      pathname.startsWith("/user/reset-password");

  const isCustomerRoute = pathname.startsWith("/user/") && !isAuthRoute;
  const isAdminRoute = pathname.startsWith(ADMIN_PATH);

  // If public route, allow immediately
  if (!isCustomerRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Fast check: Ensure the Better Auth session cookie exists
  const hasCookie = request.cookies.getAll().some(c => c.name.includes("better-auth.session_token"));
  if (!hasCookie) {
    return NextResponse.redirect(new URL("/user/sign-in", request.url));
  }

  // NOTE: We defer the actual DB Role validation to the Server Components (layout.tsx/page.tsx) 
  // because fetching from Edge middleware on localhost causes sporadic ECONNREFUSED/timeouts.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
