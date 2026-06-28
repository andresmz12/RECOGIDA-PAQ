"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n-context";

const COUNTRY_NAMES: Record<string, string> = {
  HN: "Honduras", GT: "Guatemala", SV: "El Salvador", NI: "Nicaragua",
  DO: "Dominican Rep.", PA: "Panama", CR: "Costa Rica",
  VE: "Venezuela", MX: "Mexico", CO: "Colombia", US: "United States",
};

const STATUS_STEPS = ["PENDING", "ASSIGNED", "SCHEDULED", "PICKED_UP"] as const;

interface Pickup {
  id: string;
  trackingCode: string;
  status: string;
  createdAt: string;
  preferredDate: string;
  contactName: string;
  pickupCity: string;
  pickupCountry: string;
  recipientName: string;
  recipientCity: string;
  recipientCountry: string;
  packageType?: string;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function StatusStepper({ status }: { status: string }) {
  const { t } = useT();
  if (status === "CANCELLED") return null;
  const currentIdx = STATUS_STEPS.indexOf(status as any);

  return (
    <div className="flex items-center gap-1 flex-wrap mt-3">
      {STATUS_STEPS.map((s, i) => {
        const done = currentIdx >= i;
        const active = currentIdx === i;
        return (
          <div key={s} className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold transition-all ${
              done
                ? active
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-100 text-indigo-700"
                : "bg-slate-100 text-slate-400"
            }`}>
              {done && !active && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {active && (
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              )}
              {t(`status.${s}`)}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-4 h-px ${done && currentIdx > i ? "bg-indigo-300" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Profile { name: string; phone: string; currentPassword: string; newPassword: string; confirmPassword: string; }

export default function MiCuentaPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { t } = useT();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "history" | "profile">("active");
  const [profile, setProfile] = useState<Profile>({ name: "", phone: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "CUSTOMER")
      router.push("/dashboard");
  }, [status, session, router]);

  const fetchPickups = async () => {
    try {
      const res = await fetch("/api/my-pickups");
      const data = await res.json();
      setPickups(data.data || []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchPickups();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile(prev => ({ ...prev, name: d.name ?? "", phone: d.phone ?? "" })); })
      .catch(() => {});
  }, [status]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      setProfileMsg({ type: "err", text: t("account.passwordMismatch") });
      return;
    }
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone, currentPassword: profile.currentPassword || undefined, newPassword: profile.newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setProfileMsg({ type: "err", text: data.error ?? t("account.saveError") }); return; }
      await updateSession({ name: data.name });
      setProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setProfileMsg({ type: "ok", text: t("account.saveSuccess") });
    } catch {
      setProfileMsg({ type: "err", text: t("account.saveError") });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancel = async (pickup: Pickup) => {
    if (!confirm(t("account.cancelConfirm", { code: pickup.trackingCode }))) return;
    setCancelling(pickup.id);
    try {
      const res = await fetch(`/api/pickup-requests/${pickup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) fetchPickups();
    } finally {
      setCancelling(null);
    }
  };

  const active = pickups.filter(p => !["PICKED_UP", "CANCELLED"].includes(p.status));
  const done = pickups.filter(p => ["PICKED_UP", "CANCELLED"].includes(p.status));
  const displayed = tab === "active" ? active : done;

  const name = session?.user?.name ?? "";
  const initial = name?.[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-medium transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t("account.home")}
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>OG</div>
              <span className="text-white font-bold text-sm hidden sm:block">O&apos;Globo Cargo</span>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-white/60 hover:text-white text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t("account.signOut")}
              </button>
            </div>
          </div>

          {/* User info + stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-900/50 shrink-0"
                style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
                {initial}
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{name}</h1>
                <p className="text-white/50 text-sm">{session?.user?.email}</p>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6">
              {[
                { n: pickups.length, l: t("account.total") },
                { n: active.length, l: t("account.active") },
                { n: done.filter(p => p.status === "PICKED_UP").length, l: t("account.completed") },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl font-black text-white">{s.n}</p>
                  <p className="text-white/40 text-xs font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 border-b border-white/10">
            <button onClick={() => setTab("active")} className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === "active" ? "text-white border-indigo-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.activeTab")}{active.length > 0 ? ` (${active.length})` : ""}
            </button>
            <button onClick={() => setTab("history")} className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === "history" ? "text-white border-indigo-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.historyTab")}{done.length > 0 ? ` (${done.length})` : ""}
            </button>
            <button onClick={() => setTab("profile")} className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${tab === "profile" ? "text-white border-indigo-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.profileTab")}
            </button>
          </div>
        </div>
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-900">{t("account.editProfile")}</h2>

            {profileMsg && (
              <div className={`px-4 py-3 rounded-xl text-sm font-semibold ${profileMsg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {profileMsg.text}
              </div>
            )}

            {/* Read-only email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t("account.email")}</label>
              <input type="email" value={session?.user?.email ?? ""} disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed" />
              <p className="text-xs text-slate-400 mt-1">{t("account.emailReadOnly")}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t("account.fullName")}</label>
              <input type="text" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t("account.phone")}</label>
              <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (305) 555-0000" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">{t("account.changePassword")}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t("account.currentPassword")}</label>
                  <input type="password" value={profile.currentPassword} onChange={e => setProfile(p => ({ ...p, currentPassword: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t("account.newPassword")}</label>
                  <input type="password" value={profile.newPassword} onChange={e => setProfile(p => ({ ...p, newPassword: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">{t("account.confirmPassword")}</label>
                  <input type="password" value={profile.confirmPassword} onChange={e => setProfile(p => ({ ...p, confirmPassword: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">{t("account.passwordLeaveBlank")}</p>
            </div>

            <button type="submit" disabled={profileLoading} className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
              {profileLoading ? t("account.saving") : t("account.saveProfile")}
            </button>
          </form>
        </div>
      )}

      {/* Content */}
      <div className={`max-w-3xl mx-auto px-4 py-6 ${tab === "profile" ? "hidden" : ""}`}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-slate-500 text-sm font-medium">
            {loading ? t("account.loadingShipments") : displayed.length === 0
              ? tab === "active" ? t("account.noActiveShipments") : t("account.noHistory")
              : t(displayed.length === 1 ? "account.requests_one" : "account.requests_other", { count: displayed.length })}
          </p>
          <Link
            href="/recoger"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300"
            style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t("account.newRequest")}
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="flex justify-between mb-4">
                  <div className="h-5 bg-slate-200 rounded w-28" />
                  <div className="h-5 bg-slate-200 rounded w-20" />
                </div>
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">
              {tab === "active" ? t("account.noActiveShipments") : t("account.noHistory")}
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              {tab === "active" ? t("account.createRequest") : t("account.historyEmpty")}
            </p>
            {tab === "active" && (
              <Link href="/recoger"
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
                {t("account.createFirst")}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(p => (
              <PickupCard
                key={p.id}
                pickup={p}
                cancelling={cancelling === p.id}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PickupCard({ pickup, cancelling, onCancel }: {
  pickup: Pickup;
  cancelling: boolean;
  onCancel: (p: Pickup) => void;
}) {
  const { t } = useT();
  const canCancel = pickup.status === "PENDING";
  const isDone = pickup.status === "PICKED_UP";
  const isCancelled = pickup.status === "CANCELLED";

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${
      isDone ? "border-emerald-100" : isCancelled ? "border-slate-100" : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
    }`}>
      {isDone && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-5 py-1.5 rounded-t-[14px] flex items-center gap-2">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {t("account.packagePickedUp")}
        </div>
      )}
      {isCancelled && (
        <div className="bg-slate-400 text-white text-xs font-bold px-5 py-1.5 rounded-t-[14px]">
          {t("account.cancelled")}
        </div>
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">
            {pickup.trackingCode}
          </span>
          <StatusBadge status={pickup.status} />
        </div>

        {/* Status stepper */}
        {!isCancelled && <StatusStepper status={pickup.status} />}

        {/* Route */}
        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{t("account.origin")}</p>
            <p className="font-bold text-slate-900 truncate">{pickup.pickupCity}</p>
            <p className="text-xs text-slate-500">{COUNTRY_NAMES[pickup.pickupCountry] ?? pickup.pickupCountry}</p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1 px-2">
            <div className="w-2 h-2 rounded-full bg-indigo-300" />
            <div className="w-12 h-0.5 bg-gradient-to-r from-indigo-300 to-indigo-600 rounded-full" />
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-0.5">{t("account.destination")}</p>
            <p className="font-bold text-slate-900 truncate">{pickup.recipientCity}</p>
            <p className="text-xs text-slate-500">{COUNTRY_NAMES[pickup.recipientCountry] ?? pickup.recipientCountry}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(pickup.preferredDate)}
          </span>
          {pickup.packageType && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              {pickup.packageType}
            </span>
          )}
          <span className="ml-auto">{t("account.to")} <span className="font-semibold text-slate-700">{pickup.recipientName}</span></span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/rastreo/${pickup.trackingCode}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}
          >
            {t("account.track")}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href={`/guia/${pickup.trackingCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
            title={t("account.downloadGuide")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">{t("account.guide")}</span>
          </a>
          {canCancel && (
            <button
              onClick={() => onCancel(pickup)}
              disabled={cancelling}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50"
            >
              {cancelling ? "..." : t("account.cancelRequest")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
