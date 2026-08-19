# ÉIRVOX — Handoff

Context for anyone (human or AI) picking up this project. Read before changing code or the database.

## Companion documents (read in this order)

1. **This file** — architecture, database, security, open issues.
2. **`CLAUDE.md`** (repo root) — standing instructions for AI contributors. Auto-read by Claude Code.
3. **`brand/EMOTIONAL-BIBLE.md`** — the source of feeling. Trust + desire fused; object sacred; curator invisible but present. Read before any copy or content work. (Top-level `brand/`, not `docs/brand/` — `docs/` is the Vite build output and is wiped on every build.)
4. **`brand/DIRECTION-LOCKFILE.md`** — the design constitution. Read before touching ANY UI, route, style, or user-facing copy. Locked direction, banned phrases, world boundaries, per-surface rules, drift check.
5. **`brand/DESIGN-WORLDS.md`** — **SUPERSEDED 19 Aug 2026.** The two-world architecture is retired; the site is one light system. Kept as history, with a banner at the top. The commerce split it documents still holds: house products take Pay and Enquire only. **Do not re-darken a wheels, DRIVE or checkout surface. Light is correct there now.**

If this file and the lockfile conflict on a design/copy matter, the lockfile wins. If they conflict on database/architecture, this file wins.

## What ÉIRVOX is

**Launch posture (current): a Dublin carbon-steering-wheel specialist.** DRIVE limited-edition line + BMW fitted range, sold via direct Revolut payment (full or deposit). Controlled by `wheel_specialist_mode` in `public.site_settings.flags` — when on, the marketplace is locked behind `/marketplace`. The front page and nav are the same either way: Wheels · DRIVE · Fitment · Marketplace (`Soon`) · About. DRIVE is a collection inside `/wheels`, not a route of its own.

**Long-term: a verification-led curated marketplace** ("StockX for enthusiast objects, starting where we can verify with our own hands") — NOT liquidity-led classifieds. The full marketplace (7 categories, sellers, TRADE) exists in this codebase, dormant behind the flag. Categories open only when their verification operation exists.

**Changed 19 Aug 2026 (Renato):** total hiding is replaced by one acknowledged lock. The nav carries a single MARKETPLACE item marked `Soon` routing to `/marketplace`, which explains the opening model and takes an email (waitlist `source='marketplace'`). Gated marketplace, TRADE, seller, search, listing, account and messaging paths render that page instead of a 404. Still forbidden: naming categories, promising dates, showing counts, previewing marketplace screens.

Stack: Svelte 5 + Vite SPA, hash routing, Supabase (Postgres + Auth + Storage + Edge Functions), Vercel static deploy.

**Dependencies are deliberately thin (19 Aug 2026).** The `vercel` CLI devDependency was removed: it only ever served the `api/*` routes, which no longer exist, so `vercel dev` served nothing. Deployment runs on Vercel's own infrastructure via the GitHub app and does not use the local CLI. That single removal cleared 35 of 37 npm advisories; a Vite patch bump cleared the rest. **`npm audit` is at zero, so keep it there** — if a new dependency drags in a tree the size of the Vercel CLI's, that is the question to ask before adding it.

`@upstash/ratelimit` and `@upstash/redis` were also removed. Nothing in `src/` imported them: rate limiting lives in `supabase/functions/_shared/ratelimit.ts`, which runs on Deno and pins its own copies via `npm:@upstash/ratelimit@2.0.5` and `npm:@upstash/redis@1.34.3`. Listing them as npm `dependencies` implied the browser bundle used them, which it never did. **Rate limiting is unaffected** — the edge functions do not read package.json.

The dependency list is now two runtime packages (`@supabase/supabase-js`, `heic-to`) and five dev packages. Keep it near that.

- Supabase project ref: `arokrumaxjiidsqfpiii`
- Active branch: `main`. Dormant branches keep the `archive/` prefix (do not push).
- Contributors: Renato, Kevin
- Gating flags in `public.site_settings.flags`: `coming_soon`, `maintenance`, `wheel_specialist_mode` — toggleable live from `/admin/settings`. `#dev` URL bypasses gates for the session; authenticated admins bypass automatically. Not publicly exposed yet.

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

## Migration rules — REVOKE first, GRANT minimum (recurring hole)

Supabase auto-grants `SELECT, INSERT, UPDATE, DELETE` on every newly created table to BOTH `anon` and `authenticated`. It auto-grants `EXECUTE` on every newly created function to `PUBLIC`, `anon`, and `authenticated`. RLS policies filter rows but **do not remove the table-level grant.** A future ALTER, a misapplied policy, or a third-party tool reading `pg_class` will see the privilege and may act on it. RLS alone is not sufficient.

This has bitten the project four times: `admin_stats`, `approve_seller_application`, the audit log functions, and `public.reports` (v08 shipped with anon-readable table grants on a table containing reporter emails; hardened live then codified back into `supabase/v08-reports.sql`).

**Every new table migration must include:**

```sql
REVOKE ALL ON public.<table> FROM anon;
REVOKE ALL ON public.<table> FROM authenticated;
GRANT <minimum-set> ON public.<table> TO <roles-that-need-it>;
```

For tables whose writes go through Edge Functions with the service-role key (the standard pattern for public-facing inserts), `authenticated` typically gets `SELECT, UPDATE` only (admin triage via RLS); `anon` gets nothing.

**Every new SECURITY DEFINER function migration must include:**

```sql
REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.<fn>(<args>) FROM anon;
GRANT EXECUTE ON FUNCTION public.<fn>(<args>) TO <only-the-roles-that-call-it>;
```

A SECURITY DEFINER function bypasses RLS by design; an over-broad EXECUTE grant lets unauthenticated callers run privileged code. `REVOKE FROM PUBLIC` alone is not enough because `anon` and `authenticated` are named roles, not PUBLIC.

Both REVOKE and GRANT are idempotent — safe to include in every migration. The block goes at the end of the file, after RLS policies, before `NOTIFY pgrst`.

Reviewers: if a migration creates a table or function without this block, reject it.

## Critical drift to fix first

`supabase/fix-profiles-trigger.sql` recreates the profiles UPDATE policy with a comment claiming it blocks role changes. **It does not.** The real protection is the trigger in item 1 above, which is NOT in any committed SQL file.

Reconciliation tasks (scheduled: first post-launch week, BEFORE any other migration):
- Add `supabase/v23-security-reconciliation.sql` containing: the `protect_profile_privileged_columns` function + trigger, the `admin_stats` guard, and the `admin_activity_recent` security_invoker fix. Goal: repo becomes a faithful record of the hardened live DB.
- Fix or remove the misleading comment in `fix-profiles-trigger.sql`.

## Architecture (current, verified against repo)

- **Public writes** (waitlist, enquiries, seller applications, reports, payments) go through **Supabase Edge Functions** in `supabase/functions/` using the service-role key — NOT Vercel `api/` routes (that earlier architecture was removed; any doc or comment referencing `api/*.ts` routes is stale). Shared modules: `_shared/` (cors, email, ratelimit, turnstile, revolut, supabase-admin).
- **Rate limiting + Turnstile**: implemented on the public-write Edge Functions (waitlist, enquiries, seller-applications, report, payments-create-order). The former "no rate limiting" launch blocker is RESOLVED.
- **Payments:** direct Revolut checkout per listing (card / Apple Pay / Google Pay). **No cart — ever.** Full payment or deposit (deposit holds incoming stock; balance on collection). `payments-create-order` re-resolves price + stock server-side; the client never sets amounts. Webhook + order persistence wired.
- **Deposits are REMOVED (19 Aug 2026, Renato).** One price, paid in full. This supersedes the earlier "deposits ARE the launch commerce model" note. Nothing was dropped from the database: `listings.deposit_amount` and the `is_deposit` branch in `payments-create-order` are intact, so deposits revert by putting the control back in the UI.
  - **One live consequence:** `payments-create-order` still rejects full payment on `stock_state='incoming'` collected in person, because that combination used to require a deposit. The product page therefore shows incoming stock as made-to-order and routes to email, instead of showing a pay button the server would refuse. To make incoming stock payable in full, remove that guard in `supabase/functions/payments-create-order/index.ts` (search: "collection requires a deposit") and redeploy.
- **Klarna: built, shipped dark, NOT live.** Revolut Merchant does not offer Klarna, so Klarna runs through **Stripe, alongside Revolut** (Renato's decision, 19 Aug 2026). Revolut keeps card / Apple Pay / Google Pay / Pay by Bank and was deliberately left untouched.

  Code that exists now:
  - `supabase/functions/_shared/stripe.ts` — fetch-based Stripe client (no SDK), session create + read, and `stripe-signature` verification.
  - `supabase/functions/payments-stripe-create-session/` — Klarna-only Checkout Session. Resolves the amount server-side from the listing + variant matrix; a client-supplied amount is never trusted. Persists via the existing `record_order_created` RPC (its `p_revolut_order_id` arg takes the Stripe `cs_…` session id; no migration needed).
  - `supabase/functions/payments-stripe-session-status/` — what `/payment/return` reads when `provider=stripe`.
  - `supabase/functions/stripe-webhook/` — verifies the signature, maps Stripe states onto the same `complete_order` RPC Revolut uses.
  - `src/lib/KlarnaButton.svelte`, gated on `flags.klarna_enabled`.

  **`klarna_enabled` defaults FALSE and nothing Klarna-branded renders until it is on.** A Klarna mark on a checkout that cannot take a Klarna payment is a false payment claim and a trademark misuse.

  To go live:
  1. Stripe account, Klarna enabled in Dashboard → Settings → Payment methods.
  2. `supabase secrets set STRIPE_SECRET_KEY=sk_… STRIPE_WEBHOOK_SECRET=whsec_… SITE_ORIGIN=https://eirvox.ie`
  3. `supabase functions deploy payments-stripe-create-session payments-stripe-session-status` and `supabase functions deploy stripe-webhook --no-verify-jwt` (Stripe cannot present a Supabase JWT; the signature check is the authentication).
  4. Stripe webhook endpoint → `https://<ref>.supabase.co/functions/v1/stripe-webhook`, events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.
  5. Test in Stripe test mode end to end, confirm the order row flips to paid, THEN flip `klarna_enabled` in `/admin/settings`.

  **Klarna settles asynchronously.** `checkout.session.completed` can arrive with `payment_status: 'unpaid'` while Klarna underwrites; the webhook only treats `paid` as money received. Do not "simplify" that: it is the difference between shipping a wheel and shipping a wheel for free.

  **Known duplication to converge:** `payments-stripe-create-session` mirrors `payments-create-order`'s listing/variant/amount resolution. The Revolut function was left untouched so adding Klarna could not break a working checkout. Two copies of price resolution is two chances to charge the wrong amount, so extract a shared `_shared/listing-charge.ts` the next time either is edited.
- "Express Interest"/enquiries remain the fallback verb for non-payable listings.
- **Auth:** Supabase magic link, PKCE flow. Auth is primarily an admin door today. Browsing and buying stay anonymous.
- **Storage:** public-read-by-URL buckets, LIST disabled. Canonical image column is `storage_path`; URL derived at read time.
- **Audit log:** append-only `audit_log`, trigger-written on `listings` and `sellers`, admin-read only.
- **Deployment:** Vite `outDir: 'docs'`, Vercel output directory `docs`. **`docs/` is committed and is what the live site serves** — a source-only commit does not change eirvox.ie. Run `npm run build` with real `VITE_SUPABASE_*` values and commit `docs/` (keep `docs/CNAME`) whenever you ship. Never commit a `docs/` built with placeholder env.
- **Role enum:** untouched. `profiles.role` = platform access; seller status derives from `sellers.status`.

## The registry (signature mechanic — strict gate)

Long-term differentiator: per-item serialized records ("DRIVE 001 — 001/250"; "REGISTERED" marks on future marketplace listings). **The registry mark and "every wheel is registered" copy ship ONLY when a real, database-backed serial record exists per item.** An unverifiable registry converts the signature mechanic into the signature lie. Schema/implementation for this does not exist yet — treat any registry UI as blocked until it does.

## Launch scope (approved — Phase A.1/A.2)

Pre-launch, in order:
1. Truth edits: remove hardcoded cohort date + slot counter (`Sell.svelte`), fix commission wording (`Trust.svelte`).
2. Footer imprint: entity / CRO 806648 / address / support@eirvox.ie. NO VAT until verified. No personal emails.
3. OG image: interim type-only 1200×630 PNG (the SVG fails WhatsApp/X/iMessage scrapers).
4. Mobile money-path manual QA (finder → variant → pay) on iPhone + Android; fix payment-blocking breakages only.
5. Product photography (minimal grade: honest + well-lit beats editorial + late). Until it lands: designed photo slots (`--evx-surface-2` fill + mono shot annotation). The carbon-weave CSS placeholder is retired.
6. Dark-world evolution pass on Wheels home / WheelDetail / Nav per lockfile §9 (in progress via Claude Code).

Deferred to post-launch week one: `v23-security-reconciliation.sql`, code splitting, history routing/SEO, About founder-optional additions, everything Phase B/C.

## [FACT NEEDED] protocol

Unknown facts are never invented and never silently filled. That rule is
unchanged.

**Changed 19 Aug 2026 (Renato):** the tokens no longer render on public
surfaces. They were cleared by **cutting the claim that needed the unknown
fact**, not by filling it in. Nothing on the site now asserts a fact nobody
has confirmed. Concretely:

- The wheel dimension rows (overall ⌀, grip ⌀, rim thickness) were removed
  from the product page. A buyer acts on a diameter, so an invented one is
  worse than an ugly placeholder. The spec table renders live `listing_specs`
  rows only, and hides itself when there are none. **Put the rows back the
  moment real measurements exist.**
- No carrier is named anywhere. Copy says "Posted anywhere in Ireland, packed
  to travel" and "Collect it from us in Dublin". No tracking, insurance,
  speed or fitting-price claim is made.
- The finishing step reads as the known list (inspected, trimmed, LED-fitted,
  function tested, packed). It does not claim to be exhaustive.
- A DRIVE issue with no price shows "Price on enquiry", never a number.
- The registry stays gated by lockfile §8 regardless.

`src/lib/FactNeeded.svelte` is kept: use it for any NEW unknown that turns up
mid-build rather than guessing. Just do not ship one to production.

**Still unknown, and still blocking the copy that would need them:**
registered address (blocks the footer imprint) · verified VAT · exact
finishing steps · shipping carrier · fitting offer and price · support
response commitment · all product photography · real wheel dimensions.

## Known frontend issues (current)

- **MED.** PKCE auth `?code=…` lands at `/#/login`; outbound link clicks can leak the code in `Referer`. `<meta name="referrer" content="strict-origin-when-cross-origin">` is in `index.html`; verify `exchangeCodeForSession` + URL scrub on Login mount.
- **LOW.** Unsalted SHA-256 IP hash in edge functions. Add `IP_HASH_PEPPER` env var.
- **LOW.** `{@html item}` in `src/routes/Trust.svelte` — safe today (hardcoded array), XSS-prone if dynamic. Replace when Trust is next touched.
- **DEFERRED.** Single large bundle, all routes eager in `App.svelte`; Google Fonts via CSS `@import`; `ListingCard` per-card saved-items fetch (N+1, logged-in only). Post-launch.
- Mock data residue: `src/data/user.ts` backs Account/Messages — these routes are gated out of wheel-mode nav; wire or remove before any account features ship.
- `DriveIssue.svelte` and `DriveIndex.svelte` were **deleted** on 19 Aug 2026. DRIVE is a collection at `/wheels#drive`. Deleting DriveIssue also cleared the pre-BUY-verb copy that made it unsafe to un-gate. `/drive` and `/drive/:slug` redirect to the shop. Git history has both files if wanted.

Architecture follow-ups (tracked, not bugs):
- Browser-side direct Supabase writes remain in `src/lib/api.ts`, `listings.ts`, `sellers.ts`, most of `admin.ts`. v1 grandfathers admin ones (defended at DB layer by `is_admin()` RLS + the privilege trigger). Move to Edge Functions whenever each surface gets touched.

## Trust & Compliance rules (launch blocker class — never regress)

- No fabricated ratings, sales counts, slot counters, cohort dates, or stock figures not wired to live data.
- No present-tense overclaims: no escrow ("we never hold buyer funds" is the published policy), no authentication centre, no insured shipping, no worldwide shipping, no unkept response commitments.
- Banned origin phrases (legal): "hand-finished", "finished by hand", "handmade", "by hand", "made in Ireland/Dublin". Approved copy ONLY: "Finished in Dublin." / "Designed in Ireland, assembled abroad, finished in Dublin."
- Full copy constitution: lockfile §7.

## Working notes

- Verify, do not assume. The repo and live DB have drifted before; check both.
- Small scoped commits, never whole-tree zips (a zip already caused a bad rebase on this branch once).
- Supabase advisor (`get_advisors`) does NOT catch logic flaws like the role-escalation policy. Manual review still required.
- Run the lockfile §13 drift check on any UI/copy change before review.

## Changelog

- 2026-06-11 — Rewritten: edge-function architecture replaces stale `api/` route references; rate-limiting blocker marked resolved; wheel-specialist launch posture + flag documented; deposits confirmed as launch commerce model (supersedes "reservations out of v1" for wheel surfaces); registry gate added; lockfile + CLAUDE.md companion docs referenced; Phase A launch scope recorded; [FACT NEEDED] register added.
