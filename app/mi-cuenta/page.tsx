"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n-context";
import SupportChatWidget from "@/components/SupportChatWidget";

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
  securityCode?: string;
}

function formatDate(d: string) {
  // preferredDate is stored as UTC-midnight; force UTC when rendering so
  // the calendar day shown doesn't shift for viewers west of UTC.
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function StatusStepper({ status, openCase }: { status: string; openCase?: { type: string } }) {
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
      {openCase && (
        <>
          <div className="w-4 h-px bg-slate-200" />
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-red-500" />
            {t("account.caseOpenPill", { type: t(`account.caseType_${openCase.type}`) })}
          </span>
        </>
      )}
    </div>
  );
}

interface Profile { name: string; phone: string; currentPassword: string; newPassword: string; confirmPassword: string; }

interface SavedRecipient {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientState: string | null;
  recipientCountry: string;
}

interface SavedPickupAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
}

export default function MiCuentaPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const { t } = useT();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [openCasesByTracking, setOpenCasesByTracking] = useState<Record<string, { type: string }>>({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "history" | "profile" | "recipients" | "addresses">("active");
  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [deletingRecipient, setDeletingRecipient] = useState<string | null>(null);
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const [recipientEditForm, setRecipientEditForm] = useState({ label: "", recipientName: "", recipientPhone: "", recipientAddress: "", recipientCity: "", recipientState: "" });
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [pickupAddresses, setPickupAddresses] = useState<SavedPickupAddress[]>([]);
  const [pickupAddressesLoading, setPickupAddressesLoading] = useState(false);
  const [deletingPickupAddress, setDeletingPickupAddress] = useState<string | null>(null);
  const [editingPickupAddressId, setEditingPickupAddressId] = useState<string | null>(null);
  const [pickupAddressEditForm, setPickupAddressEditForm] = useState({ label: "", address: "", city: "", state: "" });
  const [savingPickupAddress, setSavingPickupAddress] = useState(false);
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
    fetch("/api/my-cases")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const map: Record<string, { type: string }> = {};
        for (const c of d?.cases ?? []) {
          if (c.status !== "RESOLVED" && c.pickupRequest?.trackingCode) {
            map[c.pickupRequest.trackingCode] = { type: c.type };
          }
        }
        setOpenCasesByTracking(map);
      })
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setProfile(prev => ({ ...prev, name: d.name ?? "", phone: d.phone ?? "" })); })
      .catch(() => {});
  }, [status]);

  const fetchRecipients = async () => {
    setRecipientsLoading(true);
    try {
      const res = await fetch("/api/saved-recipients");
      const data = await res.json();
      setRecipients(data.data || []);
    } catch {
      /* silent */
    } finally {
      setRecipientsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "recipients" && status === "authenticated") fetchRecipients();
  }, [tab, status]);

  const deleteRecipient = async (id: string) => {
    if (!confirm(t("account.deleteRecipientConfirm"))) return;
    setDeletingRecipient(id);
    try {
      const res = await fetch(`/api/saved-recipients/${id}`, { method: "DELETE" });
      if (res.ok) setRecipients(prev => prev.filter(r => r.id !== id));
    } finally {
      setDeletingRecipient(null);
    }
  };

  const startEditRecipient = (r: SavedRecipient) => {
    setEditingRecipientId(r.id);
    setRecipientEditForm({
      label: r.label,
      recipientName: r.recipientName,
      recipientPhone: r.recipientPhone,
      recipientAddress: r.recipientAddress,
      recipientCity: r.recipientCity,
      recipientState: r.recipientState ?? "",
    });
  };

  const saveRecipient = async (id: string) => {
    setSavingRecipient(true);
    try {
      const res = await fetch(`/api/saved-recipients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipientEditForm),
      });
      if (res.ok) {
        const data = await res.json();
        setRecipients(prev => prev.map(r => (r.id === id ? { ...r, ...data.recipient } : r)));
        setEditingRecipientId(null);
      }
    } finally {
      setSavingRecipient(false);
    }
  };

  const fetchPickupAddresses = async () => {
    setPickupAddressesLoading(true);
    try {
      const res = await fetch("/api/saved-pickup-addresses");
      const data = await res.json();
      setPickupAddresses(data.data || []);
    } catch {
      /* silent */
    } finally {
      setPickupAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "addresses" && status === "authenticated") fetchPickupAddresses();
  }, [tab, status]);

  const deletePickupAddress = async (id: string) => {
    if (!confirm(t("account.deletePickupAddressConfirm"))) return;
    setDeletingPickupAddress(id);
    try {
      const res = await fetch(`/api/saved-pickup-addresses/${id}`, { method: "DELETE" });
      if (res.ok) setPickupAddresses(prev => prev.filter(a => a.id !== id));
    } finally {
      setDeletingPickupAddress(null);
    }
  };

  const startEditPickupAddress = (a: SavedPickupAddress) => {
    setEditingPickupAddressId(a.id);
    setPickupAddressEditForm({ label: a.label, address: a.address, city: a.city, state: a.state ?? "" });
  };

  const savePickupAddress = async (id: string) => {
    setSavingPickupAddress(true);
    try {
      const res = await fetch(`/api/saved-pickup-addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickupAddressEditForm),
      });
      if (res.ok) {
        const data = await res.json();
        setPickupAddresses(prev => prev.map(a => (a.id === id ? { ...a, ...data.address } : a)));
        setEditingPickupAddressId(null);
      }
    } finally {
      setSavingPickupAddress(false);
    }
  };

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
      <div style={{ background: "linear-gradient(135deg, #0d2338, #1d4f86, #14314f)" }}>
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-900/50 shrink-0"
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

        {/* Tab bar — horizontally scrollable so it never clips on narrow
            phone screens instead of running the last tab off-screen */}
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 border-b border-white/10 overflow-x-auto no-scrollbar">
            <button onClick={() => setTab("active")} className={`shrink-0 px-3.5 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${tab === "active" ? "text-white border-blue-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.activeTab")}{active.length > 0 ? ` (${active.length})` : ""}
            </button>
            <button onClick={() => setTab("history")} className={`shrink-0 px-3.5 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${tab === "history" ? "text-white border-blue-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.historyTab")}{done.length > 0 ? ` (${done.length})` : ""}
            </button>
            <button onClick={() => setTab("recipients")} className={`shrink-0 px-3.5 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${tab === "recipients" ? "text-white border-blue-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.recipientsTab")}
            </button>
            <button onClick={() => setTab("addresses")} className={`shrink-0 px-3.5 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${tab === "addresses" ? "text-white border-blue-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.addressesTab")}
            </button>
            <button onClick={() => setTab("profile")} className={`shrink-0 px-3.5 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${tab === "profile" ? "text-white border-blue-400" : "text-white/40 border-transparent hover:text-white/70"}`}>
              {t("account.profileTab")}
            </button>
          </div>
        </div>
      </div>

      {/* Saved recipients tab */}
      {tab === "recipients" && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">{t("account.recipientsTitle")}</h2>
            <p className="text-slate-500 text-sm mb-5">{t("account.recipientsDesc")}</p>

            {recipientsLoading ? (
              <p className="text-slate-400 text-sm">{t("common.loading")}</p>
            ) : recipients.length === 0 ? (
              <p className="text-slate-400 text-sm">{t("account.noRecipients")}</p>
            ) : (
              <div className="space-y-3">
                {recipients.map(r => (
                  editingRecipientId === r.id ? (
                    <div key={r.id} className="border border-blue-200 rounded-xl p-4 space-y-2.5 bg-blue-50/30">
                      <input value={recipientEditForm.label} onChange={e => setRecipientEditForm(f => ({ ...f, label: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <input value={recipientEditForm.recipientName} onChange={e => setRecipientEditForm(f => ({ ...f, recipientName: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={recipientEditForm.recipientPhone} onChange={e => setRecipientEditForm(f => ({ ...f, recipientPhone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <input value={recipientEditForm.recipientAddress} onChange={e => setRecipientEditForm(f => ({ ...f, recipientAddress: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <input value={recipientEditForm.recipientCity} onChange={e => setRecipientEditForm(f => ({ ...f, recipientCity: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={recipientEditForm.recipientState} onChange={e => setRecipientEditForm(f => ({ ...f, recipientState: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingRecipientId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">{t("common.cancel")}</button>
                        <button onClick={() => saveRecipient(r.id)} disabled={savingRecipient} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
                          {savingRecipient ? t("common.loading") : t("common.save")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={r.id} className="flex items-start justify-between gap-4 border border-slate-100 rounded-xl p-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{r.label}</p>
                        <p className="text-slate-600 text-sm">{r.recipientName} · {r.recipientPhone}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {r.recipientAddress}, {r.recipientCity}{r.recipientState ? `, ${r.recipientState}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <button
                          onClick={() => startEditRecipient(r)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          {t("account.editRecipient")}
                        </button>
                        <button
                          onClick={() => deleteRecipient(r.id)}
                          disabled={deletingRecipient === r.id}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50"
                        >
                          {deletingRecipient === r.id ? t("common.loading") : t("account.deleteRecipient")}
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved pickup addresses tab */}
      {tab === "addresses" && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">{t("account.pickupAddressesTitle")}</h2>
            <p className="text-slate-500 text-sm mb-5">{t("account.pickupAddressesDesc")}</p>

            {pickupAddressesLoading ? (
              <p className="text-slate-400 text-sm">{t("common.loading")}</p>
            ) : pickupAddresses.length === 0 ? (
              <p className="text-slate-400 text-sm">{t("account.noPickupAddresses")}</p>
            ) : (
              <div className="space-y-3">
                {pickupAddresses.map(a => (
                  editingPickupAddressId === a.id ? (
                    <div key={a.id} className="border border-blue-200 rounded-xl p-4 space-y-2.5 bg-blue-50/30">
                      <input value={pickupAddressEditForm.label} onChange={e => setPickupAddressEditForm(f => ({ ...f, label: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input value={pickupAddressEditForm.address} onChange={e => setPickupAddressEditForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <input value={pickupAddressEditForm.city} onChange={e => setPickupAddressEditForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input value={pickupAddressEditForm.state} onChange={e => setPickupAddressEditForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingPickupAddressId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700">{t("common.cancel")}</button>
                        <button onClick={() => savePickupAddress(a.id)} disabled={savingPickupAddress} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
                          {savingPickupAddress ? t("common.loading") : t("common.save")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={a.id} className="flex items-start justify-between gap-4 border border-slate-100 rounded-xl p-4">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{a.label}</p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {a.address}, {a.city}{a.state ? `, ${a.state}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <button
                          onClick={() => startEditPickupAddress(a)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                        >
                          {t("account.editPickupAddress")}
                        </button>
                        <button
                          onClick={() => deletePickupAddress(a.id)}
                          disabled={deletingPickupAddress === a.id}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-50"
                        >
                          {deletingPickupAddress === a.id ? t("common.loading") : t("account.deletePickupAddress")}
                        </button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
              <input type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
      <div className={`max-w-3xl mx-auto px-4 py-6 ${tab === "profile" || tab === "recipients" || tab === "addresses" ? "hidden" : ""}`}>
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
                openCase={openCasesByTracking[p.trackingCode]}
              />
            ))}
          </div>
        )}
      </div>
      {status === "authenticated" && <SupportChatWidget />}
    </div>
  );
}

function PickupCard({ pickup, cancelling, onCancel, openCase }: {
  pickup: Pickup;
  cancelling: boolean;
  onCancel: (p: Pickup) => void;
  openCase?: { type: string };
}) {
  const { t } = useT();
  const canCancel = pickup.status === "PENDING";
  const isDone = pickup.status === "PICKED_UP";
  const isCancelled = pickup.status === "CANCELLED";

  return (
    <div className={`bg-white rounded-2xl border-2 transition-all ${
      openCase ? "border-red-200" : isDone ? "border-emerald-100" : isCancelled ? "border-slate-100" : "border-slate-200 hover:border-indigo-200 hover:shadow-md"
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
        {!isCancelled && <StatusStepper status={pickup.status} openCase={openCase} />}

        {/* Pickup security code — hand to the courier at pickup */}
        {pickup.securityCode && !isCancelled && pickup.status !== "PICKED_UP" && (
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-dashed border-amber-300 rounded-xl px-4 py-2.5 my-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">{t("account.securityCode")}</p>
              <p className="text-xs text-amber-600">{t("account.securityCodeNote")}</p>
            </div>
            <span className="font-mono font-black text-xl text-amber-700 tracking-[0.2em] shrink-0">{pickup.securityCode}</span>
          </div>
        )}

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
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(pickup.preferredDate)}
            {!isCancelled && (
              pickup.status === "PENDING" ? (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  {t("common.dateUnconfirmed")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">
                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  {t("common.dateConfirmed")}
                </span>
              )
            )}
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
