"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { useT } from "@/lib/i18n-context";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

const ROLES = ["CUSTOMER", "COURIER", "DISPATCHER", "ADMIN"];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  DISPATCHER: "bg-blue-100 text-blue-700",
  COURIER: "bg-amber-100 text-amber-700",
  CUSTOMER: "bg-emerald-100 text-emerald-700",
};
const EMPTY = { email: "", password: "", name: "", phone: "", role: "CUSTOMER" };
const PAGE_SIZE = 15;

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

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const router = useRouter();
  const locale = lang === "en" ? "en-US" : "es-CO";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") router.push("/dashboard");
  }, [status, session, router]);

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };
  useEffect(() => { if (status === "authenticated") fetchUsers(); }, [status]);

  const openCreate = () => { setEditUser(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (u: User) => { setEditUser(u); setForm({ email: u.email, password: "", name: u.name, phone: u.phone ?? "", role: u.role }); setError(""); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const url = editUser ? `/api/admin/users/${editUser.id}` : "/api/admin/users";
      const method = editUser ? "PUT" : "POST";
      const body = editUser
        ? { name: form.name, phone: form.phone, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("usuarios.failedSave")); return; }
      setShowModal(false); fetchUsers();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("usuarios.deleteConfirm", { name }))) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!roleFilter || u.role === roleFilter);
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  const exportUsersCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Role", "Created"],
      ...users.map((u) => [u.name, u.email, u.phone ?? "", u.role, new Date(u.createdAt).toLocaleDateString("en-US")]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-7 h-7 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
              </svg>
              <h1 className="text-3xl font-black text-slate-900">{t("usuarios.title")}</h1>
            </div>
            <p className="text-slate-600">
              <span className="font-bold">{users.length}</span> {t("usuarios.registeredUsers")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportUsersCSV} variant="outline" size="lg">
              ↓ CSV
            </Button>
            <Button onClick={openCreate} variant="primary" size="lg">
              + {t("usuarios.newUser")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card variant="default" padding="lg" className="mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t("usuarios.search")}</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t("usuarios.searchPlaceholder")}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setUserPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="sm:min-w-48">
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t("usuarios.role")}</label>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setUserPage(1); }}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
              >
                <option value="">{t("usuarios.allRoles")}</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{t(`roles.${r}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-slate-600 font-medium">{t("usuarios.loadingUsers")}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-slate-700 font-semibold text-lg">{t("usuarios.noUsers")}</p>
              <p className="text-slate-500 text-sm mt-1">{t("usuarios.tryFilters")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">{t("usuarios.colUser")}</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">{t("usuarios.role")}</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">{t("usuarios.colPhone")}</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">{t("usuarios.colCreated")}</th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">{t("usuarios.colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(u.name)} flex items-center justify-center text-white font-bold shrink-0`}>
                            {u.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                            <p className="text-slate-500 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                          {t(`roles.${u.role}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                        {u.phone || <span className="text-slate-400 italic">{t("usuarios.noPhone")}</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(u.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          {u.role === "COURIER" && (
                            <a
                              href={`/dashboard/usuarios/${u.id}`}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title={t("usuarios.viewProfile")}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </a>
                          )}
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title={t("usuarios.editUser")}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t("usuarios.deleteUser")}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-sm text-slate-500">
              {(userPage - 1) * PAGE_SIZE + 1}–{Math.min(userPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage === 1}
                className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setUserPage(pg)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                    pg === userPage ? "bg-indigo-600 text-white" : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                disabled={userPage === totalPages}
                className="px-3 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 shadow-2xl rounded-md w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editUser ? t("usuarios.editTitle") : t("usuarios.createTitle")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {!editUser && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t("usuarios.email")}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t("usuarios.fullName")}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {editUser ? t("usuarios.newPassword") : t("usuarios.password")}
                  {editUser && <span className="text-slate-400 font-normal ml-2 text-xs">{t("usuarios.leaveBlank")}</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder={editUser ? t("usuarios.passwordOptional") : t("usuarios.passwordMin")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t("usuarios.phone")}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t("usuarios.role")}</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{t(`roles.${r}`)}</option>
                  ))}
                </select>
              </div>

              {error && (
                <Alert type="error" title="Error" message={error} />
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
                {saving ? t("detail.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
