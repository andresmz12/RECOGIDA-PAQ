"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n-context";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useT();

  useEffect(() => {
    console.error("[app] unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="font-mono text-xs tracking-[0.3em] uppercase text-accent-400 mb-4">
          /500 — ERROR
        </p>
        <h1 className="font-condensed text-5xl md:text-6xl font-bold text-white mb-4 leading-none">
          {t("errorPage.title")}
        </h1>
        <p className="text-navy-200/70 mb-10">{t("errorPage.desc")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-accent-500 hover:bg-accent-400 text-navy-950 font-bold text-sm transition-colors"
          >
            {t("errorPage.retry")}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-white/25 hover:border-white/60 text-white font-semibold text-sm transition-colors"
          >
            {t("errorPage.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
