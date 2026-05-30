# Supabase MCP Audit Prompt

Paste the section between the rules into a separate Claude session that has Supabase MCP connected. The output of that session goes back into this repo as `audit/supabase-mcp-findings.md` (or wherever you want).

---

You have Supabase MCP connected to project `arokrumaxjiidsqfpiii` (ÉIRVOX). This is the live production database for an Irish marketplace that is currently behind a coming-soon gate but is the real DB.

## What I need

A live-DB audit report covering the items below. For each finding, include the exact SQL or MCP call that found it so I can re-run later. Output as Markdown, no code execution against the DB beyond reads — never `DROP`, `DELETE`, `UPDATE`, or `INSERT` unless I ask explicitly. The repo already has a static dump at `audit/supabase_full_schema.sql` (148KB DDL); cross-reference against the dump when useful but the LIVE state is the source of truth.

## Repo context the other Claude wrote up

The repo at `/Users/renatogusani/eirvox` (branch `renato`) just landed 12 commits that include three new SQL files **not yet applied to live**:

- `supabase/v05-seller-applications.sql` — new table + enum + RLS + a `protect_seller_application_columns` trigger + `approve_seller_application(uuid)` SECURITY DEFINER helper
- `supabase/v05-enquiries.sql` — new table + 2 enums + RLS + CHECK constraint
- `supabase/v05-audit-log.sql` — new table + enum + RLS + triggers on `public.listings` and `public.sellers`

There's also a fourth, **conditionally**-applied file:

- `supabase/v05-waitlist-anon-revoke.sql` — drops the `Anyone can join waitlist` INSERT policy. **Do not apply yet** — it must wait until `/api/waitlist` is live in Vercel. Confirm the policy is still present so I know it hasn't been dropped prematurely.

## What to check

### 1. Hardening still intact (sanity check)

Confirm each of these is still as `supabase/security-hardening.sql` describes:
- Trigger `protect_profile_privileged_columns` on `public.profiles` exists and references `public.protect_profile_privileged_columns()`.
- `public.admin_stats()` is SECURITY DEFINER, has the `is_admin()` guard, `EXECUTE` is revoked from `PUBLIC` / `anon`, granted to `authenticated` and `service_role`.
- View `public.admin_activity_recent` has `reloptions` including `security_invoker=on`.
- Indexes exist: `idx_listings_status`, `idx_listings_category_id`, `idx_listings_seller_id`, `idx_reservations_buyer`, `idx_reservations_seller`, `idx_messages_conversation` (the last only if `messages` exists).
- Functions revoked from PUBLIC: `admin_stats`, `handle_new_user`, `rls_auto_enable`, `update_category_count`, `update_trade_category_count`.

Report any drift loudly.

### 2. Attack-surface re-test

Run these as a non-admin authenticated user (you may need to mint a JWT for a test user, or describe the SQL the test would issue; do not actually escalate yourself):
- Confirm `update profiles set role = 'admin' where id = auth.uid()` does NOT change the role on the row (the trigger should silently reset it).
- Confirm `select public.admin_stats()` from a non-admin role returns SQLSTATE 42501 ("admin_stats: not authorized").
- Confirm anon SELECT on `public.admin_activity_recent` returns 0 rows / RLS denial.
- Confirm anon INSERT on `public.waitlist` still works (the `Anyone can join waitlist` policy should still be present per the staging plan).
- Confirm anon INSERT on `public.sellers` is blocked (it should be, since the apply path is now via the `/api/seller-applications` route which doesn't exist yet on the live DB but the table policies should already deny anon).
- Confirm anon INSERT on `public.reservations` is blocked (reservations are out of v1; new flow is enquiries).

### 3. Storage buckets

For each public bucket (likely `listing-images` and `seller-logos`):
- Is LIST enabled? HANDOFF says LIST should be disabled on public-read buckets. Report which buckets allow LIST.
- Are there bucket-level policies that grant write to `anon`? They shouldn't. Writes should be `authenticated` + the right ownership check, or service-role only.
- Is there a `seller-verification-documents` bucket? It should NOT exist yet (KYC is future).

### 4. Advisor warnings

Run `get_advisors()` and report every finding. We know it does not catch logic flaws, but anything it surfaces about `search_path`, security definer functions without `SET search_path`, or missing RLS deserves a look.

### 5. Drifted policies / unexpected grants

- Diff the policies on `public.categories` and `public.site_settings` against `audit/supabase_full_schema.sql` lines 3580–3600 in the repo. The legacy `Admin full access categories` policy uses an inline `EXISTS (SELECT FROM profiles WHERE role='admin')` instead of `is_admin()`. Confirm it's still there (it's a style inconsistency, not a security hole, but document it).
- List every function in `public` schema where `proacl` includes `anon=` (i.e. `EXECUTE` is granted to anon). For each, judge whether the function is genuinely safe for anon callers.
- List every table with RLS disabled (`relrowsecurity = false`) in the `public` schema. Any table without RLS is fully readable/writable by anyone with the anon key.

### 6. Data sanity (small)

- Row counts for `public.profiles`, `public.sellers`, `public.listings`, `public.waitlist`, `public.reservations`. Just numbers, no PII.
- For `public.sellers`: how many have `status='pending'` vs `'approved'`? (Helps us know whether the `seller_applications` migration needs a data backfill from existing pending sellers.)
- For `public.reservations`: row count. If non-zero, we keep the admin view alive; if zero, we can probably drop the table in a follow-up.

### 7. Pre-flight for the new SQL files

For each of the four pending SQL files in `supabase/`:
- `v05-seller-applications.sql` — does the `public.seller_application_status` enum exist already (it shouldn't)? Does a `public.seller_applications` table already exist? Are the FK targets (`profiles`, `sellers`) present?
- `v05-enquiries.sql` — same shape of pre-flight: enums absent, table absent, FK targets (`profiles`, `listings`, `tradespeople`) present.
- `v05-audit-log.sql` — `audit_action` enum absent, `audit_log` table absent, `public.listings` and `public.sellers` present.
- `v05-waitlist-anon-revoke.sql` — `Anyone can join waitlist` policy still present.

If any of those preconditions fail, flag loudly so I don't apply a broken migration.

## Output format

```
# ÉIRVOX live-DB audit YYYY-MM-DD

## §1 Hardening intact / drift
[findings]

## §2 Attack-surface re-test
[findings]

## §3 Storage buckets
[findings]

## §4 Advisor warnings
[findings]

## §5 Drifted policies / unexpected grants
[findings]

## §6 Data sanity
[findings, just counts]

## §7 Pre-flight for pending SQL files
[per-file: ready / not ready, with reasons]

## Recommended actions (ordered)
1. ...
```

## What not to do

- Never run `DROP`, `DELETE`, `UPDATE`, `INSERT`, `TRUNCATE`, `ALTER`, `CREATE`, `GRANT`, `REVOKE` against live unless I explicitly say so in a follow-up.
- Never query a way that returns PII (full emails, names) for more than a handful of rows. Counts are fine. Sample rows OK if needed but cap at 3 and redact emails to `<first-char>***@<domain>`.
- Don't run `vacuum`, `reindex`, or anything maintenance-y.
- If a check requires a SECURITY DEFINER function call you're not sure about, write the SQL but don't execute it; include it in the report for me to run.

Reply with the report. Take your time.
