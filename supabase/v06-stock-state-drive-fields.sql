-- ============================================================
-- v06-stock-state-drive-fields.sql
--
-- Schema groundwork for the stock-state-driven payment matrix and
-- for DRIVE-as-listings (DRIVE items become real public.listings
-- rows flagged is_drive=true, killing the hardcoded array in
-- src/routes/DriveIndex.svelte).
--
-- This is the schema migration for this phase. The DRIVE seed of
-- the 4 currently-hardcoded items is a separate committed file
-- (v06-drive-seed.sql), to be applied AFTER this migration.
--
-- DROPS:
--   - listings.payment_mode column (fully expressible via
--     stock_state + buyer-chosen fulfilment + deposit_amount
--     presence; keeping it would be a third overlapping convention).
--   - listings_payment_mode_check, listings_deposit_amount_required,
--     listings_full_plus_shipping_requires_cost — all referenced
--     payment_mode and go with it.
--
-- RE-VALIDATING CONSTRAINTS (run against existing rows at ADD time):
--   - listings_deposit_amount_range — verified 0 violating rows via
--     hygiene query below. Re-validates every row's deposit_amount.
--   - listings_drive_remaining_lte_made — both fields are new and
--     NULL on every existing row, so vacuously safe at ADD time.
--
-- DELIBERATELY OMITTED:
--   - listings_incoming_requires_deposit. Under the corrected matrix,
--     incoming + delivery is full-price-no-deposit; forcing every
--     incoming row to carry a deposit_amount would be wrong. Admin
--     form validates deposit presence when collection_available is on.
--
-- NEW COLUMNS on listings (5 total, all NULL by default except stock_state):
--   stock_state             text NOT NULL DEFAULT 'in_stock'
--   drive_issue_state       text NULL
--   drive_made_count        integer NULL
--   drive_remaining_count   integer NULL
--   drive_issue_date        text NULL
--
-- REUSED unchanged:
--   is_drive boolean, drive_issue text, deposit_amount, shipping_cost,
--   shipping_available, collection_available, listing_images.alt_text
--   (DRIVE plate captions), listing_specs (DRIVE spec rows).
--
-- Unit convention: all amount columns are whole euros, unchanged.
--
-- Apply ordering: this migration is applied LAST. Code deploys first
-- and is defensive: reads stock_state with a fallback to 'in_stock'
-- when the column is absent, never references payment_mode. No
-- live-code window requires this migration to have run.
--
-- Apply: this file is committed for repo-as-record. Applying it is
-- coordinated externally; I do not apply schema changes myself.
-- ============================================================

-- ── PRE-APPLY HYGIENE (run BEFORE applying; halt on any > 0) ──
--
-- SELECT count(*) FROM public.listings
--  WHERE deposit_amount IS NOT NULL
--    AND (deposit_amount <= 0 OR deposit_amount >= price);
--   expect 0 (any row would trip listings_deposit_amount_range at ADD time)
--
-- SELECT id, slug, payment_mode FROM public.listings
--  WHERE payment_mode <> 'full';
--   informational; any non-'full' rows lose that value when the
--   column drops. stock_state defaults to 'in_stock' for everyone;
--   deposit_amount semantics are preserved.

BEGIN;

-- ── 1. stock_state ──────────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS stock_state text NOT NULL DEFAULT 'in_stock';

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_stock_state_check;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_stock_state_check
  CHECK (stock_state IN ('in_stock', 'incoming'));

COMMENT ON COLUMN public.listings.stock_state IS
  'in_stock = we have the item now; incoming = out of stock, ~1 month delivery. Drives the buyer payment-options matrix on ÉIRVOX-owned listings.';

-- ── 2. Drop payment_mode + its dependent CHECKs ─────────────
-- Clean drop, not phased. The one live non-house row has
-- payment_mode='full' and maps to stock_state='in_stock',
-- deposit_amount=NULL with no semantic loss.

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_deposit_amount_required;
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_full_plus_shipping_requires_cost;
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_payment_mode_check;

ALTER TABLE public.listings
  DROP COLUMN IF EXISTS payment_mode;

-- ── 3. deposit_amount range (independent of payment_mode) ───
-- NULL means "deposit option not offered". When set, must satisfy
-- 0 < x < price. Re-validates existing rows; hygiene query above
-- confirms 0 violating rows.

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_deposit_amount_range;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_deposit_amount_range
  CHECK (deposit_amount IS NULL OR (deposit_amount > 0 AND deposit_amount < price));

-- ── 4. DRIVE presentation fields ────────────────────────────
-- Only meaningful when is_drive=true. No CHECK requiring
-- is_drive=true → these fields set, so admin can save a DRAFT
-- DRIVE listing while filling it in. Admin form + buyer-page
-- render-gate enforce the relationship.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS drive_issue_state text;
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_drive_issue_state_check;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_drive_issue_state_check
  CHECK (drive_issue_state IS NULL OR drive_issue_state IN ('open', 'upcoming', 'archived'));
COMMENT ON COLUMN public.listings.drive_issue_state IS
  'DRIVE editorial issue state. open = purchasable; upcoming = announced, not on sale; archived = sold out / historical. NULL for non-DRIVE.';

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS drive_made_count integer;
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS drive_remaining_count integer;
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_drive_remaining_lte_made;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_drive_remaining_lte_made
  CHECK (
    drive_remaining_count IS NULL
    OR drive_made_count IS NULL
    OR (drive_remaining_count >= 0 AND drive_remaining_count <= drive_made_count)
  );
COMMENT ON COLUMN public.listings.drive_made_count IS
  'How many of this DRIVE issue were made in the run. Admin-set, display-only ("X of Y remaining"). No auto-decrement on sale this phase; deferred.';
COMMENT ON COLUMN public.listings.drive_remaining_count IS
  'How many remain. Admin-set, display-only. Must be <= drive_made_count when both are set.';

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS drive_issue_date text;
COMMENT ON COLUMN public.listings.drive_issue_date IS
  'Editorial issue date string, free text (e.g. "May MMXXVI"). Not a date type so editorial formatting choices are preserved.';

COMMIT;

-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- SELECT column_name FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='listings'
--    AND column_name IN ('stock_state','drive_issue_state','drive_made_count','drive_remaining_count','drive_issue_date');
--   expect 5 rows
--
-- SELECT count(*) FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='listings' AND column_name='payment_mode';
--   expect 0
--
-- SELECT stock_state, count(*) FROM public.listings GROUP BY 1;
--   expect all rows 'in_stock' on first apply
--
-- SELECT conname FROM pg_constraint con
--  JOIN pg_class rel ON rel.oid = con.conrelid
--  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
--  WHERE nsp.nspname='public' AND rel.relname='listings' AND con.contype='c'
--  ORDER BY 1;
--   expect (4): listings_deposit_amount_range,
--               listings_drive_issue_state_check,
--               listings_drive_remaining_lte_made,
--               listings_stock_state_check
--   should NOT include payment_mode_check / deposit_amount_required /
--                      full_plus_shipping_requires_cost /
--                      incoming_requires_deposit
