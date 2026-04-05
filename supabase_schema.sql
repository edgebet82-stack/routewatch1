-- ============================================================
-- RouteWatch – Supabase Schema
-- Paste this into Supabase → SQL Editor → Run
-- ============================================================

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number  TEXT UNIQUE NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_address TEXT,
  origin_lat       FLOAT NOT NULL,
  origin_lng       FLOAT NOT NULL,
  origin_label     TEXT,
  dest_lat         FLOAT NOT NULL,
  dest_lng         FLOAT NOT NULL,
  dest_label       TEXT,
  current_lat      FLOAT NOT NULL,
  current_lng      FLOAT NOT NULL,
  status           TEXT DEFAULT 'processing'
                   CHECK (status IN ('processing','in_transit','delayed','delivered')),
  eta              TEXT,
  driver_name      TEXT DEFAULT 'Unassigned',
  vehicle          TEXT DEFAULT '—',
  weight           TEXT DEFAULT '—',
  contents         TEXT DEFAULT '—',
  priority         TEXT DEFAULT 'standard'
                   CHECK (priority IN ('standard','express','overnight')),
  progress         INT DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Activity / position log
CREATE TABLE IF NOT EXISTS position_updates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  UUID REFERENCES packages(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on packages
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON packages;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE packages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_updates ENABLE ROW LEVEL SECURITY;

-- Businesses (authenticated users) can see and edit all packages
CREATE POLICY "Business full access" ON packages
  FOR ALL USING (auth.role() = 'authenticated');

-- Customers (anon) can read packages by tracking number only
CREATE POLICY "Customer read by tracking" ON packages
  FOR SELECT USING (true);

-- Anyone can read activity log
CREATE POLICY "Read position_updates" ON position_updates
  FOR SELECT USING (true);

-- Only authenticated users can insert activity
CREATE POLICY "Auth insert position_updates" ON position_updates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable real-time on both tables
ALTER PUBLICATION supabase_realtime ADD TABLE packages;
ALTER PUBLICATION supabase_realtime ADD TABLE position_updates;

-- ── Sample seed data (optional – delete if not needed) ───────────────────────
INSERT INTO packages (
  tracking_number, customer_name, customer_address,
  origin_lat, origin_lng, origin_label,
  dest_lat,   dest_lng,   dest_label,
  current_lat, current_lng,
  status, eta, driver_name, vehicle, weight, contents, priority, progress
) VALUES
(
  'TRK-9842-XL', 'James Rivera', '842 Oak Ave, Chicago, IL',
  41.8827, -87.6233, 'Warehouse A – Chicago',
  41.9742, -87.9073, '842 Oak Ave, Elk Grove',
  41.9212, -87.7400,
  'in_transit', 'Today, 3:45 PM', 'Marcus T.', 'Van #07',
  '4.2 lbs', 'Electronics', 'standard', 55
),
(
  'TRK-3371-MX', 'Sophia Chen', '19 Maple St, Naperville, IL',
  41.8827, -87.6233, 'Warehouse A – Chicago',
  41.7508, -88.1535, '19 Maple St, Naperville',
  41.7890, -87.9800,
  'delayed', 'Today, 5:30 PM', 'DeShawn K.', 'Truck #12',
  '12.8 lbs', 'Furniture Parts', 'express', 60
),
(
  'TRK-7712-QR', 'Daniela Moreno', '305 Lakeview Dr, Evanston, IL',
  41.8827, -87.6233, 'Warehouse A – Chicago',
  42.0451, -87.6877, '305 Lakeview Dr, Evanston',
  42.0451, -87.6877,
  'delivered', 'Delivered at 12:20 PM', 'Priya N.', 'Van #03',
  '2.1 lbs', 'Books', 'standard', 100
);

INSERT INTO position_updates (package_id, message) VALUES
((SELECT id FROM packages WHERE tracking_number='TRK-9842-XL'), 'Package picked up from Warehouse A'),
((SELECT id FROM packages WHERE tracking_number='TRK-9842-XL'), 'In transit – highway I-90 W'),
((SELECT id FROM packages WHERE tracking_number='TRK-3371-MX'), 'Package picked up from Warehouse A'),
((SELECT id FROM packages WHERE tracking_number='TRK-3371-MX'), 'Traffic delay on I-55 – approx. 45 min'),
((SELECT id FROM packages WHERE tracking_number='TRK-7712-QR'), 'Package picked up from Warehouse A'),
((SELECT id FROM packages WHERE tracking_number='TRK-7712-QR'), 'Successfully delivered – signed by D. Moreno');
