import { Bell, Wifi, Satellite, Settings, Plus, LogOut, User } from "lucide-react";

export default function TopBar({ selectedPkg, onClear, demoMode, session, onSignOut, onAddPackage, view }) {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="flex items-center px-4 py-2 gap-4 shrink-0"
      style={{
        background: "rgba(10,31,10,0.98)",
        borderBottom: "1px solid rgba(212,160,23,0.3)",
        height: 48,
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2">
        <Satellite size={16} style={{ color: "#d4a017" }} />
        <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          RouteWatch
        </span>
        {demoMode && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(212,160,23,0.15)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.3)" }}>
            DEMO
          </span>
        )}
      </div>

      {/* Active package breadcrumb */}
      {selectedPkg && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
          style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)" }}
        >
          <span className="text-gray-400">Tracking:</span>
          <span style={{ color: "#d4a017" }} className="font-semibold">{selectedPkg.trackingNumber}</span>
          <span className="text-gray-500">–</span>
          <span className="text-gray-300">{selectedPkg.customer}</span>
          <button onClick={onClear} className="ml-1 text-gray-500 hover:text-red-400 transition-colors">✕</button>
        </div>
      )}

      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Add package – real mode + business view + signed in */}
        {!demoMode && session && view === "business" && (
          <button
            onClick={onAddPackage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "#d4a017", color: "#0a1f0a" }}
          >
            <Plus size={12} />
            Add Package
          </button>
        )}

        {/* Session info */}
        {!demoMode && session && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <User size={12} />
            <span className="hidden sm:inline">{session.user?.email?.split("@")[0]}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400">{demoMode ? "Demo" : "Live"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Wifi size={13} />
        </div>

        <div
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: "rgba(26,58,26,0.6)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.2)" }}
        >
          {now}
        </div>

        <button className="p-1.5 rounded-lg hover:bg-green-900/30 transition-colors" style={{ color: "#6b7280" }}>
          <Bell size={15} />
        </button>

        {!demoMode && session && (
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors"
            style={{ color: "#6b7280" }}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
