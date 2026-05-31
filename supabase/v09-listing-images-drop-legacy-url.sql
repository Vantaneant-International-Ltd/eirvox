-- ============================================================
-- v09-listing-images-drop-legacy-url.sql
--
-- Removes the legacy `url` column from public.listing_images.
--
-- Why this file exists: the table currently has THREE
-- image-location columns:
--
--   url           text  NOT NULL   (legacy)
--   storage_path  text  NULL       (added later; the bucket key)
--   public_url    text  NULL       (added later; the public CDN URL)
--
-- Every reader in src/ selects from `storage_path` and/or
-- `public_url`. Nothing in the app reads `url`. But `url` is
-- NOT NULL with no default, so every INSERT that omits it fails
-- with:
--
--   ERROR: 23502: null value in column "url" of relation
--   "listing_images" violates not-null constraint
--
-- That is exactly the bug that left the table at 0 rows while the
-- storage bucket filled with uploads -- the storage step succeeded
-- and the DB insert silently errored. Surfaced to the admin UI
-- as "null value in column url ..." which is not a useful message.
--
-- The application code now writes the same value to BOTH `url`
-- and `public_url` so uploads succeed pre-migration. After this
-- migration drops `url`, a follow-up commit will remove the
-- redundant `url:` write from src/lib/listings.ts uploadListingImage().
--
-- Idempotent: ALTER TABLE ... DROP COLUMN IF EXISTS is a no-op
-- on re-run. Safe to apply at any time once the code change has
-- been deployed (which it has, in the same commit as this file).
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
