"use client";

import { useState, useRef, useEffect } from "react";

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

function parseFeature(f: any): Suggestion | null {
  const p = f.properties ?? {};
  const [lng, lat] = f.geometry?.coordinates ?? [0, 0];
  if (!lat || !lng) return null;

  const parts: string[] = [];
  if (p.housenumber) parts.push(p.housenumber);
  if (p.street) parts.push(p.street);
  const address = parts.join(" ") || p.name || "";

  const city = p.city || p.town || p.village || p.county || "";
  const state = p.state || "";
  const country = p.country || "";
  const postcode = p.postcode || "";

  const labelParts = [address || p.name, city, state, country].filter(Boolean);
  const label = labelParts.join(", ");

  return { label, address: address || p.name || "", city, state, postcode, country, lat, lng };
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
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`;
        if (countryCode) url += `&countrycodes=${countryCode}`;

        const res = await fetch(url, {
          headers: { "User-Agent": "OGloboCargo/1.0" },
        });
        const data = await res.json();
        const parsed = (data.features ?? [])
          .map(parseFeature)
          .filter((s: Suggestion | null): s is Suggestion => s !== null && Boolean(s.label));
        setSuggestions(parsed);
        setOpen(parsed.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 350);
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
