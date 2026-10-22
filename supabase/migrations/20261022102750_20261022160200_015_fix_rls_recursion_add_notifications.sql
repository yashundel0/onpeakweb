/*
# Fix infinite RLS recursion + add notifications system

## Problem
The `admin_read_all_profiles` policy on `profiles` does:
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
This queries `profiles` INSIDE a policy ON `profiles` → infinite recursion.
The same pattern affects bookings, payments, and blocked_slots admin policies.

## Fix — SECURITY DEFINER helper function
A no-arg `public.is_admin()` SECURITY DEFINER function already exists.
It queries `profiles` with the owner's privileges (bypassing RLS) and returns
true/false. All admin policies are rewritten to call `is_admin()` instead of
sub-querying profiles directly, breaking the recursion.

This migration also drops a duplicate `is_admin(uuid)` overload that was
accidentally created by a prior failed attempt.

## Notifications table
Create `notifications` table for admin booking alerts:
- id, user_id (per-admin), booking_id, type, title, message, is_read, created_at
- RLS: admins can read/manage all notifications; customers see none
- A trigger `trg_booking_created_notify` fires AFTER INSERT on bookings,
  creating a notification row for each admin user.

## RLS policy rewrites
All admin policies on profiles, bookings, payments, blocked_slots, and
notifications are dropped and recreated using `public.is_admin()`.
Customer policies (read_own_profile, insert_own_profile, update_own_profile,
read_own_bookings, insert_own_bookings, update_own_bookings, read_own_payments,
public_read_blocked_slots) are preserved.

## No data loss
- No tables or columns dropped
- No data deleted
- All existing bookings, profiles, and payments preserved
*/

-- ---------------------------------------------------------------------------
-- 1. Drop duplicate is_admin(uuid) overload, keep no-arg version
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Ensure the no-arg version is correct (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $function$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. notifications table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'new_booking',
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "admin_read_notifications" ON public.notifications;
CREATE POLICY "admin_read_notifications" ON public.notifications
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_notifications" ON public.notifications;
CREATE POLICY "admin_update_notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_notifications" ON public.notifications;
CREATE POLICY "admin_delete_notifications" ON public.notifications
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;
CREATE POLICY "admin_insert_notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Trigger: create notification when a booking is inserted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_booking_created_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin record;
  v_court_name text;
  v_loc_name text;
  v_sport_name text;
  v_msg text;
  v_title text;
BEGIN
  SELECT c.name INTO v_court_name FROM courts c WHERE c.id = NEW.court_id;
  SELECT l.name INTO v_loc_name FROM locations l WHERE l.id = NEW.location_id;
  SELECT s.name INTO v_sport_name FROM sports s WHERE s.id = NEW.sport_id;

  v_title := 'New booking received';
  v_msg := 'Booking #' || NEW.booking_code ||
    ' — ' || COALESCE(NEW.customer_name, 'Customer') ||
    ' — ' || COALESCE(v_sport_name, '') || ' ' || COALESCE(v_court_name, '') ||
    ' — ' || NEW.booking_date::text || ' ' || NEW.start_time::text;

  FOR v_admin IN SELECT id FROM profiles WHERE is_admin = true LOOP
    INSERT INTO public.notifications (user_id, booking_id, type, title, message)
    VALUES (v_admin.id, NEW.id, 'new_booking', v_title, v_msg);
  END LOOP;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.on_booking_created_notify() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_booking_created_notify ON public.bookings;
CREATE TRIGGER trg_booking_created_notify
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.on_booking_created_notify();

-- ---------------------------------------------------------------------------
-- 4. Rewrite profiles admin policy (fix recursion)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_read_all_profiles" ON public.profiles;
CREATE POLICY "admin_read_all_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_profiles" ON public.profiles;
CREATE POLICY "admin_update_profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Rewrite bookings admin policies (fix recursion)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_read_all_bookings" ON public.bookings;
CREATE POLICY "admin_read_all_bookings" ON public.bookings
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_bookings" ON public.bookings;
CREATE POLICY "admin_update_bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_bookings" ON public.bookings;
CREATE POLICY "admin_delete_bookings" ON public.bookings
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Rewrite payments admin policies (fix recursion)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_read_all_payments" ON public.payments;
CREATE POLICY "admin_read_all_payments" ON public.payments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_payments" ON public.payments;
CREATE POLICY "admin_update_payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_payments" ON public.payments;
CREATE POLICY "admin_insert_payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Rewrite blocked_slots admin policies (fix recursion)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_insert_blocked_slots" ON public.blocked_slots;
CREATE POLICY "admin_insert_blocked_slots" ON public.blocked_slots
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_blocked_slots" ON public.blocked_slots;
CREATE POLICY "admin_update_blocked_slots" ON public.blocked_slots
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_blocked_slots" ON public.blocked_slots;
CREATE POLICY "admin_delete_blocked_slots" ON public.blocked_slots
  FOR DELETE TO authenticated USING (public.is_admin());
