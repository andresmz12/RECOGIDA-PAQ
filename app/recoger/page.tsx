"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import LocationPicker from "@/components/LocationPicker";

const BOX_SIZES = [
  { value: "Caja 18x18x18", label: "Caja 18×18×18 in", dimensions: "18x18x18 in", desc: "Pequeña" },
  { value: "Caja 20x20x20", label: "Caja 20×20×20 in", dimensions: "20x20x20 in", desc: "Mediana" },
  { value: "Caja 22x22x22", label: "Caja 22×22×22 in", dimensions: "22x22x22 in", desc: "Grande" },
  { value: "Caja 24x24x24", label: "Caja 24×24×24 in", dimensions: "24x24x24 in", desc: "Extra Grande" },
  { value: "Documento",     label: "Documento",        dimensions: "",             desc: "Sobre / carta" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const TIME_WINDOWS = [
  { value: "08:00-12:00", label: "Mañana  8:00 am – 12:00 pm" },
  { value: "12:00-17:00", label: "Tarde  12:00 pm – 5:00 pm" },
  { value: "17:00-20:00", label: "Noche  5:00 pm – 8:00 pm" },
];

const EMPTY = {
  // Sender
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  // Pickup address
  pickupAddress: "",
  pickupCity: "",
  pickupState: "FL",
  pickupPostalCode: "",
  pickupCountry: "US",
  // Recipient
  recipientName: "",
  recipientPhone: "",
  recipientPhoneSecondary: "",
  recipientEmail: "",
  recipientAddress: "",
  recipientCity: "",
  recipientCountry: "HN",
  recipientState: "",
  // Package
  packageType: "Caja 20x20x20",
  estimatedWeight: "",
  packageContents: "",
  // Schedule
  preferredDate: "",
  preferredTimeWindow: "08:00-12:00",
  specialInstructions: "",
};

function Field({
  label, required, children, hint,
}: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all";

export default function RecogerPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const selectedBox = BOX_SIZES.find((b) => b.value === form.packageType);
    const payload = {
      ...form,
      dimensions: selectedBox?.dimensions || "",
      destinationCountry: form.recipientCountry,
      estimatedWeight: form.estimatedWeight ? parseFloat(form.estimatedWeight) : null,
      recipientState: form.recipientState || null,
    };

    try {
      const res = await fetch("/api/pickup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la solicitud");
        setLoading(false);
        return;
      }
      setTrackingCode(data.trackingCode);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (trackingCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
        style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-900/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">¡Solicitud creada!</h1>
          <p className="text-white/60 mb-8">Te enviaremos un email de confirmación</p>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-8">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Código de seguimiento</p>
            <p className="text-3xl font-mono font-black text-indigo-300">{trackingCode}</p>
            <p className="text-white/40 text-xs mt-3">Guarda este código para rastrear tu recogida</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1 flex items-center justify-center py-3 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/10 transition-all text-sm">
              ← Volver al inicio
            </Link>
            <Link href={`/rastreo/${trackingCode}`}
              className="flex-1 flex items-center justify-center py-3 rounded-xl font-semibold text-sm transition-all text-white"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              Rastrear paquete →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-md"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>OG</div>
            <span className="font-bold text-slate-900 text-sm">O'Globo Cargo</span>
          </div>
          <Link href="/login" className="text-sm text-indigo-600 font-semibold hover:text-indigo-700">
            Iniciar sesión
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-1">Solicitar recogida</h1>
          <p className="text-slate-500">Completa el formulario y te contactamos para coordinar</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Remitente ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">Tu información (Remitente)</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre completo" required>
                <input className={inputCls} value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="Juan García" required />
              </Field>
              <Field label="Teléfono" required>
                <input className={inputCls} value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} placeholder="+1 (305) 555-0000" required />
              </Field>
            </div>
            <Field label="Email" required>
              <input type="email" className={inputCls} value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} placeholder="tu@email.com" required />
            </Field>
          </section>

          {/* ── Dirección de recogida ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">Dirección de recogida (USA)</h2>
            </div>
            <Field label="Dirección" required>
              <input className={inputCls} value={form.pickupAddress} onChange={e => set("pickupAddress", e.target.value)} placeholder="123 NW 7th St" required />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Ciudad" required>
                <input className={inputCls} value={form.pickupCity} onChange={e => set("pickupCity", e.target.value)} placeholder="Miami" required />
              </Field>
              <Field label="Estado" required>
                <select className={inputCls + " bg-white"} value={form.pickupState} onChange={e => set("pickupState", e.target.value)} required>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="ZIP" required>
                <input className={inputCls} value={form.pickupPostalCode} onChange={e => set("pickupPostalCode", e.target.value)} placeholder="33101" required />
              </Field>
            </div>
          </section>

          {/* ── Destinatario ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">Información del destinatario</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nombre del destinatario" required>
                <input className={inputCls} value={form.recipientName} onChange={e => set("recipientName", e.target.value)} placeholder="María López" required />
              </Field>
              <Field label="Teléfono principal" required>
                <input className={inputCls} value={form.recipientPhone} onChange={e => set("recipientPhone", e.target.value)} placeholder="+504 9999-9999" required />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Teléfono secundario" hint="Opcional">
                <input className={inputCls} value={form.recipientPhoneSecondary} onChange={e => set("recipientPhoneSecondary", e.target.value)} placeholder="+504 8888-8888" />
              </Field>
              <Field label="Email del destinatario" hint="Opcional">
                <input type="email" className={inputCls} value={form.recipientEmail} onChange={e => set("recipientEmail", e.target.value)} placeholder="destinatario@email.com" />
              </Field>
            </div>

            <Field label="Dirección de entrega" required>
              <input className={inputCls} value={form.recipientAddress} onChange={e => set("recipientAddress", e.target.value)} placeholder="Col. Centro, Calle Principal #12" required />
            </Field>

            {/* Location picker: country → department → city + mini map */}
            <LocationPicker
              value={{
                country: form.recipientCountry,
                department: form.recipientState,
                city: form.recipientCity,
              }}
              onChange={({ country, department, city }) => {
                setForm(prev => ({
                  ...prev,
                  recipientCountry: country,
                  recipientState: department,
                  recipientCity: city,
                }));
              }}
            />
          </section>

          {/* ── Paquete ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">Tu paquete</h2>
            </div>

            {/* Box size selector */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2.5">Tamaño de caja <span className="text-red-500">*</span></p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BOX_SIZES.map((box) => {
                  const active = form.packageType === box.value;
                  return (
                    <button
                      key={box.value}
                      type="button"
                      onClick={() => set("packageType", box.value)}
                      className={`relative flex flex-col items-center py-3 px-2 rounded-xl border-2 transition-all text-center ${
                        active
                          ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                      <svg className={`w-7 h-7 mb-1.5 ${active ? "text-indigo-600" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {box.value === "Documento" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        )}
                      </svg>
                      <span className={`text-xs font-bold leading-tight ${active ? "text-indigo-700" : "text-slate-700"}`}>{box.label}</span>
                      <span className={`text-xs mt-0.5 ${active ? "text-indigo-500" : "text-slate-400"}`}>{box.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Peso estimado (lbs)" hint="Solo el contenido, no la caja">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={inputCls + " pr-12"}
                    value={form.estimatedWeight}
                    onChange={e => set("estimatedWeight", e.target.value)}
                    placeholder="15"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">lbs</span>
                </div>
              </Field>
              <Field label="Contenido del paquete" required>
                <input
                  className={inputCls}
                  value={form.packageContents}
                  onChange={e => set("packageContents", e.target.value)}
                  placeholder="Ropa, zapatos, electrodomésticos..."
                  required
                />
              </Field>
            </div>
          </section>

          {/* ── Fecha y hora ── */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-900">Fecha y horario de recogida</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Fecha preferida" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.preferredDate}
                  onChange={e => set("preferredDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </Field>
              <Field label="Ventana horaria" required>
                <select className={inputCls + " bg-white"} value={form.preferredTimeWindow} onChange={e => set("preferredTimeWindow", e.target.value)} required>
                  {TIME_WINDOWS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Instrucciones especiales" hint="Opcional">
              <textarea
                className={inputCls + " resize-none"}
                rows={3}
                value={form.specialInstructions}
                onChange={e => set("specialInstructions", e.target.value)}
                placeholder="Ej: Llamar antes de llegar, puerta trasera, código de acceso #1234..."
              />
            </Field>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            style={{ background: loading ? "#818cf8" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando solicitud...
              </>
            ) : (
              <>
                Solicitar recogida
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 pb-4">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">Inicia sesión</Link>
            {" "}para guardar tus solicitudes
          </p>
        </form>
      </div>
    </div>
  );
}
