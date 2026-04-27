const colorMap = {
  high: "border border-red-500/35 bg-red-900/30 text-red-200",
  medium: "border border-amber-500/35 bg-amber-900/25 text-amber-200",
  low: "border border-emerald-500/35 bg-emerald-900/25 text-emerald-200",
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${colorMap[priority] || "border border-slate-500/35 bg-slate-900/30 text-slate-200"}`}>
      {priority}
    </span>
  );
}
