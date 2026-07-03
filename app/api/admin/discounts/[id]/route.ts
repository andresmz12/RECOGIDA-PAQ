import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// Admin — update a discount code (toggle active, change percent)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (typeof body.active === "boolean") data.active = body.active;
    if (body.percent != null) {
      const percent = parseFloat(body.percent);
      if (isNaN(percent) || percent <= 0 || percent > 100) {
        return NextResponse.json({ error: "El porcentaje debe estar entre 1 y 100" }, { status: 400 });
      }
      data.percent = percent;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const discount = await (prisma as any).discountCode.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ discount });
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin — delete a discount code
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await (prisma as any).discountCode.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
