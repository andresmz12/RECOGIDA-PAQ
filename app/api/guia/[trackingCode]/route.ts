import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    // This endpoint returns full waybill PII keyed only by the tracking
    // code, so throttle hard to make code enumeration infeasible.
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`guia:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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
        packageItems: true,
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
