const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "Pendiente",  className: "bg-amber-100 text-amber-700 border border-amber-200" },
  ASSIGNED:  { label: "Asignado",   className: "bg-blue-100 text-blue-700 border border-blue-200" },
  SCHEDULED: { label: "Programado", className: "bg-violet-100 text-violet-700 border border-violet-200" },
  PICKED_UP: { label: "Recogido",   className: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
  CANCELLED: { label: "Cancelado",  className: "bg-red-100 text-red-700 border border-red-200" },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
