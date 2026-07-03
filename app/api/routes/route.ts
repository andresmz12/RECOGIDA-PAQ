import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courierId = searchParams.get("courierId");
    const date = searchParams.get("date");

    if (!courierId || !date) {
      return NextResponse.json({ error: "courierId and date are required" }, { status: 400 });
    }

    const d = new Date(date);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay   = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

    const [courier, pickups] = await Promise.all([
      prisma.user.findUnique({
        where: { id: courierId },
        select: { id: true, name: true, phone: true, email: true },
      }),
      prisma.pickupRequest.findMany({
        where: {
          assignedCourierId: courierId,
          preferredDate: { gte: startOfDay, lt: endOfDay },
          status: { notIn: ["CANCELLED"] },
        },
        orderBy: { preferredDate: "asc" },
        select: {
          id: true,
          trackingCode: true,
          contactName: true,
          contactPhone: true,
          pickupAddress: true,
          pickupCity: true,
          pickupState: true,
          pickupCountry: true,
          recipientName: true,
          recipientCity: true,
          recipientCountry: true,
          packageType: true,
          estimatedWeight: true,
          preferredDate: true,
          preferredTimeWindow: true,
          specialInstructions: true,
          status: true,
        },
      }),
    ]);

    if (!courier) {
      return NextResponse.json({ error: "Courier not found" }, { status: 404 });
    }

    return NextResponse.json({ courier, pickups, date });
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
