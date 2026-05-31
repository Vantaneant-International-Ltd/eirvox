-- ============================================================
-- v08-reports.sql
--
-- Adds public.reports for the "Report this listing" trust /
-- moderation feature. Anonymous submissions: no login required;
-- inserts come exclusively through /api/report using the
-- service-role key. Admins triage via /admin/reports.
--
-- Scope today: listing reports only. DRIVE items are listings, so
-- listing_id covers them. No user / seller / tradesperson reports
-- in this migration; if needed later, add subject_type + a CHECK
-- constraint the way v05-enquiries.sql does.
--
-- Future widening to a staff / moderator role is a policy swap
-- (USING (public.is_admin()) -> USING (public.is_staff())) once
-- the role exists. No is_staff() alias today; that would hide the
-- future decision behind a function name. Each policy carries a
-- "-- FUTURE:" comment noting the swap point.
--
-- Idempotent: safe to re-run.
--
-- Apply: this file is committed for repo-as-record. Applying it is
-- coordinated externally; I do not apply schema changes myself.
-- ============================================================


-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- SELECT 1 FROM pg_type WHERE typname IN ('report_reason','report_status');
--   expect 0 rows (neither enum exists yet)
--
-- SELECT 1 FROM information_schema.tables
--  WHERE table_schema='public' AND table_name='reports';
--   expect 0 rows
--
-- SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--  WHERE n.nspname='public' AND p.proname IN ('is_admin','touch_updated_at');
--   expect 2 rows (both helpers from v04 must exist)


-- =============================================================
-- §1  Enums
-- =============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
    CREATE TYPE public.report_reason AS ENUM (
      'prohibited_illegal',
      'scam_fraud',
      'counterfeit',
      'miscategorised',
      'offensive',
      'unavailable',
      'other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE public.report_status AS ENUM (
      'new',
      'reviewing',
      'actioned',
      'dismissed'
    );
  END IF;
END $$;


-- =============================================================
-- §2  Table
-- =============================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What is being reported. ON DELETE SET NULL so deleting a
  -- listing does not erase the moderation record; the report is
  -- still useful as a record-of-action ("we removed it because…").
  listing_id         uuid REFERENCES public.listings(id) ON DELETE SET NULL,

  -- The report itself
  reason             public.report_reason NOT NULL,
  detail             text,
  reporter_email     text,

  -- Workflow
  status             public.report_status NOT NULL DEFAULT 'new',
  assigned_to        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_note    text,
  reviewed_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at        timestamptz,

  -- Abuse context (server-set by /api/report only)
  user_agent         text,
  ip_hash            text,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reports IS
  'Buyer-submitted reports against listings. Service-role insert only.';

COMMENT ON COLUMN public.reports.assigned_to IS
  'Profile assigned to triage this report. Today: another admin. Future: a moderator/worker once the staff role exists.';

COMMENT ON COLUMN public.reports.listing_id IS
  'Nullable so deleting the listing does not delete the moderation record. Inserts must supply a non-null value (enforced server-side, not via NOT NULL, to keep the historical record after deletion).';


-- =============================================================
-- §3  Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_listing_id
  ON public.reports (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_assigned_to
  ON public.reports (assigned_to)
  WHERE assigned_to IS NOT NULL;


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
    EXECUTE 'DROP TRIGGER IF EXISTS touch_reports ON public.reports';
    EXECUTE 'CREATE TRIGGER touch_reports
               BEFORE UPDATE ON public.reports
               FOR EACH ROW
               EXECUTE FUNCTION public.touch_updated_at()';
  END IF;
END $$;


-- =============================================================
-- §5  Row Level Security
-- =============================================================

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_admin_all" ON public.reports;

-- Admins: full access (read, update for triage).
-- FUTURE: when public.is_staff() exists (admin OR moderator), swap
-- the USING and WITH CHECK expressions to public.is_staff(). Policy
-- name can stay the same; the privilege set widens, the rebuild is
-- a single ALTER POLICY, no table touch.
CREATE POLICY "reports_admin_all"
  ON public.reports
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- NOTE: no INSERT policy for anon or authenticated. All writes come
-- through /api/report with the service-role key. Admins use the
-- admin_all policy above for triage updates (status, assigned_to,
-- resolution_note, reviewed_by, reviewed_at). No reporter_select
-- policy: reporter_email is optional and unverified, so we cannot
-- safely expose "your reports" to a signed-in user keyed on it.


-- =============================================================
-- §6  Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- 1. Table exists, RLS on:
--    SELECT relrowsecurity FROM pg_class
--     WHERE oid = 'public.reports'::regclass;
--    -> t
--
-- 2. Enums present with expected values:
--    SELECT enumlabel FROM pg_enum
--      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
--     WHERE typname = 'report_reason' ORDER BY enumsortorder;
--    -> prohibited_illegal, scam_fraud, counterfeit, miscategorised,
--       offensive, unavailable, other
--
--    SELECT enumlabel FROM pg_enum
--      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
--     WHERE typname = 'report_status' ORDER BY enumsortorder;
--    -> new, reviewing, actioned, dismissed
--
-- 3. Indexes present:
--    SELECT indexname FROM pg_indexes
--     WHERE tablename = 'reports' ORDER BY indexname;
--    -> idx_reports_assigned_to, idx_reports_listing_id,
--       idx_reports_status_created, reports_pkey
--
-- 4. Anon INSERT blocked:
--    POST /rest/v1/reports  (with anon key)  -> 401/42501
--
-- 5. Anon SELECT blocked:
--    GET /rest/v1/reports   (with anon key)  -> 401/42501
--
-- 6. touch_updated_at trigger attached:
--    SELECT tgname FROM pg_trigger
--     WHERE tgrelid = 'public.reports'::regclass AND NOT tgisinternal;
--    -> touch_reports
