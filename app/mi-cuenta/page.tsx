"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PickupRequest {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  preferredDate: string;
  contactName: string;
}

export default function MiCuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "CUSTOMER") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

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

    fetchPickups();
  }, [status]);

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    ASSIGNED: "Asignada",
    SCHEDULED: "Programada",
    PICKED_UP: "Recogida",
    CANCELLED: "Cancelada",
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    ASSIGNED: "bg-blue-100 text-blue-800",
    SCHEDULED: "bg-purple-100 text-purple-800",
    PICKED_UP: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← Inicio
          </Link>
          <h1 className="text-2xl font-bold text-indigo-600">Mi Cuenta</h1>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-red-600 hover:text-red-800 font-semibold"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Mis Solicitudes de Recogida</h2>

          <div className="mb-6">
            <Link
              href="/recoger"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              + Nueva Solicitud
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {pickups.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 mb-4">Aún no tienes solicitudes</p>
                <Link
                  href="/recoger"
                  className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Crear tu Primera Solicitud
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {pickups.map((pickup) => (
                  <div key={pickup.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Código de Seguimiento</p>
                        <p className="text-2xl font-bold text-indigo-600 mb-2">{pickup.trackingCode}</p>

                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Estado</p>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                statusColors[pickup.status]
                              }`}
                            >
                              {statusLabels[pickup.status]}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Fecha Preferida</p>
                            <p className="font-semibold">
                              {new Date(pickup.preferredDate).toLocaleDateString("es-ES")}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Creada</p>
                            <p className="font-semibold">
                              {new Date(pickup.createdAt).toLocaleDateString("es-ES")}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/rastreo/${pickup.trackingCode}`}
                        className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-semibold whitespace-nowrap"
                      >
                        Rastrear
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
