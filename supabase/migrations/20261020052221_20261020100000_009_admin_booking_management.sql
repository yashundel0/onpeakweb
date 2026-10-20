/*
# Add admin notes, reschedule RPC, and admin manual booking RPC

## Changes

### 1. bookings table — add admin_notes column
- `admin_notes` (text, nullable): internal admin-only notes on a booking.
  Never exposed to customers (not selected by customer-facing read policies
  and not returned by create_booking to the customer).

### 2. reschedule_booking RPC
- Allows an admin to change the date, start time, end time, and/or court
  of an existing booking.
- Re-checks availability before applying the change (no double bookings).
- SECURITY DEFINER so it can run with admin privileges; access is gated
  by an is_admin check on the calling user.

### 3. admin_create_booking RPC
- Allows an admin to create a booking on behalf of a walk-in/WhatsApp
  customer without requiring that customer to sign up.
- Sets booking_status to 'confirmed' and payment_status to the provided
  value (default 'pay_at_venue').
- Reuses the same overlap-check logic as create_booking so double
  bookings are impossible.

### 4. update_booking_admin RPC
- Allows an admin to update booking_status, payment_status, admin_notes,
  and customer_notes on a booking in a single guarded call.

## Security
- All three RPCs are SECURITY DEFINER and check `profiles.is_admin` for
  the calling auth.uid(). Non-admins receive a clear error.
- RLS policies on bookings are unchanged. The customer-facing
  create_booking RPC is unchanged.
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS admin_notes text;

-- ---------------------------------------------------------------------------
-- reschedule_booking
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.reschedule_booking(uuid, date, time, time, uuid);
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id uuid,
  p_new_date date,
  p_new_start_time time,
  p_new_end_time time,
  p_new_court_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_existing record;
  v_court_id uuid;
  v_start time;
  v_end time;
  v_dur int;
BEGIN
  SELECT p.is_admin INTO v_is_admin FROM profiles p WHERE p.id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RETURN QUERY SELECT false, 'Admin access required.'::text;
    RETURN;
  END IF;

  SELECT court_id, booking_date, start_time, end_time, duration_minutes
    INTO v_existing
    FROM bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found.'::text;
    RETURN;
  END IF;

  v_court_id := COALESCE(p_new_court_id, v_existing.court_id);
  v_start := p_new_start_time;
  v_end := p_new_end_time;
  v_dur := EXTRACT(EPOCH FROM (p_new_end_time::time - p_new_start_time::time)) / 60;

  IF v_dur <= 0 THEN
    RETURN QUERY SELECT false, 'End time must be after start time.'::text;
    RETURN;
  END IF;

  IF public.check_slot_overlap(v_court_id, p_new_date, v_start, v_end, p_booking_id) THEN
    RETURN QUERY SELECT false, 'The selected time conflicts with another booking or blocked slot.'::text;
    RETURN;
  END IF;

  UPDATE bookings
    SET court_id = v_court_id,
        booking_date = p_new_date,
        start_time = v_start,
        end_time = v_end,
        duration_minutes = v_dur,
        updated_at = now()
    WHERE id = p_booking_id;

  RETURN QUERY SELECT true, NULL::text;
END;
$function$;

-- ---------------------------------------------------------------------------
-- admin_create_booking
-- ---------------------------------------------------------------------------
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

  v_code := 'ONP-' || to_char(p_booking_date, 'YYYYMMDD') || '-' ||
            LPAD((nextval('booking_code_seq') % 1000)::text, 3, '0');

  v_pay := CASE
    WHEN p_payment_status = 'paid' THEN 'paid'::payment_status_enum
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
  );

  RETURN QUERY SELECT true, v_code, NULL::text;
END;
$function$;

-- ---------------------------------------------------------------------------
-- update_booking_admin
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.update_booking_admin(uuid, text, text, text, text);
CREATE OR REPLACE FUNCTION public.update_booking_admin(
  p_booking_id uuid,
  p_booking_status text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_admin_notes text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
  v_bs booking_status_enum;
  v_ps payment_status_enum;
BEGIN
  SELECT p.is_admin INTO v_is_admin FROM profiles p WHERE p.id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RETURN QUERY SELECT false, 'Admin access required.'::text;
    RETURN;
  END IF;

  IF p_booking_status IS NOT NULL THEN
    v_bs := p_booking_status::booking_status_enum;
    UPDATE bookings SET booking_status = v_bs, updated_at = now() WHERE id = p_booking_id;
  END IF;

  IF p_payment_status IS NOT NULL THEN
    v_ps := p_payment_status::payment_status_enum;
    UPDATE bookings SET payment_status = v_ps, updated_at = now() WHERE id = p_booking_id;
    IF p_payment_status = 'paid' THEN
      UPDATE payments SET status = 'paid'::payment_status_enum, paid_at = now() WHERE booking_id = p_booking_id;
    END IF;
  END IF;

  IF p_admin_notes IS NOT NULL THEN
    UPDATE bookings SET admin_notes = p_admin_notes, updated_at = now() WHERE id = p_booking_id;
  END IF;

  IF p_notes IS NOT NULL THEN
    UPDATE bookings SET notes = p_notes, updated_at = now() WHERE id = p_booking_id;
  END IF;

  RETURN QUERY SELECT true, NULL::text;
END;
$function$;
