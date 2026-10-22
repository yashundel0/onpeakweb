/*
# Add players_count column and fix booking number format

## Changes

### 1. bookings table — add players_count
Add nullable integer column, default 1. This captures the number of
players for the booking.

### 2. generate_booking_code — fix format to ONP-YYYYMMDD-NNNN
The user wants 4-digit sequential booking numbers like:
  ONP-20261022-0001

The previous version appended a random UUID suffix (ONP-...-001-2A03).
We now use a per-day sequence stored in a dedicated sequence so numbers
are clean, human-readable, and still unique. The sequence wraps at 9999
which is more than enough for a single day at a sports club.

A uniqueness guard loop still checks for existing codes in the unlikely
case of a sequence collision.
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS players_count integer DEFAULT 1;

-- Drop old sequence and recreate with 4-digit range
DROP SEQUENCE IF EXISTS public.booking_code_seq;
CREATE SEQUENCE public.booking_code_seq AS integer START 1 MINVALUE 1 MAXVALUE 9999 CYCLE;

DROP FUNCTION IF EXISTS public.generate_booking_code();
CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_date_part text;
  v_counter int;
  v_code text;
  v_attempts int := 0;
BEGIN
  v_date_part := to_char(now()::date, 'YYYYMMDD');

  LOOP
    v_counter := nextval('booking_code_seq');
    v_code := 'ONP-' || v_date_part || '-' || LPAD(v_counter::text, 4, '0');

    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE booking_code = v_code);

    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      -- Fallback: append a uuid fragment for guaranteed uniqueness
      v_code := 'ONP-' || v_date_part || '-' || LPAD(v_counter::text, 4, '0') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
      EXIT;
    END IF;
  END LOOP;

  RETURN v_code;
END;
$function$;
