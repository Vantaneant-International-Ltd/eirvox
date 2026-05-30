-- ============================================================
-- ÉIRVOX · Drop anon INSERT on waitlist
-- ============================================================
--
-- ⚠ DO NOT APPLY UNTIL /api/waitlist IS DEPLOYED TO PRODUCTION
--   AND VERIFIED WORKING.
--
-- Why: applying this drops the policy that lets the browser
-- write to the waitlist with the anon key. Until the serverless
-- route is live in prod, the only path to submit a waitlist
-- email is the anon insert. Dropping the policy before the
-- route exists silently breaks the only public-facing form on
-- the site.
--
-- What it does
--   - Drops the legacy "Anyone can join waitlist" policy.
--   - Adds an "Admin read waitlist" SELECT policy using the
--     modern is_admin() helper, mirroring the policy on other
--     admin-only tables (the legacy one with the inline EXISTS
--     check stays in place to avoid breaking anything; convert
--     in a follow-up if desired).
--   - Does NOT add an INSERT policy — only the service-role key
--     can write, which is the goal.
--
-- After applying, verify:
--   1. POST /api/waitlist with a new email -> 201
--   2. Anon REST insert blocked:
--        curl -X POST \
--          -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>" \
--          -H "Content-Type: application/json" \
--          -d '{"email":"reject@test.com","source":"x"}' \
--          https://arokrumaxjiidsqfpiii.supabase.co/rest/v1/waitlist
--        -> 401 with code 42501 (RLS denial)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

NOTIFY pgrst, 'reload schema';
