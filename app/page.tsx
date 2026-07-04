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

// Smoothly tweens toward a changing target (used by the live quote price)
function useTweened(target: number, duration = 450) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      setVal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); fromRef.current = target; };
  }, [target, duration]);
  return val;
}

/* ─── Reveal wrapper ─────────────────────────────────────────────── */

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(14px)",
        transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Editorial building blocks ──────────────────────────────────── */

// "/ 01 — SECCIÓN" ruled section header
function SectionRule({ index, label, dark = false }: { index: string; label: string; dark?: boolean }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className={`font-mono text-xs tracking-[0.25em] uppercase ${dark ? "text-accent-400" : "text-accent-600"}`}>
        /{index}
      </span>
      <span className={`font-mono text-xs tracking-[0.25em] uppercase ${dark ? "text-white/50" : "text-slate-500"}`}>
        {label}
      </span>
      <span className={`flex-1 h-px ${dark ? "bg-white/15" : "bg-slate-900/15"}`} />
    </div>
  );
}

// CSS barcode strip
function Barcode({ className = "h-8" }: { className?: string }) {
  return (
    <div
      className={`${className} w-full`}
      style={{
        background:
          "repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 7px, transparent 7px 12px, currentColor 12px 13px, transparent 13px 17px)",
      }}
    />
  );
}

/* ─── Brand mark ─────────────────────────────────────────────────── */

const CargoMark = ({ className = "w-9 h-9" }: { className?: string }) => (
  <div className={`${className} bg-navy-950 flex items-center justify-center relative`}>
    <svg className="w-1/2 h-1/2 text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" strokeWidth={2} />
      <path strokeWidth={2} strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" />
    </svg>
    <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-accent-400" />
  </div>
);

/* ─── Hero: air waybill document ─────────────────────────────────── */

function WaybillCard() {
  return (
    <div className="relative select-none" style={{ animation: "floatCard 7s ease-in-out infinite" }}>
      <div className="bg-[#f6f4ee] text-navy-950 shadow-2xl w-[420px] max-w-full relative border border-navy-950/20">
        {/* corner ticks */}
        <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-accent-500" />
        <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-accent-500" />
        <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-accent-500" />
        <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-accent-500" />

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-navy-950/20">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-navy-950/60">Air Waybill</span>
          <span className="font-mono text-sm font-semibold">OGC-A7B3K9</span>
        </div>

        {/* route */}
        <div className="px-5 py-5 border-b border-dashed border-navy-950/25">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-navy-950/50 mb-1">Origin</p>
              <p className="font-condensed text-4xl font-bold leading-none">MIA</p>
              <p className="font-mono text-[10px] text-navy-950/60 mt-1">Miami, FL — US</p>
            </div>
            <div className="flex-1 px-4 pb-4">
              <div className="relative border-t-2 border-dashed border-navy-950/30">
                <svg className="w-4 h-4 absolute left-1/2 -translate-x-1/2 -top-2.5 text-accent-600 bg-[#f6f4ee]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-navy-950/50 mb-1">Dest</p>
              <p className="font-condensed text-4xl font-bold leading-none">SAP</p>
              <p className="font-mono text-[10px] text-navy-950/60 mt-1">San Pedro Sula — HN</p>
            </div>
          </div>
        </div>

        {/* fields */}
        <div className="grid grid-cols-3 border-b border-navy-950/20 font-mono text-[11px]">
          <div className="px-5 py-3 border-r border-navy-950/20">
            <p className="text-[9px] tracking-[0.2em] uppercase text-navy-950/50 mb-0.5">Peso</p>
            <p className="font-semibold">42 LBS</p>
          </div>
          <div className="px-5 py-3 border-r border-navy-950/20">
            <p className="text-[9px] tracking-[0.2em] uppercase text-navy-950/50 mb-0.5">Caja</p>
            <p className="font-semibold">22×22×22</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[9px] tracking-[0.2em] uppercase text-navy-950/50 mb-0.5">Ventana</p>
            <p className="font-semibold">08–12H</p>
          </div>
        </div>

        {/* status */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-600 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wide uppercase">En ruta al pickup</span>
          </div>
          <span className="font-mono text-[10px] text-navy-950/50">HOY · 09:41</span>
        </div>

        {/* barcode footer */}
        <div className="px-5 pb-4 text-navy-950/80">
          <Barcode className="h-7" />
          <p className="font-mono text-[9px] tracking-[0.35em] text-center mt-1.5 text-navy-950/50">
            *OGC A7B3K9 US-HN*
          </p>
        </div>
      </div>

      {/* stamp */}
      <div
        className="absolute -right-6 top-24 w-24 h-24 rounded-full border-2 border-accent-500/80 flex items-center justify-center rotate-12 pointer-events-none"
        style={{ animation: "floatBadge 8s ease-in-out infinite" }}
      >
        <div className="w-[74px] h-[74px] rounded-full border border-accent-500/60 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-[8px] tracking-[0.2em] text-accent-500 leading-tight">CONFIRMED</span>
          <span className="font-condensed text-accent-500 font-bold text-lg leading-none mt-0.5">OGC</span>
          <span className="font-mono text-[8px] tracking-[0.15em] text-accent-500/80 leading-tight mt-0.5">MIA · LATAM</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Quote data ─────────────────────────────────────────────────── */

const QUOTE_BOXES = [
  { value: "Documento",     labelKey: "quoteBoxDoc", size: "" },
  { value: "Caja 18x18x18", labelKey: "",            size: '18"' },
  { value: "Caja 20x20x20", labelKey: "",            size: '20"' },
  { value: "Caja 22x22x22", labelKey: "",            size: '22"' },
  { value: "Caja 24x24x24", labelKey: "",            size: '24"' },
];

const QUOTE_FALLBACK: Record<string, number> = {
  "Documento": 15,
  "Caja 18x18x18": 35,
  "Caja 20x20x20": 45,
  "Caja 22x22x22": 55,
  "Caja 24x24x24": 65,
};

const DESTINATIONS = [
  { code: "HN", flag: "🇭🇳", name: "Honduras" },
  { code: "GT", flag: "🇬🇹", name: "Guatemala" },
  { code: "SV", flag: "🇸🇻", name: "El Salvador" },
  { code: "NI", flag: "🇳🇮", name: "Nicaragua" },
  { code: "DO", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "PA", flag: "🇵🇦", name: "Panamá" },
  { code: "CR", flag: "🇨🇷", name: "Costa Rica" },
  { code: "VE", flag: "🇻🇪", name: "Venezuela" },
  { code: "MX", flag: "🇲🇽", name: "México" },
  { code: "CO", flag: "🇨🇴", name: "Colombia" },
];

interface QuoteRule {
  country: string;
  packageType: string;
  basePrice: number;
  weightThreshold: number;
  weightRate: number;
}

/* ─── Quote calculator (waybill / receipt style) ─────────────────── */

function QuoteCalculator({ t }: { t: (k: string) => string }) {
  const [rules, setRules] = useState<QuoteRule[]>([]);
  const [box, setBox] = useState("Caja 20x20x20");
  const [weight, setWeight] = useState(10);
  const [dest, setDest] = useState("HN");

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((d) => { if (d.pricing) setRules(d.pricing); })
      .catch(() => {});
  }, []);

  const rule = rules.find((r) => r.country === dest && r.packageType === box);
  const base = rule?.basePrice ?? QUOTE_FALLBACK[box] ?? 45;
  const threshold = rule?.weightThreshold ?? 20;
  const rate = rule?.weightRate ?? 1.0;
  const isDoc = box === "Documento";
  const extra = isDoc ? 0 : Math.max(0, weight - threshold) * rate;
  const price = base + extra;
  const shown = useTweened(price);
  const destName = DESTINATIONS.find((d) => d.code === dest)?.name ?? dest;

  const chip = (active: boolean) =>
    `px-4 py-2.5 border text-sm font-mono transition-colors ${
      active
        ? "border-navy-950 bg-navy-950 text-white"
        : "border-navy-950/25 text-navy-950/70 hover:border-navy-950 hover:text-navy-950 bg-transparent"
    }`;

  return (
    <div className="border border-navy-950/25 bg-white relative">
      {/* corner ticks */}
      <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-navy-950" />
      <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-navy-950" />

      {/* header strip */}
      <div className="flex items-center justify-between px-6 py-3 bg-navy-950 text-white">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase">{t("landing.quoteEyebrow")} — OGC</span>
        <span className="font-mono text-[11px] text-white/50">US → LATAM</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px]">
        {/* Controls */}
        <div className="p-7 md:p-9 space-y-8 border-b lg:border-b-0 lg:border-r border-navy-950/15">
          <div>
            <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-slate-500 mb-3">
              01 · {t("landing.quoteBox")}
            </p>
            <div className="flex flex-wrap gap-2">
              {QUOTE_BOXES.map((b) => (
                <button key={b.value} type="button" onClick={() => setBox(b.value)} className={chip(box === b.value)}>
                  {b.size || t(`landing.${b.labelKey}`)}
                </button>
              ))}
            </div>
          </div>

          {!isDoc && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-slate-500">
                  02 · {t("landing.quoteWeight")}
                </p>
                <span className="font-mono text-sm font-semibold text-navy-950 tabular-nums border border-navy-950/25 px-2.5 py-0.5">
                  {weight} LBS
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                className="w-full accent-navy-950 cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[10px] text-slate-400 mt-1">
                <span>1</span><span>50</span><span>100</span>
              </div>
            </div>
          )}

          <div>
            <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-slate-500 mb-3">
              {isDoc ? "02" : "03"} · {t("landing.quoteDest")}
            </p>
            <div className="flex flex-wrap gap-2">
              {DESTINATIONS.map((d) => (
                <button key={d.code} type="button" onClick={() => setDest(d.code)} className={chip(dest === d.code)}>
                  <span className="mr-1.5">{d.flag}</span>
                  {d.code}
                </button>
              ))}
            </div>
            <p className="font-mono text-[11px] text-slate-500 mt-2">→ {destName}</p>
          </div>
        </div>

        {/* Receipt */}
        <div className="p-7 md:p-9 bg-[#f6f4ee] flex flex-col">
          <p className="font-mono text-[11px] tracking-[0.25em] uppercase text-slate-500 mb-5">
            {t("landing.quoteEstimate")}
          </p>
          <div className="space-y-2 font-mono text-[12px] text-navy-950/80">
            <div className="flex justify-between">
              <span>BASE</span>
              <span className="tabular-nums">${base.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>+LBS</span>
              <span className="tabular-nums">${extra.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-dashed border-navy-950/30 my-4" />
          <div className="flex items-baseline justify-between mb-1">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-navy-950/60">Total</span>
            <span className="font-condensed text-5xl font-bold text-navy-950 tabular-nums leading-none">
              ${shown.toFixed(2)}
            </span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 leading-relaxed mt-2 mb-6">
            {t("landing.quoteDisclaimer")}
          </p>
          <div className="text-navy-950/70 mb-6">
            <Barcode className="h-6" />
          </div>
          <Link
            href="/recoger"
            className="mt-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-500 hover:bg-accent-400 text-navy-950 font-mono text-sm font-semibold uppercase tracking-wider transition-colors"
          >
            {t("landing.quoteCta")} →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ (ruled list) ───────────────────────────────────────────── */

function FaqItem({ n, q, a, open, onToggle }: { n: string; q: string; a: React.ReactNode; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-t border-navy-950/15 last:border-b">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-5 py-5 text-left group">
        <span className="font-mono text-xs text-accent-600 shrink-0">{n}</span>
        <span className="flex-1 font-semibold text-navy-950 text-sm md:text-base group-hover:text-navy-700 transition-colors">
          {q}
        </span>
        <span className={`font-mono text-xl text-navy-950/60 shrink-0 transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      <div className="grid transition-all duration-300 ease-in-out" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <p className="pb-6 pl-10 pr-10 text-sm text-slate-600 leading-relaxed max-w-2xl">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat (ledger column) ───────────────────────────────────────── */

function LedgerStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, inView } = useInView(0.3);
  const count = useCounter(value, inView);
  return (
    <div ref={ref} className="px-6 md:px-10 py-8">
      <p className="font-condensed text-5xl md:text-6xl font-bold text-navy-950 tabular-nums leading-none">
        {count}<span className="text-accent-600">{suffix}</span>
      </p>
      <div className="flex items-center gap-2 mt-3">
        <span className="w-1.5 h-1.5 bg-accent-500" />
        <p className="font-mono text-[11px] tracking-[0.15em] uppercase text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ─── Feature icons ──────────────────────────────────────────────── */

const FEAT_ICONS: Record<string, React.ReactNode> = {
  feat1: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  feat2: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></>,
  feat3: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /><circle cx="12" cy="12" r="9" strokeWidth={1.75} /></>,
  feat4: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  feat5: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
  feat6: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
};

/* ─── Main Page ──────────────────────────────────────────────────── */

export default function Home() {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trackCode, setTrackCode] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const code = trackCode.trim();
    if (code) window.location.href = `/rastreo/${encodeURIComponent(code)}`;
  };

  const navLink = "font-mono text-[12px] tracking-[0.15em] uppercase text-slate-600 hover:text-navy-950 transition-colors";

  return (
    <div className="min-h-screen bg-[#f6f4ee]">
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0) rotate(-0.4deg); }
          50% { transform: translateY(-8px) rotate(0.2deg); }
        }
        @keyframes floatBadge {
          0%, 100% { transform: translateY(0) rotate(12deg); }
          50% { transform: translateY(-5px) rotate(14deg); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee 30s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ── Top ticker ───────────────────────────────────────────── */}
      <div className="bg-navy-950 text-white/60 overflow-hidden border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase">
          <span className="hidden sm:block">MIA 25.76°N 80.19°W</span>
          <span className="text-accent-400">{t("landing.heroBadge")}</span>
          <span className="hidden sm:block">US → LATAM</span>
        </div>
      </div>

      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 bg-[#f6f4ee]/95 backdrop-blur border-b transition-shadow duration-300 ${scrolled ? "border-navy-950/20 shadow-sm" : "border-navy-950/10"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CargoMark className="w-9 h-9" />
            <div className="leading-none">
              <span className="font-condensed font-bold text-lg text-navy-950 tracking-wide uppercase block">O&apos;Globo Cargo</span>
              <span className="font-mono text-[9px] tracking-[0.3em] text-slate-500 uppercase">Intl. Freight</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className={navLink}>{t("landing.navFeatures")}</a>
            <a href="#how" className={navLink}>{t("landing.navHow")}</a>
            <a href="#quote" className={navLink}>{t("landing.navQuote")}</a>
            <a href="#track" className={navLink}>{t("landing.navTrack")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className={`hidden sm:inline ${navLink}`}>
              {t("landing.navLogin")}
            </Link>
            <Link
              href="/recoger"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-navy-950 hover:bg-navy-800 text-white font-mono text-[12px] tracking-[0.1em] uppercase transition-colors"
            >
              {t("landing.navRequest")} →
            </Link>
            <button
              className="md:hidden p-2 hover:bg-navy-950/5 transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-navy-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-navy-950/10 bg-[#f6f4ee] px-6 py-4 space-y-1">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`block py-2.5 ${navLink}`}>{t("landing.navFeatures")}</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className={`block py-2.5 ${navLink}`}>{t("landing.navHow")}</a>
            <a href="#quote" onClick={() => setMobileMenuOpen(false)} className={`block py-2.5 ${navLink}`}>{t("landing.navQuote")}</a>
            <a href="#track" onClick={() => setMobileMenuOpen(false)} className={`block py-2.5 ${navLink}`}>{t("landing.navTrack")}</a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={`block py-2.5 ${navLink}`}>{t("landing.navLogin")}</Link>
            <Link href="/recoger" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center bg-navy-950 text-white font-mono text-[12px] tracking-[0.1em] uppercase py-3 mt-2">
              {t("landing.navRequest")} →
            </Link>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-navy-950">
        {/* hairline grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "none" : "translateY(14px)",
                transition: "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-accent-400 mb-6 flex items-center gap-3">
                <span className="w-8 h-px bg-accent-400 inline-block" />
                MIAMI → LATAM
              </p>

              <h1 className="font-condensed font-bold text-white uppercase leading-[0.95] tracking-tight text-6xl md:text-7xl xl:text-8xl mb-6">
                {t("landing.heroTitleLine1")}<br />
                {t("landing.heroTitleLine2")}{" "}
                <span className="text-accent-400 relative">
                  {t("landing.heroTitleAccent")}
                  <span className="absolute left-0 -bottom-1 w-full h-1.5 bg-accent-500/90" />
                </span>
              </h1>

              <p className="text-navy-100/60 leading-relaxed mb-10 max-w-md text-[15px]">
                {t("landing.heroSubtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/recoger"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-accent-500 hover:bg-accent-400 text-navy-950 font-mono text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors"
                >
                  {t("landing.ctaRequestFree")} →
                </Link>
                <form onSubmit={handleTrack} className="flex flex-1 sm:max-w-xs border border-white/25 focus-within:border-white/60 transition-colors">
                  <input
                    type="text"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    placeholder={t("landing.trackPlaceholder")}
                    className="flex-1 min-w-0 px-4 bg-transparent text-white placeholder-white/30 font-mono text-[12px] uppercase tracking-wider focus:outline-none"
                  />
                  <button type="submit" className="px-4 py-4 text-white/70 hover:text-white font-mono text-[12px] uppercase tracking-[0.1em] transition-colors border-l border-white/25">
                    {t("landing.ctaTrack")}
                  </button>
                </form>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {[t("landing.trust1"), t("landing.trust2"), t("landing.trust3")].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent-400" />
                    <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: waybill */}
            <div
              className="hidden lg:flex justify-center"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "none" : "translateX(14px)",
                transition: "opacity 0.6s ease 150ms, transform 0.6s ease 150ms",
              }}
            >
              <WaybillCard />
            </div>
          </div>
        </div>
        {/* bottom hairline */}
        <div className="border-t border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between font-mono text-[10px] tracking-[0.25em] uppercase text-white/35">
            <span>OGC — International Package Pickup</span>
            <span className="hidden md:block">EST. MIAMI, FL</span>
          </div>
        </div>
      </section>

      {/* ── Stats ledger ─────────────────────────────────────────── */}
      <section className="bg-[#f6f4ee] border-b border-navy-950/15">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-navy-950/15 border-x border-navy-950/15">
          <LedgerStat value={10} suffix="+" label={t("landing.statCountries")} />
          <LedgerStat value={50} suffix="+" label={t("landing.statStates")} />
          <LedgerStat value={24} suffix="/7" label={t("landing.statTracking")} />
          <LedgerStat value={100} suffix="%" label={t("landing.statTrackable")} />
        </div>
      </section>

      {/* ── Track section ────────────────────────────────────────── */}
      <section id="track" className="py-16 bg-[#f6f4ee]">
        <div className="max-w-3xl mx-auto px-6">
          <SectionRule index="01" label={t("landing.trackEyebrow")} />
          <h2 className="font-condensed font-bold text-navy-950 uppercase text-4xl md:text-5xl tracking-tight mb-8">
            {t("landing.trackSectionTitle")}
          </h2>
          <form onSubmit={handleTrack} className="flex border-b-2 border-navy-950">
            <span className="font-mono text-navy-950/40 text-sm self-center pr-3 hidden sm:block">OGC-</span>
            <input
              type="text"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              placeholder={t("landing.trackPlaceholder")}
              className="flex-1 min-w-0 py-4 bg-transparent font-mono text-lg uppercase tracking-widest text-navy-950 placeholder-navy-950/25 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 font-mono text-[12px] uppercase tracking-[0.15em] text-navy-950 hover:bg-navy-950 hover:text-white transition-colors"
            >
              {t("landing.ctaTrack")} →
            </button>
          </form>
        </div>
      </section>

      {/* ── Features ledger ──────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-white border-y border-navy-950/15">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionRule index="02" label={t("landing.featuresEyebrow")} />
            <div className="md:flex md:items-end md:justify-between mb-14">
              <h2 className="font-condensed font-bold text-navy-950 uppercase text-5xl md:text-6xl tracking-tight leading-none">
                {t("landing.featuresTitle")}
              </h2>
              <p className="text-slate-500 text-sm max-w-xs mt-4 md:mt-0 md:text-right">
                {t("landing.featuresSubtitle")}
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 border-t border-navy-950/15">
            {["feat1", "feat2", "feat3", "feat4", "feat5", "feat6"].map((key, i) => (
              <Reveal key={key} delay={(i % 2) * 60}>
                <div className={`group flex gap-5 py-8 pr-6 border-b border-navy-950/15 ${i % 2 === 0 ? "md:border-r md:pr-10" : "md:pl-10"} hover:bg-[#f6f4ee] transition-colors`}>
                  <span className="font-mono text-xs text-accent-600 pt-1 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-condensed font-bold text-navy-950 uppercase text-xl tracking-wide">
                        {t(`landing.${key}Title`)}
                      </h3>
                      <svg className="w-6 h-6 text-navy-950/30 group-hover:text-accent-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {FEAT_ICONS[key]}
                      </svg>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-md">{t(`landing.${key}Desc`)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works: route line ─────────────────────────────── */}
      <section id="how" className="py-20 md:py-28 bg-[#f6f4ee]">
        <div className="max-w-7xl mx-auto px-6">
          <Reveal>
            <SectionRule index="03" label={t("landing.howEyebrow")} />
            <h2 className="font-condensed font-bold text-navy-950 uppercase text-5xl md:text-6xl tracking-tight leading-none mb-3">
              {t("landing.howTitle")}
            </h2>
            <p className="text-slate-500 text-sm mb-16">{t("landing.howSubtitle")}</p>
          </Reveal>

          <div className="relative grid md:grid-cols-3 gap-10 md:gap-8">
            <div className="hidden md:block absolute top-7 h-0 border-t-2 border-dashed border-navy-950/25" style={{ left: "12%", right: "12%" }} />
            {["step1", "step2", "step3"].map((key, i) => (
              <Reveal key={key} delay={i * 100}>
                <div className="relative">
                  <div className={`w-14 h-14 border-2 flex items-center justify-center font-condensed font-bold text-xl mb-6 relative z-10 ${i === 2 ? "bg-accent-500 border-accent-500 text-navy-950" : "bg-navy-950 border-navy-950 text-white"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-slate-400 mb-2">
                    {i === 0 ? "T-0 · ONLINE" : i === 1 ? "PICKUP" : "IN TRANSIT"}
                  </p>
                  <h3 className="font-condensed font-bold text-navy-950 uppercase text-2xl tracking-wide mb-3">
                    {t(`landing.${key}Title`)}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed max-w-xs">{t(`landing.${key}Desc`)}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ────────────────────────────────────────────────── */}
      <section id="quote" className="py-20 md:py-28 bg-white border-y border-navy-950/15">
        <div className="max-w-5xl mx-auto px-6">
          <Reveal>
            <SectionRule index="04" label={t("landing.quoteEyebrow")} />
            <h2 className="font-condensed font-bold text-navy-950 uppercase text-5xl md:text-6xl tracking-tight leading-none mb-3">
              {t("landing.quoteTitle")}
            </h2>
            <p className="text-slate-500 text-sm mb-12 max-w-lg">{t("landing.quoteSubtitle")}</p>
          </Reveal>
          <Reveal delay={100}>
            <QuoteCalculator t={t} />
          </Reveal>
        </div>
      </section>

      {/* ── Destinations ticker ──────────────────────────────────── */}
      <section className="bg-navy-950 py-10 overflow-hidden">
        <p className="text-center font-mono text-[10px] tracking-[0.3em] uppercase text-white/40 mb-6 px-6">
          {t("landing.destTitle")}
        </p>
        <div className="border-y border-white/10 py-4">
          <div className="marquee-track flex w-max items-center">
            {[...DESTINATIONS, ...DESTINATIONS].map((d, i) => (
              <span key={`${d.code}-${i}`} className="flex items-center whitespace-nowrap">
                <span className="font-condensed font-bold uppercase text-white/80 text-2xl tracking-wide px-6">
                  {d.flag} {d.name}
                </span>
                <span className="text-accent-500 font-mono">✈</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 bg-[#f6f4ee]">
        <div className="max-w-3xl mx-auto px-6">
          <Reveal>
            <SectionRule index="05" label={t("landing.faqEyebrow")} />
            <h2 className="font-condensed font-bold text-navy-950 uppercase text-5xl md:text-6xl tracking-tight leading-none mb-12">
              {t("landing.faqTitle")}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <div>
              {[1, 2, 3, 4, 5].map((n, i) => (
                <FaqItem
                  key={n}
                  n={String(n).padStart(2, "0")}
                  q={t(`landing.faq${n}q`)}
                  a={
                    n === 4 ? (
                      <>
                        {t(`landing.faq${n}a`)}{" "}
                        <Link href="/terminos" className="text-navy-950 font-semibold underline hover:text-navy-700">
                          {t("landing.footerTerms")}
                        </Link>
                        .
                      </>
                    ) : (
                      t(`landing.faq${n}a`)
                    )
                  }
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="bg-navy-950 relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -right-8 -bottom-16 font-condensed font-bold uppercase text-white/[0.04] leading-none pointer-events-none select-none"
          style={{ fontSize: "20rem" }}
        >
          OGC
        </span>
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 relative z-10">
          <div className="md:flex md:items-center md:justify-between gap-10">
            <div className="mb-10 md:mb-0">
              <p className="font-mono text-[11px] tracking-[0.3em] uppercase text-accent-400 mb-5 flex items-center gap-3">
                <span className="w-8 h-px bg-accent-400 inline-block" />
                {t("landing.ctaSubtitle")}
              </p>
              <h2 className="font-condensed font-bold text-white uppercase text-5xl md:text-7xl tracking-tight leading-[0.95] max-w-2xl">
                {t("landing.ctaTitle")}
              </h2>
            </div>
            <Link
              href="/recoger"
              className="inline-flex items-center gap-3 px-9 py-5 bg-accent-500 hover:bg-accent-400 text-navy-950 font-mono text-sm font-semibold uppercase tracking-[0.1em] transition-colors shrink-0"
            >
              {t("landing.ctaButton")} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-navy-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <CargoMark className="w-8 h-8" />
            <div className="leading-tight">
              <p className="font-mono text-[11px] text-white/60">&copy; 2025 O&apos;GLOBO CARGO</p>
              <p className="font-mono text-[9px] tracking-[0.25em] text-white/30 uppercase">MIA 25.76°N 80.19°W</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {[
              { href: "/login", label: t("landing.footerPanel") },
              { href: "/recoger", label: t("landing.footerRequest") },
              { href: "/rastreo/demo", label: t("landing.footerTrack") },
              { href: "/terminos", label: t("landing.footerTerms") },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/50 hover:text-accent-400 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
