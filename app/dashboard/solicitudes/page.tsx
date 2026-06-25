"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/Button";

interface PickupRequest {
  id: string;
  trackingCode: string;
  contactName: string;
  contactEmail: string;
  pickupCity: string;
  pickupCountry: string;
  status: string;
  createdAt: string;
  preferredDate: string;
  assignedCourier?: { name: string } | null;
}

export default function SolicitudesPage() {
  const { data: session, status } = useSession();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    const load = async () => {
      try {
        let url = `/api/pickup-requests?page=${page}&limit=${limit}`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (role === "COURIER") url += `&courierId=${(session?.user as any)?.id}`;
        const res = await fetch(url);
        const data = await res.json();
        setPickups(data.data ?? []);
        setTotal(data.pagination?.total ?? 0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, session, statusFilter, search, page, role]);

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">📋</div>
            <h1 className="text-3xl font-black text-slate-900">Solicitudes de Recogida</h1>
          </div>
          <p className="text-slate-600">Gestiona todas las solicitudes de recogida de paquetes</p>
          <p className="text-sm text-slate-500 mt-2">
            {total} solicitudes {statusFilter ? `con estado ${statusFilter.toLowerCase()}` : "en total"}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Por nombre o email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="sm:min-w-48">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
              >
                <option value="">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="ASSIGNED">Asignado</option>
                <option value="SCHEDULED">Programado</option>
                <option value="PICKED_UP">Recogido</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-slate-600 font-medium">Cargando solicitudes...</p>
            </div>
          ) : pickups.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4 opacity-50">📦</div>
              <p className="text-slate-700 font-semibold text-lg">No hay solicitudes</p>
              <p className="text-slate-500 text-sm mt-2">Prueba con otros filtros o crea una nueva solicitud</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Código</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Contacto</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Origen</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Courier</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Fecha</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pickups.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-indigo-600 text-sm bg-indigo-50 px-3 py-1.5 rounded-lg">{p.trackingCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900 text-sm">{p.contactName}</p>
                          <p className="text-slate-500 text-xs mt-1">{p.contactEmail}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {p.pickupCity}, {p.pickupCountry}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {p.assignedCourier?.name ? (
                            <span className="font-medium text-slate-700">{p.assignedCourier.name}</span>
                          ) : (
                            <span className="text-slate-400 italic">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(p.preferredDate).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/solicitudes/${p.id}`}
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
                          >
                            Ver
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <p className="text-sm text-slate-600 font-medium">
                    Página <span className="font-bold text-slate-900">{page}</span> de <span className="font-bold text-slate-900">{totalPages}</span>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
