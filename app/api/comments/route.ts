import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Comments are INTERNAL staff notes attached to a pickup request. Only staff
// (ADMIN / DISPATCHER / COURIER) may read or write them — customers must never
// see or create internal notes on a request.
const STAFF_ROLES = ["ADMIN", "DISPATCHER", "COURIER"];

function getStaff(session: any) {
  const user = session?.user;
  if (!user) return null;
  if (!STAFF_ROLES.includes(user.role)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const staff = getStaff(session);
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pickupRequestId = req.nextUrl.searchParams.get("pickupRequestId");
  if (!pickupRequestId) return NextResponse.json({ error: "pickupRequestId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { pickupRequestId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const staff = getStaff(session);
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { pickupRequestId, body } = await req.json();

  if (!pickupRequestId || !body?.trim()) {
    return NextResponse.json({ error: "pickupRequestId and body required" }, { status: 400 });
  }

  // Make sure the request actually exists before attaching a note to it.
  const exists = await prisma.pickupRequest.findUnique({
    where: { id: pickupRequestId },
    select: { id: true },
  });
  if (!exists) return NextResponse.json({ error: "Pickup request not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      pickupRequestId,
      authorId: staff.id,
      authorName: staff.name ?? staff.email,
      authorRole: staff.role,
      body: body.trim(),
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const staff = getStaff(session);
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (comment.authorId !== staff.id && staff.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
