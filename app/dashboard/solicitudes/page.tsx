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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Recogida</h1>
            <p className="text-slate-500 mt-1">{total} solicitudes en total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="ASSIGNED">Asignado</option>
            <option value="SCHEDULED">Programado</option>
            <option value="PICKED_UP">Recogido</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
          ) : pickups.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-4xl mb-4">📦</div>
              <p className="text-slate-500 font-medium">No hay solicitudes</p>
              <p className="text-slate-400 text-sm mt-1">Prueba con otros filtros</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Contacto</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Origen</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Courier</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pickups.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-semibold text-indigo-600 text-sm">{p.trackingCode}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 text-sm">{p.contactName}</p>
                          <p className="text-slate-400 text-xs mt-0.5">{p.contactEmail}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {p.pickupCity}, {p.pickupCountry}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {p.assignedCourier?.name ?? <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(p.preferredDate).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/solicitudes/${p.id}`}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                          >
                            Ver →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Anterior
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
