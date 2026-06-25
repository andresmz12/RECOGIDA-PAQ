"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  scheduled: number;
  pickedUp: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    assigned: 0,
    scheduled: 0,
    pickedUp: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status !== "authenticated") return;

    const role = (session?.user as any)?.role;
    if (!["ADMIN", "DISPATCHER", "COURIER"].includes(role)) {
      router.push("/login");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchStats = async () => {
      try {
        const statuses = ["PENDING", "ASSIGNED", "SCHEDULED", "PICKED_UP"];
        const requests: any = { total: 0, pending: 0, assigned: 0, scheduled: 0, pickedUp: 0 };

        for (const st of statuses) {
          const res = await fetch(`/api/pickup-requests?status=${st}&limit=1`);
          const data = await res.json();
          requests.total += data.pagination.total;

          if (st === "PENDING") requests.pending = data.pagination.total;
          if (st === "ASSIGNED") requests.assigned = data.pagination.total;
          if (st === "SCHEDULED") requests.scheduled = data.pagination.total;
          if (st === "PICKED_UP") requests.pickedUp = data.pagination.total;
        }

        setStats(requests);
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [status]);

  const role = (session?.user as any)?.role;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">O'Globo Cargo Dashboard</h1>
          <button
            onClick={() => {
              fetch("/api/auth/signout", { method: "POST" }).then(() => {
                router.push("/");
              });
            }}
            className="text-red-600 hover:text-red-800 font-semibold"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {role === "COURIER" ? (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Mis Recogidas</h2>
            <Link
              href="/dashboard/mis-recogidas"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
            >
              Ver Mis Recogidas
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Resumen General</h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Total</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Asignadas</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.assigned}</p>
                  </div>

                  <div className="bg-purple-50 p-6 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Programadas</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.scheduled}</p>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Recogidas</p>
                    <p className="text-3xl font-bold text-green-600">{stats.pickedUp}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Link
                    href="/dashboard/solicitudes"
                    className="block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
                  >
                    Ver Todas las Solicitudes
                  </Link>

                  {role === "ADMIN" && (
                    <Link
                      href="/dashboard/usuarios"
                      className="block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                      Gestionar Usuarios
                    </Link>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
