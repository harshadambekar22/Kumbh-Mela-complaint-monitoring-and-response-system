const colorMap = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded ${colorMap[priority] || "bg-gray-100 text-gray-700"}`}>
      {priority}
    </span>
  );
}
