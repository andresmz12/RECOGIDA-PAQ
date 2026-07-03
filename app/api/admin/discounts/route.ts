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

// Admin — list all discount codes
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const discounts = await (prisma as any).discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ discounts });
  } catch (error) {
    console.error("Error listing discounts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin — create a discount code
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    const percent = parseFloat(body.percent);

    if (!code || code.length > 40) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      return NextResponse.json({ error: "El porcentaje debe estar entre 1 y 100" }, { status: 400 });
    }

    const existing = await (prisma as any).discountCode.findFirst({
      where: { code: { equals: code, mode: "insensitive" } },
    });
    if (existing) {
      return NextResponse.json({ error: "Ese código ya existe" }, { status: 400 });
    }

    const discount = await (prisma as any).discountCode.create({
      data: { code, percent },
    });
    return NextResponse.json({ discount });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
