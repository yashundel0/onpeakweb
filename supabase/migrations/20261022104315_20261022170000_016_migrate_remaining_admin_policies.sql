/*
# Migrate remaining admin policies to is_admin() helper

## Problem
Several admin policies on courts, locations, sports, court_pricing,
memberships, open_matches, operating_hours, promo_codes, and
user_memberships still use the old pattern:
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
While these don't cause infinite recursion (none of them are the profiles
table), they should use the is_admin() SECURITY DEFINER helper for
consistency, performance, and Supabase best practices.

## Changes
- Drop and recreate all admin policies on the tables listed above to use
  public.is_admin() instead of the sub-query pattern.
- No schema changes, no data changes, no table/column drops.
*/

-- court_pricing
DROP POLICY IF EXISTS "admin_delete_court_pricing" ON public.court_pricing;
CREATE POLICY "admin_delete_court_pricing" ON public.court_pricing
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_court_pricing" ON public.court_pricing;
CREATE POLICY "admin_update_court_pricing" ON public.court_pricing
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_court_pricing" ON public.court_pricing;
CREATE POLICY "admin_insert_court_pricing" ON public.court_pricing
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- courts
DROP POLICY IF EXISTS "admin_insert_courts" ON public.courts;
CREATE POLICY "admin_insert_courts" ON public.courts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_courts" ON public.courts;
CREATE POLICY "admin_update_courts" ON public.courts
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_courts" ON public.courts;
CREATE POLICY "admin_delete_courts" ON public.courts
  FOR DELETE TO authenticated USING (public.is_admin());

-- locations
DROP POLICY IF EXISTS "admin_insert_locations" ON public.locations;
CREATE POLICY "admin_insert_locations" ON public.locations
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_locations" ON public.locations;
CREATE POLICY "admin_update_locations" ON public.locations
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_locations" ON public.locations;
CREATE POLICY "admin_delete_locations" ON public.locations
  FOR DELETE TO authenticated USING (public.is_admin());

-- memberships
DROP POLICY IF EXISTS "admin_delete_memberships" ON public.memberships;
CREATE POLICY "admin_delete_memberships" ON public.memberships
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_memberships" ON public.memberships;
CREATE POLICY "admin_update_memberships" ON public.memberships
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_memberships" ON public.memberships;
CREATE POLICY "admin_insert_memberships" ON public.memberships
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- open_matches
DROP POLICY IF EXISTS "admin_delete_open_matches" ON public.open_matches;
CREATE POLICY "admin_delete_open_matches" ON public.open_matches
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_open_matches" ON public.open_matches;
CREATE POLICY "admin_update_open_matches" ON public.open_matches
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_open_matches" ON public.open_matches;
CREATE POLICY "admin_insert_open_matches" ON public.open_matches
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- operating_hours
DROP POLICY IF EXISTS "admin_insert_operating_hours" ON public.operating_hours;
CREATE POLICY "admin_insert_operating_hours" ON public.operating_hours
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_operating_hours" ON public.operating_hours;
CREATE POLICY "admin_update_operating_hours" ON public.operating_hours
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_operating_hours" ON public.operating_hours;
CREATE POLICY "admin_delete_operating_hours" ON public.operating_hours
  FOR DELETE TO authenticated USING (public.is_admin());

-- promo_codes
DROP POLICY IF EXISTS "admin_delete_promo_codes" ON public.promo_codes;
CREATE POLICY "admin_delete_promo_codes" ON public.promo_codes
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_promo_codes" ON public.promo_codes;
CREATE POLICY "admin_update_promo_codes" ON public.promo_codes
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_promo_codes" ON public.promo_codes;
CREATE POLICY "admin_insert_promo_codes" ON public.promo_codes
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- sports
DROP POLICY IF EXISTS "admin_delete_sports" ON public.sports;
CREATE POLICY "admin_delete_sports" ON public.sports
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_sports" ON public.sports;
CREATE POLICY "admin_insert_sports" ON public.sports
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_sports" ON public.sports;
CREATE POLICY "admin_update_sports" ON public.sports
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- user_memberships
DROP POLICY IF EXISTS "admin_update_user_memberships" ON public.user_memberships;
CREATE POLICY "admin_update_user_memberships" ON public.user_memberships
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_read_all_user_memberships" ON public.user_memberships;
CREATE POLICY "admin_read_all_user_memberships" ON public.user_memberships
  FOR SELECT TO authenticated USING (public.is_admin());
