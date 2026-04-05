import { ZoomIn, ZoomOut, Layers, Navigation } from "lucide-react";
import { useMap } from "react-leaflet";

function ZoomControls() {
  const map = useMap();
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
        style={{ background: "rgba(26,58,26,0.9)", border: "1px solid rgba(212,160,23,0.3)", color: "#d4a017" }}
      >
        <ZoomIn size={14} />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
        style={{ background: "rgba(26,58,26,0.9)", border: "1px solid rgba(212,160,23,0.3)", color: "#d4a017" }}
      >
        <ZoomOut size={14} />
      </button>
    </div>
  );
}

function Legend() {
  const items = [
    { color: "#d4a017", label: "In Transit" },
    { color: "#e74c3c", label: "Delayed",   dash: true },
    { color: "#27ae60", label: "Delivered" },
    { color: "#8e44ad", label: "Processing" },
  ];
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "rgba(10,31,10,0.85)", border: "1px solid rgba(212,160,23,0.25)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Layers size={11} style={{ color: "#d4a017" }} />
        <span className="text-xs font-semibold" style={{ color: "#d4a017" }}>Legend</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
              <div
                className="w-6 h-0.5"
                style={{
                  background: item.color,
                  borderTop: item.dash ? `2px dashed ${item.color}` : `2px solid ${item.color}`,
                  height: 0,
                }}
              />
            </div>
            <span className="text-xs text-gray-300">{item.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "rgba(45,90,45,0.4)" }}>
          <span className="text-lg leading-none">🏭</span>
          <span className="text-xs text-gray-300">Warehouse</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">🏠</span>
          <span className="text-xs text-gray-300">Destination</span>
        </div>
      </div>
    </div>
  );
}

export default function MapOverlay() {
  return (
    <>
      {/* Legend bottom-right */}
      <div className="absolute bottom-6 right-4 z-[1000]">
        <Legend />
      </div>
    </>
  );
}

export { ZoomControls };
