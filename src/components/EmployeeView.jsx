import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Truck, MapPin, Wifi, WifiOff, LogOut, Navigation, Clock } from "lucide-react";
import { upsertDriverLocation, setDriverOffline } from "../lib/db";

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
      width:36px;height:36px;
      background:#27ae60;
      border:3px solid white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:18px;
      box-shadow:0 0 12px rgba(39,174,96,0.8);
    ">🚚</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export default function EmployeeView({ session, onSignOut }) {
  const [tracking,  setTracking]  = useState(false);
  const [position,  setPosition]  = useState(null);
  const [accuracy,  setAccuracy]  = useState(null);
  const [elapsed,   setElapsed]   = useState(0);
  const [error,     setError]     = useState("");
  const [updateCount, setUpdateCount] = useState(0);
  const watchRef   = useRef(null);
  const timerRef   = useRef(null);
  const name = localStorage.getItem("routewatch_name") || "Driver";

  async function startTracking() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device.");
      return;
    }
    setError("");
    setTracking(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords;
        setPosition({ lat, lng });
        setAccuracy(Math.round(acc));
        setUpdateCount(c => c + 1);
        try {
          await upsertDriverLocation(session.user.id, session.user.email, name, lat, lng);
        } catch (e) {
          console.error("Location update failed:", e);
        }
      },
      (err) => {
        setError("GPS error: " + err.message);
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  async function stopTracking() {
    setTracking(false);
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    try { await setDriverOffline(session.user.id); } catch {}
  }

  async function handleSignOut() {
    await stopTracking();
    onSignOut();
  }

  useEffect(() => () => {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a1f0a" }}>
      {/* Top bar */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(10,31,10,0.95)",
        borderBottom: "1px solid rgba(39,174,96,0.3)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(39,174,96,0.2)", border: "1px solid #27ae6055",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Truck size={18} style={{ color: "#27ae60" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 15 }}>{name}</div>
          <div style={{ color: "#6b7280", fontSize: 11 }}>Driver Portal · {session.user.email}</div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px", borderRadius: 9999,
          background: tracking ? "rgba(39,174,96,0.15)" : "rgba(107,114,128,0.15)",
          border: `1px solid ${tracking ? "#27ae6044" : "#6b728044"}`,
          color: tracking ? "#27ae60" : "#6b7280",
          fontSize: 11, fontWeight: 600,
        }}>
          {tracking ? <Wifi size={11} /> : <WifiOff size={11} />}
          {tracking ? "LIVE" : "OFFLINE"}
        </div>
        <button
          onClick={handleSignOut}
          style={{ color: "#6b7280", padding: 4 }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={position ? [position.lat, position.lng] : [41.88, -87.85]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
            maxZoom={19}
          />
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            maxZoom={19}
            opacity={0.7}
          />
          {position && (
            <>
              <FlyToMe pos={position} />
              <Marker position={[position.lat, position.lng]} icon={createDriverIcon()}>
                <Popup>
                  <div style={{ background: "#1a3a1a", color: "#e8f5e8", padding: "8px", borderRadius: 6, minWidth: 160 }}>
                    <div style={{ color: "#27ae60", fontWeight: 700, marginBottom: 4 }}>{name}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                    </div>
                    {accuracy && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>±{accuracy}m accuracy</div>}
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Control panel */}
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "rgba(10,31,10,0.95)", border: "1px solid rgba(39,174,96,0.3)",
          backdropFilter: "blur(12px)", borderRadius: 20, padding: "16px 20px",
          width: 300, zIndex: 1000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Stats row */}
          {tracking && position && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{
                flex: 1, background: "rgba(39,174,96,0.1)", border: "1px solid #27ae6033",
                borderRadius: 10, padding: "8px 10px", textAlign: "center",
              }}>
                <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 13 }}>
                  <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                  {formatTime(elapsed)}
                </div>
                <div style={{ color: "#6b7280", fontSize: 10 }}>Active</div>
              </div>
              <div style={{
                flex: 1, background: "rgba(39,174,96,0.1)", border: "1px solid #27ae6033",
                borderRadius: 10, padding: "8px 10px", textAlign: "center",
              }}>
                <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 13 }}>
                  <Navigation size={10} style={{ display: "inline", marginRight: 3 }} />
                  {updateCount}
                </div>
                <div style={{ color: "#6b7280", fontSize: 10 }}>Updates</div>
              </div>
              {accuracy && (
                <div style={{
                  flex: 1, background: "rgba(39,174,96,0.1)", border: "1px solid #27ae6033",
                  borderRadius: 10, padding: "8px 10px", textAlign: "center",
                }}>
                  <div style={{ color: "#27ae60", fontWeight: 700, fontSize: 13 }}>±{accuracy}m</div>
                  <div style={{ color: "#6b7280", fontSize: 10 }}>Accuracy</div>
                </div>
              )}
            </div>
          )}

          {/* Coords */}
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

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(192,57,43,0.15)", border: "1px solid rgba(192,57,43,0.3)",
              color: "#e74c3c", borderRadius: 8, padding: "6px 10px",
              fontSize: 11, marginBottom: 10,
            }}>{error}</div>
          )}

          {/* Start / Stop button */}
          <button
            onClick={tracking ? stopTracking : startTracking}
            style={{
              width: "100%", padding: "11px", borderRadius: 12,
              fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none",
              background: tracking ? "rgba(192,57,43,0.25)" : "#27ae60",
              color: tracking ? "#e74c3c" : "#0a1f0a",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s",
            }}
          >
            {tracking ? (
              <><WifiOff size={16} /> Stop Sharing Location</>
            ) : (
              <><Navigation size={16} /> Start GPS Tracking</>
            )}
          </button>

          {!tracking && !position && (
            <p style={{ color: "#6b7280", fontSize: 11, textAlign: "center", marginTop: 8, lineHeight: 1.4 }}>
              Your location will update live on the business dashboard map.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
