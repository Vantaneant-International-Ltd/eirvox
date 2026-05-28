# ÉIRVOX

Ireland's premium marketplace for enthusiast objects.

## Stack

Svelte 5 + Vite · Hash-based SPA router · GitHub Pages (`docs/`) · No backend

## Run

```
npm install
npm run dev
```

## Build

```
npm run build
```

Output goes to `docs/`. Push and GitHub Pages serves it.

## Routes

### Marketplace
| Path | Page |
|---|---|
| `/` | Home — hero, categories, featured, recent, DRIVE band, TRADE band, sell CTA |
| `/automotive` | Automotive category |
| `/watches` | Watches category |
| `/fashion` | Fashion category |
| `/tech` | Tech category |
| `/home-design` | Home & Design |
| `/audio-vinyl` | Audio & Vinyl |
| `/art` | Art |
| `/listing/:slug` | Listing detail |

### DRIVE (editorial imprint)
| Path | Page |
|---|---|
| `/drive` | DRIVE — index of issues |
| `/drive/:slug` | Individual issue (003 Mercedes-AMG GT live) |
| `/reserve/drive/:slug` | DRIVE allocation checkout, 4 steps |

### Reserve / Checkout
| Path | Page |
|---|---|
| `/reserve` | Explainer: how reservations work |
| `/reserve/:slug` | Marketplace item reservation checkout, 4 steps |

### Seller
| Path | Page |
|---|---|
| `/sell` | Tier comparison + cohort schedule |
| `/sell/apply` | Application, 5 steps |
| `/sell/create` | New listing flow, 6 steps |
| `/sell/dashboard` | Mock dashboard preview |

### TRADE (verified tradespeople directory)
| Path | Page |
|---|---|
| `/trade` | TRADE landing |
| `/trade/apply` | Trade application, 5 steps |
| `/trade/:category` | Category page (electricians, plumbers, etc.) |
| `/trade/:category/:slug` | Tradesperson profile |

### Account
| Path | Page |
|---|---|
| `/account` | Overview |
| `/account/orders` | Reservations with expandable timeline |
| `/account/saved` | Saved listings |
| `/account/settings` | Profile, notifications, account actions |
| `/messages` | Conversations |
| `/login` | Magic-link sign-in |

### Trust & legal
| Path | Page |
|---|---|
| `/trust` | Deposits, authentication, buyer protection, disputes |
| `/about` | Positioning, principles, contact |
| `/terms` | Terms & Conditions (19 sections) |
| `/privacy` | Privacy Policy (13 sections) |
| `/cookies` | Cookie Policy |
| `/acceptable-use` | Acceptable Use Policy |
| `/returns` | Returns & Refunds |

### Utility
| Path | Page |
|---|---|
| `/sitemap` | Full site index |
| Any unmatched route | 404 with attempted-path + category quicklinks |

## Structure

```
eirvox/
├── public/
│   ├── brand/
│   │   ├── wordmark.svg       (replace with wordmark.png)
│   │   └── symbol.svg          (replace with symbol.png)
│   ├── favicon.svg
│   └── og-image.svg
├── src/
│   ├── App.svelte              (router switch)
│   ├── main.ts
│   ├── app.css                 (design tokens + base + focus + skip-link)
│   ├── lib/
│   │   ├── router.ts           (hash router + matchRoute + focus management)
│   │   ├── seo.ts              (per-route head meta)
│   │   ├── Nav.svelte
│   │   ├── Footer.svelte
│   │   ├── CookieBanner.svelte
│   │   ├── ListingCard.svelte
│   │   ├── SellerPill.svelte
│   │   └── LegalLayout.svelte
│   ├── data/
│   │   ├── listings.ts         (31 listings · 17 sellers · 7 categories)
│   │   ├── user.ts             (mock user · orders · saved · messages · activity)
│   │   └── tradespeople.ts     (22 tradespeople · 15 trade categories)
│   └── routes/                 (one file per route)
├── docs/                       (build output → GitHub Pages)
├── index.html
└── vite.config.ts
```

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

- **Marketplace.** Curated objects across 7 categories — automotive, watches, fashion, tech, home & design, audio & vinyl, art. Verified sellers admitted by cohort application.
- **DRIVE.** Limited-run OEM+ pieces. One specification per issue, no variants, no restocks. Issue 003 (AMG GT carbon steering wheel) currently open.
- **TRADE.** Verified directory of independent tradespeople across Ireland. 15 categories. ID + credential verified. Flat monthly fee (€9 Listed / €29 Pro). No per-lead charges, no commission.

## Key decisions

- **Escrow is not live.** €49 refundable reservation deposit via Revolut/manual flow. All escrow language is future-facing ("coming soon" in H2 2026).
- **No Stripe Connect as live.** Card and Apple Pay tagged as upcoming everywhere.
- **Sellers by cohort.** No open signup. Cohort 03 reviews close 14 June 2026; approved sellers go live 01 July.
- **Tradespeople by application.** ID + credentials + 15-minute video call before going live.
- **No behavioural advertising.** Cookie banner offers Essential / All. We don't sell data.
- **Hash router.** GitHub Pages-friendly. No SPA backend required for now.

## Brand

Wordmark and symbol live at `public/brand/`. They're SVG placeholders matching the design system. To use the supplied PNG artwork:

1. Save the two uploaded files as `public/brand/wordmark.png` and `public/brand/symbol.png`.
2. Update references in `Nav.svelte`, `Footer.svelte`, and `About.svelte` from `wordmark.svg` to `wordmark.png`.

## Entity

ÉIRVOX Systems Ltd · Trading as ÉIRVOX
A Vantaneant International Ltd company
Dublin, Ireland · CRO 712304 · VAT IE 3987654 N

renato@eirvox.ie · eirvox.ie
