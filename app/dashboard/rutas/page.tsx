"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";

interface Courier {
  id: string;
  name: string;
  phone: string | null;
  email: string;
}

interface RoutePickup {
  id: string;
  trackingCode: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string | null;
  pickupCountry: string;
  recipientName: string;
  recipientCity: string;
  recipientCountry: string;
  packageType: string;
  estimatedWeight: number | null;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string | null;
  status: string;
}

interface RouteData {
  courier: Courier;
  pickups: RoutePickup[];
  date: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente", ASSIGNED: "Asignado", SCHEDULED: "En camino",
  PICKED_UP: "Recogido", CANCELLED: "Cancelado",
};

export default function RutasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "authenticated" && role !== "ADMIN") router.push("/dashboard");
  }, [status, role, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/couriers")
      .then((r) => r.json())
      .then((d) => setCouriers(d.couriers ?? []))
      .finally(() => setFetching(false));
  }, [status]);

  const loadRoute = async () => {
    if (!selectedCourier || !selectedDate) return;
    setLoading(true);
    setError("");
    setRouteData(null);
    try {
      const res = await fetch(`/api/routes?courierId=${selectedCourier}&date=${selectedDate}`);
      if (!res.ok) { setError("Error al cargar la ruta"); return; }
      const data = await res.json();
      setRouteData(data);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <DashboardLayout>
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">📄</div>
                <h1 className="text-3xl font-black text-slate-900">Rutas por Courier</h1>
              </div>
              <p className="text-slate-600">Genera y descarga la hoja de ruta diaria de cada mensajero</p>
            </div>
            {routeData && (
              <button
                onClick={handlePrint}
                className="no-print flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-rose-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir / Descargar PDF
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="no-print bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-bold text-slate-700 mb-2">Courier / Mensajero</label>
                {fetching ? (
                  <div className="h-10 bg-slate-200 animate-pulse rounded-lg" />
                ) : (
                  <select
                    value={selectedCourier}
                    onChange={(e) => { setSelectedCourier(e.target.value); setRouteData(null); }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Seleccionar courier...</option>
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-bold text-slate-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setRouteData(null); }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={loadRoute}
                disabled={!selectedCourier || !selectedDate || loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : "🔍"} Cargar ruta
              </button>
            </div>
          </div>

          {error && (
            <div className="no-print bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 font-medium mb-6">{error}</div>
          )}

          {/* Route Result — this section prints */}
          {routeData && (
            <div id="print-area">
              {/* Print header */}
              <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-black text-slate-900">O&apos;Globo Cargo</p>
                    <p className="text-slate-500 text-sm">Hoja de Ruta Diaria</p>
                  </div>
                  <p className="text-slate-400 text-xs">Generado: {new Date().toLocaleString("es-ES")}</p>
                </div>
              </div>

              {/* Route header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 mb-6 text-white print:bg-slate-100 print:text-slate-900 print:rounded-none print:p-4 print:border print:border-slate-300">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1 print:text-slate-500">Courier</p>
                    <p className="text-2xl font-black mb-1">{routeData.courier.name}</p>
                    {routeData.courier.phone && (
                      <p className="text-white/80 text-sm print:text-slate-600">📞 {routeData.courier.phone}</p>
                    )}
                    <p className="text-white/70 text-xs mt-1 print:text-slate-500">{routeData.courier.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1 print:text-slate-500">Fecha</p>
                    <p className="text-2xl font-black">
                      {new Date(routeData.date + "T12:00:00").toLocaleDateString("es-ES", {
                        weekday: "long", day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="text-white/80 text-sm mt-1 print:text-slate-600">
                      {routeData.pickups.length} parada{routeData.pickups.length !== 1 ? "s" : ""} asignada{routeData.pickups.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {routeData.pickups.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <div className="text-5xl mb-4 opacity-40">📭</div>
                  <p className="font-bold text-slate-700 text-lg">Sin recogidas asignadas</p>
                  <p className="text-slate-500 text-sm mt-1">No hay solicitudes para este courier en esta fecha</p>
                </div>
              ) : (
                <>
                  {/* Screen view — cards */}
                  <div className="space-y-4 print:hidden">
                    {routeData.pickups.map((p, i) => (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <p className="font-mono font-black text-indigo-600">{p.trackingCode}</p>
                              <StatusBadge status={p.status} />
                              <span className="text-slate-400 text-sm">⏰ {p.preferredTimeWindow}</span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Remitente</p>
                                <p className="font-semibold text-slate-900">{p.contactName}</p>
                                <p className="text-slate-600 text-sm">{p.contactPhone}</p>
                                <p className="text-slate-500 text-sm">{p.pickupAddress}</p>
                                <p className="text-slate-500 text-sm">{p.pickupCity}{p.pickupState ? `, ${p.pickupState}` : ""}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Destinatario</p>
                                <p className="font-semibold text-slate-900">{p.recipientName}</p>
                                <p className="text-slate-500 text-sm">{p.recipientCity}, {p.recipientCountry}</p>
                                <p className="text-slate-500 text-sm">{p.packageType}{p.estimatedWeight ? ` · ${p.estimatedWeight} kg` : ""}</p>
                              </div>
                            </div>
                            {p.specialInstructions && (
                              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                <p className="text-xs font-bold text-amber-700 mb-0.5">⚠️ Instrucciones</p>
                                <p className="text-amber-800 text-sm">{p.specialInstructions}</p>
                              </div>
                            )}
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${p.pickupAddress}, ${p.pickupCity}`)}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            🗺️ Maps
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Print view — table */}
                  <div className="hidden print:block">
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #cbd5e1" }}>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>#</th>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>Código</th>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>Remitente</th>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>Dirección de recogida</th>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>Destinatario</th>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>Horario</th>
                          <th style={{ padding: "8px 6px", textAlign: "left", fontWeight: 700, color: "#475569", textTransform: "uppercase", fontSize: "10px" }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routeData.pickups.map((p, i) => (
                          <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                            <td style={{ padding: "8px 6px", fontWeight: 700, color: "#6366f1" }}>{i + 1}</td>
                            <td style={{ padding: "8px 6px", fontFamily: "monospace", fontWeight: 700, color: "#4338ca", fontSize: "11px" }}>{p.trackingCode}</td>
                            <td style={{ padding: "8px 6px" }}>
                              <div style={{ fontWeight: 600 }}>{p.contactName}</div>
                              <div style={{ color: "#64748b", fontSize: "10px" }}>{p.contactPhone}</div>
                            </td>
                            <td style={{ padding: "8px 6px" }}>
                              <div>{p.pickupAddress}</div>
                              <div style={{ color: "#64748b", fontSize: "10px" }}>{p.pickupCity}{p.pickupState ? `, ${p.pickupState}` : ""}</div>
                              {p.specialInstructions && (
                                <div style={{ color: "#b45309", fontSize: "10px", marginTop: "2px" }}>⚠️ {p.specialInstructions}</div>
                              )}
                            </td>
                            <td style={{ padding: "8px 6px" }}>
                              <div style={{ fontWeight: 600 }}>{p.recipientName}</div>
                              <div style={{ color: "#64748b", fontSize: "10px" }}>{p.recipientCity}, {p.recipientCountry}</div>
                              <div style={{ color: "#64748b", fontSize: "10px" }}>{p.packageType}{p.estimatedWeight ? ` · ${p.estimatedWeight}kg` : ""}</div>
                            </td>
                            <td style={{ padding: "8px 6px", whiteSpace: "nowrap", fontSize: "11px" }}>{p.preferredTimeWindow}</td>
                            <td style={{ padding: "8px 6px" }}>
                              <span style={{
                                padding: "2px 8px", borderRadius: "99px", fontWeight: 600, fontSize: "10px",
                                background: p.status === "PICKED_UP" ? "#d1fae5" : p.status === "ASSIGNED" ? "#dbeafe" : p.status === "SCHEDULED" ? "#ede9fe" : "#fef3c7",
                                color: p.status === "PICKED_UP" ? "#065f46" : p.status === "ASSIGNED" ? "#1e40af" : p.status === "SCHEDULED" ? "#5b21b6" : "#92400e",
                              }}>
                                {STATUS_LABELS[p.status] ?? p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Print footer */}
                    <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
                      <span>O&apos;Globo Cargo — Confidencial</span>
                      <span>Total: {routeData.pickups.length} paradas</span>
                      <span>Generado: {new Date().toLocaleString("es-ES")}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!routeData && !loading && !error && (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center">
              <div className="text-5xl mb-4 opacity-40">📄</div>
              <p className="font-bold text-slate-700 text-lg mb-1">Selecciona un courier y fecha</p>
              <p className="text-slate-400 text-sm">Podrás ver su ruta del día e imprimirla como PDF</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
