"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n-context";
import { pickupDateKey } from "@/lib/utils";

interface Pickup {
  id: string;
  trackingCode: string;
  status: string;
  contactName: string;
  pickupCity: string;
  pickupState: string;
  preferredDate: string;
  preferredTimeWindow: string;
  assignedCourier?: { name: string } | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  ASSIGNED: "bg-blue-100 text-blue-800 border-blue-200",
  SCHEDULED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  EN_CAMINO: "bg-violet-100 text-violet-800 border-violet-200",
  PICKED_UP: "bg-emerald-100 text-emerald-800 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export default function CalendarioPage() {
  const { data: session } = useSession();
  const { t } = useT();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const from = new Date(year, month, 1).toISOString();
    const to = new Date(year, month + 1, 0).toISOString();
    setLoading(true);
    fetch(`/api/pickup-requests?limit=500&dateFrom=${from}&dateTo=${to}`)
      .then(r => r.json())
      .then(d => setPickups(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [viewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay: Record<string, Pickup[]> = {};
  pickups.forEach(p => {
    const key = pickupDateKey(p.preferredDate);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(p);
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectedKey = selected;
  const selectedPickups = selectedKey ? (byDay[selectedKey] ?? []) : [];
  const todayKey = today.toLocaleDateString("en-CA");

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{t("cal.title")}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{t("cal.subtitle")}</p>
          </div>
          <Link
            href="/dashboard/solicitudes"
            className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            {t("cal.listView")}
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="font-bold text-slate-900 text-lg">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">{t("common.loading")}</div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} className="border-b border-r border-slate-50 h-20" />;
                  const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayPickups = byDay[key] ?? [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedKey;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(isSelected ? null : key)}
                      className={`border-b border-r border-slate-100 h-20 p-1.5 text-left transition-colors hover:bg-indigo-50/50 ${
                        isSelected ? "bg-indigo-50 border-indigo-200" : ""
                      }`}
                    >
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        isToday ? "bg-indigo-600 text-white" : "text-slate-700"
                      }`}>{day}</span>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayPickups.slice(0, 2).map(p => (
                          <div key={p.id} className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border truncate ${STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                            {p.trackingCode.split("-")[1]}
                          </div>
                        ))}
                        {dayPickups.length > 2 && (
                          <p className="text-[10px] text-slate-400 pl-1">+{dayPickups.length - 2} more</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Legend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3">{t("cal.legend")}</h3>
              <div className="space-y-1.5">
                {Object.entries(STATUS_COLOR).map(([status, cls]) => (
                  <div key={status} className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded border ${cls}`} />
                    <span className="text-xs text-slate-600">{t(`status.${status}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected day pickups */}
            {selectedKey ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">
                    {new Date(selectedKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </h3>
                  <p className="text-slate-500 text-xs">{selectedPickups.length} pickup{selectedPickups.length !== 1 ? "s" : ""}</p>
                </div>
                {selectedPickups.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">{t("cal.noPickups")}</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {selectedPickups.map(p => (
                      <Link key={p.id} href={`/dashboard/solicitudes/${p.id}`} className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs font-bold text-indigo-600">{p.trackingCode}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">{p.contactName}</p>
                        <p className="text-xs text-slate-400">{p.pickupCity}, {p.pickupState} · {p.preferredTimeWindow}</p>
                        {p.assignedCourier && (
                          <p className="text-xs text-indigo-500 font-medium mt-0.5">{p.assignedCourier.name}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <svg className="w-8 h-8 text-slate-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400 text-sm">{t("cal.selectDay")}</p>
              </div>
            )}

            {/* Month summary */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 text-sm mb-3">{t("cal.monthSummary")}</h3>
              <div className="space-y-2">
                {[
                  { key: "PENDING", label: t("status.PENDING") },
                  { key: "ASSIGNED", label: t("status.ASSIGNED") },
                  { key: "SCHEDULED", label: t("status.SCHEDULED") },
                  { key: "EN_CAMINO", label: t("status.EN_CAMINO") },
                  { key: "PICKED_UP", label: t("status.PICKED_UP") },
                ].map(s => {
                  const count = pickups.filter(p => p.status === s.key).length;
                  return (
                    <div key={s.key} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">{s.label}</span>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                  );
                })}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Total</span>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{pickups.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
