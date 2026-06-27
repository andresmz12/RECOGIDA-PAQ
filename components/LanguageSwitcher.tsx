"use client";

import { useT } from "@/lib/i18n-context";

export default function LanguageSwitcher() {
  const { lang, setLang } = useT();

  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-150 ${
            lang === l
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
