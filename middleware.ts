import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/registro", "/recoger", "/rastreo"];

export default withAuth(
  function middleware(req: NextRequest & { nextauth: any }) {
    const pathname = req.nextUrl.pathname;

    // Check if route is public
    if (publicRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    const token = req.nextauth.token;

    // Dashboard routes - require ADMIN, DISPATCHER, or COURIER
    if (pathname.startsWith("/dashboard")) {
      if (!["ADMIN", "DISPATCHER", "COURIER"].includes(token?.role)) {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      // Admin only routes
      if (
        pathname.startsWith("/dashboard/usuarios") &&
        token?.role !== "ADMIN"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Courier only routes
      if (
        pathname.startsWith("/dashboard/mis-recogidas") &&
        token?.role !== "COURIER"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Customer routes
    if (pathname.startsWith("/mi-cuenta")) {
      if (token?.role !== "CUSTOMER") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/mi-cuenta/:path*",
  ],
};
