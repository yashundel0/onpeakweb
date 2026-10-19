/*
# OnPeak — Add Two New Locations with Facilities

## Overview
Extends the booking platform with two new locations and their individual
padel courts and football fields. Each court/field is a separate bookable
resource with its own unique ID, connected to the correct location and sport.

## Schema Changes
1. courts table: add `is_indoor` boolean (default false) — marks indoor/covered fields.
2. courts table: add `special_marker` text (nullable) — e.g. 'pink' for the pink padel court.

## New Data
- Location 1 (slug: onpeak-location-1): 3 Padel Courts + 1 Football Field (outdoor)
- Location 2 (slug: onpeak-location-2): 5 Padel Courts (Court 1 = Pink) + 1 Indoor Football Field
- Operating hours (08:00–23:00 daily) and full pricing for every new court/field.

## Security
- No new tables. Existing public-read RLS on locations/courts/operating_hours/court_pricing
  automatically covers the new rows.
- No policy changes required.

## Notes
- Idempotent: all inserts guarded by NOT EXISTS checks.
- Existing locations and courts are untouched.
*/

-- ============================================================
-- ADD COLUMNS TO COURTS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'courts' AND column_name = 'is_indoor') THEN
    ALTER TABLE courts ADD COLUMN is_indoor boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'courts' AND column_name = 'special_marker') THEN
    ALTER TABLE courts ADD COLUMN special_marker text;
  END IF;
END $$;

-- ============================================================
-- LOCATION 1
-- ============================================================
INSERT INTO locations (name, slug, address, city, google_maps, google_maps_embed, description, is_active, sort_order)
SELECT 'OnPeak Location 1', 'onpeak-location-1', 'Dubai, UAE', 'Dubai, UAE',
       'https://maps.app.goo.gl/Fmqjo35YRTqqB3jFA?g_st=ic',
       NULL,
       'OnPeak Location 1 — 3 padel courts and 1 outdoor football field.',
       true, 2
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'onpeak-location-1');

-- ============================================================
-- LOCATION 2
-- ============================================================
INSERT INTO locations (name, slug, address, city, google_maps, google_maps_embed, description, is_active, sort_order)
SELECT 'OnPeak Location 2', 'onpeak-location-2', 'Dubai, UAE', 'Dubai, UAE',
       'https://maps.app.goo.gl/udtwpcmByc7Ekej5A?g_st=ic',
       NULL,
       'OnPeak Location 2 — 5 padel courts (incl. Pink Court) and 1 indoor football field.',
       true, 3
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'onpeak-location-2');

-- ============================================================
-- COURTS — Location 1 (3 Padel + 1 Football, outdoor)
-- ============================================================
INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 1', 'padel', true, 0, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-1' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-1' AND cs.slug='padel' AND c.name='Padel Court 1');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 2', 'padel', true, 1, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-1' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-1' AND cs.slug='padel' AND c.name='Padel Court 2');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 3', 'padel', true, 2, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-1' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-1' AND cs.slug='padel' AND c.name='Padel Court 3');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Football Field 1', 'football', true, 0, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-1' AND s.slug = 'football'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-1' AND cs.slug='football' AND c.name='Football Field 1');

-- ============================================================
-- COURTS — Location 2 (5 Padel incl. Pink + 1 Indoor Football)
-- ============================================================
INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 1 — Pink Court', 'padel', true, 0, false, 'pink'
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-2' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-2' AND cs.slug='padel' AND c.name='Padel Court 1 — Pink Court');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 2', 'padel', true, 1, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-2' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-2' AND cs.slug='padel' AND c.name='Padel Court 2');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 3', 'padel', true, 2, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-2' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-2' AND cs.slug='padel' AND c.name='Padel Court 3');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 4', 'padel', true, 3, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-2' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-2' AND cs.slug='padel' AND c.name='Padel Court 4');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Padel Court 5', 'padel', true, 4, false, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-2' AND s.slug = 'padel'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-2' AND cs.slug='padel' AND c.name='Padel Court 5');

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order, is_indoor, special_marker)
SELECT l.id, s.id, 'Indoor Football Field 1', 'football', true, 0, true, NULL
FROM locations l, sports s
WHERE l.slug = 'onpeak-location-2' AND s.slug = 'football'
  AND NOT EXISTS (SELECT 1 FROM courts c JOIN locations cl ON c.location_id=cl.id JOIN sports cs ON c.sport_id=cs.id
                  WHERE cl.slug='onpeak-location-2' AND cs.slug='football' AND c.name='Indoor Football Field 1');

-- ============================================================
-- OPERATING HOURS — all new courts, 08:00–23:00 every day
-- ============================================================
INSERT INTO operating_hours (court_id, weekday, open_time, close_time, is_open)
SELECT c.id, w.weekday, '08:00'::time, '23:00'::time, true
FROM courts c
JOIN locations l ON c.location_id = l.id
CROSS JOIN generate_series(0, 6) AS w(weekday)
WHERE l.slug IN ('onpeak-location-1', 'onpeak-location-2')
  AND NOT EXISTS (SELECT 1 FROM operating_hours oh WHERE oh.court_id = c.id AND oh.weekday = w.weekday);

-- ============================================================
-- PRICING — Padel (new courts)
-- ============================================================
INSERT INTO court_pricing (court_id, duration_minutes, day_type, time_band, price_aed, is_active)
SELECT c.id, d.duration,
  CASE WHEN dt.day_type = 'weekday' THEN 'weekday'::day_type_enum ELSE 'weekend'::day_type_enum END,
  CASE WHEN tb.time_band = 'off_peak' THEN 'off_peak'::time_band_enum
       WHEN tb.time_band = 'standard' THEN 'standard'::time_band_enum
       ELSE 'peak'::time_band_enum END,
  CASE
    WHEN d.duration = 60 AND dt.day_type = 'weekday' AND tb.time_band = 'off_peak' THEN 100.00
    WHEN d.duration = 60 AND dt.day_type = 'weekday' AND tb.time_band = 'standard' THEN 120.00
    WHEN d.duration = 60 AND dt.day_type = 'weekday' AND tb.time_band = 'peak' THEN 150.00
    WHEN d.duration = 60 AND dt.day_type = 'weekend' AND tb.time_band = 'off_peak' THEN 120.00
    WHEN d.duration = 60 AND dt.day_type = 'weekend' AND tb.time_band = 'standard' THEN 150.00
    WHEN d.duration = 60 AND dt.day_type = 'weekend' AND tb.time_band = 'peak' THEN 180.00
    WHEN d.duration = 90 AND dt.day_type = 'weekday' AND tb.time_band = 'off_peak' THEN 150.00
    WHEN d.duration = 90 AND dt.day_type = 'weekday' AND tb.time_band = 'standard' THEN 180.00
    WHEN d.duration = 90 AND dt.day_type = 'weekday' AND tb.time_band = 'peak' THEN 220.00
    WHEN d.duration = 90 AND dt.day_type = 'weekend' AND tb.time_band = 'off_peak' THEN 180.00
    WHEN d.duration = 90 AND dt.day_type = 'weekend' AND tb.time_band = 'standard' THEN 220.00
    WHEN d.duration = 90 AND dt.day_type = 'weekend' AND tb.time_band = 'peak' THEN 260.00
    WHEN d.duration = 120 AND dt.day_type = 'weekday' AND tb.time_band = 'off_peak' THEN 200.00
    WHEN d.duration = 120 AND dt.day_type = 'weekday' AND tb.time_band = 'standard' THEN 240.00
    WHEN d.duration = 120 AND dt.day_type = 'weekday' AND tb.time_band = 'peak' THEN 300.00
    WHEN d.duration = 120 AND dt.day_type = 'weekend' AND tb.time_band = 'off_peak' THEN 240.00
    WHEN d.duration = 120 AND dt.day_type = 'weekend' AND tb.time_band = 'standard' THEN 300.00
    WHEN d.duration = 120 AND dt.day_type = 'weekend' AND tb.time_band = 'peak' THEN 360.00
  END,
  true
FROM courts c
JOIN sports s ON c.sport_id = s.id
JOIN locations l ON c.location_id = l.id
CROSS JOIN (VALUES (60), (90), (120)) AS d(duration)
CROSS JOIN (VALUES ('weekday'), ('weekend')) AS dt(day_type)
CROSS JOIN (VALUES ('off_peak'), ('standard'), ('peak')) AS tb(time_band)
WHERE s.slug = 'padel' AND l.slug IN ('onpeak-location-1', 'onpeak-location-2')
  AND NOT EXISTS (SELECT 1 FROM court_pricing cp
                  WHERE cp.court_id = c.id AND cp.duration_minutes = d.duration
                    AND cp.day_type = dt.day_type::day_type_enum AND cp.time_band = tb.time_band::time_band_enum);

-- ============================================================
-- PRICING — Football (new courts)
-- ============================================================
INSERT INTO court_pricing (court_id, duration_minutes, day_type, time_band, price_aed, is_active)
SELECT c.id, d.duration,
  CASE WHEN dt.day_type = 'weekday' THEN 'weekday'::day_type_enum ELSE 'weekend'::day_type_enum END,
  CASE WHEN tb.time_band = 'off_peak' THEN 'off_peak'::time_band_enum
       WHEN tb.time_band = 'standard' THEN 'standard'::time_band_enum
       ELSE 'peak'::time_band_enum END,
  CASE
    WHEN d.duration = 60 AND dt.day_type = 'weekday' AND tb.time_band = 'off_peak' THEN 200.00
    WHEN d.duration = 60 AND dt.day_type = 'weekday' AND tb.time_band = 'standard' THEN 250.00
    WHEN d.duration = 60 AND dt.day_type = 'weekday' AND tb.time_band = 'peak' THEN 300.00
    WHEN d.duration = 60 AND dt.day_type = 'weekend' AND tb.time_band = 'off_peak' THEN 250.00
    WHEN d.duration = 60 AND dt.day_type = 'weekend' AND tb.time_band = 'standard' THEN 300.00
    WHEN d.duration = 60 AND dt.day_type = 'weekend' AND tb.time_band = 'peak' THEN 350.00
    WHEN d.duration = 90 AND dt.day_type = 'weekday' AND tb.time_band = 'off_peak' THEN 300.00
    WHEN d.duration = 90 AND dt.day_type = 'weekday' AND tb.time_band = 'standard' THEN 375.00
    WHEN d.duration = 90 AND dt.day_type = 'weekday' AND tb.time_band = 'peak' THEN 450.00
    WHEN d.duration = 90 AND dt.day_type = 'weekend' AND tb.time_band = 'off_peak' THEN 375.00
    WHEN d.duration = 90 AND dt.day_type = 'weekend' AND tb.time_band = 'standard' THEN 450.00
    WHEN d.duration = 90 AND dt.day_type = 'weekend' AND tb.time_band = 'peak' THEN 525.00
    WHEN d.duration = 120 AND dt.day_type = 'weekday' AND tb.time_band = 'off_peak' THEN 400.00
    WHEN d.duration = 120 AND dt.day_type = 'weekday' AND tb.time_band = 'standard' THEN 500.00
    WHEN d.duration = 120 AND dt.day_type = 'weekday' AND tb.time_band = 'peak' THEN 600.00
    WHEN d.duration = 120 AND dt.day_type = 'weekend' AND tb.time_band = 'off_peak' THEN 500.00
    WHEN d.duration = 120 AND dt.day_type = 'weekend' AND tb.time_band = 'standard' THEN 600.00
    WHEN d.duration = 120 AND dt.day_type = 'weekend' AND tb.time_band = 'peak' THEN 700.00
  END,
  true
FROM courts c
JOIN sports s ON c.sport_id = s.id
JOIN locations l ON c.location_id = l.id
CROSS JOIN (VALUES (60), (90), (120)) AS d(duration)
CROSS JOIN (VALUES ('weekday'), ('weekend')) AS dt(day_type)
CROSS JOIN (VALUES ('off_peak'), ('standard'), ('peak')) AS tb(time_band)
WHERE s.slug = 'football' AND l.slug IN ('onpeak-location-1', 'onpeak-location-2')
  AND NOT EXISTS (SELECT 1 FROM court_pricing cp
                  WHERE cp.court_id = c.id AND cp.duration_minutes = d.duration
                    AND cp.day_type = dt.day_type::day_type_enum AND cp.time_band = tb.time_band::time_band_enum);
