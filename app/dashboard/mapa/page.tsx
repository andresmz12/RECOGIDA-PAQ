"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import dynamicImport from "next/dynamic";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import type { MapPoint } from "@/components/maps/MapView";

const MapView = dynamicImport(() => import("@/components/maps/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  ),
});

const CITY_COORDS: Record<string, [number, number]> = {
  "miami": [25.7617, -80.1918], "new york": [40.7128, -74.0060], "los angeles": [34.0522, -118.2437],
  "chicago": [41.8781, -87.6298], "houston": [29.7604, -95.3698], "dallas": [32.7767, -96.7970],
  "san francisco": [37.7749, -122.4194], "seattle": [47.6062, -122.3321], "boston": [42.3601, -71.0589],
  "atlanta": [33.7490, -84.3880], "orlando": [28.5383, -81.3792], "las vegas": [36.1699, -115.1398],
  "phoenix": [33.4484, -112.0740], "denver": [39.7392, -104.9903], "washington": [38.9072, -77.0369],
  "philadelphia": [39.9526, -75.1652], "san diego": [32.7157, -117.1611],
  "minneapolis": [44.9778, -93.2650], "detroit": [42.3314, -83.0458], "portland": [45.5051, -122.6750],
  "charlotte": [35.2271, -80.8431], "tampa": [27.9506, -82.4572], "austin": [30.2672, -97.7431],
  "san jose": [37.3382, -121.8863], "jacksonville": [30.3322, -81.6557], "fort lauderdale": [26.1224, -80.1373],
  "new orleans": [29.9511, -90.0715], "memphis": [35.1495, -90.0490], "nashville": [36.1627, -86.7816],
  "madrid": [40.4168, -3.7038], "london": [51.5074, -0.1278], "toronto": [43.6532, -79.3832],
  "bogota": [4.711, -74.0721], "bogotá": [4.711, -74.0721], "medellin": [6.2518, -75.5636],
  "medellín": [6.2518, -75.5636], "cali": [3.4516, -76.5319], "barranquilla": [10.9685, -74.7813],
};

// Flexible match: strips state abbreviations (", FL"), tries partial key matching
function coordsForCity(city: string): [number, number] | null {
  const normalized = city.toLowerCase().trim().replace(/,\s*[a-z]{2}$/i, "").trim();
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.startsWith(key) || normalized.includes(key)) return coords;
  }
  return null;
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
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

export default function MapaPage() {
  const { data: session, status } = useSession();
  const role     = (session?.user as any)?.role as string;
  const userId   = (session?.user as any)?.id as string;
  const isCourier = role === "COURIER";

  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  // todayOnly starts false; set to true for couriers once role is known
  const [todayOnly, setTodayOnly] = useState(false);
  const [todayInitialized, setTodayInitialized] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationCity, setLocationCity] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  const [optimizedRoute, setOptimizedRoute] = useState<Pickup[]>([]);
  const [isOptimized, setIsOptimized] = useState(false);
  const [selected, setSelected] = useState<Pickup | null>(null);

  // Set todayOnly default once role is known
  useEffect(() => {
    if (role && !todayInitialized) {
      setTodayOnly(isCourier);
      setTodayInitialized(true);
    }
  }, [role, isCourier, todayInitialized]);

  const loadPickups = useCallback(async () => {
    if (status !== "authenticated" || !role) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    let url = "/api/pickup-requests?limit=200";
    if (statusFilter)   url += `&status=${statusFilter}`;
    if (todayOnly)      url += `&date=${today}`;
    if (isCourier && userId) url += `&courierId=${userId}`;

    const res = await fetch(url);
    const data = await res.json();
    const raw: Pickup[] = data.data ?? [];

    // Attach coords where possible — keep ALL pickups regardless
    const withCoords = raw.map((p) => {
      const c = coordsForCity(p.pickupCity);
      return { ...p, lat: c?.[0] ?? undefined, lng: c?.[1] ?? undefined };
    });

    setPickups(withCoords);
    setOptimizedRoute([]);
    setIsOptimized(false);
    setLoading(false);
  }, [status, role, userId, isCourier, statusFilter, todayOnly]);

  useEffect(() => {
    if (todayInitialized || !isCourier) loadPickups();
  }, [loadPickups, todayInitialized, isCourier]);

  // Re-load when todayOnly is initialized for courier
  useEffect(() => {
    if (todayInitialized) loadPickups();
  }, [todayInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  const detectLocation = () => {
    if (!navigator.geolocation) { setGeoError("Tu navegador no soporta geolocalización"); return; }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCurrentLocation([pos.coords.latitude, pos.coords.longitude]); setGeoLoading(false); },
      () => { setGeoError("No se pudo obtener la ubicación. Usa el selector de ciudad."); setGeoLoading(false); },
      { timeout: 8000 }
    );
  };

  const setLocationFromCity = (city: string) => {
    setLocationCity(city);
    const c = coordsForCity(city);
    if (c) setCurrentLocation(c);
  };

  const optimizeRoute = () => {
    if (!currentLocation) return;
    const active = pickups.filter(
      (p): p is Pickup & { lat: number; lng: number } =>
        p.status !== "PICKED_UP" && p.status !== "CANCELLED" &&
        p.lat !== undefined && p.lng !== undefined
    );
    if (active.length === 0) return;
    const route = nearestNeighbor(currentLocation, active);
    setOptimizedRoute(route);
    setIsOptimized(true);
  };

  const resetRoute = () => { setOptimizedRoute([]); setIsOptimized(false); };

  const displayPickups = isOptimized ? optimizedRoute : pickups;

  const mapPoints: MapPoint[] = [
    ...(currentLocation ? [{
      lat: currentLocation[0], lng: currentLocation[1],
      label: "Tu ubicación", status: "CURRENT", trackingCode: "", isCurrentLocation: true,
    }] : []),
    ...displayPickups
      .filter((p) => p.lat !== undefined && p.lng !== undefined)
      .map((p, i) => ({
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
      ? [currentLocation, ...optimizedRoute.filter(p => p.lat && p.lng).map((p) => [p.lat!, p.lng!] as [number, number])]
      : undefined;

  const mappedCount = pickups.filter((p) => p.lat !== undefined).length;
  const canOptimize = currentLocation && pickups.some(
    (p) => p.lat !== undefined && p.status !== "PICKED_UP" && p.status !== "CANCELLED"
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">Mapa de Rutas</h1>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pickups.length}
                </span>
                {mappedCount < pickups.length && !loading && (
                  <span className="text-xs text-slate-400">
                    ({mappedCount} en mapa · {pickups.length - mappedCount} sin coords)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Today toggle */}
              <button
                onClick={() => { setTodayOnly(!todayOnly); setIsOptimized(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  todayOnly
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Solo hoy
              </button>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setIsOptimized(false); }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendientes</option>
                <option value="ASSIGNED">Asignados</option>
                <option value="SCHEDULED">En camino</option>
                <option value="PICKED_UP">Recogidos</option>
              </select>

              {/* Location (courier) */}
              {isCourier && (
                <>
                  <button
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {geoLoading ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    Mi ubicación
                  </button>

                  <select
                    value={locationCity}
                    onChange={(e) => setLocationFromCity(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">O selecciona ciudad</option>
                    {Object.keys(CITY_COORDS).map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Optimize / reset */}
              {canOptimize && !isOptimized && (
                <button
                  onClick={optimizeRoute}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Optimizar ruta
                </button>
              )}
              {isOptimized && (
                <button
                  onClick={resetRoute}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Quitar ruta
                </button>
              )}
            </div>
          </div>

          {geoError && (
            <p className="text-xs text-red-600 font-medium mt-2 bg-red-50 px-3 py-1.5 rounded-lg">{geoError}</p>
          )}
          {isOptimized && (
            <div className="mt-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5">
              <span className="text-violet-700 text-xs font-semibold">
                Ruta optimizada — {optimizedRoute.length} paradas en orden eficiente
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="flex-1 p-3 min-w-0">
            {loading ? (
              <div className="w-full h-full bg-white rounded-xl flex flex-col items-center justify-center border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
                <p className="text-slate-500 text-sm">Cargando...</p>
              </div>
            ) : (
              <MapView points={mapPoints} routePolyline={routePolyline} />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-72 border-l border-slate-200 bg-white overflow-y-auto shrink-0 flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-100 shrink-0 bg-slate-50/80 sticky top-0">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                {isOptimized ? "Ruta optimizada" : "Solicitudes"} ({displayPickups.length})
              </p>
              {currentLocation && (
                <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                  {locationCity ? `Desde: ${locationCity}` : "Ubicación detectada"}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {displayPickups.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3 text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-semibold text-sm">Sin solicitudes</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {todayOnly ? "No hay recogidas para hoy" : "Prueba con otros filtros"}
                  </p>
                  {todayOnly && (
                    <button
                      onClick={() => setTodayOnly(false)}
                      className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Ver todas →
                    </button>
                  )}
                </div>
              ) : (
                displayPickups.map((p, i) => (
                  <div
                    key={p.id}
                    className={`px-4 py-3.5 transition-all cursor-pointer border-l-2 ${
                      selected?.id === p.id
                        ? "bg-indigo-50 border-indigo-500"
                        : "border-transparent hover:bg-slate-50"
                    }`}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  >
                    <div className="flex items-start gap-2">
                      {isOptimized && (
                        <div className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                      )}
                      {!p.lat && (
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-xs flex items-center justify-center shrink-0 mt-0.5" title="Sin coordenadas">
                          ?
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="font-mono font-bold text-slate-900 text-xs">{p.trackingCode}</p>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-slate-800 text-xs font-semibold truncate">{p.contactName}</p>
                        <p className="text-slate-500 text-xs truncate">{p.pickupAddress}</p>
                        <p className="text-slate-400 text-xs">{p.pickupCity} · {p.preferredTimeWindow}</p>
                      </div>
                    </div>

                    {selected?.id === p.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                        <a
                          href={mapsUrl(p.pickupAddress, p.pickupCity)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Google Maps
                        </a>
                        <a
                          href={`tel:${p.contactPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Llamar
                        </a>
                        {!isCourier && (
                          <Link
                            href={`/dashboard/solicitudes/${p.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            Ver →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {isOptimized && optimizedRoute.length > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-violet-50 shrink-0">
                <p className="text-xs text-violet-700 font-semibold">{optimizedRoute.length} paradas · Ruta optimizada</p>
                <p className="text-xs text-violet-500 mt-0.5">Ordenadas por distancia mínima</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
