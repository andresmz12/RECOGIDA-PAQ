import sgMail from "@sendgrid/mail";
import { PickupStatus } from "@prisma/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const FROM = process.env.SENDGRID_FROM_EMAIL || "noreply@oglobocargo.com";
const BASE_URL = process.env.NEXTAUTH_URL || "";

const BRAND = `
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;">
      O'Globo Cargo — International Logistics
    </p>
  </div>
`;

async function sendEmail(to: string, subject: string, html: string) {
  try {
    await sgMail.send({ to, from: FROM, subject, html });
  } catch (error) {
    console.error("Email error:", error);
    // Don't throw — let the request succeed even if email fails
  }
}

export async function sendPickupConfirmationEmail(
  email: string,
  trackingCode: string,
  contactName: string
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:white;">Pickup Request Confirmed</h1>
      </div>
      <div style="background:#fff;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${contactName}</strong>,</p>
        <p style="font-size:15px;line-height:1.6;">Your pickup request has been received and is being processed. Use the code below to track your shipment at any time.</p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:24px;margin:28px 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Tracking Code</p>
          <p style="margin:0;font-size:28px;font-weight:800;color:#4f46e5;font-family:monospace;">${trackingCode}</p>
        </div>

        <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
          Track My Shipment →
        </a>

        <p style="font-size:13px;color:#64748b;margin-top:24px;">
          You will receive updates by email as your pickup status changes.
        </p>
        ${BRAND}
      </div>
    </div>
  `;

  await sendEmail(email, `Pickup Confirmed — ${trackingCode}`, html);
}

export async function sendStatusUpdateEmail(
  email: string,
  trackingCode: string,
  contactName: string,
  newStatus: PickupStatus,
  preferredDate?: Date
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const STATUS_MESSAGES: Record<PickupStatus, { headline: string; body: string }> = {
    PENDING:   { headline: "Awaiting assignment",         body: "Your request is in our system and will be assigned to a courier soon." },
    ASSIGNED:  { headline: "Courier assigned",            body: "A courier has been assigned to your pickup request." },
    SCHEDULED: { headline: "Courier is on the way",       body: "Your courier is heading to the pickup address. Make sure someone is available." },
    PICKED_UP: { headline: "Package picked up!",          body: "Your package has been collected successfully and is on its way." },
    CANCELLED: { headline: "Request cancelled",           body: "Your pickup request has been cancelled. Contact us if you have questions." },
  };

  const { headline, body } = STATUS_MESSAGES[newStatus];

  let dateHtml = "";
  if (preferredDate && (newStatus === "ASSIGNED" || newStatus === "SCHEDULED")) {
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }).format(preferredDate);
    dateHtml = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#1d4ed8;"><strong>Scheduled date:</strong> ${formatted}</p>
      </div>`;
  }

  const statusColor: Record<PickupStatus, string> = {
    PENDING: "#f59e0b", ASSIGNED: "#3b82f6", SCHEDULED: "#8b5cf6",
    PICKED_UP: "#10b981", CANCELLED: "#ef4444",
  };

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:white;">Shipment Update</h1>
      </div>
      <div style="background:#fff;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${contactName}</strong>,</p>

        <div style="border-left:4px solid ${statusColor[newStatus]};padding:12px 20px;margin:20px 0;background:#f8fafc;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px;font-weight:700;font-size:15px;">${headline}</p>
          <p style="margin:0;font-size:14px;color:#475569;">${body}</p>
        </div>

        ${dateHtml}

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:28px 0;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Tracking Code</p>
          <p style="margin:0;font-size:24px;font-weight:800;color:#4f46e5;font-family:monospace;">${trackingCode}</p>
        </div>

        <a href="${trackingUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
          View Full Details →
        </a>
        ${BRAND}
      </div>
    </div>
  `;

  await sendEmail(email, `Shipment Update — ${trackingCode}`, html);
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${BASE_URL}/reset-password/${token}`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:24px;font-weight:800;color:white;">Reset Your Password</h1>
      </div>
      <div style="background:#fff;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${name}</strong>,</p>
        <p style="font-size:15px;line-height:1.6;">We received a request to reset the password for your O'Globo Cargo account. Click the button below to set a new one.</p>

        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin:20px 0;">
          Reset Password →
        </a>

        <p style="font-size:13px;color:#64748b;margin-top:8px;">
          This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
        </p>

        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin-top:20px;">
          <p style="margin:0;font-size:13px;color:#991b1b;">
            <strong>Security tip:</strong> Never share this link with anyone. O'Globo Cargo staff will never ask for your password.
          </p>
        </div>
        ${BRAND}
      </div>
    </div>
  `;

  await sendEmail(email, "Reset your O'Globo Cargo password", html);
}
