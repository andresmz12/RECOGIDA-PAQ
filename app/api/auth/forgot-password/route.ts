import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`forgot:${ip}`, { limit: 3, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);

  // Always return success to avoid user enumeration
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (user) {
    // Delete any existing token for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    // The raw token goes out in the email link; only its hash is stored,
    // same approach as ApiKey — a DB read (or backup leak) alone can't be
    // used to reset the account.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token: tokenHash, expiresAt },
    });

    await sendPasswordResetEmail(email, user.name, token);
  }

  return NextResponse.json({
    message: "If that email is registered, you'll receive a reset link shortly.",
  });
}
