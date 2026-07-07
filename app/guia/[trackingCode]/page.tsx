"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useT } from "@/lib/i18n-context";
import { formatPickupDate } from "@/lib/utils";

const COUNTRY: Record<string, string> = {
  HN: "Honduras", GT: "Guatemala", SV: "El Salvador", NI: "Nicaragua",
  DO: "Dominican Republic", PA: "Panama", CR: "Costa Rica",
  VE: "Venezuela", MX: "Mexico", CO: "Colombia", US: "United States",
};

interface BoxItem {
  packageType: string;
  estimatedWeight: number | null;
  dimensions: string;
}

interface Pickup {
  trackingCode: string;
  status: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPostalCode: string;
  pickupCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary?: string;
  recipientEmail?: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState?: string;
  recipientCountry: string;
  packageType: string;
  estimatedWeight?: number;
  dimensions?: string;
  packageContents?: string;
  packageItems?: string;
  declaredValue?: number;
  insuranceRequested?: boolean;
  insuranceValue?: number;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions?: string;
  createdAt: string;
  securityCode?: string;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-1 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-xs w-40 shrink-0 font-medium">{label}</span>
      <span className="text-slate-900 text-xs font-semibold">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
      <div className="bg-slate-700 text-white text-xs font-bold uppercase tracking-wider px-4 py-2">{title}</div>
      <div className="px-4 py-3 bg-white">{children}</div>
    </div>
  );
}

export default function GuiaPage() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const { t, lang } = useT();
  const [data, setData] = useState<Pickup | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/guia/${trackingCode}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Error loading guide"));
  }, [trackingCode]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  );
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">{t("common.loading")}</div>
  );

  const locale = lang === "en" ? "en-US" : "es-ES";
  const trackingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/guia/${trackingCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`;
  const date = formatPickupDate(data.preferredDate, locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const created = new Date(data.createdAt).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          @page { margin: 1.2cm; }
          .guia-banner {
            background: #f1f5f9 !important;
            border: 2px solid #1e293b !important;
            border-radius: 12px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .guia-banner .guia-tc-label { color: #64748b !important; }
          .guia-banner .guia-tc-code { color: #1e293b !important; }
          .guia-banner .guia-st-label { color: #64748b !important; }
          .guia-banner .guia-st-value { color: #1e293b !important; }
        }
      `}</style>

      {/* Print bar */}
      <div className="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-sm">{t("guia.title")} · {trackingCode}</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t("guia.printBtn")}
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs"
                style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>OG</div>
              <span className="font-black text-slate-900 text-lg">O&apos;Globo Cargo</span>
            </div>
            <p className="text-slate-500 text-xs">{t("guia.title")}</p>
            <p className="text-slate-400 text-xs mt-0.5">{t("guia.created")}: {created}</p>
          </div>
          <div className="text-right">
            <img src={qrUrl} alt="QR tracking" className="w-24 h-24 border border-slate-200 rounded-lg" />
            <p className="text-xs text-slate-400 mt-1">{t("guia.scanGuide")}</p>
          </div>
        </div>

        {/* Tracking code banner */}
        <div className="guia-banner bg-slate-900 rounded-xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="guia-tc-label text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">{t("guia.trackingCode")}</p>
            <p className="guia-tc-code text-2xl font-mono font-black text-indigo-300">{data.trackingCode}</p>
          </div>
          <div className="text-right">
            <p className="guia-st-label text-slate-400 text-xs font-semibold uppercase tracking-widest mb-1">{t("guia.status")}</p>
            <p className="guia-st-value text-white font-bold text-sm">{t(`status.${data.status}`)}</p>
          </div>
        </div>

        {/* Pickup verification code — only present for the owning customer */}
        {data.securityCode && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-xl p-4 mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-amber-800 text-xs font-bold uppercase tracking-widest mb-1">
                {t("guia.securityCode")}
              </p>
              <p className="text-amber-700 text-xs">{t("guia.securityCodeNote")}</p>
            </div>
            <p className="text-3xl font-mono font-black text-amber-700 tracking-[0.2em] shrink-0">
              {data.securityCode}
            </p>
          </div>
        )}

        {/* Schedule */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5 flex items-center gap-4">
          <svg className="w-8 h-8 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="font-bold text-slate-900 text-sm">{date}</p>
            <p className="text-slate-600 text-xs">{t("guia.preferredTime")}: {data.preferredTimeWindow}</p>
          </div>
        </div>

        {/* Sender */}
        <Section title={t("guia.senderSection")}>
          <Row label={t("guia.fullName")} value={data.contactName} />
          <Row label={t("guia.phone")} value={data.contactPhone} />
          <Row label={t("guia.email")} value={data.contactEmail} />
          <Row label={t("guia.pickupAddress")} value={data.pickupAddress} />
          <Row label={t("guia.cityState")} value={`${data.pickupCity}, ${data.pickupState} ${data.pickupPostalCode}`} />
          <Row label={t("guia.country")} value={COUNTRY[data.pickupCountry] ?? data.pickupCountry} />
        </Section>

        {/* Recipient */}
        <Section title={t("guia.recipientSection")}>
          <Row label={t("guia.fullName")} value={data.recipientName} />
          <Row label={t("guia.phone")} value={data.recipientPhone} />
          <Row label={t("guia.secondaryPhone")} value={data.recipientPhoneSecondary} />
          <Row label={t("guia.email")} value={data.recipientEmail} />
          <Row label={t("guia.deliveryAddress")} value={data.recipientAddress} />
          <Row label={t("guia.cityDept")} value={`${data.recipientCity}${data.recipientState ? `, ${data.recipientState}` : ""}`} />
          <Row label={t("guia.country")} value={COUNTRY[data.recipientCountry] ?? data.recipientCountry} />
        </Section>

        {/* Package */}
        <Section title={t("guia.packageSection")}>
          {(() => {
            const boxes: BoxItem[] = data.packageItems
              ? (() => { try { return JSON.parse(data.packageItems); } catch { return null; } })()
              : null;
            if (boxes && boxes.length > 1) {
              return (
                <>
                  {boxes.map((box, i) => (
                    <div key={i} className={i > 0 ? "mt-2 pt-2 border-t border-slate-100" : ""}>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{t("guia.box")} {i + 1}</p>
                      <Row label={t("guia.boxType")} value={box.packageType} />
                      {box.dimensions && <Row label={t("guia.dimensions")} value={box.dimensions} />}
                      {box.estimatedWeight != null && <Row label={t("guia.estimatedWeight")} value={`${box.estimatedWeight} lbs`} />}
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <Row label={t("guia.contents")} value={data.packageContents} />
                  </div>
                </>
              );
            }
            return (
              <>
                <Row label={t("guia.boxType")} value={data.packageType} />
                <Row label={t("guia.dimensions")} value={data.dimensions} />
                <Row label={t("guia.estimatedWeight")} value={data.estimatedWeight ? `${data.estimatedWeight} lbs` : undefined} />
                <Row label={t("guia.contents")} value={data.packageContents} />
              </>
            );
          })()}
          {data.specialInstructions && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">{t("guia.specialInstructions")}</p>
              <p className="text-xs text-amber-700">{data.specialInstructions}</p>
            </div>
          )}
        </Section>

        {/* Declared value & insurance */}
        {(data.declaredValue != null || data.insuranceRequested) && (
          <Section title={t("guia.customsSection")}>
            <Row label={t("guia.declaredValue")} value={data.declaredValue != null ? `$${data.declaredValue.toFixed(2)} USD` : undefined} />
            {data.insuranceRequested && (
              <Row label={t("guia.insuranceValue")} value={data.insuranceValue != null ? `$${data.insuranceValue.toFixed(2)} USD` : undefined} />
            )}
          </Section>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-4 mt-2">
          <p className="text-xs text-slate-400 text-center">
            {t("guia.trackAt")} <span className="text-indigo-600 font-semibold">{trackingUrl}</span>
          </p>
          <p className="text-xs text-slate-300 text-center mt-1">{t("guia.footer")}</p>
        </div>
      </div>
    </>
  );
}
