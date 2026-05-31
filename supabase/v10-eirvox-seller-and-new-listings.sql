-- ============================================================
-- v10-eirvox-seller-and-new-listings.sql
--
-- Two things:
--
-- 1. Rename the house seller's PUBLIC name from "VNTA" to
--    "ÉIRVOX" so listing detail pages show the brand the buyer
--    expects to see, not the internal/legacy code. Same seller
--    row (same UUID e6b0992f-...), no listing FK changes, no
--    storage path changes -- only trading_name and handle move.
--
-- 2. Insert four new live listings owned by that seller (the
--    house seller). Three are active marketplace ads with
--    original_price set (the strikethrough price), all with
--    €20 An Post default shipping_cost so payment paths show
--    a real number even if v07 hasn't run yet. The wheel set
--    is created as a DRAFT because the user didn't supply a
--    price or specific details -- admin can flip to active
--    after editing via /#/sell/edit/<id>.
--
-- All four listings are created without images. Admin will
-- upload via /#/sell/edit/<listing_id>; uploadListingImage()
-- handles bucket + listing_images row insert.
--
-- Idempotent on slug. Re-runs update title / subtitle /
-- description / price / status without re-inserting.
--
-- Apply: this file is committed for repo-as-record. Applying
-- is coordinated externally; I do not apply data changes
-- myself.
-- ============================================================


-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- SELECT id, trading_name, handle, is_house, status
--   FROM public.sellers
--  WHERE id = 'e6b0992f-aa9b-4ef5-bb99-512386650fc2';
--   expect 1 row, trading_name='VNTA' on first run.
--
-- SELECT slug FROM public.listings
--  WHERE slug IN (
--    'wheels-set-of-4-house',
--    'rimowa-original-cabin-suitcase-10pc',
--    'meta-rayban-wayfarer-gen2-large-black',
--    'vw-polo-gti-2017-stage-1'
--  );
--   expect 0 rows on first run; 4 rows after.
--
-- SELECT id FROM public.sellers WHERE handle = 'eirvox';
--   expect 0 rows on first run (or only the e6b0992f row if re-run).


BEGIN;


-- =============================================================
-- §1  Rename house seller VNTA -> ÉIRVOX
-- =============================================================
-- handle is text and presumed UNIQUE in the live schema; the
-- existing VNTA row is the only one we touch. If a row already
-- holds handle='eirvox' (re-run), the WHERE clause prevents
-- a UNIQUE violation by only updating the specific id we own.

UPDATE public.sellers
   SET trading_name = 'ÉIRVOX',
       handle       = 'eirvox',
       bio          = 'ÉIRVOX is the publisher of DRIVE and operator of TRADE. House listings are curated and shipped by us directly.'
 WHERE id = 'e6b0992f-aa9b-4ef5-bb99-512386650fc2';


-- =============================================================
-- §2  New listings (house seller; all marketplace, none DRIVE)
-- =============================================================
-- Common values: seller_id = ÉIRVOX (same UUID), is_drive=false,
-- stock_state='in_stock', collection_available=true,
-- shipping_available=true, shipping_cost=20 (€20 An Post default).
-- accepts_offers=true. condition defaults to 'excellent' from the
-- column default.

INSERT INTO public.listings (
  seller_id, title, subtitle, slug, description,
  price, original_price, status, is_drive,
  category_id, category_slug,
  collection_available, shipping_available, shipping_cost,
  accepts_offers, stock_state
) VALUES

  -- (a) Rimowa Original Cabin Suitcase 10pc -- €1100 -> €600
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Rimowa Original Cabin Suitcase',
   '10pc',
   'rimowa-original-cabin-suitcase-10pc',
   'Rimowa Original series cabin suitcase, 10pc. Iconic aluminium body, original hardware. Light wear consistent with use.',
   600, 1100, 'active', false,
   'a871356b-dc05-4086-a1d4-c9e759335422', 'fashion',
   true, true, 20,
   true, 'in_stock'),

  -- (b) Meta Ray-Ban Wayfarer Gen 2 Large Black -- €399 -> €350
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Meta Ray-Ban Wayfarer Gen 2',
   'Large · Black',
   'meta-rayban-wayfarer-gen2-large-black',
   'Meta Ray-Ban Wayfarer, second generation. Large frame, black. Smart camera + Meta AI. Boxed.',
   350, 399, 'active', false,
   '8f59ea95-a25c-4d29-9d94-8877bb0901d9', 'tech',
   true, true, 20,
   true, 'in_stock'),

  -- (c) VW Polo GTI 2017, Stage 1 mapped, res delete, 220-240bhp -- €14k -> €13k
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Volkswagen Polo GTI',
   '2017 · Stage 1 mapped · Res delete · 220-240bhp',
   'vw-polo-gti-2017-stage-1',
   'Volkswagen Polo GTI, 2017. Stage 1 remap. Resonator delete. Dyno-confirmed 220-240bhp. Full service history, viewings welcome.',
   13000, 14000, 'active', false,
   '763dc4cf-1924-45c6-9d0b-bb692a3c7976', 'cars',
   true, false, NULL,
   true, 'in_stock'),

  -- (d) Set of 4 wheels -- price + brand TBC by admin
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Set of 4 Alloy Wheels',
   NULL,
   'wheels-set-of-4-house',
   'Set of four alloy wheels. Title, spec, and price to be confirmed by admin -- edit via /sell/edit/<id> to flip to active.',
   1, NULL, 'draft', false,
   '1d5df18f-634d-4ef1-9645-d53b120c92db', 'automotive',
   true, false, NULL,
   true, 'in_stock')

ON CONFLICT (slug) DO UPDATE
   SET title          = EXCLUDED.title,
       subtitle       = EXCLUDED.subtitle,
       description    = EXCLUDED.description,
       price          = EXCLUDED.price,
       original_price = EXCLUDED.original_price,
       status         = EXCLUDED.status,
       category_id    = EXCLUDED.category_id,
       category_slug  = EXCLUDED.category_slug,
       collection_available = EXCLUDED.collection_available,
       shipping_available   = EXCLUDED.shipping_available,
       shipping_cost  = EXCLUDED.shipping_cost,
       accepts_offers = EXCLUDED.accepts_offers;


COMMIT;


-- =============================================================
-- §3  Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- 1. Seller renamed:
--    SELECT trading_name, handle FROM public.sellers
--     WHERE id = 'e6b0992f-aa9b-4ef5-bb99-512386650fc2';
--    -> ('ÉIRVOX','eirvox')
--
-- 2. Four new listings present:
--    SELECT slug, title, status, price, original_price, category_slug
--      FROM public.listings
--     WHERE slug IN (
--       'rimowa-original-cabin-suitcase-10pc',
--       'meta-rayban-wayfarer-gen2-large-black',
--       'vw-polo-gti-2017-stage-1',
--       'wheels-set-of-4-house'
--     )
--     ORDER BY slug;
--    -> 4 rows. wheels-set-of-4-house = draft; the other three = active.
--
-- 3. Existing buyer pages should now render "ÉIRVOX" wherever the
--    seller's trading_name was shown (listing detail, listing card
--    seller pill, contact section, etc.). No code change required;
--    rename is data-only.
--
-- 4. Admin can edit any of the four via
--    /#/sell/edit/<id-from-step-2-result>. The DRIVE block in
--    SellerEdit will NOT show (is_drive=false on all four).
