-- ============================================================
-- ÉIRVOX · Security hardening reconciliation
-- ============================================================
-- Purpose
--   The live Supabase database (project ref arokrumaxjiidsqfpiii)
--   was hardened in a prior session via changes that were never
--   committed to this repo. As a result, applying the older
--   committed SQL on a fresh database would silently reopen a
--   privilege-escalation hole (any signed-in user could set
--   role = 'admin' on their own profile via PATCH /profiles).
--
--   This file makes the repo a faithful mirror of the hardened
--   live state. Verified against audit/supabase_full_schema.sql
--   (dumped 2026-05-30 via `supabase db dump`).
--
--   Idempotent: safe to re-run. Re-running on the already-
--   hardened live DB is a no-op.
--
-- What this file changes
--   §1  Adds public.protect_profile_privileged_columns trigger
--       on public.profiles. Resets role, suspended, suspended_at,
--       suspension_reason for non-admin callers. Primary defence
--       against the escalation.
--   §2  Re-creates public.admin_stats() with an is_admin() guard
--       and revokes EXECUTE from PUBLIC.
--   §3  Re-creates public.admin_activity_recent view WITH
--       (security_invoker = on).
--   §4  Adds the named indexes on listings/reservations/messages.
--   §5  Revokes from PUBLIC the internal trigger functions:
--       handle_new_user, rls_auto_enable, update_category_count,
--       update_trade_category_count.
--
-- What this file deliberately does NOT do
--   - Drop the legacy "Admin full access categories" policy on
--     public.categories. It uses an inline EXISTS check instead
--     of is_admin(), but it is currently in force on live and
--     functioning. Converting it to is_admin() belongs in a
--     separate, observable commit, not here.
--   - Touch the waitlist table. The "Anyone can join waitlist"
--     INSERT policy is in force on live and is what enables the
--     current browser-side signup. It will be dropped in the
--     commit that moves waitlist to a Vercel API route.
-- ============================================================


-- =============================================================
-- §1  protect_profile_privileged_columns trigger
-- =============================================================
--
-- Why this exists
--   The "Profiles: update own" policy in fix-profiles-trigger.sql
--   only restricts WHICH ROW the caller can update (auth.uid() = id).
--   It does NOT restrict WHICH COLUMNS they can change. Without
--   this trigger, a signed-in user can PATCH their own profile
--   with { "role": "admin" } and the RLS WITH CHECK clause
--   permits it (the row is still owned by them).
--
--   This BEFORE UPDATE trigger silently rewrites the privileged
--   columns back to OLD values for non-admin callers, blocking
--   the escalation without breaking legitimate updates to other
--   columns (full_name, phone, etc.).
--
-- Exemption logic
--   Uses current_user (the actual DB session role), NOT
--   auth.role() (the JWT claim). This matters because the trigger
--   can be invoked from contexts without a JWT (e.g. SQL Editor,
--   service-role API calls, direct psql), where auth.role() is
--   null. current_user is always populated and is the correct
--   thing to gate on.
--
--   The check `current_user not in ('authenticated', 'anon')`
--   exempts service_role, postgres, and any other DB role.
--   is_admin() exempts admin profiles arriving via authenticated
--   PostgREST requests.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- current_user is the real caller here (invoker): 'authenticated'/'anon' for
  -- API requests, 'service_role'/'postgres' for privileged/direct contexts.
  IF NOT (public.is_admin() OR current_user NOT IN ('authenticated', 'anon')) THEN
    NEW.role              := OLD.role;
    NEW.suspended         := OLD.suspended;
    NEW.suspended_at      := OLD.suspended_at;
    NEW.suspension_reason := OLD.suspension_reason;
  END IF;
  RETURN NEW;
END;
$$;

-- Function permissions: live grants ALL to anon/authenticated/service_role
-- (Supabase default). The trigger is invoked by the DB itself, not by client
-- calls; the grants don't expose any direct callable surface because the
-- function returns trigger and has no input params.
GRANT ALL ON FUNCTION public.protect_profile_privileged_columns() TO anon;
GRANT ALL ON FUNCTION public.protect_profile_privileged_columns() TO authenticated;
GRANT ALL ON FUNCTION public.protect_profile_privileged_columns() TO service_role;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();


-- =============================================================
-- §2  admin_stats() — guarded with is_admin(), public revoked
-- =============================================================
--
-- The committed version of admin_stats() in v04-admin-schema.sql
-- is SECURITY DEFINER and grants EXECUTE to authenticated without
-- an is_admin() guard. Any signed-in user can call it and read
-- pending counts they shouldn't see. The live version is guarded.
--
-- Spelling note: live uses "authorized" (American). Matched here
-- so the error message matches what the API actually returns.

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin_stats: not authorized' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'total_listings',     (SELECT count(*) FROM public.listings     WHERE status = 'active'),
    'total_sellers',      (SELECT count(*) FROM public.sellers      WHERE status = 'approved'),
    'total_reservations', (SELECT count(*) FROM public.reservations),
    'total_tradespeople', (SELECT count(*) FROM public.tradespeople WHERE status = 'approved'),
    'total_users',        (SELECT count(*) FROM public.profiles),
    'pending_listings',   (SELECT count(*) FROM public.listings     WHERE status = 'pending_review'),
    'pending_sellers',    (SELECT count(*) FROM public.sellers      WHERE status = 'pending'),
    'pending_trade',      (SELECT count(*) FROM public.tradespeople WHERE status = 'pending')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC;
GRANT ALL ON FUNCTION public.admin_stats() TO authenticated;
GRANT ALL ON FUNCTION public.admin_stats() TO service_role;

-- Defensive: Supabase default privileges auto-grant EXECUTE to anon
-- on new functions, which REVOKE FROM PUBLIC does not remove. The
-- live database doesn't have this grant (admin_stats predates the
-- audit), but a fresh database rebuilt from this file would unless
-- the REVOKE is explicit. The is_admin() guard inside the function
-- would still block real escalation, but we prefer defence in depth.
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon;


-- =============================================================
-- §3  admin_activity_recent view — security_invoker
-- =============================================================
--
-- The committed view in v04-admin-schema.sql is created without
-- WITH (security_invoker = on), which on PostgreSQL 15+ means it
-- runs as its owner (postgres), bypassing RLS on the underlying
-- tables. The live version inherits the caller's RLS context.

DROP VIEW IF EXISTS public.admin_activity_recent;
CREATE VIEW public.admin_activity_recent
  WITH (security_invoker = on)
  AS
   SELECT 'listing'::text AS kind,
          l.id            AS ref_id,
          l.title         AS label,
          (l.status)::text AS status,
          l.created_at    AS at
     FROM public.listings l
    WHERE ((l.status)::text <> 'removed'::text)
   UNION ALL
   SELECT 'seller'::text,
          s.id,
          s.trading_name,
          (s.status)::text,
          s.created_at
     FROM public.sellers s
   UNION ALL
   SELECT 'reservation'::text,
          r.id,
          COALESCE(r.reference, ('EVX-'::text || upper(substr(replace((r.id)::text, '-'::text, ''::text), 1, 8)))) AS label,
          (r.status)::text,
          r.reserved_at
     FROM public.reservations r
   UNION ALL
   SELECT 'tradesperson'::text,
          t.id,
          t.name,
          (t.status)::text,
          t.created_at
     FROM public.tradespeople t;

GRANT ALL ON TABLE public.admin_activity_recent TO authenticated;
GRANT ALL ON TABLE public.admin_activity_recent TO service_role;


-- =============================================================
-- §4  Indexes from the live hardening pass
-- =============================================================
--
-- Names match live exactly so `CREATE INDEX IF NOT EXISTS` is a
-- no-op on the hardened DB.

CREATE INDEX IF NOT EXISTS idx_listings_status
  ON public.listings (status);

CREATE INDEX IF NOT EXISTS idx_listings_category_id
  ON public.listings (category_id);

CREATE INDEX IF NOT EXISTS idx_listings_seller_id
  ON public.listings (seller_id);

CREATE INDEX IF NOT EXISTS idx_reservations_buyer
  ON public.reservations (buyer_id);

CREATE INDEX IF NOT EXISTS idx_reservations_seller
  ON public.reservations (seller_id);

-- The messages table may not exist in every environment.
-- Guard so this file applies cleanly either way.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name   = 'messages'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_conversation
               ON public.messages (conversation_id)';
  END IF;
END $$;


-- =============================================================
-- §5  Internal functions revoked from PUBLIC
-- =============================================================
--
-- Live ACL state for these four:
--   REVOKE ALL FROM PUBLIC; GRANT ALL TO service_role only.
-- None of these should be callable by anon or authenticated
-- clients; they're trigger functions or owner-only helpers.

-- handle_new_user(): trigger fired on auth.users INSERT.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT  ALL ON FUNCTION public.handle_new_user() TO service_role;

-- rls_auto_enable(): event trigger that auto-enables RLS on new tables.
-- Only present in environments where v04-rls-reset.sql created it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC';
    EXECUTE 'GRANT  ALL ON FUNCTION public.rls_auto_enable() TO service_role';
  END IF;
END $$;

-- update_category_count(): trigger on listings/categories.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'update_category_count'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_category_count() FROM PUBLIC';
    EXECUTE 'GRANT  ALL ON FUNCTION public.update_category_count() TO service_role';
  END IF;
END $$;

-- update_trade_category_count(): trigger on tradespeople/trade_categories.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'update_trade_category_count'
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.update_trade_category_count() FROM PUBLIC';
    EXECUTE 'GRANT  ALL ON FUNCTION public.update_trade_category_count() TO service_role';
  END IF;
END $$;


-- =============================================================
-- Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ============================================================
-- Verification (run manually after applying)
-- ============================================================
--
-- 1. Trigger present:
--    SELECT tgname, tgenabled FROM pg_trigger
--     WHERE tgrelid = 'public.profiles'::regclass
--       AND tgname = 'protect_profile_privileged_columns';
--
-- 2. Escalation attempt fails. As a non-admin user (signed in,
--    not in service_role), via PostgREST:
--      PATCH /rest/v1/profiles?id=eq.<your-uuid>
--      body: { "role": "admin" }
--    -> returns 200 with the row, but role is unchanged.
--
-- 3. admin_stats blocked for non-admin:
--    SELECT public.admin_stats();
--    -> ERROR: admin_stats: not authorized   (SQLSTATE 42501)
--
-- 4. View runs as invoker:
--    SELECT relname, reloptions FROM pg_class
--     WHERE relname = 'admin_activity_recent';
--    -> reloptions includes 'security_invoker=on'
--
-- 5. Indexes present:
--    SELECT indexname FROM pg_indexes
--     WHERE schemaname = 'public'
--       AND indexname LIKE 'idx_%'
--     ORDER BY indexname;
--
-- 6. Internal functions locked down:
--    SELECT proname, array_to_string(proacl, E'\n') AS acl
--      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--     WHERE n.nspname = 'public'
--       AND p.proname IN ('admin_stats','handle_new_user','rls_auto_enable',
--                         'update_category_count','update_trade_category_count');
--    -> no PUBLIC/anon/authenticated grants.
-- ============================================================
