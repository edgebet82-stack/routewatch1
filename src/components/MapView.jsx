import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { STATUS_CONFIG } from "../data/packages";

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createCustomIcon(status, isSelected) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_transit;
  const size = isSelected ? 20 : 14;
  const ring = isSelected ? 32 : 24;
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:${ring}px;height:${ring}px;">
        <div class="${cfg.pulse}" style="
          position:absolute;
          top:50%;left:50%;
          transform:translate(-50%,-50%);
          width:${size}px;height:${size}px;
          background:${cfg.color};
          border-radius:50%;
          border:2px solid rgba(255,255,255,0.8);
        "></div>
      </div>`,
    iconSize: [ring, ring],
    iconAnchor: [ring / 2, ring / 2],
    popupAnchor: [0, -ring / 2],
  });
}

function createWarehouseIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:28px;height:28px;
        background:#1a3a1a;
        border:2px solid #d4a017;
        border-radius:4px;
        display:flex;align-items:center;justify-content:center;
        font-size:14px;
      ">🏭</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createDestIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:24px;height:24px;
        background:#0a1f0a;
        border:2px solid #27ae60;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:12px;
      ">🏠</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FlyTo({ pkg }) {
  const map = useMap();
  useEffect(() => {
    if (pkg) {
      map.flyTo([pkg.currentPosition.lat, pkg.currentPosition.lng], 13, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [pkg, map]);
  return null;
}

export default function MapView({ packages, selectedPkg, onSelectPkg }) {
  const center = [41.88, -87.85];

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      {/* Satellite tiles (ESRI) */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='&copy; <a href="https://www.esri.com">Esri</a>'
        maxZoom={19}
      />
      {/* Label overlay */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
        attribution=""
        maxZoom={19}
        opacity={0.7}
      />

      {selectedPkg && <FlyTo pkg={selectedPkg} />}

      {packages.map((pkg) => {
        const cfg = STATUS_CONFIG[pkg.status];
        const isSelected = selectedPkg?.id === pkg.id;
        const routeColor = pkg.status === "delayed" ? "#e74c3c"
          : pkg.status === "delivered" ? "#27ae60"
          : "#d4a017";

        return (
          <div key={pkg.id}>
            {/* Route polyline */}
            <Polyline
              positions={pkg.route.map((p) => [p.lat, p.lng])}
              pathOptions={{
                color: routeColor,
                weight: isSelected ? 4 : 2,
                opacity: isSelected ? 0.95 : 0.5,
                dashArray: pkg.status === "delayed" ? "8 4" : null,
              }}
            />

            {/* Warehouse origin */}
            <Marker
              position={[pkg.origin.lat, pkg.origin.lng]}
              icon={createWarehouseIcon()}
            >
              <Popup>
                <div style={{ background: "#1a3a1a", color: "#e8f5e8", padding: "4px 8px", borderRadius: 4, minWidth: 140 }}>
                  <strong style={{ color: "#d4a017" }}>Origin</strong><br />
                  {pkg.origin.label}
                </div>
              </Popup>
            </Marker>

            {/* Destination */}
            {pkg.status !== "delivered" && (
              <Marker
                position={[pkg.destination.lat, pkg.destination.lng]}
                icon={createDestIcon()}
              >
                <Popup>
                  <div style={{ background: "#1a3a1a", color: "#e8f5e8", padding: "4px 8px", borderRadius: 4, minWidth: 140 }}>
                    <strong style={{ color: "#27ae60" }}>Destination</strong><br />
                    {pkg.destination.label}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Current position */}
            <Marker
              position={[pkg.currentPosition.lat, pkg.currentPosition.lng]}
              icon={createCustomIcon(pkg.status, isSelected)}
              eventHandlers={{ click: () => onSelectPkg(pkg) }}
            >
              <Popup>
                <div style={{ background: "#1a3a1a", color: "#e8f5e8", padding: "8px", borderRadius: 6, minWidth: 180 }}>
                  <div style={{ color: "#d4a017", fontWeight: 700, marginBottom: 4 }}>{pkg.trackingNumber}</div>
                  <div style={{ marginBottom: 2 }}>{pkg.customer}</div>
                  <div style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>ETA: {pkg.eta}</div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
}
