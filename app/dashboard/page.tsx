"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/Button";
import Card from "@/components/Card";

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
    if (!["ADMIN", "DISPATCHER"].includes(role)) return;

    const load = async () => {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, session]);

  const role = (session?.user as any)?.role;

  const STAT_CARDS = [
    { label: "Total activas", value: stats.total, color: "from-indigo-500 to-violet-600", icon: "📦", href: "/dashboard/solicitudes" },
    { label: "Pendientes", value: stats.pending, color: "from-amber-400 to-orange-500", icon: "⏳", href: "/dashboard/solicitudes?status=PENDING" },
    { label: "Asignadas", value: stats.assigned, color: "from-blue-500 to-cyan-500", icon: "🚀", href: "/dashboard/solicitudes?status=ASSIGNED" },
    { label: "Programadas", value: stats.scheduled, color: "from-violet-500 to-purple-600", icon: "📅", href: "/dashboard/solicitudes?status=SCHEDULED" },
    { label: "Recogidas", value: stats.pickedUp, color: "from-emerald-500 to-green-600", icon: "✅", href: "/dashboard/solicitudes?status=PICKED_UP" },
  ];

  const QUICK_ACTIONS = [
    {
      icon: "📋",
      title: "Ver Solicitudes",
      desc: "Gestiona todas las solicitudes de recogida",
      href: "/dashboard/solicitudes",
      color: "indigo",
    },
    {
      icon: "🗺️",
      title: "Mapa de Rutas",
      desc: "Visualiza las rutas de recogida en el mapa",
      href: "/dashboard/mapa",
      color: "violet",
    },
    ...(role === "ADMIN"
      ? [
          {
            icon: "👥",
            title: "Gestionar Usuarios",
            desc: "Crea y administra couriers y dispatchers",
            href: "/dashboard/usuarios",
            color: "emerald" as const,
          },
        ]
      : []),
  ];

  if (role === "COURIER") {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900">Mis Rutas del Día</h1>
            <p className="text-slate-600 mt-1">Ve tus recogidas asignadas</p>
          </div>
          <Link href="/dashboard/mis-recogidas">
            <Button variant="primary" size="lg">
              Ver Mis Recogidas →
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">
            Bienvenido, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-600 mt-2">Resumen operacional de O&apos;Globo Cargo</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {STAT_CARDS.map((card) => (
              <Link key={card.label} href={card.href} className="group">
                <div className={`bg-gradient-to-br ${card.color} p-5 rounded-2xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300 h-full group-hover:scale-105 cursor-pointer`}>
                  <div className="text-2xl mb-3">{card.icon}</div>
                  <p className="text-3xl font-black mb-1">{card.value}</p>
                  <p className="text-white/80 text-sm font-medium">{card.label}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Acciones rápidas</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {QUICK_ACTIONS.map((action) => {
              const colorMap = {
                indigo: "hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100",
                violet: "hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100",
                emerald: "hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100",
              };
              return (
                <Link key={action.href} href={action.href}>
                  <Card variant="default" className={`group cursor-pointer transition-all duration-300 ${colorMap[action.color as keyof typeof colorMap]}`}>
                    <div className="text-3xl mb-3">{action.icon}</div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{action.title}</h3>
                    <p className="text-slate-600 text-sm">{action.desc}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <Card variant="filled" padding="lg">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span>💡</span> Pro tip
          </h3>
          <p className="text-slate-700 text-sm leading-relaxed">
            Usa el <strong>Mapa de Rutas</strong> para visualizar todas las recogidas geográficamente y optimizar las rutas de tus couriers. Puedes filtrar por estado para ver solo las que te interesan.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
