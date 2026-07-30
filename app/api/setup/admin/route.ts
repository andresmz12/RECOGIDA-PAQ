import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// Without this, "no ADMIN exists yet" is the only gate — anyone who hits
// this endpoint first (a fresh deploy, a DB reset) becomes the first admin.
// Setting SETUP_SECRET closes that race; same fail-closed-in-production
// convention as ZYRA_WEBHOOK_SECRET elsewhere in this app.
function verifySetupSecret(provided: unknown): boolean {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production"; // local dev convenience only
  }
  if (typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = rateLimit(`setup:${ip}`, { limit: 3, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, name, setupSecret } = body;

    if (!verifySetupSecret(setupSecret)) {
      return NextResponse.json(
        { error: "Invalid or missing setup secret. Set SETUP_SECRET in the environment and pass it here." },
        { status: 403 }
      );
    }

    if (typeof password === "string" && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if any admin exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin user already exists. Use /login" },
        { status: 400 }
      );
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Admin user created successfully",
      email: admin.email,
      name: admin.name,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}
