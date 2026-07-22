"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { useT } from "@/lib/i18n-context";
import { formatPickupDate } from "@/lib/utils";

interface Courier {
  id: string;
  name: string;
}

interface PickupDetail {
  id: string;
  trackingCode: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string | null;
  pickupPostalCode: string | null;
  pickupCountry: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhoneSecondary: string | null;
  recipientEmail: string | null;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string | null;
  recipientPostalCode: string | null;
  recipientCountry: string;
  destinationCountry: string;
  packageType: string;
  estimatedWeight: number | null;
  dimensions: string | null;
  packageContents: string | null;
  declaredValue: number | null;
  insuranceRequested: boolean;
  insuranceValue: number | null;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions: string | null;
  notes: string | null;
  status: string;
  user?: { id: string } | null;
  assignedCourier?: { id: string; name: string } | null;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    createdAt: string;
    notes: string | null;
  }>;
}

const STATUS_OPTIONS = ["PENDING", "ASSIGNED", "SCHEDULED", "EN_CAMINO", "PICKED_UP", "CANCELLED"];

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

function InternalComments({ pickupId }: { pickupId: string }) {
  const { t } = useT();
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    fetch(`/api/comments?pickupRequestId=${pickupId}`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []));

  useEffect(() => { load(); }, [pickupId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickupRequestId: pickupId, body }),
    });
    setBody("");
    await load();
    setSending(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    load();
  };

  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  return (
    <Card variant="default" padding="lg">
      <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {t("detail.internalComments")}
      </h2>
      {comments.length === 0 ? (
        <p className="text-slate-400 text-sm mb-4">{t("detail.noComments")}</p>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map(c => (
            <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{c.authorName}</span>
                  <span className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-full">{c.authorRole}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {(c.authorId === userId || role === "ADMIN") && (
                    <button onClick={() => remove(c.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700">{c.body}</p>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={t("detail.commentPlaceholder")}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {t("detail.commentSend")}
        </button>
      </form>
    </Card>
  );
}

const CASE_TYPES = ["LOST", "DAMAGED", "DELAYED", "WRONG_ITEM", "NOT_HOME", "OTHER"] as const;
const CASE_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-emerald-100 text-emerald-700",
};

interface CaseNoteItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface CaseItem {
  id: string;
  type: string;
  status: string;
  description: string;
  resolutionNotes: string | null;
  createdByName: string;
  createdAt: string;
  notes: CaseNoteItem[];
}

function CasesSection({ pickupId }: { pickupId: string }) {
  const { t } = useT();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [caseType, setCaseType] = useState<string>("LOST");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [addingNote, setAddingNote] = useState<string | null>(null);

  const load = () =>
    fetch(`/api/cases?pickupRequestId=${pickupId}`)
      .then(r => r.json())
      .then(d => setCases(d.cases ?? []));

  useEffect(() => { load(); }, [pickupId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupRequestId: pickupId, type: caseType, description }),
      });
      if (res.ok) {
        setDescription("");
        setShowForm(false);
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || t("detail.caseCreateError"));
      }
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const addNote = async (caseId: string) => {
    const body = (noteDraft[caseId] ?? "").trim();
    if (!body) return;
    setAddingNote(caseId);
    try {
      const res = await fetch(`/api/cases/${caseId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setNoteDraft(prev => ({ ...prev, [caseId]: "" }));
        await load();
      }
    } finally {
      setAddingNote(null);
    }
  };

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {t("detail.casesTitle")}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            {t("detail.caseOpenNew")}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("detail.caseType")}</label>
            <select
              value={caseType}
              onChange={e => setCaseType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CASE_TYPES.map(ct => (
                <option key={ct} value={ct}>{t(`detail.caseType_${ct}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t("detail.caseDescription")}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={sending || !description.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {sending ? t("common.loading") : t("detail.caseSubmit")}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(""); }}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-semibold"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {cases.length === 0 ? (
        <p className="text-slate-400 text-sm">{t("detail.noCases")}</p>
      ) : (
        <div className="space-y-3">
          {cases.map(c => (
            <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{t(`detail.caseType_${c.type}`)}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CASE_STATUS_COLORS[c.status]}`}>
                    {t(`detail.caseStatus_${c.status}`)}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-2">{c.description}</p>
              {c.resolutionNotes && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 mb-2">
                  {c.resolutionNotes}
                </p>
              )}

              {/* Running notes log */}
              <div className="border-t border-slate-200 pt-2 mb-2">
                {c.notes.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {c.notes.map(n => (
                      <div key={n.id} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-slate-600 text-[11px]">{n.authorName}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{n.body}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={noteDraft[c.id] ?? ""}
                    onChange={e => setNoteDraft(prev => ({ ...prev, [c.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addNote(c.id); } }}
                    placeholder={t("casos.addNotePlaceholder")}
                    className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => addNote(c.id)}
                    disabled={addingNote === c.id || !(noteDraft[c.id] ?? "").trim()}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg transition-colors"
                  >
                    {t("casos.addNoteBtn")}
                  </button>
                </div>
              </div>

              {c.status !== "RESOLVED" && (
                <div className="flex gap-2">
                  {c.status === "OPEN" && (
                    <button onClick={() => updateStatus(c.id, "IN_PROGRESS")} className="text-xs font-semibold text-amber-700 hover:underline">
                      {t("detail.caseMarkInProgress")}
                    </button>
                  )}
                  <button onClick={() => updateStatus(c.id, "RESOLVED")} className="text-xs font-semibold text-emerald-700 hover:underline">
                    {t("detail.caseMarkResolved")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const TIME_WINDOWS = [
  { value: "Morning (8am - 12pm)", key: "twMorning" },
  { value: "Afternoon (12pm - 5pm)", key: "twAfternoon" },
  { value: "Evening (5pm - 9pm)", key: "twEvening" },
  { value: "All day (8am - 9pm)", key: "twAllDay" },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-slate-900 font-medium">{value || <span className="text-slate-300">—</span>}</p>
    </div>
  );
}

export default function SolicitudDetailPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = lang === "en" ? "en-US" : "es-CO";

  const [pickup, setPickup] = useState<PickupDetail | null>(null);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [newCourierId, setNewCourierId] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTimeWindow, setNewTimeWindow] = useState("");
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState("");

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status !== "authenticated" || !id) return;
    const load = async () => {
      const [pickupRes, couriersRes] = await Promise.all([
        fetch(`/api/pickup-requests/${id}`),
        ["ADMIN", "DISPATCHER"].includes(role)
          ? fetch("/api/couriers")
          : Promise.resolve(null),
      ]);
      if (!pickupRes.ok) { router.push("/dashboard/solicitudes"); return; }
      const data = await pickupRes.json();
      setPickup(data);
      setNewStatus(data.status);
      setNewCourierId(data.assignedCourier?.id ?? "");
      setNewDate(data.preferredDate ? new Date(data.preferredDate).toISOString().split("T")[0] : "");
      setNewTimeWindow(data.preferredTimeWindow ?? "");

      if (couriersRes) {
        const ud = await couriersRes.json();
        setCouriers(ud.couriers ?? []);
      }
      setLoading(false);
    };
    load();
  }, [status, id, role, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup) return;
    setUpdating(true);
    try {
      const body: any = { status: newStatus };
      if (notes) body.notes = notes;
      if (newCourierId) body.assignedCourierId = newCourierId;
      if (newDate) body.preferredDate = newDate;
      if (newTimeWindow) body.preferredTimeWindow = newTimeWindow;
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNotes("");
        setToast(t("detail.requestUpdated"));
        setTimeout(() => setToast(""), 3000);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCourierAction = async (newStatusValue: string) => {
    if (!pickup) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatusValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPickup(updated);
        setNewStatus(updated.status);
        const msg = newStatusValue === "SCHEDULED"
          ? t("detail.customerNotifiedOnWay")
          : t("detail.pickupConfirmedToast");
        setToast(msg);
        setTimeout(() => setToast(""), 3500);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pickup) return null;

  const isCompleted = pickup.status === "PICKED_UP" || pickup.status === "CANCELLED";
  const navAddress = `${pickup.pickupAddress}, ${pickup.pickupCity}${pickup.pickupState ? ", " + pickup.pickupState : ""}`;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2">
            <Alert type="success" title={t("common.success")} message={toast} />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/solicitudes" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 mb-4 w-fit">
            ← {t("detail.back")}
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-black text-slate-900 font-mono">{pickup.trackingCode}</h1>
                <StatusBadge status={pickup.status} />
                <a
                  href={`/etiqueta/${pickup.trackingCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {lang === "en" ? "Print label" : "Imprimir etiqueta"}
                </a>
              </div>
              <p className="text-slate-600">
                {t("detail.createdOn", {
                  date: new Date(pickup.createdAt).toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t("detail.senderInfo")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label={t("detail.name")} value={pickup.contactName} />
                <InfoRow label={t("detail.phone")} value={pickup.contactPhone} />
                <InfoRow label={t("detail.email")} value={pickup.contactEmail} />
                {pickup.assignedCourier && (
                  <InfoRow label={t("detail.assignedCourier")} value={pickup.assignedCourier.name} />
                )}
              </div>
            </Card>

            {/* Recipient */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t("detail.recipientInfo")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label={t("detail.name")} value={pickup.recipientName} />
                <InfoRow label={t("detail.phone")} value={pickup.recipientPhone} />
                {pickup.recipientPhoneSecondary && (
                  <InfoRow label={t("detail.secondaryPhone")} value={pickup.recipientPhoneSecondary} />
                )}
                {pickup.recipientEmail && (
                  <InfoRow label={t("detail.email")} value={pickup.recipientEmail} />
                )}
                <div className="sm:col-span-2">
                  <InfoRow label={t("detail.destinationAddress")} value={pickup.recipientAddress} />
                </div>
                <InfoRow label={t("detail.city")} value={pickup.recipientCity} />
                {pickup.recipientState && (
                  <InfoRow label={t("detail.stateProvince")} value={pickup.recipientState} />
                )}
                {pickup.recipientPostalCode && (
                  <InfoRow label={t("detail.postalCode")} value={pickup.recipientPostalCode} />
                )}
                <InfoRow label={t("detail.country")} value={pickup.recipientCountry} />
              </div>
            </Card>

            {/* Address */}
            <Card variant="default" padding="lg">
              <div className="flex items-start justify-between gap-4 mb-5">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("detail.pickupAddressTitle")}
                </h2>
                {/* Navigation buttons */}
                {pickup.pickupAddress && (
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(navAddress)}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(navAddress)}&navigate=yes`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.54 6.55C19.18 4.38 16.96 3 14.5 3c-3.7 0-6.8 2.77-7.42 6.35C4.73 10.15 3 12.13 3 14.5 3 17.54 5.46 20 8.5 20c.96 0 1.86-.27 2.63-.73.59.45 1.32.73 2.12.73 1.65 0 3.06-1.14 3.43-2.68.18.02.37.03.57.03 2.62 0 4.75-2.13 4.75-4.75 0-2.37-1.71-4.37-4-.98zM9 14.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25S10.25 12.31 10.25 13 9.69 14.25 9 14.25zm6 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                      </svg>
                      Waze
                    </a>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <InfoRow label={t("detail.address")} value={pickup.pickupAddress} />
                </div>
                <InfoRow label={t("detail.city")} value={pickup.pickupCity} />
                {pickup.pickupState && (
                  <InfoRow label={t("detail.state")} value={pickup.pickupState} />
                )}
                {pickup.pickupPostalCode && (
                  <InfoRow label={t("detail.postalCode")} value={pickup.pickupPostalCode} />
                )}
                <InfoRow label={t("detail.originCountry")} value={pickup.pickupCountry} />
                <InfoRow label={t("detail.destinationCountry")} value={pickup.destinationCountry} />
              </div>
            </Card>

            {/* Package */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t("detail.packageDetails")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoRow label={t("detail.type")} value={pickup.packageType} />
                <InfoRow label={t("detail.estimatedWeight")} value={pickup.estimatedWeight ? `${pickup.estimatedWeight} lb` : null} />
                <InfoRow label={t("detail.dimensions")} value={pickup.dimensions} />
                <InfoRow label={t("detail.preferredDate")} value={formatPickupDate(pickup.preferredDate, locale, {})} />
                <InfoRow label={t("detail.timeWindow")} value={pickup.preferredTimeWindow} />
              </div>
              {pickup.packageContents && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <InfoRow label={t("detail.packageContents")} value={pickup.packageContents} />
                </div>
              )}
              {(pickup.declaredValue != null || pickup.insuranceRequested) && (
                <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 gap-6">
                  <InfoRow label={t("detail.declaredValue")} value={pickup.declaredValue != null ? `$${pickup.declaredValue.toFixed(2)} USD` : null} />
                  {pickup.insuranceRequested && (
                    <InfoRow label={t("detail.insuranceValue")} value={pickup.insuranceValue != null ? `$${pickup.insuranceValue.toFixed(2)} USD` : null} />
                  )}
                </div>
              )}
              {pickup.specialInstructions && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <InfoRow label={t("detail.specialInstructions")} value={pickup.specialInstructions} />
                </div>
              )}
            </Card>

            {/* Status history */}
            <Card variant="default" padding="lg">
              <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {t("detail.statusHistory")}
              </h2>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-6">
                  {[...pickup.statusHistory].reverse().map((entry) => (
                    <div key={entry.id} className="flex gap-4 pl-10 relative">
                      <div className="absolute left-0 w-6 h-6 bg-white border-2 border-indigo-500 rounded-full flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.fromStatus && (
                            <>
                              <StatusBadge status={entry.fromStatus} />
                              <span className="text-slate-300 text-sm">→</span>
                            </>
                          )}
                          <StatusBadge status={entry.toStatus} />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-medium">
                          {new Date(entry.createdAt).toLocaleDateString(locale, {
                            year: "numeric", month: "long", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-slate-700 mt-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Cases — lost/damaged/delayed shipment reports */}
            {["ADMIN", "DISPATCHER"].includes(role) && (
              <CasesSection pickupId={pickup.id} />
            )}

            {/* Internal comments */}
            <InternalComments pickupId={pickup.id} />
          </div>

          {/* Sidebar: actions */}
          <div>
            {["ADMIN", "DISPATCHER"].includes(role) && (
              <Card variant="default" padding="lg" className="sticky top-8">
                <h2 className="font-bold text-slate-900 mb-6">{t("detail.updateRequest")}</h2>
                <form onSubmit={handleUpdate} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("detail.status")}</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{t(`status.${s}`)}</option>
                      ))}
                    </select>
                  </div>

                  {couriers.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">{t("detail.assignCourier")}</label>
                      <select
                        value={newCourierId}
                        onChange={(e) => setNewCourierId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                      >
                        <option value="">{t("detail.unassigned")}</option>
                        {couriers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("detail.pickupDate")}</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("detail.timeWindow")}</label>
                    <select
                      value={newTimeWindow}
                      onChange={(e) => setNewTimeWindow(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                    >
                      <option value="">{t("detail.noChange")}</option>
                      {TIME_WINDOWS.map((w) => (
                        <option key={w.value} value={w.value}>{t(`detail.${w.key}`)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">{t("detail.notes")}</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder={t("detail.optionalNotes")}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={updating}
                    disabled={updating}
                    className="w-full"
                  >
                    {updating ? t("detail.saving") : t("detail.saveChanges")}
                  </Button>
                </form>
              </Card>
            )}

            {role === "COURIER" && !isCompleted && (
              <Card variant="default" padding="lg" className="sticky top-8">
                <h2 className="font-bold text-slate-900 mb-6">{t("detail.actions")}</h2>

                {pickup.status === "ASSIGNED" && (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600">{t("detail.onWayConfirm")}</p>
                    <button
                      onClick={() => handleCourierAction("SCHEDULED")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 text-sm"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          {t("detail.onMyWayBtn")}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {(pickup.status === "SCHEDULED" || pickup.status === "EN_CAMINO") && (
                  <div className="space-y-3">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                      <p className="text-xs font-bold text-indigo-700 mb-1">{t("detail.onTheWay")}</p>
                      <p className="text-sm text-indigo-600">{t("detail.customerNotifiedWay")}</p>
                    </div>
                    <p className="text-sm text-slate-600">{t("detail.confirmInHand")}</p>
                    <button
                      onClick={() => handleCourierAction("PICKED_UP")}
                      disabled={updating}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-200 text-sm"
                    >
                      {updating ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t("detail.confirmPickupBtn")}
                        </>
                      )}
                    </button>
                  </div>
                )}

                {pickup.status === "PENDING" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-amber-800 font-medium">{t("detail.notAssignedYet")}</p>
                  </div>
                )}
              </Card>
            )}

            {role === "COURIER" && isCompleted && (
              <Card variant="default" padding="lg" className="sticky top-8">
                {pickup.status === "PICKED_UP" ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">{t("detail.pickupCompleted")}</p>
                      <p className="text-emerald-700 text-xs">{t("detail.customerNotifiedEmail")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <p className="font-bold text-slate-700 text-sm">{t("detail.requestCancelled")}</p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
