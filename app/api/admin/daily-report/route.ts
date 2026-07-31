import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esc } from "@/lib/email";
import sgMail from "@sendgrid/mail";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayPickups, pending, assigned, enCamino, completed] = await Promise.all([
    prisma.pickupRequest.findMany({
      // Unpaid drafts aren't real pickups yet — don't show them to
      // dispatch as if they need to be worked today.
      where: { preferredDate: { gte: today, lt: tomorrow }, status: { not: "DRAFT" } },
      include: { assignedCourier: { select: { name: true } } },
      orderBy: { preferredDate: "asc" },
    }),
    prisma.pickupRequest.count({ where: { status: "PENDING" } }),
    prisma.pickupRequest.count({ where: { status: "ASSIGNED" } }),
    prisma.pickupRequest.count({ where: { status: { in: ["SCHEDULED", "EN_CAMINO"] } } }),
    prisma.pickupRequest.count({ where: { status: "PICKED_UP" } }),
  ]);

  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const rows = todayPickups.map(p => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:8px 12px;font-family:monospace;color:#4f46e5;">${esc(p.trackingCode)}</td>
      <td style="padding:8px 12px;">${esc(p.contactName)}</td>
      <td style="padding:8px 12px;">${esc(p.pickupCity)}, ${esc(p.pickupState)}</td>
      <td style="padding:8px 12px;">${esc(p.assignedCourier?.name ?? "—")}</td>
      <td style="padding:8px 12px;">${esc(p.preferredTimeWindow)}</td>
      <td style="padding:8px 12px;">
        <span style="padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;background:${
          p.status === "PENDING" ? "#fef3c7" : p.status === "ASSIGNED" ? "#dbeafe" : "#d1fae5"
        };color:${
          p.status === "PENDING" ? "#92400e" : p.status === "ASSIGNED" ? "#1e40af" : "#065f46"
        };">${p.status}</span>
      </td>
    </tr>`).join("");

  const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:sans-serif;">
<div style="max-width:700px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#0d2338,#1d4f86,#14314f);padding:32px;text-align:center;">
    <div style="width:40px;height:40px;background:linear-gradient(135deg,#1d4f86,#2c629b);border-radius:10px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
      <span style="color:#fff;font-weight:900;font-size:14px;">OG</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:22px;">Daily Operations Report</h1>
    <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;">${dateStr}</p>
  </div>
  <div style="padding:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
    ${[
      { label: "Pending", value: pending, color: "#fbbf24" },
      { label: "Assigned", value: assigned, color: "#60a5fa" },
      { label: "In Transit", value: enCamino, color: "#a78bfa" },
      { label: "Completed", value: completed, color: "#34d399" },
    ].map(s => `
    <div style="background:#f8fafc;border-radius:12px;padding:16px;text-align:center;border-left:4px solid ${s.color};">
      <p style="font-size:28px;font-weight:900;margin:0;color:#1e293b;">${s.value}</p>
      <p style="font-size:12px;color:#64748b;margin:4px 0 0;">${s.label}</p>
    </div>`).join("")}
  </div>
  ${todayPickups.length > 0 ? `
  <div style="padding:0 24px 24px;">
    <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:0 0 12px;">Today's Pickups (${todayPickups.length})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Code</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Client</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Location</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Courier</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Time</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>` : `<p style="padding:24px;color:#64748b;text-align:center;">No pickups scheduled for today.</p>`}
  <div style="padding:16px 24px;background:#f8fafc;text-align:center;font-size:12px;color:#94a3b8;">
    O'Globo Cargo · Auto-generated daily report
  </div>
</div>
</body></html>`;

  // Always send to the requesting admin's own session email — an
  // attacker-controlled header here would let anyone with an admin
  // session exfiltrate today's customer PII to an arbitrary address.
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL && user?.email) {
    await sgMail.send({
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: `Daily Report – ${dateStr} · ${todayPickups.length} pickups`,
      html,
    });
  }

  return NextResponse.json({
    ok: true,
    sent: !!process.env.SENDGRID_API_KEY,
    todayCount: todayPickups.length,
    stats: { pending, assigned, enCamino, completed },
  });
}
