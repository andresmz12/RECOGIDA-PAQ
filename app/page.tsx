import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <nav className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xs">OG</span>
            </div>
            <span className="font-bold text-lg">O&apos;Globo Cargo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Iniciar sesión
            </Link>
            <Link href="/recoger" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-900">
              Solicitar Recogida
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-950 border border-indigo-800 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Logística internacional simplificada
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
          Recogemos tu paquete{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            donde estés
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Solicita la recogida de tus envíos internacionales en segundos.
          Seguimiento en tiempo real, notificaciones automáticas y couriers verificados.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/recoger"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-2xl shadow-indigo-900 hover:scale-105"
          >
            Solicitar Recogida Gratis →
          </Link>
          <Link href="/rastreo/demo" className="text-slate-400 hover:text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-colors border border-slate-700 hover:border-slate-500">
            Rastrear Envío
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: "10K+", label: "Paquetes recogidos" },
            { value: "50+", label: "Ciudades" },
            { value: "99.2%", label: "Tasa de éxito" },
            { value: "< 24h", label: "Tiempo de respuesta" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-widest mb-4">Por qué elegirnos</p>
        <h2 className="text-3xl md:text-4xl font-black text-center mb-16">Todo lo que necesitas para enviar</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🚀",
              color: "from-indigo-500/10 to-violet-500/10 border-indigo-800",
              title: "Solicitud en 2 minutos",
              desc: "Formulario simple. Sin cuentas obligatorias. Recibe tu código de seguimiento al instante.",
            },
            {
              icon: "📍",
              color: "from-amber-500/10 to-orange-500/10 border-amber-900",
              title: "Rastreo en tiempo real",
              desc: "Sigue cada paso de tu recogida con actualizaciones automáticas por email.",
            },
            {
              icon: "🌍",
              color: "from-emerald-500/10 to-green-500/10 border-emerald-900",
              title: "Cobertura internacional",
              desc: "Enviamos a más de 50 países. Couriers verificados y seguros en cada destino.",
            },
            {
              icon: "⚡",
              color: "from-blue-500/10 to-cyan-500/10 border-blue-900",
              title: "Asignación automática",
              desc: "Nuestro sistema asigna el courier más cercano disponible automáticamente.",
            },
            {
              icon: "🔒",
              color: "from-violet-500/10 to-purple-500/10 border-violet-900",
              title: "100% Seguro",
              desc: "Todos los envíos están asegurados. Manejo profesional garantizado.",
            },
            {
              icon: "💬",
              color: "from-rose-500/10 to-pink-500/10 border-rose-900",
              title: "Soporte 24/7",
              desc: "Nuestro equipo está disponible en todo momento para ayudarte.",
            },
          ].map((f) => (
            <div key={f.title} className={`bg-gradient-to-br ${f.color} border rounded-2xl p-6`}>
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-800/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl md:text-4xl font-black text-center mb-4">¿Cómo funciona?</h2>
          <p className="text-slate-400 text-center mb-16">Tres pasos simples para enviar tu paquete</p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Solicita", desc: "Completa el formulario con los datos de tu paquete y dirección de recogida." },
              { step: "02", title: "Confirmamos", desc: "Recibes tu código de rastreo por email y asignamos un courier." },
              { step: "03", title: "Recogemos", desc: "El courier llega a tu puerta en la fecha y hora programada." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white/40 mb-4 shadow-xl shadow-indigo-900">
                  {s.step}
                </div>
                <h3 className="font-bold text-white text-xl mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-black mb-6">
          ¿Listo para enviar?
        </h2>
        <p className="text-slate-400 text-lg mb-8">Sin registro. Sin complicaciones. Solo envía.</p>
        <Link
          href="/recoger"
          className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-all shadow-2xl shadow-indigo-900 hover:scale-105"
        >
          Solicitar mi primera recogida →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">&copy; 2025 O&apos;Globo Cargo. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-slate-500 hover:text-white text-sm transition-colors">Panel de Control</Link>
            <Link href="/recoger" className="text-slate-500 hover:text-white text-sm transition-colors">Solicitar Recogida</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
