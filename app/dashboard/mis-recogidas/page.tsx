"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PickupRequest {
  id: string;
  trackingCode: string;
  contactName: string;
  status: string;
  createdAt: string;
  preferredDate: string;
}

export default function MisRecogidaszPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchPickups = async () => {
      try {
        const res = await fetch(`/api/pickup-requests?limit=50`);
        const data = await res.json();
        setPickups(data.data);
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
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-indigo-600">Mis Recogidas</h1>
          <div></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {pickups.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600">No tienes recogidas asignadas</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Contacto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Fecha Preferida
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pickups.map((pickup) => (
                      <tr key={pickup.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                          {pickup.trackingCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{pickup.contactName}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              statusColors[pickup.status]
                            }`}
                          >
                            {statusLabels[pickup.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(pickup.preferredDate).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Link
                            href={`/dashboard/solicitudes/${pickup.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Ver Detalles
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
