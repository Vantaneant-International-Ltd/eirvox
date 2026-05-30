-- ============================================================
-- ÉIRVOX · fix profiles trigger
-- ============================================================
--
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run multiple times.
--
-- This script:
--   1. Ensures the profiles table has the columns and defaults
--      the trigger and the app expect.
--   2. Recreates the auth.users → public.profiles trigger so that
--      sign-up no longer fails with "Database error saving new user".
--   3. Sets sensible Row Level Security policies so the trigger
--      (which runs as SECURITY DEFINER) can insert, and so each
--      signed-in user can read and update their own profile row.
-- ============================================================


-- 1.  Schema hygiene: make sure expected columns exist.
--     ALTER TABLE … IF NOT EXISTS is permissive — add or skip silently.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name  text,
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS phone      text,
  ADD COLUMN IF NOT EXISTS city       text,
  ADD COLUMN IF NOT EXISTS country    text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Make sure the `role` column defaults to 'buyer' so the trigger
-- can omit it without violating a NOT NULL constraint.
-- (We avoid touching the type — if it's an enum, that's preserved.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name   = 'profiles'
       AND column_name  = 'role'
  )
  THEN
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT ''buyer''';
  END IF;
END $$;


-- 2.  Drop any existing trigger / function so we can recreate cleanly.

DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();


-- 3.  Create a robust handle_new_user() function.
--     - Runs as SECURITY DEFINER so it bypasses RLS for the insert.
--     - Uses ON CONFLICT DO NOTHING so duplicate triggers don't 500.
--     - Wraps in an EXCEPTION block so a single bad row doesn't
--       block the entire auth.users insert (and therefore signup).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), ''),
    'buyer'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block auth: log the failure to Supabase logs and continue.
    RAISE WARNING
      'handle_new_user: could not create profile for % — %',
      NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;


-- 4.  Wire the trigger back up.

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 5.  Row Level Security: enable + sensible policies.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any prior copies of our policies so we can recreate them.
DROP POLICY IF EXISTS "Profiles: read own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insert own" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin read all" ON public.profiles;

-- A signed-in user can read their own profile row.
CREATE POLICY "Profiles: read own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- A signed-in user can update their own profile row.
--
-- WARNING: this policy only restricts WHICH ROW the caller can update.
-- It does NOT block them from changing privileged columns like `role`
-- or `suspended`. Column-level protection lives in the
-- protect_profile_privileged_columns BEFORE UPDATE trigger defined in
-- supabase/security-hardening.sql. Both must be applied together.
CREATE POLICY "Profiles: update own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- A signed-in user may insert their own profile row (used by the
-- client-side fallback upsert in src/lib/auth.ts).
CREATE POLICY "Profiles: insert own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles (used by the admin console).
CREATE POLICY "Profiles: admin read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.profiles p
       WHERE p.id = auth.uid()
         AND p.role = 'admin'
    )
  );

-- ============================================================
-- Done. Try signing up again.
-- If it still fails, check Logs → Postgres for the WARNING
-- raised by handle_new_user(); that line includes the real reason.
-- ============================================================
