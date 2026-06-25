"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface PickupDetail {
  id: string;
  trackingCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry: string;
  destinationCountry: string;
  packageType: string;
  estimatedWeight: number;
  dimensions: string;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string;
  status: string;
  assignedCourier?: {
    id: string;
    name: string;
  } | null;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
    notes: string | null;
  }>;
}

export default function SolicitudDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !id) return;

    const fetchPickup = async () => {
      try {
        const res = await fetch(`/api/pickup-requests/${id}`);
        if (!res.ok) {
          router.push("/dashboard/solicitudes");
          return;
        }
        const data = await res.json();
        setPickup(data);
        setNewStatus(data.status);
      } catch (err) {
        console.error("Error fetching pickup:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPickup();
  }, [status, id, router]);

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNotes("");
        alert("Solicitud actualizada correctamente");
      } else {
        alert("Error al actualizar la solicitud");
      }
    } catch (err) {
      alert("Error al actualizar la solicitud");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!pickup) {
    return null;
  }

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    ASSIGNED: "Asignada",
    SCHEDULED: "Programada",
    PICKED_UP: "Recogida",
    CANCELLED: "Cancelada",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    SCHEDULED: "bg-purple-100 text-purple-800",
    PICKED_UP: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard/solicitudes" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← Solicitudes
          </Link>
          <h1 className="text-2xl font-bold text-indigo-600">{pickup.trackingCode}</h1>
          <div></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Información de la Solicitud</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Contacto</p>
                  <p className="text-lg font-semibold text-gray-900">{pickup.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-lg font-semibold text-gray-900">{pickup.contactPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{pickup.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <p className={`text-lg font-semibold px-2 py-1 rounded ${statusColors[pickup.status]}`}>
                    {statusLabels[pickup.status]}
                  </p>
                </div>
              </div>

              <hr className="my-6" />

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dirección de Recogida</h3>
              <div className="space-y-2 text-gray-700">
                <p>{pickup.pickupAddress}</p>
                <p>{pickup.pickupCity}, {pickup.pickupCountry}</p>
              </div>

              <hr className="my-6" />

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Paquete</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Tipo</p>
                  <p className="font-semibold">{pickup.packageType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Peso Estimado</p>
                  <p className="font-semibold">{pickup.estimatedWeight || "-"} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Destino</p>
                  <p className="font-semibold">{pickup.destinationCountry}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dimensiones</p>
                  <p className="font-semibold">{pickup.dimensions || "-"}</p>
                </div>
              </div>

              <hr className="my-6" />

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferencias de Recogida</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">
                    {new Date(pickup.preferredDate).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rango Horario</p>
                  <p className="font-semibold">{pickup.preferredTimeWindow}</p>
                </div>
              </div>

              {pickup.specialInstructions && (
                <>
                  <hr className="my-6" />
                  <div>
                    <p className="text-sm text-gray-600">Instrucciones Especiales</p>
                    <p className="text-gray-700">{pickup.specialInstructions}</p>
                  </div>
                </>
              )}
            </div>

            {/* History */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Historial</h2>
              <div className="space-y-4">
                {pickup.statusHistory.map((entry) => (
                  <div key={entry.id} className="p-4 border-l-4 border-indigo-600 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {entry.fromStatus && `${statusLabels[entry.fromStatus]} → `}
                          {statusLabels[entry.toStatus]}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-gray-700 mt-2 text-sm">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cambiar Estado</h2>

              <form onSubmit={handleStatusChange}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Nuevo Estado</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="ASSIGNED">Asignada</option>
                    <option value="SCHEDULED">Programada</option>
                    <option value="PICKED_UP">Recogida</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Notas (Opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating || newStatus === pickup.status}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updating ? "Actualizando..." : "Actualizar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
