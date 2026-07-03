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
          // Public endpoint: never expose internal staff notes here
          select: {
            fromStatus: true,
            toStatus: true,
            createdAt: true,
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

    return NextResponse.json({
      trackingCode: pickupRequest.trackingCode,
      status: pickupRequest.status,
      estimatedPickupDate: pickupRequest.preferredDate,
      preferredTimeWindow: pickupRequest.preferredTimeWindow,
      lastUpdated: lastHistory?.createdAt || pickupRequest.updatedAt,
      statusHistory: pickupRequest.statusHistory,
    });
  } catch (error) {
    console.error("Error tracking pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
