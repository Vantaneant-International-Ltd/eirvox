-- ============================================================
-- v07-house-default-shipping.sql
--
-- Sets listings.shipping_cost = 20 on every ÉIRVOX-owned (house)
-- listing where shipping_cost is currently NULL. Implements the
-- "€20 An Post registered" default for house + DRIVE listings via
-- the existing shipping_cost column. No hardcoded fallback in
-- payment logic; the column holds the value.
--
-- Scope of "house" here: listings whose seller_id points at a row
-- with sellers.is_house = true. Ownership is derived through the
-- seller relation (listings has no is_house column).
--
-- Idempotent: re-runs are no-ops because the WHERE clause already
-- excludes rows where shipping_cost IS NOT NULL.
--
-- DOES NOT flip listings.shipping_available. Setting that flag is a
-- per-listing editorial call (some house items may stay collection-
-- only). This migration only ensures the shipping_cost column has a
-- sensible default the moment shipping_available is turned on.
--
-- Apply: this file is committed for repo-as-record. Applying it is
-- coordinated externally; I do not apply schema or data changes
-- myself.
-- ============================================================

-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- SELECT count(*) AS affected
-- FROM public.listings l
-- JOIN public.sellers s ON s.id = l.seller_id
-- WHERE s.is_house = true AND l.shipping_cost IS NULL;
--   informational; number of rows about to be updated.
--
-- SELECT count(*) AS already_set
-- FROM public.listings l
-- JOIN public.sellers s ON s.id = l.seller_id
-- WHERE s.is_house = true AND l.shipping_cost IS NOT NULL;
--   informational; rows untouched by this migration.

BEGIN;

UPDATE public.listings AS l
   SET shipping_cost = 20
  FROM public.sellers AS s
 WHERE l.seller_id = s.id
   AND s.is_house = true
   AND l.shipping_cost IS NULL;

COMMIT;

-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- SELECT l.slug, l.shipping_cost, l.shipping_available
-- FROM public.listings l
-- JOIN public.sellers s ON s.id = l.seller_id
-- WHERE s.is_house = true
-- ORDER BY l.slug;
--   expect every house listing to have shipping_cost = 20 (or a
--   non-NULL prior value if it was already set).
--
-- SELECT count(*)
-- FROM public.listings l
-- JOIN public.sellers s ON s.id = l.seller_id
-- WHERE s.is_house = true AND l.shipping_cost IS NULL;
--   expect 0
