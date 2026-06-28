import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // secureCookies must match what the auth handler uses (based on NEXTAUTH_URL protocol)
  const secureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: secureCookies,
  });

  // Dashboard routes - require staff role
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const role = token.role as string;
    if (!["ADMIN", "DISPATCHER", "COURIER"].includes(role)) {
      return NextResponse.redirect(new URL("/mi-cuenta", req.url));
    }
    // /dashboard/usuarios list and user creation: ADMIN only
    // /dashboard/usuarios/[id] profile view: ADMIN + DISPATCHER
    if (pathname.startsWith("/dashboard/usuarios")) {
      const isProfileView = /^\/dashboard\/usuarios\/[^/]+/.test(pathname);
      if (!isProfileView && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (isProfileView && !["ADMIN", "DISPATCHER"].includes(role)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    if (pathname.startsWith("/dashboard/rutas") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/dashboard/mis-recogidas") && role !== "COURIER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Label print routes - require any authenticated staff
  if (pathname.startsWith("/etiqueta")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const role = token.role as string;
    if (!["ADMIN", "DISPATCHER", "COURIER"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Customer account routes
  if (pathname.startsWith("/mi-cuenta")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if ((token.role as string) !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/mi-cuenta/:path*", "/etiqueta/:path*"],
};
