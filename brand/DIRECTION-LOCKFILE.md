# ÉIRVOX — Direction Lockfile
**v1.0 · 11 June 2026**
**Status: LOCKED. Changes require a written decision from Renato, recorded in this file's changelog.**
**Usage: paste relevant sections verbatim into every design prompt, design brief, copy task, and implementation ticket. If an output conflicts with this file, the output is wrong.**

---

## 1 · The direction, in one sentence

**A single dark world where light reveals the product, edited with editorial restraint — one event, one idea, one object per screen; engineering voice as annotation only.**

Mix ratio: ~60% Ignition Ritual (atmosphere, light, sequence) · ~30% Newsroom (restraint, pacing, editorial discipline) · ~10% Atelier (technical drawing system, used only where specified).

Reference frame: the approved "The two seconds before ignition" homepage mockup. That frame is the calibration standard. Anything noticeably darker-louder (nightclub) or whiter-quieter (brochure) has drifted.

Anti-references: DoneDeal, Adverts, Facebook Marketplace, generic Shopify premium themes, dropship-luxury aesthetics, crypto-landing-page black-and-glow.

---

## 2 · World boundaries

> **⚠️ DELIBERATE — do not flatten.** The two worlds are the *trust* and *desire*
> beats made visual; collapsing them into one palette is a brand regression, not a
> cleanup. A white-rework once flattened the Dark surfaces and caused the
> black→white→black journey + a white `/wheels` (fixed 20 Jun 2026). If a
> wheels/DRIVE/checkout surface renders light, restore it to Dark — don't whiten
> the rest to match. **Canonical rationale + route map: `brand/DESIGN-WORLDS.md`.**

The brand has exactly two worlds plus one shared thread. Every surface belongs to one world. No surface mixes worlds.

### The Dark World — product theatre
Surfaces: wheels home · wheel detail · fitment finder · DRIVE index · DRIVE issues · checkout/pay states.
Tokens: `--evx-black #0E0D0C` · `--evx-surface #141210` · `--evx-surface-2 #1B1815` · light-on-dark text tokens.
Behavior: photography dominant and full-bleed; UI recedes to thin rules and mono whispers; light is the only ornament; one idea per screen section.

### The Paper World — reading and utility
Surfaces: About · Trust · legal set · (future) marketplace browsing, search, listings, seller flows, accounts, messaging.
Tokens: `--evx-paper #F5F2ED` · `--evx-ink #1A1A1A` · existing light system.
Behavior: editorial density; words and tools; daylight mode of the same company.

### Hard rules
- The buying path for house products never leaves the Dark World.
- High-density browsing (grids, filters, search results) never enters the Dark World.
- The seam is bridged by shared skeletons (§6), never by blending palettes.
- The future marketplace is the Paper World's existing system + the registry mark — it is NOT a new design and NOT a dark grid.

### Launch visibility
- SHOWING: Wheels home, wheel detail, finder, DRIVE, About, Trust, legal, imprint footer.
- HIDDEN (built, flag-gated, zero visible references): all marketplace categories, search, seller flows (/sell), TRADE, accounts, messaging.
- Hiding is total: no nav items, no footer links, no teasers, no "coming soon," no previews in public decks or socials.

---

## 3 · Tokens (closed set — nothing may be added)

### Color
| Token | Value | Role |
|---|---|---|
| `--evx-paper` | #F5F2ED | Paper World ground |
| `--evx-ink` / `--evx-warm-black` | #1A1A1A | Paper World text / light-world black |
| `--evx-black` | #0E0D0C | Dark World ground |
| `--evx-surface` / `--evx-surface-2` | #141210 / #1B1815 | Dark World panels |
| `--evx-graphite` family | #2A2825 / #2E2A25 / #3D3A36 | mid surfaces |
| `--evx-fox-orange` | #E8742C | THE accent. CTAs, live dot, redline markers, dimension callouts. Never headlines, never decoration, never backgrounds. |
| `--evx-champagne` | #C9A961 | DRIVE ONLY: eyebrows, edition plates, LED wash. Never general UI. |
| `--evx-ink-soft` / `--evx-paper-soft` / `--evx-ink-faint` | greys | meta text |
| rules | rgba light/dark variants | 1px hairlines only |

### Forbidden visual devices
No new colors. No gradients (the photographic LED wash is light, not a CSS gradient — CSS gradients only inside the pre-existing carbon/LED utility classes, never new ones). No shadows. No border radii. No glassmorphism/neumorphism. No blur effects. No icons in trust or proof contexts (type and rules only). No stock iconography anywhere new.

---

## 4 · Typography (closed set)

| Family | Role | Rules |
|---|---|---|
| **Inter Tight** (400/500) | Headlines, display, prices, UI | Owns every H1/H2. Weight 500 max. |
| **Newsreader** | Editorial accent | **ITALIC ONLY. Never roman/upright.** Maximum one italic phrase per screen — the standfirst under a headline, or one ritual line. |
| **JetBrains Mono** (400/500) | Labels, eyebrows, captions, specs, registry, annotations | Uppercase + letterspaced for labels. **Never headlines. Never long body paragraphs** — at paragraph length mono reads as terminal output. |

Hierarchy per screen: Inter Tight headline → Newsreader italic standfirst (optional, max one) → body → mono annotation layer.

---

## 5 · Motion constitution

**The rule:** motion may only *reveal* — the product, light, or information. Never decorate. Nothing loops. Nothing idles. Every motion is an event with a beginning and an end, played once per session.

Permitted vocabulary:
1. **The ignition event** — hero: LED wakes, one light sweep crosses the weave, headline sets. Once per session.
2. **The light sweep** — raking highlight across material, scroll-driven or single-trigger.
3. **Self-drawing annotations** — SVG dimension lines/callouts that draw and set their labels (Dark World product detail only).
4. **The cut** — 300–400ms black beat between product pages, orange dot persisting.
5. **Drag-to-rotate** — frame-sequence rotation on product detail (ships only when rotation frames exist).
6. Existing primitives: 200ms opacity fade, `evx-rise` entrance.

Forbidden: parallax, scroll-jacking, marquees, looping ambient animation, hover gimmicks, easing theatrics, anything that moves the object instead of the light.

Quality gate: each motion ships at 100% timing quality or not at all. One perfect event beats five decent ones. Honor `prefers-reduced-motion` always.

---

## 6 · Shared skeletons (the seam bridge)

Identical across both worlds, only surface tokens swap:
- **Nav skeleton** — same structure, spacing, wordmark placement.
- **Imprint footer** — identity zone (wordmark · origin line · registry block) → pruned nav → legal + PaymentIcons. Single-sourced component.
- **Type scale and page margins** (96/48/20).
- **The registry mark** (§8) — rendered identically in both worlds.
- Fox orange behavior — same role in both worlds.

---

## 7 · Copy constitution

### Locked origin copy (legal constraint — zero tolerance)
- Short: **"Designed in Ireland. Finished in Dublin."**
- Long: **"Designed in Ireland, assembled abroad, finished in Dublin."**

### BANNED PHRASES — never in any output, mockup, or draft
"hand-finished" · "finished by hand" · "handmade" · "by hand" · "hand-built" · "made in Ireland" · "made in Dublin" · "crafted by hand"

### Banned claims (until operationally true, with evidence)
- Escrow or held funds in any form (Trust page states the opposite: payments go direct to sellers; there is no ÉIRVOX escrow)
- "Authentication centre" or physical inspection facility
- Insurance, insured shipping
- Worldwide/global/nationwide shipping
- Response-time commitments not actually kept
- Any countdown, slot counter, cohort date, or stock figure not wired to live data
- Ratings, reviews, testimonials, member counts, press logos, "as seen in," sold tickers, "X people viewing"

### Voice
Short declarative sentences. Full stops as design. Specifics over adjectives ("2×2 twill carbon, satin lacquer" not "premium quality"). No hype, no urgency language, no exclamation marks. Exclusivity language ("made once, not reprinted") permitted ONLY on DRIVE, because there it is true. Irishness = specificity (address, bench, CRO number), never symbolism (no green, shamrocks, Celtic ornament).

Approved signature lines (use, don't paraphrase):
- "The two seconds before ignition."
- "Engineered to be felt before it's seen."
- "Made once. Not reprinted." (DRIVE only)
- "Trust is engineered. Every wheel is registered." (only while registry is live per §8)
- "If it isn't right, it doesn't ship."
- "Fewer, better things, and the truth about all of them."

### The [FACT NEEDED] protocol
Unknown facts are rendered as visible `[FACT NEEDED: …]` tokens — mono, distinct, impossible to mistake for final copy. Inventing a fact to fill a layout is a failed deliverable. Current open tokens: registered address · verified VAT · exact finishing steps · shipping carrier · fitting offer/price · response commitment.

---

## 8 · The registry (signature mechanic)

The one trust element rendered identically in both worlds: serialized record per item ("DRIVE 001 — 001/250" plate in the Dark World; quiet mono "REGISTERED" tag on Paper World listing cards).

**Absolute gate: the registry mark ships only when a real, database-backed serial record exists per item.** An unverifiable registry is worse than none — it converts the signature mechanic into the signature lie. No icon, no badge styling: mono type, hairline rule, plate treatment only.

Strategic note: the long-term marketplace model is verification-led ("StockX for enthusiast objects, starting where we can verify with our own hands") — NOT liquidity-led classifieds. Marketplace categories open only when their verification operation exists. "Free to list," open signup, "sell your item" header CTAs are off-model permanently.

---

## 9 · Per-surface rules

| Surface | World | Specifics |
|---|---|---|
| Wheels home | Dark | Ignition hero (one event). Numbered sections. NO dimension lines. Proof band (type + rules, no icons). Registry on its own row, not sharing a strip. |
| Wheel detail | Dark | Canonical anatomy: hero (LED lit) → one-line statement → spec table (mono label/value) → drawing system ON (dimensions draw here) → macro strip → FIND YOUR FIT (single orange CTA) → accordions → registry line. Price never above the photograph. `original_price` renders as quiet mono "Was €X" — never strikethrough, never "SAVE €X". |
| Fitment finder | Dark | The ritual: chassis in → spec confirms → fitment plate stamps ("FITS · F80 M3 · 2014–2018"). |
| DRIVE | Dark | Magazine-on-black. Cover-wall archive, large issue numerals, champagne eyebrows, engraved serial plate. Live edition numbers only on issue pages, never as homepage atmosphere. |
| About | Paper | Company-led. Head → what ÉIRVOX is → process strip (01–04, "assembled abroad" at full prominence) → how buying works → registry colophon. NO founder content required: no person photo, no surname, no first-person copy, no bio. (Founder presence may be ADDED later as optional; never as dependency.) The white macro-grid editorial treatment lives here and on DRIVE editorial. |
| Trust | Paper | Numbered skeleton kept. Proof layer: show mechanisms (payment row, worked deposit example), procedural FAQ. Registry echo at close. |
| 404 / system pages | Match entry world | Wheel-mode voice, "Back to Wheels" — never marketplace copy while gated. |
| Marketplace (future) | Paper | Existing light system + registry mark + imprint footer + shared nav. Curated catalogue, tier pills, no open-listing furniture. |

---

## 10 · Commerce model constraints

- **No cart. Ever "CART (0)" appears, the output is wrong.** Direct pay per listing via Revolut (card / Apple Pay / Google Pay). Deposits hold incoming stock; balance on collection.
- Launch verb set: **Pay** and **Enquire**. No "Express Interest," no "Message seller," no "Make an offer" on fixed-price house products.
- Server resolves price and stock; UI never implies otherwise.
- No SIGN IN / REGISTER as primary header actions — admission model, not open signup.

---

## 11 · Photography constitution (governs the brief)

- Grade: cinematic low-key. Deep shadow, single raking key, LED as practical in-frame light source. Warm neutrals; nothing in frame competing with fox orange.
- Honest > editorial when forced to choose. The mounting-hardware/back-of-product shot is mandatory (confidence move).
- First-class deliverables, not extras: rotation sequence (24 frames), ignition/LED-wake sequence (5–6 frames), macro set (weave, stitch, LED, hardware), night cockpit in-car, bench environmental (no person required).
- Masters 3:2, shot loose for crops. Derived: 5:6 (cards), 16:9 (hero), 1:1 (DRIVE), 1200×630 (OG).
- No props, no lifestyle styling, no staged artisan, no hands wearing branded gear. People optional, never required.
- Until real photography exists: designed slots (`--evx-surface-2` fill + mono shot annotation). The carbon-weave CSS placeholder is retired. Never simulate product photography in mockups presented for approval.

---

## 12 · Generation-tool preamble (paste verbatim into every GPT/image prompt)

```
HARD CONSTRAINTS — violating any of these makes the output unusable:
- Never use the words: "hand-finished", "finished by hand", "handmade",
  "by hand", "hand-built", "made in Ireland", "made in Dublin".
  Approved origin copy ONLY: "Finished in Dublin." or "Designed in
  Ireland, assembled abroad, finished in Dublin."
- No shopping cart, no "CART (0)" — direct pay model, no cart exists.
- No escrow, no "secure payments & escrow", no buyer-protection claims,
  no insurance claims, no worldwide/global shipping claims.
- No star ratings, reviews, testimonials, press logos, member counts,
  countdown timers, stock counters, "people viewing".
- No icons in trust/proof strips — type and hairline rules only.
- No gradients, shadows, rounded corners, glassmorphism. Flat, sharp, matte.
- Colors: near-black #0E0D0C world OR warm paper #F5F2ED world — never
  blended. Single accent #E8742C (surgical). Champagne #C9A961 on DRIVE only.
- Type: Inter Tight headlines (never mono headlines), Newsreader ITALIC
  ONLY (max one phrase per screen), JetBrains Mono for labels/captions only.
- Wordmark: ÉIRVOX with É ACUTE — never È.
- No SIGN IN / REGISTER header buttons. No "sell your item" / "free to
  list". No invented nav items (no Collect, Stories, Services).
- Marketplace surfaces are PAPER (light), curated, with tier pills and a
  mono "REGISTERED" mark — never a dark classifieds grid.
```

---

## 13 · Decision log

| Date | Decision | Status |
|---|---|---|
| 11 Jun 2026 | Direction locked: Ritual 60 / Newsroom 30 / Atelier 10 | LOCKED |
| 11 Jun 2026 | Calibration frame: "The two seconds before ignition" homepage | LOCKED |
| 11 Jun 2026 | Two-world architecture (dark product / paper utility), total launch hiding of marketplace | LOCKED |
| 11 Jun 2026 | Marketplace strategy: verification-led, not liquidity-led; categories open when verifiable | LOCKED |
| 11 Jun 2026 | About is company-led; founder content optional, never required | LOCKED |
| 11 Jun 2026 | Registry ships only with DB-backed serials | LOCKED |
| 11 Jun 2026 | Proof band Treatment A (dark) · Registry Treatment A (colophon) | LOCKED |
| 19 Jun 2026 | Homepage may render in the Dark World as a house-led commercial front door, incl. marketplace + TRADE teaser sections. Marketplace and TRADE *detail* surfaces (browse / category / listing / seller / directory / profile) remain Paper World — §2 and §9 otherwise unchanged. NOT a blanket dark conversion. Authorised by Renato. | LOCKED |
| 19 Jun 2026 | Dark exception extended to house-front *recruitment* surfaces — Sell (seller tiers / recruitment) renders Dark alongside the wheel surfaces. The browse/transact marketplace (category / listing / seller shop / search) stays Paper. Authorised by Renato. | LOCKED |
| 20 Jun 2026 | Two-world architecture documented as deliberate (not a bug to flatten) with the *why* + route map in canonical `brand/DESIGN-WORLDS.md`; referenced from CLAUDE.md + HANDOFF.md; one plain-language line added to /about. Prompted by the white-rework flatten regression. | LOCKED |
| 20 Jun 2026 | Commerce model is split by world (clarifies §10): Dark = the ÉIRVOX *shop* — house products at set price, verbs Pay/Enquire only. Paper = a real *marketplace* (DoneDeal/Adverts-style) with genuine offers + messaging; ÉIRVOX sells there as one seller, not fixed price. "Make an offer" / "Message seller" are correct on the marketplace and must NOT be audited out. Recorded in `brand/DESIGN-WORLDS.md`. Authorised by Renato. | LOCKED |
| — | (changelog continues here; one line per change, with reason) | |

**Drift check, run on every new design output:** banned phrases? · cart? · icons in trust strips? · mono headline? · upright serif? · orange decorating? · champagne off-DRIVE? · invented claims? · invented nav? · worlds blended? — any YES = reject before evaluating aesthetics.
