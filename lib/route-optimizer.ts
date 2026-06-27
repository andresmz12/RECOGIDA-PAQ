export function haversineKm(a: [number, number], b: [number, number]): number {
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

function totalDistance<T extends { lat: number; lng: number }>(
  origin: [number, number],
  route: T[]
): number {
  if (route.length === 0) return 0;
  let d = haversineKm(origin, [route[0].lat, route[0].lng]);
  for (let i = 1; i < route.length; i++) {
    d += haversineKm([route[i - 1].lat, route[i - 1].lng], [route[i].lat, route[i].lng]);
  }
  return d;
}

function nearestNeighbor<T extends { lat: number; lng: number }>(
  origin: [number, number],
  stops: T[]
): T[] {
  const remaining = [...stops];
  const route: T[] = [];
  let cur = origin;
  while (remaining.length > 0) {
    let ni = 0;
    let minD = Infinity;
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

function twoOpt<T extends { lat: number; lng: number }>(
  origin: [number, number],
  route: T[]
): T[] {
  if (route.length < 4) return route;
  let best = [...route];
  let bestDist = totalDistance(origin, best);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const newRoute = [
          ...best.slice(0, i + 1),
          ...best.slice(i + 1, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const newDist = totalDistance(origin, newRoute);
        if (newDist < bestDist - 0.001) {
          best = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function optimizeRoute<T extends { lat: number; lng: number }>(
  origin: [number, number],
  stops: T[]
): T[] {
  if (stops.length === 0) return [];
  const nn = nearestNeighbor(origin, stops);
  return twoOpt(origin, nn);
}

export function buildGoogleMapsRouteUrl(
  originAddress: string,
  stops: Array<{ pickupAddress: string; pickupCity: string }>
): string {
  const parts = [
    encodeURIComponent(originAddress),
    ...stops.map((s) => encodeURIComponent(`${s.pickupAddress}, ${s.pickupCity}`)),
  ];
  return `https://www.google.com/maps/dir/${parts.join("/")}`;
}

// ── City geocoding (offline lookup) ───────────────────────────────
// Used to order stops geographically without an external geocoder.
export const CITY_COORDS: Record<string, [number, number]> = {
  "miami": [25.7617, -80.1918], "new york": [40.7128, -74.0060], "los angeles": [34.0522, -118.2437],
  "chicago": [41.8781, -87.6298], "houston": [29.7604, -95.3698], "dallas": [32.7767, -96.7970],
  "san francisco": [37.7749, -122.4194], "seattle": [47.6062, -122.3321], "boston": [42.3601, -71.0589],
  "atlanta": [33.7490, -84.3880], "orlando": [28.5383, -81.3792], "las vegas": [36.1699, -115.1398],
  "phoenix": [33.4484, -112.0740], "denver": [39.7392, -104.9903], "washington": [38.9072, -77.0369],
  "philadelphia": [39.9526, -75.1652], "san diego": [32.7157, -117.1611], "summit": [40.7156, -74.3590],
  "minneapolis": [44.9778, -93.2650], "detroit": [42.3314, -83.0458], "portland": [45.5051, -122.6750],
  "charlotte": [35.2271, -80.8431], "tampa": [27.9506, -82.4572], "austin": [30.2672, -97.7431],
  "san jose": [37.3382, -121.8863], "jacksonville": [30.3322, -81.6557], "fort lauderdale": [26.1224, -80.1373],
  "new orleans": [29.9511, -90.0715], "memphis": [35.1495, -90.0490], "nashville": [36.1627, -86.7816],
  "madrid": [40.4168, -3.7038], "london": [51.5074, -0.1278], "toronto": [43.6532, -79.3832],
  "bogota": [4.711, -74.0721], "bogotá": [4.711, -74.0721], "medellin": [6.2518, -75.5636],
  "medellín": [6.2518, -75.5636], "cali": [3.4516, -76.5319], "barranquilla": [10.9685, -74.7813],
};

export function geocodeCity(city: string): [number, number] | null {
  if (!city) return null;
  const normalized = city.toLowerCase().trim().replace(/,\s*[a-z]{2}$/i, "").trim();
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.startsWith(key) || normalized.includes(key)) return coords;
  }
  return null;
}

// Order stops geographically using best-effort city geocoding. Stops whose
// city can't be geocoded are appended (in their original order) at the end so
// they are never dropped from the route.
export function optimizeStopsByCity<T extends { pickupCity: string }>(
  originCoords: [number, number] | null,
  originText: string,
  stops: T[]
): T[] {
  const origin = originCoords ?? geocodeCity(originText);
  if (!origin || stops.length < 2) return stops;

  const geo: Array<T & { lat: number; lng: number }> = [];
  const ungeo: T[] = [];
  for (const s of stops) {
    const c = geocodeCity(s.pickupCity);
    if (c) geo.push({ ...s, lat: c[0], lng: c[1] });
    else ungeo.push(s);
  }
  if (geo.length === 0) return stops;

  const ordered = optimizeRoute(origin, geo);
  return [...ordered, ...ungeo] as T[];
}
