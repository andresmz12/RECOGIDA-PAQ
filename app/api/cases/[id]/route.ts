import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STAFF_ROLES = ["ADMIN", "DISPATCHER"];
const CASE_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !STAFF_ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status, resolutionNotes } = await req.json();
  if (status && !CASE_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await prisma.case.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.case.update({
    where: { id: params.id },
    data: {
      ...(status && { status }),
      ...(resolutionNotes !== undefined && { resolutionNotes: resolutionNotes || null }),
      ...(status === "RESOLVED" && !existing.resolvedAt && { resolvedAt: new Date() }),
      ...(status && status !== "RESOLVED" && { resolvedAt: null }),
    },
  });

  return NextResponse.json({ case: updated });
}
