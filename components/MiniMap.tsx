"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function FlyTo({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], zoom, { duration: 1.2 });
  }, [lat, lng, zoom, map]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  label: string;
  zoom?: number;
}

export default function MiniMap({ lat, lng, label, zoom = 7 }: Props) {
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
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FlyTo lat={lat} lng={lng} zoom={zoom} />
      <CircleMarker
        center={[lat, lng]}
        radius={10}
        pathOptions={{ color: "#6366f1", fillColor: "#6366f1", fillOpacity: 0.9, weight: 3 }}
      >
        <Popup>{label}</Popup>
      </CircleMarker>
    </MapContainer>
  );
}
