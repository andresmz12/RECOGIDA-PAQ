import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["ADMIN", "DISPATCHER"];

// One row per customer who has ever written in: their info, the most
// recent message, and whether staff still owes them a reply.
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !STAFF_ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerIds = await prisma.supportMessage.findMany({
    distinct: ["customerId"],
    select: { customerId: true },
  });

  const threads = await Promise.all(
    customerIds.map(async ({ customerId }) => {
      const [customer, lastMessage, unreadCount] = await Promise.all([
        prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true, email: true } }),
        prisma.supportMessage.findFirst({
          where: { customerId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.supportMessage.count({
          where: { customerId, isFromCustomer: true, readByStaff: false },
        }),
      ]);
      return { customer, lastMessage, unreadCount };
    })
  );

  threads.sort((a, b) => {
    const at = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return bt - at;
  });

  return NextResponse.json({ threads: threads.filter(t => t.customer) });
}
