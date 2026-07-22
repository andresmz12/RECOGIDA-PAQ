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

  const address = await prisma.savedPickupAddress.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { label, address: addressLine, city, state, postalCode } = body;

  // Country isn't editable in place — it drives which state/postal format
  // the shipping form expects, so a country change belongs to a new entry.
  const data: Record<string, string | null> = {};
  for (const [key, value] of Object.entries({ label, address: addressLine, city })) {
    if (value !== undefined) {
      if (!value) {
        return NextResponse.json({ error: `${key} cannot be empty` }, { status: 400 });
      }
      data[key] = value;
    }
  }
  if (state !== undefined) data.state = state || null;
  if (postalCode !== undefined) data.postalCode = postalCode || null;

  const updated = await prisma.savedPickupAddress.update({ where: { id: params.id }, data });
  return NextResponse.json({ address: updated });
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

  const address = await prisma.savedPickupAddress.findUnique({ where: { id: params.id } });
  if (!address || address.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedPickupAddress.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
