"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import StatusBadge from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n-context";

const AVATAR_COLORS = [
  "from-indigo-500 to-violet-600",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-cyan-600",
  "from-fuchsia-500 to-purple-600",
  "from-lime-500 to-green-600",
  "from-red-500 to-rose-600",
];
function avatarGradient(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

interface PickupSummary {
  id: string;
  trackingCode: string;
  contactName: string;
  pickupCity: string;
  pickupState: string | null;
  status: string;
  preferredDate: string;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  DISPATCHER: "bg-blue-100 text-blue-700",
  COURIER: "bg-amber-100 text-amber-700",
  CUSTOMER: "bg-emerald-100 text-emerald-700",
};

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const locale = lang === "en" ? "en-US" : "es-CO";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [pickups, setPickups] = useState<PickupSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!["ADMIN", "DISPATCHER"].includes(role)) {
      router.replace("/dashboard");
      return;
    }
    const load = async () => {
      const [usersRes, pickupsRes] = await Promise.all([
        fetch(`/api/admin/users`),
        fetch(`/api/pickup-requests?courierId=${userId}&limit=50`),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        const list: UserProfile[] = data.users ?? data;
        const found = list.find((u) => u.id === userId) ?? null;
        setUser(found);
      }
      if (pickupsRes.ok) {
        const d = await pickupsRes.json();
        setPickups(d.data ?? []);
      }
      setLoading(false);
    };
    load();
  }, [status, role, userId]);

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  const total = pickups.length;
  const completed = pickups.filter((p) => p.status === "PICKED_UP").length;
  const inProgress = pickups.filter((p) => ["ASSIGNED", "SCHEDULED", "EN_CAMINO"].includes(p.status)).length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        {/* Back */}
        <Link
          href="/dashboard/usuarios"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("common.back")}
        </Link>

        {/* Profile header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-6">
          <div className="flex items-start gap-5">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(user.name)} flex items-center justify-center text-white text-2xl font-bold shrink-0`}>
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-700"}`}>
                  {t(`roles.${user.role}`)}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
              {user.phone && <p className="text-slate-500 text-sm">{user.phone}</p>}
              <p className="text-slate-400 text-xs mt-1">
                {lang === "en" ? "Joined" : "Miembro desde"}{" "}
                {new Date(user.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {user.role === "COURIER" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: t("usuarios.totalPickups"), value: total, color: "bg-slate-50 border-slate-200", text: "text-slate-900" },
                { label: t("usuarios.completed"), value: completed, color: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
                { label: t("usuarios.inProgress"), value: inProgress, color: "bg-blue-50 border-blue-100", text: "text-blue-700" },
                { label: t("usuarios.successRate"), value: `${successRate}%`, color: "bg-violet-50 border-violet-100", text: "text-violet-700" },
              ].map((s) => (
                <div key={s.label} className={`${s.color} border rounded-xl p-4 text-center`}>
                  <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent pickups */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-900">{t("usuarios.recentPickups")}</h2>
              </div>
              {pickups.length === 0 ? (
                <p className="px-5 py-8 text-center text-slate-400 text-sm">{t("usuarios.noPickupsYet")}</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pickups.slice(0, 20).map((p) => (
                    <Link
                      key={p.id}
                      href={`/dashboard/solicitudes/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                        {p.trackingCode}
                      </span>
                      <span className="text-sm text-slate-700 flex-1 truncate">{p.contactName}</span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {p.pickupCity}{p.pickupState ? `, ${p.pickupState}` : ""}
                      </span>
                      <span className="shrink-0"><StatusBadge status={p.status} /></span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(p.preferredDate).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                      </span>
                      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
