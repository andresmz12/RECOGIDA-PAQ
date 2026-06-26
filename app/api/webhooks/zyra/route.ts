import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type CallStatus = "CONFIRMED" | "NO_ANSWER" | "VOICEMAIL";

function resolveCallStatus(payload: any): CallStatus {
  if (payload.event === "call_failed") return "NO_ANSWER";
  if (payload.call?.call_analysis?.in_voicemail === true) return "VOICEMAIL";
  return "CONFIRMED";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const retellCallId: string | undefined = body.call?.call_id;

    if (!retellCallId) {
      return NextResponse.json({ error: "Missing call_id" }, { status: 400 });
    }

    const pickupRequest = await prisma.pickupRequest.findFirst({
      where: { lastCallId: retellCallId },
    });

    if (!pickupRequest) {
      // Unknown call — acknowledge so ZyraVoice doesn't retry endlessly
      return NextResponse.json({ received: true });
    }

    const callStatus = resolveCallStatus(body);

    await prisma.pickupRequest.update({
      where: { id: pickupRequest.id },
      data: { callStatus },
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/zyra] Error processing webhook:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
