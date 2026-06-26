"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonStatCard } from "@/components/ui/Skeleton";

interface Stats {
  total: number; pending: number; assigned: number; scheduled: number;
  pickedUp: number; cancelled: number; todayTotal: number; todayCompleted: number;
}

interface RecentPickup {
  id: string; trackingCode: string; contactName: string;
  pickupCity: string; status: string; createdAt: string;
  assignedCourier?: { name: string } | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate() {
  return new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/* ─── Stat card icons ────────────────────────────────────────────── */

const IconBox = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const IconClock = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTruck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
  </svg>
);
const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);
const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconDoc = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconList = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

/* ─── Stat card ──────────────────────────────────────────────────── */

function StatCard({
  label, value, total, color, icon, href,
}: {
  label: string; value: number; total?: number; color: string;
  icon: React.ReactNode; href: string;
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <Link href={href} className="group">
      <div className={`relative overflow-hidden bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-0.5 h-full`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          {pct !== null && (
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{pct}%</span>
          )}
        </div>
        <p className="text-4xl font-black mb-1 tabular-nums">{value}</p>
        <p className="text-white/75 text-sm font-medium">{label}</p>
        {pct !== null && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Quick action card ──────────────────────────────────────────── */

function QuickAction({
  href, icon, label, desc, hoverColor,
}: {
  href: string; icon: React.ReactNode; label: string; desc: string; hoverColor: string;
}) {
  return (
    <Link href={href}>
      <div className={`bg-white border-2 border-slate-100 rounded-xl p-4 flex items-center gap-3.5 transition-all duration-150 ${hoverColor}`}>
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-sm">{label}</p>
          <p className="text-slate-500 text-xs truncate">{desc}</p>
        </div>
        <svg className="w-4 h-4 text-slate-300 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0, cancelled: 0,
    todayTotal: 0, todayCompleted: 0,
  });
  const [recent, setRecent] = useState<RecentPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayPickups, setTodayPickups] = useState<RecentPickup[]>([]);

  const role   = (session?.user as any)?.role as string;
  const name   = session?.user?.name?.split(" ")[0] ?? "";
  const userId = (session?.user as any)?.id as string;

  useEffect(() => {
    if (status !== "authenticated") return;
    if (role === "ADMIN") {
      const today = new Date().toISOString().split("T")[0];
      Promise.all([
        fetch("/api/stats").then((r) => r.json()),
        fetch("/api/pickup-requests?limit=6").then((r) => r.json()),
        fetch(`/api/pickup-requests?date=${today}&limit=20`).then((r) => r.json()),
      ]).then(([s, rec, tod]) => {
        setStats(s);
        setRecent(rec.data ?? []);
        setTodayPickups(tod.data ?? []);
      }).finally(() => setLoading(false));
    } else if (role === "COURIER") {
      const today = new Date().toISOString().split("T")[0];
      fetch(`/api/pickup-requests?date=${today}&limit=20`)
        .then((r) => r.json())
        .then((d) => setTodayPickups(d.data ?? []))
        .finally(() => setLoading(false));
    }
  }, [status, role]);

  /* ── COURIER VIEW ──────────────────────────────────────────────── */
  if (role === "COURIER") {
    const done  = todayPickups.filter((p) => p.status === "PICKED_UP").length;
    const total = todayPickups.length;
    const next  = todayPickups.find((p) => p.status === "ASSIGNED" || p.status === "SCHEDULED");

    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1 capitalize">{formatDate()}</p>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{getGreeting()}, {name}</h1>
            <p className="text-slate-500 text-sm">Tu resumen de hoy</p>
          </div>

          {/* Today's progress card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-indigo-200">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">Recogidas hoy</p>
            {loading ? (
              <div className="h-10 bg-white/20 rounded-xl animate-pulse w-24" />
            ) : (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black tabular-nums">{done}</span>
                  <span className="text-white/50 text-2xl font-bold mb-1">/ {total}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : "0%" }}
                  />
                </div>
                <p className="text-white/60 text-sm">
                  {total === 0
                    ? "Sin recogidas asignadas para hoy"
                    : done === total
                    ? "¡Todo listo por hoy!"
                    : `${total - done} pendiente${total - done !== 1 ? "s" : ""}`}
                </p>
              </>
            )}
          </div>

          {/* Next stop */}
          {!loading && next && (
            <div className="bg-white border border-indigo-100 ring-1 ring-indigo-100 rounded-xl p-5 mb-6 shadow-sm">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Próxima parada</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono font-bold text-indigo-600 text-sm mb-1">{next.trackingCode}</p>
                  <p className="font-bold text-slate-900">{next.contactName}</p>
                  <p className="text-slate-500 text-sm">{next.pickupCity}</p>
                </div>
                <StatusBadge status={next.status} />
              </div>
            </div>
          )}

          {/* Action cards */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/mapa" className="group">
              <div className="bg-white border-2 border-slate-100 hover:border-violet-200 hover:shadow-md hover:shadow-violet-50 rounded-xl p-5 transition-all duration-200 text-center">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mx-auto mb-3">
                  <IconMap />
                </div>
                <p className="font-bold text-slate-900 text-sm">Mapa de Ruta</p>
                <p className="text-slate-500 text-xs mt-0.5">Ver y optimizar tu ruta</p>
              </div>
            </Link>
            <Link href="/dashboard/mis-recogidas" className="group">
              <div className="bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 rounded-xl p-5 transition-all duration-200 text-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-3">
                  <IconList />
                </div>
                <p className="font-bold text-slate-900 text-sm">Mis Recogidas</p>
                <p className="text-slate-500 text-xs mt-0.5">Lista completa de paradas</p>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ── ADMIN VIEW ────────────────────────────────────────────────── */
  const todayPct = stats.todayTotal > 0
    ? Math.round((stats.todayCompleted / stats.todayTotal) * 100)
    : 0;

  const STAT_CARDS = [
    { label: "Total activas", value: stats.total,     color: "from-slate-700 to-slate-900",   icon: <IconBox />,   href: "/dashboard/solicitudes" },
    { label: "Pendientes",    value: stats.pending,   color: "from-amber-500 to-orange-600",  icon: <IconClock />, href: "/dashboard/solicitudes?status=PENDING",   total: stats.total },
    { label: "Asignadas",     value: stats.assigned,  color: "from-blue-500 to-cyan-600",     icon: <IconTruck />, href: "/dashboard/solicitudes?status=ASSIGNED",  total: stats.total },
    { label: "En camino",     value: stats.scheduled, color: "from-violet-500 to-purple-700", icon: <IconMap />,   href: "/dashboard/solicitudes?status=SCHEDULED", total: stats.total },
    { label: "Recogidas",     value: stats.pickedUp,  color: "from-emerald-500 to-green-700", icon: <IconCheck />, href: "/dashboard/solicitudes?status=PICKED_UP",  total: stats.total },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1 capitalize">{formatDate()}</p>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{getGreeting()}, {name}</h1>
            <p className="text-slate-500 text-sm">Resumen operacional · O&apos;Globo Cargo</p>
          </div>
          <Link
            href="/recoger"
            className="shrink-0 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
            : STAT_CARDS.map((c) => <StatCard key={c.label} {...c} />)
          }
        </div>

        {/* Today's progress bar */}
        {!loading && (
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl p-5 mb-7 flex items-center gap-5 flex-wrap">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="flex-1 min-w-48">
              <p className="font-semibold text-slate-900 text-sm mb-0.5">
                {stats.todayTotal === 0
                  ? "Sin recogidas programadas para hoy"
                  : `${stats.todayTotal} recogida${stats.todayTotal !== 1 ? "s" : ""} programadas para hoy`}
              </p>
              {stats.todayTotal > 0 && (
                <p className="text-slate-500 text-xs">{stats.todayCompleted} completadas · {stats.todayTotal - stats.todayCompleted} pendientes</p>
              )}
            </div>
            {stats.todayTotal > 0 && (
              <div className="flex items-center gap-3 min-w-48 flex-1">
                <div className="flex-1 h-2 bg-white border border-indigo-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700"
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-indigo-600 shrink-0 tabular-nums">{todayPct}%</span>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900">Actividad reciente</h2>
              <Link href="/dashboard/solicitudes" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                Ver todas →
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              {loading ? (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-4 py-3.5 flex gap-3 items-center animate-pulse">
                      <div className="w-9 h-9 bg-slate-200 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-200 rounded w-32" />
                        <div className="h-2.5 bg-slate-100 rounded w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <IconBox />
                  </div>
                  <p className="font-semibold text-sm text-slate-600">Sin solicitudes aún</p>
                  <p className="text-xs mt-1">Las nuevas solicitudes aparecerán aquí</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recent.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/solicitudes/${p.id}`}
                      className="px-4 py-3.5 flex items-center gap-3.5 hover:bg-slate-50/70 transition-colors group"
                    >
                      <div className="w-9 h-9 bg-slate-100 group-hover:bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 text-slate-500 group-hover:text-indigo-600 transition-colors">
                        <IconBox />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-mono font-bold text-slate-900 text-sm">{p.trackingCode}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-slate-400 text-xs truncate">
                          {p.contactName} · {p.pickupCity}
                          {p.assignedCourier ? ` · ${p.assignedCourier.name}` : ""}
                        </p>
                      </div>
                      <p className="text-slate-400 text-xs shrink-0">
                        {new Date(p.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">Acciones rápidas</h2>
              <div className="space-y-2">
                <QuickAction href="/dashboard/solicitudes" icon={<IconList />}  label="Solicitudes"   desc="Gestionar todas" hoverColor="hover:border-indigo-200 hover:bg-indigo-50/50" />
                <QuickAction href="/dashboard/mapa"        icon={<IconMap />}   label="Mapa de Rutas" desc="Vista geográfica"        hoverColor="hover:border-violet-200 hover:bg-violet-50/50" />
                <QuickAction href="/dashboard/usuarios"    icon={<IconUsers />} label="Usuarios"      desc="Couriers y admins"       hoverColor="hover:border-emerald-200 hover:bg-emerald-50/50" />
                <QuickAction href="/dashboard/rutas"       icon={<IconDoc />}   label="Rutas PDF"     desc="Exportar hojas de ruta"  hoverColor="hover:border-rose-200 hover:bg-rose-50/50" />
              </div>
            </div>

            {/* Today's pickups list */}
            {!loading && todayPickups.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Hoy · {todayPickups.length} solicitudes</h3>
                <div className="space-y-1.5">
                  {todayPickups.slice(0, 5).map((p) => (
                    <Link key={p.id} href={`/dashboard/solicitudes/${p.id}`}>
                      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-center gap-2.5 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                        <StatusBadge status={p.status} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-bold text-slate-700 truncate">{p.trackingCode}</p>
                          <p className="text-slate-400 text-xs truncate">{p.contactName}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {todayPickups.length > 5 && (
                    <Link href="/dashboard/solicitudes" className="block text-center text-xs text-slate-400 hover:text-indigo-600 py-1.5 transition-colors">
                      +{todayPickups.length - 5} más →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
