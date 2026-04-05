import { useState, useEffect } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import MapOverlay from "./components/MapLegend";
import { PACKAGES } from "./data/packages";
import "./index.css";

export default function App() {
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [view, setView] = useState("business");
  const [packages, setPackages] = useState(PACKAGES);
  const [tick, setTick] = useState(0);

  // Simulate live position updates every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.status !== "in_transit") return pkg;
          const lat = pkg.currentPosition.lat + (Math.random() - 0.48) * 0.002;
          const lng = pkg.currentPosition.lng + (Math.random() - 0.48) * 0.002;
          return { ...pkg, currentPosition: { lat, lng }, lastUpdate: "Just now" };
        })
      );
      setTick((t) => t + 1);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Keep selected package in sync
  useEffect(() => {
    if (selectedPkg) {
      const updated = packages.find((p) => p.id === selectedPkg.id);
      if (updated) setSelectedPkg(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a1f0a", overflow: "hidden" }}>
      <TopBar selectedPkg={selectedPkg} onClear={() => setSelectedPkg(null)} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Sidebar
            packages={packages}
            selectedPkg={selectedPkg}
            onSelectPkg={setSelectedPkg}
            view={view}
            onViewChange={setView}
          />
        </div>

        {/* Map area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          <MapView
            packages={packages}
            selectedPkg={selectedPkg}
            onSelectPkg={(pkg) => setSelectedPkg(selectedPkg?.id === pkg.id ? null : pkg)}
          />
          <MapOverlay />

          {!selectedPkg && (
            <div
              style={{
                position: "absolute",
                top: 16,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(10,31,10,0.85)",
                border: "1px solid rgba(212,160,23,0.3)",
                color: "#9ca3af",
                backdropFilter: "blur(8px)",
                padding: "6px 16px",
                borderRadius: 9999,
                fontSize: 12,
                pointerEvents: "none",
                zIndex: 1000,
                whiteSpace: "nowrap",
              }}
            >
              Click a marker or package card to track it
            </div>
          )}

          <div
            style={{
              position: "absolute",
              bottom: 24,
              left: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 9999,
              background: "rgba(10,31,10,0.85)",
              border: "1px solid rgba(39,174,96,0.3)",
              color: "#27ae60",
              backdropFilter: "blur(8px)",
              fontSize: 12,
              zIndex: 1000,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27ae60", animation: "pulse 2s infinite" }} />
            Satellite Live {tick > 0 ? `• Updated ${tick * 8}s ago` : "• Live"}
          </div>
        </div>
      </div>
    </div>
  );
}
