import { prisma } from "@/lib/prisma";
import { sendWebhook } from "@/lib/webhook-client";
import { WebhookDelivery, WebhookEventType } from "@/lib/generated/client";

const WEBHOOK_URL = process.env.WEBHOOK_URL || "";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

export const MAX_ATTEMPTS = 5;
// Minutes to wait before attempt 2, 3, 4, 5 respectively (index = attempts - 1
// after the previous attempt just failed).
const BACKOFF_MINUTES = [1, 5, 15, 30];

async function failAttempt(
  deliveryId: string,
  attempts: number,
  responseCode: number | null
): Promise<void> {
  // attempts >= MAX_ATTEMPTS is terminal: nextRetryAt stays null so the cron
  // sweep (`nextRetryAt < now()`) never picks this row up again.
  const exhausted = attempts >= MAX_ATTEMPTS;
  const nextRetryAt = exhausted
    ? null
    : new Date(Date.now() + BACKOFF_MINUTES[attempts - 1] * 60_000);

  await prisma.webhookDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "FAILED",
      attempts,
      lastAttemptAt: new Date(),
      responseCode,
      nextRetryAt,
    },
  });
}

// Shared by the immediate send-on-creation attempt (dispatchWebhookEvent)
// and the /api/cron/retry-webhooks sweep, so the retry/backoff rules live
// in exactly one place.
export async function attemptDelivery(delivery: WebhookDelivery): Promise<void> {
  const attempts = delivery.attempts + 1;

  try {
    const { ok, status } = await sendWebhook(
      WEBHOOK_URL,
      { ...(delivery.payload as object), deliveryId: delivery.id },
      WEBHOOK_SECRET
    );

    if (ok) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          attempts,
          lastAttemptAt: new Date(),
          responseCode: status,
          nextRetryAt: null,
        },
      });
      return;
    }

    await failAttempt(delivery.id, attempts, status);
  } catch (err) {
    console.error(
      `[webhook-service] delivery ${delivery.id} attempt ${attempts} error:`,
      err
    );
    await failAttempt(delivery.id, attempts, null);
  }
}

export async function dispatchWebhookEvent(
  pickupRequestId: string,
  eventType: WebhookEventType,
  extra?: Record<string, unknown>
): Promise<void> {
  // No destination configured for this deployment — nothing to dispatch.
  if (!WEBHOOK_URL) return;

  const pickupRequest = await prisma.pickupRequest.findUnique({
    where: { id: pickupRequestId },
    select: { trackingCode: true, status: true },
  });

  if (!pickupRequest) {
    console.error(`[webhook-service] PickupRequest not found: ${pickupRequestId}`);
    return;
  }

  const payload = {
    event: eventType,
    pickupRequestId,
    trackingCode: pickupRequest.trackingCode,
    status: pickupRequest.status,
    ...extra,
    occurredAt: new Date().toISOString(),
  };

  // nextRetryAt is set to "now" (not null) at creation time so that if the
  // process crashes between this create and the attemptDelivery call below,
  // the cron sweep can still find and retry this row instead of it being
  // stuck at PENDING forever.
  const delivery = await prisma.webhookDelivery.create({
    data: {
      pickupRequestId,
      eventType,
      payload,
      status: "PENDING",
      attempts: 0,
      nextRetryAt: new Date(),
    },
  });

  await attemptDelivery(delivery);
}
