"use client";

import { useEffect, useRef } from "react";

interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  status: string;
  trackingCode: string;
}

interface MapViewProps {
  points: MapPoint[];
  center?: [number, number];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "#f59e0b",
  ASSIGNED:  "#3b82f6",
  SCHEDULED: "#8b5cf6",
  PICKED_UP: "#10b981",
  CANCELLED: "#ef4444",
};

export default function MapView({ points, center = [4.711, -74.0721] }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let L: any;
    let map: any;

    const init = async () => {
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (mapRef.current) return;

      map = L.map(containerRef.current!).setView(center, 6);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      points.forEach((pt) => {
        const color = STATUS_COLORS[pt.status] ?? "#6366f1";
        const markerHtml = `
          <div style="
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>
        `;
        const icon = L.divIcon({ html: markerHtml, iconSize: [14, 14], className: "" });
        L.marker([pt.lat, pt.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <p style="font-weight:700;margin:0 0 4px">${pt.trackingCode}</p>
              <p style="margin:0;color:#64748b;font-size:12px">${pt.label}</p>
              <span style="
                display:inline-block;margin-top:6px;padding:2px 8px;
                border-radius:99px;font-size:11px;font-weight:600;
                background:${color}22;color:${color};border:1px solid ${color}44
              ">${pt.status}</span>
            </div>
          `);
      });

      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
}
