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
import { useLang, LangToggle } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // Accept US (10 or 11 digits starting with 1) and international (7–15 digits)
  return digits.length >= 7 && digits.length <= 15;
}

export default function RegistroPage() {
  const router = useRouter();
  const { lang } = useLang();

  const [formData, setFormData] = useState({
    email: "", password: "", confirmPassword: "", name: "", phone: "",
  });
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

    if (!formData.name.trim()) { setError(t(lang, "register.error.name")); return; }
    if (!formData.email.includes("@")) { setError(t(lang, "register.error.email")); return; }
    if (formData.phone && !validatePhone(formData.phone)) {
      setError(t(lang, "register.error.phone")); return;
    }
    if (formData.password.length < 6) { setError(t(lang, "register.error.passwordShort")); return; }
    if (formData.password !== formData.confirmPassword) {
      setError(t(lang, "register.error.passwordMatch")); return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t(lang, "register.error.failed"));
        setIsLoading(false);
        return;
      }

      setSuccess(t(lang, "register.success"));

      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push("/mi-cuenta");
      } else {
        // Auto-login failed — send to login with success flag
        router.push("/login?registered=1");
      }
    } catch {
      setError(t(lang, "common.error.connection"));
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col items-center flex-1">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg mb-4">
              <span className="text-white font-black text-lg">OG</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">O&apos;Globo Cargo</h1>
            <p className="text-indigo-200 text-sm">{t(lang, "register.heading")}</p>
          </div>
          <div className="absolute top-0 right-0">
            <LangToggle className="border-white/20 text-white hover:bg-white/10" />
          </div>
        </div>

        <Card variant="default" padding="lg" className="bg-white/95 backdrop-blur border-white/20 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{t(lang, "register.title")}</h2>
            <p className="text-slate-600 text-sm mt-1">{t(lang, "register.subtitle")}</p>
          </div>

          {success && (
            <div className="mb-6">
              <Alert type="success" title={t(lang, "register.success.title")} message={success} />
            </div>
          )}
          {error && (
            <div className="mb-6">
              <Alert
                type="error"
                title={t(lang, "register.error.title")}
                message={error}
                dismissible
                onDismiss={() => setError("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text"
              label={t(lang, "common.fullName")}
              name="name"
              placeholder={lang === "en" ? "Jane Doe" : "María López"}
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>}
              iconPosition="left"
            />

            <Input
              type="email"
              label={t(lang, "common.email")}
              name="email"
              placeholder={lang === "en" ? "you@email.com" : "tu@correo.com"}
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>}
              iconPosition="left"
            />

            <Input
              type="tel"
              label={`${t(lang, "common.phone")} (${t(lang, "common.optional")})`}
              name="phone"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              helperText={t(lang, "register.phoneHelper")}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.82l.847 4.235a1 1 0 01-.964 1.144h-2.58a6 6 0 009.552 5.611a1 1 0 01.997 1.752 8 8 0 01-7.552-3.986V19a1 1 0 01-1-1v-2.757l-3.601-1.066A1 1 0 012 13.757V3z" /></svg>}
              iconPosition="left"
            />

            <Input
              type="password"
              label={t(lang, "common.password")}
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
              helperText={t(lang, "register.passwordHelper")}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              iconPosition="left"
            />

            <Input
              type="password"
              label={t(lang, "register.confirmPassword")}
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              iconPosition="left"
            />

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full mt-6">
              {isLoading ? t(lang, "register.submitting") : t(lang, "register.submit")}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm">
            <p className="text-center text-slate-600">
              {t(lang, "register.haveAccount")}{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                {t(lang, "common.signIn")}
              </Link>
            </p>
            <p className="text-center text-slate-600">
              <Link href="/recoger" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                {t(lang, "register.noAccount")}
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-slate-400 text-xs mt-8">{t(lang, "register.terms")}</p>
      </div>
    </div>
  );
}
