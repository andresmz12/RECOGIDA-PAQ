import Link from "next/link";
import Button from "@/components/Button";
import Container from "@/components/Container";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <Container>
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">OG</span>
              </div>
              <span className="font-bold text-lg text-slate-900 font-display">O&apos;Globo Cargo</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/recoger">
                <Button variant="primary" size="md">
                  Solicitar Recogida
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <Container>
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Logística internacional simplificada
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-6 leading-tight">
              Recogemos tu paquete{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                donde estés
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Solicita la recogida de tus envíos internacionales en segundos. Seguimiento en tiempo real, notificaciones automáticas y couriers verificados.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/recoger">
                <Button variant="primary" size="lg">
                  Solicitar Recogida Gratis →
                </Button>
              </Link>
              <Link href="/rastreo/demo">
                <Button variant="outline" size="lg">
                  Rastrear Envío
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 bg-slate-900 text-white">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "10K+", label: "Paquetes recogidos" },
              { value: "50+", label: "Ciudades" },
              { value: "99.2%", label: "Tasa de éxito" },
              { value: "< 24h", label: "Tiempo de respuesta" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-widest mb-4">Por qué elegirnos</p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              Todo lo que necesitas para enviar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🚀",
                title: "Solicitud en 2 minutos",
                desc: "Formulario simple. Sin cuentas obligatorias. Recibe tu código de seguimiento al instante.",
              },
              {
                icon: "📍",
                title: "Rastreo en tiempo real",
                desc: "Sigue cada paso de tu recogida con actualizaciones automáticas por email.",
              },
              {
                icon: "🌍",
                title: "Cobertura internacional",
                desc: "Enviamos a más de 50 países. Couriers verificados y seguros en cada destino.",
              },
              {
                icon: "⚡",
                title: "Asignación automática",
                desc: "Nuestro sistema asigna el courier más cercano disponible automáticamente.",
              },
              {
                icon: "🔒",
                title: "100% Seguro",
                desc: "Todos los envíos están asegurados. Manejo profesional garantizado.",
              },
              {
                icon: "💬",
                title: "Soporte 24/7",
                desc: "Nuestro equipo está disponible en todo momento para ayudarte.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-24 md:py-32 bg-slate-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">¿Cómo funciona?</h2>
            <p className="text-lg text-slate-600">Tres pasos simples para enviar tu paquete</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Solicita", desc: "Completa el formulario con los datos de tu paquete y dirección de recogida." },
              { step: "02", title: "Confirmamos", desc: "Recibes tu código de rastreo por email y asignamos un courier." },
              { step: "03", title: "Recogemos", desc: "El courier llega a tu puerta en la fecha y hora programada." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-2xl font-black text-white mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <Container size="md">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
              ¿Listo para enviar?
            </h2>
            <p className="text-xl text-slate-600 mb-10">
              Sin registro. Sin complicaciones. Solo envía.
            </p>
            <Link href="/recoger">
              <Button variant="primary" size="lg">
                Solicitar mi primera recogida →
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <Container>
          <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">
              &copy; 2025 O&apos;Globo Cargo. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
                Panel de Control
              </Link>
              <Link href="/recoger" className="text-slate-600 hover:text-slate-900 text-sm transition-colors">
                Solicitar Recogida
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
