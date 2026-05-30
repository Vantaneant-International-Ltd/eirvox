# ÉIRVOX — Handoff

Context for anyone (human or AI) picking up this project. Read before changing code or the database.

## What ÉIRVOX is

Curated Irish marketplace for premium goods. Svelte 5 + Vite SPA, hash routing, Supabase backend, deploying to Vercel.

- Supabase project ref: `arokrumaxjiidsqfpiii`
- Branch: `renato`
- Contributors: Renato, Kevin
- The site is gated behind `COMING_SOON = true` in `src/lib/config.ts`, with a `#dev` bypass. It is not publicly exposed yet.

## Source of truth warning (read this first)

Right now the **live database is the source of truth, not the SQL files in `supabase/`.** The live DB was hardened directly (via Supabase MCP) in ways that are not yet captured in committed SQL. Until the reconciliation below is done:

- Do not rebuild the database from the repo's SQL files. It would silently drop security fixes.
- Do not re-run destructive RLS-reset scripts without first confirming they preserve the trigger named below.

## Database security status (done and verified, do not redo)

Four hardening changes are applied to the live DB and were each verified against live attack tests. Confirmed still intact at last check.

1. **Privilege escalation fix.** A `BEFORE UPDATE` trigger `protect_profile_privileged_columns` on `public.profiles` resets `role`, `suspended`, `suspended_at`, `suspension_reason` to their old values for non-admin callers. This is the ONLY thing stopping any signed-in user from running `update profiles set role='admin'` on their own row. The RLS UPDATE policy itself is permissive (`WITH CHECK (auth.uid() = id)`), by design; the trigger is the guard.
2. **`admin_stats()`** guarded with `is_admin()`, `EXECUTE` revoked from `anon` and `public`.
3. **`admin_activity_recent`** recreated `WITH (security_invoker = on)`, revoked from `anon`. (Was a SECURITY DEFINER view leaking all listings/sellers/reservations/tradespeople to anonymous users.)
4. Indexes added on `listings(status, category_id, seller_id)`, `reservations(buyer_id, seller_id)`, `messages(conversation_id)`; redundant duplicate policies on `categories` and `site_settings` dropped; internal trigger functions revoked from `public`.

## Critical drift to fix first

`supabase/fix-profiles-trigger.sql` recreates the profiles UPDATE policy with a comment claiming it blocks role changes. **It does not.** The real protection is the trigger in item 1 above, which is NOT in any committed SQL file.

Reconciliation tasks (do before other feature work):
- Add a committed migration under `supabase/` containing: the `protect_profile_privileged_columns` function + trigger, the `admin_stats` guard, and the `admin_activity_recent` security_invoker fix. Goal: repo becomes a faithful record of the hardened live DB.
- Fix or remove the misleading comment in `fix-profiles-trigger.sql`.

## Known frontend bugs

All three previously-listed bugs in this section are fixed:

- ~~`flowType: 'pkce'` missing on the Supabase client~~ — fixed in commit `925c77c` (`src/lib/supabase.ts:47`).
- ~~Hardcoded anon URL/key in `src/lib/supabase.ts`~~ — fixed in commit `8ed8e29`. Both now load from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. See `.env.example`. The server-only `SUPABASE_SERVICE_ROLE_KEY` lives in `.env` (no `VITE_` prefix) and is consumed only by `api/_lib/supabase-admin.ts` — never imported from `src/`.
- ~~`UserRole` omits `tradesperson`~~ — fixed in commit `925c77c`.

Open issues (from audit, severity-tagged):

- **MED · blocker before public ship.** No rate limiting on `api/seller-applications.ts` or `api/enquiries.ts`. Add Upstash KV per-IP throttle (or Cloudflare Turnstile) before `COMING_SOON = false`.
- **MED.** PKCE auth `?code=…` lands at `/#/login` and outbound link clicks on that page leak the code in `Referer`. Mitigate with `exchangeCodeForSession` + `history.replaceState` to scrub the URL on Login mount, or a `<meta name="referrer">` header in `index.html`.
- **LOW.** Unsalted SHA-256 IP hash in `api/seller-applications.ts` and `api/enquiries.ts`. IPv4 space is trivially reversible. Add an `IP_HASH_PEPPER` env var.
- **LOW.** `{@html item}` in `src/routes/Trust.svelte:154` is safe today (hardcoded literal array) but is XSS-prone if data ever becomes dynamic.

Architecture follow-ups (not bugs but tracked):

- Many browser-side direct Supabase writes still exist in `src/lib/api.ts`, `src/lib/listings.ts`, `src/lib/sellers.ts`, and most of `src/lib/admin.ts`. The locked rule is "no browser-to-Supabase writes for public-facing or admin paths"; v1 grandfathers the admin ones since `is_admin()` RLS + the `protect_profile_privileged_columns` trigger defend them at the DB layer. Move to `/api/*` whenever each surface gets touched.

## Locked architecture decisions

- **Auth:** Supabase magic link, PKCE flow. Public signups stay enabled. Login not surfaced prominently. Browsing, enquiries, and seller applications stay anonymous. Auth is primarily an admin door today; buyer/seller features come later.
- **Public writes** (enquiries, seller applications, waitlist): go through Vercel serverless API routes using the service-role key. No browser-to-Supabase anon inserts. Turnstile is an env-gated future add-on, not built now.
- **Seller applications** write to a dedicated `seller_applications` table, NOT directly into `sellers` (which should only get rows on approval).
- **Reservations** are out of v1. Replace reservation CTAs with "Express Interest" wired into the enquiry path. Do not wire or expand reservations.
- **Marketplace model:** v1 is admin-curated. Admin creates listings and uploads images. Seller self-serve comes later.
- **Storage:** keep public-read-by-URL buckets, disable LIST on them. A private `seller-verification-documents` bucket is future (KYC), not this phase. Listing image canonical column is `storage_path`; derive the public URL at read time.
- **Role enum:** leave untouched this phase. No enum migrations. `profiles.role` means platform access; seller status is derived from `sellers.status`, never from `role='seller'`.
- **Audit logging** required before admin CRUD is "done": minimal append-only `audit_log` (id, actor_id, action, entity_type, entity_id, metadata jsonb, created_at), ideally written by triggers on `listings` and `sellers`.
- **Deployment:** keep Vite `outDir: 'docs'`; set Vercel output directory to `docs`. Do not remove `docs/` or `CNAME` until a Vercel deploy is verified.

## Phase plan (re-baseline against current repo first)

The original C1–C11 plan was written against an older repo and is likely half-done or done differently. Before continuing:

1. Inspect what is actually wired to Supabase vs still faked: auth (`src/lib/auth.ts`), listings reads (`src/lib/listings.ts`), admin gate (`src/routes/Admin.svelte`, `src/routes/admin/*`), public write paths.
2. Do the schema reconciliation above.
3. Then produce a corrected, short commit-by-commit plan and get approval before coding.

Remaining intended scope: real auth (PKCE), listings from DB, kill demo-data dependency, server-route write paths + `enquiries` and `seller_applications` tables, remove reservations, admin gate via real `is_admin()`, audit log, admin listings CRUD + image pipeline, seed 1 approved seller + 3+ real listings with images, deployment readiness + storage LIST and search_path hardening.

## Separate phase, do not skip before public launch

**Trust & Compliance Pass** (launch blocker, not part of the data cutover): remove fabricated seller ratings and sales counts, reframe present-tense overclaims (Dublin authentication centre, phone+ID verification, insured shipping, held deposits), finalize Privacy / Terms / Seller Terms / Refund pages, fix the meta description. Wiring real data does NOT make the site launch-ready.

## Working notes

- Verify, do not assume. The repo and live DB have drifted before; check both.
- Hand off frontend changes as small scoped commits, not whole-tree zips (a whole-tree zip against this live shared branch already caused a bad rebase once).
- Supabase advisor (`get_advisors`) is useful but does NOT catch logic flaws like the role-escalation policy. Manual review still required.
