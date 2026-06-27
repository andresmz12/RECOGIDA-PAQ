"use client";

import { useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Programmatically enables/disables dragging after MapContainer mounts
function MapControls({ editable }: { editable: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (editable) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
    } else {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
    }
  }, [editable, map]);
  return null;
}

// Flies to new coords whenever they change
function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  const prev = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  useEffect(() => {
    const p = prev.current;
    if (!p || p.lat !== lat || p.lng !== lng || p.zoom !== zoom) {
      map.flyTo([lat, lng], zoom, { duration: 1.0 });
      prev.current = { lat, lng, zoom };
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// Native Leaflet draggable marker (avoids react-leaflet default icon issues)
function DraggableMarker({
  lat,
  lng,
  onDragEnd,
}: {
  lat: number;
  lng: number;
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const icon = L.divIcon({
      html: `<div style="width:28px;height:28px;background:#1d4f86;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:grab;"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      className: "",
    });

    const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onDragEnd(pos.lat, pos.lng);
    });

    return () => {
      marker.remove();
      markerRef.current = null;
    };
    // Only mount once; lat/lng synced below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pin to new geocoded coords without unmounting
  useEffect(() => {
    markerRef.current?.setLatLng([lat, lng]);
  }, [lat, lng]);

  return null;
}

interface Props {
  lat: number;
  lng: number;
  zoom?: number;
  editable?: boolean;
  onPinMove?: (lat: number, lng: number) => void;
}

export default function MiniMap({ lat, lng, zoom = 7, editable = false, onPinMove }: Props) {
  const handleDragEnd = useCallback(
    (newLat: number, newLng: number) => onPinMove?.(newLat, newLng),
    [onPinMove]
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <FlyTo lat={lat} lng={lng} zoom={zoom} />
      <MapControls editable={editable} />
      {editable ? (
        <DraggableMarker lat={lat} lng={lng} onDragEnd={handleDragEnd} />
      ) : (
        <CircleMarker
          center={[lat, lng]}
          radius={10}
          pathOptions={{ color: "#1d4f86", fillColor: "#1d4f86", fillOpacity: 0.9, weight: 3 }}
        />
      )}
    </MapContainer>
  );
}
