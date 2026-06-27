import sgMail from "@sendgrid/mail";
import { PickupStatus } from "./generated/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const FROM = process.env.SENDGRID_FROM_EMAIL || "noreply@oglobocargo.com";
const FROM_NAME = "O'Globo Cargo";
const BASE_URL = process.env.NEXTAUTH_URL || "";

// ── Shared building blocks ────────────────────────────────────────
// Email clients (esp. Outlook) ignore CSS gradients, so every gradient
// is paired with a solid background-color fallback. Layout is table-based
// for maximum compatibility.

function layout(opts: { title: string; preheader: string; body: string }): string {
  const { title, preheader, body } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <!-- Brand header -->
          <tr>
            <td style="background-color:#142b45;background:linear-gradient(135deg,#1d4f86,#142b45);padding:22px 40px;border-radius:12px 12px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="width:36px;height:36px;background-color:#e8910c;border-radius:9px;text-align:center;line-height:36px;color:#0c1b2e;font-weight:800;font-size:14px;">OG</div>
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.2px;">O'Globo Cargo</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Title -->
          <tr>
            <td style="background:#ffffff;padding:34px 40px 0;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;color:#0f172a;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:18px 40px 38px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;color:#1e293b;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                O'Globo Cargo — International Logistics<br>
                This is an automated message — please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0;">
    <tr><td style="background-color:#1d4f86;background:linear-gradient(135deg,#1d4f86,#2c629b);border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:14px 30px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">${label}</a>
    </td></tr>
  </table>`;
}

function trackingBox(trackingCode: string): string {
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin:26px 0;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Tracking Code</p>
    <p style="margin:0;font-size:26px;font-weight:800;color:#1d4f86;font-family:'Courier New',monospace;letter-spacing:1px;">${trackingCode}</p>
  </div>`;
}

function detailsTable(rows: Array<[string, string]>): string {
  if (rows.length === 0) return "";
  const body = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:9px 0;font-size:13px;color:#64748b;width:42%;vertical-align:top;">${label}</td>
        <td style="padding:9px 0;font-size:13px;color:#0f172a;font-weight:600;vertical-align:top;">${value}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:24px 0;">
    ${body}
  </table>`;
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(d);
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn(`[email] SENDGRID_API_KEY not set — skipping email "${subject}" to ${to}`);
    return;
  }
  try {
    await sgMail.send({
      to,
      from: { email: FROM, name: FROM_NAME },
      subject,
      html,
      text, // plain-text alternative improves deliverability
    });
  } catch (error: any) {
    // Don't throw — let the request succeed even if email fails
    console.error("[email] send error:", error?.response?.body ?? error);
  }
}

// ── Pickup confirmation ───────────────────────────────────────────
export async function sendPickupConfirmationEmail(
  email: string,
  trackingCode: string,
  contactName: string,
  details?: {
    preferredDate?: Date;
    preferredTimeWindow?: string;
    pickupAddress?: string;
    pickupCity?: string;
    destination?: string;
    packageType?: string;
  }
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const rows: Array<[string, string]> = [];
  if (details?.preferredDate) rows.push(["Pickup date", fmtDate(details.preferredDate)]);
  if (details?.preferredTimeWindow) rows.push(["Time window", details.preferredTimeWindow]);
  if (details?.pickupAddress) {
    const addr = [details.pickupAddress, details.pickupCity].filter(Boolean).join(", ");
    rows.push(["Pickup address", addr]);
  }
  if (details?.destination) rows.push(["Destination", details.destination]);
  if (details?.packageType) rows.push(["Package", details.packageType]);

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${contactName}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#475569;">Your pickup request has been received and is being processed. Use the code below to track your shipment at any time.</p>
    ${trackingBox(trackingCode)}
    ${detailsTable(rows)}
    ${button(trackingUrl, "Track My Shipment →")}
    <p style="font-size:13px;color:#64748b;margin-top:24px;line-height:1.6;">You'll receive an email every time your pickup status changes.</p>
  `;

  const html = layout({
    title: "Pickup Request Confirmed",
    preheader: `Your tracking code is ${trackingCode}. Track your pickup anytime.`,
    body,
  });

  const text = [
    `Hi ${contactName},`,
    ``,
    `Your pickup request has been received and is being processed.`,
    `Tracking code: ${trackingCode}`,
    ...rows.map(([l, v]) => `${l}: ${v}`),
    ``,
    `Track your shipment: ${trackingUrl}`,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].join("\n");

  await sendEmail(email, `Pickup Confirmed — ${trackingCode}`, html, text);
}

// ── Status update ─────────────────────────────────────────────────
export async function sendStatusUpdateEmail(
  email: string,
  trackingCode: string,
  contactName: string,
  newStatus: PickupStatus,
  preferredDate?: Date
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const STATUS_MESSAGES: Record<PickupStatus, { headline: string; body: string; emoji: string }> = {
    PENDING:   { headline: "Awaiting assignment",   emoji: "🕓", body: "Your request is in our system and will be assigned to a courier soon." },
    ASSIGNED:  { headline: "Courier assigned",      emoji: "📋", body: "A courier has been assigned to your pickup request." },
    SCHEDULED: { headline: "Courier is on the way", emoji: "🚚", body: "Your courier is heading to the pickup address. Make sure someone is available." },
    EN_CAMINO: { headline: "Courier is on the way", emoji: "🚚", body: "Your courier is on the way to pick up your package. Please be available." },
    PICKED_UP: { headline: "Package picked up!",    emoji: "✅", body: "Your package has been collected successfully and is on its way." },
    CANCELLED: { headline: "Request cancelled",     emoji: "⚠️", body: "Your pickup request has been cancelled. Contact us if you have any questions." },
  };

  const { headline, body: msgBody, emoji } = STATUS_MESSAGES[newStatus];

  const statusColor: Record<PickupStatus, string> = {
    PENDING: "#f59e0b", ASSIGNED: "#3b82f6", SCHEDULED: "#2c629b",
    EN_CAMINO: "#f97316", PICKED_UP: "#10b981", CANCELLED: "#ef4444",
  };

  let dateHtml = "";
  if (preferredDate && (newStatus === "ASSIGNED" || newStatus === "SCHEDULED" || newStatus === "EN_CAMINO")) {
    dateHtml = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#1d4ed8;"><strong>Scheduled date:</strong> ${fmtDate(preferredDate)}</p>
      </div>`;
  }

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${contactName}</strong>,</p>
    <div style="border-left:4px solid ${statusColor[newStatus]};padding:14px 20px;margin:20px 0;background:#f8fafc;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:16px;color:#0f172a;">${emoji} ${headline}</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${msgBody}</p>
    </div>
    ${dateHtml}
    ${trackingBox(trackingCode)}
    ${button(trackingUrl, "View Full Details →")}
  `;

  const html = layout({
    title: "Shipment Update",
    preheader: `${headline} — ${trackingCode}`,
    body,
  });

  const text = [
    `Hi ${contactName},`,
    ``,
    `${headline}`,
    `${msgBody}`,
    preferredDate && (newStatus === "ASSIGNED" || newStatus === "SCHEDULED" || newStatus === "EN_CAMINO")
      ? `Scheduled date: ${fmtDate(preferredDate)}`
      : "",
    ``,
    `Tracking code: ${trackingCode}`,
    `View details: ${trackingUrl}`,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].filter(Boolean).join("\n");

  await sendEmail(email, `Shipment Update — ${trackingCode}`, html, text);
}

// ── Password reset ────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${BASE_URL}/reset-password/${token}`;

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${name}</strong>,</p>
    <p style="font-size:15px;line-height:1.6;color:#475569;">We received a request to reset the password for your O'Globo Cargo account. Click the button below to set a new one.</p>
    ${button(resetUrl, "Reset Password →")}
    <p style="font-size:13px;color:#64748b;margin-top:18px;line-height:1.6;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-top:20px;">
      <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.5;"><strong>Security tip:</strong> Never share this link with anyone. O'Globo Cargo staff will never ask for your password.</p>
    </div>
  `;

  const html = layout({
    title: "Reset Your Password",
    preheader: "Reset your O'Globo Cargo password — link expires in 1 hour.",
    body,
  });

  const text = [
    `Hi ${name},`,
    ``,
    `We received a request to reset your O'Globo Cargo password.`,
    `Reset it here: ${resetUrl}`,
    ``,
    `This link expires in 1 hour. If you didn't request this, ignore this email.`,
    `Never share this link. O'Globo Cargo staff will never ask for your password.`,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].join("\n");

  await sendEmail(email, "Reset your O'Globo Cargo password", html, text);
}
