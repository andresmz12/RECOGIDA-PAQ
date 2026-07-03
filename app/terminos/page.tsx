"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface TermsSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

interface TermsContent {
  pageTitle: string;
  lastUpdated: string;
  intro: string;
  sections: TermsSection[];
  backHome: string;
  backRegister: string;
}

const CONTENT: Record<"es" | "en", TermsContent> = {
  es: {
    pageTitle: "Términos y Condiciones de Servicio",
    lastUpdated: "Última actualización: 3 de julio de 2026",
    intro:
      "Estos Términos y Condiciones (los “Términos”) constituyen un acuerdo legal vinculante entre usted (“el Cliente”) y O'Globo Cargo (“la Empresa”, “nosotros”). Al crear una cuenta, solicitar una recogida o utilizar cualquiera de nuestros servicios, usted declara que ha leído, entendido y aceptado estos Términos en su totalidad. Si no está de acuerdo con ellos, no utilice nuestros servicios.",
    sections: [
      {
        title: "1. Descripción del servicio",
        paragraphs: [
          "O'Globo Cargo presta servicios de recogida, consolidación y gestión de envíos internacionales de paquetes. Actuamos como intermediario logístico: la transportación internacional puede ser realizada por transportistas terceros, y los tiempos y condiciones de dichos terceros están fuera de nuestro control directo.",
          "La Empresa se reserva el derecho de aceptar o rechazar cualquier solicitud de recogida a su entera discreción, sin obligación de justificar la decisión.",
        ],
      },
      {
        title: "2. Registro y cuenta del Cliente",
        paragraphs: [
          "Para utilizar ciertas funciones debe crear una cuenta proporcionando información veraz, exacta y completa, y mantenerla actualizada. Usted es el único responsable de la confidencialidad de su contraseña y de toda actividad realizada desde su cuenta.",
          "La Empresa podrá suspender o cancelar cuentas que contengan información falsa, se utilicen de forma fraudulenta o incumplan estos Términos, sin responsabilidad alguna frente al Cliente.",
        ],
      },
      {
        title: "3. Obligaciones y declaraciones del Cliente",
        paragraphs: [
          "El Cliente declara y garantiza que: (a) es el propietario legítimo del contenido de cada paquete o cuenta con autorización del propietario; (b) la descripción, valor, peso y contenido declarados son veraces y completos; y (c) el envío cumple con todas las leyes y regulaciones aplicables de exportación, importación y aduanas de los países de origen, tránsito y destino.",
          "Cualquier consecuencia legal, económica o administrativa derivada de declaraciones falsas, incompletas o inexactas será responsabilidad exclusiva del Cliente.",
        ],
      },
      {
        title: "4. Artículos prohibidos",
        paragraphs: [
          "Está estrictamente prohibido entregar para su envío, entre otros, los siguientes artículos:",
        ],
        bullets: [
          "Dinero en efectivo, títulos valores, tarjetas de crédito o débito, cheques y documentos negociables.",
          "Armas de fuego, municiones, explosivos, material pirotécnico y sus componentes.",
          "Drogas ilegales, sustancias controladas y parafernalia relacionada.",
          "Materiales peligrosos, inflamables, corrosivos, radiactivos o baterías de litio sueltas.",
          "Seres vivos, restos humanos o animales, y productos perecederos sin acuerdo previo por escrito.",
          "Mercancía falsificada, robada o de origen ilícito.",
          "Cualquier artículo cuya exportación, importación o posesión esté prohibida por la ley aplicable.",
        ],
      },
      {
        title: "5. Derecho de inspección",
        paragraphs: [
          "La Empresa y las autoridades competentes podrán abrir e inspeccionar cualquier paquete en cualquier momento por razones de seguridad, aduaneras o de cumplimiento legal, sin previo aviso al Cliente. La entrega de un paquete a la Empresa constituye el consentimiento expreso del Cliente a dicha inspección.",
          "Si se detectan artículos prohibidos, la Empresa podrá retener el paquete, notificar a las autoridades y cancelar el servicio sin derecho a reembolso, quedando el Cliente como único responsable de las sanciones aplicables.",
        ],
      },
      {
        title: "6. Tarifas y pagos",
        paragraphs: [
          "Las tarifas se calculan según el peso, dimensiones, tipo de paquete y destino declarados, y pueden ser ajustadas si los datos reales difieren de los declarados. Los impuestos, aranceles, tasas aduaneras y cargos de terceros en destino corren por cuenta exclusiva del Cliente o del destinatario.",
          "Los montos pagados por servicios ya iniciados no son reembolsables, salvo que la ley aplicable disponga lo contrario.",
        ],
      },
      {
        title: "7. Fechas, horarios y tiempos de entrega",
        paragraphs: [
          "Todas las fechas y ventanas horarias de recogida, tránsito y entrega son estimaciones de buena fe y no constituyen compromisos garantizados. La Empresa no será responsable por pérdidas, costos o perjuicios derivados de retrasos, independientemente de su causa.",
        ],
      },
      {
        title: "8. Limitación de responsabilidad",
        paragraphs: [
          "EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, LA RESPONSABILIDAD TOTAL DE LA EMPRESA POR CUALQUIER RECLAMO DERIVADO DE UN ENVÍO — INCLUYENDO PÉRDIDA, DAÑO, ROBO O RETRASO — SE LIMITA AL MENOR VALOR ENTRE: (A) EL VALOR DECLARADO Y DOCUMENTADO DEL CONTENIDO, O (B) CIEN DÓLARES ESTADOUNIDENSES (US$100) POR ENVÍO, SALVO QUE EL CLIENTE HAYA CONTRATADO Y PAGADO POR ESCRITO UNA COBERTURA ADICIONAL ANTES DE LA RECOGIDA.",
          "LA EMPRESA NO SERÁ RESPONSABLE EN NINGÚN CASO POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, PUNITIVOS O CONSECUENTES, INCLUYENDO LUCRO CESANTE, PÉRDIDA DE OPORTUNIDADES DE NEGOCIO O DAÑO MORAL, AUNQUE HAYA SIDO ADVERTIDA DE SU POSIBILIDAD.",
          "La Empresa no responde por daños atribuibles a: embalaje inadecuado realizado por el Cliente, vicios propios de la mercancía, artículos frágiles no declarados, artículos prohibidos, actos de autoridades gubernamentales o aduaneras, ni actos u omisiones de transportistas terceros.",
        ],
      },
      {
        title: "9. Reclamaciones",
        paragraphs: [
          "Toda reclamación por pérdida o daño debe presentarse por escrito dentro de los quince (15) días calendario siguientes a la fecha de entrega o de la fecha estimada de entrega, acompañada de prueba del valor del contenido (facturas o recibos). Las reclamaciones presentadas fuera de este plazo se considerarán renunciadas y no serán procesadas.",
        ],
      },
      {
        title: "10. Indemnización",
        paragraphs: [
          "El Cliente acepta indemnizar, defender y mantener indemne a la Empresa, sus directivos, empleados y agentes frente a cualquier reclamo, sanción, multa, pérdida o gasto (incluidos honorarios razonables de abogados) que surja de: (a) el incumplimiento de estos Términos por parte del Cliente; (b) el contenido de sus paquetes; (c) declaraciones falsas o inexactas; o (d) la violación de cualquier ley o derecho de terceros.",
        ],
      },
      {
        title: "11. Paquetes no entregables o no reclamados",
        paragraphs: [
          "Si un paquete no puede ser entregado ni devuelto por causas no imputables a la Empresa, y el Cliente no imparte instrucciones dentro de los treinta (30) días siguientes a la notificación, la Empresa podrá disponer del paquete conforme a la ley aplicable, sin responsabilidad alguna y sin derecho a compensación para el Cliente.",
        ],
      },
      {
        title: "12. Fuerza mayor",
        paragraphs: [
          "La Empresa no será responsable por incumplimientos o retrasos causados por eventos fuera de su control razonable, incluyendo desastres naturales, condiciones climáticas severas, epidemias, actos de guerra o terrorismo, huelgas, disturbios, fallas de infraestructura, actos de autoridad gubernamental o interrupciones de transporte de terceros.",
        ],
      },
      {
        title: "13. Privacidad y datos personales",
        paragraphs: [
          "La Empresa recopila y trata los datos personales del Cliente (nombre, contacto, direcciones) únicamente para la prestación del servicio, el rastreo de envíos, las comunicaciones relacionadas y el cumplimiento de obligaciones legales. Los datos podrán compartirse con transportistas y autoridades cuando sea necesario para completar el envío o cumplir la ley.",
        ],
      },
      {
        title: "14. Modificaciones",
        paragraphs: [
          "La Empresa podrá modificar estos Términos en cualquier momento publicando la versión actualizada en esta página. El uso continuado del servicio después de la publicación constituye aceptación de los Términos modificados.",
        ],
      },
      {
        title: "15. Ley aplicable y resolución de disputas",
        paragraphs: [
          "Estos Términos se rigen por las leyes de los Estados Unidos de América y del estado donde la Empresa tiene su sede principal, sin dar efecto a sus normas sobre conflictos de leyes. Toda disputa que no pueda resolverse amistosamente será sometida a los tribunales competentes de dicha jurisdicción, y el Cliente renuncia a cualquier objeción de foro.",
          "Si alguna disposición de estos Términos fuera declarada inválida o inaplicable, las demás disposiciones conservarán plena validez y efecto.",
        ],
      },
      {
        title: "16. Contacto",
        paragraphs: [
          "Para preguntas sobre estos Términos, contáctenos a través de los canales indicados en nuestro sitio web.",
        ],
      },
    ],
    backHome: "Volver al inicio",
    backRegister: "Ir al registro",
  },
  en: {
    pageTitle: "Terms and Conditions of Service",
    lastUpdated: "Last updated: July 3, 2026",
    intro:
      "These Terms and Conditions (the “Terms”) are a binding legal agreement between you (“the Customer”) and O'Globo Cargo (“the Company”, “we”). By creating an account, requesting a pickup, or using any of our services, you represent that you have read, understood, and fully accepted these Terms. If you do not agree with them, do not use our services.",
    sections: [
      {
        title: "1. Description of the service",
        paragraphs: [
          "O'Globo Cargo provides pickup, consolidation, and management services for international package shipments. We act as a logistics intermediary: international carriage may be performed by third-party carriers, and the schedules and conditions of such third parties are outside our direct control.",
          "The Company reserves the right to accept or reject any pickup request at its sole discretion, with no obligation to justify the decision.",
        ],
      },
      {
        title: "2. Registration and Customer account",
        paragraphs: [
          "To use certain features you must create an account by providing true, accurate, and complete information, and keep it up to date. You are solely responsible for the confidentiality of your password and for all activity performed from your account.",
          "The Company may suspend or terminate accounts that contain false information, are used fraudulently, or breach these Terms, without any liability to the Customer.",
        ],
      },
      {
        title: "3. Customer obligations and representations",
        paragraphs: [
          "The Customer represents and warrants that: (a) they are the lawful owner of the contents of each package or have the owner's authorization; (b) the declared description, value, weight, and contents are true and complete; and (c) the shipment complies with all applicable export, import, and customs laws and regulations of the countries of origin, transit, and destination.",
          "Any legal, financial, or administrative consequence arising from false, incomplete, or inaccurate declarations shall be the sole responsibility of the Customer.",
        ],
      },
      {
        title: "4. Prohibited items",
        paragraphs: [
          "It is strictly prohibited to tender for shipment, among others, the following items:",
        ],
        bullets: [
          "Cash, securities, credit or debit cards, checks, and negotiable instruments.",
          "Firearms, ammunition, explosives, fireworks, and their components.",
          "Illegal drugs, controlled substances, and related paraphernalia.",
          "Hazardous, flammable, corrosive, or radioactive materials, or loose lithium batteries.",
          "Live beings, human or animal remains, and perishable goods without prior written agreement.",
          "Counterfeit, stolen, or unlawfully sourced merchandise.",
          "Any item whose export, import, or possession is prohibited by applicable law.",
        ],
      },
      {
        title: "5. Right of inspection",
        paragraphs: [
          "The Company and competent authorities may open and inspect any package at any time for security, customs, or legal-compliance reasons, without prior notice to the Customer. Tendering a package to the Company constitutes the Customer's express consent to such inspection.",
          "If prohibited items are found, the Company may hold the package, notify the authorities, and cancel the service without refund, with the Customer remaining solely liable for any applicable penalties.",
        ],
      },
      {
        title: "6. Fees and payments",
        paragraphs: [
          "Fees are calculated based on the declared weight, dimensions, package type, and destination, and may be adjusted if actual data differs from what was declared. Taxes, duties, customs fees, and third-party destination charges are the exclusive responsibility of the Customer or the recipient.",
          "Amounts paid for services already initiated are non-refundable, except where required by applicable law.",
        ],
      },
      {
        title: "7. Dates, time windows, and delivery times",
        paragraphs: [
          "All pickup, transit, and delivery dates and time windows are good-faith estimates and do not constitute guaranteed commitments. The Company shall not be liable for losses, costs, or damages arising from delays, regardless of cause.",
        ],
      },
      {
        title: "8. Limitation of liability",
        paragraphs: [
          "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY'S TOTAL LIABILITY FOR ANY CLAIM ARISING FROM A SHIPMENT — INCLUDING LOSS, DAMAGE, THEFT, OR DELAY — IS LIMITED TO THE LESSER OF: (A) THE DECLARED AND DOCUMENTED VALUE OF THE CONTENTS, OR (B) ONE HUNDRED U.S. DOLLARS (US$100) PER SHIPMENT, UNLESS THE CUSTOMER HAS PURCHASED ADDITIONAL COVERAGE IN WRITING BEFORE PICKUP.",
          "IN NO EVENT SHALL THE COMPANY BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES, INCLUDING LOST PROFITS, LOST BUSINESS OPPORTUNITIES, OR MORAL DAMAGES, EVEN IF ADVISED OF THEIR POSSIBILITY.",
          "The Company is not liable for damage attributable to: inadequate packaging by the Customer, inherent defects of the goods, undeclared fragile items, prohibited items, acts of governmental or customs authorities, or acts or omissions of third-party carriers.",
        ],
      },
      {
        title: "9. Claims",
        paragraphs: [
          "Any claim for loss or damage must be submitted in writing within fifteen (15) calendar days from the delivery date or estimated delivery date, together with proof of the contents' value (invoices or receipts). Claims submitted after this period shall be deemed waived and will not be processed.",
        ],
      },
      {
        title: "10. Indemnification",
        paragraphs: [
          "The Customer agrees to indemnify, defend, and hold harmless the Company, its officers, employees, and agents from any claim, penalty, fine, loss, or expense (including reasonable attorneys' fees) arising from: (a) the Customer's breach of these Terms; (b) the contents of their packages; (c) false or inaccurate declarations; or (d) the violation of any law or third-party right.",
        ],
      },
      {
        title: "11. Undeliverable or unclaimed packages",
        paragraphs: [
          "If a package cannot be delivered or returned for reasons not attributable to the Company, and the Customer does not provide instructions within thirty (30) days of notification, the Company may dispose of the package in accordance with applicable law, without any liability or compensation to the Customer.",
        ],
      },
      {
        title: "12. Force majeure",
        paragraphs: [
          "The Company shall not be liable for failures or delays caused by events beyond its reasonable control, including natural disasters, severe weather, epidemics, acts of war or terrorism, strikes, riots, infrastructure failures, acts of governmental authority, or third-party transportation disruptions.",
        ],
      },
      {
        title: "13. Privacy and personal data",
        paragraphs: [
          "The Company collects and processes the Customer's personal data (name, contact information, addresses) solely to provide the service, track shipments, send related communications, and comply with legal obligations. Data may be shared with carriers and authorities when necessary to complete the shipment or comply with the law.",
        ],
      },
      {
        title: "14. Modifications",
        paragraphs: [
          "The Company may modify these Terms at any time by posting the updated version on this page. Continued use of the service after posting constitutes acceptance of the modified Terms.",
        ],
      },
      {
        title: "15. Governing law and dispute resolution",
        paragraphs: [
          "These Terms are governed by the laws of the United States of America and of the state where the Company has its principal place of business, without giving effect to conflict-of-law rules. Any dispute that cannot be resolved amicably shall be submitted to the competent courts of that jurisdiction, and the Customer waives any forum objection.",
          "If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
        ],
      },
      {
        title: "16. Contact",
        paragraphs: [
          "For questions about these Terms, contact us through the channels listed on our website.",
        ],
      },
    ],
    backHome: "Back to home",
    backRegister: "Go to sign up",
  },
};

export default function TerminosPage() {
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
