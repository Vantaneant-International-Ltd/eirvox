-- ============================================================
-- ÉIRVOX · enquiries table
-- ============================================================
--
-- Replaces the reservation flow ("Reserve for €49") with a unified
-- "Express Interest" enquiry. Same shape works for listings, DRIVE
-- issues, and TRADE profiles.
--
-- Like seller_applications, this table has NO public INSERT policy.
-- All inserts must come through /api/enquiries with the service-role
-- key. Admins can read everything; signed-in users can read their
-- own enquiries (when profile_id is set).
--
-- Idempotent: safe to re-run.
-- ============================================================


-- =============================================================
-- §1  Enums
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enquiry_subject_type') THEN
    CREATE TYPE public.enquiry_subject_type AS ENUM (
      'listing',
      'drive_issue',
      'tradesperson',
      'general'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enquiry_status') THEN
    CREATE TYPE public.enquiry_status AS ENUM (
      'new',
      'replied',
      'closed',
      'spam'
    );
  END IF;
END $$;


-- =============================================================
-- §2  Table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.enquiries (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What it's about
  subject_type       public.enquiry_subject_type NOT NULL,
  listing_id         uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  tradesperson_id    uuid REFERENCES public.tradespeople(id) ON DELETE SET NULL,
  drive_issue_slug   text,

  -- From the enquirer (anonymous-friendly — name+email+message required)
  profile_id         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name               text NOT NULL,
  email              text NOT NULL,
  phone              text,
  message            text NOT NULL,

  -- Workflow
  status             public.enquiry_status NOT NULL DEFAULT 'new',
  reviewed_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at        timestamptz,
  admin_notes        text,

  -- Spam triage (only the API route should populate these)
  user_agent         text,
  ip_hash            text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  -- Subject ref consistency: exactly one of the subject pointers is
  -- set when subject_type is specific; all three null when 'general'.
  CONSTRAINT enquiries_subject_ref_chk CHECK (
    (subject_type = 'listing'      AND listing_id IS NOT NULL AND tradesperson_id IS NULL AND drive_issue_slug IS NULL) OR
    (subject_type = 'tradesperson' AND tradesperson_id IS NOT NULL AND listing_id IS NULL AND drive_issue_slug IS NULL) OR
    (subject_type = 'drive_issue'  AND drive_issue_slug IS NOT NULL AND listing_id IS NULL AND tradesperson_id IS NULL) OR
    (subject_type = 'general'      AND listing_id IS NULL AND tradesperson_id IS NULL AND drive_issue_slug IS NULL)
  )
);

COMMENT ON TABLE public.enquiries IS
  'Public enquiries / Express Interest submissions. Service-role insert only.';


-- =============================================================
-- §3  Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_enquiries_status_created
  ON public.enquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enquiries_email
  ON public.enquiries (lower(email));

CREATE INDEX IF NOT EXISTS idx_enquiries_listing_id
  ON public.enquiries (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_tradesperson_id
  ON public.enquiries (tradesperson_id)
  WHERE tradesperson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enquiries_profile_id
  ON public.enquiries (profile_id)
  WHERE profile_id IS NOT NULL;


-- =============================================================
-- §4  updated_at touch trigger
-- =============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'touch_updated_at'
  ) THEN
    EXECUTE 'DROP TRIGGER IF EXISTS touch_enquiries ON public.enquiries';
    EXECUTE 'CREATE TRIGGER touch_enquiries
               BEFORE UPDATE ON public.enquiries
               FOR EACH ROW
               EXECUTE FUNCTION public.touch_updated_at()';
  END IF;
END $$;


-- =============================================================
-- §5  Row Level Security
-- =============================================================

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enquiries_admin_all"    ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_owner_select" ON public.enquiries;

-- Admins: full access.
CREATE POLICY "enquiries_admin_all"
  ON public.enquiries
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Owners can read their own enquiries. Anonymous enquiries (profile_id
-- IS NULL) are admin-only.
CREATE POLICY "enquiries_owner_select"
  ON public.enquiries
  FOR SELECT
  TO authenticated
  USING (profile_id IS NOT NULL AND profile_id = auth.uid());

-- NOTE: no INSERT or UPDATE policy. All writes come through
-- /api/enquiries with the service-role key. Admins use the admin_all
-- policy for triage updates (status, admin_notes, reviewed_*).


-- =============================================================
-- Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ============================================================
-- Verification
-- ============================================================
--
-- 1. Table exists, RLS on:
--    SELECT relrowsecurity FROM pg_class
--     WHERE oid = 'public.enquiries'::regclass;
--    -> t
--
-- 2. Anon INSERT blocked:
--    POST /rest/v1/enquiries  (with anon key)  -> 401/42501
--
-- 3. Subject_ref check fires:
--    INSERT INTO public.enquiries (subject_type, listing_id, name, email, message)
--      VALUES ('tradesperson', '00000000-0000-0000-0000-000000000000',
--              'Test', 't@e.ie', 'hi');
--    -> ERROR: violates check constraint "enquiries_subject_ref_chk"
-- ============================================================
