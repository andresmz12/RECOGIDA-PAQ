"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface PrivacySection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface PrivacyContent {
  pageTitle: string;
  lastUpdated: string;
  intro: string;
  sections: PrivacySection[];
  backHome: string;
  backRegister: string;
}

const CONTENT: Record<"es" | "en", PrivacyContent> = {
  es: {
    pageTitle: "Política de Privacidad",
    lastUpdated: "Última actualización: 24 de julio de 2026",
    intro:
      "Esta Política de Privacidad explica qué información recopila O'Globo Cargo (\"la Empresa\", \"nosotros\") cuando usted usa nuestro sitio web y aplicación (\"el Servicio\"), cómo la usamos, con quién la compartimos y qué derechos tiene sobre ella. Al usar el Servicio, usted acepta esta política.",
    sections: [
      {
        title: "1. Información que recopilamos",
        paragraphs: [
          "Recopilamos la información que usted nos proporciona directamente y la que se genera al usar el Servicio:",
        ],
        bullets: [
          "Datos de cuenta: nombre, correo electrónico, teléfono y contraseña (almacenada cifrada, nunca en texto plano).",
          "Datos de la solicitud de recogida: nombre, teléfono, correo y dirección del remitente y del destinatario; detalles del paquete (tipo, peso, contenido, valor declarado); fecha y horario preferidos de recogida.",
          "Fotos de evidencia de entrega, tomadas por el mensajero al confirmar la recogida.",
          "Mensajes del chat de soporte entre usted y nuestro equipo.",
          "Ubicación del dispositivo, únicamente si usted la autoriza explícitamente (por ejemplo, para mostrar el mapa de rutas o marcar el punto de partida de una ruta). Nunca la recolectamos en segundo plano.",
          "Datos técnicos automáticos: dirección IP (usada para prevenir abuso mediante límites de solicitudes) y datos básicos de uso del navegador/dispositivo.",
        ],
      },
      {
        title: "2. Cómo usamos su información",
        paragraphs: ["Usamos su información únicamente para operar el Servicio:"],
        bullets: [
          "Procesar y darle seguimiento a sus solicitudes de recogida y envíos.",
          "Enviar confirmaciones y actualizaciones de estado por correo electrónico.",
          "Enviar una llamada automática de confirmación de recogida (ver sección 3).",
          "Verificar la identidad de quien entrega el paquete mediante el código de seguridad.",
          "Responder a su chat de soporte.",
          "Prevenir fraude, abuso y accesos no autorizados.",
          "Cumplir obligaciones legales, aduaneras o contables.",
        ],
      },
      {
        title: "3. Con quién compartimos su información",
        paragraphs: [
          "No vendemos su información personal. La compartimos solo cuando es necesario para prestar el Servicio, con estos terceros:",
        ],
        bullets: [
          "Mensajeros asignados a su recogida: ven su nombre, dirección y teléfono; nunca ven su código de seguridad de recogida antes de que usted se lo entregue en persona.",
          "SendGrid (proveedor de correo electrónico): para enviarle confirmaciones y notificaciones.",
          "ZyraVoice (proveedor de llamadas automatizadas): recibe su nombre y número de teléfono para realizar la llamada de confirmación de recogida o de aviso de mensajero en camino.",
          "Sistemas externos autorizados por la Empresa (por ejemplo, un CRM interno) mediante integraciones seguras, únicamente para fines operativos del negocio.",
          "Autoridades aduaneras o gubernamentales, cuando la ley lo exija.",
        ],
      },
      {
        title: "4. Retención de datos",
        paragraphs: [
          "Conservamos su información mientras su cuenta esté activa y durante el tiempo necesario para cumplir obligaciones legales, contables o de resolución de disputas. Puede solicitar la eliminación de su cuenta en cualquier momento (ver sección 6).",
        ],
      },
      {
        title: "5. Seguridad",
        paragraphs: [
          "Aplicamos medidas técnicas razonables para proteger su información: contraseñas cifradas, conexiones HTTPS, control de acceso por roles para nuestro personal, y límites de intentos para prevenir accesos no autorizados. Ningún sistema es 100% infalible, pero trabajamos activamente para mantener su información segura.",
        ],
      },
      {
        title: "6. Sus derechos",
        paragraphs: [
          "Usted puede, en cualquier momento: acceder a sus datos desde su cuenta, corregir información incorrecta, solicitar la eliminación de su cuenta y sus datos, y retirar su consentimiento para el uso de ubicación desde los permisos de su navegador o dispositivo. Para ejercer estos derechos, contáctenos por los medios indicados en la sección 9.",
        ],
      },
      {
        title: "7. Privacidad de menores",
        paragraphs: [
          "El Servicio no está dirigido a menores de 18 años y no recopilamos intencionalmente información de menores. Si cree que un menor nos ha proporcionado datos personales, contáctenos para eliminarlos.",
        ],
      },
      {
        title: "8. Cambios a esta política",
        paragraphs: [
          "Podemos actualizar esta política ocasionalmente. Publicaremos la versión vigente en esta página con la fecha de última actualización. El uso continuado del Servicio después de un cambio implica su aceptación.",
        ],
      },
      {
        title: "9. Contacto",
        paragraphs: [
          "Para preguntas sobre esta Política de Privacidad o para ejercer sus derechos sobre sus datos, contáctenos a través de los canales listados en nuestro sitio web.",
        ],
      },
    ],
    backHome: "Volver al inicio",
    backRegister: "Ir a registro",
  },
  en: {
    pageTitle: "Privacy Policy",
    lastUpdated: "Last updated: July 24, 2026",
    intro:
      "This Privacy Policy explains what information O'Globo Cargo (\"the Company\", \"we\") collects when you use our website and app (\"the Service\"), how we use it, who we share it with, and what rights you have over it. By using the Service, you agree to this policy.",
    sections: [
      {
        title: "1. Information we collect",
        paragraphs: [
          "We collect information you give us directly and information generated by using the Service:",
        ],
        bullets: [
          "Account data: name, email, phone, and password (stored encrypted, never in plain text).",
          "Pickup request data: sender and recipient name, phone, email, and address; package details (type, weight, contents, declared value); preferred pickup date and time window.",
          "Delivery proof photos, taken by the courier when confirming a pickup.",
          "Support chat messages between you and our team.",
          "Device location, only if you explicitly grant permission (for example, to show the route map or set a route's starting point). We never collect it in the background.",
          "Automatic technical data: IP address (used to prevent abuse via rate limiting) and basic browser/device usage data.",
        ],
      },
      {
        title: "2. How we use your information",
        paragraphs: ["We use your information only to operate the Service:"],
        bullets: [
          "Process and track your pickup requests and shipments.",
          "Send confirmations and status updates by email.",
          "Send an automated pickup confirmation call (see section 3).",
          "Verify the identity of whoever hands over the package using the security code.",
          "Respond to your support chat.",
          "Prevent fraud, abuse, and unauthorized access.",
          "Comply with legal, customs, or accounting obligations.",
        ],
      },
      {
        title: "3. Who we share your information with",
        paragraphs: [
          "We do not sell your personal information. We share it only when necessary to provide the Service, with these third parties:",
        ],
        bullets: [
          "Couriers assigned to your pickup: they see your name, address, and phone; they never see your pickup security code before you hand it to them in person.",
          "SendGrid (email provider): to send you confirmations and notifications.",
          "ZyraVoice (automated calling provider): receives your name and phone number to place the pickup confirmation call or the courier-on-the-way notice.",
          "External systems authorized by the Company (e.g. an internal CRM) through secure integrations, solely for business operations.",
          "Customs or government authorities, when required by law.",
        ],
      },
      {
        title: "4. Data retention",
        paragraphs: [
          "We keep your information while your account is active and for as long as needed to meet legal, accounting, or dispute-resolution obligations. You may request account deletion at any time (see section 6).",
        ],
      },
      {
        title: "5. Security",
        paragraphs: [
          "We apply reasonable technical measures to protect your information: encrypted passwords, HTTPS connections, role-based access control for our staff, and attempt limits to prevent unauthorized access. No system is 100% foolproof, but we actively work to keep your information secure.",
        ],
      },
      {
        title: "6. Your rights",
        paragraphs: [
          "You may, at any time: access your data from your account, correct inaccurate information, request deletion of your account and data, and withdraw location consent from your browser or device permissions. To exercise these rights, contact us through the channels in section 9.",
        ],
      },
      {
        title: "7. Children's privacy",
        paragraphs: [
          "The Service is not directed at anyone under 18 and we do not knowingly collect information from minors. If you believe a minor has provided us with personal data, contact us to have it removed.",
        ],
      },
      {
        title: "8. Changes to this policy",
        paragraphs: [
          "We may update this policy from time to time. We'll post the current version on this page along with the last-updated date. Continued use of the Service after a change means you accept it.",
        ],
      },
      {
        title: "9. Contact",
        paragraphs: [
          "For questions about this Privacy Policy or to exercise your data rights, contact us through the channels listed on our website.",
        ],
      },
    ],
    backHome: "Back to home",
    backRegister: "Go to sign up",
  },
};

export default function PrivacidadPage() {
  const { lang } = useT();
  const c = CONTENT[lang] ?? CONTENT.es;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="text-white" style={{ background: "linear-gradient(135deg, #0c1b2e, #142b45, #0d2240)" }}>
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 mb-6">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl shadow-lg" style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
                  <span className="text-white font-black text-sm">OG</span>
                </span>
                <span className="font-bold text-lg">O&apos;Globo Cargo</span>
              </Link>
              <h1 className="text-3xl font-bold">{c.pageTitle}</h1>
              <p className="text-blue-200 text-sm mt-2">{c.lastUpdated}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-slate-700 leading-relaxed mb-8">{c.intro}</p>

        <div className="space-y-8">
          {c.sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h2>
              {s.paragraphs.map((p, i) => (
                <p key={i} className="text-slate-700 text-sm leading-relaxed mb-2">{p}</p>
              ))}
              {s.bullets && (
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="text-slate-700 text-sm leading-relaxed">{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-semibold">{c.backHome}</Link>
          <Link href="/registro" className="text-indigo-600 hover:text-indigo-700 font-semibold">{c.backRegister}</Link>
        </div>
      </main>
    </div>
  );
}
