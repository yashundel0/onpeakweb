/*
# Deactivate non-spec locations

1. Purpose
The platform specification requires exactly two active locations:
- OnPeak Location 1 (google_maps = https://maps.app.goo.gl/Fmqjo35YRTqqB3jFA?g_st=ic)
- OnPeak Location 2 (google_maps = https://maps.app.goo.gl/udtwpcmByc7Ekej5A?g_st=ic)

Two earlier seeded locations ("OnPeak Jumeirah" and "OnPeak Al Quoz") are not part
of this spec. We deactivate them (and their courts) so the public booking UI shows
only the two spec locations with their 10 resources total:
- Location 1: 3 padel courts + 1 football field
- Location 2: 5 padel courts + 1 indoor football field

2. Safety
- No data is deleted. Existing bookings on these locations/courts are preserved.
- is_active flags are set to false only.
- The public_read_courts / public_read_locations policies already filter by
  is_active = true, so deactivated resources disappear from the booking UI
  without losing historical data.

3. Changes
- locations.is_active = false for slugs 'jumeirah' and 'al-quoz'.
- courts.is_active = false for every court whose location_id matches those
  two locations.
*/

UPDATE locations
SET is_active = false
WHERE slug IN ('jumeirah', 'al-quoz');

UPDATE courts
SET is_active = false
WHERE location_id IN (
  SELECT id FROM locations WHERE slug IN ('jumeirah', 'al-quoz')
);
