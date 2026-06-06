-- ============================================================
-- v20 · Wheel-specialist repositioning: 2-axis variant system
--        + race-safe decrement + atomic order-completion +
--        + reservations variant columns + consignment stub
-- ============================================================
-- COMMITTED FOR REVIEWED EXTERNAL APPLY. NOT applied by the
-- assistant. Reason: race-safe decrement of consigned stock is
-- payment-critical and the HANDOFF §3 grant-trap has bitten the
-- project 4 times. Apply only after:
--   1. Reading the concurrency test plan at the bottom.
--   2. Confirming the chassis lists at the bottom match the
--      consignor's actual fitments.
--   3. Seeding the 21-cell stock matrix EXTERNALLY (the reviewer
--      has the real numbers; this file does NOT invent stock).
--   4. Running the concurrency test in staging BEFORE flipping
--      the listing to status='active'.
-- ============================================================
-- Model:
--   * Listings can carry a 2-D variant matrix: STYLE x FAMILY.
--   * 7 styles x 3 fitment families = 21 cells per listing.
--   * Each cell has its own stock_count and price_delta.
--   * Decrement is server-side, atomic, conditional on
--     stock_count > 0. Two simultaneous buyers of the last unit
--     of a (style, family) cell MUST NOT both succeed.
-- ============================================================

-- ── 1. Fitment families ─────────────────────────────────────
-- Internal family keys are NOT shown to buyers. Buyer-facing UI
-- maps a real chassis (e.g. "F30") to a family. Codes m3/m5/e9d
-- are storage-only.

CREATE TABLE IF NOT EXISTS public.fitment_families (
  key           text PRIMARY KEY,
  internal_name text NOT NULL,           -- assistant-facing only
  sort_order    int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.fitment_families (key, internal_name, sort_order) VALUES
  ('m3',  'M3 family (F-chassis 1/2/3/4 + X)',  1),
  ('m5',  'M5 family (F-chassis 5/6/7/8)',      2),
  ('e9d', 'E-chassis generation',               3)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.fitment_families ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fitment_families: read public"  ON public.fitment_families;
DROP POLICY IF EXISTS "fitment_families: admin write"  ON public.fitment_families;

CREATE POLICY "fitment_families: read public"
  ON public.fitment_families FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "fitment_families: admin write"
  ON public.fitment_families FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- HANDOFF §3 — grant block (mandatory)
REVOKE ALL ON public.fitment_families FROM anon;
REVOKE ALL ON public.fitment_families FROM authenticated;
GRANT  SELECT ON public.fitment_families TO anon, authenticated;


-- ── 2. Chassis -> family mapping ────────────────────────────
-- Buyer chooses a real chassis name (e.g. "3 Series (F30/F31)")
-- and the UI routes to the correct family. Stored as a
-- queryable table so the catalogue isn't trapped in client code.

CREATE TABLE IF NOT EXISTS public.fitment_chassis (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_key    text NOT NULL REFERENCES public.fitment_families(key) ON DELETE RESTRICT,
  series        text NOT NULL,         -- '3 Series', '5 Series', 'X3', etc.
  chassis_codes text NOT NULL,         -- 'F30/F31/F34/F35', 'E90/E91/E92/E93'
  years_label   text,                  -- '2012-2019'
  display_name  text NOT NULL,         -- buyer-facing: '3 Series (F30/F31/F34/F35) 2012-2019'
  sort_order    int  NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fitment_chassis_family
  ON public.fitment_chassis (family_key, sort_order);

ALTER TABLE public.fitment_chassis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fitment_chassis: read public" ON public.fitment_chassis;
DROP POLICY IF EXISTS "fitment_chassis: admin write" ON public.fitment_chassis;

CREATE POLICY "fitment_chassis: read public"
  ON public.fitment_chassis FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "fitment_chassis: admin write"
  ON public.fitment_chassis FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.fitment_chassis FROM anon;
REVOKE ALL ON public.fitment_chassis FROM authenticated;
GRANT  SELECT ON public.fitment_chassis TO anon, authenticated;

-- Chassis seed. This is the proposed list from the brief.
-- Reviewer: confirm with consignor before relying on it. Easy
-- to amend post-apply via admin UI / DML.

INSERT INTO public.fitment_chassis (family_key, series, chassis_codes, years_label, display_name, sort_order) VALUES
  -- M3 family (F-chassis 1/2/3/4 + X)
  ('m3', '1 Series', 'F20/F21/F52',          '2011-2019', '1 Series (F20/F21/F52) 2011-2019',          10),
  ('m3', '2 Series', 'F22/F23/F45/F46',      '2014-2021', '2 Series (F22/F23/F45/F46) 2014-2021',      11),
  ('m3', '3 Series', 'F30/F31/F34/F35',      '2012-2019', '3 Series (F30/F31/F34/F35) 2012-2019',      12),
  ('m3', '4 Series', 'F32/F33/F36',          '2013-2020', '4 Series (F32/F33/F36) 2013-2020',          13),
  ('m3', 'X1',       'F48',                  '2015-2022', 'X1 (F48) 2015-2022',                        14),
  ('m3', 'X2',       'F39',                  '2017-2022', 'X2 (F39) 2017-2022',                        15),
  ('m3', 'X3',       'F25',                  '2010-2017', 'X3 (F25) 2010-2017',                        16),
  ('m3', 'X4',       'F26',                  '2014-2018', 'X4 (F26) 2014-2018',                        17),
  ('m3', 'X5',       'F15',                  '2013-2018', 'X5 (F15) 2013-2018',                        18),
  ('m3', 'X6',       'F16',                  '2014-2019', 'X6 (F16) 2014-2019',                        19),

  -- M5 family (F-chassis 5/6/7/8)
  ('m5', '5 Series', 'F10/F11/F07 (GT)/F90', '2010-2023', '5 Series (F10/F11/F07/F90) 2010-2023',      20),
  ('m5', '6 Series', 'F06/F12/F13',          '2011-2018', '6 Series (F06/F12/F13) 2011-2018',          21),
  ('m5', '7 Series', 'F01/F02/F03',          '2008-2015', '7 Series (F01/F02/F03) 2008-2015',          22),
  ('m5', '8 Series', 'F91/F92/F93',          '2018-2023', '8 Series (F91/F92/F93) 2018-2023',          23),

  -- E-chassis generation
  ('e9d', '3 Series', 'E90/E91/E92/E93',     '2005-2013', '3 Series (E90/E91/E92/E93) 2005-2013',      30),
  ('e9d', 'X5',       'E70',                 '2006-2013', 'X5 (E70) 2006-2013',                        31),
  ('e9d', 'X6',       'E71/E72',             '2008-2014', 'X6 (E71/E72) 2008-2014',                    32),
  ('e9d', 'X5',       'E53',                 '1999-2006', 'X5 (E53) 1999-2006',                        33),
  ('e9d', 'Z4',       'E89/E84',             '2009-2016', 'Z4 (E89/E84) 2009-2016',                    34),
  ('e9d', '1 Series', 'E81/E82/E87/E88',     '2004-2013', '1 Series (E81/E82/E87/E88) 2004-2013',      35)
ON CONFLICT DO NOTHING;


-- ── 3. The variant matrix ───────────────────────────────────
-- One row per (listing, style, family) cell. The cell is the
-- atomic stock unit.

CREATE TABLE IF NOT EXISTS public.listing_variants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  style_key       text NOT NULL,                -- 'style_01' .. 'style_07' (internal)
  style_label     text NOT NULL,                -- buyer-facing, e.g. 'Style 437M'
  family_key      text NOT NULL REFERENCES public.fitment_families(key) ON DELETE RESTRICT,
  stock_count     int  NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  price_delta_eur int  NOT NULL DEFAULT 0,
  sort_order      int  NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, style_key, family_key)
);

CREATE INDEX IF NOT EXISTS idx_listing_variants_listing
  ON public.listing_variants (listing_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_listing_variants_family
  ON public.listing_variants (listing_id, family_key);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_listing_variants_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_listing_variants_touch ON public.listing_variants;
CREATE TRIGGER trg_listing_variants_touch
  BEFORE UPDATE ON public.listing_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_listing_variants_updated_at();

ALTER TABLE public.listing_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listing_variants: read public active" ON public.listing_variants;
DROP POLICY IF EXISTS "listing_variants: admin write"        ON public.listing_variants;

-- Public sees variants only for active listings. The listings
-- read-policy already gates by status; the join is the safety
-- net so a stale variant of a removed listing is invisible.
CREATE POLICY "listing_variants: read public active"
  ON public.listing_variants FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
       WHERE l.id = listing_variants.listing_id
         AND l.status IN ('active', 'reserved', 'sold')
    )
  );

CREATE POLICY "listing_variants: admin write"
  ON public.listing_variants FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- HANDOFF §3 — mandatory grant block.
REVOKE ALL ON public.listing_variants FROM anon;
REVOKE ALL ON public.listing_variants FROM authenticated;
GRANT  SELECT ON public.listing_variants TO anon, authenticated;
-- admin writes go through is_admin() RLS + authenticated UPDATE/INSERT,
-- so authenticated needs UPDATE/INSERT too. RLS gates the rows.
GRANT  INSERT, UPDATE, DELETE ON public.listing_variants TO authenticated;


-- ── 4. Race-safe atomic decrement ───────────────────────────
-- The payment-critical correctness requirement: two simultaneous
-- buyers of the last unit of a (style, family) cell must NOT both
-- succeed.
--
-- Mechanism: a single conditional UPDATE. PostgreSQL takes a row
-- lock for the duration of the UPDATE; the second concurrent caller
-- blocks until the first commits, then re-evaluates the WHERE clause
-- against the new value. When stock_count has fallen to 0 the
-- predicate fails, 0 rows are returned by UPDATE...RETURNING, and we
-- RAISE. No subselect-then-update pattern (which would race), no
-- application-level locking, no advisory locks needed.
--
-- Callable only by service_role (from inside the Revolut webhook
-- after a verified payment). Never by anon. Never by authenticated.

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(
  p_listing_id  uuid,
  p_style_key   text,
  p_family_key  text
) RETURNS TABLE (
  variant_id     uuid,
  remaining      int,
  style_label    text,
  family_key     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  UPDATE public.listing_variants
     SET stock_count = stock_count - 1,
         updated_at  = now()
   WHERE listing_id  = p_listing_id
     AND style_key   = p_style_key
     AND family_key  = p_family_key
     AND stock_count > 0
  RETURNING id, stock_count, style_label, family_key
       INTO r;

  IF r.id IS NULL THEN
    -- Either the cell does not exist or stock_count hit 0 between
    -- the buyer's price-resolve and webhook-confirm. Either way,
    -- the variant is unavailable.
    RAISE EXCEPTION 'variant_unavailable: listing % style % family %',
      p_listing_id, p_style_key, p_family_key
      USING ERRCODE = 'P0001';
  END IF;

  variant_id  := r.id;
  remaining   := r.stock_count;
  style_label := r.style_label;
  family_key  := r.family_key;
  RETURN NEXT;
END;
$$;

-- HANDOFF §3 — SECURITY DEFINER lockdown.
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text) TO service_role;


-- ── 4b. Reservations carry the variant identity for reconciliation ──
-- The €160-per-wheel consignor settlement is keyed on the exact
-- (style, family) cell paid for, so we persist the variant info on
-- the reservation row at create-order time. variant_decremented_at
-- is the idempotency marker: complete_order only decrements once
-- per reservation even if Revolut retries the webhook.

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS variant_id              uuid REFERENCES public.listing_variants(id),
  ADD COLUMN IF NOT EXISTS variant_style_key       text,
  ADD COLUMN IF NOT EXISTS variant_style_label     text,
  ADD COLUMN IF NOT EXISTS variant_family_key      text,
  ADD COLUMN IF NOT EXISTS variant_price_delta_eur int,
  ADD COLUMN IF NOT EXISTS variant_decremented_at  timestamptz;

CREATE INDEX IF NOT EXISTS idx_reservations_variant
  ON public.reservations (variant_id)
  WHERE variant_id IS NOT NULL;


-- ── 4c. record_order_created v2: variant-aware ──────────────
-- New signature accepts the (style, family) keys. The function
-- looks the variant up (only on the SAME listing — defence in
-- depth against client-supplied mismatches), persists keys +
-- labels + price_delta on the reservation. Stock is NOT decremented
-- here. Decrement is deferred to complete_order so reserving a
-- pending Revolut order does not lock stock from other buyers
-- before the buyer actually pays.

CREATE OR REPLACE FUNCTION public.record_order_created(
  p_revolut_order_id     text,
  p_listing_id           uuid,
  p_buyer_email          text,
  p_buyer_profile_id     uuid,
  p_amount_eur           integer,
  p_is_deposit           boolean,
  p_fulfilment           text,
  p_variant_style_key    text DEFAULT NULL,
  p_variant_family_key   text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_listing public.listings%ROWTYPE;
  v_variant public.listing_variants%ROWTYPE;
  v_id uuid;
  v_ref text;
BEGIN
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF v_listing IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;

  IF p_variant_style_key IS NOT NULL AND p_variant_family_key IS NOT NULL THEN
    SELECT * INTO v_variant
      FROM public.listing_variants
     WHERE listing_id = p_listing_id
       AND style_key  = p_variant_style_key
       AND family_key = p_variant_family_key;
    IF v_variant IS NULL THEN
      RAISE EXCEPTION 'Variant not found for listing % (% / %)',
        p_listing_id, p_variant_style_key, p_variant_family_key;
    END IF;
    IF v_variant.stock_count <= 0 THEN
      RAISE EXCEPTION 'Variant sold out: (% / %)',
        p_variant_style_key, p_variant_family_key
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_ref := 'EVX-' || to_char(now(), 'YY') || '-' || lpad(((random()*99999)::int)::text, 5, '0');

  INSERT INTO public.reservations (
    revolut_order_id, listing_id, seller_id, buyer_id, buyer_email,
    reference, status, is_deposit, item_price, deposit_amount, balance_amount,
    delivery_preference, reserved_at,
    variant_id, variant_style_key, variant_style_label,
    variant_family_key, variant_price_delta_eur
  ) VALUES (
    p_revolut_order_id, p_listing_id, v_listing.seller_id, p_buyer_profile_id, p_buyer_email,
    v_ref, 'pending_deposit', p_is_deposit,
    v_listing.price,
    CASE WHEN p_is_deposit THEN p_amount_eur ELSE 0 END,
    GREATEST(v_listing.price - p_amount_eur, 0),
    p_fulfilment, now(),
    v_variant.id, v_variant.style_key, v_variant.style_label,
    v_variant.family_key, COALESCE(v_variant.price_delta_eur, 0)
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_order_created(text, uuid, text, uuid, integer, boolean, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.record_order_created(text, uuid, text, uuid, integer, boolean, text, text, text)
  TO service_role;


-- ── 4d. complete_order v2: atomic decrement on first confirm ──
-- When a reservation transitions to deposit_paid / completed AND it
-- carries variant info AND variant_decremented_at is still NULL,
-- this function calls decrement_variant_stock inside the same
-- transaction. variant_decremented_at is stamped immediately so a
-- Revolut webhook retry sees already_processed and re-running this
-- function is a no-op for the stock count.
--
-- decrement_variant_stock RAISES on sold-out, which aborts the
-- whole transaction (no half-state). That's intentional: if the
-- last unit went between the buyer's checkout-create and webhook-
-- confirm, the safe behaviour is to surface that as a refundable
-- failure rather than oversell.

CREATE OR REPLACE FUNCTION public.complete_order(p_revolut_order_id text, p_revolut_state text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_res public.reservations%ROWTYPE;
  v_new_status reservation_status;
  v_seller public.sellers%ROWTYPE;
  v_listing public.listings%ROWTYPE;
  v_dec record;
BEGIN
  SELECT * INTO v_res FROM public.reservations WHERE revolut_order_id = p_revolut_order_id;
  IF v_res IS NULL THEN
    RAISE EXCEPTION 'Reservation not found for revolut_order_id %', p_revolut_order_id;
  END IF;
  IF v_res.status IN ('completed','deposit_paid','cancelled','refunded') THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true, 'status', v_res.status);
  END IF;

  CASE p_revolut_state
    WHEN 'COMPLETED', 'AUTHORISED' THEN
      v_new_status := CASE WHEN v_res.is_deposit
                           THEN 'deposit_paid'::reservation_status
                           ELSE 'completed'::reservation_status END;
    WHEN 'CANCELLED', 'FAILED' THEN
      v_new_status := 'cancelled'::reservation_status;
    ELSE RAISE EXCEPTION 'Unhandled Revolut state %', p_revolut_state;
  END CASE;

  UPDATE public.reservations
    SET status     = v_new_status,
        paid_at    = CASE WHEN v_new_status IN ('deposit_paid','completed') THEN now() ELSE paid_at END,
        updated_at = now()
    WHERE id = v_res.id;

  -- Atomic variant decrement on first successful confirm.
  IF v_new_status IN ('deposit_paid', 'completed')
     AND v_res.variant_id IS NOT NULL
     AND v_res.variant_decremented_at IS NULL THEN

    SELECT * INTO v_dec FROM public.decrement_variant_stock(
      v_res.listing_id,
      v_res.variant_style_key,
      v_res.variant_family_key
    );

    UPDATE public.reservations
       SET variant_decremented_at = now()
     WHERE id = v_res.id;
  END IF;

  IF v_new_status = 'deposit_paid' THEN
    UPDATE public.listings SET status = 'reserved'
      WHERE id = v_res.listing_id AND status = 'active';
  ELSIF v_new_status = 'completed' THEN
    UPDATE public.listings SET status = 'sold'
      WHERE id = v_res.listing_id AND status IN ('active','reserved');
  END IF;

  SELECT * INTO v_seller  FROM public.sellers  WHERE id = v_res.seller_id;
  SELECT * INTO v_listing FROM public.listings WHERE id = v_res.listing_id;
  RETURN jsonb_build_object(
    'ok', true, 'reservation_id', v_res.id, 'reference', v_res.reference,
    'status', v_new_status, 'is_deposit', v_res.is_deposit,
    'item_price', v_res.item_price, 'deposit_amount', v_res.deposit_amount,
    'balance_amount', v_res.balance_amount, 'buyer_email', v_res.buyer_email,
    'seller_email', v_seller.email, 'seller_name', v_seller.trading_name,
    'listing_id', v_listing.id, 'listing_title', v_listing.title, 'listing_slug', v_listing.slug,
    'delivery_preference', v_res.delivery_preference,
    'variant_id', v_res.variant_id,
    'variant_style_key', v_res.variant_style_key,
    'variant_style_label', v_res.variant_style_label,
    'variant_family_key', v_res.variant_family_key,
    'variant_price_delta_eur', COALESCE(v_res.variant_price_delta_eur, 0)
  );
END; $$;

REVOKE EXECUTE ON FUNCTION public.complete_order(text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.complete_order(text, text) TO service_role;


-- ── 5. Public price/stock probe (for buyer UI) ──────────────
-- Buyer-facing UI needs to know stock + resolved price for a
-- single (listing, style, family) cell without exposing INSERT/
-- UPDATE/DELETE. RLS on listing_variants already filters by
-- listing.status; this RPC packages the join.

CREATE OR REPLACE FUNCTION public.get_variant_availability(
  p_listing_id uuid,
  p_style_key  text,
  p_family_key text
) RETURNS TABLE (
  variant_id        uuid,
  style_key         text,
  style_label       text,
  family_key        text,
  stock_count       int,
  price_delta_eur   int
)
LANGUAGE sql
STABLE
SECURITY INVOKER         -- RLS applies (anon/authenticated)
SET search_path = public
AS $$
  SELECT v.id, v.style_key, v.style_label, v.family_key,
         v.stock_count, v.price_delta_eur
    FROM public.listing_variants v
    JOIN public.listings l ON l.id = v.listing_id
   WHERE v.listing_id = p_listing_id
     AND v.style_key  = p_style_key
     AND v.family_key = p_family_key
     AND l.status IN ('active', 'reserved', 'sold');
$$;

REVOKE EXECUTE ON FUNCTION public.get_variant_availability(uuid, text, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_variant_availability(uuid, text, text) TO anon, authenticated;


-- ── 6. Consignment listing row stub ─────────────────────────
-- Pricing: €399 base (genuine market reference), shown at €300.
-- is_house = TRUE   -> ÉIRVOX is the seller of record, route
--                      through ÉIRVOX checkout (Revolut Merchant).
-- is_drive = FALSE  -> NOT a DRIVE issue. The consignment line is
--                      visually distinct from DRIVE so DRIVE's
--                      premium story is not diluted.
-- status   = 'draft'-> Reviewer flips to 'active' AFTER the 21-cell
--                      matrix is seeded and the concurrency test
--                      passes.
-- Title/description are deliberately placeholder; final product
-- copy must come from the consignor, not invention.

-- The seller of record. Look up the ÉIRVOX house seller id at
-- apply time; do NOT hardcode in this file.
DO $$
DECLARE
  v_house_seller uuid;
  v_listing_id   uuid;
BEGIN
  SELECT id INTO v_house_seller
    FROM public.sellers
   WHERE is_house = true
   ORDER BY created_at ASC
   LIMIT 1;

  IF v_house_seller IS NULL THEN
    RAISE NOTICE 'v20: no house seller found, skipping listing stub. Create the house seller first, then re-run this DO block manually.';
    RETURN;
  END IF;

  INSERT INTO public.listings (
    seller_id, category_slug, title, subtitle, description,
    condition, price, original_price, currency,
    accepts_offers, shipping_available, collection_available, shipping_cost,
    city, status, is_drive, stock_state
  ) VALUES (
    v_house_seller,
    'automotive',
    -- PLACEHOLDER COPY. Replace before flipping to active.
    'BMW M Sport Carbon Steering Wheel',
    'Consignment line. Seven styles. Three fitment groups.',
    'PLACEHOLDER. Replace with consignor-approved copy before going live. Standard BMW M Sport carbon-trim steering wheel, no LED, configured by style and fitment. ÉIRVOX is seller of record. Settlement to consignor is reconciled per unit by exact variant.',
    'new',
    300,                -- sale price shown to buyer
    399,                -- "was" / market reference
    'EUR',
    false,              -- offers off on consignment
    true, true, NULL,   -- shipping + collection both supported
    'Dublin',
    'draft',            -- reviewer flips to 'active' after seeding + concurrency test
    false,              -- NOT a DRIVE issue
    'in_stock'
  ) RETURNING id INTO v_listing_id;

  RAISE NOTICE 'v20: consignment listing stub created with id %', v_listing_id;
  RAISE NOTICE 'v20: NEXT STEPS:';
  RAISE NOTICE '  1. Seed the 21 listing_variants rows (7 styles x 3 families) for listing_id=%', v_listing_id;
  RAISE NOTICE '  2. Run the concurrency test below in staging.';
  RAISE NOTICE '  3. UPDATE listings SET status=''active'' WHERE id=% only after both pass.', v_listing_id;
END $$;


-- ============================================================
-- POST-APPLY CHECKS (run these after applying the migration)
-- ============================================================
-- 1. Tables and grants:
--      \d+ public.listing_variants
--      \d+ public.fitment_families
--      \d+ public.fitment_chassis
--    Expect: anon = SELECT only; authenticated = SELECT,INSERT,
--    UPDATE,DELETE (RLS gates by is_admin()).
--
-- 2. RPC grants:
--      SELECT proname, proacl FROM pg_proc
--       WHERE proname IN ('decrement_variant_stock', 'get_variant_availability');
--    Expect: decrement_variant_stock -> service_role only.
--            get_variant_availability -> anon + authenticated.
--
-- 3. Chassis catalogue:
--      SELECT family_key, COUNT(*) FROM public.fitment_chassis
--      GROUP BY family_key ORDER BY family_key;
--    Expect: m3=10, m5=4, e9d=6 (adjust to consignor's actual
--    fitments before flipping the listing live).
--
-- ============================================================
-- CONCURRENCY TEST (MANDATORY before flipping listing to active)
-- ============================================================
-- Test 1 — bare decrement RPC (proves the row-lock semantics).
--
-- Set stock_count = 1 on a (listing, style, family) cell and run
-- two concurrent psql sessions:
--
--   Session A:  BEGIN;
--               SELECT * FROM public.decrement_variant_stock(
--                 '<listing-id>'::uuid, '<style>', '<family>');
--               -- DO NOT COMMIT YET. Wait for session B.
--
--   Session B:  BEGIN;
--               SELECT * FROM public.decrement_variant_stock(
--                 '<listing-id>'::uuid, '<style>', '<family>');
--               -- This call should BLOCK on the row lock.
--
--   Session A:  COMMIT;
--
--   Session B:  -- The UPDATE re-evaluates WHERE stock_count > 0.
--               -- stock_count is now 0. UPDATE returns 0 rows.
--               -- The function RAISES 'variant_unavailable'.
--               ROLLBACK;
--
--   Reset:      UPDATE public.listing_variants
--                  SET stock_count = 1
--                WHERE id = '<variant-id>';
--
-- If session B ALSO succeeds, the migration is broken. DO NOT
-- ship the listing live. Investigate the lock + the WHERE
-- predicate immediately.
--
-- Test 2 — end-to-end complete_order idempotency.
--
-- Create two pending reservations on the SAME cell (set stock=1):
--
--   SELECT public.record_order_created(
--     'TEST-ORDER-A', '<listing-id>', 'a@example.com', NULL,
--      300, false, 'collection', '<style>', '<family>');
--   SELECT public.record_order_created(
--     'TEST-ORDER-B', '<listing-id>', 'b@example.com', NULL,
--      300, false, 'collection', '<style>', '<family>');
--
-- Reservations succeed because record_order_created does NOT
-- decrement stock; the row lock is the decrement-time guard.
--
-- Now confirm both:
--
--   SELECT public.complete_order('TEST-ORDER-A', 'COMPLETED');
--     -> ok, decrements stock 1 -> 0, stamps variant_decremented_at
--   SELECT public.complete_order('TEST-ORDER-B', 'COMPLETED');
--     -> RAISES 'variant_unavailable' (P0001). Transaction aborts.
--     -> Reservation B stays at 'pending_deposit', no stock damage.
--
-- Retry order A's webhook (simulates Revolut retry):
--
--   SELECT public.complete_order('TEST-ORDER-A', 'COMPLETED');
--     -> {already_processed: true}. NO second decrement.
--
-- Reset:  DELETE FROM public.reservations
--          WHERE revolut_order_id LIKE 'TEST-ORDER-%';
--         UPDATE public.listing_variants
--            SET stock_count = 1 WHERE id = '<variant-id>';
--
-- If reservation B's complete_order succeeded, the atomic-decrement
-- check in complete_order is broken. DO NOT ship live.
-- ============================================================
