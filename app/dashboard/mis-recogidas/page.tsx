"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";

interface PickupRequest {
  id: string;
  trackingCode: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry: string;
  status: string;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions?: string | null;
}

export default function MisRecogidazPage() {
  const { data: session, status } = useSession();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");

  const courierId = (session?.user as any)?.id;

  const loadPickups = async () => {
    if (!courierId) return;
    setLoading(true);
    let url = `/api/pickup-requests?limit=100&courierId=${courierId}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    const res = await fetch(url);
    const data = await res.json();
    setPickups(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPickups();
  }, [status, session, statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const handleAction = async (id: string, newStatus: string, notes?: string) => {
    const body: any = { status: newStatus };
    if (notes) body.notes = notes;
    const res = await fetch(`/api/pickup-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const msg = newStatus === "SCHEDULED"
        ? "¡Cliente notificado! Estás en camino."
        : "¡Recogida confirmada! El cliente fue notificado.";
      showToast(msg);
      loadPickups();
    }
  };

  const today = new Date().toDateString();
  const todayPickups = pickups.filter(p => new Date(p.preferredDate).toDateString() === today);
  const otherPickups = pickups.filter(p =>
    new Date(p.preferredDate).toDateString() !== today &&
    p.status !== "PICKED_UP" &&
    p.status !== "CANCELLED"
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-1">Mis Recogidas</h1>
          <p className="text-slate-600">
            {pickups.length === 0 ? "Sin recogidas asignadas" : `${pickups.length} recogida${pickups.length !== 1 ? "s" : ""} asignada${pickups.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["", "ASSIGNED", "SCHEDULED", "PICKED_UP"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {s === "" ? "Todas" : s === "ASSIGNED" ? "Asignadas" : s === "SCHEDULED" ? "En camino" : "Recogidas"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-slate-600 font-medium">Cargando...</p>
          </div>
        ) : pickups.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-900 font-bold text-lg mb-1">Sin recogidas asignadas</p>
            <p className="text-slate-500 text-sm">Te notificaremos cuando tengas nuevas rutas</p>
          </div>
        ) : (
          <div className="space-y-10">
            {todayPickups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-slate-900">
                    Hoy — {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                  </h2>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{todayPickups.length}</span>
                </div>
                <div className="space-y-4">
                  {todayPickups.map(p => (
                    <PickupActionCard key={p.id} pickup={p} onAction={handleAction} />
                  ))}
                </div>
              </section>
            )}

            {otherPickups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-slate-900">Próximas</h2>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{otherPickups.length}</span>
                </div>
                <div className="space-y-4">
                  {otherPickups.map(p => (
                    <PickupActionCard key={p.id} pickup={p} onAction={handleAction} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PickupActionCard({
  pickup,
  onAction,
}: {
  pickup: PickupRequest;
  onAction: (id: string, status: string, notes?: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [acting, setActing] = useState(false);

  const act = async (newStatus: string) => {
    setActing(true);
    await onAction(pickup.id, newStatus, notes || undefined);
    setNotes("");
    setShowNotes(false);
    setActing(false);
  };

  const isPending = pickup.status === "ASSIGNED";
  const isOnTheWay = pickup.status === "SCHEDULED";
  const isDone = pickup.status === "PICKED_UP" || pickup.status === "CANCELLED";

  return (
    <div className={`bg-white rounded-3xl border-2 transition-all ${
      isPending ? "border-amber-200" :
      isOnTheWay ? "border-indigo-300 shadow-lg shadow-indigo-50" :
      isDone ? "border-slate-100" : "border-slate-200"
    }`}>
      {/* Status bar */}
      {isOnTheWay && (
        <div className="bg-indigo-600 text-white text-xs font-bold px-6 py-2 rounded-t-[22px] flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          EN CAMINO — El cliente fue notificado
        </div>
      )}

      <div className="p-6">
        {/* Top row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="inline-block font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-sm mb-2">
              {pickup.trackingCode}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={pickup.status} />
              <span className="text-slate-500 text-xs">
                {new Date(pickup.preferredDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {pickup.preferredTimeWindow}
              </span>
            </div>
          </div>

          {!isDone && (
            <div className="flex gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${pickup.pickupAddress}, ${pickup.pickupCity}`)}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maps
              </a>
              <a
                href={`tel:${pickup.contactPhone}`}
                className="flex items-center gap-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Llamar
              </a>
            </div>
          )}
        </div>

        {/* Contact & Address */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Contacto</p>
            <p className="font-bold text-slate-900">{pickup.contactName}</p>
            <p className="text-slate-600 text-sm">{pickup.contactPhone}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Dirección de recogida</p>
            <p className="font-bold text-slate-900">{pickup.pickupCity}</p>
            <p className="text-slate-600 text-sm">{pickup.pickupAddress}</p>
          </div>
        </div>

        {pickup.specialInstructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">⚠️ Instrucciones especiales</p>
            <p className="text-amber-900 text-sm">{pickup.specialInstructions}</p>
          </div>
        )}

        {/* Actions */}
        {!isDone && (
          <div className="pt-5 border-t border-slate-100 space-y-3">
            {/* Notes toggle */}
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full text-left flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm text-slate-600 font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Agregar nota (opcional)
              </span>
              <span className="text-xs">{showNotes ? "▲" : "▼"}</span>
            </button>

            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: El cliente no estaba, dejé aviso. / Paquete recibido en buen estado..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
            )}

            {/* Main action buttons */}
            <div className="flex gap-3">
              {isPending && (
                <button
                  onClick={() => act("SCHEDULED")}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-200 text-sm"
                >
                  {acting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  Voy en camino — Notificar cliente
                </button>
              )}

              {isOnTheWay && (
                <button
                  onClick={() => act("PICKED_UP")}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-200 text-sm"
                >
                  {acting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  Confirmar recogida — Paquete en mis manos
                </button>
              )}
            </div>
          </div>
        )}

        {isDone && pickup.status === "PICKED_UP" && (
          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
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
          </div>
        )}
      </div>
    </div>
  );
}
