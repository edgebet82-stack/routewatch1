import { useState } from "react";
import { Package, Lock, Mail, Eye, EyeOff, Satellite, AlertCircle } from "lucide-react";
import { signIn, signUp } from "../lib/db";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        onAuth();
      } else {
        await signUp(email, password);
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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
            <h1 className="text-2xl font-bold glow-gold" style={{ color: "#d4a017" }}>RouteWatch</h1>
          </div>
          <p className="text-sm text-gray-500">Business Portal – Satellite Package Tracking</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(10,31,10,0.9)",
            border: "1px solid rgba(212,160,23,0.3)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 0 40px rgba(212,160,23,0.08)",
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
                  background: mode === id ? "#d4a017" : "rgba(26,58,26,0.5)",
                  color: mode === id ? "#0a1f0a" : "#6b7280",
                  border: mode === id ? "none" : "1px solid rgba(45,90,45,0.4)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="you@business.com"
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

            {/* Error / success */}
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
                background: loading ? "rgba(212,160,23,0.4)" : "#d4a017",
                color: "#0a1f0a",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Customer? Use the <span style={{ color: "#d4a017" }}>Customer</span> tab in the app — no account needed.
        </p>
      </div>
    </div>
  );
}
