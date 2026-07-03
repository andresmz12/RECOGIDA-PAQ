import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordChangedEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, currentPassword, newPassword } = await req.json();
  const userId = (session.user as any).id;

  const updateData: any = {};
  if (name?.trim()) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = phone.trim() || null;

  let passwordChanged = false;
  if (newPassword) {
    // Throttle: stops anyone (e.g. a hijacked session) from brute-forcing
    // the current password through this endpoint
    const rl = rateLimit(`pwchange:${userId}`, { limit: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    const valid = user?.password && await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 10);
    passwordChanged = true;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, phone: true },
  });

  // Security alert: if this change wasn't made by the owner, the email
  // gives them an immediate path to recover the account
  if (passwordChanged) {
    sendPasswordChangedEmail(updated.email, updated.name).catch((err) =>
      console.error("[auth/me] sendPasswordChangedEmail error:", err)
    );
  }

  return NextResponse.json(updated);
}
