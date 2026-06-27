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
