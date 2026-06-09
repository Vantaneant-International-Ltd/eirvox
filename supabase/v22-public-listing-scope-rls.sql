-- ============================================================
-- v22 · Public listing scope — enforce wheel-specialist hiding in RLS
-- ============================================================
--
-- REVIEW ONLY. DO NOT let CI/agents apply this. The owner applies DB
-- changes externally after review, then runs the post-apply anon tests
-- at the bottom of this file.
--
-- WHY
-- ---
-- Until now the "wheel_specialist_mode" hiding lived entirely in the
-- front end (src/lib/api.ts filters, Nav/Home conditionals). The anon
-- SELECT policy on public.listings gated by status only:
--
--     USING (status IN ('active','reserved','sold'))
--
-- Because the browser uses the public anon key, any non-wheel listing
-- (e.g. the Rimowa suitcase in 'fashion', the Meta Ray-Bans in 'tech')
-- was retrievable by a raw PostgREST query, by /#/listing/<slug>, and
-- by search — the JS filter is trivially bypassed. Proven live: as the
-- anon role those two rows were returned.
--
-- WHAT THIS DOES
-- --------------
-- Rewrites ONLY the public SELECT policy on public.listings (and the
-- search_listings RPC body) so a row is publicly readable iff:
--
--     status IN ('active','reserved','sold')
--   AND ( wheel_specialist_mode is OFF
--         OR is_drive = true                       -- DRIVE wheels
--         OR category_slug = ANY(<allowlist>) )    -- e.g. 'automotive'
--
-- The flag + allowlist are read from public.site_settings (key='flags')
-- via two SECURITY DEFINER helpers so the policy works for the anon role
-- without granting it broad access to site_settings internals.
--
-- FAIL CLOSED (critical)
-- ----------------------
-- If the flags row is missing, null, or malformed, the helpers default
-- to the RESTRICTIVE posture — wheel mode ON, allowlist ['automotive'] —
-- so a flag that cannot be read HIDES more, never opens the marketplace.
-- DRIVE stays visible via is_drive; the consignment via 'automotive'.
--
-- REVERSIBLE
-- ----------
-- Set wheel_specialist_mode=false in /admin/settings → evx_wheel_mode()
-- returns false → the category predicate short-circuits to TRUE → the
-- full marketplace (every active listing, any category) returns. Nothing
-- is deleted.
--
-- SCOPE GUARD
-- -----------
-- Touches ONLY "listings_select_public" and search_listings. Does NOT
-- touch listings_select_own, listings_admin_all, or any INSERT/UPDATE
-- policy. Sellers still see their own rows; admins still see all rows.
-- ============================================================

BEGIN;

-- ── Helpers: fail-closed reads of the launch flags ───────────
--
-- SECURITY DEFINER so the policy can consult site_settings while the
-- caller is anon. STABLE (one value per statement). Any error in
-- parsing -> restrictive default (never the open posture).

CREATE OR REPLACE FUNCTION public.evx_wheel_mode()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v boolean;
BEGIN
  SELECT (value ->> 'wheel_specialist_mode')::boolean
    INTO v
    FROM public.site_settings
   WHERE key = 'flags';
  -- Missing row, missing key, or NULL -> fail closed (wheel mode ON).
  RETURN COALESCE(v, true);
EXCEPTION WHEN OTHERS THEN
  -- Malformed value / cast failure -> fail closed.
  RETURN true;
END;
$fn$;

CREATE OR REPLACE FUNCTION public.evx_public_allowlist()
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  v text[];
BEGIN
  SELECT ARRAY(
           SELECT jsonb_array_elements_text(value -> 'public_category_allowlist')
             FROM public.site_settings
            WHERE key = 'flags'
         )
    INTO v;
  -- Empty / missing / null -> fail closed to the wheels category so the
  -- consignment wheel stays visible but nothing non-wheel does.
  IF v IS NULL OR array_length(v, 1) IS NULL THEN
    RETURN ARRAY['automotive'];
  END IF;
  RETURN v;
EXCEPTION WHEN OTHERS THEN
  RETURN ARRAY['automotive'];
END;
$fn$;

REVOKE ALL ON FUNCTION public.evx_wheel_mode()        FROM public;
REVOKE ALL ON FUNCTION public.evx_public_allowlist()  FROM public;
GRANT EXECUTE ON FUNCTION public.evx_wheel_mode()       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.evx_public_allowlist() TO anon, authenticated;

-- ── Rewrite ONLY the public SELECT policy ────────────────────
--
-- Replaces v04-rls-reset.sql:193-195. Same name, same roles; adds the
-- wheel-scope predicate. is_drive/category_slug NULLs evaluate falsy,
-- so a malformed row simply fails the OR and stays hidden.

DROP POLICY IF EXISTS "listings_select_public" ON public.listings;

CREATE POLICY "listings_select_public"
  ON public.listings FOR SELECT TO anon, authenticated
  USING (
    status IN ('active', 'reserved', 'sold')
    AND (
      NOT public.evx_wheel_mode()
      OR is_drive = true
      OR category_slug = ANY (public.evx_public_allowlist())
    )
  );

-- ── Mirror the predicate inside search_listings ──────────────
--
-- search_listings is SECURITY INVOKER, so the policy above already
-- constrains it. We add the same predicate explicitly as defence in
-- depth (and so it stays correct if the function is ever switched to
-- SECURITY DEFINER). Signature/return/grants unchanged.

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
     AND (
       NOT public.evx_wheel_mode()
       OR l.is_drive = true
       OR l.category_slug = ANY (public.evx_public_allowlist())
     )
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

NOTIFY pgrst, 'reload schema';

COMMIT;

-- ============================================================
-- PRE-APPLY CHECK (run BEFORE applying, as the table owner)
-- ============================================================
-- Confirms what is currently public-visible and that out-of-scope rows
-- exist (so the after-test is meaningful):
--
--   SELECT category_slug, is_drive, status, slug
--     FROM public.listings
--    WHERE status IN ('active','reserved','sold')
--    ORDER BY category_slug;
--
-- Expect at least one 'fashion' and one 'tech' active row pre-apply.
--
-- ============================================================
-- POST-APPLY CHECK (run AFTER applying — this is the acceptance test)
-- ============================================================
-- Simulate the public anon role under RLS and prove the scope:
--
--   SET LOCAL ROLE anon;
--
--   -- (a) Out-of-scope rows must NOT come back by category, slug, or count:
--   SELECT count(*) AS leaked_nonwheel
--     FROM public.listings
--    WHERE category_slug IN ('fashion','tech','watches','art','home-design','audio-vinyl','cars');
--   -- EXPECT: 0
--
--   SELECT count(*) AS leaked_rimowa
--     FROM public.listings WHERE slug = 'rimowa-original-cabin-suitcase-10pc';
--   -- EXPECT: 0
--
--   SELECT count(*) AS leaked_rayban
--     FROM public.listings WHERE slug = 'meta-rayban-wayfarer-gen2-large-black';
--   -- EXPECT: 0
--
--   -- (b) Wheels MUST remain visible:
--   SELECT count(*) AS visible_wheels
--     FROM public.listings
--    WHERE status IN ('active','reserved','sold')
--      AND (is_drive = true OR category_slug = 'automotive');
--   -- EXPECT: >= 1 (DRIVE issues + the BMW consignment)
--
--   -- (c) Search must not surface out-of-scope items:
--   SELECT count(*) FROM public.search_listings('rimowa', 24);  -- EXPECT: 0
--   SELECT count(*) FROM public.search_listings('ray-ban', 24); -- EXPECT: 0
--
--   RESET ROLE;
--
-- Also confirm reversibility on a staging copy: temporarily set
-- wheel_specialist_mode=false in site_settings.flags, re-run (a) as anon,
-- and verify the full marketplace returns; then set it back to true.
-- ============================================================
