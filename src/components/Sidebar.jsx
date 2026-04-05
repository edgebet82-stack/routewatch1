import { useState } from "react";
import {
  Package, Truck, AlertTriangle, CheckCircle2, Clock, Search,
  ChevronRight, MapPin, User, BarChart3, RefreshCw, Filter, X
} from "lucide-react";
import { STATUS_CONFIG, STATS } from "../data/packages";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{ background: "rgba(26,58,26,0.6)", border: `1px solid ${color}33` }}
      className="rounded-lg p-3 flex items-center gap-3"
    >
      <div style={{ background: `${color}22`, color }} className="p-2 rounded-lg">
        <Icon size={16} />
      </div>
      <div>
        <div style={{ color }} className="text-xl font-bold leading-none">{value}</div>
        <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function ProgressBar({ progress, status }) {
  const color = status === "delayed" ? "#e74c3c"
    : status === "delivered" ? "#27ae60"
    : "#d4a017";
  return (
    <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${progress}%`, background: color }}
      />
    </div>
  );
}

function PackageCard({ pkg, isSelected, onClick }) {
  const cfg = STATUS_CONFIG[pkg.status];
  return (
    <div
      onClick={onClick}
      className="card-hover cursor-pointer rounded-xl p-3 mb-2"
      style={{
        background: isSelected ? "rgba(212,160,23,0.12)" : "rgba(26,58,26,0.5)",
        border: isSelected ? "1px solid #d4a017" : "1px solid rgba(45,90,45,0.5)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-sm" style={{ color: "#d4a017" }}>
            {pkg.trackingNumber}
          </div>
          <div className="text-xs text-gray-300 mt-0.5">{pkg.customer}</div>
        </div>
        <div
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}55` }}
        >
          {cfg.label}
        </div>
      </div>

      <ProgressBar progress={pkg.progress} status={pkg.status} />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={11} />
          <span>{pkg.eta}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <RefreshCw size={10} />
          <span>{pkg.lastUpdate}</span>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-gold-500/20 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-gray-500">Driver</div>
            <div className="text-gray-200 font-medium">{pkg.driver}</div>
          </div>
          <div>
            <div className="text-gray-500">Vehicle</div>
            <div className="text-gray-200 font-medium">{pkg.vehicle}</div>
          </div>
          <div>
            <div className="text-gray-500">Weight</div>
            <div className="text-gray-200 font-medium">{pkg.weight}</div>
          </div>
          <div>
            <div className="text-gray-500">Priority</div>
            <div className="font-medium capitalize" style={{
              color: pkg.priority === "overnight" ? "#e74c3c"
                : pkg.priority === "express" ? "#d4a017" : "#9ca3af"
            }}>{pkg.priority}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500 mb-1">Contents</div>
            <div className="text-gray-200 font-medium">{pkg.contents}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function UpdateLog({ pkg }) {
  if (!pkg) return null;
  return (
    <div
      className="rounded-xl p-3 mt-3"
      style={{ background: "rgba(10,31,10,0.8)", border: "1px solid rgba(212,160,23,0.2)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} style={{ color: "#d4a017" }} />
        <span className="text-xs font-semibold" style={{ color: "#d4a017" }}>Activity Log</span>
      </div>
      <div className="space-y-2">
        {pkg.updates.map((u, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="text-xs text-gray-500 w-16 shrink-0 pt-0.5">{u.time}</div>
            <div className="flex-1">
              <div
                className="w-2 h-2 rounded-full mt-1.5 -ml-4 absolute"
                style={{ background: i === 0 ? "#d4a017" : "#2d5a2d" }}
              />
              <div className="text-xs text-gray-300 ml-1">{u.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ packages, selectedPkg, onSelectPkg, view, onViewChange, loading, isReal }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = packages.filter((p) => {
    const matchSearch =
      p.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  // Calculate real-time stats from packages array
  const counts = {
    total: packages.length,
    in_transit: packages.filter(p => p.status === "in_transit").length,
    delayed: packages.filter(p => p.status === "delayed").length,
    delivered: packages.filter(p => p.status === "delivered").length,
    processing: packages.filter(p => p.status === "processing").length,
  };

  const onTimeRate = counts.total > 0
    ? Math.round(((counts.total - counts.delayed) / counts.total) * 100) + "%"
    : "100%";

  const filterOptions = [
    { value: "all",        label: "All",       count: counts.total },
    { value: "in_transit", label: "Transit",   count: counts.in_transit },
    { value: "delayed",    label: "Delayed",   count: counts.delayed },
    { value: "delivered",  label: "Delivered", count: counts.delivered },
    { value: "processing", label: "Processing",count: counts.processing },
  ];

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "rgba(10,31,10,0.95)", borderRight: "1px solid rgba(45,90,45,0.6)" }}
    >
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(45,90,45,0.6)" }}>
        <div className="flex items-center gap-2 mb-1">
          <div style={{ color: "#d4a017" }}>
            <Package size={20} />
          </div>
          <h1 className="font-bold text-lg leading-none glow-gold" style={{ color: "#d4a017" }}>
            RouteWatch
          </h1>
          <div
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: "rgba(39,174,96,0.2)", color: "#27ae60", border: "1px solid #27ae6055" }}
          >
            LIVE
          </div>
        </div>
        <p className="text-xs text-gray-500">Satellite Package Monitoring</p>
      </div>

      {/* View toggle */}
      <div className="flex p-3 gap-2" style={{ borderBottom: "1px solid rgba(45,90,45,0.4)" }}>
        {[
          { id: "business", label: "Business", icon: BarChart3 },
          { id: "customer", label: "Customer", icon: User },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: view === id ? "#d4a017" : "rgba(26,58,26,0.5)",
              color: view === id ? "#0a1f0a" : "#9ca3af",
              border: view === id ? "none" : "1px solid rgba(45,90,45,0.4)",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Business stats */}
      {view === "business" && (
        <div className="p-3 grid grid-cols-2 gap-2" style={{ borderBottom: "1px solid rgba(45,90,45,0.4)" }}>
          <StatCard icon={Truck}         label="In Transit"  value={counts.in_transit} color="#d4a017" />
          <StatCard icon={AlertTriangle} label="Delayed"     value={counts.delayed}    color="#e74c3c" />
          <StatCard icon={CheckCircle2}  label="Delivered"   value={counts.delivered}  color="#27ae60" />
          <StatCard icon={Clock}         label="On-Time"     value={onTimeRate}        color="#8e44ad" />
        </div>
      )}

      {/* Customer tracking input */}
      {view === "customer" && (
        <div className="p-3" style={{ borderBottom: "1px solid rgba(45,90,45,0.4)" }}>
          <p className="text-xs text-gray-400 mb-2">Enter your tracking number below to monitor your delivery in real time.</p>
        </div>
      )}

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(26,58,26,0.6)", border: "1px solid rgba(45,90,45,0.5)" }}>
          <Search size={14} className="text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={view === "customer" ? "Tracking number or name…" : "Search packages…"}
            className="bg-transparent text-xs flex-1 outline-none text-gray-200 placeholder-gray-600"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={12} className="text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      {view === "business" && (
        <div className="px-3 pt-2 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-all"
              style={{
                background: filter === f.value ? "rgba(212,160,23,0.2)" : "rgba(26,58,26,0.5)",
                color: filter === f.value ? "#d4a017" : "#6b7280",
                border: filter === f.value ? "1px solid #d4a01755" : "1px solid rgba(45,90,45,0.3)",
              }}
            >
              {f.label} {f.count > 0 && <span className="opacity-70">({f.count})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Package list */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center text-gray-600 text-xs mt-8 animate-pulse">
            <RefreshCw size={24} className="mx-auto mb-2 opacity-30 animate-spin" />
            <p>Syncing with satellite…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-600 text-xs mt-8">
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p>No packages found</p>
          </div>
        ) : (
          filtered.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPkg?.id === pkg.id}
              onClick={() => onSelectPkg(selectedPkg?.id === pkg.id ? null : pkg)}
            />
          ))
        )}
        {selectedPkg && <UpdateLog pkg={selectedPkg} />}
      </div>
    </div>
  );
}

