"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/StatusBadge";
import type { MapPoint } from "@/components/MapView";

const MapView = dynamicImport(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  ),
});

// Hardcoded city coords — fallback when geolocation unavailable
const CITY_COORDS: Record<string, [number, number]> = {
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
  "madrid": [40.4168, -3.7038], "london": [51.5074, -0.1278], "toronto": [43.6532, -79.3832],
  "bogota": [4.711, -74.0721], "bogotá": [4.711, -74.0721], "medellin": [6.2518, -75.5636],
};

function coordsForCity(city: string): [number, number] | null {
  return CITY_COORDS[city.toLowerCase().trim()] ?? null;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function nearestNeighbor<T extends { lat: number; lng: number }>(
  origin: [number, number],
  stops: T[]
): T[] {
  const remaining = [...stops];
  const route: T[] = [];
  let cur = origin;
  while (remaining.length > 0) {
    let ni = 0, minD = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineKm(cur, [s.lat, s.lng]);
      if (d < minD) { minD = d; ni = i; }
    });
    route.push(remaining[ni]);
    cur = [remaining[ni].lat, remaining[ni].lng];
    remaining.splice(ni, 1);
  }
  return route;
}

function mapsUrl(address: string, city: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}, ${city}`)}&travelmode=driving`;
}

interface Pickup {
  id: string;
  trackingCode: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry: string;
  status: string;
  preferredDate: string;
  preferredTimeWindow: string;
  assignedCourier?: { name: string } | null;
  lat?: number;
  lng?: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", ASSIGNED: "Asignado", SCHEDULED: "En camino", PICKED_UP: "Recogido", CANCELLED: "Cancelado",
};

export default function MapaPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role as string;

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(role === "COURIER");

  // Location state
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationCity, setLocationCity] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Route state
  const [optimizedRoute, setOptimizedRoute] = useState<Pickup[]>([]);
  const [isOptimized, setIsOptimized] = useState(false);

  const [selected, setSelected] = useState<Pickup | null>(null);

  const loadPickups = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    let url = "/api/pickup-requests?limit=150";
    if (statusFilter) url += `&status=${statusFilter}`;
    if (todayOnly)   url += `&date=${today}`;
    if (role === "COURIER") {
      // API already restricts to own pickups
    }
    const res = await fetch(url);
    const data = await res.json();

    const raw: Pickup[] = data.data ?? [];
    // Attach coords
    const withCoords = raw.map((p) => {
      const c = coordsForCity(p.pickupCity);
      return { ...p, lat: c?.[0], lng: c?.[1] };
    }).filter((p) => p.lat !== undefined) as Pickup[];

    setPickups(withCoords);
    setOptimizedRoute([]);
    setIsOptimized(false);
    setLoading(false);
  }, [status, role, statusFilter, todayOnly]);

  useEffect(() => { loadPickups(); }, [loadPickups]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
        setGeoLoading(false);
      },
      () => {
        setGeoError("No se pudo obtener tu ubicación. Usa el selector de ciudad.");
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const setLocationFromCity = (city: string) => {
    setLocationCity(city);
    const c = coordsForCity(city);
    if (c) setCurrentLocation(c);
  };

  const optimizeRoute = () => {
    if (!currentLocation || pickups.length === 0) return;
    const active = pickups.filter((p) => p.status !== "PICKED_UP" && p.status !== "CANCELLED");
    const route = nearestNeighbor(currentLocation, active);
    setOptimizedRoute(route);
    setIsOptimized(true);
  };

  const resetRoute = () => {
    setOptimizedRoute([]);
    setIsOptimized(false);
  };

  // Build map points
  const displayPickups = isOptimized ? optimizedRoute : pickups;
  const mapPoints: MapPoint[] = [
    ...(currentLocation
      ? [{ lat: currentLocation[0], lng: currentLocation[1], label: "Tu ubicación", status: "CURRENT", trackingCode: "", isCurrentLocation: true }]
      : []),
    ...displayPickups.map((p, i) => ({
      lat: p.lat!,
      lng: p.lng!,
      label: `${p.pickupAddress}, ${p.pickupCity}`,
      status: p.status,
      trackingCode: p.trackingCode,
      ...(isOptimized ? { routeOrder: i + 1 } : {}),
    })),
  ];

  const routePolyline: Array<[number, number]> | undefined =
    isOptimized && currentLocation
      ? [currentLocation, ...displayPickups.map((p) => [p.lat!, p.lng!] as [number, number])]
      : undefined;

  const isCourier = role === "COURIER";

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white shrink-0 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl">🗺️</span>
                <h1 className="text-xl font-black text-slate-900">Mapa de Rutas</h1>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{pickups.length}</span>
              </div>
              {isCourier && currentLocation && (
                <p className="text-xs text-emerald-600 font-semibold">📍 Ubicación detectada</p>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Today toggle */}
              <button
                onClick={() => { setTodayOnly(!todayOnly); setIsOptimized(false); }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  todayOnly
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                📅 Solo hoy
              </button>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setIsOptimized(false); }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendientes</option>
                <option value="ASSIGNED">Asignados</option>
                <option value="SCHEDULED">En camino</option>
                <option value="PICKED_UP">Recogidos</option>
              </select>

              {/* Location detection (courier) */}
              {isCourier && (
                <>
                  <button
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {geoLoading ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "📍"}
                    Mi ubicación
                  </button>

                  {/* City fallback */}
                  <select
                    value={locationCity}
                    onChange={(e) => setLocationFromCity(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">O selecciona ciudad</option>
                    {Object.keys(CITY_COORDS).filter(c => c.includes(" ") || c.length > 5).slice(0, 20).map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>

                  {/* Optimize button */}
                  {currentLocation && !isOptimized && pickups.length > 0 && (
                    <button
                      onClick={optimizeRoute}
                      className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      ✨ Optimizar ruta
                    </button>
                  )}

                  {isOptimized && (
                    <button
                      onClick={resetRoute}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      ✕ Quitar ruta
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Errors / route banner */}
          {geoError && (
            <p className="text-xs text-red-600 font-medium mt-2 bg-red-50 px-3 py-1.5 rounded-lg">{geoError}</p>
          )}
          {isOptimized && (
            <div className="mt-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="text-violet-600 text-xs font-bold">✨ Ruta optimizada — {optimizedRoute.length} paradas en orden eficiente</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden bg-slate-50">
          {/* Map */}
          <div className="flex-1 p-3">
            {loading ? (
              <div className="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
                <p className="text-slate-500 font-medium text-sm">Cargando mapa...</p>
              </div>
            ) : (
              <MapView
                points={mapPoints}
                routePolyline={routePolyline}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto shrink-0 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 shrink-0 bg-slate-50">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {isOptimized ? "Ruta optimizada" : "Solicitudes"} ({displayPickups.length})
              </p>
              {isOptimized && currentLocation && (
                <p className="text-xs text-violet-600 font-semibold mt-0.5">Saliendo desde tu ubicación actual</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {displayPickups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="text-4xl mb-3 opacity-40">📭</div>
                  <p className="text-slate-500 font-medium text-sm">Sin solicitudes</p>
                  <p className="text-slate-400 text-xs mt-1">Prueba con otros filtros</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {displayPickups.map((p, i) => (
                    <div
                      key={p.id}
                      className={`px-4 py-4 transition-all cursor-pointer border-l-2 ${
                        selected?.id === p.id
                          ? "bg-indigo-50 border-indigo-500"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {isOptimized && (
                          <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-mono font-bold text-slate-900 text-xs">{p.trackingCode}</p>
                            <StatusBadge status={p.status} />
                          </div>
                          <p className="text-slate-700 text-xs font-semibold truncate">{p.contactName}</p>
                          <p className="text-slate-500 text-xs truncate">{p.pickupAddress}</p>
                          <p className="text-slate-400 text-xs">{p.pickupCity} · {p.preferredTimeWindow}</p>
                        </div>
                      </div>

                      {/* Expanded actions */}
                      {selected?.id === p.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                          <a
                            href={mapsUrl(p.pickupAddress, p.pickupCity)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Google Maps
                          </a>
                          <a
                            href={`tel:${p.contactPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            📞 Llamar
                          </a>
                          {!isCourier && (
                            <Link
                              href={`/dashboard/solicitudes/${p.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              Ver detalle →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Estimated distance footer */}
            {isOptimized && optimizedRoute.length > 1 && currentLocation && (
              <div className="px-4 py-3 border-t border-slate-200 bg-violet-50 shrink-0">
                <p className="text-xs text-violet-700 font-semibold">
                  {optimizedRoute.length} paradas · Ruta calculada
                </p>
                <p className="text-xs text-violet-500 mt-0.5">
                  Orden optimizado por distancia más corta
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
