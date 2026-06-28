import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public — used by the pickup request form to show estimated prices
export async function GET() {
  try {
    const pricing = await (prisma as any).pricing.findMany({
      where: { active: true },
      orderBy: [{ country: "asc" }, { packageType: "asc" }],
    });
    return NextResponse.json({ pricing });
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin only — upsert a price rule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { country, packageType, basePrice, weightThreshold, weightRate } = await req.json();

    if (!country || !packageType || basePrice == null) {
      return NextResponse.json({ error: "country, packageType and basePrice are required" }, { status: 400 });
    }

    const rule = await (prisma as any).pricing.upsert({
      where: { country_packageType: { country, packageType } },
      update: {
        basePrice: parseFloat(basePrice),
        weightThreshold: weightThreshold != null ? parseFloat(weightThreshold) : 20,
        weightRate: weightRate != null ? parseFloat(weightRate) : 1.0,
        active: true,
      },
      create: {
        country,
        packageType,
        basePrice: parseFloat(basePrice),
        weightThreshold: weightThreshold != null ? parseFloat(weightThreshold) : 20,
        weightRate: weightRate != null ? parseFloat(weightRate) : 1.0,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Error saving pricing rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
