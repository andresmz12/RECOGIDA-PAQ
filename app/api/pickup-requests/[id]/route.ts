import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendStatusUpdateEmail } from "@/lib/email";
import { triggerCourierCall } from "@/lib/call-service";
import { dispatchWebhookEvent } from "@/lib/webhook-service";
import { requireApiKey } from "@/lib/api-key-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // External systems (e.g. the CRM) authenticate with an x-api-key header
    // instead of a NextAuth session. If the header is present it must be
    // valid; if it's absent, fall back to the existing session-based auth
    // so the dashboard UI keeps working unchanged.
    const providedApiKey = request.headers.get("x-api-key");
    const isApiKeyAuth = !!providedApiKey;

    if (isApiKeyAuth) {
      const auth = await requireApiKey(request);
      if (auth.ok === false) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }
    }

    const session = isApiKeyAuth ? null : await getServerSession(authOptions);

    if (!isApiKeyAuth && !session?.user) {
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

    // API key callers get the full record — there's no per-role filtering
    // to apply since they aren't a customer or courier.
    if (isApiKeyAuth) {
      return NextResponse.json(pickupRequest);
    }

    // Check authorization
    const role = (session!.user as any).role;
    const userId = (session!.user as any).id;

    if (
      role === "CUSTOMER" &&
      pickupRequest.userId !== userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role === "COURIER" && pickupRequest.assignedCourierId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Couriers must never see the pickup verification code, price, or
    // payment link — only a flag so the UI can require the code input.
    if (role === "COURIER") {
      const { securityCode, priceCents, paymentStatus, squarePaymentLinkId, squarePaymentLinkUrl, squareOrderId, ...rest } = pickupRequest;
      return NextResponse.json({ ...rest, requiresSecurityCode: !!securityCode });
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
    let { assignedCourierId, preferredDate, preferredTimeWindow, proofPhotoUrl } = body;
    const { status, notes, securityCode } = body;

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

    // Customers can only cancel their own pending (or still-unpaid draft)
    // requests — a DRAFT awaiting Square payment must be cancellable too,
    // otherwise an abandoned/unwanted draft is stuck forever.
    if (role === "CUSTOMER") {
      if (pickupRequest.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!["PENDING", "DRAFT"].includes(pickupRequest.status)) {
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
      // A customer cancelling their own request may only change `status` —
      // strip anything else so a crafted body can't reassign a courier,
      // reschedule, or attach a proof photo on their way to cancelling.
      assignedCourierId = undefined;
      preferredDate = undefined;
      preferredTimeWindow = undefined;
      proofPhotoUrl = undefined;
    }

    // Couriers can only update pickups assigned to them
    if (role === "COURIER" && pickupRequest.assignedCourierId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Couriers can only change status (not reassign couriers)
    if (role === "COURIER" && assignedCourierId) {
      return NextResponse.json({ error: "Couriers cannot reassign pickups" }, { status: 403 });
    }

    // Couriers must prove physical pickup: the 4-digit code only the
    // customer holds is required to mark PICKED_UP. Admin/dispatcher can
    // override manually (audited below). Legacy requests without a code
    // are exempt.
    let verificationNote: string | null = null;
    if (status === "PICKED_UP" && pickupRequest.securityCode) {
      if (role === "COURIER") {
        // The code is mandatory — an empty submission is rejected outright
        // (without consuming a guess attempt).
        if (typeof securityCode !== "string" || securityCode.trim() === "") {
          return NextResponse.json(
            { error: "SECURITY_CODE_REQUIRED" },
            { status: 400 }
          );
        }
        const rl = rateLimit(`pickup-code:${params.id}`, { limit: 5, windowMs: 10 * 60_000 });
        if (!rl.ok) {
          return NextResponse.json(
            { error: "Too many incorrect codes. Try again in 10 minutes or contact dispatch." },
            { status: 429 }
          );
        }
        if (securityCode.trim() !== pickupRequest.securityCode) {
          return NextResponse.json(
            { error: "INVALID_SECURITY_CODE" },
            { status: 403 }
          );
        }
        verificationNote = "Recogida verificada con código de seguridad";
      } else {
        // ADMIN / DISPATCHER manual confirmation — allowed, but audited
        verificationNote = "Confirmación manual sin código de seguridad";
      }
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
          notes: [verificationNote, notes].filter(Boolean).join(" · ") || null,
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
          customerLang,
          pickupRequest.securityCode
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

      // Notify external systems in background (non-blocking)
      dispatchWebhookEvent(params.id, "STATUS_CHANGED", {
        fromStatus: oldStatus,
        toStatus: status,
      }).catch((err) =>
        console.error("[pickup-requests/id] dispatchWebhookEvent error:", err)
      );
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

    // Couriers must never see the pickup verification code, price, or
    // payment link.
    if (role === "COURIER" && finalRequest) {
      const { securityCode, priceCents, paymentStatus, squarePaymentLinkId, squarePaymentLinkUrl, squareOrderId, ...rest } = finalRequest;
      return NextResponse.json({ ...rest, requiresSecurityCode: !!securityCode });
    }

    return NextResponse.json(finalRequest);
  } catch (error) {
    console.error("Error updating pickup request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
