import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Public — used by the pickup request form to show estimated prices
export async function GET() {
  try {
    const pricing = await (prisma as any).pricing.findMany({
      where: { active: true },
      orderBy: [{ country: "asc" }, { shippingMode: "asc" }, { packageType: "asc" }],
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

    const {
      country,
      shippingMode,
      packageType,
      basePrice,
      weightThreshold,
      weightRate,
      pricePerLb,
      minWeight,
      maxWeight,
    } = await req.json();

    const mode = shippingMode === "AIR" ? "AIR" : "MARITIME";

    if (!country || !packageType) {
      return NextResponse.json({ error: "country and packageType are required" }, { status: 400 });
    }
    if (basePrice == null && pricePerLb == null) {
      return NextResponse.json({ error: "basePrice or pricePerLb is required" }, { status: 400 });
    }

    const data = {
      basePrice: basePrice != null ? parseFloat(basePrice) : 0,
      weightThreshold: weightThreshold != null ? parseFloat(weightThreshold) : 20,
      weightRate: weightRate != null ? parseFloat(weightRate) : 1.0,
      pricePerLb: pricePerLb != null ? parseFloat(pricePerLb) : null,
      minWeight: minWeight != null ? parseFloat(minWeight) : null,
      maxWeight: maxWeight != null ? parseFloat(maxWeight) : null,
      active: true,
    };

    const rule = await (prisma as any).pricing.upsert({
      where: { country_shippingMode_packageType: { country, shippingMode: mode, packageType } },
      update: data,
      create: { country, shippingMode: mode, packageType, ...data },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Error saving pricing rule:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
