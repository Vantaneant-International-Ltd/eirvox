-- v23-storage-disable-public-listing.sql
--
-- Purpose: disable public bucket LISTING on the four public buckets. Each bucket
-- currently has a broad SELECT policy on storage.objects granting the whole
-- bucket to anon/public, which enables the LIST API (anyone can enumerate every
-- object name). Object BYTES are served via the public-bucket URL
-- (/object/public/...) independently of any SELECT policy, so dropping these
-- policies removes only the enumeration surface, not normal reads.
--
-- Verification (done before writing this migration):
--   - The app reads objects via getPublicUrl (src/lib/listings.ts, src/lib/sellers.ts).
--   - There are NO storage .list() calls in the app (src/, api/); the only .list()
--     reference is a comment in supabase/v21-storage-rls-harden.sql.
--   So disabling listing does not break any code path.
--
-- CAVEAT (confirm before applying): this fix assumes the four buckets are marked
-- PUBLIC in the dashboard (Storage -> bucket -> Public = on). If any bucket is
-- PRIVATE, its objects are served through a signed/authenticated path and the
-- broad SELECT is what enables reads; dropping it would break reads. For any
-- private bucket, do NOT drop here. Instead scope SELECT to the owner, e.g.:
--   create policy "<bucket>: owner read" on storage.objects for select
--     to authenticated
--     using (bucket_id = '<bucket>' and (storage.foldername(name))[1] = (auth.uid())::text);
--
-- Not applied automatically. Apply via the dashboard or migration flow.

drop policy if exists "Public read avatars"         on storage.objects;
drop policy if exists "Listing images: public read" on storage.objects;
drop policy if exists "Seller logos: public read"   on storage.objects;
drop policy if exists "Public read trade photos"    on storage.objects;
