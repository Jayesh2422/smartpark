-- ============================================
-- COMPLETE FIX FOR DEV MODE AUTH
-- Run ALL of these in Supabase SQL Editor
-- ============================================

-- Step 1: Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile, ignore if already exists
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 2: Make sure the profiles table allows the fields to be nullable
ALTER TABLE public.profiles 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;
