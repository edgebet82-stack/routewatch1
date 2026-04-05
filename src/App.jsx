import { useState, useEffect, useCallback } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import MapOverlay from "./components/MapLegend";
import AuthScreen from "./components/AuthScreen";
import AddPackageModal from "./components/AddPackageModal";
import DriverSimulator from "./components/DriverSimulator";
import EmployeeView from "./components/EmployeeView";
import { PACKAGES } from "./data/packages";
import { isConfigured, supabase } from "./lib/supabase";
import {
  fetchPackages, subscribeToPackages, subscribeToUpdates,
  getSession, signOut, fetchDrivers, subscribeToDrivers,
} from "./lib/db";
import "./index.css";

export default function App() {
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [view,        setView]        = useState("business");
  const [packages,    setPackages]    = useState([]);
  const [drivers,     setDrivers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [session,     setSession]     = useState(null);
  const [role,        setRole]        = useState(localStorage.getItem("routewatch_role") || "business");
  const [showAdd,     setShowAdd]     = useState(false);
  const [tick,        setTick]        = useState(0);
  const [demoMode]                    = useState(!isConfigured);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (demoMode) {
      setPackages(PACKAGES);
      setLoading(false);
      const iv = setInterval(() => {
        setPackages((prev) => prev.map((pkg) => {
          if (pkg.status !== "in_transit") return pkg;
          return {
            ...pkg,
            currentPosition: {
              lat: pkg.currentPosition.lat + (Math.random() - 0.48) * 0.002,
              lng: pkg.currentPosition.lng + (Math.random() - 0.48) * 0.002,
            },
            lastUpdate: "Just now",
          };
        }));
        setTick((t) => t + 1);
      }, 8000);
      return () => clearInterval(iv);
    }

    getSession().then((s) => {
      setSession(s);
      if (s) { loadPackages(); loadDrivers(); }
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) { loadPackages(); loadDrivers(); }
    });

    return () => authListener.subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Real-time subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (demoMode) return;
    const pkgSub    = subscribeToPackages(() => loadPackages());
    const updateSub = subscribeToUpdates(() => loadPackages());
    const drvSub    = subscribeToDrivers(() => loadDrivers());
    return () => {
      supabase.removeChannel(pkgSub);
      supabase.removeChannel(updateSub);
      supabase.removeChannel(drvSub);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  const loadPackages = useCallback(async () => {
    try {
      const data = await fetchPackages();
      setPackages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDrivers = useCallback(async () => {
    try {
      const data = await fetchDrivers();
      setDrivers(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (selectedPkg) {
      const updated = packages.find((p) => p.id === selectedPkg.id);
      if (updated) setSelectedPkg(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages]);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!demoMode && !session) {
    return (
      <AuthScreen onAuth={(selectedRole) => {
        setRole(selectedRole);
        getSession().then((s) => {
          setSession(s);
          if (s) { loadPackages(); loadDrivers(); }
        });
      }} />
    );
  }

  // ── Driver/Employee view ───────────────────────────────────────────────────
  if (!demoMode && session && role === "driver") {
    return (
      <EmployeeView
        session={session}
        onSignOut={async () => {
          await signOut();
          setSession(null);
          localStorage.removeItem("routewatch_role");
          setRole("business");
        }}
      />
    );
  }

  // ── Business / Customer view ───────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a1f0a", overflow: "hidden" }}>
      <TopBar
        selectedPkg={selectedPkg}
        onClear={() => setSelectedPkg(null)}
        demoMode={demoMode}
        session={session}
        onSignOut={async () => {
          await signOut();
          setSession(null);
          localStorage.removeItem("routewatch_role");
          setRole("business");
        }}
        onAddPackage={() => setShowAdd(true)}
        view={view}
      />

      {demoMode && (
        <div
          className="flex items-center justify-center gap-2 text-xs py-1.5"
          style={{ background: "rgba(212,160,23,0.12)", borderBottom: "1px solid rgba(212,160,23,0.2)", color: "#d4a017" }}
        >
          <span>⚡ Demo Mode — add your Supabase keys in <code style={{ color: "#f0c040" }}>.env</code> to go live</span>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Sidebar
            packages={packages}
            selectedPkg={selectedPkg}
            onSelectPkg={setSelectedPkg}
            view={view}
            onViewChange={setView}
            loading={loading}
            isReal={!demoMode}
          />
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {loading ? (
            <div className="flex items-center justify-center h-full"
              style={{ background: "#0a1f0a", color: "#d4a017", fontSize: 14 }}>
              Loading satellite data…
            </div>
          ) : (
            <MapView
              packages={packages}
              selectedPkg={selectedPkg}
              onSelectPkg={(pkg) => setSelectedPkg(selectedPkg?.id === pkg.id ? null : pkg)}
              drivers={drivers}
            />
          )}

          <MapOverlay />

          {!selectedPkg && !loading && (
            <div style={{
              position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
              background: "rgba(10,31,10,0.85)", border: "1px solid rgba(212,160,23,0.3)",
              color: "#9ca3af", backdropFilter: "blur(8px)",
              padding: "6px 16px", borderRadius: 9999,
              fontSize: 12, pointerEvents: "none", zIndex: 1000, whiteSpace: "nowrap",
            }}>
              Click a marker or package card to track it
            </div>
          )}

          {/* Live driver count badge */}
          {drivers.filter(d => d.status === "active").length > 0 && (
            <div style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(39,174,96,0.2)", border: "1px solid #27ae6055",
              color: "#27ae60", borderRadius: 9999,
              padding: "5px 12px", fontSize: 11, fontWeight: 700,
              zIndex: 1000, backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#27ae60", animation: "pulse 2s infinite" }} />
              {drivers.filter(d => d.status === "active").length} Driver{drivers.filter(d => d.status === "active").length > 1 ? "s" : ""} Online
            </div>
          )}

          <div style={{
            position: "absolute", bottom: 24, left: 16,
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 9999,
            background: "rgba(10,31,10,0.85)", border: "1px solid rgba(39,174,96,0.3)",
            color: "#27ae60", backdropFilter: "blur(8px)", fontSize: 12, zIndex: 1000,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27ae60", animation: "pulse 2s infinite" }} />
            {demoMode ? `Demo Live ${tick > 0 ? `• ${tick * 8}s` : ""}` : "Supabase Live"}
          </div>

          {!demoMode && session && view === "business" && (
            <DriverSimulator packages={packages} onUpdate={loadPackages} />
          )}
        </div>
      </div>

      {showAdd && (
        <AddPackageModal
          onClose={() => setShowAdd(false)}
          onAdded={(pkg) => {
            setPackages((prev) => [pkg, ...prev]);
            setSelectedPkg(pkg);
          }}
        />
      )}
    </div>
  );
}
