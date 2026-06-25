"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // Show the actual error code to help diagnose issues
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-indigo-600 mb-8">O&#39;Globo Cargo</h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              placeholder="tu@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
          <p className="font-semibold text-gray-700 mb-2">Usuarios de prueba (contraseña: password123):</p>
          <p className="text-gray-600">admin@example.com</p>
          <p className="text-gray-600">dispatcher@example.com</p>
          <p className="text-gray-600">courier@example.com</p>
          <p className="text-gray-600">customer@example.com</p>
        </div>

        <p className="text-center text-gray-600 mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Regístrate aquí
          </Link>
        </p>

        <p className="text-center text-gray-600 mt-4">
          <Link href="/recoger" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Solicitar recogida sin cuenta
          </Link>
        </p>

        <p className="text-center text-gray-600 mt-4 text-sm">
          <Link href="/setup" className="text-gray-500 hover:text-gray-700 underline">
            Setup inicial (crear primer admin)
          </Link>
        </p>
      </div>
    </div>
  );
}
