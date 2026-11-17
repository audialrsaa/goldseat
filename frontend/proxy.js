
import { NextResponse } from "next/server";

export function proxy(req) {
  const { pathname } = req.nextUrl;

  // Lewati file statis dan API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/logo") ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Halaman publik
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forbidden"
  ) {
    return NextResponse.next();
  }

  // Pemeriksaan login dan role dilakukan di client
  // karena token disimpan di localStorage.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo/).*)",
  ],
};
