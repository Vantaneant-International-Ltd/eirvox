-- ============================================================
-- v19 · search_listings: widen fields + alias map
-- ============================================================
-- Before: only matched title/subtitle/description/subcategory.
-- A listing with vehicle_make='Volkswagen' and title='2017 Sleeper
-- Polo 220-240BHP' did not match the query 'vw'.
--
-- After:
--   1. Match additionally on vehicle_make, vehicle_model,
--      location_county, location_town, city.
--   2. Expand short-hand queries via a small alias map: 'vw'
--      also searches 'volkswagen', 'merc' searches 'mercedes',
--      'lambo' searches 'lamborghini', etc.
--
-- Idempotent: pure CREATE OR REPLACE on an existing function.
-- Same signature, same return type, same grants — no privileges
-- to re-set.
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_listings(q text, lim integer DEFAULT 24)
RETURNS SETOF listings
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  WITH terms AS (
    SELECT ARRAY[q] || (
      CASE LOWER(TRIM(q))
        WHEN 'vw'          THEN ARRAY['volkswagen']
        WHEN 'volkswagen'  THEN ARRAY['vw']
        WHEN 'merc'        THEN ARRAY['mercedes','mercedes-benz']
        WHEN 'mercedes'    THEN ARRAY['merc','mercedes-benz']
        WHEN 'beemer'      THEN ARRAY['bmw']
        WHEN 'bimmer'      THEN ARRAY['bmw']
        WHEN 'lambo'       THEN ARRAY['lamborghini']
        WHEN 'rangie'      THEN ARRAY['range rover','land rover']
        WHEN 'range rover' THEN ARRAY['land rover']
        WHEN 'land rover'  THEN ARRAY['range rover']
        WHEN 'porkr'       THEN ARRAY['porsche']
        WHEN 'porka'       THEN ARRAY['porsche']
        WHEN 'mini'        THEN ARRAY['mini cooper']
        WHEN 'rolly'       THEN ARRAY['rolls royce','rolls-royce']
        WHEN 'rolls royce' THEN ARRAY['rolls-royce']
        WHEN 'rolls-royce' THEN ARRAY['rolls royce']
        ELSE ARRAY[]::text[]
      END
    ) AS list
  )
  SELECT l.*
    FROM public.listings l, terms t
   WHERE l.status = 'active'
     AND EXISTS (
       SELECT 1 FROM unnest(t.list) AS term
        WHERE l.title           ILIKE '%' || term || '%'
           OR l.subtitle        ILIKE '%' || term || '%'
           OR l.description     ILIKE '%' || term || '%'
           OR l.subcategory     ILIKE '%' || term || '%'
           OR l.vehicle_make    ILIKE '%' || term || '%'
           OR l.vehicle_model   ILIKE '%' || term || '%'
           OR l.location_county ILIKE '%' || term || '%'
           OR l.location_town   ILIKE '%' || term || '%'
           OR l.city            ILIKE '%' || term || '%'
     )
   ORDER BY
     CASE WHEN l.title ILIKE q || '%'           THEN 0
          WHEN l.title ILIKE '%' || q || '%'    THEN 1
          WHEN l.vehicle_make ILIKE q || '%'    THEN 2
          WHEN l.vehicle_model ILIKE q || '%'   THEN 3
          ELSE 4 END,
     l.views_count DESC,
     l.published_at DESC NULLS LAST,
     l.created_at DESC
   LIMIT lim;
$function$;
