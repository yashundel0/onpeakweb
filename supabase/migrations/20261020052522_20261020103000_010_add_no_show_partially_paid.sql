/*
# Add no_show and partially_paid enum values

## Changes
- Add `no_show` to `booking_status_enum` (admin marks a customer as not shown up).
- Add `partially_paid` to `payment_status_enum` (customer paid a deposit/part).
- These are additive only — no existing values are removed or renamed.
*/

ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE payment_status_enum ADD VALUE IF NOT EXISTS 'partially_paid';
