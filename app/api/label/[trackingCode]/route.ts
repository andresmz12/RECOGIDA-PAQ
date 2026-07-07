import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    if (!["ADMIN", "DISPATCHER", "COURIER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pickup = await prisma.pickupRequest.findUnique({
      where: { trackingCode: params.trackingCode },
      select: {
        trackingCode: true,
        contactName: true,
        contactPhone: true,
        pickupAddress: true,
        pickupCity: true,
        pickupState: true,
        pickupPostalCode: true,
        pickupCountry: true,
        recipientName: true,
        recipientPhone: true,
        recipientAddress: true,
        recipientCity: true,
        recipientState: true,
        recipientPostalCode: true,
        recipientCountry: true,
        destinationCountry: true,
        packageType: true,
        estimatedWeight: true,
        hsCode: true,
        declaredValue: true,
        preferredDate: true,
        preferredTimeWindow: true,
        specialInstructions: true,
      },
    });

    if (!pickup) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(pickup);
  } catch (error) {
    console.error("Error fetching label data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
