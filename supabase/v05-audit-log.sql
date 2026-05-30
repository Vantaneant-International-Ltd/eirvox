-- ============================================================
-- ÉIRVOX · audit_log
-- ============================================================
--
-- Minimal append-only log of admin-mutating activity. Required by
-- HANDOFF before admin CRUD is "done". Captures:
--   - who did it (actor_id, from auth.uid())
--   - what they did (INSERT / UPDATE / DELETE)
--   - which entity (entity_type + entity_id)
--   - a minimal jsonb diff (old and new values for the columns we
--     actually care about — not the entire row, to keep storage cheap)
--
-- Triggers wire it to public.listings and public.sellers. Adding more
-- entity types later is one CREATE TRIGGER per table.
--
-- Idempotent: safe to re-run.
-- ============================================================


-- =============================================================
-- §1  audit_action enum
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
    CREATE TYPE public.audit_action AS ENUM ('insert', 'update', 'delete');
  END IF;
END $$;


-- =============================================================
-- §2  Table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action       public.audit_action NOT NULL,
  entity_type  text NOT NULL,
  entity_id    text NOT NULL,
  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_log IS
  'Append-only audit trail of admin-mutating activity. Never UPDATE or DELETE rows.';


-- =============================================================
-- §3  Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON public.audit_log (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON public.audit_log (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_created
  ON public.audit_log (created_at DESC);


-- =============================================================
-- §4  RLS — admin read only; no client INSERT (triggers do it)
-- =============================================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_read" ON public.audit_log;

CREATE POLICY "audit_log_admin_read"
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- No INSERT/UPDATE/DELETE policies. Writes happen through the
-- SECURITY DEFINER trigger function below. Append-only by design:
-- there is no way for any client to mutate or remove a log row.


-- =============================================================
-- §5  Trigger function: record a row
-- =============================================================
--
-- SECURITY DEFINER so it can INSERT into audit_log regardless of
-- the calling user's privileges. Uses auth.uid() to capture the
-- caller; will be NULL for service_role and direct postgres calls.
--
-- Per-table column selection happens in the per-table wrapper
-- triggers (§6) to keep this generic.

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action      public.audit_action,
  p_entity_type text,
  p_entity_id   text,
  p_metadata    jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(public.audit_action, text, text, jsonb) FROM PUBLIC;
GRANT  ALL ON FUNCTION public.log_audit_event(public.audit_action, text, text, jsonb) TO service_role;


-- =============================================================
-- §6  Per-table trigger functions
-- =============================================================
--
-- Each table picks the columns it cares about. Keep these narrow —
-- the log is for "what changed about this entity", not a full row dump.

CREATE OR REPLACE FUNCTION public.audit_listings_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'insert',
      'listing',
      NEW.id::text,
      jsonb_build_object(
        'title', NEW.title,
        'status', NEW.status::text,
        'price', NEW.price,
        'seller_id', NEW.seller_id::text
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    changes := '{}'::jsonb;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      changes := changes || jsonb_build_object(
        'status', jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text)
      );
    END IF;
    IF NEW.price IS DISTINCT FROM OLD.price THEN
      changes := changes || jsonb_build_object(
        'price', jsonb_build_object('from', OLD.price, 'to', NEW.price)
      );
    END IF;
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      changes := changes || jsonb_build_object(
        'title', jsonb_build_object('from', OLD.title, 'to', NEW.title)
      );
    END IF;
    -- No-op updates (e.g. touching updated_at) don't generate a log row.
    IF changes <> '{}'::jsonb THEN
      PERFORM public.log_audit_event('update', 'listing', NEW.id::text, changes);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'delete',
      'listing',
      OLD.id::text,
      jsonb_build_object('title', OLD.title, 'status', OLD.status::text)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_sellers_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  changes jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_audit_event(
      'insert',
      'seller',
      NEW.id::text,
      jsonb_build_object(
        'trading_name', NEW.trading_name,
        'status', NEW.status::text,
        'tier', NEW.tier::text
      )
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    changes := '{}'::jsonb;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      changes := changes || jsonb_build_object(
        'status', jsonb_build_object('from', OLD.status::text, 'to', NEW.status::text)
      );
    END IF;
    IF NEW.tier IS DISTINCT FROM OLD.tier THEN
      changes := changes || jsonb_build_object(
        'tier', jsonb_build_object('from', OLD.tier::text, 'to', NEW.tier::text)
      );
    END IF;
    IF NEW.trading_name IS DISTINCT FROM OLD.trading_name THEN
      changes := changes || jsonb_build_object(
        'trading_name', jsonb_build_object('from', OLD.trading_name, 'to', NEW.trading_name)
      );
    END IF;
    IF changes <> '{}'::jsonb THEN
      PERFORM public.log_audit_event('update', 'seller', NEW.id::text, changes);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_audit_event(
      'delete',
      'seller',
      OLD.id::text,
      jsonb_build_object('trading_name', OLD.trading_name, 'status', OLD.status::text)
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_listings_change() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_sellers_change()  FROM PUBLIC;


-- =============================================================
-- §7  Wire the triggers
-- =============================================================

DROP TRIGGER IF EXISTS audit_listings_change ON public.listings;
CREATE TRIGGER audit_listings_change
  AFTER INSERT OR UPDATE OR DELETE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_listings_change();

DROP TRIGGER IF EXISTS audit_sellers_change ON public.sellers;
CREATE TRIGGER audit_sellers_change
  AFTER INSERT OR UPDATE OR DELETE ON public.sellers
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sellers_change();


-- =============================================================
-- Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ============================================================
-- Verification
-- ============================================================
--
-- 1. Tables present:
--    SELECT count(*) FROM public.audit_log;
--
-- 2. Trigger fires on a listing status change:
--    UPDATE public.listings SET status = 'pending_review'
--      WHERE id = '<some-uuid>';
--    SELECT * FROM public.audit_log
--     WHERE entity_type = 'listing' AND entity_id = '<some-uuid>'
--     ORDER BY created_at DESC LIMIT 1;
--    -> action='update', metadata->'status'->>'from' and 'to' set
--
-- 3. Non-admin SELECT on audit_log is blocked:
--    SET ROLE authenticated;   -- via a non-admin JWT in a real test
--    SELECT * FROM public.audit_log LIMIT 1;
--    -> 0 rows (RLS denial, no error)
--
-- 4. No client can write:
--    INSERT INTO public.audit_log (...) -> RLS denial.
-- ============================================================
