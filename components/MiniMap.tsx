"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 7, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  lat: number;
  lng: number;
  label: string;
}

export default function MiniMap({ lat, lng, label }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={7}
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
      <FlyTo lat={lat} lng={lng} />
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
