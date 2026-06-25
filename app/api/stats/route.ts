import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["ADMIN", "COURIER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [counts, todayTotal, todayCompleted] = await Promise.all([
      prisma.pickupRequest.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.pickupRequest.count({
        where: {
          preferredDate: { gte: startOfDay, lt: endOfDay },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.pickupRequest.count({
        where: {
          preferredDate: { gte: startOfDay, lt: endOfDay },
          status: "PICKED_UP",
        },
      }),
    ]);

    const result = { total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0, cancelled: 0, todayTotal, todayCompleted };
    for (const c of counts) {
      const count = c._count.id;
      switch (c.status) {
        case "PENDING":   result.pending   = count; result.total += count; break;
        case "ASSIGNED":  result.assigned  = count; result.total += count; break;
        case "SCHEDULED": result.scheduled = count; result.total += count; break;
        case "PICKED_UP": result.pickedUp  = count; result.total += count; break;
        case "CANCELLED": result.cancelled = count; break;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
