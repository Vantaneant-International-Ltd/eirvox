-- ============================================================
-- ÉIRVOX · v0.4 — Admin panel schema (Prompt C)
-- ============================================================
-- Adds the tables the admin panel reads/writes that don't exist
-- yet: site_settings, tradespeople, trade_categories.
--
-- Run AFTER v04-marketplace-schema.sql and v04-rls-reset.sql.
--
-- Idempotent: safe to re-run any time.
-- ============================================================


-- =============================================================
-- §1  site_settings — a single config row keyed by `key`
-- =============================================================
-- One row per logical setting bucket. Values are JSON so we can
-- evolve the shape without DDL changes.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings_admin_all"   ON public.site_settings;

CREATE POLICY "site_settings_public_read"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "site_settings_admin_all"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed defaults (only if missing)
INSERT INTO public.site_settings (key, value) VALUES
  ('cohort',  jsonb_build_object(
    'number',    3,
    'status',    'open',
    'closes_at', '2026-06-14',
    'tagline',   'COHORT 03 · CLOSES 14 JUN'
  )),
  ('drive',   jsonb_build_object(
    'issue_number',     12,
    'issue_title',      'PORSCHE 911 992 GT3',
    'total_allocation', 200,
    'remaining',        47,
    'price_eur',        149
  )),
  ('fees',    jsonb_build_object(
    'verified_commission_pct', 12,
    'atelier_commission_pct',  10,
    'house_commission_pct',     8,
    'trade_listed_monthly_eur', 0,
    'trade_pro_monthly_eur',   49
  )),
  ('deposit', jsonb_build_object(
    'amount_eur', 49,
    'refundable', true
  ))
ON CONFLICT (key) DO NOTHING;


-- =============================================================
-- §2  trade_categories — directory taxonomy
-- =============================================================

CREATE TABLE IF NOT EXISTS public.trade_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_categories_read_all"  ON public.trade_categories;
DROP POLICY IF EXISTS "trade_categories_admin_all" ON public.trade_categories;

CREATE POLICY "trade_categories_read_all"
  ON public.trade_categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "trade_categories_admin_all"
  ON public.trade_categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seed the 15 trade categories from src/data/tradespeople.ts
INSERT INTO public.trade_categories (slug, name, description, sort_order) VALUES
  ('electricians',    'Electricians',           'Domestic and commercial wiring, EV chargers, certification.',  1),
  ('plumbers',        'Plumbers',               'Bathrooms, leaks, water systems, drainage.',                    2),
  ('welders',         'Welders',                'Mobile MIG/TIG, structural, automotive, gates and railings.',   3),
  ('carpenters',      'Carpenters & Joiners',   'Bespoke joinery, kitchens, fitted furniture, doors.',           4),
  ('painters',        'Painters & Decorators',  'Interior, exterior, specialist finishes, restoration.',         5),
  ('tilers',          'Tilers',                 'Bathrooms, kitchens, large-format, natural stone.',             6),
  ('mechanics',       'Mechanics',              'Service, diagnostics, performance, marque specialists.',        7),
  ('panel-beaters',   'Panel Beaters',          'Bodywork, paint, classic restoration.',                         8),
  ('upholsterers',    'Upholsterers',           'Furniture, automotive interiors, leather and Alcantara.',       9),
  ('landscapers',     'Landscapers',            'Hard landscaping, planting design, maintenance.',              10),
  ('plasterers',      'Plasterers',             'Skim, render, cornicing, restoration plasterwork.',            11),
  ('roofers',         'Roofers',                'Slate, tile, flat-roof, gutter and leadwork.',                 12),
  ('bricklayers',     'Bricklayers',            'New build, extensions, pointing, restoration.',                13),
  ('heating-gas',     'Heating & Gas',          'Gas boilers, heat pumps, system upgrades. RGI registered.',    14),
  ('windows-doors',   'Windows & Doors',        'Supply and fit, repairs, period restoration.',                 15)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;


-- =============================================================
-- §3  tradespeople — TRADE directory rows + applications
-- =============================================================

CREATE TABLE IF NOT EXISTS public.tradespeople (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug              text UNIQUE,
  name              text NOT NULL,
  trade             text NOT NULL,
  tagline           text,
  bio               text,
  county            text,
  town              text,
  coverage_areas    text[] NOT NULL DEFAULT '{}'::text[],
  years_experience  integer,
  qualifications    text[] NOT NULL DEFAULT '{}'::text[],
  rating            numeric(3,2),
  review_count      integer NOT NULL DEFAULT 0,
  completed_jobs    integer NOT NULL DEFAULT 0,
  phone             text,
  email             text,
  response_time     text,
  available_now     boolean NOT NULL DEFAULT false,
  tier              text NOT NULL DEFAULT 'listed',
  status            text NOT NULL DEFAULT 'pending',
  verified          boolean NOT NULL DEFAULT false,
  applied_at        timestamptz NOT NULL DEFAULT now(),
  approved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tradespeople_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  CONSTRAINT tradespeople_tier_check
    CHECK (tier IN ('listed', 'pro'))
);

ALTER TABLE public.tradespeople ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tradespeople_read_approved" ON public.tradespeople;
DROP POLICY IF EXISTS "tradespeople_read_own"      ON public.tradespeople;
DROP POLICY IF EXISTS "tradespeople_insert_own"    ON public.tradespeople;
DROP POLICY IF EXISTS "tradespeople_update_own"    ON public.tradespeople;
DROP POLICY IF EXISTS "tradespeople_admin_all"     ON public.tradespeople;

CREATE POLICY "tradespeople_read_approved"
  ON public.tradespeople FOR SELECT TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "tradespeople_read_own"
  ON public.tradespeople FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "tradespeople_insert_own"
  ON public.tradespeople FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "tradespeople_update_own"
  ON public.tradespeople FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "tradespeople_admin_all"
  ON public.tradespeople FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS touch_tradespeople ON public.tradespeople;
CREATE TRIGGER touch_tradespeople
  BEFORE UPDATE ON public.tradespeople
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Same for site_settings
DROP TRIGGER IF EXISTS touch_site_settings ON public.site_settings;
CREATE TRIGGER touch_site_settings
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


-- =============================================================
-- §4  Add `active` and `kind` to categories
--      (so admins can hide one without deleting it, and we can
--       distinguish marketplace vs trade categories if needed)
-- =============================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;


-- =============================================================
-- §5  Profile suspension flag
-- =============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text;


-- =============================================================
-- §6  Listing flag: featured (for the admin "feature" action)
-- =============================================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;


-- =============================================================
-- §7  Reservation: reference code, cancellation/refund reason
-- =============================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

-- Generate a short reference for any existing rows without one
UPDATE public.reservations
   SET reference = 'EVX-' || upper(substr(replace(id::text, '-', ''), 1, 8))
 WHERE reference IS NULL;


-- =============================================================
-- §8  Recent activity — a view that unions listings/sellers/
--     reservations/tradespeople for the admin dashboard feed.
-- =============================================================

CREATE OR REPLACE VIEW public.admin_activity_recent AS
  SELECT
    'listing'::text  AS kind,
    l.id             AS ref_id,
    l.title          AS label,
    l.status         AS status,
    l.created_at     AS at
  FROM public.listings l
  WHERE l.status != 'removed'
  UNION ALL
  SELECT
    'seller'::text,
    s.id,
    s.trading_name,
    s.status,
    s.created_at
  FROM public.sellers s
  UNION ALL
  SELECT
    'reservation'::text,
    r.id,
    coalesce(r.reference, 'EVX-' || upper(substr(replace(r.id::text, '-', ''), 1, 8))),
    r.status,
    r.reserved_at
  FROM public.reservations r
  UNION ALL
  SELECT
    'tradesperson'::text,
    t.id,
    t.name,
    t.status,
    t.created_at
  FROM public.tradespeople t;

GRANT SELECT ON public.admin_activity_recent TO authenticated;


-- =============================================================
-- §9  Admin counters RPC — single fast call for the dashboard
-- =============================================================

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_listings',        (SELECT count(*) FROM public.listings        WHERE status = 'active'),
    'total_sellers',         (SELECT count(*) FROM public.sellers         WHERE status = 'approved'),
    'total_reservations',    (SELECT count(*) FROM public.reservations),
    'total_tradespeople',    (SELECT count(*) FROM public.tradespeople    WHERE status = 'approved'),
    'total_users',           (SELECT count(*) FROM public.profiles),
    'pending_listings',      (SELECT count(*) FROM public.listings        WHERE status = 'pending_review'),
    'pending_sellers',       (SELECT count(*) FROM public.sellers         WHERE status = 'pending'),
    'pending_trade',         (SELECT count(*) FROM public.tradespeople    WHERE status = 'pending')
  );
$$;

GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;


-- =============================================================
-- §10  Force PostgREST to reload its schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- =============================================================
-- Done.  Admin panel surface area:
--   • /admin/dashboard reads admin_stats() + admin_activity_recent
--   • /admin/listings  reads/writes listings (status, featured, etc.)
--   • /admin/sellers   reads/writes sellers (status, tier)
--   • /admin/reservations reads/writes reservations
--   • /admin/trade     reads/writes tradespeople
--   • /admin/users     reads/writes profiles
--   • /admin/categories reads/writes categories + trade_categories
--   • /admin/settings  reads/writes site_settings
-- ============================================================
