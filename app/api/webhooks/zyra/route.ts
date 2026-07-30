import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const POSITIVE_OUTCOMES = new Set(["interested", "confirmed", "callback", "success"]);
const NEGATIVE_OUTCOMES = new Set(["no_answer", "voicemail", "not_interested", "failed"]);

function verifySignature(body: string, header: string | null): boolean {
  const secret = process.env.ZYRA_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed in production: without a secret anyone could forge webhooks
    if (process.env.NODE_ENV === "production") {
      console.error("[webhook/zyra] ZYRA_WEBHOOK_SECRET is not set — rejecting webhook. Configure it in Railway.");
      return false;
    }
    return true; // local development convenience only
  }
  if (!header) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}

function resolveCallStatus(event: string, outcome: string | undefined): "CONFIRMED" | "NO_ANSWER" {
  if (event === "call_failed") return "NO_ANSWER";
  if (!outcome) return "NO_ANSWER";
  if (POSITIVE_OUTCOMES.has(outcome)) return "CONFIRMED";
  if (NEGATIVE_OUTCOMES.has(outcome)) return "NO_ANSWER";
  return "CONFIRMED"; // unknown positive-leaning outcomes default to confirmed
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-ZyraVoice-Signature");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone: string | undefined = payload.prospect?.phone;
  const event: string = payload.event ?? "";
  const outcome: string | undefined = payload.call?.outcome;
  // Same id we stored as lastCallId when the call was launched (call-service.ts
  // reads it off `retell_call_id` in ZyraVoice's launch response) — used below
  // to reject webhooks from a call attempt that's no longer the current one.
  const callId: string | undefined =
    payload.call?.retell_call_id ?? payload.call?.call_id ?? payload.call?.id;

  if (!phone) {
    // Nothing to act on — still return 200 so ZyraVoice doesn't retry
    return NextResponse.json({ received: true });
  }

  try {
    const pickupRequest = await prisma.pickupRequest.findFirst({
      where: { contactPhone: phone },
      orderBy: { createdAt: "desc" },
    });

    if (pickupRequest) {
      // If a later call was already launched for this pickup (a new
      // lastCallId), a webhook for an earlier attempt arriving late or out
      // of order must not overwrite the newer, more accurate callStatus.
      if (callId && pickupRequest.lastCallId && callId !== pickupRequest.lastCallId) {
        console.warn(
          `[webhook/zyra] Ignoring stale call event for pickup ${pickupRequest.id}: ` +
            `webhook call ${callId} != current lastCallId ${pickupRequest.lastCallId}`
        );
        return NextResponse.json({ received: true, ignored: "stale_call_id" });
      }

      const callStatus = resolveCallStatus(event, outcome);
      await prisma.pickupRequest.update({
        where: { id: pickupRequest.id },
        data: { callStatus },
      });
    }
  } catch (err) {
    console.error("[webhook/zyra] DB error:", err);
  }

  return NextResponse.json({ received: true });
}
