"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/* ─── Hooks ─────────────────────────────────────────────────────── */

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useCounter(target: number, active: boolean, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return val;
}

/* ─── Reusable reveal wrapper ────────────────────────────────────── */

function Reveal({
  children,
  className = "",
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const { ref, inView } = useInView();
  const translate =
    from === "left" ? "translateX(-20px)"
    : from === "right" ? "translateX(20px)"
    : "translateY(20px)";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : translate,
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Animated stat counter ─────────────────────────────────────── */

function StatCounter({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const { ref, inView } = useInView(0.3);
  const count = useCounter(value, inView);
  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-extrabold text-accent-400 mb-1.5 tabular-nums tracking-tight">
        {count}{suffix}
      </p>
      <p className="text-navy-200/70 text-sm">{label}</p>
    </div>
  );
}

/* ─── Brand globe mark ───────────────────────────────────────────── */

const GlobeMark = ({ className = "w-9 h-9" }: { className?: string }) => (
  <div className={`${className} bg-navy-700 rounded-xl flex items-center justify-center shadow-md ring-1 ring-white/10`}>
    <svg className="w-1/2 h-1/2 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeWidth={2} strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
    </svg>
  </div>
);

/* ─── Feature icons ──────────────────────────────────────────────── */

const IconBolt = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconGlobe = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);
const IconShield = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconBell = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
const IconChat = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const FEATURES = [
  { icon: <IconBolt />,   color: "from-accent-400 to-accent-600",  key: "feat1" },
  { icon: <IconMap />,    color: "from-navy-500 to-navy-700",      key: "feat2" },
  { icon: <IconGlobe />,  color: "from-emerald-500 to-teal-600",   key: "feat3" },
  { icon: <IconShield />, color: "from-sky-500 to-cyan-600",       key: "feat4" },
  { icon: <IconBell />,   color: "from-navy-400 to-navy-600",      key: "feat5" },
  { icon: <IconChat />,   color: "from-slate-500 to-slate-700",    key: "feat6" },
];

/* ─── Hero mockup card ───────────────────────────────────────────── */

function TrackingMockup() {
  return (
    <div className="relative select-none">
      {/* Main tracking card */}
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 relative z-10 border border-slate-100"
        style={{ animation: "floatCard 6s ease-in-out infinite" }}
      >
        <div className="flex items-center justify-between mb-5">
          <span className="font-mono font-bold text-navy-700 text-sm bg-navy-50 px-3 py-1.5 rounded-lg tracking-wide">
            OGC-A7B3K9
          </span>
          <span className="text-xs text-slate-400">Hace 2 horas</span>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 bg-navy-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">Envío Internacional</p>
            <p className="text-xs text-slate-500 mt-0.5">Miami, FL → Bogotá, Colombia</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-4">
          {["Pendiente", "Asignado", "Programado", "Recogido"].map((s, i) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full ${i < 3 ? "bg-navy-600" : "bg-slate-200"}`}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mb-5">
          <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
          <p className="text-sm font-semibold text-slate-700">Programado — Mañana 10:00–13:00</p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
            JP
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Juan Pérez · Courier asignado</p>
            <p className="text-xs text-slate-400">+1 (305) 555-0192</p>
          </div>
        </div>
      </div>

      {/* Notification badge — top right */}
      <div
        className="absolute -top-4 -right-4 bg-emerald-500 rounded-xl shadow-xl px-3.5 py-2.5 flex items-center gap-2 z-20 border border-emerald-400"
        style={{ animation: "floatBadge 7s ease-in-out infinite", animationDelay: "1.2s" }}
      >
        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-xs leading-tight">Recogida confirmada</p>
          <p className="text-emerald-100 text-xs">OGC-F2D5M1 · hace 5 min</p>
        </div>
      </div>

      {/* Mini status card — bottom left */}
      <div
        className="absolute -bottom-3 -left-6 bg-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-2.5 z-20 border border-slate-100"
        style={{ animation: "floatBadge 8s ease-in-out infinite", animationDelay: "0.6s" }}
      >
        <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">3 recogidas hoy</p>
          <p className="text-xs text-slate-400">1 pendiente de asignar</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────── */

export default function Home() {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackCode, setTrackCode] = useState("");
  useEffect(() => setMounted(true), []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackCode.trim();
    if (code) window.location.href = `/rastreo/${encodeURIComponent(code)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(-0.3deg); }
          50% { transform: translateY(-10px) rotate(0.3deg); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes orbMove {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          33% { transform: translate(40px, -30px) scale(1.08); opacity: 0.65; }
          66% { transform: translate(-15px, 20px) scale(0.95); opacity: 0.55; }
        }
        @keyframes orbMove2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          50% { transform: translate(-35px, 25px) scale(1.12); opacity: 0.35; }
        }
      `}</style>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GlobeMark className="w-9 h-9" />
            <span className="font-display font-bold text-base text-navy-900 tracking-tight">O&apos;Globo Cargo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-navy-700 text-sm font-medium transition-colors">{t("landing.navFeatures")}</a>
            <a href="#how" className="text-slate-600 hover:text-navy-700 text-sm font-medium transition-colors">{t("landing.navHow")}</a>
            <a href="#track" className="text-slate-600 hover:text-navy-700 text-sm font-medium transition-colors">{t("landing.navTrack")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:inline text-slate-600 hover:text-navy-700 text-sm font-semibold transition-colors">
              {t("landing.navLogin")}
            </Link>
            <Link
              href="/recoger"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              {t("landing.navRequest")}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {/* Hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-2">{t("landing.navFeatures")}</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-2">{t("landing.navHow")}</a>
            <a href="#track" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-2">{t("landing.navTrack")}</a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-2">{t("landing.navLogin")}</Link>
            <Link href="/recoger" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center bg-navy-700 text-white font-semibold py-2.5 rounded-lg">{t("landing.navRequest")}</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 md:py-32"
        style={{ background: "linear-gradient(135deg, #0c1b2e 0%, #142b45 55%, #0d2240 100%)" }}
      >
        {/* Animated glow orbs */}
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(45,98,155,0.55) 0%, transparent 70%)",
            animation: "orbMove 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(245,165,36,0.22) 0%, transparent 70%)",
            animation: "orbMove2 25s ease-in-out infinite",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "none" : "translateY(16px)",
                transition: "opacity 0.7s ease, transform 0.7s ease",
              }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 text-white/80 px-4 py-1.5 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                {t("landing.heroBadge")}
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight">
                {t("landing.heroTitleLine1")}<br />
                {t("landing.heroTitleLine2")}{" "}
                <span className="text-accent-400">{t("landing.heroTitleAccent")}</span>
              </h1>

              <p className="text-lg text-navy-100/70 leading-relaxed mb-10 max-w-lg">
                {t("landing.heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/recoger"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-accent-500 hover:bg-accent-400 text-navy-950 font-bold rounded-xl transition-all shadow-lg shadow-accent-900/30 hover:shadow-xl text-sm"
                >
                  {t("landing.ctaRequestFree")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              {/* Tracking search */}
              <form onSubmit={handleTrack} className="flex gap-2 mb-10 max-w-sm">
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder={t("landing.trackPlaceholder")}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold rounded-xl transition-all text-sm"
                >
                  {t("landing.ctaTrack")}
                </button>
              </form>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                {[t("landing.trust1"), t("landing.trust2"), t("landing.trust3")].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-white/60">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: floating mockup */}
            <div
              className="hidden lg:flex justify-center items-center"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "none" : "translateX(16px)",
                transition: "opacity 0.7s ease 200ms, transform 0.7s ease 200ms",
              }}
            >
              <TrackingMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Track section ────────────────────────────────────────── */}
      <section id="track" className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-navy-600 mb-3">{t("landing.trackEyebrow")}</p>
          <h2 className="text-2xl font-extrabold text-navy-900 mb-6">{t("landing.trackSectionTitle")}</h2>
          <form onSubmit={handleTrack} className="flex gap-2">
            <input
              type="text"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              placeholder={t("landing.trackPlaceholder")}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl transition-colors text-sm"
            >
              {t("landing.ctaTrack")}
            </button>
          </form>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-navy-600 text-xs font-bold uppercase tracking-widest mb-4">{t("landing.featuresEyebrow")}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy-900 mb-4 tracking-tight">
              {t("landing.featuresTitle")}
            </h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">
              {t("landing.featuresSubtitle")}
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.key} delay={i * 80}>
                <div className="group bg-white border border-slate-200 hover:border-navy-200 hover:shadow-lg hover:shadow-navy-50 rounded-2xl p-6 transition-all duration-300 h-full">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} text-white mb-5 shadow-sm`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-bold text-navy-900 mb-2">{t(`landing.${f.key}Title`)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(`landing.${f.key}Desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how" className="py-24 md:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal className="text-center mb-16">
            <p className="text-navy-600 text-xs font-bold uppercase tracking-widest mb-4">{t("landing.howEyebrow")}</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-navy-900 mb-4 tracking-tight">{t("landing.howTitle")}</h2>
            <p className="text-lg text-slate-600">{t("landing.howSubtitle")}</p>
          </Reveal>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 h-px border-t-2 border-dashed border-navy-200" style={{ left: "16.67%", right: "16.67%" }} />

            {[
              { step: "01", key: "step1", color: "from-navy-600 to-navy-800" },
              { step: "02", key: "step2", color: "from-navy-500 to-navy-700" },
              { step: "03", key: "step3", color: "from-accent-500 to-accent-600" },
            ].map((item, i) => (
              <Reveal key={item.step} delay={i * 120}>
                <div className="flex flex-col items-center text-center relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-xl font-extrabold text-white mb-6 shadow-lg relative z-10`}>
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-3">{t(`landing.${item.key}Title`)}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-xs">{t(`landing.${item.key}Desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Reveal>
            <div
              className="rounded-3xl p-12 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #142b45, #0c1b2e)" }}
            >
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(245,165,36,0.28) 0%, transparent 70%)" }}
              />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
                  {t("landing.ctaTitle")}
                </h2>
                <p className="text-navy-100/70 text-lg mb-8">
                  {t("landing.ctaSubtitle")}
                </p>
                <Link
                  href="/recoger"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-accent-500 hover:bg-accent-400 text-navy-950 font-bold rounded-xl transition-all shadow-xl text-sm"
                >
                  {t("landing.ctaButton")}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <GlobeMark className="w-7 h-7" />
            <p className="text-slate-500 text-sm">&copy; 2025 O&apos;Globo Cargo</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-slate-500 hover:text-navy-700 text-sm transition-colors">
              {t("landing.footerPanel")}
            </Link>
            <Link href="/recoger" className="text-slate-500 hover:text-navy-700 text-sm transition-colors">
              {t("landing.footerRequest")}
            </Link>
            <Link href="/rastreo/demo" className="text-slate-500 hover:text-navy-700 text-sm transition-colors">
              {t("landing.footerTrack")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
