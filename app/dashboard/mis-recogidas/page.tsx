"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
}

export default function MisRecogidazPage() {
  const { data: session, status } = useSession();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    const courierId = (session?.user as any)?.id;
    setLoading(true);
    const load = async () => {
      let url = `/api/pickup-requests?limit=100&courierId=${courierId}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPickups(data.data ?? []);
      setLoading(false);
    };
    load();
  }, [status, session, statusFilter]);

  const today = new Date().toDateString();
  const todayPickups = pickups.filter(
    (p) => new Date(p.preferredDate).toDateString() === today
  );
  const upcomingPickups = pickups.filter(
    (p) => new Date(p.preferredDate).toDateString() !== today
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Recogidas</h1>
            <p className="text-slate-500 mt-1">
              {pickups.length} recogidas asignadas
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="ASSIGNED">Asignado</option>
            <option value="SCHEDULED">Programado</option>
            <option value="PICKED_UP">Recogido</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : pickups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-24 text-center">
            <div className="text-5xl mb-4">🚚</div>
            <p className="text-slate-700 font-semibold text-lg">Sin recogidas asignadas</p>
            <p className="text-slate-400 text-sm mt-1">Te notificaremos cuando tengas nuevas rutas</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today's pickups */}
            {todayPickups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-slate-900">Hoy — {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</h2>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{todayPickups.length}</span>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {todayPickups.map((p) => (
                    <PickupCard key={p.id} pickup={p} highlight />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming pickups */}
            {upcomingPickups.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-slate-900">Próximas</h2>
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">{upcomingPickups.length}</span>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {upcomingPickups.map((p) => (
                    <PickupCard key={p.id} pickup={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PickupCard({ pickup, highlight }: { pickup: PickupRequest; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 hover:shadow-md transition-shadow ${highlight ? "border-indigo-200 shadow-sm shadow-indigo-100" : "border-slate-200"}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="font-mono text-sm font-bold text-indigo-600">{pickup.trackingCode}</span>
        <StatusBadge status={pickup.status} />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-slate-700 font-medium truncate">{pickup.contactName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-slate-600">{pickup.contactPhone}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <svg className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-slate-600 leading-tight">{pickup.pickupAddress}, {pickup.pickupCity}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400">Horario</p>
          <p className="text-sm font-semibold text-slate-700">{pickup.preferredTimeWindow}</p>
        </div>
        <Link
          href={`/dashboard/solicitudes/${pickup.id}`}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
        >
          Ver detalles →
        </Link>
      </div>
    </div>
  );
}
