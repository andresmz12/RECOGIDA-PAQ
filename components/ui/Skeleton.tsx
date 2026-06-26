export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
  );
}

export function SkeletonTableRow({ cols = 7 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="animate-pulse">
            <div className="h-3 bg-slate-200 rounded-full w-full" />
            {i === 1 && <div className="h-2.5 bg-slate-100 rounded-full w-2/3 mt-2" />}
          </div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        <div className="w-10 h-5 bg-slate-100 rounded-full" />
      </div>
      <div className="h-9 w-14 bg-slate-200 rounded-lg mb-2" />
      <div className="h-3 w-24 bg-slate-100 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded-full w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-slate-100 rounded-full mb-2"
          style={{ width: `${100 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
