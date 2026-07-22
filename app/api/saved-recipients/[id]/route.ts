import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const recipient = await prisma.savedRecipient.findUnique({ where: { id: params.id } });
  if (!recipient || recipient.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
  } = body;

  // Only these fields are editable in place — recipientCountry and
  // destinationCountry drive the shipping form's country-specific address
  // fields, so changing them belongs to "create a new saved recipient",
  // not an in-place edit.
  const data: Record<string, string | null> = {};
  for (const [key, value] of Object.entries({
    label,
    recipientName,
    recipientPhone,
    recipientAddress,
    recipientCity,
  })) {
    if (value !== undefined) {
      if (!value) {
        return NextResponse.json({ error: `${key} cannot be empty` }, { status: 400 });
      }
      data[key] = value;
    }
  }
  for (const [key, value] of Object.entries({
    recipientPhoneSecondary,
    recipientEmail,
    recipientState,
    recipientPostalCode,
  })) {
    if (value !== undefined) data[key] = value || null;
  }

  const updated = await prisma.savedRecipient.update({ where: { id: params.id }, data });
  return NextResponse.json({ recipient: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;

  const recipient = await prisma.savedRecipient.findUnique({ where: { id: params.id } });
  if (!recipient || recipient.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedRecipient.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
