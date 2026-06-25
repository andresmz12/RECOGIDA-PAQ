"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (!result || result.error) {
        setError("Email o contraseña incorrectos");
        setIsLoading(false);
        return;
      }
      if (result.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-16">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              OG
            </div>
            <span className="text-2xl font-bold tracking-tight">O&apos;Globo Cargo</span>
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">
            Logística internacional<br />
            <span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              simplificada.
            </span>
          </h1>
          <p className="text-lg text-white/60 leading-relaxed">
            Gestiona recogidas, rastrea envíos y coordina couriers desde un solo lugar.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[{ v: "10K+", l: "Recogidas" }, { v: "99.2%", l: "Éxito" }, { v: "< 24h", l: "Respuesta" }].map(s => (
              <div key={s.l} className="text-center">
                <p className="text-3xl font-black text-indigo-300">{s.v}</p>
                <p className="text-sm text-white/50 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <span className="text-white">OG</span>
            </div>
            <span className="text-xl font-bold text-white">O&apos;Globo Cargo</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900">Iniciar sesión</h2>
              <p className="text-slate-500 mt-2">Accede a tu panel de control</p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: isLoading ? "#818cf8" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : "Iniciar Sesión →"}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-3 text-sm text-center">
              <p className="text-slate-600">
                ¿No tienes cuenta?{" "}
                <Link href="/registro" className="font-bold text-indigo-600 hover:text-indigo-700">
                  Regístrate aquí
                </Link>
              </p>
              <p>
                <Link href="/recoger" className="text-slate-500 hover:text-slate-700 font-medium">
                  Solicitar recogida sin cuenta →
                </Link>
              </p>
            </div>
          </div>

          {/* Test credentials */}
          <div className="mt-6 bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/20">
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Cuentas de prueba · contraseña: password123</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { email: "admin@example.com", role: "ADMIN", color: "text-violet-300" },
                { email: "dispatcher@example.com", role: "DISPATCHER", color: "text-blue-300" },
                { email: "courier@example.com", role: "COURIER", color: "text-amber-300" },
                { email: "customer@example.com", role: "CUSTOMER", color: "text-emerald-300" },
              ].map(u => (
                <button
                  key={u.email}
                  onClick={() => setEmail(u.email)}
                  className="text-left bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-3 py-2 cursor-pointer"
                >
                  <p className={`font-bold ${u.color}`}>{u.role}</p>
                  <p className="text-white/50 truncate">{u.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
