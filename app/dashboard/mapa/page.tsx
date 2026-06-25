"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamicImport from "next/dynamic";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import Card from "@/components/Card";

const MapView = dynamicImport(() => import("@/components/MapView"), { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div> });

// Approximate lat/lng for US cities and common international ones
const CITY_COORDS: Record<string, [number, number]> = {
  // United States
  "miami": [25.7617, -80.1918], "new york": [40.7128, -74.0060], "los angeles": [34.0522, -118.2437],
  "chicago": [41.8781, -87.6298], "houston": [29.7604, -95.3698], "dallas": [32.7767, -96.7970],
  "san francisco": [37.7749, -122.4194], "seattle": [47.6062, -122.3321], "boston": [42.3601, -71.0589],
  "atlanta": [33.7490, -84.3880], "orlando": [28.5383, -81.3792], "las vegas": [36.1699, -115.1398],
  "phoenix": [33.4484, -112.0740], "denver": [39.7392, -104.9903], "washington": [38.9072, -77.0369],
  "washington dc": [38.9072, -77.0369], "philadelphia": [39.9526, -75.1652], "san diego": [32.7157, -117.1611],
  "minneapolis": [44.9778, -93.2650], "detroit": [42.3314, -83.0458], "portland": [45.5051, -122.6750],
  "charlotte": [35.2271, -80.8431], "tampa": [27.9506, -82.4572], "austin": [30.2672, -97.7431],
  "san jose": [37.3382, -121.8863], "jacksonville": [30.3322, -81.6557], "fort lauderdale": [26.1224, -80.1373],
  "new orleans": [29.9511, -90.0715], "memphis": [35.1495, -90.0490], "nashville": [36.1627, -86.7816],
  // International
  "madrid": [40.4168, -3.7038], "london": [51.5074, -0.1278], "toronto": [43.6532, -79.3832],
  "mexico city": [19.4326, -99.1332], "cancun": [21.1619, -86.8515], "bogota": [4.711, -74.0721],
  "bogotá": [4.711, -74.0721], "medellin": [6.2518, -75.5636], "medellín": [6.2518, -75.5636],
};

function coordsForCity(city: string): [number, number] {
  const key = city.toLowerCase().trim();
  return CITY_COORDS[key] ?? [37.0902 + Math.random() * 4 - 2, -95.7129 + Math.random() * 10 - 5];
}

interface Pickup {
  id: string;
  trackingCode: string;
  contactName: string;
  pickupCity: string;
  pickupCountry: string;
  status: string;
  preferredDate: string;
  assignedCourier?: { name: string } | null;
}

export default function MapaPage() {
  const { data: session, status } = useSession();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Pickup | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    const load = async () => {
      const role = (session?.user as any)?.role;
      let url = "/api/pickup-requests?limit=100";
      if (role === "COURIER") url += `&courierId=${(session?.user as any)?.id}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setPickups(data.data ?? []);
      setLoading(false);
    };
    load();
  }, [status, session, statusFilter]);

  const points = pickups.map((p) => {
    const [lat, lng] = coordsForCity(p.pickupCity);
    return { lat, lng, label: `${p.pickupCity}, ${p.pickupCountry} · ${p.contactName}`, status: p.status, trackingCode: p.trackingCode };
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-2xl">🗺️</div>
              <h1 className="text-2xl font-black text-slate-900">Mapa de Rutas</h1>
            </div>
            <p className="text-slate-600 text-sm">
              <span className="font-bold">{pickups.length}</span> solicitudes visualizadas en el mapa
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors font-medium"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="ASSIGNED">Asignados</option>
            <option value="SCHEDULED">Programados</option>
            <option value="PICKED_UP">Recogidos</option>
          </select>
        </div>

        <div className="flex flex-1 overflow-hidden bg-slate-50">
          {/* Map */}
          <div className="flex-1 p-4">
            {loading ? (
              <Card variant="elevated" className="w-full h-full flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
                <p className="text-slate-600 font-medium">Cargando mapa...</p>
              </Card>
            ) : (
              <MapView points={points} />
            )}
          </div>

          {/* Sidebar list */}
          <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto shrink-0 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 shrink-0">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Solicitudes ({pickups.length})</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pickups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="text-4xl mb-3 opacity-50">📭</div>
                  <p className="text-slate-500 font-medium">Sin solicitudes</p>
                  <p className="text-slate-400 text-xs mt-1">Intenta con otros filtros</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pickups.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className={`w-full text-left px-4 py-4 hover:bg-slate-50 transition-all duration-150 ${
                        selected?.id === p.id ? "bg-indigo-50 border-l-2 border-indigo-600" : "border-l-2 border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm font-mono">{p.trackingCode}</p>
                          <p className="text-slate-700 text-xs font-medium mt-1 truncate">{p.contactName}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{p.pickupCity}, {p.pickupCountry}</p>
                          {p.assignedCourier && (
                            <p className="text-indigo-600 text-xs font-medium mt-1.5">🚗 {p.assignedCourier.name}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
