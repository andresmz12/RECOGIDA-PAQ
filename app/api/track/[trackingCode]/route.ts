import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { trackingCode: params.trackingCode },
      select: {
        trackingCode: true,
        status: true,
        preferredDate: true,
        preferredTimeWindow: true,
        updatedAt: true,
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
    });
  } catch (error) {
    console.error("Error tracking pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
