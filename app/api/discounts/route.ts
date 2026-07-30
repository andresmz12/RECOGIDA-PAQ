import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Public — validate a discount code from the pickup form
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`discount:${ip}`, { limit: 10, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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

    // The admin API bounds percent to (0, 100] on write, but this clamps
    // defensively too — nothing here stops an out-of-range value reaching
    // the DB some other way (direct edit, seed script), and this is the
    // client-facing source of truth for pricing math.
    const percent = Math.min(100, Math.max(0, discount.percent));

    return NextResponse.json({
      valid: true,
      code: discount.code,
      percent,
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
