const statusStyle = {
  new: "bg-slate-100 text-slate-700",
  assigned: "bg-blue-100 text-blue-700",
  "in-progress": "bg-purple-100 text-purple-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${statusStyle[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}
