/*
# Fix create_booking — use scalar variables instead of unassigned record

## Problem
The previous fix (migration 012) initialized `v_promo_result` with
`ROW(0, NULL, false, NULL)`. But PL/pgSQL anonymous records initialized
with ROW() do NOT have named fields, so accessing
`v_promo_result.promo_code_id` still fails with:
  record "v_promo_result" has no field "promo_code_id"

The original bug was that when no promo code was provided, the record
was never assigned via `SELECT * INTO`, so accessing its fields crashed
with "record v_promo_result is not assigned yet".

## Real Fix
Replace the `record` variable with three separate scalar variables that
always have safe defaults:
  v_promo_is_valid  boolean := false;
  v_promo_id        uuid    := NULL;
  v_promo_discount  numeric := 0;
  v_promo_error     text    := NULL;

When a promo code IS provided, `SELECT ... INTO` populates these
scalars from `validate_promo_code()`. When no promo is provided, they
keep their safe defaults and the INSERT works normally with
`promo_code_id = NULL` and `discount = 0`.

## Booking flow (no promo)
1. Court validation — unchanged
2. Operating hours check — unchanged
3. Overlap check — unchanged
4. Price calc — unchanged
5. Promo: skipped (scalars stay at defaults)
6. final_price = price - 0 = price
7. Booking code generated (no gen_random_bytes)
8. INSERT with promo_code_id = NULL — works
9. Payment row inserted — works

## Booking flow (with promo)
1-4 same
5. validate_promo_code() called, scalars populated
6. If invalid → return error (unchanged)
7. If valid → discount applied, final_price = price - discount
8. INSERT with promo_code_id = v_promo_id
9. used_count incremented

## Compatibility
- CREATE OR REPLACE, no data loss
- All other functions unchanged
*/

CREATE OR REPLACE FUNCTION public.create_booking(
  p_court_id uuid,
  p_booking_date date,
  p_start_time time,
  p_duration_minutes integer,
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
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_court courts%ROWTYPE;
  v_location_id uuid;
  v_sport_id uuid;
  v_end_time time;
  v_price numeric(10,2);
  v_discount numeric(10,2) := 0;
  v_final_price numeric(10,2);
  -- Promo scalars — always initialized, safe to read even with no promo code
  v_promo_is_valid  boolean := false;
  v_promo_id        uuid    := NULL;
  v_promo_discount  numeric := 0;
  v_promo_error     text    := NULL;
  v_booking_code text;
  v_booking_id uuid;
  v_weekday int;
  v_is_open boolean;
  v_open time;
  v_close time;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'You must be logged in to book'::text;
    RETURN;
  END IF;

  SELECT * INTO v_court FROM courts WHERE id = p_court_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Court not found'::text;
    RETURN;
  END IF;

  v_location_id := v_court.location_id;
  v_sport_id := v_court.sport_id;
  v_end_time := p_start_time + make_interval(mins => p_duration_minutes);

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

  IF p_booking_date < now()::date THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Cannot book in the past'::text;
    RETURN;
  END IF;

  IF p_booking_date = now()::date AND p_start_time <= now()::time THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'Cannot book a past time slot'::text;
    RETURN;
  END IF;

  IF public.check_slot_overlap(p_court_id, p_booking_date, p_start_time, v_end_time) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, 'This time slot is already booked or blocked'::text;
    RETURN;
  END IF;

  v_price := public.get_court_price(p_court_id, p_duration_minutes, p_start_time, p_booking_date);

  IF p_promo_code IS NOT NULL AND p_promo_code != '' THEN
    SELECT discount_amount, promo_code_id, is_valid, error_message
      INTO v_promo_discount, v_promo_id, v_promo_is_valid, v_promo_error
    FROM public.validate_promo_code(p_promo_code, v_location_id, v_sport_id, v_price);

    IF NOT v_promo_is_valid THEN
      RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, COALESCE(v_promo_error, 'Invalid promo code')::text;
      RETURN;
    END IF;

    v_discount := v_promo_discount;
  END IF;

  v_final_price := v_price - v_discount;
  v_booking_code := public.generate_booking_code();

  INSERT INTO bookings (
    booking_code, user_id, location_id, sport_id, court_id,
    booking_date, start_time, end_time, duration_minutes,
    price_aed, discount_aed, final_price_aed, promo_code_id,
    payment_status, booking_status,
    customer_name, customer_email, customer_phone, notes
  ) VALUES (
    v_booking_code, v_user_id, v_location_id, v_sport_id, p_court_id,
    p_booking_date, p_start_time, v_end_time, p_duration_minutes,
    v_price, v_discount, v_final_price, v_promo_id,
    'pay_at_venue', 'confirmed',
    p_customer_name, p_customer_email, p_customer_phone, p_notes
  )
  RETURNING id INTO v_booking_id;

  IF v_promo_id IS NOT NULL THEN
    UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo_id;
  END IF;

  INSERT INTO payments (booking_id, amount_aed, status)
  VALUES (v_booking_id, v_final_price, 'pay_at_venue');

  RETURN QUERY
  SELECT v_booking_id, v_booking_code, v_price, v_discount, v_final_price, true, 'Booking created successfully'::text;
  RETURN;
END;
$function$;
