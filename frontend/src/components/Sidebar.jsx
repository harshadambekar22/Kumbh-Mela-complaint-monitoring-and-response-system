import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/map", label: "Map" },
  { to: "/task-board", label: "Task Board" },
];

export default function Sidebar({ user, onLogout }) {
  const visibleLinks = links.filter((item) => {
    if (user?.role === "department_officer" && item.to === "/map") return false;
    return true;
  });

  return (
    <aside className="w-72 min-h-screen bg-slate-950/95 text-white p-6 border-r border-slate-800">
      <h1 className="text-xl font-extrabold mb-2 leading-snug">AI Complaint Task System</h1>
      <p className="text-xs text-slate-300 mb-8">Kumbh Mela Command Operations</p>

      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs">
        <p className="font-semibold text-slate-100">{user?.name}</p>
        <p className="text-slate-400 uppercase tracking-wide">{user?.role}</p>
      </div>

      <nav className="space-y-2">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-2.5 text-sm transition card-lift ${
                isActive ? "bg-orange-500 text-white" : "bg-slate-900 text-slate-100 hover:bg-slate-800"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button onClick={onLogout} className="mt-6 w-full rounded-lg bg-slate-700 px-3 py-2.5 text-sm hover:bg-slate-600">
        Logout
      </button>

      <div className="mt-8 rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-slate-300">
        <p className="font-semibold text-slate-100 mb-1">Live Control Tip</p>
        <p>Use filters + map together to isolate urgent crowd complaints faster.</p>
      </div>
    </aside>
  );
}
