"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";

interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  notes: string | null;
  createdAt: string;
}

interface TrackingData {
  trackingCode: string;
  status: string;
  estimatedPickupDate: string;
  preferredTimeWindow: string;
  lastUpdated: string;
  statusHistory: StatusHistoryEntry[];
}

const statusMessages: Record<string, string> = {
  PENDING: "Solicitud Pendiente",
  ASSIGNED: "Courier Asignado",
  SCHEDULED: "Recogida en Camino",
  PICKED_UP: "Paquete Recogido",
  CANCELLED: "Solicitud Cancelada",
};

const statusDescriptions: Record<string, string> = {
  PENDING: "Tu solicitud está registrada y en espera de ser asignada a un courier.",
  ASSIGNED: "Se ha asignado un courier para tu recogida. Pronto se confirmará la fecha y hora.",
  SCHEDULED: "Tu courier está en camino. Estará en tu dirección en el rango horario indicado.",
  PICKED_UP: "¡Tu paquete ha sido recogido exitosamente!",
  CANCELLED: "Esta solicitud ha sido cancelada.",
};

const STEPS = ["PENDING", "ASSIGNED", "SCHEDULED", "PICKED_UP"];

function stepIndex(status: string) {
  return STEPS.indexOf(status);
}

export default function RastreoPage() {
  const params = useParams();
  const trackingCode = params.trackingCode as string;
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trackingCode) return;

    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/track/${trackingCode}`);
        if (!res.ok) {
          setError("Código de seguimiento no encontrado");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setTracking(data);
      } catch (err) {
        setError("Error al cargar información de seguimiento");
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [trackingCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-slate-600 font-medium">Cargando información de seguimiento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center px-4">
        <Container size="md">
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <h1 className="text-2xl font-black text-slate-900 mb-3">No encontrado</h1>
            <p className="text-slate-600 mb-8">{error}</p>
            <div className="flex gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">← Volver al inicio</Button>
              </Link>
              <Link href="/recoger">
                <Button variant="primary">Crear nueva solicitud</Button>
              </Link>
            </div>
          </Card>
        </Container>
      </div>
    );
  }

  if (!tracking) return null;

  const isCancelled = tracking.status === "CANCELLED";
  const currentStep = stepIndex(tracking.status);
  const formattedDate = new Date(tracking.estimatedPickupDate).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const lastUpdateDate = new Date(tracking.lastUpdated).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-12">
      <Container size="md">
        {/* Back link */}
        <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1.5 mb-8">
          ← Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 mb-2">Tu Solicitud de Recogida</h1>
          <p className="text-slate-600">Rastrea el estado de tu paquete en tiempo real</p>
        </div>

        {/* Tracking Code */}
        <Card variant="elevated" padding="lg" className="mb-8 border-indigo-100">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Código de Seguimiento</p>
            <p className="text-4xl font-black text-indigo-600 font-mono">{tracking.trackingCode}</p>
            <p className="text-xs text-slate-500 mt-3">Guarda este código para futuras referencias</p>
          </div>
        </Card>

        {/* Status Section */}
        <Card variant="default" padding="lg" className="mb-8">
          <div className="text-center mb-6">
            <div className="mb-4">
              <StatusBadge status={tracking.status} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {statusMessages[tracking.status]}
            </h2>
            <p className="text-slate-600">
              {statusDescriptions[tracking.status]}
            </p>
          </div>

          {/* Progress indicator */}
          {!isCancelled && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between">
                {["Solicitado", "Asignado", "En camino", "Recogido"].map((label, i) => (
                  <div key={label} className="flex flex-col items-center flex-1">
                    <div className="flex items-center w-full">
                      {i > 0 && (
                        <div className={`flex-1 h-1 ${i <= currentStep ? "bg-indigo-600" : "bg-slate-200"}`} />
                      )}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${
                        i <= currentStep ? "bg-indigo-600" : "bg-slate-200 text-slate-400"
                      }`}>
                        {i < currentStep ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      {i < 3 && (
                        <div className={`flex-1 h-1 ${i < currentStep ? "bg-indigo-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-2 text-center">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Details Grid */}
        {!isCancelled && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">📅 Fecha Estimada</h3>
              <p className="text-2xl font-bold text-slate-900">{formattedDate}</p>
              <p className="text-xs text-slate-500 mt-2">Fecha programada para la recogida</p>
            </Card>

            <Card variant="default" padding="lg">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">⏰ Rango Horario</h3>
              <p className="text-2xl font-bold text-slate-900">{tracking.preferredTimeWindow}</p>
              <p className="text-xs text-slate-500 mt-2">Ventana de tiempo para la recogida</p>
            </Card>
          </div>
        )}

        {/* Status History Timeline */}
        {tracking.statusHistory.length > 0 && (
          <Card variant="default" padding="lg" className="mb-8">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>📋</span> Historial de actualizaciones
            </h3>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
              <div className="space-y-6">
                {[...tracking.statusHistory].reverse().map((entry, i) => (
                  <div key={i} className="flex gap-4 pl-10 relative">
                    <div className="absolute left-0 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.fromStatus && (
                          <>
                            <StatusBadge status={entry.fromStatus} />
                            <span className="text-slate-300 text-sm">→</span>
                          </>
                        )}
                        <StatusBadge status={entry.toStatus} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 font-medium">
                        {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric", month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-slate-700 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Last Update */}
        <Card variant="filled" padding="lg" className="mb-8 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <p className="text-sm font-semibold text-slate-600">Última Actualización</p>
              <p className="text-slate-700 font-medium">{lastUpdateDate}</p>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <p className="text-slate-600 font-medium">¿Necesitas ayuda o deseas crear otra solicitud?</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/">
              <Button variant="outline">← Volver al inicio</Button>
            </Link>
            <Link href="/recoger">
              <Button variant="primary">Crear nueva solicitud →</Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
