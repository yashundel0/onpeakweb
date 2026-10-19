/*
# OnPeak — Seed Data

## Overview
Seeds the database with OnPeak's actual locations, sports, courts,
operating hours, and pricing. This data makes the booking platform
immediately functional.

## Data Added
1. Locations: Jumeirah (Umm Suqeim 2) and Al Quoz
2. Sports: Padel and Football
3. Courts: 2 Padel courts + 1 Football pitch (Jumeirah), 1 Padel + 1 Football (Al Quoz)
4. Operating hours: 08:00–23:00 daily for all courts
5. Pricing: Padel and Football, 60/90/120 min, weekday/weekend, off-peak/standard/peak
*/

-- ============================================================
-- LOCATIONS
-- ============================================================
INSERT INTO locations (name, slug, address, city, google_maps, google_maps_embed, description, is_active, sort_order)
SELECT 'OnPeak Jumeirah', 'jumeirah', 'G19, 19B Street, Umm Suqeim 2, Jumeirah, Dubai', 'Dubai, UAE',
       'https://maps.app.goo.gl/tsNBRZPM1dKWHw4g7?g_st=ic',
       'https://www.google.com/maps?q=25.15306143,55.20644029&z=16&output=embed',
       'Premium padel courts and football pitch in the heart of Jumeirah.',
       true, 0
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'jumeirah');

INSERT INTO locations (name, slug, address, city, google_maps, google_maps_embed, description, is_active, sort_order)
SELECT 'OnPeak Al Quoz', 'al-quoz', '17B Street, Al Quoz First, Al Quoz, Dubai, UAE', 'Dubai, UAE',
       'https://maps.app.goo.gl/svm8iAksPtHJzhPB9?g_st=ic',
       'https://www.google.com/maps?q=5793+RQ7,+Abu+Hanifa+School+for+Basic+Education+for+Boys,+17B+Street,+Al+Quoz+First,+Al+Quoz,+Dubai,+UAE&z=16&output=embed',
       'OnPeak''s second premium sports location in Al Quoz, Dubai.',
       true, 1
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'al-quoz');

-- ============================================================
-- SPORTS
-- ============================================================
INSERT INTO sports (name, slug, icon_name, is_active, sort_order)
SELECT 'Padel', 'padel', 'CircleDot', true, 0
WHERE NOT EXISTS (SELECT 1 FROM sports WHERE slug = 'padel');

INSERT INTO sports (name, slug, icon_name, is_active, sort_order)
SELECT 'Football', 'football', 'Volleyball', true, 1
WHERE NOT EXISTS (SELECT 1 FROM sports WHERE slug = 'football');

-- ============================================================
-- COURTS — Jumeirah
-- ============================================================
INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order)
SELECT l.id, s.id, 'Padel Court 1', 'padel', true, 0
FROM locations l, sports s
WHERE l.slug = 'jumeirah' AND s.slug = 'padel'
  AND NOT EXISTS (
    SELECT 1 FROM courts c
    JOIN locations cl ON c.location_id = cl.id
    JOIN sports cs ON c.sport_id = cs.id
    WHERE cl.slug = 'jumeirah' AND cs.slug = 'padel' AND c.name = 'Padel Court 1'
  );

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order)
SELECT l.id, s.id, 'Padel Court 2', 'padel', true, 1
FROM locations l, sports s
WHERE l.slug = 'jumeirah' AND s.slug = 'padel'
  AND NOT EXISTS (
    SELECT 1 FROM courts c
    JOIN locations cl ON c.location_id = cl.id
    JOIN sports cs ON c.sport_id = cs.id
    WHERE cl.slug = 'jumeirah' AND cs.slug = 'padel' AND c.name = 'Padel Court 2'
  );

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order)
SELECT l.id, s.id, 'Football Pitch', 'football', true, 0
FROM locations l, sports s
WHERE l.slug = 'jumeirah' AND s.slug = 'football'
  AND NOT EXISTS (
    SELECT 1 FROM courts c
    JOIN locations cl ON c.location_id = cl.id
    JOIN sports cs ON c.sport_id = cs.id
    WHERE cl.slug = 'jumeirah' AND cs.slug = 'football' AND c.name = 'Football Pitch'
  );

-- ============================================================
-- COURTS — Al Quoz
-- ============================================================
INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order)
SELECT l.id, s.id, 'Padel Court 1', 'padel', true, 0
FROM locations l, sports s
WHERE l.slug = 'al-quoz' AND s.slug = 'padel'
  AND NOT EXISTS (
    SELECT 1 FROM courts c
    JOIN locations cl ON c.location_id = cl.id
    JOIN sports cs ON c.sport_id = cs.id
    WHERE cl.slug = 'al-quoz' AND cs.slug = 'padel' AND c.name = 'Padel Court 1'
  );

INSERT INTO courts (location_id, sport_id, name, court_type, is_active, sort_order)
SELECT l.id, s.id, 'Football Pitch', 'football', true, 0
FROM locations l, sports s
WHERE l.slug = 'al-quoz' AND s.slug = 'football'
  AND NOT EXISTS (
    SELECT 1 FROM courts c
    JOIN locations cl ON c.location_id = cl.id
    JOIN sports cs ON c.sport_id = cs.id
    WHERE cl.slug = 'al-quoz' AND cs.slug = 'football' AND c.name = 'Football Pitch'
  );

-- ============================================================
-- OPERATING HOURS — all courts, 08:00–23:00 every day
-- ============================================================
INSERT INTO operating_hours (court_id, weekday, open_time, close_time, is_open)
SELECT c.id, w.weekday, '08:00'::time, '23:00'::time, true
FROM courts c
CROSS JOIN generate_series(0, 6) AS w(weekday)
WHERE NOT EXISTS (
  SELECT 1 FROM operating_hours oh WHERE oh.court_id = c.id AND oh.weekday = w.weekday
);

-- ============================================================
-- PRICING — Padel
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
CROSS JOIN (VALUES (60), (90), (120)) AS d(duration)
CROSS JOIN (VALUES ('weekday'), ('weekend')) AS dt(day_type)
CROSS JOIN (VALUES ('off_peak'), ('standard'), ('peak')) AS tb(time_band)
WHERE s.slug = 'padel'
  AND NOT EXISTS (
    SELECT 1 FROM court_pricing cp
    WHERE cp.court_id = c.id AND cp.duration_minutes = d.duration
      AND cp.day_type = dt.day_type::day_type_enum AND cp.time_band = tb.time_band::time_band_enum
  );

-- ============================================================
-- PRICING — Football
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
CROSS JOIN (VALUES (60), (90), (120)) AS d(duration)
CROSS JOIN (VALUES ('weekday'), ('weekend')) AS dt(day_type)
CROSS JOIN (VALUES ('off_peak'), ('standard'), ('peak')) AS tb(time_band)
WHERE s.slug = 'football'
  AND NOT EXISTS (
    SELECT 1 FROM court_pricing cp
    WHERE cp.court_id = c.id AND cp.duration_minutes = d.duration
      AND cp.day_type = dt.day_type::day_type_enum AND cp.time_band = tb.time_band::time_band_enum
  );
