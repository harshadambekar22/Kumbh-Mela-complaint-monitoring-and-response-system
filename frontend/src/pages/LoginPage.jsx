import { useEffect, useMemo, useState } from "react";

const LOGIN_PHOTOS = [
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1600&q=80",
];

export default function LoginPage({ onLogin, onRegister }) {
  const [bgIndex, setBgIndex] = useState(0);
  const [layerAIndex, setLayerAIndex] = useState(0);
  const [layerBIndex, setLayerBIndex] = useState(1 % LOGIN_PHOTOS.length);
  const [showLayerA, setShowLayerA] = useState(true);
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 58}%`,
        size: `${Math.random() * 2 + 0.8}px`,
        duration: `${2 + Math.random() * 4}s`,
        delay: `${Math.random() * 4}s`,
      })),
    []
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((current) => {
        const next = (current + 1) % LOGIN_PHOTOS.length;
        if (showLayerA) {
          setLayerBIndex(next);
          setShowLayerA(false);
        } else {
          setLayerAIndex(next);
          setShowLayerA(true);
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [showLayerA]);

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
    <div className="nashik-login-root relative min-h-screen grid place-items-center overflow-hidden p-4">
      <div className="nashik-scene">
        <img
          src={LOGIN_PHOTOS[layerAIndex]}
          alt="Kumbh Mela"
          className={`login-bg-zoom login-bg-fade absolute inset-0 h-full w-full object-cover ${
            showLayerA ? "opacity-100" : "opacity-0"
          }`}
        />
        <img
          src={LOGIN_PHOTOS[layerBIndex]}
          alt="Kumbh Mela alternate"
          className={`login-bg-zoom login-bg-fade absolute inset-0 h-full w-full object-cover ${
            showLayerA ? "opacity-0" : "opacity-100"
          }`}
        />
        <div className="nashik-sky-overlay absolute inset-0" />
        <div className="nashik-stars">
          {stars.map((star) => (
            <span
              key={star.id}
              className="nashik-star"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animationDuration: star.duration,
                animationDelay: star.delay,
              }}
            />
          ))}
        </div>
        <div className="nashik-moon" />
      </div>

      <form onSubmit={submit} className="nashik-login-wrap relative z-10">
        <div className="nashik-countdown-badge">Nashik Simhastha 2027</div>
        <div className="nashik-card-glow" />
        <div className="nashik-card">
          <div className="nashik-logo-area">
            <div className="nashik-lotus">🪷</div>
            <h1 className="nashik-site-title">Kumbh Mela</h1>
            <p className="nashik-site-sub">Nashik · Trimbak · 2027</p>
            <p className="nashik-site-loc">{mode === "login" ? "Sign in to complaint command center" : "Create your command center account"}</p>
          </div>

          {mode === "register" && (
            <>
              <label className="nashik-field-label">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="nashik-field-input" placeholder="Enter your full name" required />

              <label className="nashik-field-label">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="nashik-field-input">
                <option value="operator">Operator</option>
                <option value="department_officer">Department Officer</option>
              </select>

              {role === "department_officer" && (
                <>
                  <label className="nashik-field-label">Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className="nashik-field-input" placeholder="Health Department" />
                </>
              )}
            </>
          )}

          <label className="nashik-field-label">{mode === "login" ? "Pilgrim ID / Email" : "Email"}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="nashik-field-input" placeholder="Enter your email address" required />

          <label className="nashik-field-label">{mode === "login" ? "Sacred Password" : "Password"}</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="nashik-field-input" placeholder="Enter your password" required />

          {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
          {message && <p className="mb-3 text-sm text-emerald-300">{message}</p>}

          <button className="nashik-btn-login">{mode === "login" ? "Enter the Mela" : "Create Account"}</button>
          <button type="button" onClick={() => setMode((m) => (m === "login" ? "register" : "login"))} className="nashik-switch-btn">
            {mode === "login" ? "Need an account? Register now" : "Already have an account? Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
