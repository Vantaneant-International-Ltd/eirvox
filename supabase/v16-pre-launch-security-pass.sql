-- ============================================================
-- ÉIRVOX v16 — Pre-launch security pass
-- ============================================================
-- Surfaced by Supabase advisors during the final pre-launch audit.
-- Three categories:
--
-- 1. waitlist table — drop the legacy "Anyone can join" INSERT
--    policy (anon could bypass our Edge Function's IP-hash + rate-
--    limit + dedup by going direct via PostgREST) and lock down the
--    over-broad grants on the table itself. 6th recurrence of the
--    grant-hole pattern noted in HANDOFF migration rules.
--
-- 2. Trigger function `_sellers_lock_trading_name` was exposed
--    via PostgREST RPC. Calling a trigger function as an RPC is
--    meaningless (NEW/OLD are undefined) but advisors correctly
--    flag it as anon-callable SECURITY DEFINER surface area.
--    REVOKE EXECUTE so it only fires from the actual trigger path.
--
-- 3. Seven pre-existing utility functions had mutable search_path.
--    Pin to public + pg_temp so a session-level search_path
--    injection cannot redirect their calls into a malicious schema.
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

REVOKE ALL ON public.waitlist FROM anon, authenticated, public;
GRANT SELECT ON public.waitlist TO authenticated;  -- admin reads via "Admin read waitlist" RLS

REVOKE EXECUTE ON FUNCTION public._sellers_lock_trading_name() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.touch_updated_at()                  SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at()                 SET search_path = public, pg_temp;
ALTER FUNCTION public.update_category_count()             SET search_path = public, pg_temp;
ALTER FUNCTION public.update_trade_category_count()       SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_reservation_ref()          SET search_path = public, pg_temp;
ALTER FUNCTION public.listings_slugify(text, uuid)        SET search_path = public, pg_temp;
ALTER FUNCTION public.listings_set_slug()                 SET search_path = public, pg_temp;

COMMIT;
