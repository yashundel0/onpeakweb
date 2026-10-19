/*
# Update create_booking RPC + bookings default to use pay_at_venue

## Changes
1. bookings.payment_status column default changed from 'pending' to 'pay_at_venue'
2. create_booking SECURITY DEFINER function updated:
   - Inserts bookings with payment_status = 'pay_at_venue' (pay at the venue, no online payment)
   - Inserts bookings with booking_status = 'confirmed' immediately (slot is reserved)
   - payments table record also set to 'pay_at_venue'

## Important
- No online payment gateway is used. Customers pay at the OnPeak location on arrival.
- Admins can later update payment_status to 'paid' after collecting payment.
*/

-- Update column default
ALTER TABLE bookings
  ALTER COLUMN payment_status SET DEFAULT 'pay_at_venue';

-- Replace create_booking to use pay_at_venue + confirmed booking status
CREATE OR REPLACE FUNCTION public.create_booking(
  p_court_id uuid,
  p_booking_date date,
  p_start_time time without time zone,
  p_duration_minutes integer,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_promo_code text DEFAULT NULL::text,
  p_notes text DEFAULT NULL::text
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
    SELECT * INTO v_promo_result FROM public.validate_promo_code(p_promo_code, v_location_id, v_sport_id, v_price);
    IF NOT v_promo_result.is_valid THEN
      RETURN QUERY SELECT NULL::uuid, NULL::text, 0::numeric, 0::numeric, 0::numeric, false, v_promo_result.error_message::text;
      RETURN;
    END IF;
    v_discount := v_promo_result.discount_amount;
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
    v_price, v_discount, v_final_price, v_promo_result.promo_code_id,
    'pay_at_venue', 'confirmed',
    p_customer_name, p_customer_email, p_customer_phone, p_notes
  )
  RETURNING id INTO v_booking_id;

  IF v_promo_result.promo_code_id IS NOT NULL THEN
    UPDATE promo_codes SET used_count = used_count + 1 WHERE id = v_promo_result.promo_code_id;
  END IF;

  INSERT INTO payments (booking_id, amount_aed, status)
  VALUES (v_booking_id, v_final_price, 'pay_at_venue');

  RETURN QUERY
  SELECT v_booking_id, v_booking_code, v_price, v_discount, v_final_price, true, 'Booking created successfully'::text;
  RETURN;
END;
$$;
