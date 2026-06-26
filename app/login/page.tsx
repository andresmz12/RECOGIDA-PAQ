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
        setError("Incorrect email or password.");
        setIsLoading(false);
        return;
      }
      if (result.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("Connection error. Please try again.");
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
            International logistics<br />
            <span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              simplified.
            </span>
          </h1>
          <p className="text-lg text-white/60 leading-relaxed">
            Manage pickups, track shipments, and coordinate couriers — all in one place.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[{ v: "10K+", l: "Pickups" }, { v: "99.2%", l: "Success" }, { v: "< 24h", l: "Response" }].map(s => (
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
          <div className="flex items-center gap-3 mb-10 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <span className="text-white">OG</span>
            </div>
            <span className="text-xl font-bold text-white">O&apos;Globo Cargo</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900">Sign in</h2>
              <p className="text-slate-500 mt-2">Access your control panel</p>
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
                  placeholder="you@email.com"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold">
                    Forgot password?
                  </Link>
                </div>
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword
                        ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      }
                    </svg>
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
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                ) : "Sign In →"}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-3 text-sm text-center">
              <p className="text-slate-600">
                Don&apos;t have an account?{" "}
                <Link href="/registro" className="font-bold text-indigo-600 hover:text-indigo-700">
                  Sign up here
                </Link>
              </p>
              <p>
                <Link href="/recoger" className="text-slate-500 hover:text-slate-700 font-medium">
                  Request a pickup without an account →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
