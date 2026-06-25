"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamicImport from "next/dynamic";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";

const MapView = dynamicImport(() => import("@/components/MapView"), { ssr: false, loading: () => <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div> });

// Approximate lat/lng for cities in Colombia and other countries
const CITY_COORDS: Record<string, [number, number]> = {
  "bogota": [4.711, -74.0721], "medellín": [6.2518, -75.5636], "medellin": [6.2518, -75.5636],
  "cali": [3.4516, -76.5319], "barranquilla": [10.9685, -74.7813], "cartagena": [10.3997, -75.5144],
  "bucaramanga": [7.1193, -73.1227], "pereira": [4.8133, -75.6961], "manizales": [5.0703, -75.5138],
  "santa marta": [11.2408, -74.1990], "cúcuta": [7.8939, -72.5078], "cucuta": [7.8939, -72.5078],
  "ibagué": [4.4389, -75.2322], "ibague": [4.4389, -75.2322], "villavicencio": [4.1421, -73.6262],
  "miami": [25.7617, -80.1918], "new york": [40.7128, -74.0060], "madrid": [40.4168, -3.7038],
  "bogotá": [4.711, -74.0721],
};

function coordsForCity(city: string): [number, number] {
  const key = city.toLowerCase().trim();
  return CITY_COORDS[key] ?? [4.711 + Math.random() * 2 - 1, -74.072 + Math.random() * 2 - 1];
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
        <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mapa de Rutas</h1>
            <p className="text-slate-500 text-sm mt-0.5">{pickups.length} solicitudes en el mapa</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setLoading(true); }}
            className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="ASSIGNED">Asignados</option>
            <option value="SCHEDULED">Programados</option>
            <option value="PICKED_UP">Recogidos</option>
          </select>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="flex-1 p-4">
            {loading ? (
              <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <MapView points={points} />
            )}
          </div>

          {/* Sidebar list */}
          <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto shrink-0">
            <div className="p-4 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Lista de Recogidas</p>
            </div>
            <div className="divide-y divide-slate-100">
              {pickups.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-sm">No hay recogidas</p>
              ) : (
                pickups.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${selected?.id === p.id ? "bg-indigo-50 border-l-2 border-indigo-600" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{p.trackingCode}</p>
                        <p className="text-slate-500 text-xs truncate mt-0.5">{p.contactName}</p>
                        <p className="text-slate-400 text-xs mt-1">{p.pickupCity}, {p.pickupCountry}</p>
                        {p.assignedCourier && <p className="text-indigo-500 text-xs mt-1">Courier: {p.assignedCourier.name}</p>}
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
