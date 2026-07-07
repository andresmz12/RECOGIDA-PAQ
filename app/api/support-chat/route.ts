import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Customer-facing endpoint — always scoped to the caller's own thread.
// customerId is never taken from the client, so a customer can never read
// or write into someone else's conversation.

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.supportMessage.findMany({
    where: { customerId: user.id },
    orderBy: { createdAt: "asc" },
  });

  // Mark staff messages as seen now that the customer opened the thread.
  await prisma.supportMessage.updateMany({
    where: { customerId: user.id, isFromCustomer: false, readByCustomer: false },
    data: { readByCustomer: true },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; name?: string | null } | undefined;
  if (!user?.id || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`support-chat:${user.id}:${ip}`, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
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
      customerId: user.id,
      senderId: user.id,
      senderName: user.name ?? "Customer",
      senderRole: "CUSTOMER",
      isFromCustomer: true,
      body: body.trim(),
      readByCustomer: true,
      readByStaff: false,
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
