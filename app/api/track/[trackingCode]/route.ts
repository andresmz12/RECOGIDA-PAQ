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
          // Public endpoint: internal staff notes stay hidden unless the
          // entry is explicitly flagged safe to show (e.g. a case-opened
          // event, written for the customer to read).
          select: {
            fromStatus: true,
            toStatus: true,
            createdAt: true,
            notes: true,
            notesArePublic: true,
          },
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

    // Strip notes from every entry except the ones explicitly flagged
    // public — never let an internal staff note slip onto the public page.
    const statusHistory = pickupRequest.statusHistory.map(({ notesArePublic, notes, ...entry }) => ({
      ...entry,
      notes: notesArePublic ? notes : null,
    }));

    return NextResponse.json({
      trackingCode: pickupRequest.trackingCode,
      status: pickupRequest.status,
      estimatedPickupDate: pickupRequest.preferredDate,
      preferredTimeWindow: pickupRequest.preferredTimeWindow,
      lastUpdated: lastHistory?.createdAt || pickupRequest.updatedAt,
      statusHistory,
    });
  } catch (error) {
    console.error("Error tracking pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
