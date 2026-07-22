"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/lib/i18n-context";
import { COUNTRY_SHIPPING_CONFIG, AIR_ITEM_TYPES, AIR_PER_LB_KEY } from "@/lib/shipping-modes";

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
  { code: "EC", name: "Ecuador" },
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
  shippingMode: string;
  packageType: string;
  basePrice: number;
  weightThreshold: number;
  weightRate: number;
  pricePerLb: number | null;
  minWeight: number | null;
  maxWeight: number | null;
}

// map[country][shippingMode][packageType] = rule
type PriceMap = Record<string, Record<string, Record<string, PricingRule>>>;

export default function PreciosPage() {
  const { data: session, status } = useSession();
  const { lang } = useT();
  const router = useRouter();

  const [priceMap, setPriceMap] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // "mode:country:packageType"
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
          if (!map[rule.country][rule.shippingMode]) map[rule.country][rule.shippingMode] = {};
          map[rule.country][rule.shippingMode][rule.packageType] = rule;
        }
        setPriceMap(map);
        setLoading(false);
      });
  }, [status, role]);

  const getRule = (country: string, mode: string, pkg: string) =>
    priceMap[country]?.[mode]?.[pkg] ?? null;

  const save = useCallback(async (
    country: string,
    shippingMode: string,
    packageType: string,
    fields: { basePrice?: string; pricePerLb?: string; minWeight?: string; maxWeight?: string }
  ) => {
    const key = `${shippingMode}:${country}:${packageType}`;
    setSaving(key);
    try {
      const res = await fetch("/api/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country, shippingMode, packageType,
          basePrice: fields.basePrice !== undefined ? fields.basePrice : undefined,
          pricePerLb: fields.pricePerLb !== undefined ? fields.pricePerLb : undefined,
          minWeight: fields.minWeight !== undefined ? fields.minWeight : undefined,
          maxWeight: fields.maxWeight !== undefined ? fields.maxWeight : undefined,
          weightThreshold: shippingMode === "MARITIME" ? (parseFloat(globalThreshold) || 20) : 0,
          weightRate: shippingMode === "MARITIME" ? (parseFloat(globalRate) || 1.0) : 0,
        }),
      });
      if (res.ok) {
        const { rule } = await res.json();
        setPriceMap(prev => ({
          ...prev,
          [country]: {
            ...(prev[country] ?? {}),
            [shippingMode]: { ...(prev[country]?.[shippingMode] ?? {}), [packageType]: rule },
          },
        }));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || (lang === "en" ? "Couldn't save. Try again." : "No se pudo guardar. Intenta de nuevo."));
        setTimeout(() => setSaveError(null), 6000);
      }
    } catch {
      setSaveError(lang === "en" ? "Couldn't save. Try again." : "No se pudo guardar. Intenta de nuevo.");
      setTimeout(() => setSaveError(null), 6000);
    } finally {
      setSaving(null);
    }
  }, [globalThreshold, globalRate, lang]);

  const saveAll = async () => {
    for (const [country, byMode] of Object.entries(priceMap)) {
      for (const [mode, pkgs] of Object.entries(byMode)) {
        if (mode !== "MARITIME") continue;
        for (const [pkg, rule] of Object.entries(pkgs)) {
          await save(country, mode, pkg, { basePrice: String(rule.basePrice) });
        }
      }
    }
  };

  const maritimeCountries = COUNTRIES.filter(c => COUNTRY_SHIPPING_CONFIG[c.code]?.maritime);
  const perLbCountries = COUNTRIES.filter(c => COUNTRY_SHIPPING_CONFIG[c.code]?.air === "PER_LB");
  const fixedItemCountries = COUNTRIES.filter(c => COUNTRY_SHIPPING_CONFIG[c.code]?.air === "FIXED_ITEM");

  return (
    <DashboardLayout>
      {saveError && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {saveError}
        </div>
      )}
      <div className="p-6 md:p-8 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {lang === "en" ? "Pricing by Country" : "Precios por País"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lang === "en"
              ? "Each country only shows the shipping modalities it actually supports."
              : "Cada país solo muestra las modalidades de envío que realmente tiene."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* ── Marítimo ── */}
            <section>
              <h2 className="font-bold text-slate-900 text-lg mb-1">
                {lang === "en" ? "Maritime (by box size)" : "Marítimo (por tamaño de caja)"}
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                {lang === "en" ? "Click a cell to edit." : "Haz clic en una celda para editar."}
              </p>

              <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-xs">
                <h3 className="font-semibold text-slate-900 text-sm mb-4">
                  {lang === "en" ? "Weight surcharge settings (applied to all maritime rules on \"Apply to all\")" : "Configuración de sobrecargo por peso (se aplica a todas las reglas marítimas con \"Aplicar a todos\")"}
                </h3>
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
                      {maritimeCountries.map(c => (
                        <tr key={c.code} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                              <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                            </div>
                          </td>
                          {BOX_SIZES.map(b => {
                            const key = `MARITIME:${c.code}:${b.value}`;
                            const rule = getRule(c.code, "MARITIME", b.value);
                            const isSaving = saving === key;
                            const isDone = saved === key;
                            return (
                              <td key={b.value} className="px-4 py-3 text-center">
                                <PriceCell
                                  key={key}
                                  initialValue={rule?.basePrice ?? null}
                                  saving={isSaving}
                                  saved={isDone}
                                  onSave={(val) => save(c.code, "MARITIME", b.value, { basePrice: val })}
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
            </section>

            {/* ── Aéreo por libra ── */}
            {perLbCountries.length > 0 && (
              <section>
                <h2 className="font-bold text-slate-900 text-lg mb-1">
                  {lang === "en" ? "Air — per pound" : "Aéreo — por libra"}
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  {lang === "en"
                    ? "The customer's declared weight is multiplied by this rate. Min/max define the customs-allowed weight range."
                    : "El peso declarado por el cliente se multiplica por esta tarifa. El mín/máx define el rango de peso permitido por aduana."}
                </p>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {lang === "en" ? "Country" : "País"}
                          </th>
                          <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {lang === "en" ? "Price per lb (USD)" : "Precio por libra (USD)"}
                          </th>
                          <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {lang === "en" ? "Min lbs" : "Libras mín."}
                          </th>
                          <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {lang === "en" ? "Max lbs" : "Libras máx."}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {perLbCountries.map(c => {
                          const cfg = COUNTRY_SHIPPING_CONFIG[c.code];
                          const rule = getRule(c.code, "AIR", AIR_PER_LB_KEY);
                          const key = `AIR:${c.code}:${AIR_PER_LB_KEY}`;
                          return (
                            <PerLbRow
                              key={c.code}
                              country={c}
                              rule={rule}
                              defaultMin={cfg.airWeightMin}
                              defaultMax={cfg.airWeightMax}
                              saving={saving === key}
                              saved={saved === key}
                              onSave={(fields) => save(c.code, "AIR", AIR_PER_LB_KEY, fields)}
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ── Aéreo con tarifa fija por artículo ── */}
            {fixedItemCountries.length > 0 && (
              <section>
                <h2 className="font-bold text-slate-900 text-lg mb-1">
                  {lang === "en" ? "Air — fixed price per item type" : "Aéreo — tarifa fija por tipo de artículo"}
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  {lang === "en"
                    ? "These countries don't charge by weight — each item type has its own flat price."
                    : "Estos países no cobran por peso — cada tipo de artículo tiene su propio precio fijo."}
                </p>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80">
                          <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-44">
                            {lang === "en" ? "Country" : "País"}
                          </th>
                          {AIR_ITEM_TYPES.map(item => (
                            <th key={item} className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              {item}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fixedItemCountries.map(c => (
                          <tr key={c.code} className="hover:bg-slate-50/40 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">{c.name}</span>
                                <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                              </div>
                            </td>
                            {AIR_ITEM_TYPES.map(item => {
                              const key = `AIR:${c.code}:${item}`;
                              const rule = getRule(c.code, "AIR", item);
                              return (
                                <td key={item} className="px-4 py-3 text-center">
                                  <PriceCell
                                    key={key}
                                    initialValue={rule?.basePrice ?? null}
                                    saving={saving === key}
                                    saved={saved === key}
                                    onSave={(val) => save(c.code, "AIR", item, { basePrice: val })}
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
              </section>
            )}
          </>
        )}

        <p className="text-xs text-slate-400">
          {lang === "en"
            ? "Prices in USD. Empty cells mean no price is configured for that combination."
            : "Precios en USD. Las celdas vacías indican que no hay precio configurado para esa combinación."}
        </p>
      </div>
    </DashboardLayout>
  );
}

function PerLbRow({ country, rule, defaultMin, defaultMax, saving, saved, onSave }: {
  country: { code: string; name: string };
  rule: PricingRule | null;
  defaultMin?: number;
  defaultMax?: number;
  saving: boolean;
  saved: boolean;
  onSave: (fields: { pricePerLb: string; minWeight: string; maxWeight: string }) => void;
}) {
  const { lang } = useT();
  const [rate, setRate] = useState(rule?.pricePerLb != null ? String(rule.pricePerLb) : "");
  const [min, setMin] = useState(rule?.minWeight != null ? String(rule.minWeight) : (defaultMin != null ? String(defaultMin) : ""));
  const [max, setMax] = useState(rule?.maxWeight != null ? String(rule.maxWeight) : (defaultMax != null ? String(defaultMax) : ""));
  // Keep local state in sync once the parent confirms a save, same as the
  // maritime table's cells — otherwise a slow network re-render could show
  // stale values after a successful save.
  useEffect(() => {
    if (saving) return;
    setRate(rule?.pricePerLb != null ? String(rule.pricePerLb) : "");
    setMin(rule?.minWeight != null ? String(rule.minWeight) : (defaultMin != null ? String(defaultMin) : ""));
    setMax(rule?.maxWeight != null ? String(rule.maxWeight) : (defaultMax != null ? String(defaultMax) : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule]);

  // Auto-save on blur, same as every other price table on this page — a
  // price typed here previously only persisted if the courier noticed and
  // clicked the small icon button, which was easy to miss entirely.
  const commit = () => {
    if (!rate.trim()) return;
    onSave({ pricePerLb: rate, minWeight: min, maxWeight: max });
  };

  return (
    <tr className="hover:bg-slate-50/40 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{country.name}</span>
          <span className="text-xs text-slate-400 font-mono">{country.code}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="relative inline-block">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
          <input
            type="number" min="0" step="0.01"
            value={rate}
            onChange={e => setRate(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-24 pl-5 pr-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <input
          type="number" min="0" step="1"
          value={min}
          onChange={e => setMin(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <input
            type="number" min="0" step="1"
            value={max}
            onChange={e => setMax(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={commit}
            disabled={saving || !rate}
            title={lang === "en" ? "Save" : "Guardar"}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 disabled:opacity-40 transition-colors"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : saved ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16v-2a4 4 0 00-4-4H9m0 0l3-3m-3 3l3 3m8 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </tr>
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
