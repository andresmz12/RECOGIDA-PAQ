import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // secureCookies must match what the auth handler uses (based on NEXTAUTH_URL protocol)
  const secureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookies,
  });

  // Dashboard routes - require ADMIN, DISPATCHER, or COURIER
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const role = token.role as string;
    if (!["ADMIN", "DISPATCHER", "COURIER"].includes(role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/dashboard/usuarios") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (pathname.startsWith("/dashboard/mis-recogidas") && role !== "COURIER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
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
  matcher: ["/dashboard/:path*", "/mi-cuenta/:path*"],
};
