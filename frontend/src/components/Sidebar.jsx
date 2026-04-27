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
    <aside className="w-full md:w-72 md:min-h-screen nashik-surface md:rounded-none rounded-b-2xl p-4 md:p-6 border-r md:border-r border-b md:border-b-0 border-[var(--nashik-border)]">
      <h1 className="nashik-title text-xl font-extrabold mb-2 leading-snug">AI Complaint Task System</h1>
      <p className="text-xs nashik-subtitle mb-6">Kumbh Mela Command Operations</p>

      <div className="mb-5 rounded-xl border border-[var(--nashik-border)] bg-[rgba(11,25,21,0.8)] p-3 text-xs">
        <p className="font-semibold text-[var(--nashik-text)]">{user?.name}</p>
        <p className="text-[var(--nashik-text-dim)] uppercase tracking-wide">{user?.role}</p>
      </div>

      <nav className="space-y-2">
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-2.5 text-sm transition card-lift ${
                isActive
                  ? "bg-[linear-gradient(135deg,#4a6b10,#6b8c2a,#c8a832)] text-[#08110b]"
                  : "bg-[rgba(15,35,28,0.9)] text-[var(--nashik-text)] hover:bg-[rgba(26,52,37,0.95)]"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button onClick={onLogout} className="mt-6 w-full rounded-lg bg-[rgba(255,245,196,0.15)] border border-[var(--nashik-border)] px-3 py-2.5 text-sm text-[var(--nashik-text)] hover:bg-[rgba(255,245,196,0.2)]">
        Logout
      </button>

      <div className="mt-8 rounded-xl border border-[var(--nashik-border)] bg-[rgba(11,25,21,0.8)] p-3 text-xs text-[var(--nashik-text-dim)]">
        <p className="font-semibold text-[var(--nashik-text)] mb-1">Live Control Tip</p>
        <p>Use filters + map together to isolate urgent crowd complaints faster.</p>
      </div>
    </aside>
  );
}
