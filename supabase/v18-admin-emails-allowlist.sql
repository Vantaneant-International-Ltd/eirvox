-- ============================================================
-- ÉIRVOX v18 — Admin email allow-list + auto-promote on signup
-- ============================================================
-- Borrowed from the vendr pattern. Replaces the "admin signs up then
-- I manually run UPDATE profiles SET role='admin'" loop with a
-- pre-populated allow-list. The handle_new_user trigger checks it
-- on every auth.users INSERT and assigns role='admin' if matched.
--
-- Future admins:
--   INSERT INTO public.admin_emails (email, note) VALUES ('them@x', 'role');
-- They go to /login, sign up, instantly admin. No further SQL needed.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.admin_emails (
  email      text PRIMARY KEY,
  added_at   timestamptz NOT NULL DEFAULT now(),
  added_by   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  note       text
);

ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_emails FROM anon, authenticated, public;
GRANT SELECT, INSERT, DELETE ON public.admin_emails TO authenticated;

DROP POLICY IF EXISTS admin_emails_admin_all ON public.admin_emails;
CREATE POLICY admin_emails_admin_all ON public.admin_emails
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

INSERT INTO public.admin_emails (email, note) VALUES
  ('renato@vnta.xyz', 'Founder'),
  ('kevin@vnta.xyz',  'Co-founder')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role text := 'buyer';
BEGIN
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = NEW.email) THEN
    v_role := 'admin';
  END IF;
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email,
          COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), ''),
          v_role::user_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user: could not create profile for % — %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

UPDATE public.profiles p
   SET role = 'admin'
  FROM public.admin_emails a
 WHERE p.email = a.email AND p.role <> 'admin';

COMMIT;
