import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">O'Globo Cargo</h1>
            <div className="space-x-4">
              <Link href="/login" className="text-indigo-600 hover:text-indigo-800">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Solicita la recogida de tu paquete
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Rápido, seguro y confiable. Nosotros nos encargamos del resto.
          </p>
          <Link
            href="/recoger"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700"
          >
            Solicitar Recogida
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">Fácil de usar</h3>
            <p className="text-gray-600">Completa tu solicitud en menos de 5 minutos desde cualquier dispositivo.</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-3xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Rastreo en tiempo real</h3>
            <p className="text-gray-600">Monitorea el estado de tu solicitud con tu código de seguimiento único.</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2">Confiable</h3>
            <p className="text-gray-600">Confía en nuestro equipo profesional de logística internacional.</p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 O'Globo Cargo. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
