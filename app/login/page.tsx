"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useT();
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
        setError(t("login.invalidCredentials"));
        setIsLoading(false);
        return;
      }
      if (result.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setError(t("login.connectionError"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative" style={{ background: "linear-gradient(135deg, #0c1b2e, #142b45, #0d2240)" }}>
      {/* Language switcher – top right */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSwitcher />
      </div>

      {/* Left panel – branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-16">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-white/10"
              style={{ background: "linear-gradient(135deg, #1d4f86, #2c629b)" }}>
              <svg className="w-7 h-7 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <path strokeWidth={2} strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tight">O&apos;Globo Cargo</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
            {t("login.heroLine1")}<br />
            <span className="text-accent-400">{t("login.heroAccent")}</span>
          </h1>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10"
              style={{ background: "linear-gradient(135deg, #1d4f86, #2c629b)" }}>
              <svg className="w-5 h-5 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={2} />
                <path strokeWidth={2} strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">O&apos;Globo Cargo</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-navy-900 tracking-tight">{t("login.title")}</h2>
              <p className="text-slate-500 mt-2">{t("login.subtitle")}</p>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t("login.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">{t("login.password")}</label>
                  <Link href="/forgot-password" className="text-xs text-navy-600 hover:text-navy-700 font-semibold">
                    {t("login.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                   
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:border-navy-500 focus:ring-4 focus:ring-navy-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                style={{ background: isLoading ? "#4d80b4" : "linear-gradient(135deg, #1d4f86, #2c629b)" }}
              >
                {isLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t("login.signingIn")}</>
                ) : <>{t("login.signIn")} →</>}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-3 text-sm text-center">
              <p className="text-slate-600">
                {t("login.noAccount")}{" "}
                <Link href="/registro" className="font-bold text-navy-600 hover:text-navy-700">
                  {t("login.signUpHere")}
                </Link>
              </p>
              <p>
                <Link href="/recoger" className="text-slate-500 hover:text-slate-700 font-medium">
                  {t("login.requestWithoutAccount")} →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
