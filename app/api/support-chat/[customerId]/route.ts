import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSupportReplyEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["ADMIN", "DISPATCHER"];

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; name?: string | null } | undefined;
  if (!user || !STAFF_ROLES.includes(user.role ?? "")) return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.supportMessage.findMany({
    where: { customerId: params.customerId },
    orderBy: { createdAt: "asc" },
  });

  await prisma.supportMessage.updateMany({
    where: { customerId: params.customerId, isFromCustomer: true, readByStaff: false },
    data: { readByStaff: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.user.findUnique({
    where: { id: params.customerId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!customer || customer.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }
  if (body.trim().length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      customerId: customer.id,
      senderId: staff.id!,
      senderName: staff.name ?? "O'Globo Cargo",
      senderRole: staff.role!,
      isFromCustomer: false,
      body: body.trim(),
      readByCustomer: false,
      readByStaff: true,
    },
  });

  if (customer.email) {
    sendSupportReplyEmail(customer.email, customer.name).catch((err) =>
      console.error("[support-chat] sendSupportReplyEmail error:", err)
    );
  }

  return NextResponse.json({ message }, { status: 201 });
}
