import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import KumbhHero from "./components/KumbhHero";
import DashboardPage from "./pages/DashboardPage";
import MapPage from "./pages/MapPage";
import TaskBoardPage from "./pages/TaskBoardPage";
import LoginPage from "./pages/LoginPage";
import {
  addComment,
  assignComplaint,
  bulkUpdate,
  createSavedView,
  getAlerts,
  getAnalyticsSummary,
  getComplaints,
  getSavedViews,
  ingestPosts,
  login,
  processIngestionQueue,
  register,
  reviewComplaint,
  updateComplaintStatus,
} from "./api";

const AUTO_REFRESH_MS = 8000;

export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("auth_user");
    return token && user ? { token, user: JSON.parse(user) } : null;
  });

  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [savedViews, setSavedViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: "", status: "", category: "", priority: "" });
  const ambientParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        bottom: `${Math.random() * 30}%`,
        delay: `${Math.random() * 3}s`,
        duration: `${4 + Math.random() * 5}s`,
      })),
    []
  );

  const fetchComplaints = async (params = filters) => {
    const data = await getComplaints({ ...params, limit: 200 });
    setComplaints(data.items || []);
    setMeta({ total: data.total || 0 });
  };

  const refreshDashboard = async () => {
    const [a, al] = await Promise.all([getAnalyticsSummary(), getAlerts()]);
    setAnalytics(a);
    setAlerts(al.alerts || []);
  };

  useEffect(() => {
    if (!auth) return;

    const init = async () => {
      setLoading(true);
      try {
        // Keep dashboard usable even when one endpoint is temporarily unavailable.
        await Promise.allSettled([fetchComplaints(filters), refreshDashboard()]);
        const views = await getSavedViews();
        setSavedViews(Array.isArray(views) ? views : []);
      } catch (_error) {
        setSavedViews([]);
      } finally {
        setLoading(false);
      }
    };

    init();

    const intervalId = setInterval(() => {
      fetchComplaints(filters);
      refreshDashboard();
    }, AUTO_REFRESH_MS);

    return () => clearInterval(intervalId);
  }, [auth]);

  const onLogin = async (email, password) => {
    const data = await login(email, password);
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
  };

  const onRegister = async (payload) => {
    await register(payload);
  };

  const onLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuth(null);
  };

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const applyFilters = async () => {
    await fetchComplaints(filters);
  };

  /** Queue one demo Nashik/Kumbh post and run /process so tickets appear without social API keys. */
  const runDemoComplaint = async () => {
    await ingestPosts([
      {
        platform: "demo",
        username: "test_user",
        text: "Water supply issue in Panchavati area Nashik during Kumbh — low pressure since morning.",
        createdAt: new Date().toISOString(),
      },
    ]);
    await processIngestionQueue();
    await Promise.all([fetchComplaints(filters), refreshDashboard()]);
  };

  const saveCurrentView = async () => {
    const name = window.prompt("Saved view name", "My View");
    if (!name) return;
    await createSavedView(name, filters);
    const views = await getSavedViews();
    setSavedViews(views);
  };

  const handleDropStatus = async (id, status) => {
    await updateComplaintStatus(id, status);
    await Promise.all([fetchComplaints(filters), refreshDashboard()]);
  };

  const handleAssign = async (id, assigneeId, assigneeName) => {
    await assignComplaint(id, assigneeId, assigneeName);
    await fetchComplaints(filters);
  };

  const handleAddComment = async (id, text) => {
    await addComment(id, text);
    await fetchComplaints(filters);
  };

  const handleBulkStatus = async (ids, status) => {
    if (!ids.length) return;
    await bulkUpdate(ids, { status });
    await Promise.all([fetchComplaints(filters), refreshDashboard()]);
  };

  const kpi = useMemo(() => ({ shown: complaints.length, total: meta.total }), [complaints.length, meta.total]);

  if (!auth) {
    return <LoginPage onLogin={onLogin} onRegister={onRegister} />;
  }

  return (
    <div className="nashik-page-bg flex min-h-screen flex-col md:flex-row bg-transparent">
      <div className="nashik-particles">
        {ambientParticles.map((p) => (
          <span
            key={p.id}
            className="nashik-particle"
            style={{ left: p.left, bottom: p.bottom, animationDelay: p.delay, animationDuration: p.duration }}
          />
        ))}
      </div>
      <Sidebar user={auth.user} onLogout={onLogout} />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 animate-enter-up">
        <KumbhHero
          title="Kumbh Mela Smart Complaint Command Center"
          subtitle="Live grievance intelligence platform for Nashik operations. Track, map, prioritize, and resolve public complaints in real time."
        />

        <div className="nashik-surface animate-enter-scale animate-stagger-1 p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--nashik-text)]">
              Welcome, <span className="kumbh-gradient-text">{auth.user?.name}</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {(auth.user?.role === "admin" || auth.user?.role === "operator") && (
                <button
                  type="button"
                  onClick={runDemoComplaint}
                  className="nashik-btn-secondary px-3 py-2 text-sm font-medium"
                >
                  Add demo complaint (test)
                </button>
              )}
              <button onClick={saveCurrentView} className="nashik-btn-primary animate-strong-glow px-3 py-2 text-sm">
                Save View
              </button>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-6">
            <input
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              placeholder="Search text/user/location"
              className="nashik-input px-3 py-2 text-sm"
            />
            <select value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)} className="nashik-input px-2 py-2 text-sm">
              <option value="">All status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select value={filters.category} onChange={(e) => handleFilterChange("category", e.target.value)} className="nashik-input px-2 py-2 text-sm">
              <option value="">All category</option>
              <option value="traffic">Traffic</option>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="medical">Medical</option>
              <option value="lost_and_found">Lost & Found</option>
              <option value="sanitation">Sanitation</option>
            </select>
            <select value={filters.priority} onChange={(e) => handleFilterChange("priority", e.target.value)} className="nashik-input px-2 py-2 text-sm">
              <option value="">All priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button onClick={applyFilters} className="nashik-btn-primary px-3 py-2 text-sm font-medium">
              Apply Filters
            </button>
            <select
              className="nashik-input px-2 py-2 text-sm"
              onChange={(e) => {
                const view = savedViews.find((v) => v.id === e.target.value);
                if (!view) return;
                setFilters(view.filters || {});
                fetchComplaints(view.filters || {});
              }}
            >
              <option value="">Saved Views</option>
              {savedViews.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <p className="mb-1 text-xs nashik-subtitle">Showing {kpi.shown} / {kpi.total} complaints</p>
        </div>

        {loading ? (
          <p className="nashik-surface-soft p-4 text-sm">Loading complaints...</p>
        ) : (
          <Routes>
            <Route path="/" element={<DashboardPage complaints={complaints} analytics={analytics} alerts={alerts} />} />
            <Route path="/map" element={<MapPage complaints={complaints} />} />
            <Route
              path="/task-board"
              element={
                <TaskBoardPage
                  complaints={complaints}
                  onDropStatus={handleDropStatus}
                  onAssign={handleAssign}
                  onBulkStatus={handleBulkStatus}
                  onAddComment={handleAddComment}
                  onReview={reviewComplaint}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
