import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const pickups = await prisma.pickupRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        trackingCode: true,
        status: true,
        contactName: true,
        pickupAddress: true,
        pickupCity: true,
        pickupCountry: true,
        recipientName: true,
        recipientCity: true,
        recipientCountry: true,
        preferredDate: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: pickups });
  } catch (error) {
    console.error("Error fetching customer pickups:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
