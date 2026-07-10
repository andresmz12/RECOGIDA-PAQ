import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { attemptDelivery } from "@/lib/webhook-service";

function isAuthorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/retry-webhooks] CRON_SECRET is not set — rejecting request. Configure it in Railway.");
    return false;
  }
  if (!header) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

async function handleRetry(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueDeliveries = await prisma.webhookDelivery.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      nextRetryAt: { lt: new Date() },
    },
    take: 100,
  });

  for (const delivery of dueDeliveries) {
    await attemptDelivery(delivery);
  }

  return NextResponse.json({ retried: dueDeliveries.length });
}

export async function POST(request: NextRequest) {
  return handleRetry(request);
}

export async function GET(request: NextRequest) {
  return handleRetry(request);
}
