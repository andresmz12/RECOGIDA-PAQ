import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { triggerConfirmationCall } from "@/lib/call-service";
import { dispatchWebhookEvent } from "@/lib/webhook-service";

// Square signs with HMAC-SHA256 over (notification URL + raw body), base64
// encoded — the notification URL is the exact one registered in Square's
// webhook subscription config, so it must match byte-for-byte.
function verifySignature(rawBody: string, signatureHeader: string | null, notificationUrl: string): boolean {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key) {
    // Fail closed in production: without a key anyone could forge webhooks
    if (process.env.NODE_ENV === "production") {
      console.error("[webhook/square] SQUARE_WEBHOOK_SIGNATURE_KEY is not set — rejecting webhook. Configure it in Railway.");
      return false;
    }
    return true; // local development convenience only
  }
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac("sha256", key)
    .update(notificationUrl + rawBody)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL || `${process.env.NEXTAUTH_URL || ""}/api/webhooks/square`;

  if (!verifySignature(rawBody, signature, notificationUrl)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only a completed payment activates a request — every other event type
  // (created/pending/failed/canceled) is a no-op here.
  if (payload.type !== "payment.updated") {
    return NextResponse.json({ received: true });
  }

  const payment = payload.data?.object?.payment;
  const orderId: string | undefined = payment?.order_id;
  const status: string | undefined = payment?.status;

  if (!orderId || status !== "COMPLETED") {
    return NextResponse.json({ received: true });
  }

  try {
    const pickupRequest = await prisma.pickupRequest.findFirst({
      where: { squareOrderId: orderId },
    });

    if (!pickupRequest) {
      console.warn(`[webhook/square] No pickup found for Square order ${orderId}`);
      return NextResponse.json({ received: true });
    }

    // Square can deliver payment.updated more than once for the same
    // COMPLETED payment (retries, duplicate delivery) — triggerConfirmationCall
    // and dispatchWebhookEvent are NOT idempotent, so only act once.
    if (pickupRequest.paymentStatus === "PAID") {
      return NextResponse.json({ received: true, alreadyProcessed: true });
    }

    const fromStatus = pickupRequest.status;

    await prisma.pickupRequest.update({
      where: { id: pickupRequest.id },
      data: { paymentStatus: "PAID", status: "PENDING" },
    });

    await prisma.statusHistory.create({
      data: {
        pickupRequestId: pickupRequest.id,
        fromStatus,
        toStatus: "PENDING",
        notes: "Pago confirmado vía Square — solicitud activada",
      },
    });

    // Now that the request is actually paid and active: trigger the
    // confirmation call and let external systems (e.g. ISM) know it exists.
    // These never fired at creation time — only now.
    triggerConfirmationCall(pickupRequest.id).catch((err) =>
      console.error("[webhook/square] triggerConfirmationCall error:", err)
    );
    dispatchWebhookEvent(pickupRequest.id, "CREATED").catch((err) =>
      console.error("[webhook/square] dispatchWebhookEvent error:", err)
    );
  } catch (err) {
    console.error("[webhook/square] DB error:", err);
  }

  return NextResponse.json({ received: true });
}
