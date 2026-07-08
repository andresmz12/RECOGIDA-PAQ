import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STAFF_ROLES = ["ADMIN", "DISPATCHER"];

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; name?: string | null } | undefined;
  if (!user || !STAFF_ROLES.includes(user.role ?? "")) return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.caseNote.findMany({
    where: { caseId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  if (body.trim().length > 2000) {
    return NextResponse.json({ error: "Note too long" }, { status: 400 });
  }

  const existingCase = await prisma.case.findUnique({ where: { id: params.id } });
  if (!existingCase) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const note = await prisma.caseNote.create({
    data: {
      caseId: params.id,
      authorId: staff.id!,
      authorName: staff.name ?? "O'Globo Cargo",
      body: body.trim(),
    },
  });

  return NextResponse.json({ note }, { status: 201 });
}
