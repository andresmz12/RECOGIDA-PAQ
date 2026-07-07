import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STAFF_ROLES = ["ADMIN", "DISPATCHER"];

// Lightweight endpoint for the sidebar badge — polled frequently, so it
// only does one count query instead of building the full inbox.
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !STAFF_ROLES.includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Count distinct customers waiting on a reply, not raw message count —
  // one chatty customer shouldn't inflate the badge past "how many people
  // need a response".
  const unread = await prisma.supportMessage.findMany({
    where: { isFromCustomer: true, readByStaff: false },
    distinct: ["customerId"],
    select: { customerId: true },
  });

  return NextResponse.json({ count: unread.length });
}
