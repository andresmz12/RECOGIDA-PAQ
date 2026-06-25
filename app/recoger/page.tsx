"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";
import Textarea from "@/components/Form/Textarea";
import Alert from "@/components/Alert";
import Container from "@/components/Container";
import Card from "@/components/Card";

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const PACKAGE_TYPES = [
  { value: "document", label: "Documento" },
  { value: "small", label: "Paquete pequeño (< 5kg)" },
  { value: "medium", label: "Paquete mediano (5-20kg)" },
  { value: "large", label: "Paquete grande (> 20kg)" },
  { value: "other", label: "Otro" },
];

const TIME_WINDOWS = [
  { value: "08:00-12:00", label: "Mañana (8:00 - 12:00)" },
  { value: "12:00-17:00", label: "Tarde (12:00 - 17:00)" },
  { value: "17:00-20:00", label: "Noche (17:00 - 20:00)" },
];

export default function RecogerPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [trackingCode, setTrackingCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    pickupAddress: "",
    pickupCity: "",
    pickupState: "CA",
    pickupPostalCode: "",
    pickupCountry: "US",
    packageType: "medium",
    estimatedWeight: "",
    dimensions: "",
    packageContents: "",
    preferredDate: "",
    preferredTimeWindow: "08:00-12:00",
    specialInstructions: "",
    destinationCountry: "CO",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/pickup-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al crear la solicitud");
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      setTrackingCode(data.trackingCode);
      setStep("success");
    } catch (err) {
      setError("Error de conexión. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <Container>
          <div className="py-24 text-center">
            <div className="mb-6 text-6xl animate-bounce">✓</div>
            <h1 className="text-4xl font-black text-slate-900 mb-3">¡Solicitud creada!</h1>
            <p className="text-xl text-slate-600 mb-8">
              Tu código de seguimiento es:
            </p>
            <Card variant="elevated" padding="lg" className="max-w-md mx-auto mb-8">
              <code className="text-3xl font-mono font-bold text-indigo-600">
                {trackingCode}
              </code>
              <p className="text-slate-600 text-sm mt-4">
                Guarda este código para rastrear tu recogida
              </p>
            </Card>
            <p className="text-slate-600 mb-8">
              Te enviaremos un email de confirmación a tu dirección de correo.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline">← Volver al inicio</Button>
              </Link>
              <Link href={`/rastreo/${trackingCode}`}>
                <Button variant="primary">Rastrear mi paquete →</Button>
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <Container size="md">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold mb-4 inline-block">
            ← Volver
          </Link>
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            Solicitar Recogida
          </h1>
          <p className="text-lg text-slate-600">
            Completa el formulario para solicitar la recogida de tu paquete
          </p>
        </div>

        {error && (
          <div className="mb-8">
            <Alert
              type="error"
              title="Error al crear la solicitud"
              message={error}
              dismissible
              onDismiss={() => setError("")}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Información del Remitente */}
          <Card variant="default" padding="lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Tu información</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Nombre completo"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                placeholder="Juan Pérez"
              />
              <Input
                label="Email"
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                required
                placeholder="tu@email.com"
              />
              <Input
                label="Teléfono"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                required
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </Card>

          {/* Dirección de Recogida */}
          <Card variant="default" padding="lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Dirección de recogida</h2>
            <div className="space-y-6">
              <Input
                label="Dirección"
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                required
                placeholder="123 Main St"
              />
              <div className="grid sm:grid-cols-3 gap-4">
                <Input
                  label="Ciudad"
                  name="pickupCity"
                  value={formData.pickupCity}
                  onChange={handleChange}
                  required
                  placeholder="Miami"
                />
                <Select
                  label="Estado"
                  name="pickupState"
                  value={formData.pickupState}
                  onChange={handleChange}
                  options={US_STATES}
                  required
                />
                <Input
                  label="Código postal"
                  name="pickupPostalCode"
                  value={formData.pickupPostalCode}
                  onChange={handleChange}
                  required
                  placeholder="33101"
                />
              </div>
            </div>
          </Card>

          {/* Información del Paquete */}
          <Card variant="default" padding="lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Información del paquete</h2>
            <div className="space-y-6">
              <Select
                label="Tipo de paquete"
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                options={PACKAGE_TYPES}
                required
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Peso estimado (kg)"
                  type="number"
                  name="estimatedWeight"
                  value={formData.estimatedWeight}
                  onChange={handleChange}
                  placeholder="2.5"
                />
                <Input
                  label="Dimensiones (L x A x P)"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange}
                  placeholder="30 x 20 x 10 cm"
                />
              </div>
              <Input
                label="Contenido del paquete"
                name="packageContents"
                value={formData.packageContents}
                onChange={handleChange}
                placeholder="Ropa, accesorios, etc."
              />
              <Select
                label="País destino"
                name="destinationCountry"
                value={formData.destinationCountry}
                onChange={handleChange}
                options={[
                  { value: "CO", label: "Colombia" },
                  { value: "AR", label: "Argentina" },
                  { value: "BR", label: "Brasil" },
                  { value: "CL", label: "Chile" },
                  { value: "PE", label: "Perú" },
                  { value: "MX", label: "México" },
                  { value: "ES", label: "España" },
                  { value: "OTHER", label: "Otro país" },
                ]}
                required
              />
            </div>
          </Card>

          {/* Preferencias de Recogida */}
          <Card variant="default" padding="lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Preferencias de recogida</h2>
            <div className="space-y-6">
              <Input
                label="Fecha preferida de recogida"
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                required
              />
              <Select
                label="Rango horario"
                name="preferredTimeWindow"
                value={formData.preferredTimeWindow}
                onChange={handleChange}
                options={TIME_WINDOWS}
              />
              <Textarea
                label="Instrucciones especiales"
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                placeholder="Ej: Llamar antes de llegar, puerta de atrás, etc."
              />
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creando solicitud..." : "Crear solicitud de recogida"}
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Container>
    </div>
  );
}
