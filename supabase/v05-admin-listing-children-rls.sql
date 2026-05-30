-- ============================================================
-- ÉIRVOX · Admin-wide RLS on listing_images and listing_specs
-- ============================================================
--
-- public.listings already has listings_admin_all (USING is_admin()).
-- But its two child tables only have per-seller policies tied to
-- current_seller_id() — meaning an admin whose house seller row
-- doesn't match perfectly (e.g. multiple sellers with the same
-- profile_id, or stale data) can silently fail to write images or
-- specs on listings they otherwise control.
--
-- Add admin-wide policies on both child tables to match the parent.
-- Existing per-seller policies stay in place; PostgreSQL evaluates
-- multiple policies on the same op as OR, so admins now match via
-- the admin policy AND sellers still match via their own.
--
-- Idempotent: safe to re-run.
-- ============================================================

DROP POLICY IF EXISTS "listing_images_admin_all" ON public.listing_images;
CREATE POLICY "listing_images_admin_all"
  ON public.listing_images
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "listing_specs_admin_all" ON public.listing_specs;
CREATE POLICY "listing_specs_admin_all"
  ON public.listing_specs
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';


-- ============================================================
-- Verify
-- ============================================================
-- SELECT tablename, policyname, cmd
--   FROM pg_policies
--  WHERE schemaname = 'public'
--    AND tablename IN ('listing_images','listing_specs')
--  ORDER BY tablename, policyname;
--
-- Expected: each table now has two policies — *_select_all,
-- *_write_own (existing), and *_admin_all (new).
-- ============================================================
