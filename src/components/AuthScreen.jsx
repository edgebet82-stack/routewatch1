import { useState } from "react";
import { Package, Lock, Mail, Eye, EyeOff, Satellite, AlertCircle, Truck, Building2, User } from "lucide-react";
import { signIn, signUp } from "../lib/db";

const ROLES = [
  { id: "business", label: "Business", desc: "Full dashboard & dispatch", icon: Building2, color: "#d4a017" },
  { id: "driver",   label: "Driver",   desc: "GPS tracking mode",          icon: Truck,     color: "#27ae60" },
  { id: "customer", label: "Customer", desc: "Track your package",         icon: User,      color: "#8e44ad" },
];

export default function AuthScreen({ onAuth }) {
  const [mode,    setMode]    = useState("signin");
  const [role,    setRole]    = useState("business");
  const [email,   setEmail]   = useState("");
  const [password,setPassword]= useState("");
  const [name,    setName]    = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        localStorage.setItem("routewatch_role", role);
        localStorage.setItem("routewatch_name", name || email.split("@")[0]);
        onAuth(role);
      } else {
        await signUp(email, password);
        localStorage.setItem("routewatch_role", role);
        localStorage.setItem("routewatch_name", name || email.split("@")[0]);
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const activeRole = ROLES.find(r => r.id === role);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #1a3a1a 0%, #0a1f0a 70%)" }}
    >
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(#d4a017 1px, transparent 1px), linear-gradient(90deg, #d4a017 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Satellite size={28} style={{ color: "#d4a017" }} />
            <h1 className="text-2xl font-bold" style={{ color: "#d4a017" }}>RouteWatch</h1>
          </div>
          <p className="text-sm text-gray-500">Satellite Package Tracking</p>
        </div>

        {/* Role selector */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 text-center">I am a…</p>
          <div className="flex gap-2">
            {ROLES.map(({ id, label, desc, icon: Icon, color }) => (
              <button
                key={id}
                onClick={() => setRole(id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all"
                style={{
                  background: role === id ? `${color}22` : "rgba(26,58,26,0.4)",
                  border: role === id ? `1.5px solid ${color}` : "1px solid rgba(45,90,45,0.4)",
                  color: role === id ? color : "#6b7280",
                }}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs opacity-60 text-center leading-tight px-1" style={{ fontSize: 9 }}>{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(10,31,10,0.9)",
            border: `1px solid ${activeRole.color}44`,
            backdropFilter: "blur(16px)",
            boxShadow: `0 0 40px ${activeRole.color}11`,
          }}
        >
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[["signin","Sign In"], ["signup","Create Account"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setMode(id); setError(""); setSuccess(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: mode === id ? activeRole.color : "rgba(26,58,26,0.5)",
                  color: mode === id ? "#0a1f0a" : "#6b7280",
                  border: mode === id ? "none" : "1px solid rgba(45,90,45,0.4)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (sign up only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Your Name</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(26,58,26,0.6)", border: "1px solid rgba(45,90,45,0.5)" }}>
                  <User size={14} className="text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Marcus T."
                    className="bg-transparent flex-1 text-sm outline-none text-gray-200 placeholder-gray-600"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(26,58,26,0.6)", border: "1px solid rgba(45,90,45,0.5)" }}>
                <Mail size={14} className="text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="bg-transparent flex-1 text-sm outline-none text-gray-200 placeholder-gray-600"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(26,58,26,0.6)", border: "1px solid rgba(45,90,45,0.5)" }}>
                <Lock size={14} className="text-gray-500" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-transparent flex-1 text-sm outline-none text-gray-200 placeholder-gray-600"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: "rgba(192,57,43,0.15)", color: "#e74c3c", border: "1px solid rgba(192,57,43,0.3)" }}>
                <AlertCircle size={12} /> {error}
              </div>
            )}
            {success && (
              <div className="text-xs px-3 py-2 rounded-lg"
                style={{ background: "rgba(39,174,96,0.15)", color: "#27ae60", border: "1px solid rgba(39,174,96,0.3)" }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: loading ? `${activeRole.color}66` : activeRole.color,
                color: "#0a1f0a",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Please wait…" : mode === "signin" ? `Sign In as ${activeRole.label}` : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Customer with no account? Use <span style={{ color: "#8e44ad" }}>Customer</span> role to track your package.
        </p>
      </div>
    </div>
  );
}
