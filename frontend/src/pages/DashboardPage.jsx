import { useMemo } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function StatCard({ title, value, accent }) {
  return (
    <div className="card-lift rounded-xl border border-white/70 bg-white/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`text-3xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

const PHOTO_STRIP = [
  "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?auto=format&fit=crop&w=1000&q=80",
  "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?auto=format&fit=crop&w=1000&q=80",
];

export default function DashboardPage({ complaints, analytics, alerts }) {
  const stats = useMemo(() => {
    const total = complaints.length;
    const high = complaints.filter((c) => c.priority === "high").length;
    const resolved = complaints.filter((c) => c.status === "resolved").length;
    const progress = complaints.filter((c) => c.status === "in-progress").length;
    return { total, high, resolved, progress };
  }, [complaints]);

  const categoryData = {
    labels: Object.keys(analytics?.byCategory || {}),
    datasets: [
      {
        label: "Complaints",
        data: Object.values(analytics?.byCategory || {}),
        backgroundColor: "#fb923c",
      },
    ],
  };

  const statusData = {
    labels: Object.keys(analytics?.byStatus || {}),
    datasets: [
      {
        data: Object.values(analytics?.byStatus || {}),
        backgroundColor: ["#94a3b8", "#60a5fa", "#a78bfa", "#34d399"],
      },
    ],
  };

  return (
    <div className="space-y-6">
      {!!alerts?.length && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div key={`${alert.type}-${idx}`} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <strong>{alert.type}</strong>: {alert.count} active items ({alert.severity})
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Complaints" value={stats.total} accent="text-slate-900" />
        <StatCard title="High Priority" value={stats.high} accent="text-red-600" />
        <StatCard title="Resolved" value={stats.resolved} accent="text-emerald-600" />
        <StatCard title="In Progress" value={stats.progress} accent="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PHOTO_STRIP.map((src, idx) => (
          <img key={idx} src={src} alt="Kumbh event" className="card-lift h-36 w-full rounded-xl object-cover" />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="kumbh-glass rounded-xl border border-white/70 p-4 shadow-sm">
          <h2 className="font-semibold mb-4">Complaints by Category</h2>
          <Bar data={categoryData} />
        </div>

        <div className="kumbh-glass rounded-xl border border-white/70 p-4 shadow-sm">
          <h2 className="font-semibold mb-4">Complaints by Status</h2>
          <div className="max-w-sm mx-auto">
            <Pie data={statusData} />
          </div>
        </div>
      </div>

      <div className="kumbh-glass rounded-xl border border-white/70 p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Department Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(analytics?.departmentPerformance || []).map((row) => (
            <div key={row.department} className="card-lift rounded-xl border border-white/80 bg-white/90 p-3">
              <p className="font-semibold text-sm">{row.department}</p>
              <p className="text-xs text-slate-600">Total: {row.total}</p>
              <p className="text-xs text-slate-600">Resolved: {row.resolved}</p>
              <p className="text-xs text-slate-600">Resolution Rate: {row.resolutionRate}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
