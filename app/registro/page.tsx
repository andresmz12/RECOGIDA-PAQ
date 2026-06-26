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

function validateUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits[0] === "1");
}

export default function RegistroPage() {
  const router = useRouter();
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

    if (!formData.name.trim()) { setError("Full name is required."); return; }
    if (!formData.email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (formData.phone && !validateUSPhone(formData.phone)) {
      setError("Please enter a valid US phone number (e.g. (555) 123-4567)."); return;
    }
    if (formData.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password, name: formData.name, phone: formData.phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed."); setIsLoading(false); return; }

      setSuccess("Account created! Signing you in...");
      const signInResult = await signIn("credentials", { email: formData.email, password: formData.password, redirect: false });
      setTimeout(() => {
        if (!signInResult || !signInResult.ok) router.push("/login?registered=1");
        else router.push("/mi-cuenta");
      }, 1500);
    } catch {
      setError("An error occurred. Please try again.");
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg mb-4">
            <span className="text-white font-black text-lg">OG</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">O&apos;Globo Cargo</h1>
          <p className="text-indigo-200 text-sm">Create your customer account</p>
        </div>

        <Card variant="default" padding="lg" className="bg-white/95 backdrop-blur border-white/20 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
            <p className="text-slate-600 text-sm mt-1">Sign up to track your shipments</p>
          </div>

          {success && <div className="mb-6"><Alert type="success" title="Account created!" message={success} /></div>}
          {error && <div className="mb-6"><Alert type="error" title="Registration error" message={error} dismissible onDismiss={() => setError("")} /></div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input type="text" label="Full name" name="name" placeholder="Jane Doe" value={formData.name} onChange={handleChange} required disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>}
              iconPosition="left" />

            <Input type="email" label="Email" name="email" placeholder="you@email.com" value={formData.email} onChange={handleChange} required disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>}
              iconPosition="left" />

            <Input type="tel" label="Phone number (optional)" name="phone" placeholder="(555) 123-4567" value={formData.phone} onChange={handleChange} disabled={isLoading}
              helperText="US phone number"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.82l.847 4.235a1 1 0 01-.964 1.144h-2.58a6 6 0 009.552 5.611a1 1 0 01.997 1.752 8 8 0 01-7.552-3.986V19a1 1 0 01-1-1v-2.757l-3.601-1.066A1 1 0 012 13.757V3z" /></svg>}
              iconPosition="left" />

            <Input type="password" label="Password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required disabled={isLoading}
              helperText="Minimum 6 characters"
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              iconPosition="left" />

            <Input type="password" label="Confirm password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading}
              icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
              iconPosition="left" />

            <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full mt-6">
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm">
            <p className="text-center text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">Sign in</Link>
            </p>
            <p className="text-center text-slate-600">
              <Link href="/recoger" className="text-indigo-600 hover:text-indigo-700 font-semibold">Continue without an account</Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-slate-400 text-xs mt-8">By creating an account, you agree to our terms of service.</p>
      </div>
    </div>
  );
}
