import { NextResponse } from "next/server";
import {
  TOKEN_COOKIE_NAME,
  PUBLIC_PATHS,
  STATIC_ASSET_REGEX,
  isAllowedRole,
  getRoleFromPath,
  getDashboardForRole,
  ROLE_ROUTE_PREFIXES,
} from "./lib/auth-config";

function getTokenFromRequest(req) {
  const cookie = req.cookies.get(TOKEN_COOKIE_NAME);
  return cookie?.value || null;
}

function getUserFromToken(token) {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.role) return null;
    if (Date.now() >= payload.exp * 1000) return null;
    return { role: payload.role };
  } catch {
    return null;
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/logo") ||
    pathname === "/favicon.ico" ||
    STATIC_ASSET_REGEX.test(pathname)
  );
}

export function proxy(req) {
  const { pathname } = req.nextUrl;

  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(req);
  const user = getUserFromToken(token);

  // Public pages — anyone can access
  if (PUBLIC_PATHS.includes(pathname)) {
    // Already logged in? Redirect away from /login
    if (pathname === "/login" && user && isAllowedRole(user.role)) {
      return NextResponse.redirect(
        new URL(getDashboardForRole(user.role), req.url)
      );
    }
    return NextResponse.next();
  }

  // Root page — allow public access (landing page)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated but role not in whitelist — deny
  if (!isAllowedRole(user.role)) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  const requestedRole = getRoleFromPath(pathname);

  // Not a role-prefixed route (e.g. some other page) — allow
  if (!requestedRole) {
    return NextResponse.next();
  }

  // Role mismatch — user cannot access another role's routes
  if (user.role !== requestedRole) {
    return NextResponse.redirect(
      new URL(getDashboardForRole(user.role), req.url)
    );
  }

  // Accessing the role root (e.g. /cashier) — redirect to dashboard
  if (pathname === ROLE_ROUTE_PREFIXES[requestedRole]) {
    return NextResponse.redirect(
      new URL(getDashboardForRole(user.role), req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|logo/).*)",
  ],
};
