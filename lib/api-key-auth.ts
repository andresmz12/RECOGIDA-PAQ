import crypto from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// API keys are high-entropy random tokens, not user-chosen passwords, so a
// plain SHA-256 digest (looked up by unique index) is enough — same
// approach GitHub/Stripe use for personal access tokens. This also lets us
// look a key up directly by its hash instead of comparing against every row.
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey).digest("hex");
}

export function generateApiKey(): string {
  return `rpq_${crypto.randomBytes(32).toString("hex")}`;
}

export type ApiKeyAuthResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export async function requireApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  const provided = request.headers.get("x-api-key");
  if (!provided) {
    return { ok: false, status: 401, error: "Missing x-api-key header" };
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashApiKey(provided) },
  });

  if (!apiKey || !apiKey.active) {
    return { ok: false, status: 401, error: "Invalid or inactive API key" };
  }

  // Fire-and-forget: a failure to record usage must not fail the request.
  prisma.apiKey
    .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch((err) => console.error("[api-key-auth] lastUsedAt update error:", err));

  return { ok: true };
}
