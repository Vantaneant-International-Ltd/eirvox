-- ============================================================
-- ÉIRVOX · v0.4 marketplace schema + RLS recursion fix
-- ============================================================
-- Run in Supabase Dashboard → SQL Editor → New query.
-- Idempotent: safe to re-run any time.
--
-- What this script does
--   §1  Fixes the infinite-recursion bug in the profiles RLS policy
--   §2  Establishes (or aligns) the marketplace tables the v0.4
--       code expects: sellers, categories, listings, listing_images,
--       listing_specs, reservations
--   §3  Adds RLS policies + a helper is_admin() function
--   §4  Creates two Storage buckets (seller-logos, listing-images)
--       and the policies that let the right people read/write
--   §5  Seeds the 7 marketplace categories so the create-listing
--       flow has something to render
-- ============================================================


-- =============================================================
-- §1  RLS recursion fix
-- -------------------------------------------------------------
-- The earlier "admin read all" policy queried profiles from inside
-- profiles's policy → infinite loop → 500 on every query that
-- touches profiles (i.e. almost everything via FK joins).
--
-- Replace it with a SECURITY DEFINER helper that bypasses RLS.
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
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
SET search_path = public
AS $$
  SELECT id
    FROM public.sellers
   WHERE profile_id = auth.uid()
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.current_seller_id() TO authenticated;

-- Drop and recreate the recursive policy
DROP POLICY IF EXISTS "Profiles: admin read all" ON public.profiles;
CREATE POLICY "Profiles: admin read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());


-- =============================================================
-- §2  Sellers table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.sellers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  trading_name    text NOT NULL,
  handle          text UNIQUE,
  email           text,
  phone           text,
  city            text,
  bio             text,
  logo_url        text,
  primary_category text,
  what_they_sell  text,
  inventory_count text,
  price_low       integer,
  price_high      integer,
  sourcing_method text,
  trading_since   text,
  tier            text NOT NULL DEFAULT 'verified',
  status          text NOT NULL DEFAULT 'pending',
  applied_at      timestamptz NOT NULL DEFAULT now(),
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sellers_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  CONSTRAINT sellers_tier_check
    CHECK (tier IN ('verified', 'atelier', 'house'))
);

-- Backfill columns if the table already exists with an older shape
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS profile_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS trading_name    text,
  ADD COLUMN IF NOT EXISTS handle          text,
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS phone           text,
  ADD COLUMN IF NOT EXISTS city            text,
  ADD COLUMN IF NOT EXISTS bio             text,
  ADD COLUMN IF NOT EXISTS logo_url        text,
  ADD COLUMN IF NOT EXISTS primary_category text,
  ADD COLUMN IF NOT EXISTS what_they_sell  text,
  ADD COLUMN IF NOT EXISTS inventory_count text,
  ADD COLUMN IF NOT EXISTS price_low       integer,
  ADD COLUMN IF NOT EXISTS price_high      integer,
  ADD COLUMN IF NOT EXISTS sourcing_method text,
  ADD COLUMN IF NOT EXISTS trading_since   text,
  ADD COLUMN IF NOT EXISTS tier            text NOT NULL DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS applied_at      timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_at     timestamptz,
  ADD COLUMN IF NOT EXISTS created_at      timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sellers: read own"        ON public.sellers;
DROP POLICY IF EXISTS "Sellers: read approved"   ON public.sellers;
DROP POLICY IF EXISTS "Sellers: insert own"      ON public.sellers;
DROP POLICY IF EXISTS "Sellers: update own"      ON public.sellers;
DROP POLICY IF EXISTS "Sellers: admin all"       ON public.sellers;

CREATE POLICY "Sellers: read own"
  ON public.sellers FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Sellers: read approved"
  ON public.sellers FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Sellers: insert own"
  ON public.sellers FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Sellers: update own"
  ON public.sellers FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Sellers: admin all"
  ON public.sellers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================
-- §3  Categories
-- =============================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categories: read all" ON public.categories;
CREATE POLICY "Categories: read all"
  ON public.categories FOR SELECT TO anon, authenticated USING (true);

-- Seed the 7 marketplace categories (idempotent)
INSERT INTO public.categories (slug, name, description, sort_order) VALUES
  ('automotive',    'Automotive',     'OEM+ parts, performance mods, and full builds.',                   1),
  ('watches',       'Watches',        'Mechanical and quartz watches from verified sellers.',             2),
  ('fashion',       'Fashion',        'Outerwear, knitwear, and archival pieces.',                        3),
  ('tech',          'Tech',           'Cameras, computers, and audio equipment.',                         4),
  ('home-design',   'Home & Design',  'Furniture, lighting, and objects from studio and vintage editions.',5),
  ('audio-vinyl',   'Audio & Vinyl',  'Turntables, amplifiers, and vinyl collections.',                   6),
  ('art',           'Art',            'Prints, photographs, and original works.',                         7)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order;


-- =============================================================
-- §4  Listings
-- =============================================================

CREATE TABLE IF NOT EXISTS public.listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  category_id         uuid REFERENCES public.categories(id),
  category_slug       text,
  title               text NOT NULL,
  subtitle            text,
  description         text,
  condition           text,
  price               integer NOT NULL DEFAULT 0,
  original_price      integer,
  currency            text NOT NULL DEFAULT 'EUR',
  accepts_offers      boolean NOT NULL DEFAULT true,
  shipping_available  boolean NOT NULL DEFAULT true,
  collection_available boolean NOT NULL DEFAULT true,
  shipping_cost       integer,
  city                text,
  status              text NOT NULL DEFAULT 'draft',
  views_count         integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  published_at        timestamptz,
  CONSTRAINT listings_status_check
    CHECK (status IN ('draft', 'pending_review', 'active', 'reserved', 'sold', 'removed'))
);

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seller_id           uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS category_id         uuid REFERENCES public.categories(id),
  ADD COLUMN IF NOT EXISTS category_slug       text,
  ADD COLUMN IF NOT EXISTS title               text,
  ADD COLUMN IF NOT EXISTS subtitle            text,
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS condition           text,
  ADD COLUMN IF NOT EXISTS price               integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price      integer,
  ADD COLUMN IF NOT EXISTS currency            text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS accepts_offers      boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shipping_available  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS collection_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS shipping_cost       integer,
  ADD COLUMN IF NOT EXISTS city                text,
  ADD COLUMN IF NOT EXISTS status              text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS views_count         integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at          timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS published_at        timestamptz;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Listings: read public"     ON public.listings;
DROP POLICY IF EXISTS "Listings: read own"        ON public.listings;
DROP POLICY IF EXISTS "Listings: insert own"      ON public.listings;
DROP POLICY IF EXISTS "Listings: update own"      ON public.listings;
DROP POLICY IF EXISTS "Listings: admin all"       ON public.listings;

-- Everyone (signed in or not) can see active / reserved / sold listings
CREATE POLICY "Listings: read public"
  ON public.listings FOR SELECT TO anon, authenticated
  USING (status IN ('active', 'reserved', 'sold'));

-- Seller can see all of their own listings (draft / pending too)
CREATE POLICY "Listings: read own"
  ON public.listings FOR SELECT TO authenticated
  USING (seller_id = public.current_seller_id());

CREATE POLICY "Listings: insert own"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = public.current_seller_id());

CREATE POLICY "Listings: update own"
  ON public.listings FOR UPDATE TO authenticated
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

CREATE POLICY "Listings: admin all"
  ON public.listings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================
-- §5  Listing images
-- =============================================================

CREATE TABLE IF NOT EXISTS public.listing_images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url   text,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_images
  ADD COLUMN IF NOT EXISTS listing_id   uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS public_url   text,
  ADD COLUMN IF NOT EXISTS sort_order   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Images: read all"   ON public.listing_images;
DROP POLICY IF EXISTS "Images: write own"  ON public.listing_images;

CREATE POLICY "Images: read all"
  ON public.listing_images FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Images: write own"
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
-- §6  Listing specs (key/value)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.listing_specs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  label      text NOT NULL,
  value      text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_specs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Specs: read all"   ON public.listing_specs;
DROP POLICY IF EXISTS "Specs: write own"  ON public.listing_specs;

CREATE POLICY "Specs: read all"
  ON public.listing_specs FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Specs: write own"
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
-- §7  Reservations
-- =============================================================

CREATE TABLE IF NOT EXISTS public.reservations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id       uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  buyer_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  deposit_amount  integer NOT NULL DEFAULT 49,
  balance_amount  integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'pending_deposit',
  notes           text,
  reserved_at     timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reservations_status_check
    CHECK (status IN ('pending_deposit', 'reserved', 'confirmed', 'shipped', 'completed', 'cancelled'))
);

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS listing_id      uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS seller_id       uuid REFERENCES public.sellers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS buyer_id        uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS deposit_amount  integer NOT NULL DEFAULT 49,
  ADD COLUMN IF NOT EXISTS balance_amount  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'pending_deposit',
  ADD COLUMN IF NOT EXISTS notes           text,
  ADD COLUMN IF NOT EXISTS reserved_at     timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reservations: buyer read"      ON public.reservations;
DROP POLICY IF EXISTS "Reservations: seller read"     ON public.reservations;
DROP POLICY IF EXISTS "Reservations: buyer insert"    ON public.reservations;
DROP POLICY IF EXISTS "Reservations: seller update"   ON public.reservations;
DROP POLICY IF EXISTS "Reservations: buyer cancel"    ON public.reservations;
DROP POLICY IF EXISTS "Reservations: admin all"       ON public.reservations;

CREATE POLICY "Reservations: buyer read"
  ON public.reservations FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Reservations: seller read"
  ON public.reservations FOR SELECT TO authenticated
  USING (seller_id = public.current_seller_id());

CREATE POLICY "Reservations: buyer insert"
  ON public.reservations FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Reservations: seller update"
  ON public.reservations FOR UPDATE TO authenticated
  USING (seller_id = public.current_seller_id())
  WITH CHECK (seller_id = public.current_seller_id());

CREATE POLICY "Reservations: buyer cancel"
  ON public.reservations FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Reservations: admin all"
  ON public.reservations FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================
-- §8  Storage buckets + policies
-- -------------------------------------------------------------
-- Two public buckets:
--   listing-images : <seller_id>/<listing_id>/<file>.jpg
--   seller-logos   : <seller_id>.<ext>
-- =============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listing-images', 'listing-images', true, 6291456,
   ARRAY['image/jpeg','image/png','image/webp','image/avif']::text[]),
  ('seller-logos',   'seller-logos',   true, 2097152,
   ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']::text[])
ON CONFLICT (id) DO UPDATE SET
  public              = EXCLUDED.public,
  file_size_limit     = EXCLUDED.file_size_limit,
  allowed_mime_types  = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Listing images: public read"  ON storage.objects;
DROP POLICY IF EXISTS "Listing images: seller write" ON storage.objects;
DROP POLICY IF EXISTS "Seller logos: public read"    ON storage.objects;
DROP POLICY IF EXISTS "Seller logos: owner write"    ON storage.objects;

-- Anyone can view (buckets are public; this lets clients fetch via
-- public URL or the storage API).
CREATE POLICY "Listing images: public read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'listing-images');

-- A seller may write only inside their own /<seller_id>/ folder
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

-- Seller can write their own logo file at /<seller_id>.<ext>
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
-- §9  updated_at touch triggers
-- =============================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_sellers      ON public.sellers;
DROP TRIGGER IF EXISTS touch_listings     ON public.listings;
DROP TRIGGER IF EXISTS touch_reservations ON public.reservations;

CREATE TRIGGER touch_sellers      BEFORE UPDATE ON public.sellers      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_listings     BEFORE UPDATE ON public.listings     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_reservations BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- ============================================================
-- Done.  Three things should now work:
--   • Sign up + login (profiles trigger no longer recurses)
--   • Anyone can browse categories + active listings
--   • Approved sellers can CRUD their own listings + images
-- ============================================================
