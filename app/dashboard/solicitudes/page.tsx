"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

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

const PackageIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

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
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Solicitudes de Recogida</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? "Cargando..." : `${total} solicitud${total !== 1 ? "es" : ""}${statusFilter ? ` · filtrando por ${statusFilter.toLowerCase()}` : ""}`}
            </p>
          </div>
          <Link
            href="/recoger"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 min-w-40 transition-all"
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

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Contacto</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Origen</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Courier</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonTableRow key={i} cols={7} />
                  ))
                ) : pickups.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<PackageIcon />}
                        title="No hay solicitudes"
                        description={
                          statusFilter || search
                            ? "No se encontraron solicitudes con los filtros aplicados. Prueba con otros criterios."
                            : "Aún no hay solicitudes de recogida registradas en el sistema."
                        }
                        action={
                          !statusFilter && !search
                            ? { label: "Nueva solicitud", href: "/recoger" }
                            : {
                                label: "Limpiar filtros",
                                onClick: () => { setStatusFilter(""); setSearch(""); },
                              }
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  pickups.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors duration-100 group">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-indigo-600 text-xs bg-indigo-50 px-2.5 py-1 rounded-md">
                          {p.trackingCode}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900 text-sm">{p.contactName}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{p.contactEmail}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">
                        {p.pickupCity}, {p.pickupCountry}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {p.assignedCourier?.name ? (
                          <span className="font-medium text-slate-700">{p.assignedCourier.name}</span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {new Date(p.preferredDate).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/dashboard/solicitudes/${p.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-semibold transition-colors opacity-60 group-hover:opacity-100"
                        >
                          Ver detalle
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Página <span className="font-bold text-slate-700">{page}</span> de{" "}
                <span className="font-bold text-slate-700">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
