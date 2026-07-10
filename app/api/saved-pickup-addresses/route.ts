import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const addresses = await prisma.savedPickupAddress.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: addresses });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const { label, address, city, state, postalCode, country } = body;

  if (!label || !address || !city || !country) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingCount = await prisma.savedPickupAddress.count({ where: { userId } });
  if (existingCount >= 25) {
    return NextResponse.json(
      { error: "You've reached the limit of 25 saved addresses" },
      { status: 400 }
    );
  }

  const savedAddress = await prisma.savedPickupAddress.create({
    data: {
      userId,
      label,
      address,
      city,
      state: state || null,
      postalCode: postalCode || null,
      country,
    },
  });

  return NextResponse.json({ address: savedAddress }, { status: 201 });
}
