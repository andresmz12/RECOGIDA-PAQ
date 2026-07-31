"use client";

import { useT } from "@/lib/i18n-context";

// Square "stamp" tag — white fill, colored rule + mono label — instead of a
// solid-fill pill, so status reads like a customs/manifest mark rather than
// a generic SaaS badge.
const STATUS_STYLE: Record<string, { className: string; dot: string }> = {
  DRAFT:     { className: "border-slate-300 text-slate-500",   dot: "bg-slate-400" },
  PENDING:   { className: "border-amber-300 text-amber-700",   dot: "bg-amber-500" },
  ASSIGNED:  { className: "border-blue-300 text-blue-700",     dot: "bg-blue-500" },
  SCHEDULED: { className: "border-navy-300 text-navy-700",     dot: "bg-navy-500" },
  EN_CAMINO: { className: "border-accent-400 text-accent-700", dot: "bg-accent-500" },
  PICKED_UP: { className: "border-emerald-300 text-emerald-700", dot: "bg-emerald-500" },
  CANCELLED: { className: "border-red-300 text-red-700",       dot: "bg-red-500" },
};

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const style = STATUS_STYLE[status] ?? {
    className: "border-slate-300 text-slate-600",
    dot: "bg-slate-400",
  };
  const label = t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border ${style.className} font-mono text-[11px] font-semibold uppercase tracking-wider`}>
      <span className={`w-1.5 h-1.5 shrink-0 ${style.dot}`} />
      {label}
    </span>
  );
}
