# eirvox — Deep Audit

**Date:** 2026-07-02
**Repo:** `Vantaneant-International-Ltd/eirvox` (ÉIRVOX / EIRVOX LIMITED — live, revenue-bearing marketplace, eirvox.ie)
**Stack:** Vite + Svelte 5 SPA (hash router, **not** SvelteKit) → GitHub Pages (`/docs` bundle); Supabase (Postgres + RLS + 10 Edge Functions); Revolut Merchant API; Resend; Upstash (declared, not wired).
**Method:** Read-only. Findings only, no code changed. **Architectural claims were verified against the actual provisioned infrastructure** (Supabase project `arokrumaxjiidsqfpiii`, live edge functions, live RLS policies + column grants, a safe probe of the deployed webhook) — not inferred from code. Items marked **[VERIFIED LIVE]** were confirmed against the running system.

## Infrastructure reality check (what actually exists)
Unlike client-buildt (whose Supabase turned out unprovisioned), **eirvox's backend is real and wired**:
- Supabase project `arokrumaxjiidsqfpiii` — ACTIVE, 25 tables with real rows (`listings` 15, `reservations` 18, `waitlist` 4, `audit_log` 48).
- 10 deployed Edge Functions incl. `payments-create-order` (v6), `payments-order-status`, `payments-send-receipt`, `revolut-webhook` (v4, `verify_jwt=false` — correct for a webhook).
- Revolut client defaults to the **live** base `https://merchant.revolut.com/api` (`supabase/functions/_shared/revolut.ts:15`); live-vs-sandbox depends on the `REVOLUT_API_BASE`/`REVOLUT_API_KEY` secrets (not readable) — **operator must confirm which mode is live**.
- **Good news:** the money-*creation* path is sound — `payments-create-order` re-resolves the charge **server-side** from the `listings` table and **ignores any client-supplied amount** (`resolveListingCharge`, index.ts:145-300), checks `is_house`, `status='active'`, stock, variants, and deposit rules. `complete_order` is idempotent + atomic. The exposure is in the **webhook** and **RLS**, not order creation.

Severity: 🔴 critical · 🟠 high · 🟡 medium · ⚪ low.

---

## 🔴 CRITICAL

### 1. Revolut webhook fails **open** — `REVOLUT_WEBHOOK_SECRET` is unset in production → forgeable paid orders **[VERIFIED LIVE]**
**File:** `supabase/functions/revolut-webhook/index.ts:31-34` (`if (!SECRET) { …; return { ok: true }; }  // dev/no-secret mode`).
The webhook HMAC check is well-written (replay window, constant-time) **but** short-circuits to "accept all" when `REVOLUT_WEBHOOK_SECRET` is missing. **I probed the deployed function** with a forged `ORDER_COMPLETED` and **no signature**; it passed verification and reached `complete_order` (HTTP 500 "Reservation not found for revolut_order_id …"). A valid secret would have returned `401 signature_invalid` first. **Therefore the secret is not set in prod and every webhook is currently trusted unauthenticated.**
**Exploit:** a buyer starts a real checkout → `payments-create-order` returns `order_id` and creates a `pending_deposit` reservation → the buyer abandons payment and `POST`s a forged `{"event":"ORDER_COMPLETED","order_id":"<their order_id>"}` to `…/functions/v1/revolut-webhook` → `complete_order` flips the reservation to `completed`/`deposit_paid`, transitions the listing to `sold`/`reserved`, decrements variant stock, and emails buyer + seller "order confirmed" — **with no money taken.** Free goods, at scale.
**Fix:** Set `REVOLUT_WEBHOOK_SECRET` on the project (`supabase secrets set REVOLUT_WEBHOOK_SECRET=whsec_… --project-ref arokrumaxjiidsqfpiii`) and configure it in Revolut. Then **remove the fail-open**: when the secret is absent in production, reject (`401`), don't accept. Gate the dev bypass behind an explicit `ALLOW_UNSIGNED_WEBHOOK=1` that is never set in prod.

### 2. `reservations` RLS lets a buyer mark their own order **paid without paying** **[VERIFIED LIVE]**
**Where:** RLS policy `reservations_buyer_update` (`USING/WITH CHECK: buyer_id = auth.uid()`) **+** column grants: `authenticated` holds `UPDATE` on `reservations.status`, `paid_at`, `item_price`, `deposit_amount` (confirmed via `information_schema.role_column_grants`). Client path that assumes admin-only: `src/lib/admin.ts:335-356` (`adminUpdateReservation`) — but the hole is the *buyer* policy, not the admin one.
The buyer-update policy has **no column restriction**, and `status`/`paid_at`/`item_price`/`deposit_amount` are all UPDATE-grantable to `authenticated`. So a signed-in buyer can call PostgREST directly:
`PATCH /rest/v1/reservations?id=eq.<own reservation> {"status":"completed","paid_at":"…"}`
and self-mark their pending order paid (or rewrite `item_price`/`deposit_amount`). The listing→sold transition still requires `complete_order`, so this doesn't auto-flip the listing — **but** the seller dashboard (`reservations_seller_select`) shows the reservation status, so a seller can be induced to fulfil an unpaid order. This is a **second money/order-state bypass, independent of finding #1.** (The `reservations_admin_all` policy is correctly `is_admin()`-gated — that path is fine.)
**Fix:** `REVOKE UPDATE (status, paid_at, item_price, deposit_amount, buyer_id) ON public.reservations FROM authenticated;` Keep buyer-writable columns to a safe whitelist (e.g. `delivery_preference`) via explicit column grants, and route **all** status/payment transitions through `complete_order` / an `is_admin()` RPC only. Apply the same column-scoping to `reservations_seller_update`.

---

## 🟠 HIGH

### 3. "PAYMENT RECEIVED" shown on client callback, never confirmed server-side
**Files:** `src/lib/PayButton.svelte:155` (`onSuccess: () => { paid = true; … }`), render gate `:185-189`; native Revolut Pay button `:139-144` has **no** `onSuccess/onError/onCancel` at all.
The inline success panel is driven purely by Revolut's client `onSuccess` (a UI hint, forgeable via devtools, and can fire before capture settles). Nothing calls `payments-order-status` to confirm `COMPLETED`/`AUTHORISED` before showing "PAYMENT RECEIVED €X". The dedicated `src/routes/PaymentReturn.svelte:43-56` already does this **correctly** (reads server state) — the inline path just doesn't reuse it. Misleads buyer and seller into believing payment settled.
**Fix:** In both success handlers, call `payments-order-status` with `orderId` and only render "received" when the server state is terminal-success; show amount from the server response, not the client `amountEur`. Pass explicit handlers to `instance.revolutPay(...)` (or force the redirect flow so `PaymentReturn` always runs).

### 4. Paid orders can be silently lost if reservation persistence fails
**File:** `src/routes/../supabase/functions/payments-create-order/index.ts:117-123` — on `record_order_created` error the code logs and **continues** ("Don't fail the buyer's checkout"). The Revolut order is created **before** the reservation exists.
If `record_order_created` fails, the buyer is still sent to Revolut and pays, but no reservation row exists → the webhook's `complete_order` can't find it (`RAISE EXCEPTION 'Reservation not found'`) → the paid order is orphaned (no listing transition, no emails, invisible in admin). Only a console log records it.
**Fix:** Create the reservation **before** creating the Revolut order (reserve → then order), or hard-fail the checkout when persistence fails instead of proceeding to payment. Add a reconciliation job that polls Revolut for orders with no matching reservation.

### 5. Listing status not refreshed after purchase → stale UI + duplicate-charge attempts
**File:** `src/routes/ListingDetail.svelte:207` (`payable = … status === 'active'`), load only on mount/slug change (`:82-86`); `PayButton` success doesn't update `listing.status`.
After a successful buy (or a concurrent buyer on single-stock), the page keeps showing the live Pay button and can `bootOrder()` a second Revolut order. Server stock checks + `complete_order` idempotency prevent overselling, so this is duplicate-charge / refund-load / confusing UX rather than oversell — still real on a payments site.
**Fix:** Re-fetch the listing on `PayButton` success and on window focus; disable Pay when status is not `active`.

### 6. `svelte-check`: 82 errors — the money-adjacent admin order path is un-type-checked
**Categorised (not listed individually):**
- **~34 errors — REAL model drift on the order/refund path** (address these): `src/routes/admin/Reservations.svelte` (30), `src/lib/admin.ts` (3), incl. `admin.ts:14-15` "Module './listings' has no exported member `Reservation`/`ReservationStatus`", `admin.ts:344` "Property 'status' does not exist on `Partial<AdminReservation>`", `Reservations.svelte:44` "Property 'id' does not exist on `AdminReservation`", plus "`notes` does not exist in `Partial<AdminReservation>`". The reservation **cancel/refund + status-advance** admin UI compiles with a drifted model and gets **zero** type-checking — a future rename to the reservations shape would break refunds silently.
- **~48 errors — TYPE NOISE, no runtime impact:** `'detail'/'selected'/'listing' possibly null` and `AdminSeller|null not assignable` across `admin/Listings.svelte` (22), `admin/Sellers.svelte` (8), `admin/Trade.svelte` (7), `admin/Users.svelte` (4), `ListingDetail.svelte` (3) — missing null-assertions on values guarded at runtime.
- **Money-movement impact:** none of the 82 alter price math or the payment edge functions (those are Deno, outside svelte-check). The order-state risk is the *loss of type-safety* on the admin refund/status path, not a live miscalculation.
**Fix:** Restore/extend the types in `src/lib/listings.ts` (`Reservation`, `ReservationStatus`) and `AdminReservation` (`id`, `status`, `notes`) — clears the ~34 real errors. Add null-guards for the rest so `ci` can go green and re-gain a signal (currently red CI hides regressions — see #9).

---

## 🟡 MEDIUM

### 7. CI is red and decoupled from deploy — nothing gates a bad release
`ci` (org reusable `node-ci`) fails on the 82 svelte-check errors; the site deploys separately (GitHub Pages from the committed `/docs` bundle), so red CI never blocks a release. (The org-level `node-ci` Node-20 crash and gitleaks false-positive were fixed org-side on 2026-07-02; eirvox's remaining `ci` red is the real type errors in #6.) **Fix:** clear #6, then make the deploy depend on `ci` passing.

### 8. Deploy target is ambiguous + build output committed to VCS
README says Vercel; `CNAME` + `docs/CNAME` + committed `/docs` bundle say GitHub Pages; **no `deploy.yml`** exists (siblings vendr/vnta have one). 15 generated files tracked under `docs/` (hand-committed via "build: regenerate docs bundle" commits) — violates `org-standards/structure.md` "no generated output in VCS"; eirvox is now the only repo doing this. Dead Vercel toolchain: `vercel` devDep + `dev:api` script + `vercel.json`, though the `api/*` architecture was removed. **Fix (one PR):** pick GitHub Pages (matches every sibling), add the sibling `deploy.yml` (build in CI), `gitignore /docs`, delete `vercel.json` + `vercel` devDep + `dev:api`.

### 9. No Supabase CLI migrations — schema is 20+ loose `vNN` SQL files mixing DDL + seed
`supabase/migrations/` does not exist; schema lives as `supabase/v04-*.sql … v24-*.sql` + ad-hoc `security-hardening.sql` etc., with DDL and seed inserts intermixed, plus an `audit/supabase_full_schema.sql` snapshot implying the loose files aren't authoritative. Not `supabase db reset`-reproducible; ordering is by human-read filename. For a payments-carrying, RLS-critical DB this is real dashboard-drift risk. **Fix:** adopt `supabase/migrations/<timestamp>_*.sql`, split seed into `seed.sql`, baseline from a live dump so the repo reproduces prod.

### 10. Supabase security advisors (verified, mostly benign — noted so they aren't over-read)
`get_advisors(security)`: leaked-password protection **disabled** (enable it — cheap win); `function_search_path_mutable` on `public.touch_listing_variants_updated_at` (set `search_path`). The many "SECURITY DEFINER executable by anon/authenticated" advisors (`is_admin`, `admin_stats`, `approve_seller_application`, …) are **false alarms — [VERIFIED]**: each function **internally calls `is_admin()` and raises `42501`** if unauthorized. No privilege-escalation there; do not spend effort on them. **Fix:** enable leaked-password protection; set the one function's `search_path`.

### 11. Env-var prefix outlier: `VITE_*` vs the org's `PUBLIC_*`
`src/lib/supabase.ts:10-11`, `.env.example`, `src/vite-env.d.ts:5-6` use `VITE_SUPABASE_*`; vendr/vnta use `PUBLIC_SUPABASE_*`; client-buildt uses `$env/dynamic`. Same secret, three names across four repos — re-learning cost at a <5-person studio. **Fix:** reconcile to one convention (record the decision in org-standards); eirvox's `VITE_` is the outlier.

---

## ⚪ LOW

- **Dead deps:** `@upstash/ratelimit` + `@upstash/redis` are `dependencies` but used only in Deno edge functions (URL imports), never in `src/` — remove from frontend `package.json`. Also rate-limiting currently **fail-opens** (no Upstash creds; `_shared/ratelimit.ts:3-8`) — wire creds or accept explicitly.
- **Dead source:** `src/routes/Wheels.svelte` (22KB) imported nowhere (live wheels = `WheelsBrowse`/`WheelDetail`); delete.
- **Stub residue:** `src/data/user.ts` mock backs Account/Inbox/Thread; wire to Supabase or remove before account features ship (per HANDOFF.md).
- **Stale README:** describes a nonexistent `src/lib/config.ts COMING_SOON` (gate is DB-driven in `src/lib/flags.ts:54`) and Vercel `api/*` routes (removed); inline `// POSTs to /api/...` comments across `src/lib/*.ts` are stale (code calls `callFunction()` → edge functions). Rewrite to match HANDOFF.md.
- **CORS:** `_shared/cors.ts` allowlists `eirvox.vercel.app`; drop once GitHub Pages is sole host.
- **`src/lib/SellerPill.svelte:2`** "Modifiers cannot appear here" — a genuine Svelte syntax nit (surfaced in #6's count); worth a look though the build tolerates it.

---

## Three highest-leverage changes

1. **Set `REVOLUT_WEBHOOK_SECRET` and remove the webhook fail-open (#1).**
   *Blast radius:* closes **direct revenue theft** — right now anyone who checks out can forge completion and take goods free, on every listing. One secret + a ~3-line guard. Highest possible leverage: it's live, exploitable, and money-out-the-door.

2. **Lock down `reservations` RLS/column grants (#2).**
   *Blast radius:* closes the **second, independent** free-order path (buyer self-marks paid) and protects order-ledger integrity (item_price/deposit tampering) that feeds seller fulfilment and refunds. One migration (`REVOKE` + tighten two policies). Without it, fixing #1 still leaves a paid-status bypass.

3. **Confirm payment server-side before "received", and persist the reservation before redirecting to pay (#3 + #4).**
   *Blast radius:* stops false "PAYMENT RECEIVED" UI (buyer/seller trust, potential ship-without-pay) **and** stops paid orders vanishing when persistence fails after the buyer has already paid. Both are money/trust-critical and share the same fix area (the checkout client + create-order ordering).

---

*Findings only — no code changed. Findings #1, #2, and #10 concern the live Supabase/Revolut configuration and were verified against the running system; the fixes for #1/#2 touch production config + a migration and should be applied in a separate, approved session with pre/post checks. The money-*creation* path (server-side price resolution) is sound; the risks are in webhook authentication, reservation RLS, and client-side success confirmation.*
