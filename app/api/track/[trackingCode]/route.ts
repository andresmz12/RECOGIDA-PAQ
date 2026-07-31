import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    // Public endpoint with no auth — throttle per IP so tracking codes
    // can't be brute-forced by enumeration.
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`track:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again in a minute." },
        { status: 429 }
      );
    }

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { trackingCode: params.trackingCode },
      select: {
        trackingCode: true,
        status: true,
        preferredDate: true,
        preferredTimeWindow: true,
        updatedAt: true,
        squarePaymentLinkUrl: true,
        statusHistory: {
          // Public endpoint: internal staff notes never leave this route.
          select: {
            fromStatus: true,
            toStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        // Read straight from Case rather than a duplicated StatusHistory
        // note — that way every case shows up here regardless of when it
        // was opened, with no separate write path to fall out of sync.
        // Only the case type is exposed; description/resolutionNotes are
        // internal.
        cases: {
          select: { type: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!pickupRequest) {
      return NextResponse.json(
        { error: "Tracking code not found" },
        { status: 404 }
      );
    }

    const lastHistory = pickupRequest.statusHistory[pickupRequest.statusHistory.length - 1];

    const caseEvents = pickupRequest.cases.map((c) => ({ type: c.type, createdAt: c.createdAt }));

    return NextResponse.json({
      trackingCode: pickupRequest.trackingCode,
      status: pickupRequest.status,
      estimatedPickupDate: pickupRequest.preferredDate,
      preferredTimeWindow: pickupRequest.preferredTimeWindow,
      lastUpdated: lastHistory?.createdAt || pickupRequest.updatedAt,
      statusHistory: pickupRequest.statusHistory,
      caseEvents,
      // Only meaningful (and only ever set) while still DRAFT — once paid,
      // Square's checkout page is no longer useful and this stays null.
      paymentUrl: pickupRequest.status === "DRAFT" ? pickupRequest.squarePaymentLinkUrl : null,
    });
  } catch (error) {
    console.error("Error tracking pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
