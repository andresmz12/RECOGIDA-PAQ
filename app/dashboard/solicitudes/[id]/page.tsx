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
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry: string;
  destinationCountry: string;
  packageType: string;
  estimatedWeight: number | null;
  dimensions: string | null;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string | null;
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
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    const load = async () => {
      const [pickupRes, couriersRes] = await Promise.all([
        fetch(`/api/pickup-requests/${id}`),
        role === "ADMIN"
          ? fetch("/api/couriers")
          : Promise.resolve(null),
      ]);
      if (!pickupRes.ok) { router.push("/dashboard/solicitudes"); return; }
      const data = await pickupRes.json();
      setPickup(data);
      setNewStatus(data.status);
      setNewCourierId(data.assignedCourier?.id ?? "");

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
                Creado el {new Date(pickup.statusHistory[pickup.statusHistory.length - 1]?.createdAt ?? "").toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
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
                Información de Contacto
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
          {role === "ADMIN" && (
            <div>
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
