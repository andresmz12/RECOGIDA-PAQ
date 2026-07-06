import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendStatusUpdateEmail } from "@/lib/email";
import { triggerCourierCall } from "@/lib/call-service";

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
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        assignedCourier: { select: { id: true, name: true, email: true, phone: true, role: true } },
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

    if (!["ADMIN", "DISPATCHER", "COURIER", "CUSTOMER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, assignedCourierId, notes, preferredDate, preferredTimeWindow, proofPhotoUrl } = body;

    const VALID_STATUSES = ["PENDING", "ASSIGNED", "SCHEDULED", "EN_CAMINO", "PICKED_UP", "CANCELLED"];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const pickupRequest = await prisma.pickupRequest.findUnique({
      where: { id: params.id },
    });

    if (!pickupRequest) {
      return NextResponse.json(
        { error: "Pickup request not found" },
        { status: 404 }
      );
    }

    // Customers can only cancel their own pending requests
    if (role === "CUSTOMER") {
      if (pickupRequest.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (pickupRequest.status !== "PENDING") {
        return NextResponse.json(
          { error: "Solo puedes cancelar solicitudes en estado Pendiente" },
          { status: 400 }
        );
      }
      if (status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Los clientes solo pueden cancelar solicitudes" },
          { status: 403 }
        );
      }
    }

    // Couriers can only update pickups assigned to them
    if (role === "COURIER" && pickupRequest.assignedCourierId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Couriers can only change status (not reassign couriers)
    if (role === "COURIER" && assignedCourierId) {
      return NextResponse.json({ error: "Couriers cannot reassign pickups" }, { status: 403 });
    }

    const oldStatus = pickupRequest.status;

    // Update the request
    await (prisma.pickupRequest.update as any)({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(assignedCourierId && { assignedCourierId }),
        ...(preferredDate && { preferredDate: new Date(preferredDate) }),
        ...(preferredTimeWindow && { preferredTimeWindow }),
        ...(proofPhotoUrl !== undefined && { proofPhotoUrl }),
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

      // Send email notification in the language the customer used on the form.
      // Fire-and-forget: an email failure must not fail the status update.
      if (pickupRequest.contactEmail) {
        const customerLang = (pickupRequest as any).lang === "en" ? "en" : "es";
        sendStatusUpdateEmail(
          pickupRequest.contactEmail,
          pickupRequest.trackingCode,
          pickupRequest.contactName,
          status,
          pickupRequest.preferredDate,
          customerLang
        ).catch((err) =>
          console.error("[pickup-requests/id] sendStatusUpdateEmail error:", err)
        );
      }

      // Trigger voice call when courier is on the way
      if (status === "EN_CAMINO") {
        triggerCourierCall(params.id).catch((err) =>
          console.error("[pickup-requests/id] triggerCourierCall error:", err)
        );
      }
    }

    // Re-fetch so the response includes the new status history entry
    const finalRequest = await prisma.pickupRequest.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, role: true } },
        assignedCourier: { select: { id: true, name: true, email: true, phone: true, role: true } },
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
