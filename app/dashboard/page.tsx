"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  scheduled: number;
  pickedUp: number;
  cancelled: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN") return;

    const load = async () => {
      try {
        const statuses = [
          { key: "PENDING", field: "pending" },
          { key: "ASSIGNED", field: "assigned" },
          { key: "SCHEDULED", field: "scheduled" },
          { key: "PICKED_UP", field: "pickedUp" },
          { key: "CANCELLED", field: "cancelled" },
        ];
        const s: any = { total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0, cancelled: 0 };
        await Promise.all(
          statuses.map(async ({ key, field }) => {
            const res = await fetch(`/api/pickup-requests?status=${key}&limit=1`);
            const data = await res.json();
            const count = data.pagination?.total ?? 0;
            s[field] = count;
            if (key !== "CANCELLED") s.total += count;
          })
        );
        setStats(s);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, session]);

  const role = (session?.user as any)?.role;

  const STAT_CARDS = [
    { label: "Total activas", value: stats.total, color: "from-indigo-500 to-violet-600", icon: "📦" },
    { label: "Pendientes", value: stats.pending, color: "from-amber-400 to-orange-500", icon: "⏳" },
    { label: "Asignadas", value: stats.assigned, color: "from-blue-500 to-cyan-500", icon: "🚀" },
    { label: "Programadas", value: stats.scheduled, color: "from-violet-500 to-purple-600", icon: "📅" },
    { label: "Recogidas", value: stats.pickedUp, color: "from-emerald-500 to-green-600", icon: "✅" },
  ];

  if (role === "COURIER") {
    return (
      <DashboardLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-slate-900">Mis Rutas del Día</h1>
          <p className="text-slate-500 mt-1">Ve tus recogidas asignadas</p>
          <Link href="/dashboard/mis-recogidas" className="mt-6 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Ver Mis Recogidas →
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Bienvenido, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Resumen operacional de O&apos;Globo Cargo</p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {STAT_CARDS.map((card) => (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} p-5 rounded-2xl text-white shadow-lg`}>
                <div className="text-2xl mb-2">{card.icon}</div>
                <p className="text-3xl font-black">{card.value}</p>
                <p className="text-white/80 text-sm mt-1 font-medium">{card.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/solicitudes" className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-indigo-300 hover:shadow-lg transition-all">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
              <svg className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900">Ver Solicitudes</h3>
            <p className="text-slate-500 text-sm mt-1">Gestiona todas las solicitudes de recogida</p>
          </Link>

          <Link href="/dashboard/mapa" className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-violet-300 hover:shadow-lg transition-all">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-600 transition-colors">
              <svg className="w-5 h-5 text-violet-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900">Mapa de Rutas</h3>
            <p className="text-slate-500 text-sm mt-1">Visualiza las rutas de recogida en el mapa</p>
          </Link>

          {role === "ADMIN" && (
            <Link href="/dashboard/usuarios" className="group bg-white border border-slate-200 p-6 rounded-2xl hover:border-emerald-300 hover:shadow-lg transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 transition-colors">
                <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-900">Gestionar Usuarios</h3>
              <p className="text-slate-500 text-sm mt-1">Crea y administra couriers, dispatchers y admins</p>
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
