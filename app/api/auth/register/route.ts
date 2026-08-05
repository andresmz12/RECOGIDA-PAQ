import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { normalizeEmail, isValidUSPhone } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Valid email required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  name: z.string().min(1, "Name is required.").max(100),
  phone: z
    .string()
    .optional()
    .refine((v) => !v || isValidUSPhone(v), "Please enter a valid US phone number."),
  acceptedTerms: z
    .boolean()
    .refine((v) => v === true, "You must accept the Terms and Conditions."),
  lang: z.enum(["en", "es"]).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { password, name, phone, lang } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingUser) {
    return NextResponse.json({ error: "Email already registered." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      phone: phone || null,
      role: "CUSTOMER",
      termsAcceptedAt: new Date(),
    },
  });

  // Fire-and-forget: email failures must not block registration
  sendWelcomeEmail(user.email, user.name, lang ?? "es").catch((err) =>
    console.error("[register] sendWelcomeEmail error:", err)
  );

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
