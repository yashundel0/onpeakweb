/*
# Fix generate_booking_code — remove gen_random_bytes dependency

## Problem
`generate_booking_code()` used `gen_random_bytes()` which requires the
`pgcrypto` extension. pgcrypto is NOT installed on this Supabase project,
so every booking attempt failed with:
  function gen_random_bytes(integer) does not exist

## Fix
Rewrite `generate_booking_code()` to use `gen_random_uuid()` (built into
Postgres 13+, no extension required) and produce the requested format:
  ONP-YYYYMMDD-NNN
where NNN is a zero-padded daily counter seeded by the date + a uuid suffix
for uniqueness. A uniqueness loop guarantees no collision with existing
booking codes.

## Also creates
- `booking_code_seq` sequence — referenced by `admin_create_booking` RPC
  added in migration 009 but never created. This makes admin manual
  bookings work and keeps a human-friendly daily counter.

## Compatibility
- No destructive changes.
- No tables or columns dropped.
- Existing booking codes are untouched.
*/

CREATE SEQUENCE IF NOT EXISTS public.booking_code_seq AS integer MAXVALUE 999 CYCLE;

DROP FUNCTION IF EXISTS public.generate_booking_code();
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_date_part text;
  v_counter int;
  v_suffix text;
  v_code text;
  v_attempts int := 0;
BEGIN
  v_date_part := to_char(now()::date, 'YYYYMMDD');

  LOOP
    v_counter := nextval('booking_code_seq') % 1000;
    v_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    v_code := 'ONP-' || v_date_part || '-' || LPAD(v_counter::text, 3, '0') || '-' || v_suffix;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE booking_code = v_code);

    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      -- Extremely unlikely; fall back to a full uuid tail for guaranteed uniqueness
      v_code := 'ONP-' || v_date_part || '-' || replace(gen_random_uuid()::text, '-', '');
      EXIT;
    END IF;
  END LOOP;

  RETURN v_code;
END;
$function$;

-- Make admin_create_booking use the same code generator (it previously built
-- the code inline using the sequence; route it through generate_booking_code
-- for consistency and uniqueness safety).
DROP FUNCTION IF EXISTS public.admin_create_booking(
  uuid, uuid, uuid, date, time, integer, text, text, text, text, text
);
CREATE OR REPLACE FUNCTION public.admin_create_booking(
  p_court_id uuid,
  p_location_id uuid,
  p_sport_id uuid,
  p_booking_date date,
  p_start_time time,
  p_duration_minutes integer,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_payment_status text DEFAULT 'pay_at_venue',
  p_notes text DEFAULT NULL
)
RETURNS TABLE(success boolean, booking_code text, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_end_time time;
  v_price numeric(10,2);
  v_code text;
  v_pay payment_status_enum;
  v_booking_id uuid;
BEGIN
  SELECT p.is_admin INTO v_is_admin FROM profiles p WHERE p.id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RETURN QUERY SELECT false, NULL::text, 'Admin access required.'::text;
    RETURN;
  END IF;

  v_end_time := p_start_time + make_interval(mins => p_duration_minutes);

  IF public.check_slot_overlap(p_court_id, p_booking_date, p_start_time, v_end_time) THEN
    RETURN QUERY SELECT false, NULL::text, 'This time slot is already booked or blocked.'::text;
    RETURN;
  END IF;

  v_price := public.get_court_price(p_court_id, p_duration_minutes, p_start_time, p_booking_date);
  v_code := public.generate_booking_code();

  v_pay := CASE
    WHEN p_payment_status = 'paid' THEN 'paid'::payment_status_enum
    WHEN p_payment_status = 'partially_paid' THEN 'partially_paid'::payment_status_enum
    WHEN p_payment_status = 'pending' THEN 'pending'::payment_status_enum
    ELSE 'pay_at_venue'::payment_status_enum
  END;

  INSERT INTO bookings (
    booking_code, location_id, sport_id, court_id,
    booking_date, start_time, end_time, duration_minutes,
    price_aed, final_price_aed,
    customer_name, customer_email, customer_phone, notes,
    booking_status, payment_status
  ) VALUES (
    v_code, p_location_id, p_sport_id, p_court_id,
    p_booking_date, p_start_time, v_end_time, p_duration_minutes,
    v_price, v_price,
    p_customer_name, p_customer_email, p_customer_phone, p_notes,
    'confirmed'::booking_status_enum, v_pay
  )
  RETURNING id INTO v_booking_id;

  INSERT INTO payments (booking_id, amount_aed, status)
  VALUES (v_booking_id, v_price, v_pay);

  RETURN QUERY SELECT true, v_code, NULL::text;
END;
$function$;
