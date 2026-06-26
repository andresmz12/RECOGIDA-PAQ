import { prisma } from "@/lib/prisma";
import { launchCall } from "@/lib/zyra-client";

const AGENT_ID_CONFIRMATION = parseInt(
  process.env.ZYRA_AGENT_ID_CONFIRMATION || "0"
);
const AGENT_ID_COURIER = parseInt(process.env.ZYRA_AGENT_ID_COURIER || "0");
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 60_000;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

async function attemptCall(
  pickupRequestId: string,
  phone: string,
  agentId: number,
  attemptsUsed: number
): Promise<void> {
  try {
    const result = await launchCall(normalizePhone(phone), agentId);

    await prisma.pickupRequest.update({
      where: { id: pickupRequestId },
      data: {
        lastCallId: result.retell_call_id,
        lastCallAt: new Date(),
        callAttempts: attemptsUsed + 1,
        callStatus: "PENDING",
      },
    });
  } catch (err) {
    console.error(
      `[call-service] launchCall error (attempt ${attemptsUsed + 1}):`,
      err
    );

    if (attemptsUsed + 1 < MAX_ATTEMPTS) {
      setTimeout(
        () => attemptCall(pickupRequestId, phone, agentId, attemptsUsed + 1),
        RETRY_DELAY_MS
      );
    } else {
      console.error(
        `[call-service] Max attempts reached for pickupRequest ${pickupRequestId}`
      );
    }
  }
}

export async function triggerConfirmationCall(
  pickupRequestId: string
): Promise<void> {
  try {
    const req = await prisma.pickupRequest.findUnique({
      where: { id: pickupRequestId },
      select: { contactPhone: true, callAttempts: true },
    });

    if (!req) {
      console.error(`[call-service] PickupRequest not found: ${pickupRequestId}`);
      return;
    }

    if (!isValidPhone(req.contactPhone)) {
      console.error(
        `[call-service] Invalid phone for confirmation call: ${req.contactPhone}`
      );
      return;
    }

    await attemptCall(pickupRequestId, req.contactPhone, AGENT_ID_CONFIRMATION, 0);
  } catch (err) {
    console.error("[call-service] triggerConfirmationCall error:", err);
  }
}

export async function triggerCourierCall(
  pickupRequestId: string
): Promise<void> {
  try {
    const req = await prisma.pickupRequest.findUnique({
      where: { id: pickupRequestId },
      select: { contactPhone: true, callAttempts: true },
    });

    if (!req) {
      console.error(`[call-service] PickupRequest not found: ${pickupRequestId}`);
      return;
    }

    if (!isValidPhone(req.contactPhone)) {
      console.error(
        `[call-service] Invalid phone for courier call: ${req.contactPhone}`
      );
      return;
    }

    await attemptCall(pickupRequestId, req.contactPhone, AGENT_ID_COURIER, 0);
  } catch (err) {
    console.error("[call-service] triggerCourierCall error:", err);
  }
}
