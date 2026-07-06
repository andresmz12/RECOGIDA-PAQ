import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const POSITIVE_OUTCOMES = new Set(["interested", "confirmed", "callback", "success"]);
const NEGATIVE_OUTCOMES = new Set(["no_answer", "voicemail", "not_interested", "failed"]);

function verifySignature(body: string, header: string | null): boolean {
  const secret = process.env.ZYRA_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without a shared secret anyone could spoof call outcomes.
    console.error("[webhook/zyra] ZYRA_WEBHOOK_SECRET is not set — rejecting webhook");
    return false;
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
