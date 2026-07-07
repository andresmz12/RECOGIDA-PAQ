import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: { trackingCode: string } }
) {
  try {
    // This endpoint returns full waybill PII keyed only by the tracking
    // code, so throttle hard to make code enumeration infeasible.
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`guia:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const p = await prisma.pickupRequest.findUnique({
      where: { trackingCode: params.trackingCode },
      select: {
        trackingCode: true,
        status: true,
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        pickupAddress: true,
        pickupCity: true,
        pickupState: true,
        pickupPostalCode: true,
        pickupCountry: true,
        recipientName: true,
        recipientPhone: true,
        recipientPhoneSecondary: true,
        recipientEmail: true,
        recipientAddress: true,
        recipientCity: true,
        recipientState: true,
        recipientCountry: true,
        destinationCountry: true,
        packageType: true,
        estimatedWeight: true,
        dimensions: true,
        packageContents: true,
        packageItems: true,
        declaredValue: true,
        insuranceRequested: true,
        insuranceValue: true,
        preferredDate: true,
        preferredTimeWindow: true,
        specialInstructions: true,
        createdAt: true,
        userId: true,
        securityCode: true,
      },
    });

    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // The pickup verification code must never reach the courier — it only
    // proves physical pickup if the customer is its sole holder. Expose it
    // to the owning customer and back-office staff; hide it from everyone
    // else (the guía URL itself is public by tracking code).
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    const canSeeCode =
      !!sessionUser &&
      (sessionUser.id === p.userId ||
        ["ADMIN", "DISPATCHER"].includes(sessionUser.role ?? ""));

    const { userId: _userId, securityCode, ...publicFields } = p;
    return NextResponse.json({
      ...publicFields,
      ...(canSeeCode && securityCode ? { securityCode } : {}),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
