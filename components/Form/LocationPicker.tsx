"use client";

import { GEO_DATA } from "@/lib/geo-data";

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

  const setCountry = (country: string) => onChange({ country, department: "", city: "" });
  const setDept = (department: string) => onChange({ ...value, department, city: "" });
  const setCity = (city: string) => onChange({ ...value, city });

  return (
    <div className="space-y-4">
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

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Ciudad <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={value.department ? `Ciudad en ${value.department}...` : "Selecciona departamento primero"}
          required
          disabled={!value.department}
          className={inputCls}
        />
      </div>
    </div>
  );
}
