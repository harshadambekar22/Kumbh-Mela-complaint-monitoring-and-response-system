import { useState } from "react";

const LOGIN_BG =
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1600&q=80";

export default function LoginPage({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister({ name, email, password, role, department });
        setMode("login");
        setMessage("Account created. Please sign in.");
        setPassword("");
      }
    } catch (err) {
      setError(err?.response?.data?.message || `${mode === "login" ? "Login" : "Signup"} failed`);
    }
  };

  return (
    <div className="relative min-h-screen grid place-items-center p-4">
      <img src={LOGIN_BG} alt="Kumbh Mela" className="absolute inset-0 h-full w-full object-cover" />
      <div className="kumbh-hero-overlay absolute inset-0" />

      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-2xl border border-white/50 bg-white/90 p-6 shadow-2xl backdrop-blur">
        <h1 className="mb-2 text-2xl font-extrabold kumbh-gradient-text">{mode === "login" ? "Welcome Back" : "Join Command Center"}</h1>
        <p className="mb-4 text-xs text-slate-600">Kumbh Mela complaint monitoring and response system</p>

        {mode === "register" && (
          <>
            <label className="text-sm">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mb-3 mt-1 w-full rounded border px-3 py-2" required />

            <label className="text-sm">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="mb-3 mt-1 w-full rounded border px-3 py-2">
              <option value="operator">Operator</option>
              <option value="department_officer">Department Officer</option>
            </select>

            {role === "department_officer" && (
              <>
                <label className="text-sm">Department</label>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mb-3 mt-1 w-full rounded border px-3 py-2"
                  placeholder="Health Department"
                />
              </>
            )}
          </>
        )}

        <label className="text-sm">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mb-3 mt-1 w-full rounded border px-3 py-2" required />

        <label className="text-sm">Password</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mb-3 mt-1 w-full rounded border px-3 py-2" required />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mb-3 text-sm text-emerald-700">{message}</p>}

        <button className="w-full rounded bg-orange-500 py-2 font-semibold text-white hover:bg-orange-600">
          {mode === "login" ? "Login" : "Create Account"}
        </button>
        <button
          type="button"
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          className="mt-3 w-full rounded border border-slate-300 bg-white py-2 text-sm hover:bg-slate-50"
        >
          {mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
