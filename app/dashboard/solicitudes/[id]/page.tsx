"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Alert from "@/components/Alert";

interface Courier {
  id: string;
  name: string;
}

interface PickupDetail {
  id: string;
  trackingCode: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string | null;
  pickupPostalCode: string | null;
  pickupCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary: string | null;
  recipientEmail: string | null;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string | null;
  recipientPostalCode: string | null;
  recipientCountry: string;
  destinationCountry: string;
  packageType: string;
  estimatedWeight: number | null;
  dimensions: string | null;
  packageContents: string | null;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string | null;
  notes: string | null;
  status: string;
  assignedCourier?: { id: string; name: string } | null;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
    notes: string | null;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  ASSIGNED: "Asignado",
  SCHEDULED: "Programado",
  PICKED_UP: "Recogido",
  CANCELLED: "Cancelado",
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-900 font-medium">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}

export default function SolicitudDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [newCourierId, setNewCourierId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTimeWindow, setNewTimeWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    const load = async () => {
      const [pickupRes, couriersRes] = await Promise.all([
        fetch(`/api/pickup-requests/${id}`),
        ["ADMIN", "DISPATCHER"].includes(role)
          ? fetch("/api/couriers")
          : Promise.resolve(null),
      ]);
      if (!pickupRes.ok) { router.push("/dashboard/solicitudes"); return; }
      const data = await pickupRes.json();
      setPickup(data);
      setNewStatus(data.status);
      setNewCourierId(data.assignedCourier?.id ?? "");
      setNewDate(data.preferredDate ? new Date(data.preferredDate).toISOString().split("T")[0] : "");
      setNewTimeWindow(data.preferredTimeWindow ?? "");

      if (couriersRes) {
        const ud = await couriersRes.json();
        setCouriers(ud.couriers ?? []);
      }
      setLoading(false);
    };
    load();
  }, [status, id, role, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup) return;
    setUpdating(true);
    try {
      const body: any = { status: newStatus };
      if (notes) body.notes = notes;
      if (newCourierId) body.assignedCourierId = newCourierId;
      if (newDate) body.preferredDate = newDate;
      if (newTimeWindow) body.preferredTimeWindow = newTimeWindow;
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNotes("");
        setToast("Solicitud actualizada");
        setTimeout(() => setToast(""), 3000);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCourierAction = async (newStatusValue: string) => {
    if (!pickup) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatusValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNewStatus(updated.status);
        const msg = newStatusValue === "SCHEDULED"
          ? "Cliente notificado. Estás en camino."
          : "¡Recogida confirmada! Cliente notificado.";
        setToast(msg);
        setTimeout(() => setToast(""), 3500);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pickup) return null;

  const isCompleted = pickup.status === "PICKED_UP" || pickup.status === "CANCELLED";

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2">
            <Alert
              type="success"
              title="Éxito"
              message={toast}
            />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/solicitudes" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-4 w-fit">
            ← Volver a solicitudes
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-slate-900 font-mono">{pickup.trackingCode}</h1>
                <StatusBadge status={pickup.status} />
              </div>
              <p className="text-slate-600">
                Creado el {new Date(pickup.createdAt).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">👤</span>
                Información de Contacto (Remitente)
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label="Nombre" value={pickup.contactName} />
                <InfoRow label="Teléfono" value={pickup.contactPhone} />
                <InfoRow label="Email" value={pickup.contactEmail} />
                {pickup.assignedCourier && (
                  <InfoRow label="Courier asignado" value={pickup.assignedCourier.name} />
                )}
              </div>
            </Card>

            {/* Recipient */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">🏠</span>
                Información del Destinatario
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label="Nombre" value={pickup.recipientName} />
                <InfoRow label="Teléfono" value={pickup.recipientPhone} />
                {pickup.recipientPhoneSecondary && (
                  <InfoRow label="Teléfono secundario" value={pickup.recipientPhoneSecondary} />
                )}
                {pickup.recipientEmail && (
                  <InfoRow label="Email" value={pickup.recipientEmail} />
                )}
                <div className="sm:col-span-2">
                  <InfoRow label="Dirección de destino" value={pickup.recipientAddress} />
                </div>
                <InfoRow label="Ciudad" value={pickup.recipientCity} />
                {pickup.recipientState && (
                  <InfoRow label="Estado/Provincia" value={pickup.recipientState} />
                )}
                {pickup.recipientPostalCode && (
                  <InfoRow label="Código postal" value={pickup.recipientPostalCode} />
                )}
                <InfoRow label="País" value={pickup.recipientCountry} />
              </div>
            </Card>

            {/* Address */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">📍</span>
                Dirección de Recogida
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <InfoRow label="Dirección" value={pickup.pickupAddress} />
                </div>
                <InfoRow label="Ciudad" value={pickup.pickupCity} />
                {pickup.pickupState && (
                  <InfoRow label="Estado" value={pickup.pickupState} />
                )}
                {pickup.pickupPostalCode && (
                  <InfoRow label="Código postal" value={pickup.pickupPostalCode} />
                )}
                <InfoRow label="País de origen" value={pickup.pickupCountry} />
                <InfoRow label="País destino" value={pickup.destinationCountry} />
              </div>
            </Card>

            {/* Package */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="text-xl">📦</span>
                Detalles del Paquete
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label="Tipo" value={pickup.packageType} />
                <InfoRow label="Peso estimado" value={pickup.estimatedWeight ? `${pickup.estimatedWeight} kg` : null} />
                <InfoRow label="Dimensiones" value={pickup.dimensions} />
                <InfoRow label="Fecha preferida" value={new Date(pickup.preferredDate).toLocaleDateString("es-ES")} />
                <InfoRow label="Rango horario" value={pickup.preferredTimeWindow} />
              </div>
              {pickup.packageContents && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <InfoRow label="Contenido del paquete" value={pickup.packageContents} />
                </div>
              )}
              {pickup.specialInstructions && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <InfoRow label="Instrucciones especiales" value={pickup.specialInstructions} />
                </div>
              )}
            </Card>

            {/* Status history */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Historial de estados
              </h2>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-6">
                  {[...pickup.statusHistory].reverse().map((entry, i) => (
                    <div key={entry.id} className="flex gap-4 pl-10 relative">
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
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-slate-700 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar: actions */}
          <div>
            {["ADMIN", "DISPATCHER"].includes(role) && (
              <Card variant="default" padding="lg" className="sticky top-8">
                <h2 className="font-bold text-slate-900 mb-6">Actualizar solicitud</h2>
                <form onSubmit={handleUpdate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="ASSIGNED">Asignado</option>
                      <option value="SCHEDULED">Programado</option>
                      <option value="PICKED_UP">Recogido</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>

                  {couriers.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Asignar Courier</label>
                      <select
                        value={newCourierId}
                        onChange={(e) => setNewCourierId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                      >
                        <option value="">Sin asignar</option>
                        {couriers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha de recogida</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Rango horario</label>
                    <select
                      value={newTimeWindow}
                      onChange={(e) => setNewTimeWindow(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    >
                      <option value="">Sin cambiar</option>
                      <option value="Mañana (8am - 12pm)">Mañana (8am - 12pm)</option>
                      <option value="Tarde (12pm - 5pm)">Tarde (12pm - 5pm)</option>
                      <option value="Noche (5pm - 9pm)">Noche (5pm - 9pm)</option>
                      <option value="Todo el día (8am - 9pm)">Todo el día (8am - 9pm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notas</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Observaciones opcionales..."
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={updating}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </form>
              </Card>
            )}

            {role === "COURIER" && !isCompleted && (
              <Card variant="default" padding="lg" className="sticky top-8">
                <h2 className="font-bold text-slate-900 mb-6">Acciones</h2>

                {pickup.status === "ASSIGNED" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">Confirma que vas en camino hacia la dirección de recogida.</p>
                    <button
                      onClick={() => handleCourierAction("SCHEDULED")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 text-sm"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "🚗 Voy en camino — Notificar cliente"}
                    </button>
                  </div>
                )}

                {pickup.status === "SCHEDULED" && (
                  <div className="space-y-3">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-bold text-indigo-700 mb-1">EN CAMINO</p>
                      <p className="text-sm text-indigo-600">El cliente ya fue notificado de que vas en camino.</p>
                    </div>
                    <p className="text-sm text-slate-600">Confirma cuando tengas el paquete en tus manos.</p>
                    <button
                      onClick={() => handleCourierAction("PICKED_UP")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-200 text-sm"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "✅ Confirmar recogida"}
                    </button>
                  </div>
                )}

                {pickup.status === "PENDING" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-amber-800 font-medium">Esta solicitud aún no te ha sido asignada formalmente. Contacta al administrador.</p>
                  </div>
                )}
              </Card>
            )}

            {role === "COURIER" && isCompleted && (
              <Card variant="default" padding="lg" className="sticky top-8">
                {pickup.status === "PICKED_UP" ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">Recogida completada</p>
                      <p className="text-emerald-700 text-xs">El cliente fue notificado por email</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <p className="font-bold text-slate-700 text-sm">Solicitud cancelada</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
