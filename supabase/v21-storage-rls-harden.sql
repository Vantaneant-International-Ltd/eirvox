-- ============================================================
-- v21 · Storage RLS hardening
-- ============================================================
-- COMMITTED FOR REVIEWED EXTERNAL APPLY. NOT applied by the
-- assistant. The reviewer must apply this in staging and test
-- that admin/seller uploads still succeed and public image display
-- still works BEFORE shipping to prod.
-- ============================================================
-- The Supabase advisor flagged broad bucket listing on all four
-- public buckets (avatars, listing-images, seller-logos,
-- trade-photos). Hand inspection of pg_policies on storage.objects
-- surfaced a worse issue the advisor did not flag:
--
--   Four INSERT policies are granted to role "public" with NO
--   folder/owner scoping in the WITH CHECK clause beyond a generic
--   bucket_id check (three) or are granted to "public" where they
--   should be granted to "authenticated" explicitly (one):
--
--     - "Authenticated upload listing images"  cmd=INSERT, role=public,
--       WITH CHECK: bucket_id='listing-images' AND auth.role()='authenticated'
--       Effect: any authenticated user can upload to ANY folder in
--       listing-images, including impersonating another seller's
--       folder. The auth.role() check stops anon, but does NOT
--       scope to the uploader.
--     - "Authenticated upload seller logos"    same problem on seller-logos.
--     - "Authenticated upload trade photos"    same problem on trade-photos.
--     - "Users upload own avatar"              cmd=INSERT, role=public,
--       WITH CHECK already scoped via auth.uid()::text =
--       (storage.foldername(name))[1]. Safe in practice (anon's
--       auth.uid() is NULL so the check fails), but role should be
--       "authenticated" explicitly so the policy is self-evident.
--
-- The SELECT side has TWO duplicate public-read policies on
-- listing-images and seller-logos. They overlap and add noise.
-- The duplicate must be collapsed so there is exactly one
-- public-read per bucket.
--
-- The existing scoped write policies on listing-images and
-- seller-logos already handle the legitimate authenticated upload
-- path with proper folder/owner scoping (current_seller_id()).
-- They use cmd=ALL, which covers INSERT/UPDATE/DELETE; once the
-- unrestricted policies are dropped, those scoped ones become the
-- only INSERT path for sellers, which is what we want.
--
-- Trade-photos has no scoped write policy at all. The trade-photos
-- upload flow is not yet implemented in the frontend; this
-- migration adds a forward-compatible scoped policy keyed on
-- auth.uid()::text matching (storage.foldername(name))[1]. If
-- the implementer of trade uploads later decides to scope by
-- tradesperson_id instead, this policy MUST be replaced (not
-- amended) before that code ships.
--
-- Avatars gains explicit UPDATE and DELETE owner policies so a
-- user can replace or remove their own avatar without bypassing
-- through service-role.
-- ============================================================

BEGIN;

-- ── 1. Drop unrestricted INSERT policies ────────────────────
DROP POLICY IF EXISTS "Authenticated upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload seller logos"   ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload trade photos"   ON storage.objects;


-- ── 2. Collapse duplicate public-read SELECT policies ───────
-- Listing-images had both "Listing images: public read" and
-- "Public read listing images". The first uses role=anon,authenticated
-- (more explicit). Keep the first, drop the second.
-- Seller-logos: same situation.
DROP POLICY IF EXISTS "Public read listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public read seller logos"   ON storage.objects;


-- ── 3. Re-create avatar owner upload as authenticated-role + folder-scoped ──
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;

CREATE POLICY "Avatars: owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Avatars: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );


-- ── 4. Drop the auth.uid()-keyed listing-images delete policy ──
-- "Owner delete listing images" was scoped by auth.uid(), but the
-- listing-images folder convention uses seller.id (a different
-- UUID from the user's profile.id / auth.uid()). The policy never
-- matched in practice, and the legitimate seller delete path is
-- already covered by "Listing images: seller write" (cmd=ALL,
-- scoped to current_seller_id()::text). Drop the broken one.
DROP POLICY IF EXISTS "Owner delete listing images" ON storage.objects;


-- ── 5. Add scoped INSERT/UPDATE/DELETE for trade-photos ─────
-- Forward-compatible default. Folder is named after auth.uid().
-- If the trade upload flow lands a different convention (e.g.
-- folder = tradesperson_id), REPLACE these three policies in the
-- same migration that ships the upload code, do not stack them.
CREATE POLICY "Trade photos: owner insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trade-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Trade photos: owner update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'trade-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'trade-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Trade photos: owner delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'trade-photos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );


COMMIT;


-- ============================================================
-- POST-APPLY VERIFICATION (run these after applying the migration)
-- ============================================================
-- 1. Confirm the new policy set:
--      SELECT policyname, roles, cmd
--        FROM pg_policies
--       WHERE schemaname='storage' AND tablename='objects'
--       ORDER BY policyname;
--
--    Expected:
--      Avatars: owner delete                (DELETE, {authenticated})
--      Avatars: owner insert                (INSERT, {authenticated})
--      Avatars: owner update                (UPDATE, {authenticated})
--      Listing images: public read          (SELECT, {anon,authenticated})
--      Listing images: seller write         (ALL,    {authenticated})
--      Public read avatars                  (SELECT, {public})
--      Public read trade photos             (SELECT, {public})
--      Seller logos: owner write            (ALL,    {authenticated})
--      Seller logos: public read            (SELECT, {anon,authenticated})
--      Trade photos: owner delete           (DELETE, {authenticated})
--      Trade photos: owner insert           (INSERT, {authenticated})
--      Trade photos: owner update           (UPDATE, {authenticated})
--
-- 2. Functional tests in staging BEFORE production apply:
--    a) Signed-in seller can upload a listing image to their own
--       folder via the admin/seller dashboard. Expected: succeeds.
--    b) Signed-in seller attempts to write to another seller's
--       folder name (manual fetch). Expected: 403.
--    c) Anonymous user attempts upload to any bucket. Expected:
--       403 (no INSERT policy applies to anon role).
--    d) Public GET of a known listing-image URL returns the file
--       (public buckets bypass RLS on the storage REST GET path).
--    e) supabase.storage.from('listing-images').list() as anon
--       still returns rows (the SELECT policy allows anon list);
--       this is by design so the existing public-read pattern keeps
--       working. If broader listing must be blocked, the SELECT
--       policy needs to be restricted to authenticated only and
--       the frontend must rely solely on getPublicUrl() which
--       does not call list().
--    f) Avatar owner can replace their own avatar. Expected: succeeds.
--    g) Avatar owner cannot write to another user's avatar folder.
--       Expected: 403.
--
-- 3. If any of (a)-(g) fails in staging, ROLLBACK with:
--      The migration is a single transaction, so the staging DB
--      should be restored to pre-migration state by re-creating
--      the dropped policies from the policy listing at the top of
--      this file. A reverse migration is left for the reviewer.
-- ============================================================
