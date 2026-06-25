"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Button from "@/components/Button";
import Input from "@/components/Form/Input";
import Alert from "@/components/Alert";
import Card from "@/components/Card";

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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result) {
        setError("Sin respuesta del servidor. Intenta de nuevo.");
        setIsLoading(false);
        return;
      }

      if (result.error) {
        if (result.error === "CredentialsSignin") {
          setError("Email o contraseña inválidos");
        } else {
          setError(`Error: ${result.error}`);
        }
        setIsLoading(false);
        return;
      }

      if (result.ok) {
        window.location.href = "/dashboard";
        return;
      }

      setError(`Estado inesperado: ok=${result.ok} status=${result.status}`);
      setIsLoading(false);
    } catch (err) {
      setError("Error: " + (err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg mb-4">
            <span className="text-white font-black text-lg">OG</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">O&apos;Globo Cargo</h1>
          <p className="text-indigo-200 text-sm">Logística internacional simplificada</p>
        </div>

        {/* Main card */}
        <Card variant="default" padding="lg" className="bg-white/95 backdrop-blur border-white/20 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido</h2>
            <p className="text-slate-600 text-sm mt-1">Inicia sesión en tu cuenta</p>
          </div>

          {error && (
            <div className="mb-6">
              <Alert
                type="error"
                title="Error de autenticación"
                message={error}
                dismissible
                onDismiss={() => setError("")}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="Email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              icon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              }
              iconPosition="left"
            />

            <div>
              <Input
                type={showPassword ? "text" : "password"}
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                icon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                }
                iconPosition="right"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full mt-6"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3 text-sm">
            <p className="text-center text-slate-600">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Regístrate aquí
              </Link>
            </p>
            <p className="text-center text-slate-600">
              <Link href="/recoger" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Solicitar recogida sin cuenta
              </Link>
            </p>
          </div>
        </Card>

        {/* Test credentials */}
        <Card variant="filled" padding="md" className="mt-6 border-indigo-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Usuarios de prueba (contraseña: password123)</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <code className="text-indigo-600 font-mono">admin@example.com</code>
              <span className="text-slate-500">ADMIN</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <code className="text-amber-600 font-mono">dispatcher@example.com</code>
              <span className="text-slate-500">DISPATCHER</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <code className="text-blue-600 font-mono">courier@example.com</code>
              <span className="text-slate-500">COURIER</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <code className="text-green-600 font-mono">customer@example.com</code>
              <span className="text-slate-500">CUSTOMER</span>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-8">
          <Link href="/setup" className="hover:text-slate-300 underline">
            Setup inicial
          </Link>
          <span className="mx-2">•</span>
          <span>© 2025 O&apos;Globo Cargo</span>
        </p>
      </div>
    </div>
  );
}
