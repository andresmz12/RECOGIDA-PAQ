"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonTableRow } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n-context";
import { US_STATES } from "@/lib/countries";

interface PickupRequest {
  id: string;
  trackingCode: string;
  contactName: string;
  contactEmail: string;
  pickupCity: string;
  pickupState?: string | null;
  pickupCountry: string;
  status: string;
  createdAt: string;
  preferredDate: string;
  assignedCourierId?: string | null;
  assignedCourier?: { id: string; name: string } | null;
}

interface Courier {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["PENDING", "ASSIGNED", "SCHEDULED", "EN_CAMINO", "PICKED_UP", "CANCELLED"];

const PackageIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

export default function SolicitudesPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; type: "status" | "courier"; x: number; y: number } | null>(null);
  const limit = 20;

  const role = (session?.user as any)?.role;
  const canEdit = role === "ADMIN" || role === "DISPATCHER";

  const exportCSV = async () => {
    let url = `/api/pickup-requests?limit=2000`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (stateFilter) url += `&state=${stateFilter}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    const data = await res.json();
    const rows: string[][] = [
      ["Code", "Status", "Date", "Time", "Client", "Phone", "Email", "Pickup Address", "City", "State", "Recipient", "Dest. Country", "Package", "Weight", "Courier"],
      ...(data.data ?? []).map((p: any) => [
        p.trackingCode, p.status,
        new Date(p.preferredDate).toLocaleDateString("en-US"),
        p.preferredTimeWindow, p.contactName, p.contactPhone, p.contactEmail ?? "",
        p.pickupAddress, p.pickupCity, p.pickupState ?? "",
        p.recipientName, p.destinationCountry ?? p.recipientCountry ?? "",
        p.packageType ?? "", p.estimatedWeight ?? "", p.assignedCourier?.name ?? "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `solicitudes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const load = async () => {
    setLoading(true);
    try {
      let url = `/api/pickup-requests?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      if (stateFilter) url += `&state=${stateFilter}`;
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

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
  }, [status, session, statusFilter, stateFilter, search, page, role]);

  useEffect(() => {
    if (!canEdit) return;
    fetch("/api/couriers")
      .then((r) => r.json())
      .then((d) => setCouriers(d.couriers ?? []))
      .catch(() => {});
  }, [canEdit]);

  const totalPages = Math.ceil(total / limit);
  const locale = lang === "en" ? "en-US" : "es-CO";

  const openMenu = (e: React.MouseEvent, id: string, type: "status" | "courier") => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(r.left, window.innerWidth - 230);
    setMenu({ id, type, x, y: r.bottom + 4 });
  };

  const patchPickup = async (id: string, body: Record<string, unknown>) => {
    setMenu(null);
    setSavingId(id);
    try {
      const res = await fetch(`/api/pickup-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) await load();
    } finally {
      setSavingId(null);
    }
  };

  const changeStatus = (id: string, newStatus: string) => patchPickup(id, { status: newStatus });

  const assignCourier = (id: string, courierId: string, current: string) => {
    const body: Record<string, unknown> = { assignedCourierId: courierId };
    // Auto-advance a brand-new request to ASSIGNED when a courier is picked
    if (current === "PENDING") body.status = "ASSIGNED";
    patchPickup(id, body);
  };

  const menuPickup = menu ? pickups.find((p) => p.id === menu.id) : null;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("solicitudes.title")}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {loading ? t("common.loading") : `${total} ${t("solicitudes.title").toLowerCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t("solicitudes.exportCSV")}
              </button>
            )}
            <Link
              href="/recoger"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("dashboard.newRequest")}
            </Link>
          </div>
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
                placeholder={t("solicitudes.searchPlaceholder")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-slate-50/50"
              />
            </div>
            {/* State (origin) filter */}
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 min-w-44 transition-all"
            >
              <option value="">{t("solicitudes.allStates")}</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 min-w-40 transition-all"
            >
              <option value="">{t("solicitudes.filterStatus")}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("solicitudes.code")}</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("solicitudes.contact")}</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("solicitudes.origin")}</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("solicitudes.estado")}</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Courier</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("solicitudes.date")}</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("solicitudes.action")}</th>
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
                        title={t("solicitudes.noRequests")}
                        description={
                          statusFilter || stateFilter || search
                            ? t("solicitudes.tryFilters")
                            : t("solicitudes.noRequestsDesc")
                        }
                        action={
                          !statusFilter && !stateFilter && !search
                            ? { label: t("dashboard.newRequest"), href: "/recoger" }
                            : {
                                label: t("common.filter"),
                                onClick: () => { setStatusFilter(""); setStateFilter(""); setSearch(""); },
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
                        {p.pickupCity}{p.pickupState ? `, ${p.pickupState}` : ""}, {p.pickupCountry}
                      </td>

                      {/* Inline status */}
                      <td className="px-5 py-3.5">
                        {canEdit ? (
                          <button
                            onClick={(e) => openMenu(e, p.id, "status")}
                            disabled={savingId === p.id}
                            className="inline-flex items-center gap-1 rounded-full hover:ring-2 hover:ring-indigo-200 transition-all disabled:opacity-50"
                            title={t("solicitudes.changeStatus")}
                          >
                            <StatusBadge status={p.status} />
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <StatusBadge status={p.status} />
                        )}
                      </td>

                      {/* Inline courier */}
                      <td className="px-5 py-3.5 text-sm">
                        {canEdit ? (
                          <button
                            onClick={(e) => openMenu(e, p.id, "courier")}
                            disabled={savingId === p.id}
                            className="inline-flex items-center gap-1 px-2 py-1 -mx-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                            title={t("solicitudes.assignCourier")}
                          >
                            {p.assignedCourier?.name ? (
                              <span className="font-medium text-slate-700">{p.assignedCourier.name}</span>
                            ) : (
                              <span className="text-slate-400 text-xs italic">{t("solicitudes.unassigned")}</span>
                            )}
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : p.assignedCourier?.name ? (
                          <span className="font-medium text-slate-700">{p.assignedCourier.name}</span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">{t("solicitudes.unassigned")}</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-sm text-slate-500">
                        {new Date(p.preferredDate).toLocaleDateString(locale, {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/dashboard/solicitudes/${p.id}`}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-xs font-semibold transition-colors opacity-60 group-hover:opacity-100"
                        >
                          {t("solicitudes.viewDetail")}
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
                {lang === "en" ? "Page" : "Página"}{" "}
                <span className="font-bold text-slate-700">{page}</span>{" "}
                {lang === "en" ? "of" : "de"}{" "}
                <span className="font-bold text-slate-700">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {lang === "en" ? "← Previous" : "← Anterior"}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {lang === "en" ? "Next →" : "Siguiente →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline dropdown menu (fixed, rendered above the table) */}
      {menu && menuPickup && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 w-56 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1.5"
            style={{ left: menu.x, top: menu.y }}
          >
            {menu.type === "status" ? (
              <>
                <p className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">{t("solicitudes.changeStatus")}</p>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(menu.id, s)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                      menuPickup.status === s ? "bg-indigo-50/60" : ""
                    }`}
                  >
                    <StatusBadge status={s} />
                    {menuPickup.status === s && (
                      <svg className="w-4 h-4 text-indigo-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <>
                <p className="px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">{t("solicitudes.assignCourier")}</p>
                {couriers.length === 0 && (
                  <p className="px-3 py-2 text-sm text-slate-400">—</p>
                )}
                {couriers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => assignCourier(menu.id, c.id, menuPickup.status)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors ${
                      menuPickup.assignedCourierId === c.id ? "bg-indigo-50/60 font-semibold" : ""
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name?.[0]?.toUpperCase()}
                    </span>
                    <span className="truncate">{c.name}</span>
                    {menuPickup.assignedCourierId === c.id && (
                      <svg className="w-4 h-4 text-indigo-600 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
