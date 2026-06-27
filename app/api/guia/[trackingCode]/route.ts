import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const p = await prisma.pickupRequest.findUnique({
      where: { trackingCode: params.trackingCode },
      select: {
        trackingCode: true,
        status: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        pickupAddress: true,
        pickupCity: true,
        pickupState: true,
        pickupPostalCode: true,
        pickupCountry: true,
        recipientName: true,
        recipientPhone: true,
        recipientPhoneSecondary: true,
        recipientEmail: true,
        recipientAddress: true,
        recipientCity: true,
        recipientState: true,
        recipientCountry: true,
        destinationCountry: true,
        packageType: true,
        estimatedWeight: true,
        dimensions: true,
        packageContents: true,
        preferredDate: true,
        preferredTimeWindow: true,
        specialInstructions: true,
        createdAt: true,
      },
    });

    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(p);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
