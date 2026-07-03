"use client";

import { useState, useRef, useEffect } from "react";
import { US_STATES } from "@/lib/countries";

interface Suggestion {
  label: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (s: Suggestion) => void;
  placeholder?: string;
  countryCode?: string; // e.g. "us" to bias results
  className?: string;
  required?: boolean;
}

// Nominatim returns US states by full name ("Illinois"); the form selects
// expect the 2-letter code ("IL"), so normalize before handing it back.
function usStateCode(state: string): string {
  if (!state) return "";
  const upper = state.trim().toUpperCase();
  if (US_STATES.some((s) => s.code === upper)) return upper;
  const match = US_STATES.find((s) => s.name.toUpperCase() === upper);
  return match ? match.code : state;
}

function parseNominatim(r: any): Suggestion | null {
  if (!r.lat || !r.lon) return null;
  const a = r.address ?? {};

  const streetNum = a.house_number ?? "";
  const street = a.road ?? a.pedestrian ?? a.footway ?? "";
  const address = [streetNum, street].filter(Boolean).join(" ") || r.display_name?.split(",")[0] || "";

  const city = a.city || a.town || a.village || a.municipality || a.county || "";
  const country = a.country_code?.toUpperCase() || a.country || "";
  const rawState = a.state || "";
  const state = country === "US" ? usStateCode(rawState) : rawState;
  const postcode = a.postcode || "";

  const labelParts = [address, city, state, country].filter(Boolean);
  const label = labelParts.join(", ");

  return { label, address, city, state, postcode, country, lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar dirección...",
  countryCode,
  className = "",
  required,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange(q);
    setActiveIdx(-1);

    if (q.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        let url = `/api/geocode?q=${encodeURIComponent(q)}`;
        if (countryCode) url += `&country=${countryCode}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const parsed = (Array.isArray(data) ? data : [])
          .map(parseNominatim)
          .filter((s): s is Suggestion => s !== null && Boolean(s.address));
        setSuggestions(parsed);
        setOpen(parsed.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 400);
  };

  const pick = (s: Suggestion) => {
    onChange(s.address || s.label);
    onSelect(s);
    setSuggestions([]);
    setOpen(false);
    setActiveIdx(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      pick(suggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => search(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          className={className}
        />
        {/* search icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" title="Escribe tu dirección y selecciona una sugerencia para auto-llenar ciudad, estado y ZIP">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[2000] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => pick(s)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-start gap-3 ${
                  i === activeIdx ? "bg-indigo-50" : "hover:bg-slate-50"
                }`}
              >
                <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  <span className="font-semibold text-slate-900 block">
                    {s.address || s.label.split(",")[0]}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {[s.city, s.state, s.country].filter(Boolean).join(", ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
