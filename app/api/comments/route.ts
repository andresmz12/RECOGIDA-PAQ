import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Comments are internal staff notes — never expose them to customers.
const STAFF_ROLES = ["ADMIN", "DISPATCHER", "COURIER"];

async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (!STAFF_ROLES.includes((session.user as any).role)) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pickupRequestId = req.nextUrl.searchParams.get("pickupRequestId");
  if (!pickupRequestId) return NextResponse.json({ error: "pickupRequestId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { pickupRequestId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const { pickupRequestId, body } = await req.json();

  if (!pickupRequestId || !body?.trim()) {
    return NextResponse.json({ error: "pickupRequestId and body required" }, { status: 400 });
  }
  if (body.trim().length > 5000) {
    return NextResponse.json({ error: "Comment too long" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      pickupRequestId,
      authorId: user.id,
      authorName: user.name ?? user.email,
      authorRole: user.role,
      body: body.trim(),
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (comment.authorId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
