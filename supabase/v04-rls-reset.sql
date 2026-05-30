-- ============================================================
-- ÉIRVOX · v0.4 RLS reset
-- ============================================================
-- Run this if you ran the v04 schema patch and queries are STILL
-- failing with "infinite recursion detected in policy for relation
-- profiles".
--
-- Two likely causes:
--   1. PostgREST's schema cache is stale (common right after policy
--      changes). The NOTIFY at the end of this file forces a reload.
--   2. An earlier SQL script you ran left a recursive admin policy
--      on profiles under a different name, so the DROP IF EXISTS in
--      v04-marketplace-schema.sql didn't catch it.
--
-- This script nukes every policy on profiles, sellers, listings,
-- listing_images, listing_specs, and reservations and recreates the
-- correct set, then asks PostgREST to reload.
--
-- Idempotent: safe to re-run.
-- ============================================================


-- =============================================================
-- §0  Visibility — log what policies currently exist
-- =============================================================

DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '---- Policies BEFORE reset ----';
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname IN ('public', 'storage')
       AND tablename  IN (
         'profiles','sellers','listings','listing_images',
         'listing_specs','reservations','objects'
       )
     ORDER BY schemaname, tablename, policyname
  LOOP
    RAISE NOTICE '  %.% — %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;


-- =============================================================
-- §1  Drop EVERY policy on the affected tables.
--     This catches policies under any name (including older
--     recursive ones from prior scripts).
-- =============================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN (
         'profiles','sellers','listings','listing_images',
         'listing_specs','reservations'
       )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
    RAISE NOTICE 'dropped policy %.% — %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
END $$;

-- And drop the storage policies we manage too
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'storage'
       AND tablename  = 'objects'
       AND policyname IN (
         'Listing images: public read',
         'Listing images: seller write',
         'Seller logos: public read',
         'Seller logos: owner write'
       )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;


-- =============================================================
-- §2  Helper functions — recreated SECURITY DEFINER so they
--     bypass RLS when called from policies on the same tables.
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.profiles
     WHERE id = auth.uid()
       AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.current_seller_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id
    FROM public.sellers
   WHERE profile_id = auth.uid()
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_seller_id() TO authenticated;


-- =============================================================
-- §3  Profiles — clean policy set
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_select_all"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());


-- =============================================================
-- §4  Sellers — clean policy set
-- =============================================================

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sellers_select_approved"
  ON public.sellers FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "sellers_select_own"
  ON public.sellers FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "sellers_insert_own"
  ON public.sellers FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "sellers_update_own"
  ON public.sellers FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "sellers_admin_all"
  ON public.sellers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================
-- §5  Listings — clean policy set
-- =============================================================

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select_public"
  ON public.listings FOR SELECT TO anon, authenticated
  USING (status IN ('active', 'reserved', 'sold'));

CREATE POLICY "listings_select_own"
  ON public.listings FOR SELECT TO authenticated
  USING (seller_id = public.current_seller_id());

CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = public.current_seller_id());

CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE TO authenticated
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

CREATE POLICY "listings_admin_all"
  ON public.listings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================
-- §6  Listing images — clean policy set
-- =============================================================

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_images_select_all"
  ON public.listing_images FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "listing_images_write_own"
  ON public.listing_images FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.seller_id = public.current_seller_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_images.listing_id
        AND l.seller_id = public.current_seller_id()
    )
  );


-- =============================================================
-- §7  Listing specs — clean policy set
-- =============================================================

ALTER TABLE public.listing_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_specs_select_all"
  ON public.listing_specs FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "listing_specs_write_own"
  ON public.listing_specs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_specs.listing_id
        AND l.seller_id = public.current_seller_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_specs.listing_id
        AND l.seller_id = public.current_seller_id()
    )
  );


-- =============================================================
-- §8  Reservations — clean policy set
-- =============================================================

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservations_buyer_select"
  ON public.reservations FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "reservations_seller_select"
  ON public.reservations FOR SELECT TO authenticated
  USING (seller_id = public.current_seller_id());

CREATE POLICY "reservations_buyer_insert"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "reservations_buyer_update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "reservations_seller_update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

CREATE POLICY "reservations_admin_all"
  ON public.reservations FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================
-- §9  Categories — public read
-- =============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_all" ON public.categories;
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT TO anon, authenticated USING (true);


-- =============================================================
-- §10  Storage object policies
-- =============================================================

CREATE POLICY "Listing images: public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-images');

CREATE POLICY "Listing images: seller write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = public.current_seller_id()::text
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = public.current_seller_id()::text
  );

CREATE POLICY "Seller logos: public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'seller-logos');

CREATE POLICY "Seller logos: owner write"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'seller-logos'
    AND split_part(name, '.', 1) = public.current_seller_id()::text
  )
  WITH CHECK (
    bucket_id = 'seller-logos'
    AND split_part(name, '.', 1) = public.current_seller_id()::text
  );


-- =============================================================
-- §11  Force PostgREST to reload its schema cache.
--      This is the step that "Success. No rows returned" alone
--      doesn't trigger.
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- =============================================================
-- §12  Visibility — log what policies exist after the reset
-- =============================================================

DO $$
DECLARE
  r record;
BEGIN
  RAISE NOTICE '---- Policies AFTER reset ----';
  FOR r IN
    SELECT schemaname, tablename, policyname
      FROM pg_policies
     WHERE schemaname IN ('public', 'storage')
       AND tablename  IN (
         'profiles','sellers','listings','listing_images',
         'listing_specs','reservations','objects'
       )
     ORDER BY schemaname, tablename, policyname
  LOOP
    RAISE NOTICE '  %.% — %', r.schemaname, r.tablename, r.policyname;
  END LOOP;
  RAISE NOTICE '---- Done. PostgREST cache reload signaled. ----';
END $$;
