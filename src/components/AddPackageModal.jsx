import { useState } from "react";
import { X, Package, MapPin, User, Truck } from "lucide-react";
import { createPackage, addPositionUpdate } from "../lib/db";

const WAREHOUSES = [
  { label: "Warehouse A – Chicago",    lat: 41.8827, lng: -87.6233 },
  { label: "Warehouse B – Aurora",     lat: 41.7606, lng: -88.3201 },
  { label: "Warehouse C – Schaumburg", lat: 41.8500, lng: -87.9800 },
];

function genTracking() {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = alpha[Math.floor(Math.random() * alpha.length)] + alpha[Math.floor(Math.random() * alpha.length)];
  return `TRK-${part1}-${part2}`;
}

export default function AddPackageModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    trackingNumber:  genTracking(),
    customerName:    "",
    customerAddress: "",
    originIndex:     0,
    destLat:         "",
    destLng:         "",
    destLabel:       "",
    eta:             "",
    driverName:      "",
    vehicle:         "",
    weight:          "",
    contents:        "",
    priority:        "standard",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.destLat || !form.destLng) {
      setError("Destination coordinates are required.");
      return;
    }
    setLoading(true);
    try {
      const wh = WAREHOUSES[form.originIndex];
      const pkg = await createPackage({
        trackingNumber:  form.trackingNumber,
        customerName:    form.customerName,
        customerAddress: form.customerAddress,
        originLat:       wh.lat,
        originLng:       wh.lng,
        originLabel:     wh.label,
        destLat:         parseFloat(form.destLat),
        destLng:         parseFloat(form.destLng),
        destLabel:       form.destLabel || form.customerAddress,
        eta:             form.eta,
        driverName:      form.driverName,
        vehicle:         form.vehicle,
        weight:          form.weight,
        contents:        form.contents,
        priority:        form.priority,
      });
      await addPositionUpdate(pkg.id, `Package received at ${wh.label}`);
      onAdded(pkg);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create package.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-xl text-sm outline-none text-gray-200 placeholder-gray-600";
  const inputStyle = { background: "rgba(26,58,26,0.6)", border: "1px solid rgba(45,90,45,0.5)" };
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "#0f2b0f", border: "1px solid rgba(212,160,23,0.3)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(45,90,45,0.5)" }}>
          <div className="flex items-center gap-2">
            <Package size={16} style={{ color: "#d4a017" }} />
            <span className="font-bold text-sm" style={{ color: "#d4a017" }}>Add New Package</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tracking number */}
          <div>
            <label className={labelCls}>Tracking Number</label>
            <div className="flex gap-2">
              <input
                className={inputCls} style={inputStyle}
                value={form.trackingNumber}
                onChange={(e) => set("trackingNumber", e.target.value.toUpperCase())}
                required
              />
              <button type="button" onClick={() => set("trackingNumber", genTracking())}
                className="px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
                style={{ background: "rgba(212,160,23,0.15)", color: "#d4a017", border: "1px solid rgba(212,160,23,0.3)" }}>
                Regenerate
              </button>
            </div>
          </div>

          {/* Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><User size={10} className="inline mr-1" />Customer Name</label>
              <input className={inputCls} style={inputStyle} required
                placeholder="Full name"
                value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Customer Address</label>
              <input className={inputCls} style={inputStyle}
                placeholder="Street, City"
                value={form.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} />
            </div>
          </div>

          {/* Origin */}
          <div>
            <label className={labelCls}><MapPin size={10} className="inline mr-1" />Origin Warehouse</label>
            <select
              className={inputCls} style={inputStyle}
              value={form.originIndex}
              onChange={(e) => set("originIndex", parseInt(e.target.value))}
            >
              {WAREHOUSES.map((w, i) => (
                <option key={i} value={i} style={{ background: "#0f2b0f" }}>{w.label}</option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className={labelCls}><MapPin size={10} className="inline mr-1" />Destination Coordinates</label>
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} style={inputStyle} required
                placeholder="Latitude (e.g. 41.97)" type="number" step="any"
                value={form.destLat} onChange={(e) => set("destLat", e.target.value)} />
              <input className={inputCls} style={inputStyle} required
                placeholder="Longitude (e.g. -87.90)" type="number" step="any"
                value={form.destLng} onChange={(e) => set("destLng", e.target.value)} />
            </div>
            <input className={`${inputCls} mt-2`} style={inputStyle}
              placeholder="Address label (optional)"
              value={form.destLabel} onChange={(e) => set("destLabel", e.target.value)} />
          </div>

          {/* Driver / vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><Truck size={10} className="inline mr-1" />Driver Name</label>
              <input className={inputCls} style={inputStyle}
                placeholder="Driver name"
                value={form.driverName} onChange={(e) => set("driverName", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Vehicle</label>
              <input className={inputCls} style={inputStyle}
                placeholder="Van #01"
                value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)} />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Weight</label>
              <input className={inputCls} style={inputStyle} placeholder="4.2 lbs"
                value={form.weight} onChange={(e) => set("weight", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Contents</label>
              <input className={inputCls} style={inputStyle} placeholder="Electronics"
                value={form.contents} onChange={(e) => set("contents", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select className={inputCls} style={inputStyle}
                value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="standard"  style={{ background: "#0f2b0f" }}>Standard</option>
                <option value="express"   style={{ background: "#0f2b0f" }}>Express</option>
                <option value="overnight" style={{ background: "#0f2b0f" }}>Overnight</option>
              </select>
            </div>
          </div>

          {/* ETA */}
          <div>
            <label className={labelCls}>ETA</label>
            <input className={inputCls} style={inputStyle} placeholder="Today, 3:00 PM"
              value={form.eta} onChange={(e) => set("eta", e.target.value)} />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "rgba(192,57,43,0.15)", color: "#e74c3c", border: "1px solid rgba(192,57,43,0.3)" }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(26,58,26,0.5)", color: "#6b7280", border: "1px solid rgba(45,90,45,0.4)" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: loading ? "rgba(212,160,23,0.4)" : "#d4a017", color: "#0a1f0a" }}>
              {loading ? "Creating…" : "Create Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
