"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Alert from "@/components/Alert";
import Input from "@/components/Form/Input";
import Select from "@/components/Form/Select";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador", COURIER: "Mensajero", CUSTOMER: "Cliente",
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-violet-100 text-violet-700",
  COURIER: "bg-amber-100 text-amber-700", CUSTOMER: "bg-emerald-100 text-emerald-700",
};
const EMPTY = { email: "", password: "", name: "", phone: "", role: "COURIER" };

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

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
      if (!res.ok) { setError(data.error || "Error al guardar"); return; }
      setShowModal(false); fetchUsers();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar a ${name}?`)) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!roleFilter || u.role === roleFilter);
  });

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">👥</div>
              <h1 className="text-3xl font-black text-slate-900">Gestión de Usuarios</h1>
            </div>
            <p className="text-slate-600">
              <span className="font-bold">{users.length}</span> usuarios registrados en el sistema
            </p>
          </div>
          <Button onClick={openCreate} variant="primary" size="lg">
            + Nuevo Usuario
          </Button>
        </div>

        {/* Filters */}
        <Card variant="default" padding="lg" className="mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="sm:min-w-48">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
              >
                <option value="">Todos los roles</option>
                <option value="ADMIN">Administrador</option>
                <option value="COURIER">Mensajero</option>
                <option value="CUSTOMER">Cliente</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card variant="default" padding="none" className="overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
              <p className="text-slate-600 font-medium">Cargando usuarios...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4 opacity-50">👤</div>
              <p className="text-slate-700 font-semibold text-lg">No se encontraron usuarios</p>
              <p className="text-slate-500 text-sm mt-1">Intenta con otros filtros de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">Usuario</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">Rol</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">Teléfono</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">Creado</th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide px-6 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shrink-0">
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
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                        {u.phone || <span className="text-slate-400 italic">Sin teléfono</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-sm">
                        {new Date(u.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
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
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card variant="elevated" padding="none" className="w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
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

            {/* Content */}
            <div className="p-6 space-y-5">
              {!editUser && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Nombre Apellido"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contraseña
                  {editUser && <span className="text-slate-500 font-normal ml-2">(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-colors"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="COURIER">Mensajero / Courier</option>
                  <option value="DISPATCHER">Despachador</option>
                </select>
              </div>

              {error && (
                <Alert type="error" title="Error" message={error} />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
