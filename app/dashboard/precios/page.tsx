"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/lib/i18n-context";

const COUNTRIES = [
  { code: "HN", name: "Honduras" },
  { code: "GT", name: "Guatemala" },
  { code: "SV", name: "El Salvador" },
  { code: "NI", name: "Nicaragua" },
  { code: "DO", name: "República Dominicana" },
  { code: "PA", name: "Panamá" },
  { code: "CR", name: "Costa Rica" },
  { code: "VE", name: "Venezuela" },
  { code: "MX", name: "México" },
  { code: "CO", name: "Colombia" },
];

const BOX_SIZES = [
  { value: "Documento",      label: "Documento" },
  { value: "Caja 18x18x18", label: "Caja 18×18×18" },
  { value: "Caja 20x20x20", label: "Caja 20×20×20" },
  { value: "Caja 22x22x22", label: "Caja 22×22×22" },
  { value: "Caja 24x24x24", label: "Caja 24×24×24" },
];

interface PricingRule {
  id: string;
  country: string;
  packageType: string;
  basePrice: number;
  weightThreshold: number;
  weightRate: number;
}

type PriceMap = Record<string, Record<string, PricingRule>>;

export default function PreciosPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const router = useRouter();

  const [priceMap, setPriceMap] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // "country:packageType"
  const [saved, setSaved] = useState<string | null>(null);
  const [globalThreshold, setGlobalThreshold] = useState("20");
  const [globalRate, setGlobalRate] = useState("1.00");

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (role !== "ADMIN") { router.replace("/dashboard"); return; }
    fetch("/api/pricing")
      .then(r => r.json())
      .then(d => {
        const map: PriceMap = {};
        for (const rule of d.pricing ?? []) {
          if (!map[rule.country]) map[rule.country] = {};
          map[rule.country][rule.packageType] = rule;
        }
        setPriceMap(map);
        setLoading(false);
      });
  }, [status, role]);

  const getPrice = (country: string, pkg: string) =>
    priceMap[country]?.[pkg]?.basePrice ?? null;

  const save = useCallback(async (
    country: string, packageType: string, basePrice: string
  ) => {
    const parsed = parseFloat(basePrice);
    if (isNaN(parsed) || parsed < 0) return;
    const key = `${country}:${packageType}`;
    setSaving(key);
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country, packageType, basePrice: parsed,
          weightThreshold: parseFloat(globalThreshold) || 20,
          weightRate: parseFloat(globalRate) || 1.0,
        }),
      });
      if (res.ok) {
        const { rule } = await res.json();
        setPriceMap(prev => ({
          ...prev,
          [country]: { ...(prev[country] ?? {}), [packageType]: rule },
        }));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } finally {
      setSaving(null);
    }
  }, [globalThreshold, globalRate]);

  const saveAll = async () => {
    // Save all currently set prices with updated threshold/rate
    const entries: Array<[string, string, number]> = [];
    for (const [country, pkgs] of Object.entries(priceMap)) {
      for (const [pkg, rule] of Object.entries(pkgs)) {
        entries.push([country, pkg, rule.basePrice]);
      }
    }
    for (const [country, pkg, price] of entries) {
      await save(country, pkg, String(price));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {lang === "en" ? "Pricing by Country" : "Precios por País"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {lang === "en"
                ? "Set the base price per box size for each destination country. Click a cell to edit."
                : "Define el precio base por tamaño de caja para cada país destino. Haz clic en una celda para editar."}
            </p>
          </div>
        </div>

        {/* Global weight settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-xs">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">
            {lang === "en" ? "Weight surcharge settings (applied to all rules on save)" : "Configuración de sobrecargo por peso (se aplica a todas las reglas al guardar)"}
          </h2>
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {lang === "en" ? "Weight included in base (lbs)" : "Peso incluido en precio base (lbs)"}
              </label>
              <input
                type="number" min="0" step="1"
                value={globalThreshold}
                onChange={e => setGlobalThreshold(e.target.value)}
                className="w-32 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {lang === "en" ? "Rate per extra lb (USD)" : "Tarifa por lb adicional (USD)"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number" min="0" step="0.1"
                  value={globalRate}
                  onChange={e => setGlobalRate(e.target.value)}
                  className="w-32 pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={saveAll}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {lang === "en" ? "Apply to all" : "Aplicar a todos"}
            </button>
          </div>
        </div>

        {/* Price matrix */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">
                      {lang === "en" ? "Country" : "País"}
                    </th>
                    {BOX_SIZES.map(b => (
                      <th key={b.value} className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {b.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COUNTRIES.map(c => (
                    <tr key={c.code} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                          <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                        </div>
                      </td>
                      {BOX_SIZES.map(b => {
                        const key = `${c.code}:${b.value}`;
                        const current = getPrice(c.code, b.value);
                        const isSaving = saving === key;
                        const isDone = saved === key;
                        return (
                          <td key={b.value} className="px-4 py-3 text-center">
                            <PriceCell
                              key={key}
                              initialValue={current}
                              saving={isSaving}
                              saved={isDone}
                              onSave={(val) => save(c.code, b.value, val)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4">
          {lang === "en"
            ? "Prices in USD. Empty cells mean no price is configured for that combination."
            : "Precios en USD. Las celdas vacías indican que no hay precio configurado para esa combinación."}
        </p>
      </div>
    </DashboardLayout>
  );
}

function PriceCell({ initialValue, saving, saved, onSave }: {
  initialValue: number | null;
  saving: boolean;
  saved: boolean;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue != null ? String(initialValue) : "");

  // Sync when parent updates (e.g. after save)
  useEffect(() => {
    if (!editing) setValue(initialValue != null ? String(initialValue) : "");
  }, [initialValue, editing]);

  const commit = () => {
    setEditing(false);
    if (value.trim() !== "") onSave(value);
  };

  if (saving) {
    return (
      <div className="flex items-center justify-center h-9">
        <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex items-center justify-center h-9 text-emerald-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-slate-400 text-sm">$</span>
        <input
          autoFocus
          type="number"
          min="0"
          step="0.5"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
          className="w-20 px-2 py-1 border-2 border-indigo-400 rounded-lg text-sm text-center focus:outline-none"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group w-full h-9 flex items-center justify-center rounded-lg transition-colors ${
        value
          ? "hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200"
          : "hover:bg-slate-100 border border-dashed border-slate-200"
      }`}
    >
      {value ? (
        <span className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
          ${parseFloat(value).toFixed(2)}
        </span>
      ) : (
        <span className="text-slate-300 text-xs group-hover:text-slate-400">
          —
        </span>
      )}
    </button>
  );
}
