"use client";

import { useEffect, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [lat, lng, zoom, map]);
  return null;
}

function MapCenterTracker({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onChange(c.lat, c.lng);
    };
    map.on("moveend", handler);
    return () => { map.off("moveend", handler); };
  }, [map, onChange]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
  editable?: boolean;
  onCenterChange?: (lat: number, lng: number) => void;
}

export default function MiniMap({ lat, lng, label, zoom = 7, editable = false, onCenterChange }: Props) {
  const handleCenterChange = useCallback(
    (newLat: number, newLng: number) => onCenterChange?.(newLat, newLng),
    [onCenterChange]
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
      zoomControl={editable}
      scrollWheelZoom={editable}
      dragging={editable}
      doubleClickZoom={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <FlyTo lat={lat} lng={lng} zoom={zoom} />
      {editable ? (
        <MapCenterTracker onChange={handleCenterChange} />
      ) : (
        <CircleMarker
          center={[lat, lng]}
          radius={10}
          pathOptions={{ color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.9, weight: 3 }}
        >
          <Popup>{label}</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
