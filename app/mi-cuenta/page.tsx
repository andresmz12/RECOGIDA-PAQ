"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Container from "@/components/Container";
import StatusBadge from "@/components/StatusBadge";

interface PickupRequest {
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
}

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "CUSTOMER") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchPickups = async () => {
    try {
      const res = await fetch(`/api/my-pickups`);
      const data = await res.json();
      setPickups(data.data || []);
    } catch (err) {
      console.error("Error fetching pickups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchPickups();
  }, [status]);

  const handleCancel = async (pickup: PickupRequest) => {
    if (!confirm(`¿Cancelar la solicitud ${pickup.trackingCode}? Esta acción no se puede deshacer.`)) return;
    setCancelling(pickup.id);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        await fetchPickups();
      }
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <Container size="lg">
          <div className="py-4 flex items-center justify-between">
            <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-2">
              ← Volver
            </Link>
            <h1 className="text-2xl font-black text-slate-900">Mi Cuenta</h1>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </Container>
      </div>

      <Container size="lg">
        <div className="py-12">
          {/* Title & CTA */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📦</div>
              <h2 className="text-3xl font-black text-slate-900">Mis Solicitudes de Recogida</h2>
            </div>
            <p className="text-slate-600 mb-6">Gestiona y rastrea todas tus solicitudes de recogida</p>

            <Link href="/recoger">
              <Button variant="primary" size="lg">
                + Crear Nueva Solicitud
              </Button>
            </Link>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-slate-600 font-medium">Cargando tus solicitudes...</p>
            </div>
          ) : pickups.length === 0 ? (
            <Card variant="elevated" padding="lg" className="text-center">
              <div className="text-5xl mb-4 opacity-50">📭</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aún no tienes solicitudes</h3>
              <p className="text-slate-600 mb-8">Crea tu primera solicitud de recogida para comenzar</p>
              <Link href="/recoger">
                <Button variant="primary">Crear Primera Solicitud</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-5">
              {pickups.map((pickup) => (
                <Card key={pickup.id} variant="default" padding="lg" className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Tracking Code */}
                      <div className="mb-5">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Código de Seguimiento</p>
                        <p className="text-2xl font-bold text-indigo-600 font-mono">{pickup.trackingCode}</p>
                      </div>

                      {/* Location & Details Grid */}
                      <div className="grid md:grid-cols-3 gap-6 mb-5">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Origen (Remitente)</p>
                          <p className="font-semibold text-slate-900">{pickup.contactName}</p>
                          <p className="text-sm text-slate-600 mt-1">{pickup.pickupCity}, {pickup.pickupCountry}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Destino</p>
                          <p className="font-semibold text-slate-900">{pickup.recipientName}</p>
                          <p className="text-sm text-slate-600 mt-1">{pickup.recipientCity}, {pickup.recipientCountry}</p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Estado</p>
                            <StatusBadge status={pickup.status} />
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid sm:grid-cols-2 gap-4 pt-5 border-t border-slate-100">
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Fecha Preferida</p>
                          <p className="font-semibold text-slate-900">{new Date(pickup.preferredDate).toLocaleDateString("es-ES")}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Creada el</p>
                          <p className="font-semibold text-slate-900">{new Date(pickup.createdAt).toLocaleDateString("es-ES")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex flex-col gap-3">
                      <Link href={`/rastreo/${pickup.trackingCode}`}>
                        <Button variant="primary">Rastrear →</Button>
                      </Link>
                      {pickup.status === "PENDING" && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancel(pickup)}
                          loading={cancelling === pickup.id}
                          disabled={cancelling === pickup.id}
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
