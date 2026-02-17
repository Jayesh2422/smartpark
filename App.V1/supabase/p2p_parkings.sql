-- ============================================
-- P2P PARKINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS p2p_parkings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  owner_email TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  description TEXT NOT NULL,
  availability_duration TEXT NOT NULL DEFAULT '',
  vehicle_size_allowed TEXT NOT NULL CHECK (vehicle_size_allowed IN ('bike', 'car', 'suv')),
  hourly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  daily_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_rented BOOLEAN NOT NULL DEFAULT false,
  rented_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rented_by_phone_number TEXT,
  rental_start_time TIMESTAMPTZ,
  rental_end_time TIMESTAMPTZ,
  rental_duration_mode TEXT CHECK (rental_duration_mode IN ('hourly', 'daily', 'range', 'monthly')),
  rental_units INTEGER,
  rental_total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_rental_window CHECK (
    rental_start_time IS NULL
    OR rental_end_time IS NULL
    OR rental_end_time > rental_start_time
  )
);

ALTER TABLE p2p_parkings
  ADD COLUMN IF NOT EXISTS availability_duration TEXT NOT NULL DEFAULT '';
ALTER TABLE p2p_parkings
  ADD COLUMN IF NOT EXISTS rental_duration_mode TEXT CHECK (rental_duration_mode IN ('hourly', 'daily', 'range', 'monthly'));
ALTER TABLE p2p_parkings
  ADD COLUMN IF NOT EXISTS rental_units INTEGER;
ALTER TABLE p2p_parkings
  ADD COLUMN IF NOT EXISTS rental_total_price NUMERIC(10,2);

-- HISTORY TABLE FOR FREE/PAY FLOW
CREATE TABLE IF NOT EXISTS p2p_rental_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES p2p_parkings(id) ON DELETE SET NULL,
  owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  renter_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  renter_phone_number TEXT,
  description TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  vehicle_size_allowed TEXT CHECK (vehicle_size_allowed IN ('bike', 'car', 'suv')),
  rental_start_time TIMESTAMPTZ,
  rental_end_time TIMESTAMPTZ,
  rental_duration_mode TEXT CHECK (rental_duration_mode IN ('hourly', 'daily', 'range', 'monthly')),
  rental_units INTEGER,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_p2p_parkings_owner_user_id
  ON p2p_parkings(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_p2p_parkings_is_rented
  ON p2p_parkings(is_rented);

CREATE INDEX IF NOT EXISTS idx_p2p_parkings_vehicle_size_allowed
  ON p2p_parkings(vehicle_size_allowed);

CREATE INDEX IF NOT EXISTS idx_p2p_rental_history_listing
  ON p2p_rental_history(listing_id);

CREATE INDEX IF NOT EXISTS idx_p2p_rental_history_renter_status
  ON p2p_rental_history(renter_user_id, status);

ALTER TABLE p2p_parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_rental_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view p2p parkings" ON p2p_parkings;
DROP POLICY IF EXISTS "Users can create own p2p listing" ON p2p_parkings;
DROP POLICY IF EXISTS "Owners can update own p2p listings" ON p2p_parkings;
DROP POLICY IF EXISTS "Users can rent available p2p listings" ON p2p_parkings;
DROP POLICY IF EXISTS "Owners can delete own p2p listings" ON p2p_parkings;
DROP POLICY IF EXISTS "Public can view p2p parkings" ON p2p_parkings;
DROP POLICY IF EXISTS "Public can create p2p listings" ON p2p_parkings;
DROP POLICY IF EXISTS "Public can update p2p listings" ON p2p_parkings;
DROP POLICY IF EXISTS "Public can delete p2p listings" ON p2p_parkings;
DROP POLICY IF EXISTS "Public can view p2p rental history" ON p2p_rental_history;
DROP POLICY IF EXISTS "Public can create p2p rental history" ON p2p_rental_history;
DROP POLICY IF EXISTS "Public can update p2p rental history" ON p2p_rental_history;

-- NOTE:
-- This app currently uses custom local auth (not Supabase auth sessions),
-- so auth.uid()-based policies will block insert/update.
-- Ownership checks are enforced in app/service queries (owner_user_id filters).
CREATE POLICY "Public can view p2p parkings"
  ON p2p_parkings FOR SELECT
  USING (true);

CREATE POLICY "Public can create p2p listings"
  ON p2p_parkings FOR INSERT
  WITH CHECK (owner_user_id IS NOT NULL);

CREATE POLICY "Public can update p2p listings"
  ON p2p_parkings FOR UPDATE
  USING (true)
  WITH CHECK (owner_user_id IS NOT NULL);

CREATE POLICY "Public can delete p2p listings"
  ON p2p_parkings FOR DELETE
  USING (true);

CREATE POLICY "Public can view p2p rental history"
  ON p2p_rental_history FOR SELECT
  USING (true);

CREATE POLICY "Public can create p2p rental history"
  ON p2p_rental_history FOR INSERT
  WITH CHECK (renter_user_id IS NOT NULL);

CREATE POLICY "Public can update p2p rental history"
  ON p2p_rental_history FOR UPDATE
  USING (true)
  WITH CHECK (renter_user_id IS NOT NULL);
