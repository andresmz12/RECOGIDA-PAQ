import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "DISPATCHER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get all couriers
    const couriers = await prisma.user.findMany({
      where: { role: "COURIER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    // For each courier, get their pickup counts
    const stats = await Promise.all(
      couriers.map(async (courier) => {
        const [total, pickedUp, inProgress, todayCount] = await Promise.all([
          prisma.pickupRequest.count({ where: { assignedCourierId: courier.id, status: { not: "CANCELLED" } } }),
          prisma.pickupRequest.count({ where: { assignedCourierId: courier.id, status: "PICKED_UP" } }),
          prisma.pickupRequest.count({
            where: { assignedCourierId: courier.id, status: { in: ["ASSIGNED", "SCHEDULED", "EN_CAMINO"] } },
          }),
          prisma.pickupRequest.count({
            where: {
              assignedCourierId: courier.id,
              preferredDate: { gte: startOfDay, lt: endOfDay },
              status: { not: "CANCELLED" },
            },
          }),
        ]);
        return {
          id: courier.id,
          name: courier.name,
          total,
          pickedUp,
          inProgress,
          todayCount,
          successRate: total > 0 ? Math.round((pickedUp / total) * 100) : 0,
        };
      })
    );

    // Sort by today's count desc, then total desc
    stats.sort((a, b) => b.todayCount - a.todayCount || b.total - a.total);

    return NextResponse.json({ couriers: stats });
  } catch (error) {
    console.error("Error fetching courier stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
