"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/Form/Input";
import Alert from "@/components/ui/Alert";
import Card from "@/components/ui/Card";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { isValidUSPhone } from "@/lib/utils";

export default function RegistroPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", name: "", phone: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) { setError(t("registro2.errorName")); return; }
    if (!formData.email.includes("@")) { setError(t("registro2.errorEmail")); return; }
    if (formData.phone && !isValidUSPhone(formData.phone)) {
      setError(t("registro2.errorPhone")); return;
    }
    if (formData.password.length < 6) { setError(t("registro2.errorMinPw")); return; }
    if (formData.password !== formData.confirmPassword) { setError(t("registro2.errorMatchPw")); return; }
    if (!acceptTerms) { setError(t("registro2.errorTerms")); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password, name: formData.name, phone: formData.phone, acceptedTerms: acceptTerms, lang }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || t("registro2.errorFailed")); setIsLoading(false); return; }

      setSuccess(t("registro2.successMsg"));
      const signInResult = await signIn("credentials", { email: formData.email, password: formData.password, redirect: false });
      setTimeout(() => {
        if (!signInResult || !signInResult.ok) router.push("/login?registered=1");
        else router.push("/mi-cuenta");
      }, 1500);
    } catch {
      setError(t("registro2.errorGeneric"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, #0c1b2e, #142b45, #0d2240)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="absolute top-0 right-0 -translate-y-12">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl shadow-lg mb-4" style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
            <span className="text-white font-black text-lg">OG</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">O&apos;Globo Cargo</h1>
          <p className="text-blue-200 text-sm">{t("registro2.customerSubtitle")}</p>
        </div>

        <Card variant="default" padding="lg" className="bg-white/95 backdrop-blur border-white/20 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{t("registro2.cardTitle")}</h2>
            <p className="text-slate-600 text-sm mt-1">{t("registro2.cardSubtitle")}</p>
          </div>

          {success && <div className="mb-6"><Alert type="success" title={t("registro2.successTitle")} message={success} /></div>}
          {error && <div className="mb-6"><Alert type="error" title="Error" message={error} dismissible onDismiss={() => setError("")} /></div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input type="text" label={t("registro2.fullName")} name="name" value={formData.name} onChange={handleChange} required disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>}
              iconPosition="left" />

            <Input type="email" label={t("registro2.email")} name="email" value={formData.email} onChange={handleChange} required disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>}
              iconPosition="left" />

            <Input type="tel" label={t("registro2.phoneLabel")} name="phone" value={formData.phone} onChange={handleChange} disabled={isLoading}
              helperText={t("registro2.phoneHelper")}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.82l.847 4.235a1 1 0 01-.964 1.144h-2.58a6 6 0 009.552 5.611a1 1 0 01.997 1.752 8 8 0 01-7.552-3.986V19a1 1 0 01-1-1v-2.757l-3.601-1.066A1 1 0 012 13.757V3z" /></svg>}
              iconPosition="left" />

            <Input type="password" label={t("registro2.password")} name="password" value={formData.password} onChange={handleChange} required disabled={isLoading}
              helperText={t("registro2.passwordHelper")}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              iconPosition="left" />

            <Input type="password" label={t("registro2.confirmPassword")} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              iconPosition="left" />

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
                required
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">
                {t("registro2.termsAccept")}{" "}
                <Link href="/terminos" target="_blank" className="text-indigo-600 hover:text-indigo-700 font-semibold underline">
                  {t("registro2.termsLink")}
                </Link>
              </span>
            </label>

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full mt-6">
              {isLoading ? t("registro2.creating") : t("registro2.createBtn")}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm">
            <p className="text-center text-slate-600">
              {t("registro2.haveAccount")}{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">{t("login.signIn")}</Link>
            </p>
            <p className="text-center text-slate-600">
              <Link href="/recoger" className="text-indigo-600 hover:text-indigo-700 font-semibold">{t("registro2.noAccount")}</Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-slate-400 text-xs mt-8">
          <Link href="/terminos" className="hover:text-slate-200 underline">{t("registro2.terms")}</Link>
        </p>
      </div>
    </div>
  );
}
