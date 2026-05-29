-- ============================================================
-- ÉIRVOX · v0.4 — API layer additions (Prompt D)
-- ============================================================
-- Schema bits we still need for the live-data migration:
--   • saved_items (buyer bookmarks)
--   • listings.slug (human-readable URLs)
--   • listings.subcategory (filter sidebar)
--   • categories.subcategories[] (filter sidebar values per category)
--   • increment_listing_view() RPC (fire-and-forget view counter)
--   • search_listings() / search_tradespeople() — ranked text search
--
-- Run AFTER all prior v04 migrations.
-- Idempotent.
-- ============================================================


-- =============================================================
-- §1  saved_items — buyer bookmarks
-- -------------------------------------------------------------
-- Drop-and-recreate so prior partial runs that left this table
-- with a different column name (e.g. profile_id) don't break
-- the policies below. No data loss here — bookmarks are
-- ephemeral and the buyer can re-add them.
-- =============================================================

DROP TABLE IF EXISTS public.saved_items CASCADE;

CREATE TABLE public.saved_items (
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id  uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  saved_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_items_own"
  ON public.saved_items FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_items_admin"
  ON public.saved_items FOR SELECT TO authenticated
  USING (public.is_admin());


-- =============================================================
-- §2  listings.slug + subcategory
-- =============================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS subcategory text;

-- Slug generator: lower-case, hyphen-separated, plus a 6-char id suffix
-- so collisions are vanishingly unlikely.
CREATE OR REPLACE FUNCTION public.listings_slugify(title text, id uuid)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    regexp_replace(
      lower(coalesce(title, 'listing')),
      '[^a-z0-9]+', '-', 'g'
    )
    || '-'
    || substr(replace(id::text, '-', ''), 1, 6);
$$;

-- Backfill missing slugs
UPDATE public.listings
   SET slug = public.listings_slugify(title, id)
 WHERE slug IS NULL;

-- Auto-fill on new listing
CREATE OR REPLACE FUNCTION public.listings_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.listings_slugify(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_slug_trigger ON public.listings;
CREATE TRIGGER listings_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.listings_set_slug();

CREATE UNIQUE INDEX IF NOT EXISTS listings_slug_unique
  ON public.listings (slug);


-- =============================================================
-- §3  categories.subcategories[] — for the filter sidebar
-- =============================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS subcategories text[] NOT NULL DEFAULT '{}'::text[];

-- Seed from the static data (these were hand-curated; admins can edit later)
UPDATE public.categories SET subcategories = ARRAY[
  'Steering Wheels','Exhaust','Suspension','Interior','Exterior',
  'Wheels & Tyres','Electronics','Full Builds','Brakes','Cooling'
] WHERE slug = 'automotive';

UPDATE public.categories SET subcategories = ARRAY[
  'Swiss Made','Japanese','Vintage','Accessories'
] WHERE slug = 'watches';

UPDATE public.categories SET subcategories = ARRAY[
  'Outerwear','Knitwear','Footwear','Accessories'
] WHERE slug = 'fashion';

UPDATE public.categories SET subcategories = ARRAY[
  'Cameras','Computers','Audio','Accessories'
] WHERE slug = 'tech';

UPDATE public.categories SET subcategories = ARRAY[
  'Seating','Storage','Lighting','Objects'
] WHERE slug = 'home-design';

UPDATE public.categories SET subcategories = ARRAY[
  'Turntables','Amplifiers','Speakers','Vinyl'
] WHERE slug = 'audio-vinyl';

UPDATE public.categories SET subcategories = ARRAY[
  'Prints','Photographs','Original Works'
] WHERE slug = 'art';


-- =============================================================
-- §4  increment_listing_view RPC (fire-and-forget)
-- =============================================================

CREATE OR REPLACE FUNCTION public.increment_listing_view(listing_slug text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings
     SET views_count = views_count + 1
   WHERE slug = listing_slug;
$$;

GRANT EXECUTE ON FUNCTION public.increment_listing_view(text) TO anon, authenticated;


-- =============================================================
-- §5  search_listings — ranked ilike search
-- =============================================================

CREATE OR REPLACE FUNCTION public.search_listings(q text, lim int DEFAULT 24)
RETURNS SETOF public.listings
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT l.*
    FROM public.listings l
   WHERE l.status = 'active'
     AND (
       l.title       ILIKE '%' || q || '%'
       OR l.subtitle ILIKE '%' || q || '%'
       OR l.description ILIKE '%' || q || '%'
       OR l.subcategory ILIKE '%' || q || '%'
     )
   ORDER BY
     CASE WHEN l.title ILIKE q || '%' THEN 0
          WHEN l.title ILIKE '%' || q || '%' THEN 1
          ELSE 2 END,
     l.views_count DESC,
     l.published_at DESC NULLS LAST,
     l.created_at DESC
   LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION public.search_listings(text, int) TO anon, authenticated;


-- =============================================================
-- §6  search_tradespeople
-- =============================================================

CREATE OR REPLACE FUNCTION public.search_tradespeople(q text, lim int DEFAULT 24)
RETURNS SETOF public.tradespeople
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT t.*
    FROM public.tradespeople t
   WHERE t.status = 'approved'
     AND (
       t.name    ILIKE '%' || q || '%'
       OR t.tagline ILIKE '%' || q || '%'
       OR t.bio     ILIKE '%' || q || '%'
       OR t.trade   ILIKE '%' || q || '%'
       OR t.town    ILIKE '%' || q || '%'
       OR t.county  ILIKE '%' || q || '%'
     )
   ORDER BY
     CASE WHEN t.name ILIKE q || '%' THEN 0 ELSE 1 END,
     t.rating DESC NULLS LAST,
     t.completed_jobs DESC
   LIMIT lim;
$$;

GRANT EXECUTE ON FUNCTION public.search_tradespeople(text, int) TO anon, authenticated;


-- =============================================================
-- §7  listing_count per category — for the home/category pages
-- =============================================================

CREATE OR REPLACE FUNCTION public.category_listing_counts()
RETURNS TABLE (category_slug text, listing_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT category_slug, count(*)
    FROM public.listings
   WHERE status = 'active'
     AND category_slug IS NOT NULL
   GROUP BY category_slug;
$$;

GRANT EXECUTE ON FUNCTION public.category_listing_counts() TO anon, authenticated;


-- =============================================================
-- §8  Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
