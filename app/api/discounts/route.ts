import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public — validate a discount code from the pickup form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") || "").trim();
    if (!code) {
      return NextResponse.json({ valid: false });
    }

    const discount = await (prisma as any).discountCode.findFirst({
      where: { code: { equals: code, mode: "insensitive" }, active: true },
    });

    if (!discount) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      percent: discount.percent,
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
