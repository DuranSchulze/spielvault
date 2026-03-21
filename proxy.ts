import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasSessionCookie } from "@/lib/auth/proxy";

const AUTH_PATHS = new Set(["/login", "/signup"]);
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/spiels",
  "/archive",
  "/departments",
  "/categories",
  "/users",
  "/profile",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (AUTH_PATHS.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/spiels/:path*", "/archive/:path*", "/departments/:path*", "/categories/:path*", "/users/:path*", "/profile/:path*"],
};
