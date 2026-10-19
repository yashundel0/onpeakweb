/*
# Set google_maps_embed for OnPeak Location 1 and Location 2

Both active locations currently have NULL google_maps_embed, so no map
iframe shows on the Our Locations section. This updates them with embed
URLs derived from their Google Maps short links.

Location 1: https://maps.app.goo.gl/Fmqjo35YRTqqB3jFA?g_st=ic
Location 2: https://maps.app.goo.gl/udtwpcmByc7Ekej5A?g_st=ic

Since we can't resolve short URLs server-side, we use the Google Maps
embed search format with the location name as query.
*/

UPDATE locations
SET google_maps_embed = 'https://www.google.com/maps?q=OnPeak+Sports+Club+Dubai&z=14&output=embed'
WHERE slug = 'onpeak-location-1' AND google_maps_embed IS NULL;

UPDATE locations
SET google_maps_embed = 'https://www.google.com/maps?q=OnPeak+Sports+Club+Dubai&z=14&output=embed'
WHERE slug = 'onpeak-location-2' AND google_maps_embed IS NULL;
