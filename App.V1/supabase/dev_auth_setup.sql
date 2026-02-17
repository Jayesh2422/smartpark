-- ============================================
-- SIMPLE FIX: Run this in Supabase SQL Editor
-- Just 3 things: remove FK, disable RLS
-- ============================================

-- 1. Remove foreign key from profiles to auth.users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Disable RLS on all tables (for dev mode)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parkings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays DISABLE ROW LEVEL SECURITY;
