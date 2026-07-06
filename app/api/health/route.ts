import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Must run on every request — a prerendered "ok" would keep reporting
// healthy even with the database down.
export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "disconnected" = "connected";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - t0;
  } catch {
    database = "disconnected";
  }

  const ok = database === "connected";
  const mem = process.memoryUsage();

  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      database,
      dbLatencyMs,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
