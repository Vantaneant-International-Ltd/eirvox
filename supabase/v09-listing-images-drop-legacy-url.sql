-- ============================================================
-- v09-listing-images-drop-legacy-url.sql
--
-- Removes the legacy `url` column from public.listing_images.
--
-- IMPORTANT ORDERING -- DO NOT APPLY THIS FILE FIRST.
-- ----------------------------------------------------
-- This file's earlier header (corrected below) wrongly claimed the
-- code change that stops writing `url` had already shipped. It had
-- not. Applying v09 against the previously-deployed code would
-- reopen the upload bug it was meant to close, because the live
-- code was still writing `url` and the column would suddenly not
-- exist.
--
-- Truthful state (as of the commit that ships THIS file edit):
--   * src/lib/listings.ts uploadListingImage() has been changed in
--     the SAME commit as this header rewrite to write only
--     storage_path + public_url. `url:` is removed from the insert.
--   * That code change has NOT been deployed to Vercel as of the
--     commit that writes this comment. The deploy happens whenever
--     the next push hits Vercel build + propagation.
--   * After deploy, the live code writes 4 columns
--     (listing_id, storage_path, public_url, sort_order). The
--     `url` column is still NOT NULL with no default in the live
--     schema, so the FIRST upload after deploy will fail with:
--       ERROR: 23502 null value in column "url"
--     until either DROP NOT NULL or DROP COLUMN runs.
--
-- RECOMMENDED SAFE-DEPLOY SEQUENCE (no upload outage):
--   1. Apply this one-liner FIRST, as a separate hotfix step
--      BEFORE deploying the code change:
--
--        ALTER TABLE public.listing_images
--          ALTER COLUMN url DROP NOT NULL;
--
--      This is safe with the OLD code (still writes url) AND with
--      the NEW code (doesn't write url; column accepts null).
--   2. Deploy the code change (the commit removing `url:` from
--      uploadListingImage()).
--   3. Confirm an admin upload still creates a listing_images row
--      via /sell/edit/<id>.
--   4. THEN apply the DROP COLUMN below. After this, the schema
--      and code agree.
--
-- IF YOU APPLY THE DROP COLUMN WHILE OLD CODE IS STILL LIVE:
-- the old code's insert references a column that no longer exists
-- and fails with "column url does not exist". Roll back the code
-- or restore the column.
--
-- Why this file exists: the table currently has THREE
-- image-location columns:
--
--   url           text  NOT NULL   (legacy)
--   storage_path  text  NULL       (added later; the bucket key)
--   public_url    text  NULL       (added later; the public CDN URL)
--
-- Every reader in src/ selects from `storage_path` and/or
-- `public_url`. Nothing in the app reads `url`. Dropping it
-- removes a footgun.
--
-- Idempotent: ALTER TABLE ... DROP COLUMN IF EXISTS is a no-op
-- on re-run.
--
-- Apply: this file is committed for repo-as-record. Applying it
-- is coordinated externally; I do not apply schema changes
-- myself.
-- ============================================================


-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- SELECT column_name, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_schema = 'public'
--    AND table_name   = 'listing_images'
--    AND column_name IN ('url', 'storage_path', 'public_url');
--   expect 3 rows; url should still be NO/null/null on first run,
--   ABSENT on re-runs after this migration applied.
--
-- SELECT count(*) AS rows_with_url_not_matching_public_url
--   FROM public.listing_images
--  WHERE url IS DISTINCT FROM public_url;
--   informational; if non-zero, some pre-bug rows have divergent
--   url/public_url values. Decide per-row whether to keep public_url
--   (recommended) before dropping the column.


BEGIN;

ALTER TABLE public.listing_images DROP COLUMN IF EXISTS url;

COMMIT;


-- =============================================================
-- Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- 1. Column gone:
--    SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public'
--       AND table_name = 'listing_images'
--       AND column_name = 'url';
--    -> 0 rows
--
-- 2. Insert probe (admin context) should now succeed without
--    needing to supply `url`:
--    BEGIN;
--      SET LOCAL ROLE authenticated;
--      SET LOCAL "request.jwt.claim.sub" TO '<admin-uuid>';
--      INSERT INTO public.listing_images (listing_id, storage_path, public_url, sort_order)
--      VALUES ('<a real listing id>', 'probe/path.png', 'https://example.com/probe.png', 0)
--      RETURNING id;
--    ROLLBACK;
--    -> 1 row returned, no error
