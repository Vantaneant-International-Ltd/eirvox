-- ============================================================
-- ÉIRVOX · seller_applications table
-- ============================================================
--
-- Why: applications and approved sellers are two different concepts.
-- Today applyAsSeller() in src/lib/sellers.ts inserts directly into
-- public.sellers with status='pending' — meaning the sellers table
-- mixes "people who applied" with "people we cleared". That makes
-- approval audit harder and pollutes seller-shaped queries.
--
-- This file separates them:
--   seller_applications  pending review, anyone can submit (via API)
--   sellers              only created on approval, never directly
--
-- Idempotent: safe to re-run.
--
-- Apply order
--   1. This file (creates table + RLS).
--   2. Later commit will rewire applyAsSeller() to POST through
--      /api/seller-applications using the service-role key.
--   3. After that route is live, follow-up SQL can drop any
--      "Anyone can apply" / direct anon INSERT path on sellers.
-- ============================================================


-- =============================================================
-- §1  Status enum for applications
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seller_application_status') THEN
    CREATE TYPE public.seller_application_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'withdrawn'
    );
  END IF;
END $$;


-- =============================================================
-- §2  Table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.seller_applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (nullable so anonymous applications work)
  profile_id           uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  trading_name         text NOT NULL,
  handle               text,
  email                text NOT NULL,
  phone                text NOT NULL,

  -- Business detail (mirrors fields in SellerApplyInput)
  city                 text,
  trading_since        integer,
  primary_category     text NOT NULL,
  what_they_sell       text NOT NULL,
  inventory_count      text,
  price_low            integer,
  price_high           integer,
  sourcing_method      text,
  tier                 public.seller_tier NOT NULL DEFAULT 'verified',

  -- Workflow
  status               public.seller_application_status NOT NULL DEFAULT 'pending',
  rejection_reason     text,
  reviewed_by          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at          timestamptz,
  approved_seller_id   uuid REFERENCES public.sellers(id) ON DELETE SET NULL,

  -- Spam-triage metadata; only the API route should populate these
  user_agent           text,
  ip_hash              text,

  -- Internal notes (admin only)
  notes                text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.seller_applications IS
  'Pending seller applications. Approval promotes a row into public.sellers via approve_seller_application().';


-- =============================================================
-- §3  Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_seller_apps_status_created
  ON public.seller_applications (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_seller_apps_email
  ON public.seller_applications (lower(email));

CREATE INDEX IF NOT EXISTS idx_seller_apps_profile_id
  ON public.seller_applications (profile_id)
  WHERE profile_id IS NOT NULL;


-- =============================================================
-- §4  updated_at touch trigger (reuses existing helper if present)
-- =============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'touch_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS touch_seller_applications ON public.seller_applications';
    EXECUTE 'CREATE TRIGGER touch_seller_applications
               BEFORE UPDATE ON public.seller_applications
               FOR EACH ROW
               EXECUTE FUNCTION public.touch_updated_at()';
  END IF;
END $$;


-- =============================================================
-- §5  Row Level Security
-- =============================================================

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Reset any prior copies of our policies so re-runs are clean.
DROP POLICY IF EXISTS "seller_applications_admin_all"     ON public.seller_applications;
DROP POLICY IF EXISTS "seller_applications_owner_select"  ON public.seller_applications;
DROP POLICY IF EXISTS "seller_applications_owner_update"  ON public.seller_applications;

-- Admins: full access (read + write).
CREATE POLICY "seller_applications_admin_all"
  ON public.seller_applications
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Owners can read their own applications. Anonymous applications
-- (profile_id IS NULL) are visible only to admins.
CREATE POLICY "seller_applications_owner_select"
  ON public.seller_applications
  FOR SELECT
  TO authenticated
  USING (profile_id IS NOT NULL AND profile_id = auth.uid());

-- Owners can withdraw their own pending application (no other field changes).
-- The WITH CHECK clamps the new row to the same id and forbids privileged
-- workflow column changes; the BEFORE UPDATE trigger in §6 enforces it.
CREATE POLICY "seller_applications_owner_update"
  ON public.seller_applications
  FOR UPDATE
  TO authenticated
  USING  (profile_id IS NOT NULL AND profile_id = auth.uid() AND status = 'pending')
  WITH CHECK (profile_id IS NOT NULL AND profile_id = auth.uid());

-- NOTE: no INSERT policy exists, so anon and authenticated browser clients
-- cannot write to this table directly. All inserts must come through the
-- /api/seller-applications route using the service-role key.


-- =============================================================
-- §6  Trigger: lock down workflow columns from owner updates
-- =============================================================
--
-- The owner UPDATE policy lets the applicant change SOMETHING on their
-- pending row (so they can withdraw — i.e. set status='withdrawn').
-- This trigger ensures they cannot also flip status='approved' on
-- themselves or rewrite reviewed_by / approved_seller_id / etc.
--
-- Same pattern as protect_profile_privileged_columns: silent rewrite
-- of forbidden fields back to OLD values for non-admin, non-service
-- callers, so legitimate withdraw works without erroring.

CREATE OR REPLACE FUNCTION public.protect_seller_application_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() OR current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Only allow owner to flip status to 'withdrawn'. Everything else stays.
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'withdrawn' THEN
    NEW.status := OLD.status;
  END IF;

  NEW.profile_id         := OLD.profile_id;
  NEW.rejection_reason   := OLD.rejection_reason;
  NEW.reviewed_by        := OLD.reviewed_by;
  NEW.reviewed_at        := OLD.reviewed_at;
  NEW.approved_seller_id := OLD.approved_seller_id;
  NEW.notes              := OLD.notes;
  NEW.ip_hash            := OLD.ip_hash;
  NEW.user_agent         := OLD.user_agent;
  NEW.tier               := OLD.tier;
  NEW.created_at         := OLD.created_at;

  RETURN NEW;
END;
$$;

GRANT ALL ON FUNCTION public.protect_seller_application_columns() TO anon;
GRANT ALL ON FUNCTION public.protect_seller_application_columns() TO authenticated;
GRANT ALL ON FUNCTION public.protect_seller_application_columns() TO service_role;

DROP TRIGGER IF EXISTS protect_seller_application_columns ON public.seller_applications;
CREATE TRIGGER protect_seller_application_columns
  BEFORE UPDATE ON public.seller_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_seller_application_columns();


-- =============================================================
-- §7  approve_seller_application(application_id) helper
-- =============================================================
--
-- Atomically: insert into sellers from the application's fields, set
-- the application to approved, link approved_seller_id.
-- SECURITY DEFINER so admins can invoke regardless of seller-table
-- RLS specifics, with the is_admin() guard inside.

CREATE OR REPLACE FUNCTION public.approve_seller_application(application_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app    public.seller_applications;
  new_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'approve_seller_application: not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO app FROM public.seller_applications WHERE id = application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'application % not found', application_id USING ERRCODE = 'P0002';
  END IF;
  IF app.status <> 'pending' THEN
    RAISE EXCEPTION 'application % is not pending (status=%)', application_id, app.status
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sellers (
    profile_id, trading_name, handle, email, phone, city,
    trading_since, primary_category, what_they_sell, inventory_count,
    price_low, price_high, sourcing_method, tier, status, approved_at, applied_at
  ) VALUES (
    app.profile_id, app.trading_name, app.handle, app.email, app.phone, app.city,
    app.trading_since, app.primary_category, app.what_they_sell, app.inventory_count,
    app.price_low, app.price_high, app.sourcing_method, app.tier,
    'approved', now(), app.created_at
  )
  RETURNING id INTO new_id;

  UPDATE public.seller_applications
     SET status             = 'approved',
         reviewed_by        = auth.uid(),
         reviewed_at        = now(),
         approved_seller_id = new_id
   WHERE id = application_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_seller_application(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_seller_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_seller_application(uuid) TO service_role;


-- =============================================================
-- Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ============================================================
-- Verification
-- ============================================================
--
-- 1. Table exists:
--    SELECT count(*) FROM public.seller_applications;
--
-- 2. Anon INSERT blocked (no policy):
--    POST /rest/v1/seller_applications  with anon key
--    -> 401 / 42501
--
-- 3. As an admin, call approve_seller_application(<uuid>):
--    SELECT public.approve_seller_application('...');
--    -> returns the new sellers.id and:
--       - public.seller_applications row updated to approved
--       - public.sellers row created with status='approved'
-- ============================================================
