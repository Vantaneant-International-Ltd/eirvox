# ÉIRVOX — Direction Lockfile
**v2.0 · 19 August 2026** (v1.0 · 11 June 2026)
**Status: LOCKED. Changes require a written decision from Renato, recorded in this file's changelog.**
**Usage: paste relevant sections verbatim into every design prompt, design brief, copy task, and implementation ticket. If an output conflicts with this file, the output is wrong.**

---

## 1 · The direction, in one sentence

> **AMENDED 19 Aug 2026** (Renato — see §13). The direction below replaces the
> previous single-dark-world sentence. The two-world model is retired;
> `brand/DESIGN-WORLDS.md` is superseded and kept only as history.

**One clean light shop where the product carries the page — conventional, legible commerce, punctuated by dark editorial bands, with engineering voice as annotation only.**

Mix ratio: ~55% Clean Commerce (white ground, product tiles, obvious price and buy) · ~35% Newsroom (restraint, pacing, editorial discipline) · ~10% Atelier (technical annotation, used only where specified).

Reference frame: carbondistrict.ie — white commerce, a hairline trust strip, a hairline-divided figures bar, bordered collection cards, and full-bleed dark bands used as punctuation between light sections. Anything noticeably darker (the retired product-theatre) or busier (generic Shopify density) has drifted.

Anti-references: DoneDeal, Adverts, Facebook Marketplace, generic Shopify premium themes, dropship-luxury aesthetics, crypto-landing-page black-and-glow.

---

## 2 · The one world

> **REPLACES the two-world architecture, 19 Aug 2026 (Renato — see §13).** The
> Dark World / Paper World split and the anti-flatten rule that guarded it are
> void. `brand/DESIGN-WORLDS.md` carries a superseded banner and is history.

There is one surface: **light**. White ground, near-black ink, fox orange as the
only accent, no radii, no shadows, hairline rules.

### Dark bands (the only dark that ships)
A full-bleed dark section *inside* a light page — the DRIVE band, the process
strip, the marketplace band. Utility: `.evx-dark` in `src/app.css`. It is
sectional contrast, not a second world.

### Hard rules
- The buying path is **light**, end to end: shop, product page, finder,
  payment return. A dark checkout is a regression now.
- A dark band never carries a form field that takes money, and never a whole
  page. If a band grows into a full screen, it has become a world again — cut it.
- Nav and Footer are one light chrome. Their `dark` prop is accepted and ignored
  by dormant surfaces; delete it once those are re-papered.
- Champagne stays DRIVE-only. Fox orange stays surgical: CTAs and live markers,
  never headlines, never decoration, never a background wash.

### Launch visibility

> **AMENDED 19 Aug 2026 (Renato — see §13).** Total hiding is replaced by a
> single acknowledged lock. The previous rule — "no nav items, no 'coming
> soon'" — no longer applies to the marketplace.

- SHOWING: front page, the shop (`/wheels`, incl. the DRIVE collection and the
  finder), product pages, About, Trust, legal, imprint footer.
- LOCKED, and openly so: **one** MARKETPLACE nav item, marked `Soon`, routing to
  `/marketplace` — a coming-soon page that explains the opening model and takes
  an email (waitlist `source='marketplace'`).
- BEHIND THE LOCK (built, gated, unchanged): categories, search, `/listing/:slug`,
  seller flows, TRADE, accounts, messaging. Gated paths render `/marketplace`
  rather than a 404, so a visitor gets an explanation, not a wall.
- Still forbidden: naming categories, promising dates, showing counts, or
  previewing marketplace screens. The lock says *that* it is coming and *how* it
  opens — never *when* or *what*.

---

## 3 · Tokens (closed set — nothing may be added)

### Color

> **AMENDED 19 Aug 2026 (Renato — see §13).** Re-tabled for the one light
> world. Authority is `src/app.css`.

| Token | Value | Role |
|---|---|---|
| `--evx-paper` | #FFFFFF | page ground |
| `--evx-paper-panel` | #F5F5F4 | recessed band / section ground |
| `--evx-paper-tile` | #F0EFED | product image tile |
| `--evx-ink` / `--evx-warm-black` | #141414 | headings and primary text |
| `--evx-ink-soft` | #6B6B6B | meta, secondary text |
| `--evx-ink-faint` | #9A9A98 | captions, disabled |
| `--evx-fox-orange` | #E8742C | THE accent. CTAs and live markers. Never headlines, never decoration, never backgrounds. |
| `--evx-champagne` | #C9A961 | DRIVE ONLY: issue plate, band eyebrow. Never general UI. |
| `--evx-rule-light` / `--evx-rule-hair` | rgba ink 0.12 / 0.07 | 1px hairlines only |
| `--evx-ink` as band ground | #141414 | the `.evx-dark` editorial band |

**Legacy dark tokens** (`--evx-black`, `--evx-surface`, `--evx-surface-2`,
`--evx-paper-soft`, `--evx-rule*`) are kept at the foot of `src/app.css` so the
dormant marketplace / TRADE / seller / admin screens keep rendering until each
is re-papered. **No public surface may use them.** Delete the block when the
last dormant surface is converted.

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

> **AMENDED 19 Aug 2026 (Renato — see §13).** The ignition event, the light
> sweep, the self-drawing annotation layer and the black cut belonged to the
> retired product-theatre and are withdrawn. The rule above is unchanged and
> still governs.

Permitted vocabulary:
1. **The entrance** — `evx-rise`, once, on a hero copy block.
2. **The fade** — 200ms opacity on hover and state change.
3. **Drag-to-rotate** — frame-sequence rotation on the product page (ships only when rotation frames exist).

The trust strip in the nav is **static type**. A scrolling version would be a
marquee, which the rule below bans — that ban survives the light rework.

Forbidden: parallax, scroll-jacking, marquees, looping ambient animation, hover gimmicks, easing theatrics, anything that moves the object instead of the light.

Quality gate: each motion ships at 100% timing quality or not at all. One perfect event beats five decent ones. Honor `prefers-reduced-motion` always.

---

## 6 · The chrome

> **AMENDED 19 Aug 2026 (Renato — see §13).** There is no seam to bridge; one
> chrome serves every surface.

- **Trust strip** — static hairline bar above the nav. True facts only: no
  shipping, insurance or response-time claims, no counts.
- **Nav** — wordmark left; Wheels · DRIVE · Fitment · Marketplace (`Soon`) ·
  About; one orange CTA. No cart, no SIGN IN / REGISTER.
- **Imprint footer** — identity + registry → nav columns → legal + PaymentIcons
  → ghosted wordmark. Single-sourced component.
- **Type scale and page margins** (64/32/20; max width 1320).
- **The registry mark** (§8) — unchanged, still gated.
- Fox orange behaviour — CTAs and live markers, nothing else.

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
Short declarative sentences. Full stops as design. Specifics over adjectives ("3K twill carbon, satin lacquer" not "premium quality"). No hype, no urgency language, no exclamation marks. Exclusivity language ("made once, not reprinted") permitted ONLY on DRIVE, because there it is true. Irishness = specificity (address, bench, CRO number), never symbolism (no green, shamrocks, Celtic ornament).

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

> **REPLACED 19 Aug 2026 (Renato — see §13).** The previous table assigned each
> surface a world. There is one world now, so it assigns structure instead.

| Surface | Specifics |
|---|---|
| Front page (`/`) | Hero (full-bleed shot, statement, one primary action) → proof bar (four hairline-divided figures, all live or true, type and rules only) → the fitted range (collection row) → DRIVE (dark band) → fitment → process 01–04 → marketplace (dark band, links to the lock). |
| Shop (`/wheels`) | Head → sticky filter bar (All / The range / DRIVE, make, sort) → grid → fitment → DRIVE band. DRIVE is a **collection here**, not a surface of its own. Marketplace categories never appear. |
| Product (`/wheels/:slug`) | Gallery left (sticky), buy panel right → specification → detail accordions. Price sits **in the buy panel**, never over the photograph. `original_price` renders as quiet mono "Was €X" — never strikethrough, never "SAVE €X". |
| Fitment finder | The ritual is unchanged: chassis in → spec confirms → fitment stamps. Light surface. |
| DRIVE | A collection inside the shop plus one dark band. Champagne on the issue plate and the band eyebrow only. Live edition **size** only; per-unit serials stay gated by §8. |
| Marketplace lock (`/marketplace`) | Head → how it opens (01–03) → email capture (dark band) → back to the shop. Never names a category, a date, or a count. |
| About | Company-led. Head → what ÉIRVOX is → process 01–04 ("assembled abroad" at full prominence) → how buying works. NO founder content required. |
| Trust | Numbered skeleton kept. Mechanisms shown: payment row, procedural FAQ. Sections renumbered after the deposits section was removed. |
| 404 / system pages | Light, shop voice, "Go to the shop". Gated marketplace paths render the lock, not a 404. |

---

## 10 · Commerce model constraints

- **No cart. Ever "CART (0)" appears, the output is wrong.** Direct pay per listing via Revolut (card / Apple Pay / Google Pay / Pay by Bank).
- **Deposits are removed (19 Aug 2026, Renato — see §13).** One price, paid in full. No holds, no instalments, no "balance due on collection" copy anywhere.
- **No instalment or buy-now-pay-later mark may appear until it actually processes a payment.** Klarna is wanted but not integrated: Revolut Merchant does not offer it, so it needs its own merchant account or a provider that resells it. A Klarna badge on a site that cannot take a Klarna payment is a false payment claim and a trademark misuse, and it belongs in the same bin as escrow and insured shipping.
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
- Colors: one light world — white #FFFFFF ground, ink #141414. Dark #141414
  only as a full-bleed editorial BAND inside a light page, never a whole
  screen and never the buying path. Single accent #E8742C (surgical).
  Champagne #C9A961 on DRIVE only.
- Type: Inter Tight headlines (never mono headlines), Newsreader ITALIC
  ONLY (max one phrase per screen), JetBrains Mono for labels/captions only.
- Wordmark: ÉIRVOX with É ACUTE — never È.
- No SIGN IN / REGISTER header buttons. No "sell your item" / "free to
  list". No invented nav items (no Collect, Stories, Services).
- Marketplace surfaces are light, curated, with tier pills and a mono
  "REGISTERED" mark — never a dark classifieds grid. The marketplace is
  LOCKED: one nav item marked "Soon", no category names, no dates, no counts.
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
| 19 Aug 2026 | **Direction reset.** The two-world architecture is retired; the public site is one light system, calibrated to carbondistrict.ie — white commerce with full-bleed dark editorial bands as punctuation. §1, §2, §3, §5, §6 and §9 amended accordingly; `brand/DESIGN-WORLDS.md` superseded (kept as history). The anti-flatten rule is void: a light wheels / DRIVE / checkout surface is now correct. Authorised by Renato. | LOCKED |
| 19 Aug 2026 | **Marketplace lock replaces total hiding.** One MARKETPLACE nav item, marked `Soon`, routes to `/marketplace` — a coming-soon page explaining the opening model with waitlist capture (`source='marketplace'`). Everything built stays built behind it; gated paths render the lock instead of a 404. Category names, dates and counts remain forbidden. Supersedes §2's "no nav items, no coming soon". Authorised by Renato. | LOCKED |
| 19 Aug 2026 | **DRIVE folded into the shop.** `/drive` and `/drive/:slug` are retired as surfaces; DRIVE is a collection at `/wheels#drive` plus one dark band. `DriveIndex.svelte` and `DriveIssue.svelte` deleted — the latter also cleared the orphaned pre-BUY-verb copy flagged in HANDOFF. Old `/drive` links redirect to the shop. Authorised by Renato. | LOCKED |
| 19 Aug 2026 | **Deposits removed.** One price, paid in full, on every house product. The deposit control, the Trust deposits section, the FAQ entry and all "balance on collection" copy are gone. Supersedes §10's deposit line and HANDOFF's "deposits ARE the launch commerce model". `listings.deposit_amount` and the server's deposit branch are untouched, so it reverts without a migration. Authorised by Renato. | LOCKED |
| 19 Aug 2026 | **Klarna requested, NOT integrated.** Revolut Merchant does not offer Klarna, so it needs a Klarna merchant account or a provider that resells it (Stripe / Mollie / Adyen), plus credentials and a webhook. Until a Klarna payment actually completes, no Klarna mark, badge, or "pay in 3" copy ships. Pending a provider decision from Renato. | OPEN |
| 20 Aug 2026 | **The site is DARK.** Reverses the 19 Aug light decision after Renato weighed it against carbondistrict.ie and immaperformance.com, both of which are dark. Implemented as a palette inversion on the tokens in `src/app.css`, not a rewrite: "paper" is still the page ground and "ink" still the text on it, whichever way round they sit. `.evx-dark` bands now LIFT rather than drop. **The product tile stays light**, because the photography is shot on light grounds and a dark tile would frame every wheel in a bright rectangle. Admin is pinned to the light palette via `.admin-shell`. Authorised by Renato. | LOCKED |
| 20 Aug 2026 | **Ambient motion permitted on the hero only.** §5 banned looping ambient motion; the hero now carries a drifting carbon field (two twill layers, a raking key, one ember of accent). Renato asked for it twice. Slow, low-contrast, CSS-only, and it stops dead under `prefers-reduced-motion`. The ban still holds everywhere else, and the one-time sweep and entrance are unchanged. | LOCKED |
| 20 Aug 2026 | **Catalogue cards follow the luxury grid pattern** (gucci.com): no card border, the image plate IS the card, product `contain`-fitted so it floats rather than crops, plain type beneath on the page ground, plate shifts tone on hover. Replaces the bordered card and the black SOLD OUT slab, which read dated. | LOCKED |
| 20 Aug 2026 | **The top chrome is pinned, and the trust strip is a ledger.** Renato: the top banner should stay with you as you scroll. The trust strip and the bar are now one sticky slab; the strip keeps its full height when the slab condenses, because staying readable is the point of pinning it. The strip itself is rebuilt as hairline-ruled cells with the locked origin line carrying full ink and the rest supporting it, dropping to two cells on a tablet and to the origin line alone below 460px. No mark and no icon: a leading orange square was tried and cut against this section's own drift check. Nav publishes the measured slab height as `--evx-chrome-height`, and the shop filter rail, the product buy panel and every in-page anchor sit under it. Authorised by Renato. | LOCKED |
| 20 Aug 2026 | **Favicon is the fox in fox orange.** Renato rejected the black fox. The mark is the real `symbol.png` artwork recoloured through a fox-orange ramp on transparency, at 16/32/48/192 plus a multi-size `.ico`, so it reads on a light tab bar and on a dark one. The 180px Apple tile is the only one with a ground (ink), because iOS flattens alpha onto its own and a black-on-black fox is what that gives you. `theme-color` follows the page to `#0A0A0A`. | LOCKED |
| 20 Aug 2026 | **No one-world rule. Light bands where the product lives.** Renato: too much black, and there is no one-world rule. The page ground stays dark; a full-bleed light band (`.evx-light` in `src/app.css`, a local token re-declaration like `.admin-shell`) carries the surfaces that are nothing but product photography — THE RANGE on the landing page, the catalogue grid on `/wheels`, and the product-page gallery, which becomes one lit slab holding the main shot and the thumbs instead of light plates floating in black. DRIVE stays dark: champagne only works on a dark ground. The band's tile sits one step below the band ground so the plate still reads as a plate. Supersedes §2's single-surface framing and the 20 Aug "the site is DARK" entry's exclusivity, not its palette. Authorised by Renato. | LOCKED |
| 20 Aug 2026 | **Nav no longer lights three links at once.** Wheels, DRIVE and Fitment all resolve to `/wheels`, and the `startsWith` active test turned all three fox orange on the shop — orange as decoration, which §2 bans. Only a plain link marks its section now; the two in-page anchor links never do, because there is no reliable way to know which one you are parked at. | LOCKED |
| 20 Aug 2026 | **The weave ground.** Renato: the whole site needs a weave. The product is 3K twill, so the page sits on carbon rather than on flat colour. `.evx-weave` in `src/app.css` pulls out the twill vocabulary the empty product tile and the hero field already used and pitches it far lower, so it is felt as material rather than read as a pattern. Two weights, because a weave that reads on near-black is invisible on paper: the ink weave is set in shadow, the paper weave in light. Grounds only, never over a photograph, or it becomes wallpaper. **Static, always** — a moving ground would be the looping ambient animation §5 bans. §3's "no new gradients" stands: this is the existing carbon utility extended, not a new device. Authorised by Renato. | LOCKED |
| 20 Aug 2026 | **Section rhythm is a scale, not a constant.** Every band breathed at the same 80px, which is why the site read as one long unbroken note: with no change of pace there is no emphasis, because emphasis is relative. Four steps — `--evx-rhythm-tight` / `-base` / `-loose` / `-epic`, all `clamp()`ed so the rhythm survives a laptop as well as a monitor. A band takes the step its job deserves: a utility strip is quiet, the merchandise gets room, the statement takes the floor. Never pick a step to fix a spacing accident. | LOCKED |
| 20 Aug 2026 | **Tonal sequence, and a third dark.** Renato: too much black, and he likes near-black meeting a lifted shade. Three dark steps now — `.evx-pit` #050505 for bands that need floor under them (DRIVE, the statement), the #0A0A0A page ground, and #141414 for a lifted band — alternating with the light product bands. The landing page runs dark, quiet dark, LIGHT, pit, dark, LIGHT, pit, quiet dark, so the ground changes seven times instead of once. `.evx-statement` is now purely typographic: ground comes from a band class and spacing from a rhythm class, so one thing owns each. | LOCKED |
| 20 Aug 2026 | **Type back inside §4.** Nine rules across `app.css`, `Home`, `ProductCard` and `WheelDetail` set Inter Tight at weight 600, over the 500 cap §4 has always specified. All corrected. Admin keeps its own weights: it is an internal tool on its own stylesheet, not a public surface. | LOCKED |
| — | (changelog continues here; one line per change, with reason) | |

**Drift check, run on every new design output:** banned phrases? · cart? · icons in trust strips? · mono headline? · upright serif? · orange decorating? · champagne off-DRIVE? · invented claims? · invented nav? · a dark band grown into a whole page or onto the buying path? · marketplace dates, counts or category names? — any YES = reject before evaluating aesthetics.
