-- ============================================================
-- v06-drive-seed.sql
--
-- Seeds the 4 currently-hardcoded DRIVE items from
-- src/routes/DriveIndex.svelte as real public.listings rows so the
-- DriveIndex/DriveIssue routes can read from the database.
--
-- Applied AFTER v06-stock-state-drive-fields.sql. Idempotent on slug.
--
-- All rows:
--   seller_id = VNTA (the is_house=true seller seeded in v05).
--     Ownership of a listing is derived through this FK: a listing
--     is ÉIRVOX-owned iff sellers.is_house = true for the row that
--     seller_id points at. The listings table has NO is_house column;
--     that flag lives only on sellers, by design.
--   is_drive = true (listings.is_drive is a real column on listings,
--     distinct from sellers.is_house; do not conflate the two)
--   stock_state = 'in_stock' (default; corrected to 'incoming' per
--     issue when a future restock requires it)
--
-- Status mapping (per approved brief):
--   open      → listings.status = 'active'  + drive_issue_state = 'open'
--   upcoming  → listings.status = 'draft'   + drive_issue_state = 'upcoming'   (price = 0; not user-purchasable)
--   archived  → listings.status = 'sold'    + drive_issue_state = 'archived'  (kept visible as portfolio)
--
-- Values carried verbatim from the hardcoded array; no invented
-- copy, no invented prices.
--
-- DRIVES (no schema change): listing_images and listing_specs are
-- NOT seeded here. Plate images, plate captions (via alt_text), and
-- spec rows for each issue are admin-entered after seed.
--
-- Apply: this file is committed for repo-as-record. Applying it is
-- coordinated externally; I do not apply data changes myself.
-- ============================================================

-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- SELECT count(*) FROM public.listings WHERE is_drive = true;
--   expect 0 on first apply
--
-- SELECT id FROM public.sellers WHERE id = 'e6b0992f-aa9b-4ef5-bb99-512386650fc2';
--   expect 1 row (VNTA seller; ON DELETE CASCADE on seller_id makes
--   the FK required for the inserts to succeed)
--
-- SELECT count(*) FROM information_schema.columns
--  WHERE table_schema='public' AND table_name='listings'
--    AND column_name IN ('stock_state','drive_issue_state','drive_made_count','drive_remaining_count','drive_issue_date');
--   expect 5 (i.e. v06-stock-state-drive-fields.sql already applied)

BEGIN;

INSERT INTO public.listings (
  seller_id, title, subtitle, slug, description,
  price, status, is_drive,
  drive_issue, drive_issue_date, drive_issue_state,
  drive_made_count, drive_remaining_count,
  stock_state, collection_available, shipping_available, shipping_cost
) VALUES
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Mercedes-AMG GT', 'V8 Biturbo · C192', '003-mercedes-amg-gt',
   'Forged carbon steering wheel. Eight pieces, Alcantara wrap, champagne stitch.',
   4250, 'active', true,
   '003', 'May MMXXVI', 'open', 8, 5,
   'in_stock', true, false, 20),
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Volkswagen Golf R', 'Mk8 · 2.0T', '004-volkswagen-golf-r',
   'Issue 004 in preparation. Details to follow on reservation opening.',
   0, 'draft', true,
   '004', 'Q3 MMXXVI', 'upcoming', NULL, NULL,
   'in_stock', true, false, 20),
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'Porsche 911 GT3', '992 · 4.0 Naturally Aspirated', '002-porsche-911-gt3',
   'Forged carbon shift paddle set. Archived — sold out.',
   1850, 'sold', true,
   '002', 'Feb MMXXVI', 'archived', 6, 0,
   'in_stock', true, false, 20),
  ('e6b0992f-aa9b-4ef5-bb99-512386650fc2',
   'BMW M3 Competition', 'G80 · S58 Biturbo', '001-bmw-m3-competition',
   'Alcantara handbrake grip and gear surrounds. Archived — sold out.',
   690, 'sold', true,
   '001', 'Nov MMXXV', 'archived', 10, 0,
   'in_stock', true, false, 20)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- SELECT drive_issue, drive_issue_state, status, price, drive_remaining_count, drive_made_count
-- FROM public.listings WHERE is_drive = true ORDER BY drive_issue;
--   expect 4 rows: 001 archived/sold/690/0/10, 002 archived/sold/1850/0/6,
--                  003 open/active/4250/5/8, 004 upcoming/draft/0/NULL/NULL
--
-- SELECT count(*) FROM public.listings WHERE slug LIKE '00%-%' AND is_drive = true;
--   expect 4 (re-running this file is a no-op via ON CONFLICT)
