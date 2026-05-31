-- ============================================================
-- v05-listings-payment-mode.sql
--
-- Adds per-listing payment configuration for ÉIRVOX-owned listings,
-- and the sellers.is_house flag that marks which seller row is ÉIRVOX
-- itself. Backs the "ÉIRVOX-owned PayButton" phase.
--
-- Scope (strict, matches phase brief):
--   - No reservations / soft-hold / quantity columns.
--   - No per-seller payment routing, no commission split.
--   - Only ÉIRVOX-owned listings (sellers.is_house = true) will ever
--     surface a Pay button on the client; the server-side create-order
--     route is the real security boundary and re-checks is_house.
--
-- Unit convention: ALL amount columns on public.listings are WHOLE
-- EUROS (integer). That matches the existing listings.price and
-- listings.shipping_cost convention used everywhere in src/ and api/
-- (see formatPrice() in src/lib/api.ts and admin DEFAULT_SETTINGS).
-- deposit_amount added below follows the same convention. An ADR for
-- the euros-vs-cents decision is tracked separately.
--
-- Apply: live DB is the source of truth (see HANDOFF.md). Do NOT
-- re-run blindly; review against current live schema first. This file
-- is committed for repo-as-record purposes; applying it is coordinated
-- separately.
-- ============================================================

BEGIN;

-- ── 1. sellers.is_house ─────────────────────────────────────
-- Explicit ownership / merchant-of-record flag. Distinct from
-- sellers.tier (which is a buyer-facing trust label: verified /
-- atelier / house). The live ÉIRVOX seller (VNTA) is tier='atelier',
-- so we cannot reuse tier='house' to mean ownership.

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS is_house boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.sellers.is_house IS
  'True only for the seller row representing ÉIRVOX itself (merchant of record). Gates PayButton render + create-order endpoint.';

-- Partial index for fast lookups of the house seller row.
CREATE INDEX IF NOT EXISTS idx_sellers_is_house
  ON public.sellers (id) WHERE is_house = true;

-- Flip the flag on the live VNTA seller row.
UPDATE public.sellers
   SET is_house = true
 WHERE id = 'e6b0992f-aa9b-4ef5-bb99-512386650fc2';

-- ── 2. listings.payment_mode ────────────────────────────────
-- Drives what the PayButton charges on an ÉIRVOX-owned listing.
-- Default 'full' so existing rows have a sane value; ignored for
-- non-house listings since the PayButton never renders for them.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'full';

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_payment_mode_check;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_payment_mode_check
  CHECK (payment_mode IN ('full', 'full_plus_shipping', 'deposit'));

COMMENT ON COLUMN public.listings.payment_mode IS
  'How the PayButton charges this listing: full (price), full_plus_shipping (price + shipping_cost), or deposit (deposit_amount, used when awaiting stock). Only meaningful when seller.is_house = true.';

-- ── 3. listings.deposit_amount ──────────────────────────────
-- Whole euros (integer), matching listings.price. NULL unless
-- payment_mode = 'deposit'. Must be strictly less than price — a
-- deposit equal to or above price defeats the purpose (use
-- payment_mode='full' instead).

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS deposit_amount integer;

COMMENT ON COLUMN public.listings.deposit_amount IS
  'Deposit charged when payment_mode = deposit. Whole euros (integer), same convention as listings.price. Must satisfy 0 < deposit_amount < price.';

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_deposit_amount_required;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_deposit_amount_required
  CHECK (
    (payment_mode = 'deposit'
      AND deposit_amount IS NOT NULL
      AND deposit_amount > 0
      AND deposit_amount < price)
    OR (payment_mode <> 'deposit')
  );

-- ── 4. full_plus_shipping requires shipping_cost ────────────
-- Reuses the existing listings.shipping_cost column (whole euros).

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_full_plus_shipping_requires_cost;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_full_plus_shipping_requires_cost
  CHECK (
    (payment_mode = 'full_plus_shipping' AND shipping_cost IS NOT NULL AND shipping_cost > 0)
    OR (payment_mode <> 'full_plus_shipping')
  );

COMMIT;

-- ── Smoke checks (run manually after apply, not part of the txn) ──
-- SELECT id, trading_name, is_house FROM public.sellers WHERE is_house = true;
--   expect exactly one row: VNTA (id e6b0992f-aa9b-4ef5-bb99-512386650fc2)
--
-- SELECT payment_mode, count(*) FROM public.listings GROUP BY 1;
--   expect all rows in 'full' on first apply
--
-- -- Constraints should reject these bad rows:
-- INSERT INTO public.listings (seller_id, title, price, payment_mode, deposit_amount)
-- VALUES ('e6b0992f-aa9b-4ef5-bb99-512386650fc2', 'test', 100, 'deposit', NULL);
--   expect: violates check constraint "listings_deposit_amount_required" (NULL)
--
-- INSERT INTO public.listings (seller_id, title, price, payment_mode, deposit_amount)
-- VALUES ('e6b0992f-aa9b-4ef5-bb99-512386650fc2', 'test', 149, 'deposit', 149);
--   expect: violates check constraint "listings_deposit_amount_required" (>= price)
--
-- INSERT INTO public.listings (seller_id, title, price, payment_mode, shipping_cost)
-- VALUES ('e6b0992f-aa9b-4ef5-bb99-512386650fc2', 'test', 100, 'full_plus_shipping', NULL);
--   expect: violates check constraint "listings_full_plus_shipping_requires_cost"
