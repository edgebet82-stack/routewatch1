import { useState, useEffect, useRef } from "react";
import { Navigation, Play, Square, MapPin, ChevronUp, ChevronDown } from "lucide-react";
import { updatePackagePosition, updatePackageStatus, addPositionUpdate } from "../lib/db";

export default function DriverSimulator({ packages, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const intervalRef = useRef(null);

  const moveable = packages.filter((p) => p.status === "in_transit" || p.status === "delayed");

  function addLog(msg) {
    setLog((l) => [{ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), msg }, ...l.slice(0, 9)]);
  }

  async function step(pkg) {
    const dest = pkg.destination;
    const cur  = pkg.currentPosition;
    const dlat = (dest.lat - cur.lat);
    const dlng = (dest.lng - cur.lng);
    const dist  = Math.sqrt(dlat * dlat + dlng * dlng);

    if (dist < 0.005) {
      // Arrived
      await updatePackagePosition(pkg.id, dest.lat, dest.lng, 100);
      await updatePackageStatus(pkg.id, "delivered", "Delivered");
      await addPositionUpdate(pkg.id, "Package delivered successfully");
      addLog(`✅ ${pkg.trackingNumber} – DELIVERED`);
      stopSim();
      onUpdate();
      return;
    }

    // Move 10% of remaining distance each tick
    const newLat = cur.lat + dlat * 0.1 + (Math.random() - 0.5) * 0.001;
    const newLng = cur.lng + dlng * 0.1 + (Math.random() - 0.5) * 0.001;
    const newProgress = Math.min(99, Math.round((1 - (dist - dist * 0.1) / Math.sqrt(
      Math.pow(dest.lat - pkg.origin.lat, 2) + Math.pow(dest.lng - pkg.origin.lng, 2)
    )) * 100));

    await updatePackagePosition(pkg.id, newLat, newLng, Math.max(pkg.progress, newProgress));
    addLog(`📍 ${pkg.trackingNumber} → (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`);
    onUpdate();
  }

  function startSim() {
    if (!activeId) return;
    setRunning(true);
    addLog(`▶ Started tracking ${activeId}`);
    intervalRef.current = setInterval(async () => {
      const pkg = packages.find((p) => p.id === activeId);
      if (pkg) await step(pkg);
    }, 3000);
  }

  function stopSim() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    addLog("⏹ Simulation stopped");
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,31,10,0.92)",
        border: "1px solid rgba(212,160,23,0.4)",
        backdropFilter: "blur(12px)",
        width: 340,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5"
        onClick={() => setOpen(!open)}
        style={{ borderBottom: open ? "1px solid rgba(45,90,45,0.4)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <Navigation size={13} style={{ color: "#d4a017" }} />
          <span className="text-xs font-semibold" style={{ color: "#d4a017" }}>Driver GPS Simulator</span>
          {running && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>
        {open ? <ChevronDown size={13} className="text-gray-500" /> : <ChevronUp size={13} className="text-gray-500" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-500">
            Simulates a real driver moving a package toward its destination — writes live GPS to the database.
          </p>

          {/* Select package */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Select Package to Move</label>
            <select
              className="w-full px-3 py-2 rounded-xl text-xs outline-none text-gray-200"
              style={{ background: "rgba(26,58,26,0.6)", border: "1px solid rgba(45,90,45,0.5)" }}
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              disabled={running}
            >
              <option value="" style={{ background: "#0f2b0f" }}>— Choose package —</option>
              {moveable.map((p) => (
                <option key={p.id} value={p.id} style={{ background: "#0f2b0f" }}>
                  {p.trackingNumber} – {p.customer}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={startSim}
              disabled={running || !activeId}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: running || !activeId ? "rgba(45,90,45,0.3)" : "rgba(212,160,23,0.2)",
                color: running || !activeId ? "#4b5563" : "#d4a017",
                border: "1px solid rgba(212,160,23,0.2)",
              }}
            >
              <Play size={11} />Start Moving
            </button>
            <button
              onClick={stopSim}
              disabled={!running}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: !running ? "rgba(192,57,43,0.1)" : "rgba(192,57,43,0.2)",
                color: !running ? "#4b5563" : "#e74c3c",
                border: "1px solid rgba(192,57,43,0.2)",
              }}
            >
              <Square size={11} />Stop
            </button>
          </div>

          {/* Live log */}
          {log.length > 0 && (
            <div
              className="rounded-xl p-3 space-y-1.5 max-h-32 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(45,90,45,0.3)" }}
            >
              {log.map((l, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-gray-600 shrink-0">{l.time}</span>
                  <span className="text-gray-300">{l.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
