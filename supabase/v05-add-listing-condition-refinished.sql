-- ============================================================
-- ÉIRVOX · Add 'refinished' to listing_condition enum
-- ============================================================
--
-- Front-end seller form has always offered a "Refinished" option for
-- parts and restored items, but the live enum only had:
--   new, like_new, excellent, good, fair
-- Posting a "refinished" item therefore failed with
--   invalid input value for enum listing_condition: "Like New"
--   (the front-end was also sending labels instead of enum values —
--   that's fixed in the same commit as this SQL.)
--
-- ALTER TYPE ... ADD VALUE in Postgres is idempotent only via the
-- IF NOT EXISTS clause (PG 12+).
--
-- IMPORTANT: ADD VALUE cannot run inside a transaction with other
-- DDL that uses the new value. We don't use the new value elsewhere
-- in this file, so the implicit single-statement tx is fine.
-- ============================================================

ALTER TYPE public.listing_condition ADD VALUE IF NOT EXISTS 'refinished';

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- Verify
-- ============================================================
--
-- SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = 'public.listing_condition'::regtype
--   ORDER BY enumsortorder;
--
-- Expected (after running):
--   new
--   like_new
--   excellent
--   good
--   fair
--   refinished
-- ============================================================
