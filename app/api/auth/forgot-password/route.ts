import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

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

  const { email } = parsed.data;

  // Always return success to avoid user enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Delete any existing token for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    await sendPasswordResetEmail(email, user.name, token);
  }

  return NextResponse.json({
    message: "If that email is registered, you'll receive a reset link shortly.",
  });
}
