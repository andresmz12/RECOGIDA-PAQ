"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

export default function DebugPasswordPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [newPassword, setNewPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/debug/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error resetting password");
        return;
      }

      setResult(data);
    } catch (err) {
      setError("Error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug: Reset Password</h1>
        <p className="text-gray-600 mb-6 text-sm">Resetear contraseña de usuario (desarrollo)</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del usuario
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold transition"
          >
            {loading ? "Reseteando..." : "Resetear Contraseña"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <p className="font-semibold mb-2">✅ {result.message}</p>
            <p><strong>Email:</strong> {result.user.email}</p>
            <p><strong>Nueva contraseña:</strong> {result.newPassword}</p>
            <p className="mt-3 text-xs text-gray-600">
              Ahora puedes ingresar con esta contraseña en <a href="/login" className="underline">/login</a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
