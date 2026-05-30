# Moderation roadmap

Tracking the content-safety items we deliberately deferred while ÉIRVOX runs in admin-curated mode. Pick these up when sellers go self-serve and listings stop passing through human review before publication.

## Why nothing is needed today (Stage 1)

- Every listing is created by an admin. NSFW, scam, fake-brand, and overclaim content cannot reach the public site without admin approval.
- The only public-write paths are `/api/waitlist`, `/api/enquiries`, `/api/seller-applications`. All three write to admin-only queues, never to public surfaces.
- Rate-limit + IP hash via Upstash already in place (commit `ad51561`) caps the abuse surface on those routes.

Build the items below in order, when (and only when) seller self-serve is opened. Do not build any of them speculatively.

## Stage 2 — when sellers self-publish

### 1. Reports table + "Report this listing" CTA
A user-visible report button on listing detail pages, plus an `/admin/reports` queue.

```sql
CREATE TYPE public.report_reason AS ENUM ('scam', 'nsfw', 'fake', 'offensive', 'duplicate', 'other');
CREATE TYPE public.report_status AS ENUM ('open', 'reviewed', 'dismissed', 'actioned');

CREATE TABLE public.reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES public.listings(id) ON DELETE CASCADE,
  tradesperson_id uuid REFERENCES public.tradespeople(id) ON DELETE CASCADE,
  reporter_email  text,
  reporter_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason          public.report_reason NOT NULL,
  details         text,
  status          public.report_status NOT NULL DEFAULT 'open',
  reviewed_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  action_taken    text,
  ip_hash         text,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: no INSERT policy. Reports submitted via /api/reports (service-role).
-- Admin SELECT/UPDATE via reports_admin_all. Subject FK is exactly one
-- (listing OR tradesperson), enforced by CHECK constraint.
```

Sibling files to add:
- `api/reports.ts` — service-role insert with the same Upstash rate-limit shape (`limiter: 'reports'`, e.g. 3 per 10 min per IP) and the same `IP_HASH_PEPPER` salt.
- `src/lib/reports.ts` — client `submitReport()` POSTs to `/api/reports`.
- `src/routes/admin/Reports.svelte` — queue with filter by status + reason.
- AdminLayout: sidebar link with badge for `status='open'` count.

Effort: ~2-3 hours.

### 2. Server-side keyword blocklist
Stops the lazy 90% of scams (wire-transfer fraud, crypto-pump, Western Union, Nigerian-prince patterns). Runs on every public-write route AND on listing create.

- New helper `api/_lib/textscreen.ts` with a small array of regexes.
- Lives server-side only. Returns either `{ ok: true }` or `{ ok: false, reason: '…' }`.
- Used in `/api/seller-applications`, `/api/enquiries`, and (once seller self-serve is live) the listing create path.
- Triggers fire as soft flags, not hard rejections: the row still inserts but with `flagged=true`. Admin sees flagged items at the top of their queue.

Maintain the blocklist in a single file. Don't try to be exhaustive — perfect is the enemy of any.

Effort: ~1 hour, plus ongoing list grooming.

### 3. NSFW image screening on upload
Two practical paths. Pick one:

- **Cloudflare Images** with bolt-on AI moderation. Bolts onto the existing storage flow, ~$5/month flat, moderation labels returned with each upload. Cleanest integration.
- **Sightengine / Hive.ai REST** at upload-handler time. Pay-per-image (~$0.001), more accurate categories, adds ~200ms latency per upload.

Plumbing either way:
- The decision happens server-side in a new `/api/listings/upload-image` route, replacing the current browser-direct upload to Supabase Storage.
- A `moderation_status` column on `listing_images`: `'pending' | 'clean' | 'flagged' | 'blocked'`.
- `'flagged'` items go in the report queue alongside user reports.
- `'blocked'` are not displayed publicly; admin can override.

Effort: ~3-4 hours for Cloudflare Images, ~2 hours for Sightengine integration.

### 4. Ban mechanism (half-built already)
The infrastructure exists:
- `profiles.suspended` boolean column (already added in commit `b951147` era).
- `protect_profile_privileged_columns` trigger blocks users from un-suspending themselves.

What's missing:
- Admin "Ban" / "Unban" actions on the `/admin/users` page (already partially there via `setUserSuspension` in `lib/admin.ts:474`).
- Enforcement: every public-write route (`/api/waitlist`, `/api/enquiries`, etc.) should check `profiles.suspended` for the requester (when signed in) and reject with 403 if true.
- Anonymous bans: harder — `ip_hash` based blocklist in Upstash, with a TTL.

Effort: ~2 hours for signed-in user enforcement; anonymous IP-ban TTL is another ~1 hour.

## Stage 3 — at scale (don't build now)

Build only when:
- You're processing >1000 images/day, OR
- You hit your first DMCA / Garda notice, OR
- You see organised fraud rings using the platform

Items:
- **CSAM screening** via PhotoDNA or Cloudflare's CSAM-Scanning Tool (built into Cloudflare Images at higher tiers). Required by Irish law for image hosts at scale.
- **DMCA process** — public takedown form, designated agent registered, 24-hour SLA.
- **Garda + NCMEC liaison** for criminal content.
- **Ban evasion detection** — device fingerprinting (e.g. FingerprintJS), email-domain pattern matching.
- **ML toxicity scoring** on text fields with Perspective API or similar.

## Operational notes

- Every Stage 2 item should write to the `audit_log` (table exists since `v05-audit-log.sql`) via the `log_audit_event` SECURITY DEFINER helper. Action types to add: `'report'`, `'flag'`, `'ban'`, `'unban'`, `'moderation_override'`.
- Reports table SQL should include the same admin-wide policy pattern we used for `listing_images_admin_all` and `listing_specs_admin_all` (see `supabase/v05-admin-listing-children-rls.sql`).
- All new tables: no public INSERT policy. All inserts go through `/api/*` with service-role.

## Decision log

| Date | Decision | By |
|---|---|---|
| 2026-05-30 | Defer all moderation infrastructure until sellers go self-serve. Admin-curated v1 is the moderation system. | Renato + Claude |

Update this table whenever a Stage 2 item is built or a decision changes.
