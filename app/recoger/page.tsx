"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AddressFields from "@/components/AddressFields";
import { requiresState, requiresPostalCode } from "@/lib/countries";

export default function RecogerPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [trackingCode, setTrackingCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Sender info
    contactName: "",
    contactPhone: "",
    contactEmail: "",

    // Pickup address (always US)
    pickupAddress: "",
    pickupCity: "",
    pickupState: "",
    pickupPostalCode: "",
    pickupCountry: "US",

    // Recipient info
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientPhoneSecondary: "",
    recipientAddress: "",
    recipientCity: "",
    recipientState: "",
    recipientPostalCode: "",
    recipientCountry: "US",

    // Package info
    packageType: "",
    estimatedWeight: "",
    dimensions: "",
    packageContents: "",

    // Pickup preferences
    preferredDate: "",
    preferredTimeWindow: "08:00-12:00",
    specialInstructions: "",
    notes: "",

    // Account creation
    createAccount: false,
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (formData.createAccount) {
        if (!formData.password || !formData.confirmPassword) {
          setError("La contraseña es requerida si deseas crear cuenta");
          setIsLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden");
          setIsLoading(false);
          return;
        }
      }

      if (!formData.pickupState) {
        setError("El estado de recogida es requerido");
        setIsLoading(false);
        return;
      }

      if (!formData.pickupPostalCode) {
        setError("El código postal de recogida es requerido");
        setIsLoading(false);
        return;
      }

      if (requiresState(formData.recipientCountry) && !formData.recipientState) {
        setError("El estado del destinatario es requerido para Estados Unidos");
        setIsLoading(false);
        return;
      }

      if (requiresPostalCode(formData.recipientCountry) && !formData.recipientPostalCode) {
        setError("El código postal del destinatario es requerido para Estados Unidos");
        setIsLoading(false);
        return;
      }

      const payload: any = {
        ...formData,
        preferredDate: new Date(formData.preferredDate).toISOString(),
      };

      if (!formData.createAccount) {
        delete payload.password;
        delete payload.confirmPassword;
      }

      const res = await fetch("/api/pickup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la solicitud");
        setIsLoading(false);
        return;
      }

      setTrackingCode(data.trackingCode);
      setStep("success");
    } catch (err) {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Solicitud Confirmada!</h1>

          <div className="bg-gray-100 p-6 rounded-lg mb-6">
            <p className="text-sm text-gray-600 mb-2">Tu código de seguimiento</p>
            <p className="text-3xl font-bold text-indigo-600">{trackingCode}</p>
          </div>

          <p className="text-gray-600 mb-4">
            Hemos enviado una confirmación a tu email. Guarda tu código para rastrear tu solicitud.
          </p>

          <div className="space-y-3">
            <Link
              href={`/rastreo/${trackingCode}`}
              className="block bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Ver Seguimiento
            </Link>
            <Link
              href="/"
              className="block bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-indigo-600 mb-8">Solicitar Recogida de Paquete</h1>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1 — SENDER INFO */}
          <div className="border-b pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Información del Remitente
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Teléfono *</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Email (para recibir actualizaciones)
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* 2 — PICKUP ADDRESS (US only) */}
          <div className="border-b pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Dirección de Recogida
              <span className="ml-2 text-sm font-normal text-gray-500">🇺🇸 United States</span>
            </h2>
            <AddressFields
              prefix="pickup"
              formData={formData}
              onChange={handleChange}
              lockedCountry="US"
            />
          </div>

          {/* 3 — PICKUP PREFERENCES */}
          <div className="border-b pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Preferencias de Recogida
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Fecha Preferida *</label>
                <input
                  type="date"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Rango Horario *</label>
                <select
                  name="preferredTimeWindow"
                  value={formData.preferredTimeWindow}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                >
                  <option value="08:00-12:00">8:00 AM – 12:00 PM</option>
                  <option value="12:00-16:00">12:00 PM – 4:00 PM</option>
                  <option value="16:00-20:00">4:00 PM – 8:00 PM</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Instrucciones Especiales
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={2}
                placeholder="Ej: Llamar antes de llegar, usar puerta lateral..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* 4 — RECIPIENT INFO */}
          <div className="border-b pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Información del Destinatario
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Nombre Completo *</label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Teléfono *</label>
                <input
                  type="tel"
                  name="recipientPhone"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  required
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              {formData.recipientCountry !== "US" && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Segundo Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    name="recipientPhoneSecondary"
                    value={formData.recipientPhoneSecondary}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              )}
            </div>

            <AddressFields prefix="recipient" formData={formData} onChange={handleChange} />

            {/* Notes field */}
            <div className="mt-4">
              <label className="block text-gray-700 font-semibold mb-2">
                Notas para el Destinatario (opcional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Información adicional sobre la entrega al destinatario..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* 5 — PACKAGE DETAILS */}
          <div className="border-b pb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Detalles del Paquete
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Tipo de Paquete *</label>
                <select
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="DOCUMENTO">Documento</option>
                  <option value="CAJA">Caja</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Peso Estimado (lbs)
                </label>
                <input
                  type="number"
                  name="estimatedWeight"
                  value={formData.estimatedWeight}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Dimensiones (opcional)
                </label>
                <input
                  type="text"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="Ej: 12 x 15 x 18 in"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Contenido del Paquete
                </label>
                <input
                  type="text"
                  name="packageContents"
                  value={formData.packageContents}
                  onChange={handleChange}
                  placeholder="Ej: Documentos, electrónica, ropa"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* 6 — ACCOUNT CREATION */}
          <div className="bg-blue-50 rounded-lg p-4 border-b pb-8">
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                name="createAccount"
                checked={formData.createAccount}
                onChange={handleChange}
                className="mr-3 w-5 h-5"
              />
              <span className="text-gray-700 font-semibold">
                Deseo crear una cuenta para rastrear mis solicitudes
              </span>
            </label>

            {formData.createAccount && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Confirmar Contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Procesando..." : "Solicitar Recogida"}
          </button>
        </form>
      </div>
    </div>
  );
}
