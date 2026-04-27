const statusStyle = {
  new: "border border-slate-500/35 bg-slate-900/30 text-slate-200",
  assigned: "border border-blue-500/35 bg-blue-900/30 text-blue-200",
  "in-progress": "border border-violet-500/35 bg-violet-900/30 text-violet-200",
  resolved: "border border-emerald-500/35 bg-emerald-900/25 text-emerald-200",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase tracking-wide ${statusStyle[status] || "border border-slate-500/35 bg-slate-900/30 text-slate-200"}`}>
      {status}
    </span>
  );
}
