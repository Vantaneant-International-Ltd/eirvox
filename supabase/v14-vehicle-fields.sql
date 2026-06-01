-- ============================================================
-- ÉIRVOX v14 — Vehicle structured columns (cars / automotive)
-- ============================================================
-- Buyers on /cars and /automotive can now filter by make, model,
-- year range, max mileage and county — the audit gap vs DoneDeal/
-- Adverts. Filters apply server-side via .eq / .gte / .lte through
-- the partial indexes below.
--
-- All five columns are nullable so non-vehicle listings stay
-- untouched. Partial indexes are gated on category_slug so the
-- indexes only cover the rows that need them.
--
-- Backfill: the one existing cars listing (the VW Polo GTI) is
-- populated inline. Sellers will fill these for new listings via
-- the SellerCreate / SellerEdit form (deferred to next commit).
-- ============================================================

BEGIN;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS vehicle_make    text,
  ADD COLUMN IF NOT EXISTS vehicle_model   text,
  ADD COLUMN IF NOT EXISTS vehicle_year    int,
  ADD COLUMN IF NOT EXISTS vehicle_mileage int,
  ADD COLUMN IF NOT EXISTS county          text;

CREATE INDEX IF NOT EXISTS idx_listings_make_model_year
  ON public.listings (category_slug, vehicle_make, vehicle_model, vehicle_year)
  WHERE category_slug IN ('cars','automotive');

CREATE INDEX IF NOT EXISTS idx_listings_county
  ON public.listings (category_slug, county)
  WHERE category_slug IN ('cars','automotive');

UPDATE public.listings
   SET vehicle_make    = 'Volkswagen',
       vehicle_model   = 'Polo GTI',
       vehicle_year    = 2017,
       vehicle_mileage = 95000,
       county          = COALESCE(county, 'Dublin')
 WHERE slug = 'vw-polo-gti-2017-stage-1';

COMMIT;
