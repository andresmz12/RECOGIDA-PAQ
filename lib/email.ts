import sgMail from "@sendgrid/mail";
import { PickupStatus } from "./generated/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const FROM = process.env.SENDGRID_FROM_EMAIL || "noreply@oglobocargo.com";
const FROM_NAME = "O'Globo Cargo";
const BASE_URL = process.env.NEXTAUTH_URL || "";

// Escape user-supplied values before interpolating them into email HTML
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function trackingBox(trackingCode: string, lang: "en" | "es" = "en"): string {
  const label = lang === "es" ? "Código de Rastreo" : "Tracking Code";
  return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:22px;margin:26px 0;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${label}</p>
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
        <td style="padding:9px 0;font-size:13px;color:#0f172a;font-weight:600;vertical-align:top;">${esc(value)}</td>
      </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:24px 0;">
    ${body}
  </table>`;
}

function fmtDate(d: Date, lang: "en" | "es" = "en"): string {
  // preferredDate is a UTC-midnight, date-only value — force UTC so the
  // date in the email always matches what the customer picked, regardless
  // of the server's configured timezone.
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
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
    discountCode?: string;
    discountPercent?: number;
    securityCode?: string;
    declaredValue?: number | null;
    insuranceValue?: number | null;
  },
  lang: "en" | "es" = "en"
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const copy = lang === "es"
    ? {
        subject: `Recogida Confirmada — ${trackingCode}`,
        title: "Solicitud de Recogida Confirmada",
        preheader: `Tu código de rastreo es ${trackingCode}. Rastrea tu recogida en cualquier momento.`,
        hi: `Hola <strong>${esc(contactName)}</strong>,`,
        hiText: `Hola ${contactName},`,
        received: "Tu solicitud de recogida fue recibida y está siendo procesada. Usa el código de abajo para rastrear tu envío en cualquier momento.",
        receivedText: "Tu solicitud de recogida fue recibida y está siendo procesada.",
        cta: "Rastrear mi envío →",
        followUp: "Recibirás un correo cada vez que cambie el estado de tu recogida.",
        trackText: `Rastrea tu envío: ${trackingUrl}`,
        trackingCodeLabel: "Código de rastreo",
        securityCodeLabel: "Código de seguridad de recogida",
        securityCodeNote: "Entrega este código al mensajero al momento de la recogida. Es tu comprobante de que el paquete fue entregado en persona — no lo compartas antes.",
        labels: {
          date: "Fecha de recogida", window: "Ventana horaria", address: "Dirección de recogida",
          destination: "Destino", pkg: "Paquete", discount: "Descuento",
          declaredValue: "Valor declarado", insurance: "Valor asegurado",
        },
      }
    : {
        subject: `Pickup Confirmed — ${trackingCode}`,
        title: "Pickup Request Confirmed",
        preheader: `Your tracking code is ${trackingCode}. Track your pickup anytime.`,
        hi: `Hi <strong>${esc(contactName)}</strong>,`,
        hiText: `Hi ${contactName},`,
        received: "Your pickup request has been received and is being processed. Use the code below to track your shipment at any time.",
        receivedText: "Your pickup request has been received and is being processed.",
        cta: "Track My Shipment →",
        followUp: "You'll receive an email every time your pickup status changes.",
        trackText: `Track your shipment: ${trackingUrl}`,
        trackingCodeLabel: "Tracking code",
        securityCodeLabel: "Pickup security code",
        securityCodeNote: "Give this code to the courier at pickup time. It's your proof the package was handed over in person — don't share it beforehand.",
        labels: {
          date: "Pickup date", window: "Time window", address: "Pickup address",
          destination: "Destination", pkg: "Package", discount: "Discount",
          declaredValue: "Declared value", insurance: "Insured value",
        },
      };

  const rows: Array<[string, string]> = [];
  if (details?.preferredDate) rows.push([copy.labels.date, fmtDate(details.preferredDate, lang)]);
  if (details?.preferredTimeWindow) rows.push([copy.labels.window, details.preferredTimeWindow]);
  if (details?.pickupAddress) {
    const addr = [details.pickupAddress, details.pickupCity].filter(Boolean).join(", ");
    rows.push([copy.labels.address, addr]);
  }
  if (details?.destination) rows.push([copy.labels.destination, details.destination]);
  if (details?.packageType) rows.push([copy.labels.pkg, details.packageType]);
  if (details?.discountCode && details?.discountPercent) {
    rows.push([copy.labels.discount, `${details.discountCode} (−${details.discountPercent}%)`]);
  }
  if (details?.declaredValue != null) rows.push([copy.labels.declaredValue, `$${details.declaredValue.toFixed(2)} USD`]);
  if (details?.insuranceValue != null) rows.push([copy.labels.insurance, `$${details.insuranceValue.toFixed(2)} USD`]);

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">${copy.hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#475569;">${copy.received}</p>
    ${trackingBox(trackingCode, lang)}
    ${details?.securityCode ? `
    <div style="background:#fffbeb;border:2px dashed #f5a524;border-radius:12px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a3570c;">${copy.securityCodeLabel}</p>
      <p style="margin:0 0 8px;font-size:28px;font-weight:800;font-family:monospace;letter-spacing:8px;color:#c9730a;">${esc(details.securityCode)}</p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#854610;">${copy.securityCodeNote}</p>
    </div>` : ""}
    ${detailsTable(rows)}
    ${button(trackingUrl, copy.cta)}
    <p style="font-size:13px;color:#64748b;margin-top:24px;line-height:1.6;">${copy.followUp}</p>
  `;

  const html = layout({
    title: copy.title,
    preheader: copy.preheader,
    body,
  });

  const text = [
    copy.hiText,
    ``,
    copy.receivedText,
    `${copy.trackingCodeLabel}: ${trackingCode}`,
    ...(details?.securityCode
      ? [`${copy.securityCodeLabel}: ${details.securityCode}`, copy.securityCodeNote]
      : []),
    ...rows.map(([l, v]) => `${l}: ${v}`),
    ``,
    copy.trackText,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].join("\n");

  await sendEmail(email, copy.subject, html, text);
}

// ── Status update ─────────────────────────────────────────────────
export async function sendStatusUpdateEmail(
  email: string,
  trackingCode: string,
  contactName: string,
  newStatus: PickupStatus,
  preferredDate?: Date,
  lang: "en" | "es" = "en",
  securityCode?: string | null
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const STATUS_MESSAGES_EN: Record<PickupStatus, { headline: string; body: string }> = {
    PENDING:   { headline: "Request received",  body: "Your pickup request has been received and will be assigned to a courier shortly." },
    ASSIGNED:  { headline: "Courier assigned",  body: "A courier has been assigned to your pickup request." },
    SCHEDULED: { headline: "Courier en route",  body: "Your courier is en route to the pickup address. Please ensure someone is available to hand over the package." },
    EN_CAMINO: { headline: "Courier en route",  body: "Your courier is en route to collect your package. Please ensure someone is available." },
    PICKED_UP: { headline: "Package collected", body: "Your package has been collected and is now in transit." },
    CANCELLED: { headline: "Request cancelled", body: "Your pickup request has been cancelled. Please contact our support team with any questions." },
  };

  const STATUS_MESSAGES_ES: Record<PickupStatus, { headline: string; body: string }> = {
    PENDING:   { headline: "Solicitud recibida",   body: "Tu solicitud de recogida fue recibida y será asignada a un mensajero en breve." },
    ASSIGNED:  { headline: "Mensajero asignado",   body: "Un mensajero ha sido asignado a tu solicitud de recogida." },
    SCHEDULED: { headline: "Mensajero en camino",  body: "Tu mensajero se encuentra en camino a la dirección de recogida. Asegúrate de que haya alguien disponible para la entrega del paquete." },
    EN_CAMINO: { headline: "Mensajero en camino",  body: "Tu mensajero se encuentra en camino a recoger tu paquete. Asegúrate de que haya alguien disponible." },
    PICKED_UP: { headline: "Paquete recogido",     body: "Tu paquete ha sido recogido y se encuentra en tránsito." },
    CANCELLED: { headline: "Solicitud cancelada",  body: "Tu solicitud de recogida ha sido cancelada. Contacta a nuestro equipo de soporte si tienes alguna pregunta." },
  };

  const copy = lang === "es"
    ? {
        subject: `Actualización de Envío — ${trackingCode}`,
        title: "Actualización de Envío",
        hi: `Hola <strong>${esc(contactName)}</strong>,`,
        hiText: `Hola ${contactName},`,
        scheduledDate: "Fecha programada",
        cta: "Ver detalles completos →",
        trackingCodeLabel: "Código de rastreo",
        viewText: "Ver detalles",
        securityCodeLabel: "Código de seguridad de recogida",
        securityCodeNote: "Ten este código a la mano y entrégaselo al mensajero cuando llegue — es la prueba de que el paquete fue entregado en persona.",
      }
    : {
        subject: `Shipment Update — ${trackingCode}`,
        title: "Shipment Update",
        hi: `Hi <strong>${esc(contactName)}</strong>,`,
        hiText: `Hi ${contactName},`,
        scheduledDate: "Scheduled date",
        cta: "View Full Details →",
        trackingCodeLabel: "Tracking code",
        viewText: "View details",
        securityCodeLabel: "Pickup security code",
        securityCodeNote: "Keep this code handy and give it to the courier when they arrive — it's the proof the package was handed over in person.",
      };

  const STATUS_MESSAGES = lang === "es" ? STATUS_MESSAGES_ES : STATUS_MESSAGES_EN;
  const { headline, body: msgBody } = STATUS_MESSAGES[newStatus];

  const statusColor: Record<PickupStatus, string> = {
    PENDING: "#f59e0b", ASSIGNED: "#3b82f6", SCHEDULED: "#2c629b",
    EN_CAMINO: "#f97316", PICKED_UP: "#10b981", CANCELLED: "#ef4444",
  };

  let dateHtml = "";
  if (preferredDate && (newStatus === "ASSIGNED" || newStatus === "SCHEDULED" || newStatus === "EN_CAMINO")) {
    dateHtml = `
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#1d4ed8;"><strong>${copy.scheduledDate}:</strong> ${fmtDate(preferredDate, lang)}</p>
      </div>`;
  }

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">${copy.hi}</p>
    <div style="border-left:4px solid ${statusColor[newStatus]};padding:14px 20px;margin:20px 0;background:#f8fafc;border-radius:0 8px 8px 0;">
      <p style="margin:0 0 4px;font-weight:700;font-size:16px;color:#0f172a;">${headline}</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${msgBody}</p>
    </div>
    ${dateHtml}
    ${securityCode && (newStatus === "SCHEDULED" || newStatus === "EN_CAMINO") ? `
    <div style="background:#fffbeb;border:2px dashed #f5a524;border-radius:12px;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a3570c;">${copy.securityCodeLabel}</p>
      <p style="margin:0 0 8px;font-size:28px;font-weight:800;font-family:monospace;letter-spacing:8px;color:#c9730a;">${esc(securityCode)}</p>
      <p style="margin:0;font-size:12px;line-height:1.5;color:#854610;">${copy.securityCodeNote}</p>
    </div>` : ""}
    ${trackingBox(trackingCode, lang)}
    ${button(trackingUrl, copy.cta)}
  `;

  const html = layout({
    title: copy.title,
    preheader: `${headline} — ${trackingCode}`,
    body,
  });

  const text = [
    copy.hiText,
    ``,
    `${headline}`,
    `${msgBody}`,
    preferredDate && (newStatus === "ASSIGNED" || newStatus === "SCHEDULED" || newStatus === "EN_CAMINO")
      ? `${copy.scheduledDate}: ${fmtDate(preferredDate, lang)}`
      : "",
    securityCode && (newStatus === "SCHEDULED" || newStatus === "EN_CAMINO")
      ? `\n${copy.securityCodeLabel}: ${securityCode}\n${copy.securityCodeNote}`
      : "",
    ``,
    `${copy.trackingCodeLabel}: ${trackingCode}`,
    `${copy.viewText}: ${trackingUrl}`,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].filter(Boolean).join("\n");

  await sendEmail(email, copy.subject, html, text);
}

// ── Welcome (account created) ─────────────────────────────────────
export async function sendWelcomeEmail(
  email: string,
  name: string,
  lang: "en" | "es" = "en"
) {
  const accountUrl = `${BASE_URL}/mi-cuenta`;
  const pickupUrl = `${BASE_URL}/recoger`;
  const termsUrl = `${BASE_URL}/terminos`;

  const copy = lang === "es"
    ? {
        subject: "Bienvenido a O'Globo Cargo",
        title: "Tu cuenta ha sido creada",
        preheader: "Tu cuenta de O'Globo Cargo fue creada exitosamente.",
        hi: `Hola <strong>${esc(name)}</strong>,`,
        created: "Tu cuenta de O'Globo Cargo fue creada exitosamente. Desde tu panel puedes:",
        features: [
          "Solicitar recogidas de paquetes internacionales",
          "Rastrear tus envíos en tiempo real",
          "Ver el historial de todas tus solicitudes",
        ],
        cta: "Ir a Mi Cuenta →",
        promoTitle: "Bono de bienvenida",
        promoBody: "Obtén un <strong>10% de descuento</strong> en tu primer envío usando este código al solicitar tu recogida:",
        promoCode: "Oglobo2026",
        promoTextLine: "Bono de bienvenida: 10% de descuento en tu primer envío con el código Oglobo2026.",
        pickupNote: `¿Listo para tu primer envío? <a href="${pickupUrl}" style="color:#1d4f86;font-weight:600;">Solicita una recogida aquí</a>.`,
        terms: `Al crear tu cuenta aceptaste nuestros <a href="${termsUrl}" style="color:#64748b;">Términos y Condiciones</a>.`,
        hiText: `Hola ${name},`,
        createdText: "Tu cuenta de O'Globo Cargo fue creada exitosamente.",
        ctaText: `Tu panel: ${accountUrl}`,
        pickupText: `Solicita una recogida: ${pickupUrl}`,
        termsText: `Al crear tu cuenta aceptaste nuestros Términos y Condiciones: ${termsUrl}`,
      }
    : {
        subject: "Welcome to O'Globo Cargo",
        title: "Your account has been created",
        preheader: "Your O'Globo Cargo account was created successfully.",
        hi: `Hi <strong>${esc(name)}</strong>,`,
        created: "Your O'Globo Cargo account was created successfully. From your dashboard you can:",
        features: [
          "Request international package pickups",
          "Track your shipments in real time",
          "See the history of all your requests",
        ],
        cta: "Go to My Account →",
        promoTitle: "Welcome bonus",
        promoBody: "Get <strong>10% off</strong> your first shipment by using this code when requesting your pickup:",
        promoCode: "Oglobo2026",
        promoTextLine: "Welcome bonus: 10% off your first shipment with code Oglobo2026.",
        pickupNote: `Ready for your first shipment? <a href="${pickupUrl}" style="color:#1d4f86;font-weight:600;">Request a pickup here</a>.`,
        terms: `By creating your account you accepted our <a href="${termsUrl}" style="color:#64748b;">Terms and Conditions</a>.`,
        hiText: `Hi ${name},`,
        createdText: "Your O'Globo Cargo account was created successfully.",
        ctaText: `Your dashboard: ${accountUrl}`,
        pickupText: `Request a pickup: ${pickupUrl}`,
        termsText: `By creating your account you accepted our Terms and Conditions: ${termsUrl}`,
      };

  const featureList = copy.features
    .map(
      (f) => `<tr>
        <td style="padding:6px 0;font-size:14px;color:#475569;vertical-align:top;width:24px;">✓</td>
        <td style="padding:6px 0;font-size:14px;color:#475569;line-height:1.5;">${f}</td>
      </tr>`
    )
    .join("");

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">${copy.hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#475569;">${copy.created}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 24px;">
      ${featureList}
    </table>
    <div style="background:#fffbeb;border:2px dashed #f59e0b;border-radius:10px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 6px;font-weight:800;font-size:15px;color:#92400e;">${copy.promoTitle}</p>
      <p style="margin:0 0 12px;font-size:14px;color:#78350f;line-height:1.5;">${copy.promoBody}</p>
      <p style="margin:0;font-size:24px;font-weight:800;color:#b45309;font-family:'Courier New',monospace;letter-spacing:1px;">${copy.promoCode}</p>
    </div>
    ${button(accountUrl, copy.cta)}
    <p style="font-size:14px;color:#475569;margin-top:24px;line-height:1.6;">${copy.pickupNote}</p>
    <p style="font-size:12px;color:#94a3b8;margin-top:24px;line-height:1.6;">${copy.terms}</p>
  `;

  const html = layout({
    title: copy.title,
    preheader: copy.preheader,
    body,
  });

  const text = [
    copy.hiText,
    ``,
    copy.createdText,
    ...copy.features.map((f) => `- ${f}`),
    ``,
    copy.promoTextLine,
    ``,
    copy.ctaText,
    copy.pickupText,
    ``,
    copy.termsText,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].join("\n");

  await sendEmail(email, copy.subject, html, text);
}

// ── Password reset ────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
) {
  const resetUrl = `${BASE_URL}/reset-password/${token}`;

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">Hi <strong>${esc(name)}</strong>,</p>
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

// ── Password changed (security alert) ─────────────────────────────
export async function sendPasswordChangedEmail(
  email: string,
  name: string,
  lang: "en" | "es" = "es"
) {
  const resetUrl = `${BASE_URL}/forgot-password`;

  const copy = lang === "es"
    ? {
        subject: "Tu contraseña de O'Globo Cargo fue cambiada",
        title: "Contraseña actualizada",
        preheader: "Tu contraseña fue cambiada. Si no fuiste tú, actúa de inmediato.",
        hi: `Hola <strong>${esc(name)}</strong>,`,
        hiText: `Hola ${name},`,
        changed: "Te confirmamos que la contraseña de tu cuenta de O'Globo Cargo acaba de ser cambiada.",
        warning: "¿No fuiste tú? Restablece tu contraseña de inmediato con el botón de abajo y contáctanos — alguien podría tener acceso a tu cuenta.",
        cta: "Restablecer contraseña →",
        resetText: `Si no fuiste tú, restablece tu contraseña aquí: ${resetUrl}`,
      }
    : {
        subject: "Your O'Globo Cargo password was changed",
        title: "Password updated",
        preheader: "Your password was changed. If this wasn't you, act immediately.",
        hi: `Hi <strong>${esc(name)}</strong>,`,
        hiText: `Hi ${name},`,
        changed: "This confirms that the password for your O'Globo Cargo account was just changed.",
        warning: "Wasn't you? Reset your password immediately using the button below and contact us — someone may have access to your account.",
        cta: "Reset Password →",
        resetText: `If this wasn't you, reset your password here: ${resetUrl}`,
      };

  const body = `
    <p style="font-size:15px;line-height:1.6;margin-top:0;">${copy.hi}</p>
    <p style="font-size:15px;line-height:1.6;color:#475569;">${copy.changed}</p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.5;"><strong>${copy.warning}</strong></p>
    </div>
    ${button(resetUrl, copy.cta)}
  `;

  const html = layout({
    title: copy.title,
    preheader: copy.preheader,
    body,
  });

  const text = [
    copy.hiText,
    ``,
    copy.changed,
    copy.resetText,
    ``,
    `O'Globo Cargo — International Logistics`,
  ].join("\n");

  await sendEmail(email, copy.subject, html, text);
}

// ── Support chat reply notification ─────────────────────────────────
export async function sendSupportReplyEmail(
  email: string,
  name: string,
  lang: "en" | "es" = "es"
) {
  const chatUrl = `${BASE_URL}/mi-cuenta`;

  const copy = lang === "es"
    ? {
        subject: "Nueva respuesta de soporte — O'Globo Cargo",
        title: "Tienes una respuesta de soporte",
        preheader: "Nuestro equipo respondió tu mensaje en el chat de soporte.",
        hi: `Hola <strong>${esc(name)}</strong>,`,
        hiText: `Hola ${name},`,
        body: "Nuestro equipo de soporte respondió tu mensaje. Ingresa a tu cuenta para ver la conversación completa.",
        cta: "Ver conversación →",
        linkText: `Ver conversación: ${chatUrl}`,
      }
    : {
        subject: "New support reply — O'Globo Cargo",
        title: "You have a support reply",
        preheader: "Our team replied to your message in the support chat.",
        hi: `Hi <strong>${esc(name)}</strong>,`,
        hiText: `Hi ${name},`,
        body: "Our support team replied to your message. Sign in to your account to see the full conversation.",
        cta: "View conversation →",
        linkText: `View conversation: ${chatUrl}`,
      };

  const html = layout({
    title: copy.title,
    preheader: copy.preheader,
    body: `
      <p style="font-size:15px;line-height:1.6;margin-top:0;">${copy.hi}</p>
      <p style="font-size:15px;line-height:1.6;color:#475569;">${copy.body}</p>
      ${button(chatUrl, copy.cta)}
    `,
  });

  const text = [copy.hiText, ``, copy.body, ``, copy.linkText, ``, `O'Globo Cargo — International Logistics`].join("\n");

  await sendEmail(email, copy.subject, html, text);
}

// ── Case opened notification ────────────────────────────────────────
export async function sendCaseOpenedEmail(
  email: string,
  contactName: string,
  trackingCode: string,
  caseType: string,
  lang: "en" | "es" = "es"
) {
  const trackingUrl = `${BASE_URL}/rastreo/${trackingCode}`;

  const TYPE_LABELS_ES: Record<string, string> = {
    LOST: "Paquete perdido", DAMAGED: "Paquete dañado", DELAYED: "Envío retrasado",
    WRONG_ITEM: "Artículo incorrecto", OTHER: "Otro",
  };
  const TYPE_LABELS_EN: Record<string, string> = {
    LOST: "Lost package", DAMAGED: "Damaged package", DELAYED: "Delayed shipment",
    WRONG_ITEM: "Wrong item", OTHER: "Other",
  };
  const typeLabel = (lang === "es" ? TYPE_LABELS_ES : TYPE_LABELS_EN)[caseType] ?? caseType;

  const copy = lang === "es"
    ? {
        subject: `Caso abierto para tu envío — ${trackingCode}`,
        title: "Hemos abierto un caso para tu envío",
        preheader: `Estamos revisando un problema con tu envío ${trackingCode}.`,
        hi: `Hola <strong>${esc(contactName)}</strong>,`,
        hiText: `Hola ${contactName},`,
        body: `Nuestro equipo abrió un caso relacionado con tu envío <strong>${trackingCode}</strong>: <strong>${typeLabel}</strong>. Estamos revisando la situación y te mantendremos informado.`,
        cta: "Ver estado del envío →",
        linkText: `Ver estado del envío: ${trackingUrl}`,
      }
    : {
        subject: `Case opened for your shipment — ${trackingCode}`,
        title: "We've opened a case for your shipment",
        preheader: `We're looking into an issue with your shipment ${trackingCode}.`,
        hi: `Hi <strong>${esc(contactName)}</strong>,`,
        hiText: `Hi ${contactName},`,
        body: `Our team opened a case for your shipment <strong>${trackingCode}</strong>: <strong>${typeLabel}</strong>. We're looking into it and will keep you updated.`,
        cta: "View shipment status →",
        linkText: `View shipment status: ${trackingUrl}`,
      };

  const html = layout({
    title: copy.title,
    preheader: copy.preheader,
    body: `
      <p style="font-size:15px;line-height:1.6;margin-top:0;">${copy.hi}</p>
      <p style="font-size:15px;line-height:1.6;color:#475569;">${copy.body}</p>
      ${button(trackingUrl, copy.cta)}
    `,
  });

  const text = [copy.hiText, ``, copy.body.replace(/<[^>]+>/g, ""), ``, copy.linkText, ``, `O'Globo Cargo — International Logistics`].join("\n");

  await sendEmail(email, copy.subject, html, text);
}
