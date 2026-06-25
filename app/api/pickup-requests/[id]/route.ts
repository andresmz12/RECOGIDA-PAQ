import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendStatusUpdateEmail } from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        assignedCourier: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!pickupRequest) {
      return NextResponse.json(
        { error: "Pickup request not found" },
        { status: 404 }
      );
    }

    // Check authorization
    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (
      role === "CUSTOMER" &&
      pickupRequest.userId !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role === "COURIER" && pickupRequest.assignedCourierId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(pickupRequest);
  } catch (error) {
    console.error("Error fetching pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, assignedCourierId, notes } = body;

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: params.id },
    });

    if (!pickupRequest) {
      return NextResponse.json(
        { error: "Pickup request not found" },
        { status: 404 }
      );
    }

    const oldStatus = pickupRequest.status;

    // Update the request
    await prisma.pickupRequest.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(assignedCourierId && { assignedCourierId }),
      },
    });

    // Create status history entry if status changed
    if (status && status !== oldStatus) {
      await prisma.statusHistory.create({
        data: {
          pickupRequestId: params.id,
          fromStatus: oldStatus,
          toStatus: status,
          changedById: userId,
          notes,
        },
      });

      // Send email notification
      if (pickupRequest.contactEmail) {
        await sendStatusUpdateEmail(
          pickupRequest.contactEmail,
          pickupRequest.trackingCode,
          pickupRequest.contactName,
          status,
          pickupRequest.preferredDate
        );
      }
    }

    // Re-fetch so the response includes the new status history entry
    const finalRequest = await prisma.pickupRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        assignedCourier: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(finalRequest);
  } catch (error) {
    console.error("Error updating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
