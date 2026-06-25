"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-indigo-600">Gestionar Usuarios</h1>
          <div></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 mb-4">
            La gestión de usuarios se puede implementar aquí. Por ahora, los usuarios deben ser creados directamente en la base de datos o a través de los endpoints de registro.
          </p>
          <p className="text-gray-600">
            Para crear un usuario staff (DISPATCHER o COURIER), usa la base de datos directamente con el role requerido.
          </p>
        </div>
      </div>
    </div>
  );
}
