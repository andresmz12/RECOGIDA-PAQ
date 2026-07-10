import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/api-key-auth";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

// Admin — list API keys (never returns the key value/hash, only metadata)
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const apiKeys = await prisma.apiKey.findMany({
      select: { id: true, name: true, active: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("Error listing API keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Admin — create an API key. The raw value is generated here and returned
// once in this response only; only its hash is ever persisted, so there is
// no way to retrieve it again after this call.
export async function POST(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();

    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const rawKey = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: { name, key: hashApiKey(rawKey) },
    });

    return NextResponse.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,
      createdAt: apiKey.createdAt,
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
