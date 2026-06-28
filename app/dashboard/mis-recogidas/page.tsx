"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import StartRouteModal from "@/components/StartRouteModal";
import { useT } from "@/lib/i18n-context";
import { optimizeStopsByCity, buildGoogleMapsRouteUrl } from "@/lib/route-optimizer";

interface PickupRequest {
  id: string;
  trackingCode: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  pickupCity: string;
  pickupCountry: string;
  status: string;
  preferredDate: string;
  preferredTimeWindow: string;
  specialInstructions?: string | null;
  // Package / box info
  packageType?: string | null;
  packageContents?: string | null;
  estimatedWeight?: number | null;
  dimensions?: string | null;
  // Destination
  recipientCity?: string | null;
  destinationCountry?: string | null;
}

export default function MisRecogidasPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // "" | "today" | "tomorrow" | YYYY-MM-DD
  const [toast, setToast] = useState("");
  const [showRouteModal, setShowRouteModal] = useState(false);

  const courierId = (session?.user as any)?.id;
  const locale = lang === "en" ? "en-US" : "es-CO";

  // Keep latest values accessible inside the interval without stale closure
  const latestRef = useRef({ courierId, statusFilter });
  useEffect(() => { latestRef.current = { courierId, statusFilter }; });

  const loadPickups = async () => {
    const { courierId: cid, statusFilter: sf } = latestRef.current;
    if (!cid) return;
    setLoading(true);
    let url = `/api/pickup-requests?limit=100&courierId=${cid}`;
    if (sf) url += `&status=${sf}`;
    const res = await fetch(url);
    const data = await res.json();
    setPickups(data.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPickups();
  }, [status, session, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 60 seconds — uses ref so it always reads latest filters
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(() => loadPickups(), 60_000);
    return () => clearInterval(interval);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 6000);
  };

  const handleAction = async (id: string, newStatus: string, notes?: string, proofPhotoUrl?: string) => {
    const body: any = { status: newStatus };
    if (notes) body.notes = notes;
    if (proofPhotoUrl) body.proofPhotoUrl = proofPhotoUrl;
    const res = await fetch(`/api/pickup-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const msg = newStatus === "SCHEDULED"
        ? t("pickups.customerNotifiedOnWay")
        : t("pickups.packageInHand");
      showToast(msg);
      loadPickups();
    }
  };

  // ── Date helpers ────────────────────────────────────────────────
  const now = new Date();
  const todayKey = now.toDateString();
  const tmrw = new Date(now);
  tmrw.setDate(now.getDate() + 1);
  const tomorrowKey = tmrw.toDateString();
  const dateKeyOf = (d: string) => new Date(d).toDateString();

  const matchesDate = (p: PickupRequest) => {
    if (!dateFilter) return true;
    const k = dateKeyOf(p.preferredDate);
    if (dateFilter === "today") return k === todayKey;
    if (dateFilter === "tomorrow") return k === tomorrowKey;
    return k === new Date(dateFilter + "T00:00:00").toDateString();
  };

  // ── Route: build Google Maps multi-stop and open it directly ────
  const handleRouteModalConfirm = (origin: { address: string; coords: [number, number] | null }) => {
    setShowRouteModal(false);
    const active = pickups.filter((p) => p.status !== "PICKED_UP" && p.status !== "CANCELLED");
    const todayActive = active.filter((p) => dateKeyOf(p.preferredDate) === todayKey);
    const stops = todayActive.length ? todayActive : active;
    if (stops.length === 0) {
      showToast(t("pickups.noStopsForRoute"));
      return;
    }
    const ordered = optimizeStopsByCity(origin.coords, origin.address, stops);
    const originText = origin.coords
      ? `${origin.coords[0]},${origin.coords[1]}`
      : origin.address;
    const url = buildGoogleMapsRouteUrl(originText, ordered);
    showToast(t("pickups.openingRoute"));
    window.open(url, "_blank", "noopener");
  };

  const filtered = pickups.filter(matchesDate);

  const todayPickups = filtered.filter((p) => dateKeyOf(p.preferredDate) === todayKey);
  const otherPickups = filtered.filter(
    (p) =>
      dateKeyOf(p.preferredDate) !== todayKey &&
      p.status !== "PICKED_UP" &&
      p.status !== "CANCELLED"
  );

  const doneToday = todayPickups.filter((p) => p.status === "PICKED_UP").length;
  const totalToday = todayPickups.length;

  const dateFilters: { value: string; label: string }[] = [
    { value: "", label: t("pickups.dateAll") },
    { value: "today", label: t("pickups.today") },
    { value: "tomorrow", label: t("pickups.dateTomorrow") },
  ];
  const specificDate = !["", "today", "tomorrow"].includes(dateFilter) ? dateFilter : "";

  return (
    <DashboardLayout>
      {showRouteModal && (
        <StartRouteModal
          onConfirm={handleRouteModalConfirm}
          onClose={() => setShowRouteModal(false)}
        />
      )}

      <div className="p-6 max-w-4xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-1">{t("pickups.myPickups")}</h1>
              <p className="text-slate-600">
                {pickups.length === 0
                  ? t("pickups.noPickupsAssigned")
                  : t(pickups.length === 1 ? "pickups.xPickupsAssigned_one" : "pickups.xPickupsAssigned_other", { count: pickups.length })}
              </p>
            </div>
            {/* Start Route CTA */}
            <button
              onClick={() => setShowRouteModal(true)}
              className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {t("pickups.startTodayRoute")}
            </button>
          </div>

          {/* Today's progress bar */}
          {totalToday > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-indigo-600 mb-1.5">
                  {t("pickups.today")} — {doneToday}/{totalToday}
                </p>
                <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((doneToday / totalToday) * 100)}%` }}
                  />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-700 shrink-0">
                {Math.round((doneToday / totalToday) * 100)}%
              </p>
            </div>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {["", "ASSIGNED", "SCHEDULED", "PICKED_UP"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === s
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {s === "" ? t("common.all") : t(`status.${s}`)}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex gap-2 mb-8 flex-wrap items-center">
          {dateFilters.map((d) => (
            <button
              key={d.value}
              onClick={() => setDateFilter(d.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                dateFilter === d.value
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {d.label}
            </button>
          ))}
          <input
            type="date"
            value={specificDate}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              specificDate
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
            aria-label={t("pickups.pickByDate")}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-slate-600 font-medium">{t("common.loading")}</p>
          </div>
        ) : pickups.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-900 font-bold text-lg mb-1">{t("pickups.noPickupsAvailable")}</p>
            <p className="text-slate-500 text-sm">{t("pickups.notifiedWhenRoutes")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-slate-700 font-semibold">{t("pickups.noPickupsForDate")}</p>
          </div>
        ) : dateFilter ? (
          // Flat filtered list when a specific date filter is active
          <div className="space-y-4">
            {filtered.map((p) => (
              <PickupActionCard key={p.id} pickup={p} onAction={handleAction} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {todayPickups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-slate-900">
                    {t("pickups.today")} — {now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
                  </h2>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{todayPickups.length}</span>
                </div>
                <div className="space-y-4">
                  {todayPickups.map(p => (
                    <PickupActionCard key={p.id} pickup={p} onAction={handleAction} locale={locale} />
                  ))}
                </div>
              </section>
            )}

            {otherPickups.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="font-bold text-slate-900">{t("pickups.upcoming")}</h2>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{otherPickups.length}</span>
                </div>
                <div className="space-y-4">
                  {otherPickups.map(p => (
                    <PickupActionCard key={p.id} pickup={p} onAction={handleAction} locale={locale} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function NavButtons({ address }: { address: string }) {
  const { t } = useT();
  const enc = encodeURIComponent(address);
  return (
    <>
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${enc}&travelmode=driving`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        {t("pickups.maps")}
      </a>
      <a
        href={`https://waze.com/ul?q=${enc}&navigate=yes`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.54 6.55C19.18 4.38 16.96 3 14.5 3c-3.7 0-6.8 2.77-7.42 6.35C4.73 10.15 3 12.13 3 14.5 3 17.54 5.46 20 8.5 20c.96 0 1.86-.27 2.63-.73.59.45 1.32.73 2.12.73 1.65 0 3.06-1.14 3.43-2.68.18.02.37.03.57.03 2.62 0 4.75-2.13 4.75-4.75 0-2.37-1.71-4.37-4-.98zM9 14.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25S10.25 12.31 10.25 13 9.69 14.25 9 14.25zm6 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
        </svg>
        Waze
      </a>
    </>
  );
}

function PickupActionCard({
  pickup,
  onAction,
  locale,
}: {
  pickup: PickupRequest;
  onAction: (id: string, status: string, notes?: string, proofPhotoUrl?: string) => void;
  locale: string;
}) {
  const { t } = useT();
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [acting, setActing] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const act = async (newStatus: string) => {
    setActing(true);
    await onAction(pickup.id, newStatus, notes || undefined, photoDataUrl || undefined);
    setNotes("");
    setShowNotes(false);
    setPhotoDataUrl(null);
    setActing(false);
  };

  const isPending = pickup.status === "ASSIGNED";
  const isOnTheWay = pickup.status === "SCHEDULED" || pickup.status === "EN_CAMINO";
  const isDone = pickup.status === "PICKED_UP" || pickup.status === "CANCELLED";

  const destination = [pickup.recipientCity, pickup.destinationCountry].filter(Boolean).join(", ");

  return (
    <div className={`bg-white rounded-3xl border-2 transition-all ${
      isPending ? "border-amber-200" :
      isOnTheWay ? "border-indigo-300 shadow-lg shadow-indigo-50" :
      isDone ? "border-slate-100" : "border-slate-200"
    }`}>
      {isOnTheWay && (
        <div className="bg-indigo-600 text-white text-xs font-bold px-6 py-2 rounded-t-[22px] flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          {t("pickups.onTheWayBanner")}
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <span className="inline-block font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl text-sm mb-2">
              {pickup.trackingCode}
            </span>
            <div className="flex items-center gap-2">
              <StatusBadge status={pickup.status} />
              <span className="text-slate-500 text-xs">
                {new Date(pickup.preferredDate).toLocaleDateString(locale, { day: "numeric", month: "short" })} · {pickup.preferredTimeWindow}
              </span>
            </div>
          </div>

          {!isDone && (
            <div className="flex gap-2 flex-wrap">
              <NavButtons address={`${pickup.pickupAddress}, ${pickup.pickupCity}`} />
              <a
                href={`tel:${pickup.contactPhone}`}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {t("pickups.call")}
              </a>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t("pickups.contact")}</p>
            <p className="font-bold text-slate-900">{pickup.contactName}</p>
            <p className="text-slate-600 text-sm">{pickup.contactPhone}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t("pickups.pickupAddress")}</p>
            <p className="font-bold text-slate-900">{pickup.pickupCity}</p>
            <p className="text-slate-600 text-sm">{pickup.pickupAddress}</p>
          </div>
        </div>

        {/* Package / box info — so the courier knows what to expect */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2.5">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">{t("pickups.packageInfo")}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("pickups.packageInfo")}</p>
              <p className="text-sm font-semibold text-slate-900">{pickup.packageType || t("pickups.notSpecified")}</p>
            </div>
            {pickup.estimatedWeight ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("pickups.weight")}</p>
                <p className="text-sm font-semibold text-slate-900">{pickup.estimatedWeight} lb</p>
              </div>
            ) : null}
            {destination ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("pickups.destination")}</p>
                <p className="text-sm font-semibold text-slate-900">{destination}</p>
              </div>
            ) : null}
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{t("pickups.contents")}</p>
              <p className="text-sm font-semibold text-slate-900 truncate" title={pickup.packageContents || ""}>
                {pickup.packageContents || t("pickups.notSpecified")}
              </p>
            </div>
          </div>
        </div>

        {pickup.specialInstructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">⚠️ {t("pickups.specialInstructions")}</p>
            <p className="text-amber-900 text-sm">{pickup.specialInstructions}</p>
          </div>
        )}

        {!isDone && (
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full text-left flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm text-slate-600 font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("pickups.addNote")}
              </span>
              <span className="text-xs">{showNotes ? "▲" : "▼"}</span>
            </button>

            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Customer was not home, left notice. / Package received in good condition..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"
              />
            )}

            {/* Photo proof — shown when courier is on the way */}
            {isOnTheWay && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-3 bg-slate-50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoDataUrl ? (
                  <div className="relative">
                    <img src={photoDataUrl} alt="proof" className="w-full max-h-40 object-cover rounded-lg" />
                    <button
                      onClick={() => setPhotoDataUrl(null)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium py-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t("pickups.addPhoto")}
                  </button>
                )}
              </div>
            )}

            <div className="flex gap-3">
              {isPending && (
                <button
                  onClick={() => act("SCHEDULED")}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-200 text-sm"
                >
                  {acting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                  {t("pickups.onMyWay")}
                </button>
              )}

              {isOnTheWay && (
                <button
                  onClick={() => act("PICKED_UP")}
                  disabled={acting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-200 text-sm"
                >
                  {acting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {t("pickups.confirmPickup")}
                </button>
              )}
            </div>
          </div>
        )}

        {isDone && pickup.status === "PICKED_UP" && (
          <div className="pt-5 border-t border-slate-100">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-sm">{t("pickups.pickupCompleted")}</p>
                <p className="text-emerald-700 text-xs">{t("pickups.customerNotifiedEmail")}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
