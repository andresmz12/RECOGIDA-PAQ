"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { GEO_DATA } from "@/lib/geo-data";

const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
      <span className="text-slate-400 text-sm">Cargando mapa...</span>
    </div>
  ),
});

interface LocationValue {
  country: string;
  department: string;
  city: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-white";

const COUNTRIES = Object.entries(GEO_DATA).map(([code, d]) => ({
  code,
  name: d.name,
  flag: d.flag,
}));

export default function LocationPicker({ value, onChange }: Props) {
  const countryData = GEO_DATA[value.country];
  const departments = countryData?.departments ?? [];
  const selectedDept = departments.find((d) => d.name === value.department);

  const [cityCoords, setCityCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset city coords whenever country or department changes
  useEffect(() => {
    setCityCoords(null);
  }, [value.country, value.department]);

  // Geocode city with debounce when city text changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.city.trim() || !value.department || !countryData) {
      setCityCoords(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const q = encodeURIComponent(`${value.city}, ${value.department}, ${countryData.name}`);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0`,
          { headers: { "User-Agent": "OGloboCargo/1.0 contact@oglobocargo.com" } }
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]) {
          setCityCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setCityCoords(null);
        }
      } catch {
        setCityCoords(null);
      } finally {
        setGeocoding(false);
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value.city, value.department, value.country]);

  const setCountry = (country: string) =>
    onChange({ country, department: "", city: "" });

  const setDept = (department: string) =>
    onChange({ ...value, department, city: "" });

  const setCity = (city: string) =>
    onChange({ ...value, city });

  const mapCoords = cityCoords ?? (selectedDept ? { lat: selectedDept.lat, lng: selectedDept.lng } : null);
  const mapZoom = cityCoords ? 13 : 7;
  const mapLabel = cityCoords
    ? `${value.city}, ${value.department}`
    : selectedDept
    ? `${value.department}, ${countryData?.name}`
    : "";

  return (
    <div className="space-y-4">
      {/* Country */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          País destino <span className="text-red-500">*</span>
        </label>
        <select
          value={value.country}
          onChange={(e) => setCountry(e.target.value)}
          required
          className={inputCls}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag}  {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          {value.country === "MX" ? "Estado" : "Departamento / Provincia"}{" "}
          <span className="text-red-500">*</span>
        </label>
        <select
          value={value.department}
          onChange={(e) => setDept(e.target.value)}
          required
          className={inputCls}
          disabled={!value.country}
        >
          <option value="">— Selecciona —</option>
          {departments.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Ciudad <span className="text-red-500">*</span>
          {geocoding && (
            <span className="ml-2 text-indigo-500 text-xs font-normal animate-pulse">
              buscando...
            </span>
          )}
        </label>
        <input
          type="text"
          value={value.city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={selectedDept ? `Ciudad en ${value.department}...` : "Selecciona departamento primero"}
          required
          disabled={!value.department}
          className={inputCls}
        />
        {cityCoords && value.city && (
          <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Ubicación encontrada en el mapa
          </p>
        )}
      </div>

      {/* Map */}
      {mapCoords ? (
        <div
          className="overflow-hidden rounded-xl border-2 border-indigo-100 shadow-sm"
          style={{ height: 220 }}
        >
          <div className="relative h-full">
            <MiniMap
              lat={mapCoords.lat}
              lng={mapCoords.lng}
              zoom={mapZoom}
              label={mapLabel}
            />
            {/* Overlay badge */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm pointer-events-none">
              {cityCoords && value.city ? (
                <>
                  <p className="text-xs font-bold text-slate-800">
                    {countryData?.flag} {value.city}
                  </p>
                  <p className="text-xs text-slate-500">
                    {value.department}, {countryData?.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-slate-800">
                    {countryData?.flag} {value.department}
                  </p>
                  <p className="text-xs text-slate-500">{countryData?.name}</p>
                </>
              )}
            </div>
            {/* Attribution */}
            <div className="absolute bottom-2 right-2 z-[1000] text-[10px] text-slate-400 pointer-events-none">
              © OpenStreetMap
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[220px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400">
          <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm font-medium">Selecciona el departamento</p>
          <p className="text-xs">para ver la ubicación en el mapa</p>
        </div>
      )}
    </div>
  );
}
