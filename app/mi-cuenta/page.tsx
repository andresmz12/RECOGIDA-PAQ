"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

const COUNTRY_NAMES: Record<string, string> = {
  HN: "Honduras", GT: "Guatemala", SV: "El Salvador", NI: "Nicaragua",
  DO: "Rep. Dominicana", PA: "Panamá", CR: "Costa Rica",
  VE: "Venezuela", MX: "México", CO: "Colombia", US: "Estados Unidos",
};

interface Pickup {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  preferredDate: string;
  contactName: string;
  pickupCity: string;
  pickupCountry: string;
  recipientName: string;
  recipientCity: string;
  recipientCountry: string;
  packageType?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [tab, setTab] = useState<"activas" | "completadas">("activas");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "CUSTOMER")
      router.push("/dashboard");
  }, [status, session, router]);

  const fetchPickups = async () => {
    try {
      const res = await fetch("/api/my-pickups");
      const data = await res.json();
      setPickups(data.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchPickups();
  }, [status]);

  const handleCancel = async (pickup: Pickup) => {
    if (!confirm(`¿Cancelar la solicitud ${pickup.trackingCode}?`)) return;
    setCancelling(pickup.id);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) fetchPickups();
    } finally {
      setCancelling(null);
    }
  };

  const active = pickups.filter(p => !["PICKED_UP", "CANCELLED"].includes(p.status));
  const done = pickups.filter(p => ["PICKED_UP", "CANCELLED"].includes(p.status));
  const displayed = tab === "activas" ? active : done;

  const name = session?.user?.name ?? "";
  const initial = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ─────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Inicio
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>OG</div>
              <span className="text-white font-bold text-sm hidden sm:block">O'Globo Cargo</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
          </div>

          {/* User info + stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-900/50 shrink-0"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {initial}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{name}</h1>
                <p className="text-white/50 text-sm">{session?.user?.email}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 sm:gap-6">
              {[
                { n: pickups.length, l: "Total" },
                { n: active.length, l: "Activas" },
                { n: done.filter(p => p.status === "PICKED_UP").length, l: "Completadas" },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-black text-white">{s.n}</p>
                  <p className="text-white/40 text-xs font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 border-b border-white/10">
            {(["activas", "completadas"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                  tab === t
                    ? "text-white border-indigo-400"
                    : "text-white/40 border-transparent hover:text-white/70"
                }`}
              >
                {t === "activas" ? `Activas ${active.length > 0 ? `(${active.length})` : ""}` : `Historial ${done.length > 0 ? `(${done.length})` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* CTA */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-sm font-medium">
            {loading ? "Cargando..." : displayed.length === 0
              ? tab === "activas" ? "No tienes envíos activos" : "Sin historial aún"
              : `${displayed.length} solicitud${displayed.length !== 1 ? "es" : ""}`}
          </p>
          <Link
            href="/recoger"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-5 bg-slate-200 rounded w-28" />
                  <div className="h-5 bg-slate-200 rounded w-20" />
                </div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              {tab === "activas" ? "No tienes envíos activos" : "Sin historial de envíos"}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {tab === "activas" ? "Crea una solicitud para enviar un paquete" : "Tus envíos completados aparecerán aquí"}
            </p>
            {tab === "activas" && (
              <Link href="/recoger"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                Crear primera solicitud →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(p => (
              <PickupCard
                key={p.id}
                pickup={p}
                cancelling={cancelling === p.id}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PickupCard({
  pickup, cancelling, onCancel,
}: {
  pickup: Pickup;
  cancelling: boolean;
  onCancel: (p: Pickup) => void;
}) {
  const canCancel = pickup.status === "PENDING";
  const isDone = pickup.status === "PICKED_UP";
  const isCancelled = pickup.status === "CANCELLED";

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${
      isDone ? "border-emerald-100" : isCancelled ? "border-slate-100" : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
    }`}>
      {isDone && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-5 py-1.5 rounded-t-[14px] flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          PAQUETE ENTREGADO
        </div>
      )}
      {isCancelled && (
        <div className="bg-slate-400 text-white text-xs font-bold px-5 py-1.5 rounded-t-[14px]">
          CANCELADO
        </div>
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">
              {pickup.trackingCode}
            </span>
          </div>
          <StatusBadge status={pickup.status} />
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Origen</p>
            <p className="font-bold text-slate-900 truncate">{pickup.pickupCity}</p>
            <p className="text-xs text-slate-500">{COUNTRY_NAMES[pickup.pickupCountry] ?? pickup.pickupCountry}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1 px-2">
            <div className="w-2 h-2 rounded-full bg-indigo-300" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-600 rounded-full" />
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Destino</p>
            <p className="font-bold text-slate-900 truncate">{pickup.recipientCity}</p>
            <p className="text-xs text-slate-500">{COUNTRY_NAMES[pickup.recipientCountry] ?? pickup.recipientCountry}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(pickup.preferredDate)}
          </span>
          {pickup.packageType && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {pickup.packageType}
            </span>
          )}
          <span className="ml-auto">Para: <span className="font-semibold text-slate-700">{pickup.recipientName}</span></span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/rastreo/${pickup.trackingCode}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            Rastrear
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          {canCancel && (
            <button
              onClick={() => onCancel(pickup)}
              disabled={cancelling}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
            >
              {cancelling ? "..." : "Cancelar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
