const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  PENDING:   { label: "Pendiente",  className: "bg-amber-50 text-amber-700 border border-amber-200",      dot: "bg-amber-500" },
  ASSIGNED:  { label: "Asignado",   className: "bg-blue-50 text-blue-700 border border-blue-200",         dot: "bg-blue-500" },
  SCHEDULED: { label: "Programado", className: "bg-violet-50 text-violet-700 border border-violet-200",   dot: "bg-violet-500" },
  PICKED_UP: { label: "Recogido",   className: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelado",  className: "bg-red-50 text-red-700 border border-red-200",            dot: "bg-red-400" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700 border border-slate-200",
    dot: "bg-slate-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
