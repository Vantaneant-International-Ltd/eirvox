# ÉIRVOX

Ireland's premium marketplace for enthusiast objects.

**Who owns it.** ÉIRVOX Systems Ltd, trading as ÉIRVOX, a Vantaneant International
Ltd company. Dublin, Ireland. CRO 712304. Contact: renato@eirvox.ie, eirvox.ie.

**Status.** The site is behind `COMING_SOON = true` in `src/lib/config.ts` with a
`#dev` bypass. Not publicly exposed.

## Stack

Svelte 5 + Vite. Hash-based SPA router. Supabase (Postgres + Auth + Storage).
Vercel (SPA static + Edge serverless `/api/*`).

## Run

```
npm install
npm run dev          # Vite SPA only, /api/* calls 404
npm run dev:api      # Vercel CLI: SPA + /api/* on one port (needs `vercel login` once)
```

You need a `.env` file (copy from `.env.example`). For full server-route testing
add `SUPABASE_SERVICE_ROLE_KEY` (server-only, no `VITE_` prefix). `npm run dev` is
enough for browsing; `npm run dev:api` is needed to exercise enquiries, waitlist,
and seller-application submissions.

## Build

```
npm run build
```

Vite outputs to `docs/`. Vercel deploy is configured via `vercel.json` to use
`docs/` as its output directory.

## Brand source of truth

ÉIRVOX is governed by its emotional direction as much as its visual one. Read the
emotional bible before making anything for ÉIRVOX.

| Document | Governs | Question it answers |
|---|---|---|
| Brand / visual guidelines | How ÉIRVOX **looks** | typography, colour, layout, listing design |
| Emotional bible (`brand/EMOTIONAL-BIBLE.md`) | How ÉIRVOX **feels** | trust, desire, tone, what it stands against |

Rule of precedence: when visual guidelines and emotional direction conflict,
resolve in favour of the feeling. A page can be visually clean and still be wrong
if it reads as a junk marketplace, performs trust with loud badges, or pushes
desire instead of awakening it.

Core distinction from Vendr: Vendr is subtractive calm (away from junk). ÉIRVOX is
trustworthy desire (toward a beautiful object, safely). ÉIRVOX has a pulse; do not
let it inherit Vendr's stillness.

The emotional bible is authoritative for all ÉIRVOX content: site, listings,
captions, video (Higgsfield or otherwise), and any brief given to a human or an AI.

## Project layout

```
eirvox/
├── api/                          Vercel Edge routes (service-role Supabase client)
│   ├── _lib/supabase-admin.ts    Server-only client; NEVER imported from src/
│   ├── health.ts                 GET /api/health
│   ├── waitlist.ts               POST /api/waitlist
│   ├── seller-applications.ts    POST /api/seller-applications
│   └── enquiries.ts              POST /api/enquiries
├── src/
│   ├── App.svelte                Hash-router switch + coming-soon gate
│   ├── main.ts
│   ├── app.css                   Design tokens + base + focus + skip-link
│   ├── lib/                      Stores, helpers, shared components
│   ├── components/               AuthGuard, AdminLayout, LoadingCard
│   ├── routes/                   One file per route
│   └── data/                     Mock fixtures still consumed by Messages / Account
├── supabase/                     Committed SQL migrations
├── audit/                        Live-DB schema snapshots (drift-detection aid)
├── notes/                        Review trackers + prompts
├── docs/                         Build output
├── HANDOFF.md                    Authoritative context for any new contributor
├── vercel.json
└── vite.config.ts
```

See [HANDOFF.md](HANDOFF.md) for the locked architecture decisions, security status
of the live DB, and the current open-issue list.

## Routes

### Marketplace
| Path | Page |
|---|---|
| `/` | Home |
| `/{automotive\|watches\|fashion\|tech\|home-design\|audio-vinyl\|art}` | Category pages |
| `/listing/:slug` | Listing detail (with Express Interest form) |
| `/search?q=` | Listing + tradesperson search |

### DRIVE (editorial imprint)
| Path | Page |
|---|---|
| `/drive` | Index of issues |
| `/drive/:slug` | Individual issue (with Express Interest form) |

### Seller
| Path | Page |
|---|---|
| `/sell` | Tier comparison + cohort schedule |
| `/sell/apply` | Anonymous application, 5 steps (POSTs to `/api/seller-applications`) |
| `/sell/create` · `/sell/edit/:id` | Listing CRUD (auth required) |
| `/sell/dashboard` | Seller dashboard |

### TRADE
| Path | Page |
|---|---|
| `/trade` | Landing |
| `/trade/apply` | Application |
| `/trade/:category` · `/trade/:category/:slug` | Category + profile |

### Account
| Path | Page |
|---|---|
| `/account` · `/account/{orders,saved,settings}` | Auth required |
| `/messages` | Conversations (mock-backed, see HANDOFF) |
| `/login` | Magic-link sign-in (PKCE) |

### Admin (`requireRole="admin"`)
| Path | Page |
|---|---|
| `/admin` | Dashboard |
| `/admin/{listings,sellers,reservations,trade,users,waitlist,enquiries,categories,settings}` | Per-surface admin |

### Trust & legal
`/trust` · `/about` · `/terms` · `/privacy` · `/cookies` · `/acceptable-use` · `/returns` · `/sitemap`

## Design tokens

| Token | Value |
|---|---|
| `--evx-paper` | `#F5F2ED` |
| `--evx-ink` / `--evx-warm-black` | `#1A1A1A` |
| `--evx-graphite` | `#2A2825` |
| `--evx-ink-soft` (stone) | `#8A8680` |
| `--evx-fox-orange` | `#E8742C` |
| `--evx-champagne` | `#C9A961` |
| Display | `Inter Tight` 400/500 |
| Editorial | `Newsreader` italic |
| Mono / labels | `JetBrains Mono` 400/500 |
| Motion | 200ms opacity fade only |
| Page margins | 96 / 48 / 20 px (desktop / tablet / mobile) |

## Platform

- **Marketplace.** Curated objects across 7 categories. Sellers admitted by cohort application. V1 is admin-curated (admin creates listings); seller self-serve comes later.
- **DRIVE.** Limited-run OEM+ pieces. One specification per issue.
- **TRADE.** Verified directory of independent tradespeople across Ireland.

## Key decisions (locked, see HANDOFF.md)

- **Public writes** (waitlist, seller applications, enquiries) go through `/api/*` Vercel serverless routes using the service-role key. No browser-to-Supabase anon inserts.
- **Reservations are out of v1.** Replaced by "Express Interest" wired into `enquiries`. The `reservations` table is retained for admin history.
- **Seller applications** write to a dedicated `seller_applications` table; `sellers` only gets rows on approval (via `approve_seller_application()` SECURITY DEFINER helper).
- **Auth.** Supabase magic link with PKCE flow. Login is primarily an admin door today.
- **Storage.** Public-read buckets with LIST disabled. Image canonical column is `storage_path`; URL derived at read time.
- **Audit log.** Append-only `audit_log` table with triggers on `listings` and `sellers`. Admin-read only; writes only via the SECURITY DEFINER `log_audit_event()` helper invoked by triggers.

## Brand assets

Wordmark and symbol live at `public/brand/`.
