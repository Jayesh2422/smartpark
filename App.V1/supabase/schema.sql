-- ============================================
-- SMART PARKING DECISION ENGINE - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. PARKINGS TABLE
CREATE TABLE IF NOT EXISTS parkings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  base_price NUMERIC(10,2) DEFAULT 20.00,
  total_slots INTEGER NOT NULL DEFAULT 0,
  occupied_slots INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SLOTS TABLE
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  slot_number TEXT NOT NULL,
  size TEXT NOT NULL CHECK (size IN ('bike', 'car', 'suv')),
  distance_from_entrance INTEGER DEFAULT 0, -- in meters
  floor INTEGER DEFAULT 0, -- 0 = ground, 1 = first, etc.
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('bike', 'car', 'suv')),
  vehicle_number TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  final_price NUMERIC(10,2),
  base_price NUMERIC(10,2),
  applied_multipliers JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BOOKING HISTORY TABLE (archive)
CREATE TABLE IF NOT EXISTS booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parking_id UUID NOT NULL REFERENCES parkings(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  final_price NUMERIC(10,2),
  base_price NUMERIC(10,2),
  applied_multipliers JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL UNIQUE,
  multiplier NUMERIC(3,2) DEFAULT 1.50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PEER-TO-PEER PARKINGS TABLE
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
  is_rented BOOLEAN NOT NULL DEFAULT FALSE,
  rented_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rented_by_phone_number TEXT,
  rental_start_time TIMESTAMPTZ,
  rental_end_time TIMESTAMPTZ,
  rental_duration_mode TEXT CHECK (rental_duration_mode IN ('hourly', 'daily', 'range', 'monthly')),
  rental_units INTEGER,
  rental_total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
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

-- 9. P2P RENTAL HISTORY TABLE
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

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_parkings ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_rental_history ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Parkings: anyone authenticated can read
CREATE POLICY "Anyone can view parkings" ON parkings FOR SELECT TO authenticated USING (true);

-- Slots: anyone authenticated can read
CREATE POLICY "Anyone can view slots" ON slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can update slots" ON slots FOR UPDATE TO authenticated USING (true);

-- Vehicles: users manage their own
CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON vehicles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = user_id);

-- Bookings: users manage their own
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Booking History: users view their own
CREATE POLICY "Users can view own history" ON booking_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON booking_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Holidays: anyone authenticated can read
CREATE POLICY "Anyone can view holidays" ON holidays FOR SELECT TO authenticated USING (true);

-- P2P Parkings
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

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_parkings_location ON parkings(lat, lng);
CREATE INDEX idx_slots_parking ON slots(parking_id);
CREATE INDEX idx_slots_status ON slots(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_parking ON bookings(parking_id);
CREATE INDEX idx_booking_history_user ON booking_history(user_id);
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_p2p_parkings_owner_user_id ON p2p_parkings(owner_user_id);
CREATE INDEX idx_p2p_parkings_is_rented ON p2p_parkings(is_rented);
CREATE INDEX idx_p2p_parkings_vehicle_size_allowed ON p2p_parkings(vehicle_size_allowed);
CREATE INDEX idx_p2p_rental_history_listing ON p2p_rental_history(listing_id);
CREATE INDEX idx_p2p_rental_history_renter_status ON p2p_rental_history(renter_user_id, status);
