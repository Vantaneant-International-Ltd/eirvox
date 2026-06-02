-- ============================================================
-- ÉIRVOX v15 — Seller trading-name change requests
-- ============================================================
-- Sellers can no longer self-edit `sellers.trading_name` (anti-
-- impersonation). They submit a request via this table; admin
-- reviews and approves/rejects. On approve, the SECURITY DEFINER
-- RPC updates sellers.trading_name atomically.
--
-- DB-level guard: trigger on public.sellers refuses any
-- trading_name UPDATE unless the calling role is admin OR the
-- change came from the approve_seller_name_change RPC (signalled
-- by a session-local GUC).
--
-- Grant hygiene per HANDOFF: REVOKE ALL FROM anon/authenticated
-- then GRANT minimum; SECURITY DEFINER functions REVOKE EXECUTE
-- FROM PUBLIC, anon then GRANT only to roles that need it.
-- ============================================================

BEGIN;

CREATE TYPE IF NOT EXISTS public.name_change_status AS ENUM ('pending','approved','rejected');

CREATE TABLE IF NOT EXISTS public.seller_name_change_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  requested_by    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_name    text NOT NULL,
  requested_name  text NOT NULL CHECK (char_length(requested_name) BETWEEN 2 AND 200),
  reason          text CHECK (reason IS NULL OR char_length(reason) <= 2000),
  status          public.name_change_status NOT NULL DEFAULT 'pending',
  reviewed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  admin_note      text CHECK (admin_note IS NULL OR char_length(admin_note) <= 2000),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sncr_seller  ON public.seller_name_change_requests(seller_id);
CREATE INDEX IF NOT EXISTS idx_sncr_status  ON public.seller_name_change_requests(status, created_at DESC);

-- One pending request per seller at a time (avoid noise queue).
CREATE UNIQUE INDEX IF NOT EXISTS uq_sncr_one_pending_per_seller
  ON public.seller_name_change_requests(seller_id)
  WHERE status = 'pending';

ALTER TABLE public.seller_name_change_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.seller_name_change_requests FROM anon, authenticated, public;
GRANT SELECT, INSERT ON public.seller_name_change_requests TO authenticated;

-- Sellers can read their own requests; admins can read all.
DROP POLICY IF EXISTS sncr_select ON public.seller_name_change_requests;
CREATE POLICY sncr_select ON public.seller_name_change_requests
  FOR SELECT TO authenticated
  USING (
    seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Sellers can only insert requests for their own seller row.
DROP POLICY IF EXISTS sncr_insert ON public.seller_name_change_requests;
CREATE POLICY sncr_insert ON public.seller_name_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND seller_id IN (SELECT id FROM public.sellers WHERE profile_id = auth.uid())
  );

-- ── DB-level trigger: forbid trading_name UPDATE by non-admin ──
-- Belt-and-braces. The SellerDashboard form is read-only AND omits
-- trading_name from the patch, but a malicious authenticated user
-- could still PATCH it via the JS client. This trigger refuses
-- unless one of:
--   1) caller's profile.role = 'admin'
--   2) session GUC eirvox.allow_name_change = 'on' (set by the
--      approve_seller_name_change RPC inside a transaction)

CREATE OR REPLACE FUNCTION public._sellers_lock_trading_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_allow text;
BEGIN
  IF NEW.trading_name IS NOT DISTINCT FROM OLD.trading_name THEN
    RETURN NEW;  -- unchanged, allow
  END IF;

  v_allow := current_setting('eirvox.allow_name_change', true);
  IF v_allow = 'on' THEN
    RETURN NEW;  -- approved via RPC
  END IF;

  IF v_caller IS NOT NULL THEN
    SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_caller;
  END IF;

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'trading_name changes require admin approval. Submit a request via seller_name_change_requests.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_sellers_lock_trading_name ON public.sellers;
CREATE TRIGGER trg_sellers_lock_trading_name
  BEFORE UPDATE OF trading_name ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public._sellers_lock_trading_name();

-- ── SECURITY DEFINER: submit_name_change_request ──────────────
-- Seller-side entry point. Resolves the seller_id from the caller's
-- profile_id so the request is always tied to the right row.

CREATE OR REPLACE FUNCTION public.submit_name_change_request(
  p_requested_name text,
  p_reason         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller   uuid := auth.uid();
  v_seller   record;
  v_request  uuid;
  v_trimmed  text := btrim(coalesce(p_requested_name, ''));
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF char_length(v_trimmed) < 2 THEN
    RAISE EXCEPTION 'Requested name must be at least 2 characters.';
  END IF;
  IF char_length(v_trimmed) > 200 THEN
    RAISE EXCEPTION 'Requested name is too long (200 char max).';
  END IF;

  SELECT id, trading_name INTO v_seller
    FROM public.sellers WHERE profile_id = v_caller LIMIT 1;
  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'You are not a seller.';
  END IF;

  IF v_seller.trading_name = v_trimmed THEN
    RAISE EXCEPTION 'Requested name is the same as your current name.';
  END IF;

  INSERT INTO public.seller_name_change_requests
    (seller_id, requested_by, current_name, requested_name, reason)
  VALUES (v_seller.id, v_caller, v_seller.trading_name, v_trimmed, p_reason)
  RETURNING id INTO v_request;

  RETURN v_request;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_name_change_request(text, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.submit_name_change_request(text, text) TO authenticated;

-- ── SECURITY DEFINER: approve_seller_name_change ──────────────
-- Admin-only. Updates sellers.trading_name inside the same txn
-- after setting the GUC that the lock trigger reads.

CREATE OR REPLACE FUNCTION public.approve_seller_name_change(
  p_request_id uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_req record;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_caller;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Admin only.'; END IF;

  SELECT * INTO v_req FROM public.seller_name_change_requests WHERE id = p_request_id;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found.'; END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is already %', v_req.status;
  END IF;

  PERFORM set_config('eirvox.allow_name_change', 'on', true);  -- txn-local
  UPDATE public.sellers SET trading_name = v_req.requested_name WHERE id = v_req.seller_id;
  PERFORM set_config('eirvox.allow_name_change', 'off', true);

  UPDATE public.seller_name_change_requests
    SET status = 'approved', reviewed_by = v_caller, reviewed_at = now(), admin_note = p_admin_note
    WHERE id = p_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_seller_name_change(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.approve_seller_name_change(uuid, text) TO authenticated;

-- ── SECURITY DEFINER: reject_seller_name_change ────────────────

CREATE OR REPLACE FUNCTION public.reject_seller_name_change(
  p_request_id uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_admin boolean := false;
  v_req record;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT (role = 'admin') INTO v_is_admin FROM public.profiles WHERE id = v_caller;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Admin only.'; END IF;

  SELECT * INTO v_req FROM public.seller_name_change_requests WHERE id = p_request_id;
  IF v_req IS NULL THEN RAISE EXCEPTION 'Request not found.'; END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is already %', v_req.status;
  END IF;

  UPDATE public.seller_name_change_requests
    SET status = 'rejected', reviewed_by = v_caller, reviewed_at = now(), admin_note = p_admin_note
    WHERE id = p_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_seller_name_change(uuid, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reject_seller_name_change(uuid, text) TO authenticated;

COMMIT;
