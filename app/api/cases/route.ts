import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCaseOpenedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["ADMIN", "DISPATCHER"];
const CASE_TYPES = ["LOST", "DAMAGED", "DELAYED", "WRONG_ITEM", "NOT_HOME", "OTHER"];
// Couriers report issues from the field, not investigate shipments — limit
// them to types that describe a failed pickup attempt.
const COURIER_CASE_TYPES = ["NOT_HOME", "OTHER"];

type SessionUser = { id?: string; role?: string; name?: string | null };

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user || !STAFF_ROLES.includes(user.role ?? "")) return null;
  return user;
}

async function requireStaffOrCourier() {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;
  if (!user || ![...STAFF_ROLES, "COURIER"].includes(user.role ?? "")) return null;
  return user;
}

// Staff-only list — powers the /dashboard/casos inbox. Optional status filter.
export async function GET(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const pickupRequestId = req.nextUrl.searchParams.get("pickupRequestId");

  const cases = await prisma.case.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(pickupRequestId ? { pickupRequestId } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      pickupRequest: { select: { trackingCode: true, contactName: true, pickupCity: true } },
      notes: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  const user = await requireStaffOrCourier();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isCourier = user.role === "COURIER";

  const { pickupRequestId, type, description } = await req.json();

  if (!pickupRequestId || !type || !description?.trim()) {
    return NextResponse.json({ error: "pickupRequestId, type and description are required" }, { status: 400 });
  }
  if (!CASE_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid case type" }, { status: 400 });
  }
  if (isCourier && !COURIER_CASE_TYPES.includes(type)) {
    return NextResponse.json({ error: "Couriers can only report a failed pickup attempt" }, { status: 403 });
  }
  if (description.trim().length > 2000) {
    return NextResponse.json({ error: "Description too long" }, { status: 400 });
  }

  const pickupRequest = await prisma.pickupRequest.findUnique({
    where: { id: pickupRequestId },
    select: { id: true, userId: true, trackingCode: true, contactEmail: true, contactName: true, lang: true, assignedCourierId: true },
  });
  if (!pickupRequest) {
    return NextResponse.json({ error: "Pickup request not found" }, { status: 404 });
  }
  // A courier can only report an issue on a pickup that's actually theirs.
  if (isCourier && pickupRequest.assignedCourierId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newCase = await prisma.case.create({
    data: {
      pickupRequestId,
      customerId: pickupRequest.userId ?? null,
      createdById: user.id!,
      createdByName: user.name ?? "O'Globo Cargo",
      type,
      description: description.trim(),
    },
  });

  // The case itself is the source of truth for the public tracking
  // timeline — /api/track reads the Case table directly, so no separate
  // StatusHistory side-effect is needed here.
  if (pickupRequest.contactEmail) {
    sendCaseOpenedEmail(
      pickupRequest.contactEmail,
      pickupRequest.contactName,
      pickupRequest.trackingCode,
      type,
      (pickupRequest as any).lang === "en" ? "en" : "es"
    ).catch((err) => console.error("[cases] sendCaseOpenedEmail error:", err));
  }

  return NextResponse.json({ case: newCase }, { status: 201 });
}
