import { Bell, Wifi, Satellite, Settings, ChevronDown } from "lucide-react";

export default function TopBar({ selectedPkg, onClear }) {
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
      {/* Left: brand */}
      <div className="flex items-center gap-2">
        <Satellite size={16} style={{ color: "#d4a017" }} />
        <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
          Satellite Route Tracker
        </span>
      </div>

      {/* Active package breadcrumb */}
      {selectedPkg && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs"
          style={{ background: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)" }}
        >
          <span className="text-gray-400">Viewing:</span>
          <span style={{ color: "#d4a017" }} className="font-semibold">{selectedPkg.trackingNumber}</span>
          <span className="text-gray-500">–</span>
          <span className="text-gray-300">{selectedPkg.customer}</span>
          <button
            onClick={onClear}
            className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
          >✕</button>
        </div>
      )}

      <div className="flex-1" />

      {/* Right: status indicators */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400">Live Feed</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Wifi size={13} />
          <span>Connected</span>
        </div>
        <div
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: "rgba(26,58,26,0.6)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.2)" }}
        >
          {now}
        </div>
        <button
          className="p-1.5 rounded-lg hover:bg-green-900/30 transition-colors"
          style={{ color: "#6b7280" }}
        >
          <Bell size={15} />
        </button>
        <button
          className="p-1.5 rounded-lg hover:bg-green-900/30 transition-colors"
          style={{ color: "#6b7280" }}
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
