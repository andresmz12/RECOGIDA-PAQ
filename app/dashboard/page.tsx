"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { SkeletonStatCard } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n-context";

interface Stats {
  total: number; pending: number; assigned: number; scheduled: number;
  pickedUp: number; cancelled: number; todayTotal: number; todayCompleted: number;
  pendingOld?: number;
}

interface RecentPickup {
  id: string; trackingCode: string; contactName: string;
  pickupCity: string; status: string; createdAt: string;
  assignedCourier?: { name: string } | null;
}

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "greeting.morning";
  if (h < 18) return "greeting.afternoon";
  return "greeting.evening";
}

function formatDate(lang: string) {
  return new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

/* ─── Icons ──────────────────────────────────────────────────── */
const IconBox  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
const IconClock = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconTruck = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" /></svg>;
const IconMap  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const IconCheck = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconUsers = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const IconDoc  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconList = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

function StatCard({ label, value, total, accent, icon, href }: {
  label: string; value: number; total?: number; accent: string;
  icon: React.ReactNode; href: string;
}) {
  const pct = total && total > 0 ? Math.round((value / total) * 100) : null;
  return (
    <Link href={href} className="group">
      <div className="relative overflow-hidden bg-white border border-slate-200 p-5 rounded-2xl shadow-xs group-hover:border-slate-300 group-hover:shadow-md transition-all duration-200 h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>{icon}</div>
          {pct !== null && (
            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{pct}%</span>
          )}
        </div>
        <p className="text-4xl font-black text-slate-900 mb-1 tabular-nums">{value}</p>
        <p className="text-slate-500 text-sm font-medium">{label}</p>
        {pct !== null && (
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-navy-700 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}

function QuickAction({ href, icon, label, desc, hoverColor }: {
  href: string; icon: React.ReactNode; label: string; desc: string; hoverColor: string;
}) {
  return (
    <Link href={href}>
      <div className={`bg-white border-2 border-slate-100 rounded-xl p-4 flex items-center gap-3.5 transition-all duration-150 ${hoverColor}`}>
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">{icon}</div>
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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const [stats, setStats] = useState<Stats>({
    total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0, cancelled: 0,
    todayTotal: 0, todayCompleted: 0, pendingOld: 0,
  });
  const [recent, setRecent] = useState<RecentPickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayPickups, setTodayPickups] = useState<RecentPickup[]>([]);
  const [courierStats, setCourierStats] = useState<any[]>([]);

  const role   = (session?.user as any)?.role as string;
  const name   = session?.user?.name?.split(" ")[0] ?? "";
  const userId = (session?.user as any)?.id as string;

  useEffect(() => {
    if (status !== "authenticated") return;
    if (role === "ADMIN" || role === "DISPATCHER") {
      const today = new Date().toISOString().split("T")[0];
      Promise.all([
        fetch("/api/stats").then((r) => r.json()),
        fetch("/api/pickup-requests?limit=6").then((r) => r.json()),
        fetch(`/api/pickup-requests?date=${today}&limit=20`).then((r) => r.json()),
        fetch("/api/stats/couriers").then((r) => r.json()),
      ]).then(([s, rec, tod, cs]) => {
        setStats(s);
        setRecent(rec.data ?? []);
        setTodayPickups(tod.data ?? []);
        setCourierStats(cs.couriers ?? []);
      }).finally(() => setLoading(false));
    } else if (role === "COURIER") {
      const today = new Date().toISOString().split("T")[0];
      fetch(`/api/pickup-requests?date=${today}&limit=20`)
        .then((r) => r.json())
        .then((d) => setTodayPickups(d.data ?? []))
        .finally(() => setLoading(false));
    }
  }, [status, role]);

  /* ── COURIER VIEW ─────────────────────────────────────────── */
  if (role === "COURIER") {
    const done  = todayPickups.filter((p) => p.status === "PICKED_UP").length;
    const total = todayPickups.length;
    const next  = todayPickups.find((p) => p.status === "ASSIGNED" || p.status === "SCHEDULED");

    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1 capitalize">{formatDate(lang)}</p>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{t(getGreetingKey())}, {name}</h1>
            <p className="text-slate-500 text-sm">{t("dashboard.summaryToday")}</p>
          </div>

          {/* Today's progress */}
          <div className="bg-navy-900 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-navy-200">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">{t("dashboard.todayPickups")}</p>
            {loading ? (
              <div className="h-10 bg-white/20 rounded-xl animate-pulse w-24" />
            ) : (
              <>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black tabular-nums">{done}</span>
                  <span className="text-white/50 text-2xl font-bold mb-1">/ {total}</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: total > 0 ? `${Math.round((done / total) * 100)}%` : "0%" }} />
                </div>
                <p className="text-white/60 text-sm">
                  {total === 0
                    ? t("dashboard.noPickupsToday")
                    : done === total
                    ? t("dashboard.allDone")
                    : `${total - done} ${t("dashboard.pending")}`}
                </p>
              </>
            )}
          </div>

          {/* Next stop */}
          {!loading && next && (
            <div className="bg-white border border-indigo-100 ring-1 ring-indigo-100 rounded-xl p-5 mb-6 shadow-sm">
              <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3">{t("dashboard.nextStop")}</p>
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
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-600 mx-auto mb-3"><IconMap /></div>
                <p className="font-bold text-slate-900 text-sm">{t("dashboard.routeMap")}</p>
                <p className="text-slate-500 text-xs mt-0.5">{t("dashboard.mapMyRoute")}</p>
              </div>
            </Link>
            <Link href="/dashboard/mis-recogidas" className="group">
              <div className="bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50 rounded-xl p-5 transition-all duration-200 text-center">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-3"><IconList /></div>
                <p className="font-bold text-slate-900 text-sm">{t("nav.misRecogidas")}</p>
                <p className="text-slate-500 text-xs mt-0.5">{t("dashboard.myPickupsList")}</p>
              </div>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ── ADMIN / DISPATCHER VIEW ──────────────────────────────── */
  const todayPct = stats.todayTotal > 0
    ? Math.round((stats.todayCompleted / stats.todayTotal) * 100)
    : 0;

  // Color carries meaning here, not decoration: neutral for the overview
  // tile, amber for "needs attention", navy for "in progress", green only
  // for the completed state.
  const STAT_CARDS = [
    { label: t("dashboard.totalActive"), value: stats.total,     accent: "bg-slate-100 text-slate-600",  icon: <IconBox />,   href: "/dashboard/solicitudes" },
    { label: t("dashboard.statPending"),    value: stats.pending,   accent: "bg-accent-50 text-accent-600", icon: <IconClock />, href: "/dashboard/solicitudes?status=PENDING",   total: stats.total },
    { label: t("dashboard.statAssigned"),     value: stats.assigned,  accent: "bg-navy-50 text-navy-700",     icon: <IconTruck />, href: "/dashboard/solicitudes?status=ASSIGNED",  total: stats.total },
    { label: t("dashboard.statInTransit"),     value: stats.scheduled, accent: "bg-navy-50 text-navy-700",     icon: <IconMap />,   href: "/dashboard/solicitudes?status=SCHEDULED", total: stats.total },
    { label: t("dashboard.statPickedUp"),     value: stats.pickedUp,  accent: "bg-emerald-50 text-emerald-600", icon: <IconCheck />, href: "/dashboard/solicitudes?status=PICKED_UP",  total: stats.total },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-1 capitalize">{formatDate(lang)}</p>
            <h1 className="text-3xl font-black text-slate-900 mb-1">{t(getGreetingKey())}, {name}</h1>
            <p className="text-slate-500 text-sm">{t("dashboard.operationalSummary")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {role === "ADMIN" && <DailyReportButton />}
            <Link
              href="/recoger"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm shadow-indigo-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("dashboard.newRequest")}
            </Link>
          </div>
        </div>

        {/* Pending old alert */}
        {!loading && stats.pendingOld && stats.pendingOld > 0 ? (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
              <IconAlert />
            </div>
            <p className="text-amber-800 text-sm font-semibold">
              {t(stats.pendingOld === 1 ? "dashboard.pendingOldAlert_one" : "dashboard.pendingOldAlert_other", { count: stats.pendingOld })}
            </p>
            <Link href="/dashboard/solicitudes?status=PENDING" className="ml-auto text-amber-700 text-xs font-bold hover:underline shrink-0">
              {t("common.viewAll")}
            </Link>
          </div>
        ) : null}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
            : STAT_CARDS.map((c) => <StatCard key={c.label} {...c} />)
          }
        </div>

        {/* Today's progress */}
        {!loading && (
          <div className="bg-navy-50 border border-navy-100 rounded-xl p-5 mb-7 flex items-center gap-5 flex-wrap">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div className="flex-1 min-w-48">
              <p className="font-semibold text-slate-900 text-sm mb-0.5">
                {stats.todayTotal === 0
                  ? t("dashboard.noPickupsScheduled")
                  : t(stats.todayTotal === 1 ? "dashboard.todayScheduled_one" : "dashboard.todayScheduled_other", { count: stats.todayTotal })}
              </p>
              {stats.todayTotal > 0 && (
                <p className="text-slate-500 text-xs">
                  {t("dashboard.completedPending", { done: stats.todayCompleted, pending: stats.todayTotal - stats.todayCompleted })}
                </p>
              )}
            </div>
            {stats.todayTotal > 0 && (
              <div className="flex items-center gap-3 min-w-48 flex-1">
                <div className="flex-1 h-2 bg-white border border-indigo-100 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-navy-700 rounded-full transition-all duration-700"
                    style={{ width: `${todayPct}%` }} />
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
              <h2 className="text-base font-bold text-slate-900">{t("dashboard.recentActivity")}</h2>
              <Link href="/dashboard/solicitudes" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                {t("common.viewAll")}
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
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3"><IconBox /></div>
                  <p className="font-semibold text-sm text-slate-600">{t("dashboard.noRequestsYet")}</p>
                  <p className="text-xs mt-1">{t("dashboard.newRequestsHere")}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recent.map((p) => (
                    <Link key={p.id} href={`/dashboard/solicitudes/${p.id}`}
                      className="px-4 py-3.5 flex items-center gap-3.5 hover:bg-slate-50/70 transition-colors group">
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
                        {new Date(p.createdAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 mb-3">{t("dashboard.quickActions")}</h2>
              <div className="space-y-2">
                <QuickAction href="/dashboard/solicitudes" icon={<IconList />}  label={t("nav.solicitudes")}   desc={t("dashboard.manageAll")} hoverColor="hover:border-indigo-200 hover:bg-indigo-50/50" />
                <QuickAction href="/dashboard/mapa"        icon={<IconMap />}   label={t("nav.mapa")} desc={t("dashboard.geographicView")}        hoverColor="hover:border-violet-200 hover:bg-violet-50/50" />
                <QuickAction href="/dashboard/usuarios"    icon={<IconUsers />} label={t("nav.usuarios")}      desc={t("dashboard.couriersAdmins")}       hoverColor="hover:border-navy-200 hover:bg-navy-50/50" />
                <QuickAction href="/dashboard/rutas"       icon={<IconDoc />}   label={t("nav.rutasPdf")}     desc={t("dashboard.exportRoutes")}  hoverColor="hover:border-navy-200 hover:bg-navy-50/50" />
              </div>
            </div>

            {/* Courier stats */}
            {!loading && courierStats.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-3">{t("dashboard.couriersToday")}</h2>
                <div className="space-y-2">
                  {courierStats.map((c) => (
                    <a key={c.id} href={`/dashboard/usuarios/${c.id}`} className="block bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">{c.name}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.todayCount > 0 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                          {c.todayCount} {lang === "en" ? "today" : "hoy"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.successRate}%` }} />
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{c.successRate}%</span>
                        <span className="text-xs text-slate-400 shrink-0">{c.inProgress} {lang === "en" ? "active" : "activas"}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Today's pickups list */}
            {!loading && todayPickups.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                  {t("dashboard.todayLabel", { count: todayPickups.length })}
                </h3>
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
                      {t("dashboard.moreItems", { count: todayPickups.length - 5 })}
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

function DailyReportButton() {
  const { t } = useT();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/admin/daily-report", { method: "POST" });
      const data = await res.json();
      if (data.ok) setDone(true);
    } finally {
      setSending(false);
      setTimeout(() => setDone(false), 3000);
    }
  };

  return (
    <button
      onClick={send}
      disabled={sending}
      className={`inline-flex items-center gap-1.5 border font-semibold px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-60 ${
        done
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {sending ? (
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      ) : done ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
      <span className="hidden sm:inline">{done ? t("dashboard.reportSent") : t("dashboard.sendReport")}</span>
    </button>
  );
}
