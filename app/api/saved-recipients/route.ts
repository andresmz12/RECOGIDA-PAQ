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

  const recipients = await prisma.savedRecipient.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: recipients });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const body = await request.json();
  const {
    label,
    recipientName,
    recipientPhone,
    recipientPhoneSecondary,
    recipientEmail,
    recipientAddress,
    recipientCity,
    recipientState,
    recipientPostalCode,
    recipientCountry,
    destinationCountry,
  } = body;

  if (
    !label ||
    !recipientName ||
    !recipientPhone ||
    !recipientAddress ||
    !recipientCity ||
    !recipientCountry ||
    !destinationCountry
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existingCount = await prisma.savedRecipient.count({ where: { userId } });
  if (existingCount >= 25) {
    return NextResponse.json(
      { error: "You've reached the limit of 25 saved recipients" },
      { status: 400 }
    );
  }

  const recipient = await prisma.savedRecipient.create({
    data: {
      userId,
      label,
      recipientName,
      recipientPhone,
      recipientPhoneSecondary: recipientPhoneSecondary || null,
      recipientEmail: recipientEmail || null,
      recipientAddress,
      recipientCity,
      recipientState: recipientState || null,
      recipientPostalCode: recipientPostalCode || null,
      recipientCountry,
      destinationCountry,
    },
  });

  return NextResponse.json({ recipient }, { status: 201 });
}
