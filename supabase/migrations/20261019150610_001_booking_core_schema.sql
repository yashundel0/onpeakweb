/*
# OnPeak Booking Platform — Core Schema

## Overview
Creates the full relational database for a real sports booking platform.
Supports multiple locations, padel courts and football fields, real-time
availability calculated from bookings + blocked slots, flexible pricing,
promo codes, payments, and memberships. The architecture is designed so new
locations, courts, and sports can be added without code changes.

## New Tables
1. locations — OnPeak club locations
2. sports — Types of sports offered
3. courts — Individual courts/fields per location per sport
4. operating_hours — Per-court operating hours per weekday
5. court_pricing — Flexible pricing per court, duration, day type, time band
6. blocked_slots — Admin-blocked time slots
7. bookings — The central booking record
8. payments — Payment records (no card data stored)
9. promo_codes — Discount codes
10. memberships — Membership tiers (future)
11. user_memberships — User→membership association (future)
12. profiles — Extended user profile data with admin flag
13. open_matches — Future Open Match feature architecture

## Security
- RLS enabled on ALL tables.
- Public read on catalog tables (locations, sports, courts, pricing, etc.)
- Owner-scoped access on bookings, payments
- Admin-only access on configuration writes
- SECURITY DEFINER trigger auto-creates profile on signup
*/

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE discount_type_enum AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE day_type_enum AS ENUM ('weekday', 'weekend');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE time_band_enum AS ENUM ('off_peak', 'standard', 'peak');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle_enum AS ENUM ('monthly', 'quarterly', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE open_match_status_enum AS ENUM ('open', 'full', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- PROFILES (must exist first for admin policy checks)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_profile" ON profiles;
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Dubai, UAE',
  google_maps text,
  google_maps_embed text,
  description text,
  image_url text,
  opening_hours jsonb DEFAULT '{"mon":{"open":"08:00","close":"23:00"},"tue":{"open":"08:00","close":"23:00"},"wed":{"open":"08:00","close":"23:00"},"thu":{"open":"08:00","close":"23:00"},"fri":{"open":"08:00","close":"23:00"},"sat":{"open":"08:00","close":"23:00"},"sun":{"open":"08:00","close":"23:00"}}'::jsonb,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_locations" ON locations;
CREATE POLICY "public_read_locations" ON locations
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_locations" ON locations;
CREATE POLICY "admin_insert_locations" ON locations
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_locations" ON locations;
CREATE POLICY "admin_update_locations" ON locations
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_locations" ON locations;
CREATE POLICY "admin_delete_locations" ON locations
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- SPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon_name text DEFAULT 'Trophy',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_sports" ON sports;
CREATE POLICY "public_read_sports" ON sports
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_sports" ON sports;
CREATE POLICY "admin_insert_sports" ON sports
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_sports" ON sports;
CREATE POLICY "admin_update_sports" ON sports
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_sports" ON sports;
CREATE POLICY "admin_delete_sports" ON sports
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- COURTS
-- ============================================================
CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  name text NOT NULL,
  court_type text NOT NULL DEFAULT 'padel',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_courts" ON courts;
CREATE POLICY "public_read_courts" ON courts
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_courts" ON courts;
CREATE POLICY "admin_insert_courts" ON courts
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_courts" ON courts;
CREATE POLICY "admin_update_courts" ON courts
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_courts" ON courts;
CREATE POLICY "admin_delete_courts" ON courts
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- OPERATING HOURS
-- ============================================================
CREATE TABLE IF NOT EXISTS operating_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  weekday int NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  open_time time NOT NULL DEFAULT '08:00',
  close_time time NOT NULL DEFAULT '23:00',
  is_open boolean DEFAULT true,
  UNIQUE(court_id, weekday)
);
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_operating_hours" ON operating_hours;
CREATE POLICY "public_read_operating_hours" ON operating_hours
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_operating_hours" ON operating_hours;
CREATE POLICY "admin_insert_operating_hours" ON operating_hours
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_operating_hours" ON operating_hours;
CREATE POLICY "admin_update_operating_hours" ON operating_hours
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_operating_hours" ON operating_hours;
CREATE POLICY "admin_delete_operating_hours" ON operating_hours
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- COURT PRICING
-- ============================================================
CREATE TABLE IF NOT EXISTS court_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  duration_minutes int NOT NULL DEFAULT 60,
  day_type day_type_enum NOT NULL DEFAULT 'weekday',
  time_band time_band_enum NOT NULL DEFAULT 'standard',
  price_aed numeric(10,2) NOT NULL DEFAULT 100.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(court_id, duration_minutes, day_type, time_band)
);
ALTER TABLE court_pricing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_court_pricing" ON court_pricing;
CREATE POLICY "public_read_court_pricing" ON court_pricing
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_court_pricing" ON court_pricing;
CREATE POLICY "admin_insert_court_pricing" ON court_pricing
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_court_pricing" ON court_pricing;
CREATE POLICY "admin_update_court_pricing" ON court_pricing
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_court_pricing" ON court_pricing;
CREATE POLICY "admin_delete_court_pricing" ON court_pricing
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- PROMO CODES
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type discount_type_enum NOT NULL DEFAULT 'percentage',
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  max_uses int,
  used_count int DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  location_restriction uuid REFERENCES locations(id) ON DELETE SET NULL,
  sport_restriction uuid REFERENCES sports(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_promo_codes" ON promo_codes;
CREATE POLICY "public_read_active_promo_codes" ON promo_codes
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "admin_insert_promo_codes" ON promo_codes;
CREATE POLICY "admin_insert_promo_codes" ON promo_codes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_promo_codes" ON promo_codes;
CREATE POLICY "admin_update_promo_codes" ON promo_codes
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_promo_codes" ON promo_codes;
CREATE POLICY "admin_delete_promo_codes" ON promo_codes
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  price_aed numeric(10,2) NOT NULL DEFAULT 0,
  discount_aed numeric(10,2) DEFAULT 0,
  final_price_aed numeric(10,2) NOT NULL DEFAULT 0,
  promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL,
  payment_status payment_status_enum NOT NULL DEFAULT 'pending',
  booking_status booking_status_enum NOT NULL DEFAULT 'pending',
  cancellation_reason text,
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_bookings" ON bookings;
CREATE POLICY "read_own_bookings" ON bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_bookings" ON bookings;
CREATE POLICY "admin_read_all_bookings" ON bookings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_bookings" ON bookings;
CREATE POLICY "admin_update_bookings" ON bookings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_bookings" ON bookings;
CREATE POLICY "admin_delete_bookings" ON bookings
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount_aed numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'AED',
  provider text DEFAULT 'manual',
  provider_reference text,
  status payment_status_enum NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_payments" ON payments;
CREATE POLICY "read_own_payments" ON payments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_read_all_payments" ON payments;
CREATE POLICY "admin_read_all_payments" ON payments
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_insert_payments" ON payments;
CREATE POLICY "admin_insert_payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_payments" ON payments;
CREATE POLICY "admin_update_payments" ON payments
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- BLOCKED SLOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  reason text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_blocked_slots" ON blocked_slots;
CREATE POLICY "public_read_blocked_slots" ON blocked_slots
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_blocked_slots" ON blocked_slots;
CREATE POLICY "admin_insert_blocked_slots" ON blocked_slots
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_blocked_slots" ON blocked_slots;
CREATE POLICY "admin_update_blocked_slots" ON blocked_slots
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_blocked_slots" ON blocked_slots;
CREATE POLICY "admin_delete_blocked_slots" ON blocked_slots
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- MEMBERSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price_aed numeric(10,2) NOT NULL DEFAULT 0,
  billing_cycle billing_cycle_enum NOT NULL DEFAULT 'monthly',
  discount_percentage numeric(5,2) DEFAULT 0,
  priority_booking boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_memberships" ON memberships;
CREATE POLICY "public_read_memberships" ON memberships
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_memberships" ON memberships;
CREATE POLICY "admin_insert_memberships" ON memberships
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_memberships" ON memberships;
CREATE POLICY "admin_update_memberships" ON memberships
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_memberships" ON memberships;
CREATE POLICY "admin_delete_memberships" ON memberships
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- USER MEMBERSHIPS (future)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_own_user_memberships" ON user_memberships;
CREATE POLICY "read_own_user_memberships" ON user_memberships
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_read_all_user_memberships" ON user_memberships;
CREATE POLICY "admin_read_all_user_memberships" ON user_memberships
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "insert_own_user_memberships" ON user_memberships;
CREATE POLICY "insert_own_user_memberships" ON user_memberships
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_user_memberships" ON user_memberships;
CREATE POLICY "admin_update_user_memberships" ON user_memberships
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- OPEN MATCHES (future)
-- ============================================================
CREATE TABLE IF NOT EXISTS open_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  sport_id uuid NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  match_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price_per_player_aed numeric(10,2) NOT NULL DEFAULT 0,
  max_players int NOT NULL DEFAULT 4,
  current_players int DEFAULT 0,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status open_match_status_enum NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE open_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_open_matches" ON open_matches;
CREATE POLICY "public_read_open_matches" ON open_matches
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_open_matches" ON open_matches;
CREATE POLICY "admin_insert_open_matches" ON open_matches
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_update_open_matches" ON open_matches;
CREATE POLICY "admin_update_open_matches" ON open_matches
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "admin_delete_open_matches" ON open_matches;
CREATE POLICY "admin_delete_open_matches" ON open_matches
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_courts_location ON courts(location_id);
CREATE INDEX IF NOT EXISTS idx_courts_sport ON courts(sport_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_date ON bookings(court_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_court_date ON blocked_slots(court_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_operating_hours_court ON operating_hours(court_id);
CREATE INDEX IF NOT EXISTS idx_court_pricing_court ON court_pricing(court_id);
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- BOOKING CODE GENERATOR
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  attempts int := 0;
BEGIN
  LOOP
    code := 'OP-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE booking_code = code);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      code := 'OP-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
      EXIT;
    END IF;
  END LOOP;
  RETURN code;
END;
$$;
