import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Truck, MapPin, Wifi, WifiOff, LogOut, Navigation, Clock,
  ScanLine, Package, CheckCircle2, AlertTriangle, ChevronRight,
  RotateCcw, User,
} from "lucide-react";
import {
  upsertDriverLocation, setDriverOffline,
  fetchPackageByTracking, updatePackageStatus, addPositionUpdate,
} from "../lib/db";

// ── Map helpers ────────────────────────────────────────────────────────────────
function FlyToMe({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 15, { animate: true, duration: 1.2 });
  }, [pos, map]);
  return null;
}

function createDriverIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;background:#27ae60;border:3px solid white;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:18px;box-shadow:0 0 12px rgba(39,174,96,0.8);
    ">🚚</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// ── Status actions a driver can take ─────────────────────────────────────────
const SCAN_ACTIONS = [
  { id: "picked_up",   label: "Picked Up",      status: "in_transit", color: "#d4a017", icon: "📦" },
  { id: "out_for_del", label: "Out for Delivery",status: "in_transit", color: "#3498db", icon: "🚚" },
  { id: "delivered",   label: "Mark Delivered",  status: "delivered",  color: "#27ae60", icon: "✅" },
  { id: "failed",      label: "Delivery Failed", status: "delayed",    color: "#e74c3c", icon: "⚠️" },
];

// ── Scanner panel ──────────────────────────────────────────────────────────────
function ScannerPanel({ session }) {
  const [input,    setInput]    = useState("");
  const [pkg,      setPkg]      = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState(null); // { text, type: "success"|"error" }
  const [history,  setHistory]  = useState([]);
  const inputRef = useRef(null);
  const name = localStorage.getItem("routewatch_name") || "Driver";

  // Auto-focus on mount so physical scanner can type directly
  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleScan(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setPkg(null); setMsg(null);
    const found = await fetchPackageByTracking(input.trim());
    setLoading(false);
    if (!found) {
      setMsg({ text: `No package found for "${input.trim().toUpperCase()}"`, type: "error" });
    } else {
      setPkg(found);
    }
    inputRef.current?.focus();
  }

  async function handleAction(action) {
    if (!pkg) return;
    setLoading(true);
    try {
      await updatePackageStatus(pkg.id, action.status, action.status === "delivered" ? "Delivered" : pkg.eta);
      await addPositionUpdate(pkg.id, `${action.icon} ${action.label} — scanned by ${name}`);
      setHistory(h => [{
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        tracking: pkg.trackingNumber,
        customer: pkg.customer,
        action: action.label,
        color: action.color,
      }, ...h.slice(0, 9)]);
      setMsg({ text: `${action.icon} ${pkg.trackingNumber} marked as "${action.label}"`, type: "success" });
      setPkg(null);
      setInput("");
    } catch (err) {
      setMsg({ text: "Update failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const STATUS_COLOR = { in_transit: "#d4a017", delayed: "#e74c3c", delivered: "#27ae60", processing: "#8e44ad" };
  const STATUS_LABEL = { in_transit: "In Transit", delayed: "Delayed", delivered: "Delivered", processing: "Processing" };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Scan input */}
      <div style={{
        background: "rgba(26,58,26,0.6)", border: "2px solid rgba(39,174,96,0.4)",
        borderRadius: 16, padding: 16,
      }}>
        <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <ScanLine size={15} /> Scan or Enter Tracking Number
        </div>
        <form onSubmit={handleScan} style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="TRK-XXXX-XX or scan barcode…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1, background: "rgba(10,31,10,0.8)",
              border: "1px solid rgba(39,174,96,0.4)", borderRadius: 10,
              padding: "10px 14px", color: "#e8f5e8", fontSize: 15,
              fontFamily: "monospace", outline: "none", letterSpacing: 1,
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: input.trim() ? "#27ae60" : "rgba(39,174,96,0.2)",
              color: input.trim() ? "#0a1f0a" : "#6b7280",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {loading ? "…" : <><ChevronRight size={16} />Look Up</>}
          </button>
        </form>
        <p style={{ color: "#4b5563", fontSize: 10, marginTop: 8 }}>
          Physical barcode scanners auto-submit — just point and scan.
        </p>
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: msg.type === "success" ? "rgba(39,174,96,0.15)" : "rgba(192,57,43,0.15)",
          border: `1px solid ${msg.type === "success" ? "#27ae6044" : "#e74c3c44"}`,
          color: msg.type === "success" ? "#27ae60" : "#e74c3c",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {msg.text}
          <button onClick={() => setMsg(null)} style={{ color: "inherit", opacity: 0.6 }}>
            <RotateCcw size={12} />
          </button>
        </div>
      )}

      {/* Package found */}
      {pkg && (
        <div style={{
          background: "rgba(26,58,26,0.7)", border: "1px solid rgba(39,174,96,0.3)",
          borderRadius: 14, padding: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ color: "#d4a017", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
                {pkg.trackingNumber}
              </div>
              <div style={{ color: "#e8f5e8", fontSize: 13, marginTop: 2 }}>
                <User size={11} style={{ display: "inline", marginRight: 4 }} />{pkg.customer}
              </div>
              <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
                <MapPin size={10} style={{ display: "inline", marginRight: 4 }} />{pkg.customerAddress}
              </div>
            </div>
            <div style={{
              padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
              background: `${STATUS_COLOR[pkg.status]}22`,
              color: STATUS_COLOR[pkg.status],
              border: `1px solid ${STATUS_COLOR[pkg.status]}44`,
            }}>
              {STATUS_LABEL[pkg.status]}
            </div>
          </div>

          <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 10 }}>
            <Package size={10} style={{ display: "inline", marginRight: 4 }} />
            {pkg.contents} · {pkg.weight} · {pkg.priority} priority
          </div>

          <div style={{ color: "#6b7280", fontSize: 11, marginBottom: 12 }}>
            Destination: <span style={{ color: "#9ca3af" }}>{pkg.destination?.label || pkg.customerAddress}</span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SCAN_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={loading}
                style={{
                  padding: "9px 8px", borderRadius: 10, border: `1px solid ${action.color}44`,
                  background: `${action.color}18`, color: action.color,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 0.15s",
                }}
              >
                <span>{action.icon}</span> {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scan history */}
      {history.length > 0 && (
        <div style={{
          background: "rgba(10,31,10,0.6)", border: "1px solid rgba(45,90,45,0.4)",
          borderRadius: 14, padding: 12,
        }}>
          <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            SCAN HISTORY (this session)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#4b5563", fontSize: 10, width: 38, shrink: 0 }}>{h.time}</span>
                <span style={{ color: "#d4a017", fontFamily: "monospace", fontSize: 11 }}>{h.tracking}</span>
                <span style={{ color: "#9ca3af", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.customer}</span>
                <span style={{ color: h.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{h.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── GPS tracking panel ─────────────────────────────────────────────────────────
function GPSPanel({ session }) {
  const [tracking,    setTracking]    = useState(false);
  const [position,    setPosition]    = useState(null);
  const [accuracy,    setAccuracy]    = useState(null);
  const [elapsed,     setElapsed]     = useState(0);
  const [error,       setError]       = useState("");
  const [updateCount, setUpdateCount] = useState(0);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const name = localStorage.getItem("routewatch_name") || "Driver";

  async function startTracking() {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setError(""); setTracking(true); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    watchRef.current = navigator.geolocation.watchPosition(
      async ({ coords: { latitude: lat, longitude: lng, accuracy: acc } }) => {
        setPosition({ lat, lng }); setAccuracy(Math.round(acc));
        setUpdateCount(c => c + 1);
        try { await upsertDriverLocation(session.user.id, session.user.email, name, lat, lng); } catch {}
      },
      (err) => { setError("GPS error: " + err.message); stopTracking(); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  async function stopTracking() {
    setTracking(false);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    try { await setDriverOffline(session.user.id); } catch {}
  }

  useEffect(() => () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function fmt(s) {
    return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={position ? [position.lat, position.lng] : [41.88, -87.85]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" maxZoom={19} />
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="" maxZoom={19} opacity={0.7} />
          {position && (
            <>
              <FlyToMe pos={position} />
              <Marker position={[position.lat, position.lng]} icon={createDriverIcon()}>
                <Popup>
                  <div style={{ background: "#1a3a1a", color: "#e8f5e8", padding: 8, borderRadius: 6 }}>
                    <div style={{ color: "#27ae60", fontWeight: 700 }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{position.lat.toFixed(5)}, {position.lng.toFixed(5)}</div>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* Control panel */}
      <div style={{
        padding: 16, background: "rgba(10,31,10,0.97)",
        borderTop: "1px solid rgba(39,174,96,0.25)",
      }}>
        {tracking && position && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[
              { label: fmt(elapsed), sub: "Active" },
              { label: updateCount, sub: "Updates" },
              accuracy ? { label: `±${accuracy}m`, sub: "Accuracy" } : null,
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{
                flex: 1, background: "rgba(39,174,96,0.1)", border: "1px solid #27ae6033",
                borderRadius: 10, padding: "8px 10px", textAlign: "center",
              }}>
                <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 13 }}>{item.label}</div>
                <div style={{ color: "#6b7280", fontSize: 10 }}>{item.sub}</div>
              </div>
            ))}
          </div>
        )}
        {position && (
          <div style={{
            background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "6px 10px",
            marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
          }}>
            <MapPin size={11} style={{ color: "#27ae60" }} />
            <span style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace" }}>
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </span>
          </div>
        )}
        {error && (
          <div style={{
            background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)",
            color: "#e74c3c", borderRadius: 8, padding: "6px 10px", fontSize: 11, marginBottom: 10,
          }}>{error}</div>
        )}
        <button
          onClick={tracking ? stopTracking : startTracking}
          style={{
            width: "100%", padding: 11, borderRadius: 12, fontWeight: 700,
            fontSize: 14, cursor: "pointer", border: "none",
            background: tracking ? "rgba(192,57,43,0.25)" : "#27ae60",
            color: tracking ? "#e74c3c" : "#0a1f0a",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {tracking ? <><WifiOff size={16} /> Stop Sharing Location</> : <><Navigation size={16} /> Start GPS Tracking</>}
        </button>
        {!tracking && !position && (
          <p style={{ color: "#6b7280", fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>
            Your location will update live on the business dashboard map.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main EmployeeView ──────────────────────────────────────────────────────────
export default function EmployeeView({ session, onSignOut }) {
  const [tab, setTab] = useState("scanner");
  const name = localStorage.getItem("routewatch_name") || "Driver";

  const TABS = [
    { id: "scanner", label: "Scanner", icon: ScanLine },
    { id: "gps",     label: "GPS",     icon: Navigation },
  ];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a1f0a" }}>
      {/* Top bar */}
      <div style={{
        padding: "10px 16px", background: "rgba(10,31,10,0.97)",
        borderBottom: "1px solid rgba(39,174,96,0.3)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "rgba(39,174,96,0.2)", border: "1px solid #27ae6055",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Truck size={16} style={{ color: "#27ae60" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 14 }}>{name}</div>
          <div style={{ color: "#6b7280", fontSize: 10 }}>Driver Portal</div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, background: "rgba(26,58,26,0.6)", borderRadius: 10, padding: 3 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                background: tab === id ? "#27ae60" : "transparent",
                color: tab === id ? "#0a1f0a" : "#6b7280",
                fontSize: 11, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 4,
              }}
            >
              <Icon size={11} />{label}
            </button>
          ))}
        </div>

        <button onClick={onSignOut} style={{ color: "#6b7280", padding: 4 }} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>

      {/* Content */}
      {tab === "scanner" ? (
        <ScannerPanel session={session} />
      ) : (
        <GPSPanel session={session} />
      )}
    </div>
  );
}
