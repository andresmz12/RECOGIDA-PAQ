"use client";

import { useT } from "@/lib/i18n-context";

const STATUS_STYLE: Record<string, { className: string; dot: string }> = {
  PENDING:   { className: "bg-amber-50 text-amber-700 border border-amber-200",       dot: "bg-amber-500" },
  ASSIGNED:  { className: "bg-blue-50 text-blue-700 border border-blue-200",          dot: "bg-blue-500" },
  SCHEDULED: { className: "bg-indigo-50 text-indigo-700 border border-indigo-200",    dot: "bg-indigo-500" },
  EN_CAMINO: { className: "bg-violet-50 text-violet-700 border border-violet-200",    dot: "bg-violet-500" },
  PICKED_UP: { className: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { className: "bg-red-50 text-red-700 border border-red-200",             dot: "bg-red-400" },
};

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const style = STATUS_STYLE[status] ?? {
    className: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-400",
  };
  const label = t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {label}
    </span>
  );
}
