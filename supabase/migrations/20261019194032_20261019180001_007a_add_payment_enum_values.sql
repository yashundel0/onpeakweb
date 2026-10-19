/*
# Add pay_at_venue and cancelled to payment_status_enum

Adds two new labels to the payment_status_enum type:
- pay_at_venue: customer will pay at the OnPeak location on arrival
- cancelled: booking payment was cancelled

These must be committed in a separate transaction before being used in function bodies.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'pay_at_venue'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status_enum')
  ) THEN
    ALTER TYPE payment_status_enum ADD VALUE 'pay_at_venue';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'cancelled'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_status_enum')
  ) THEN
    ALTER TYPE payment_status_enum ADD VALUE 'cancelled';
  END IF;
END $$;
