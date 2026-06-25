import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const status: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    nextauth: {},
  };

  // Check environment variables
  status.environment.DATABASE_URL = process.env.DATABASE_URL ? "✓ SET" : "✗ MISSING";
  status.environment.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "✓ SET" : "✗ MISSING";
  status.environment.NEXTAUTH_URL = process.env.NEXTAUTH_URL || "NOT SET";
  status.environment.NODE_ENV = process.env.NODE_ENV;

  // Check database connection
  try {
    await prisma.user.findFirst();
    status.database.connection = "✓ CONNECTED";
    status.database.canQuery = true;
  } catch (error) {
    status.database.connection = "✗ ERROR";
    status.database.canQuery = false;
    status.database.error = (error as Error).message;
  }

  // Count users
  try {
    const userCount = await prisma.user.count();
    status.database.userCount = userCount;
  } catch (error) {
    status.database.userCount = "ERROR";
  }

  // NextAuth status
  status.nextauth.secret_configured = !!process.env.NEXTAUTH_SECRET;
  status.nextauth.url_configured = !!process.env.NEXTAUTH_URL;

  return NextResponse.json(status);
}
