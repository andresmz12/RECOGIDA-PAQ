"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/lib/i18n-context";

interface Discount {
  id: string;
  code: string;
  percent: number;
  active: boolean;
  createdAt: string;
}

export default function DescuentosPage() {
  const { data: session, status } = useSession();
  const { lang } = useT();
  const router = useRouter();

  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newPercent, setNewPercent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const role = (session?.user as any)?.role;
  const en = lang === "en";

  useEffect(() => {
    if (status === "loading") return;
    if (role !== "ADMIN") { router.replace("/dashboard"); return; }
    fetch("/api/admin/discounts")
      .then(r => r.json())
      .then(d => { setDiscounts(d.discounts ?? []); setLoading(false); });
  }, [status, role, router]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newCode.trim() || !newPercent) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode.trim(), percent: newPercent }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || (en ? "Could not create" : "No se pudo crear")); return; }
      setDiscounts(prev => [data.discount, ...prev]);
      setNewCode("");
      setNewPercent("");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (d: Discount) => {
    const res = await fetch(`/api/admin/discounts/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !d.active }),
    });
    if (res.ok) {
      const { discount } = await res.json();
      setDiscounts(prev => prev.map(x => x.id === d.id ? discount : x));
    }
  };

  const remove = async (d: Discount) => {
    const msg = en
      ? `Delete the code "${d.code}"? Customers will no longer be able to use it.`
      : `¿Eliminar el código "${d.code}"? Los clientes ya no podrán usarlo.`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/admin/discounts/${d.id}`, { method: "DELETE" });
    if (res.ok) setDiscounts(prev => prev.filter(x => x.id !== d.id));
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {en ? "Discount Codes" : "Códigos de Descuento"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {en
              ? "Create codes that customers can enter on the pickup form to get a percentage off."
              : "Crea códigos que los clientes pueden ingresar en el formulario de recogida para obtener un porcentaje de descuento."}
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={create} className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-xs">
          <h2 className="font-semibold text-slate-900 text-sm mb-4">
            {en ? "New code" : "Nuevo código"}
          </h2>
          {error && (
            <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {en ? "Code name" : "Nombre del código"}
              </label>
              <input
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                maxLength={40}
                className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {en ? "Discount %" : "% de descuento"}
              </label>
              <div className="relative">
                <input
                  type="number" min="1" max="100" step="1"
                  value={newPercent}
                  onChange={e => setNewPercent(e.target.value)}
                  className="w-28 px-3 py-2 pr-7 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {saving ? (en ? "Creating..." : "Creando...") : (en ? "Create code" : "Crear código")}
            </button>
          </div>
        </form>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : discounts.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-sm text-slate-400">
            {en ? "No discount codes yet." : "Aún no hay códigos de descuento."}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {en ? "Code" : "Código"}
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {en ? "Discount" : "Descuento"}
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {en ? "Status" : "Estado"}
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {en ? "Actions" : "Acciones"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-semibold text-slate-900 text-sm">{d.code}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold">
                        −{d.percent}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggle(d)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          d.active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {d.active ? (en ? "Active" : "Activo") : (en ? "Inactive" : "Inactivo")}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => remove(d)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold transition-colors"
                      >
                        {en ? "Delete" : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4">
          {en
            ? "Click the status pill to enable/disable a code without deleting it."
            : "Haz clic en el estado para activar/desactivar un código sin eliminarlo."}
        </p>
      </div>
    </DashboardLayout>
  );
}
