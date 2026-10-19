/*
# Fix security warnings — search_path and function execution

## Changes
1. Add SET search_path = public to helper functions that were missing it
2. Revoke EXECUTE from anon on all SECURITY DEFINER functions so only authenticated users can call them
*/

-- Fix search_path on helper functions
ALTER FUNCTION public.get_time_band(time) SET search_path = public;
ALTER FUNCTION public.get_day_type(date) SET search_path = public;
ALTER FUNCTION public.generate_booking_code() SET search_path = public;

-- Revoke execute from anon on all SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_court_price(uuid, int, time, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_promo_code(text, uuid, uuid, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_slot_overlap(uuid, date, time, time, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_available_slots(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_booking(uuid, date, time, int, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.confirm_booking_payment(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fail_booking_payment(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_blocked_slot(uuid, date, time, time, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_blocked_slot(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.complete_booking(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- Allow authenticated to call the functions they need
GRANT EXECUTE ON FUNCTION public.get_available_slots(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(uuid, date, time, int, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_booking_payment(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fail_booking_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_promo_code(text, uuid, uuid, numeric) TO authenticated;
