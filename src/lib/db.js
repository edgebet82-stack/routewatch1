import { supabase } from "./supabase";

// ─── Packages ────────────────────────────────────────────────────────────────

export async function fetchPackages() {
  const { data, error } = await supabase
    .from("packages")
    .select("*, position_updates(id, message, created_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(normalise);
}

export async function fetchPackageByTracking(trackingNumber) {
  const { data, error } = await supabase
    .from("packages")
    .select("*, position_updates(id, message, created_at)")
    .eq("tracking_number", trackingNumber.trim().toUpperCase())
    .single();
  if (error) return null;
  return normalise(data);
}

export async function createPackage(pkg) {
  const { data, error } = await supabase
    .from("packages")
    .insert([{
      tracking_number:  pkg.trackingNumber,
      customer_name:    pkg.customerName,
      customer_address: pkg.customerAddress,
      origin_lat:       pkg.originLat,
      origin_lng:       pkg.originLng,
      origin_label:     pkg.originLabel,
      dest_lat:         pkg.destLat,
      dest_lng:         pkg.destLng,
      dest_label:       pkg.destLabel,
      current_lat:      pkg.originLat,
      current_lng:      pkg.originLng,
      status:           "processing",
      eta:              pkg.eta || "TBD",
      driver_name:      pkg.driverName || "Unassigned",
      vehicle:          pkg.vehicle || "—",
      weight:           pkg.weight || "—",
      contents:         pkg.contents || "—",
      priority:         pkg.priority || "standard",
      progress:         0,
    }])
    .select()
    .single();
  if (error) throw error;
  return normalise(data);
}

export async function updatePackagePosition(id, lat, lng, progress) {
  const { error } = await supabase
    .from("packages")
    .update({ current_lat: lat, current_lng: lng, progress, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updatePackageStatus(id, status, eta) {
  const { error } = await supabase
    .from("packages")
    .update({ status, eta, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function addPositionUpdate(packageId, message) {
  const { error } = await supabase
    .from("position_updates")
    .insert([{ package_id: packageId, message }]);
  if (error) throw error;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ─── Real-time subscriptions ──────────────────────────────────────────────────

export function subscribeToPackages(callback) {
  return supabase
    .channel("packages-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "packages" }, callback)
    .subscribe();
}

export function subscribeToUpdates(callback) {
  return supabase
    .channel("updates-changes")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "position_updates" }, callback)
    .subscribe();
}

// ─── Normalise DB row → app shape ─────────────────────────────────────────────

function normalise(row) {
  if (!row) return null;
  const updates = (row.position_updates || []).map((u) => ({
    time: new Date(u.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    msg:  u.message,
  })).reverse();

  return {
    id:              row.id,
    trackingNumber:  row.tracking_number,
    customer:        row.customer_name,
    customerAddress: row.customer_address,
    origin:  { lat: row.origin_lat,   lng: row.origin_lng,  label: row.origin_label },
    destination: { lat: row.dest_lat, lng: row.dest_lng,    label: row.dest_label  },
    currentPosition: { lat: row.current_lat, lng: row.current_lng },
    route: [
      { lat: row.origin_lat,   lng: row.origin_lng  },
      { lat: row.current_lat,  lng: row.current_lng },
      { lat: row.dest_lat,     lng: row.dest_lng    },
    ],
    status:      row.status,
    eta:         row.eta,
    driver:      row.driver_name,
    vehicle:     row.vehicle,
    weight:      row.weight,
    contents:    row.contents,
    priority:    row.priority,
    progress:    row.progress,
    lastUpdate:  new Date(row.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    updates,
  };
}
