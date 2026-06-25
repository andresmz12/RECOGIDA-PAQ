import sgMail from "@sendgrid/mail";
import { PickupStatus } from "@prisma/client";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload) {
  try {
    await sgMail.send({
      to: payload.to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@oglobocargo.com",
      subject: payload.subject,
      html: payload.html,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw - let the request complete even if email fails
  }
}

export async function sendPickupConfirmationEmail(
  email: string,
  trackingCode: string,
  contactName: string
) {
  const trackingUrl = `${process.env.NEXTAUTH_URL}/rastreo/${trackingCode}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>¡Solicitud de Recogida Confirmada!</h2>
      <p>Hola ${contactName},</p>
      <p>Tu solicitud de recogida ha sido registrada correctamente.</p>

      <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #666;">Código de Seguimiento</p>
        <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #333;">${trackingCode}</p>
      </div>

      <p>Guarda tu código de seguimiento para rastrear el estado de tu solicitud.</p>

      <a href="${trackingUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Ver Estado de mi Solicitud
      </a>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">O'Globo Cargo - Servicios de Logística Internacional</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Confirmación de Solicitud de Recogida - " + trackingCode,
    html,
  });
}

export async function sendStatusUpdateEmail(
  email: string,
  trackingCode: string,
  contactName: string,
  newStatus: PickupStatus,
  preferredDate?: Date
) {
  const trackingUrl = `${process.env.NEXTAUTH_URL}/rastreo/${trackingCode}`;
  const statusMessages: Record<PickupStatus, string> = {
    PENDING: "Tu solicitud está pendiente de asignación",
    ASSIGNED: "Un courier ha sido asignado a tu solicitud",
    SCHEDULED: "Tu recogida ha sido programada",
    PICKED_UP: "¡Tu paquete ha sido recogido exitosamente!",
    CANCELLED: "Tu solicitud ha sido cancelada",
  };

  let dateHtml = "";
  if (preferredDate && (newStatus === "ASSIGNED" || newStatus === "SCHEDULED")) {
    const formattedDate = new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(preferredDate);
    dateHtml = `<p><strong>Fecha programada:</strong> ${formattedDate}</p>`;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Actualización de tu Solicitud</h2>
      <p>Hola ${contactName},</p>
      <p>${statusMessages[newStatus]}</p>

      ${dateHtml}

      <div style="background-color: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #666;">Código de Seguimiento</p>
        <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: #333;">${trackingCode}</p>
      </div>

      <a href="${trackingUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Ver Detalles Completos
      </a>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">O'Globo Cargo - Servicios de Logística Internacional</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Actualización de Solicitud - ${trackingCode}`,
    html,
  });
}
