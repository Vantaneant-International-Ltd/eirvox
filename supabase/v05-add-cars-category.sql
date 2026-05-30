-- ============================================================
-- ÉIRVOX · Add 'Cars' category (whole vehicles)
-- ============================================================
--
-- Curated whole-vehicle category, sibling to the existing
-- 'Automotive' bucket (which covers parts, OEM+ mods, and full
-- builds). The brand stays narrow — premium enthusiast objects —
-- and Cars sits inside that same lane: Bring a Trailer logic, not
-- DoneDeal logic. Property, jobs, services etc. are intentionally
-- NOT added; that would require a different platform.
--
-- This file:
--   §1  Bumps sort_order on every existing row by +1 to make room
--   §2  Inserts the new 'cars' row at sort_order = 1
--   §3  Refines the 'automotive' description so visitors can
--       tell the two categories apart
--
-- Idempotent: safe to re-run.
-- ============================================================


-- §1 + §2 — shift existing rows, then insert (in a single tx).
BEGIN;

-- Bump existing rows only if we haven't already done so. Detect by
-- the presence of the 'cars' slug; if it exists this file already ran.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'cars') THEN
    UPDATE public.categories
       SET sort_order = sort_order + 1
     WHERE slug IN ('automotive','watches','fashion','tech','home-design','audio-vinyl','art');
  END IF;
END $$;

INSERT INTO public.categories (slug, name, description, sort_order)
VALUES (
  'cars',
  'Cars',
  'Curated enthusiast and collector cars. Modern classics, low-mileage specials, restored cars worth a second look.',
  1
)
ON CONFLICT (slug) DO NOTHING;

-- §3 — Sharpen the Automotive description so it reads as the parts
-- bucket, not a competing "cars" entry.
UPDATE public.categories
   SET description = 'OEM+ parts, performance modifications, and full builds. Whole cars live in the Cars category.'
 WHERE slug = 'automotive';

COMMIT;

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- Verification
-- ============================================================
--
-- SELECT slug, name, sort_order FROM public.categories ORDER BY sort_order;
--
-- Expected (after first run):
--   cars           1
--   automotive     2
--   watches        3
--   fashion        4
--   tech           5
--   home-design    6
--   audio-vinyl    7
--   art            8
-- ============================================================
