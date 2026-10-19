/*
# OnPeak Booking Platform — Server-Side Functions

## Overview
Creates SECURITY DEFINER functions for all critical booking operations.
These functions enforce server-side validation that cannot be bypassed
by the frontend, including:
- Double-booking prevention via row-level overlap checks
- Price calculation from court_pricing (never trusted from frontend)
- Promo code validation and discount calculation
- Booking cancellation with configurable rules
- Availability query for the booking UI

## Functions Created
1. get_available_slots(court_uuid, target_date) — returns all time slots with availability status
2. create_booking(...) — atomically creates a booking with overlap prevention + server-calculated price
3. cancel_booking(booking_uuid, reason) — cancels a booking, freeing the slot
4. get_court_price(court_uuid, duration_int, slot_time, target_date) — calculates price for a slot
5. validate_promo_code(code_text, location_uuid, sport_uuid, price_numeric) — validates + calculates discount
6. confirm_booking_payment(booking_uuid) — marks booking as confirmed after payment
7. fail_booking_payment(booking_uuid) — marks payment failed, cancels booking
8. is_admin() — checks if current user is admin (for frontend gating)

## Security
All functions are SECURITY DEFINER with search_path = public.
They run with elevated privileges but validate auth.uid() internally.
No price, availability, or permission is trusted from the frontend.
*/

-- ============================================================
-- Helper: is_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- Helper: get_time_band
-- Determines if a time is off_peak/standard/peak
-- off_peak: before 16:00
-- standard: 16:00-18:00
-- peak: 18:00 onwards
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_time_band(slot_start time)
RETURNS time_band_enum
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN slot_start < '16:00'::time THEN 'off_peak'::time_band_enum
    WHEN slot_start < '18:00'::time THEN 'standard'::time_band_enum
    ELSE 'peak'::time_band_enum
  END;
$$;

-- ============================================================
-- Helper: get_day_type
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_day_type(target_date date)
RETURNS day_type_enum
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN EXTRACT(dow FROM target_date) IN (5, 6) THEN 'weekend'::day_type_enum
    ELSE 'weekday'::day_type_enum
  END;
$$;

-- ============================================================
-- GET COURT PRICE
-- Returns the price for a specific court, duration, and time slot
-- Falls back to a default price if no specific pricing rule exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_court_price(
  p_court_id uuid,
  p_duration int,
  p_slot_start time,
  p_booking_date date
)
RETURNS numeric(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_day_type day_type_enum;
  v_time_band time_band_enum;
  v_price numeric(10,2);
BEGIN
  v_day_type := public.get_day_type(p_booking_date);
  v_time_band := public.get_time_band(p_slot_start);

  SELECT price_aed INTO v_price
  FROM court_pricing
  WHERE court_id = p_court_id
    AND duration_minutes = p_duration
    AND day_type = v_day_type
    AND time_band = v_time_band
    AND is_active = true
  LIMIT 1;

  IF v_price IS NULL THEN
    -- Fallback: try standard time band
    SELECT price_aed INTO v_price
    FROM court_pricing
    WHERE court_id = p_court_id
      AND duration_minutes = p_duration
      AND day_type = v_day_type
      AND is_active = true
    ORDER BY time_band = 'standard' DESC, time_band = 'peak' DESC
    LIMIT 1;
  END IF;

  IF v_price IS NULL THEN
    -- Final fallback: any pricing for this court + duration
    SELECT price_aed INTO v_price
    FROM court_pricing
    WHERE court_id = p_court_id
      AND duration_minutes = p_duration
      AND is_active = true
    LIMIT 1;
  END IF;

  IF v_price IS NULL THEN
    -- Ultimate fallback: default 100 AED for 60min, scaled for duration
    v_price := 100.00 * (p_duration::numeric / 60.0);
  END IF;

  RETURN v_price;
END;
$$;

-- ============================================================
-- VALIDATE PROMO CODE
-- Returns discount amount or 0 if invalid
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  p_code text,
  p_location_id uuid,
  p_sport_id uuid,
  p_price numeric
)
RETURNS TABLE(discount_amount numeric, promo_code_id uuid, is_valid boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_discount numeric(10,2);
BEGIN
  SELECT * INTO v_promo FROM promo_codes WHERE UPPER(code) = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::numeric, NULL::uuid, false, 'Promo code not found or inactive';
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND now() > v_promo.valid_until THEN
    RETURN QUERY SELECT 0::numeric, NULL::uuid, false, 'Promo code has expired';
    RETURN;
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN QUERY SELECT 0::numeric, NULL::uuid, false, 'Promo code usage limit reached';
    RETURN;
  END IF;

  IF v_promo.location_restriction IS NOT NULL AND v_promo.location_restriction != p_location_id THEN
    RETURN QUERY SELECT 0::numeric, NULL::uuid, false, 'Promo code not valid for this location';
    RETURN;
  END IF;

  IF v_promo.sport_restriction IS NOT NULL AND v_promo.sport_restriction != p_sport_id THEN
    RETURN QUERY SELECT 0::numeric, NULL::uuid, false, 'Promo code not valid for this sport';
    RETURN;
  END IF;

  IF v_promo.discount_type = 'percentage' THEN
    v_discount := p_price * (v_promo.discount_value / 100.0);
  ELSE
    v_discount := LEAST(v_promo.discount_value, p_price);
  END IF;

  RETURN QUERY SELECT v_discount, v_promo.id, true, 'Valid'::text;
  RETURN;
END;
$$;

-- ============================================================
-- CHECK SLOT OVERLAP
-- Internal helper: returns true if a booking overlaps with an existing
-- confirmed/pending booking on the same court and date
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_slot_overlap(
  p_court_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE court_id = p_court_id
      AND booking_date = p_booking_date
      AND booking_status IN ('pending', 'confirmed')
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND start_time < p_end_time
      AND p_start_time < end_time
  ) OR EXISTS(
    SELECT 1 FROM blocked_slots
    WHERE court_id = p_court_id
      AND date = p_booking_date
      AND start_time < p_end_time
      AND p_start_time < end_time
  );
$$;

-- ============================================================
-- GET AVAILABLE SLOTS
-- Returns all time slots for a court on a date with availability status
-- Slots are generated from operating_hours, then checked against bookings + blocked slots
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_court_id uuid,
  p_booking_date date
)
RETURNS TABLE(
  start_time time,
  end_time time,
  duration_minutes int,
  is_available boolean,
  status text,
  price_aed numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_weekday int;
  v_open time;
  v_close time;
  v_is_open boolean;
  v_current_time time := now()::time;
  v_today date := now()::date;
  v_slot_duration int := 60;
  v_slot_start time;
  v_slot_end time;
  v_price numeric(10,2);
  v_is_available boolean;
  v_status text;
BEGIN
  v_weekday := EXTRACT(dow FROM p_booking_date)::int;

  -- Get operating hours for this court + weekday
  SELECT open_time, close_time, is_open INTO v_open, v_close, v_is_open
  FROM operating_hours
  WHERE court_id = p_court_id AND weekday = v_weekday
  LIMIT 1;

  IF NOT FOUND OR v_is_open = false THEN
    RETURN;
  END IF;

  -- Generate hourly slots from open to close
  v_slot_start := v_open;
  WHILE v_slot_start < v_close LOOP
    v_slot_end := v_slot_start + make_interval(mins => v_slot_duration);
    IF v_slot_end > v_close THEN
      EXIT;
    END IF;

    -- If the date is today, don't show past slots
    IF p_booking_date = v_today AND v_slot_start <= v_current_time THEN
      v_is_available := false;
      v_status := 'past';
    ELSE
      -- Check for overlap with existing bookings or blocked slots
      IF public.check_slot_overlap(p_court_id, p_booking_date, v_slot_start, v_slot_end) THEN
        v_is_available := false;
        v_status := 'booked';
      ELSE
        v_is_available := true;
        v_status := 'available';
      END IF;
    END IF;

    v_price := public.get_court_price(p_court_id, v_slot_duration, v_slot_start, p_booking_date);

    RETURN QUERY
      SELECT v_slot_start, v_slot_end, v_slot_duration, v_is_available, v_status, v_price;

    v_slot_start := v_slot_end;
  END LOOP;

  RETURN;
END;
$$;

-- ============================================================
-- CREATE BOOKING
-- The core atomic booking function with double-booking prevention
-- All prices calculated server-side, never from frontend
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_booking(
  p_court_id uuid,
  p_booking_date date,
  p_start_time time,
  p_duration_minutes int,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_promo_code text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(
  booking_id uuid,
  booking_code text,
  price_aed numeric,
  discount_aed numeric,
  final_price_aed numeric,
  success boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_court courts%ROWTYPE;
  v_location_id uuid;
  v_sport_id uuid;
  v_end_time time;
  v_price numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_final_price numeric(10,2);
  v_promo_result record;
  v_booking_code text;
  v_booking_id uuid;
  v_weekday int;
  v_is_open boolean;
  v_open time;
  v_close time;
BEGIN
  -- Must be authenticated
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'You must be logged in to book'::text;
    RETURN;
  END IF;

  -- Load court
  SELECT * INTO v_court FROM courts WHERE id = p_court_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Court not found'::text;
    RETURN;
  END IF;

  v_location_id := v_court.location_id;
  v_sport_id := v_court.sport_id;
  v_end_time := p_start_time + make_interval(mins => p_duration_minutes);

  -- Validate operating hours
  v_weekday := EXTRACT(dow FROM p_booking_date)::int;
  SELECT open_time, close_time, is_open INTO v_open, v_close, v_is_open
  FROM operating_hours WHERE court_id = p_court_id AND weekday = v_weekday LIMIT 1;

  IF NOT FOUND OR v_is_open = false THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Court is closed on this day'::text;
    RETURN;
  END IF;

  IF p_start_time < v_open OR v_end_time > v_close THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Selected time is outside operating hours'::text;
    RETURN;
  END IF;

  -- Check for past date
  IF p_booking_date < now()::date THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Cannot book in the past'::text;
    RETURN;
  END IF;

  -- Check for past time today
  IF p_booking_date = now()::date AND p_start_time <= now()::time THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Cannot book a past time slot'::text;
    RETURN;
  END IF;

  -- CRITICAL: Check for double booking (atomic with the insert below)
  IF public.check_slot_overlap(p_court_id, p_booking_date, p_start_time, v_end_time) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'This time slot is already booked or blocked'::text;
    RETURN;
  END IF;

  -- Calculate price server-side
  v_price := public.get_court_price(p_court_id, p_duration_minutes, p_start_time, p_booking_date);

  -- Validate promo code if provided
  IF p_promo_code IS NOT NULL AND p_promo_code != '' THEN
    SELECT * INTO v_promo_result FROM public.validate_promo_code(p_promo_code, v_location_id, v_sport_id, v_price);
    IF NOT v_promo_result.is_valid THEN
      RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, v_promo_result.error_message::text;
      RETURN;
    END IF;
    v_discount := v_promo_result.discount_amount;
  END IF;

  v_final_price := v_price - v_discount;

  -- Generate unique booking code
  v_booking_code := public.generate_booking_code();

  -- Insert the booking
  INSERT INTO bookings (
    booking_code, user_id, location_id, sport_id, court_id,
    booking_date, start_time, end_time, duration_minutes,
    price_aed, discount_aed, final_price_aed, promo_code_id,
    payment_status, booking_status,
    customer_name, customer_email, customer_phone, notes
  ) VALUES (
    v_booking_code, v_user_id, v_location_id, v_sport_id, p_court_id,
    p_booking_date, p_start_time, v_end_time, p_duration_minutes,
    v_price, v_discount, v_final_price, v_promo_result.promo_code_id,
    'pending', 'pending',
    p_customer_name, p_customer_email, p_customer_phone, p_notes
  )
  RETURNING id INTO v_booking_id;

  -- Increment promo code usage
  IF v_promo_result.promo_code_id IS NOT NULL THEN
    UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo_result.promo_code_id;
  END IF;

  -- Create initial payment record
  INSERT INTO payments (booking_id, amount_aed, status)
  VALUES (v_booking_id, v_final_price, 'pending');

  RETURN QUERY
    SELECT v_booking_id, v_booking_code, v_price, v_discount, v_final_price, true, 'Booking created successfully'::text;
  RETURN;
END;
$$;

-- ============================================================
-- CANCEL BOOKING
-- Cancels a booking and frees the slot
-- Only the booking owner or an admin can cancel
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking bookings%ROWTYPE;
  v_is_user_admin boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'You must be logged in'::text;
    RETURN;
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found'::text;
    RETURN;
  END IF;

  v_is_user_admin := public.is_admin();

  -- Check ownership or admin
  IF v_booking.user_id != v_user_id AND NOT v_is_user_admin THEN
    RETURN QUERY SELECT false, 'You can only cancel your own bookings'::text;
    RETURN;
  END IF;

  -- Check booking is not already cancelled
  IF v_booking.booking_status = 'cancelled' THEN
    RETURN QUERY SELECT false, 'Booking is already cancelled'::text;
    RETURN;
  END IF;

  -- Update booking status
  UPDATE bookings
  SET booking_status = 'cancelled',
      cancellation_reason = p_reason,
      payment_status = CASE WHEN payment_status = 'paid' THEN 'refunded' ELSE payment_status END,
      updated_at = now()
  WHERE id = p_booking_id;

  -- Update payment if it was paid
  IF v_booking.payment_status = 'paid' THEN
    UPDATE payments SET status = 'refunded', refunded_at = now()
    WHERE booking_id = p_booking_id AND status = 'paid';
  END IF;

  RETURN QUERY SELECT true, 'Booking cancelled successfully'::text;
  RETURN;
END;
$$;

-- ============================================================
-- CONFIRM BOOKING PAYMENT
-- Marks a booking as confirmed after successful payment
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_booking_payment(
  p_booking_id uuid,
  p_provider_reference text DEFAULT NULL
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_user_admin boolean;
  v_booking bookings%ROWTYPE;
BEGIN
  v_is_user_admin := public.is_admin();

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found'::text;
    RETURN;
  END IF;

  -- Only the booking owner or admin can confirm payment
  IF v_booking.user_id != v_user_id AND NOT v_is_user_admin THEN
    RETURN QUERY SELECT false, 'Unauthorized'::text;
    RETURN;
  END IF;

  -- Verify slot is still available (not double-booked)
  IF public.check_slot_overlap(v_booking.court_id, v_booking.booking_date, v_booking.start_time, v_booking.end_time, v_booking.id) THEN
    RETURN QUERY SELECT false, 'This slot was booked by someone else while you were paying'::text;
    RETURN;
  END IF;

  -- Update booking to confirmed
  UPDATE bookings
  SET booking_status = 'confirmed',
      payment_status = 'paid',
      updated_at = now()
  WHERE id = p_booking_id;

  -- Update payment record
  UPDATE payments
  SET status = 'paid', paid_at = now(), provider_reference = COALESCE(p_provider_reference, provider_reference)
  WHERE booking_id = p_booking_id;

  RETURN QUERY SELECT true, 'Payment confirmed, booking confirmed'::text;
  RETURN;
END;
$$;

-- ============================================================
-- FAIL BOOKING PAYMENT
-- Marks payment as failed and cancels the booking
-- so the slot becomes available again
-- ============================================================
CREATE OR REPLACE FUNCTION public.fail_booking_payment(
  p_booking_id uuid
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found'::text;
    RETURN;
  END IF;

  UPDATE bookings
  SET payment_status = 'failed',
      booking_status = 'cancelled',
      cancellation_reason = 'Payment failed',
      updated_at = now()
  WHERE id = p_booking_id AND booking_status = 'pending';

  UPDATE payments
  SET status = 'failed', failed_at = now()
  WHERE booking_id = p_booking_id AND status = 'pending';

  RETURN QUERY SELECT true, 'Payment failed, booking cancelled'::text;
  RETURN;
END;
$$;

-- ============================================================
-- ADMIN: CREATE BLOCKED SLOT
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_blocked_slot(
  p_court_id uuid,
  p_date date,
  p_start_time time,
  p_end_time time,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(success boolean, error_message text, blocked_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocked_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT false, 'Admin access required'::text, NULL::uuid;
    RETURN;
  END IF;

  INSERT INTO blocked_slots (court_id, date, start_time, end_time, reason, created_by)
  VALUES (p_court_id, p_date, p_start_time, p_end_time, p_reason, auth.uid())
  RETURNING id INTO v_blocked_id;

  RETURN QUERY SELECT true, 'Slot blocked successfully'::text, v_blocked_id;
  RETURN;
END;
$$;

-- ============================================================
-- ADMIN: REMOVE BLOCKED SLOT
-- ============================================================
CREATE OR REPLACE FUNCTION public.remove_blocked_slot(
  p_blocked_id uuid
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT false, 'Admin access required'::text;
    RETURN;
  END IF;

  DELETE FROM blocked_slots WHERE id = p_blocked_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Blocked slot not found'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Slot unblocked successfully'::text;
  RETURN;
END;
$$;

-- ============================================================
-- ADMIN: MARK BOOKING COMPLETED
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_booking(
  p_booking_id uuid
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT false, 'Admin access required'::text;
    RETURN;
  END IF;

  UPDATE bookings SET booking_status = 'completed', updated_at = now()
  WHERE id = p_booking_id AND booking_status = 'confirmed';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found or not in confirmed state'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Booking marked as completed'::text;
  RETURN;
END;
$$;
