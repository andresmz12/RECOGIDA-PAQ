import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordChangedEmail } from "@/lib/email";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`reset:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Case-insensitive: the token's stored email is always normalized, but
  // the User row may predate email normalization (mixed-case), so an
  // exact-match update could miss it.
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: record.email, mode: "insensitive" } },
  });
  if (!existingUser) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
    select: { email: true, name: true },
  });

  await prisma.passwordResetToken.delete({ where: { token: tokenHash } });

  // Security alert so the owner notices if someone else reset their password
  sendPasswordChangedEmail(user.email, user.name).catch((err) =>
    console.error("[reset-password] sendPasswordChangedEmail error:", err)
  );

  return NextResponse.json({ message: "Password updated successfully." });
}
