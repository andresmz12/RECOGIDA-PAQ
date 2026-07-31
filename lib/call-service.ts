import { prisma } from "@/lib/prisma";
import {
  launchCall,
  createProspectAndCall,
  CallCustomContext,
} from "@/lib/zyra-client";
import { normalizePhone } from "@/lib/utils";

const AGENT_ID_COURIER = parseInt(process.env.ZYRA_AGENT_ID_COURIER || "0");
const CAMPAIGN_ID_CONFIRMATION = parseInt(
  process.env.ZYRA_CAMPAIGN_ID || "0"
);
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 60_000;

function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
}

async function attemptCall(
  pickupRequestId: string,
  attemptsUsed: number,
  makeCall: () => Promise<{ retell_call_id: string }>
): Promise<void> {
  try {
    const result = await makeCall();

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
      `[call-service] call error (attempt ${attemptsUsed + 1}):`,
      err
    );

    if (attemptsUsed + 1 < MAX_ATTEMPTS) {
      setTimeout(
        () => attemptCall(pickupRequestId, attemptsUsed + 1, makeCall),
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
      select: {
        contactPhone: true,
        callAttempts: true,
        trackingCode: true,
        contactName: true,
        pickupAddress: true,
        recipientName: true,
        recipientAddress: true,
      },
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

    const customContext: CallCustomContext = {
      trackingCode: req.trackingCode,
      contactName: req.contactName,
      pickupAddress: req.pickupAddress,
      recipientName: req.recipientName,
      recipientAddress: req.recipientAddress,
    };

    const phone = normalizePhone(req.contactPhone);

    await attemptCall(pickupRequestId, 0, () =>
      createProspectAndCall(
        phone,
        req.contactName,
        CAMPAIGN_ID_CONFIRMATION,
        customContext
      )
    );
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
      select: {
        contactPhone: true,
        callAttempts: true,
        trackingCode: true,
        contactName: true,
        pickupAddress: true,
        recipientName: true,
        recipientAddress: true,
      },
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

    const customContext: CallCustomContext = {
      trackingCode: req.trackingCode,
      contactName: req.contactName,
      pickupAddress: req.pickupAddress,
      recipientName: req.recipientName,
      recipientAddress: req.recipientAddress,
    };

    const phone = normalizePhone(req.contactPhone);

    await attemptCall(pickupRequestId, 0, () =>
      launchCall(phone, AGENT_ID_COURIER, customContext)
    );
  } catch (err) {
    console.error("[call-service] triggerCourierCall error:", err);
  }
}
