"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/lib/i18n-context";

interface CaseItem {
  id: string;
  pickupRequestId: string;
  type: string;
  status: string;
  description: string;
  resolutionNotes: string | null;
  createdByName: string;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  pickupRequest: { trackingCode: string; contactName: string; pickupCity: string };
}

const STATUS_TABS = ["OPEN", "IN_PROGRESS", "RESOLVED", ""] as const;
const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

export default function CasosPage() {
  const { data: session, status } = useSession();
  const { t } = useT();
  const router = useRouter();

  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [resolutionDraft, setResolutionDraft] = useState<Record<string, string>>({});

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!["ADMIN", "DISPATCHER"].includes(role)) { router.replace("/dashboard"); return; }
  }, [status, role, router]);

  const load = async () => {
    setLoading(true);
    const url = statusFilter ? `/api/cases?status=${statusFilter}` : "/api/cases";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setCases(data.cases ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!["ADMIN", "DISPATCHER"].includes(role)) return;
    load();
  }, [role, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateCase = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900">{t("casos.title")}</h1>
        <p className="text-slate-500 text-sm mt-0.5 mb-5">{t("casos.subtitle")}</p>

        <div className="flex gap-2 mb-5 flex-wrap">
          {STATUS_TABS.map(s => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {s ? t(`casos.status_${s}`) : t("common.all")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-400 text-sm">{t("casos.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map(c => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{t(`detail.caseType_${c.type}`)}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                        {t(`casos.status_${c.status}`)}
                      </span>
                    </div>
                    <Link href={`/dashboard/solicitudes/${c.pickupRequestId}`} className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                      {c.pickupRequest?.trackingCode} · {c.customer?.name} ({c.customer?.email})
                    </Link>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mb-3">{c.description}</p>

                {c.resolutionNotes && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                    {c.resolutionNotes}
                  </p>
                )}

                {c.status !== "RESOLVED" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {c.status === "OPEN" && (
                      <button
                        onClick={() => updateCase(c.id, { status: "IN_PROGRESS" })}
                        className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        {t("detail.caseMarkInProgress")}
                      </button>
                    )}
                    <input
                      value={resolutionDraft[c.id] ?? ""}
                      onChange={e => setResolutionDraft(prev => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder={t("casos.resolutionPlaceholder")}
                      className="flex-1 min-w-[180px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => updateCase(c.id, { status: "RESOLVED", resolutionNotes: resolutionDraft[c.id] ?? "" })}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      {t("detail.caseMarkResolved")}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">{t("casos.resolvedBy", { name: c.createdByName })}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
