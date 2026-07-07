import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Customer-facing — always scoped to the caller's own cases via session,
// never a client-supplied customerId.
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user || user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cases = await prisma.case.findMany({
    where: { customerId: user.id },
    include: {
      pickupRequest: { select: { trackingCode: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cases });
}
