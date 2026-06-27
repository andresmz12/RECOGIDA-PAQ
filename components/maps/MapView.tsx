"use client";

import { useEffect, useRef, useState } from "react";

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  status: string;
  trackingCode: string;
  routeOrder?: number;
  isCurrentLocation?: boolean;
}

interface MapViewProps {
  points: MapPoint[];
  center?: [number, number];
  routePolyline?: Array<[number, number]>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#f59e0b",
  ASSIGNED:  "#3b82f6",
  SCHEDULED: "#2c629b",
  PICKED_UP: "#10b981",
  CANCELLED: "#ef4444",
};

export default function MapView({ points, center, routePolyline }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const LRef         = useRef<any>(null);
  const markersRef   = useRef<any[]>([]);
  const polylineRef  = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      LRef.current = L;
      const defaultCenter: [number, number] = center ?? [32.0, -96.0];
      const map = L.map(containerRef.current).setView(defaultCenter, 5);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      setMapReady(true);
    };

    init();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        LRef.current = null;
      }
    };
  }, []);

  // Update markers + polyline when data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current || !LRef.current) return;
    const L   = LRef.current;
    const map = mapRef.current;

    // Clear previous markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Clear previous polyline
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (points.length === 0) return;

    points.forEach((pt) => {
      let icon: any;

      if (pt.isCurrentLocation) {
        icon = L.divIcon({
          html: `
            <div style="
              width:36px;height:36px;border-radius:50%;
              background:#1d4ed8;border:3px solid white;
              box-shadow:0 2px 12px rgba(29,78,216,0.5);
              display:flex;align-items:center;justify-content:center;
            ">
              <div style="width:10px;height:10px;border-radius:50%;background:white;"></div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          className: "",
        });
      } else if (pt.routeOrder != null) {
        const color = STATUS_COLORS[pt.status] ?? "#1d4f86";
        icon = L.divIcon({
          html: `
            <div style="
              width:30px;height:30px;border-radius:50%;
              background:${color};border:2.5px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
              font-weight:800;font-size:12px;color:white;font-family:sans-serif;
            ">${pt.routeOrder}</div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          className: "",
        });
      } else {
        const color = STATUS_COLORS[pt.status] ?? "#1d4f86";
        icon = L.divIcon({
          html: `
            <div style="
              width:14px;height:14px;border-radius:50%;
              background:${color};border:2px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          className: "",
        });
      }

      const color = STATUS_COLORS[pt.status] ?? "#1d4f86";
      const marker = L.marker([pt.lat, pt.lng], { icon })
        .addTo(map)
        .bindPopup(
          pt.isCurrentLocation
            ? `<div style="font-family:sans-serif;font-weight:700;color:#1d4ed8">📍 Tu ubicación actual</div>`
            : `
              <div style="font-family:sans-serif;min-width:180px">
                ${pt.routeOrder != null ? `<div style="font-size:10px;font-weight:700;color:${color};margin-bottom:4px">PARADA ${pt.routeOrder}</div>` : ""}
                <p style="font-weight:700;margin:0 0 4px;font-size:13px">${pt.trackingCode}</p>
                <p style="margin:0;color:#64748b;font-size:12px">${pt.label}</p>
                <span style="
                  display:inline-block;margin-top:6px;padding:2px 8px;
                  border-radius:99px;font-size:11px;font-weight:600;
                  background:${color}22;color:${color};border:1px solid ${color}44
                ">${pt.status}</span>
              </div>
            `
        );
      markersRef.current.push(marker);
    });

    // Draw route polyline
    if (routePolyline && routePolyline.length > 1) {
      polylineRef.current = L.polyline(routePolyline, {
        color: "#1d4f86",
        weight: 3,
        opacity: 0.75,
        dashArray: "10, 6",
      }).addTo(map);
    }

    // Fit bounds to all points
    const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 13);
    } else {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
    }
  }, [points, routePolyline, mapReady]);

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
}
