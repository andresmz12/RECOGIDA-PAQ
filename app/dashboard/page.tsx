"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  scheduled: number;
  pickedUp: number;
  cancelled: number;
  todayTotal: number;
  todayCompleted: number;
}

interface RecentPickup {
  id: string;
  trackingCode: string;
  contactName: string;
  pickupCity: string;
  status: string;
  createdAt: string;
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

function StatCard({
  label, value, total, color, icon, href,
}: {
  label: string; value: number; total?: number; color: string; icon: string; href: string;
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <Link href={href} className="group">
      <div className={`relative overflow-hidden bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03] h-full`}>
        <div className="flex items-start justify-between mb-4">
          <span className="text-2xl">{icon}</span>
          {pct !== null && (
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{pct}%</span>
          )}
        </div>
        <p className="text-4xl font-black mb-1 tabular-nums">{value}</p>
        <p className="text-white/80 text-sm font-medium">{label}</p>
        {pct !== null && (
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white/60 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0, cancelled: 0,
    todayTotal: 0, todayCompleted: 0,
  });
  const [recent, setRecent] = useState<RecentPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayPickups, setTodayPickups] = useState<RecentPickup[]>([]);

  const role  = (session?.user as any)?.role as string;
  const name  = session?.user?.name?.split(" ")[0] ?? "";
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

  // ─── COURIER VIEW ───────────────────────────────────────────────────────────
  if (role === "COURIER") {
    const done  = todayPickups.filter((p) => p.status === "PICKED_UP").length;
    const total = todayPickups.length;
    const next  = todayPickups.find((p) => p.status === "ASSIGNED" || p.status === "SCHEDULED");

    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl">
          {/* Header */}
          <div className="mb-10">
            <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-1">{formatDate()}</p>
            <h1 className="text-4xl font-black text-slate-900 mb-1">
              {getGreeting()}, {name} 👋
            </h1>
            <p className="text-slate-500">Tu resumen de hoy</p>
          </div>

          {/* Today's progress */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-7 text-white mb-8 shadow-xl shadow-indigo-200">
            <p className="text-white/70 text-sm font-semibold uppercase tracking-wide mb-2">Recogidas de hoy</p>
            {loading ? (
              <div className="h-10 bg-white/20 rounded-xl animate-pulse w-24" />
            ) : (
              <>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-5xl font-black">{done}</span>
                  <span className="text-white/60 text-2xl font-bold mb-1">/ {total}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : "0%" }}
                  />
                </div>
                <p className="text-white/70 text-sm">
                  {total === 0
                    ? "Sin recogidas asignadas para hoy"
                    : done === total
                    ? "¡Todo listo por hoy! 🎉"
                    : `${total - done} pendiente${total - done !== 1 ? "s" : ""}`}
                </p>
              </>
            )}
          </div>

          {/* Next stop */}
          {!loading && next && (
            <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">Próxima parada</p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono font-bold text-indigo-600 text-sm mb-1">{next.trackingCode}</p>
                  <p className="font-bold text-slate-900 text-lg">{next.contactName}</p>
                  <p className="text-slate-500 text-sm">{next.pickupCity}</p>
                </div>
                <StatusBadge status={next.status} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/dashboard/mapa" className="group">
              <div className="bg-white border-2 border-slate-100 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 rounded-2xl p-6 transition-all duration-200 text-center">
                <div className="text-3xl mb-3">🗺️</div>
                <p className="font-bold text-slate-900">Mapa de Ruta</p>
                <p className="text-slate-500 text-sm mt-1">Ver y optimizar tu ruta</p>
              </div>
            </Link>
            <Link href="/dashboard/mis-recogidas" className="group">
              <div className="bg-white border-2 border-slate-100 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 rounded-2xl p-6 transition-all duration-200 text-center">
                <div className="text-3xl mb-3">📋</div>
                <p className="font-bold text-slate-900">Mis Recogidas</p>
                <p className="text-slate-500 text-sm mt-1">Lista completa de paradas</p>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const todayPct = stats.todayTotal > 0
    ? Math.round((stats.todayCompleted / stats.todayTotal) * 100)
    : 0;

  const STAT_CARDS = [
    { label: "Total activas", value: stats.total,     color: "from-slate-700 to-slate-900",    icon: "📦", href: "/dashboard/solicitudes" },
    { label: "Pendientes",    value: stats.pending,   color: "from-amber-500 to-orange-600",   icon: "⏳", href: "/dashboard/solicitudes?status=PENDING",   total: stats.total },
    { label: "Asignadas",     value: stats.assigned,  color: "from-blue-500 to-cyan-600",      icon: "🚗", href: "/dashboard/solicitudes?status=ASSIGNED",   total: stats.total },
    { label: "En camino",     value: stats.scheduled, color: "from-violet-500 to-purple-700",  icon: "🛣️", href: "/dashboard/solicitudes?status=SCHEDULED",  total: stats.total },
    { label: "Recogidas",     value: stats.pickedUp,  color: "from-emerald-500 to-green-700",  icon: "✅", href: "/dashboard/solicitudes?status=PICKED_UP",  total: stats.total },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-500 uppercase tracking-widest mb-1 capitalize">{formatDate()}</p>
            <h1 className="text-4xl font-black text-slate-900 mb-1">
              {getGreeting()}, {name} 👋
            </h1>
            <p className="text-slate-500">Resumen operacional · O&apos;Globo Cargo</p>
          </div>
          <Link
            href="/recoger"
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-lg shadow-indigo-200"
          >
            + Nueva solicitud
          </Link>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {STAT_CARDS.map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>
        )}

        {/* Today's progress */}
        {!loading && (
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-6 mb-8 flex items-center gap-6 flex-wrap">
            <div className="text-3xl">🎯</div>
            <div className="flex-1 min-w-48">
              <p className="font-bold text-slate-900 mb-0.5">
                {stats.todayTotal === 0
                  ? "Sin recogidas programadas para hoy"
                  : `${stats.todayTotal} recogida${stats.todayTotal !== 1 ? "s" : ""} programadas para hoy`}
              </p>
              {stats.todayTotal > 0 && (
                <p className="text-slate-500 text-sm">{stats.todayCompleted} completadas · {stats.todayTotal - stats.todayCompleted} pendientes</p>
              )}
            </div>
            {stats.todayTotal > 0 && (
              <div className="flex items-center gap-3 min-w-48 flex-1">
                <div className="flex-1 h-3 bg-white border border-indigo-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-700"
                    style={{ width: `${todayPct}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-indigo-600 shrink-0">{todayPct}%</span>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Actividad reciente</h2>
              <Link href="/dashboard/solicitudes" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                Ver todas →
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-5 py-4 flex gap-3 items-center">
                      <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-slate-200 rounded animate-pulse w-32" />
                        <div className="h-3 bg-slate-100 rounded animate-pulse w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recent.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-3 opacity-50">📭</div>
                  <p className="font-medium">Sin solicitudes aún</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recent.map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/solicitudes/${p.id}`}
                      className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-lg">📦</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-mono font-bold text-slate-900 text-sm">{p.trackingCode}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-slate-500 text-xs truncate">
                          {p.contactName} · {p.pickupCity}
                          {p.assignedCourier ? ` · 🚗 ${p.assignedCourier.name}` : ""}
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

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Acciones rápidas</h2>
            <div className="space-y-3">
              {[
                { href: "/dashboard/solicitudes", icon: "📋", label: "Solicitudes", desc: "Gestionar todas", color: "indigo" },
                { href: "/dashboard/mapa",         icon: "🗺️", label: "Mapa de Rutas", desc: "Vista geográfica", color: "violet" },
                { href: "/dashboard/usuarios",      icon: "👥", label: "Usuarios",       desc: "Couriers y admins", color: "emerald" },
                { href: "/dashboard/rutas",         icon: "📄", label: "Rutas PDF",      desc: "Exportar hojas de ruta", color: "rose" },
              ].map((a) => {
                const colors: Record<string, string> = {
                  indigo:  "hover:border-indigo-300 hover:bg-indigo-50",
                  violet:  "hover:border-violet-300 hover:bg-violet-50",
                  emerald: "hover:border-emerald-300 hover:bg-emerald-50",
                  rose:    "hover:border-rose-300 hover:bg-rose-50",
                };
                return (
                  <Link key={a.href} href={a.href}>
                    <div className={`bg-white border-2 border-slate-100 rounded-xl p-4 flex items-center gap-4 transition-all duration-150 ${colors[a.color]}`}>
                      <div className="text-2xl shrink-0">{a.icon}</div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{a.label}</p>
                        <p className="text-slate-500 text-xs">{a.desc}</p>
                      </div>
                      <svg className="w-4 h-4 text-slate-300 ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Today's overview */}
            {!loading && todayPickups.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Hoy — {todayPickups.length} solicitudes</h3>
                <div className="space-y-2">
                  {todayPickups.slice(0, 4).map((p) => (
                    <Link key={p.id} href={`/dashboard/solicitudes/${p.id}`}>
                      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-3 hover:border-indigo-200 transition-colors">
                        <StatusBadge status={p.status} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-bold text-slate-700 truncate">{p.trackingCode}</p>
                          <p className="text-slate-400 text-xs truncate">{p.contactName}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {todayPickups.length > 4 && (
                    <p className="text-xs text-slate-400 text-center pt-1">+{todayPickups.length - 4} más</p>
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
