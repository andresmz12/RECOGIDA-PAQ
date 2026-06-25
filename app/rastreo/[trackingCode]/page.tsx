"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface TrackingData {
  trackingCode: string;
  status: string;
  estimatedPickupDate: string;
  preferredTimeWindow: string;
  lastUpdated: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-300",
  SCHEDULED: "bg-purple-100 text-purple-800 border-purple-300",
  PICKED_UP: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
};

const statusMessages: Record<string, string> = {
  PENDING: "Solicitud Pendiente",
  ASSIGNED: "Courier Asignado",
  SCHEDULED: "Recogida Programada",
  PICKED_UP: "Paquete Recogido",
  CANCELLED: "Solicitud Cancelada",
};

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!tracking) {
    return null;
  }

  const estimatedDate = new Date(tracking.estimatedPickupDate);
  const formattedDate = estimatedDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold mb-4 inline-block">
          ← Volver
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Solicitud de Recogida</h1>

          <div className="bg-gray-100 p-6 rounded-lg mb-8 mt-6">
            <p className="text-sm text-gray-600 mb-2">Código de Seguimiento</p>
            <p className="text-3xl font-bold text-indigo-600">{tracking.trackingCode}</p>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado Actual</h2>
            <div
              className={`p-6 rounded-lg border-2 text-center ${
                statusColors[tracking.status] || statusColors["PENDING"]
              }`}
            >
              <p className="text-2xl font-bold">{statusMessages[tracking.status]}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Fecha Estimada de Recogida</p>
              <p className="text-lg font-semibold text-gray-900">{formattedDate}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Rango Horario</p>
              <p className="text-lg font-semibold text-gray-900">{tracking.preferredTimeWindow}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg mb-8">
            <p className="text-sm text-gray-600 mb-1">Última Actualización</p>
            <p className="text-gray-900">
              {new Date(tracking.lastUpdated).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">¿Necesitas más información?</p>
            <Link
              href="/recoger"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Crear Nueva Solicitud
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
