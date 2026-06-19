# ÉIRVOX — The two worlds

**Status: canonical.** The lockfile (`DIRECTION-LOCKFILE.md` §2), `CLAUDE.md`, and
`HANDOFF.md` all defer to this file for the *why*. If you are about to make a
wheels / DRIVE / checkout surface light, or a marketplace / reading surface dark,
read this first.

---

## The decision, in one line

ÉIRVOX runs **two visual worlds** — a **Dark World** (product theatre) and a
**Paper World** (reading + marketplace utility) — joined by **one shared
nav/footer skeleton** that carries across both. This is **deliberate**. It is not
an inconsistency to be "tidied up" into a single palette.

## Why two worlds (the feeling)

ÉIRVOX runs on two beats — **trust** and **desire** (see `EMOTIONAL-BIBLE.md`).
The two worlds are those two beats made visual:

- **Dark World — desire.** Where the object is sacred and lit: the house wheels
  (DRIVE + BMW fitted), the fitment ritual, the buy/checkout. Low-key cinematic;
  light is the only ornament; one idea per screen. It exists to awaken the want —
  the held breath before "I didn't know I wanted that."
- **Paper World — trust.** Daylight: browsing the curated marketplace, reading
  About / Trust / legal, seller and account utility. Editorial density; words and
  tools. It exists to deliver calm, legible trust and let people work.

Two rooms, one house. The point of contrast is the product: stepping from the
daylight marketplace into the dark product theatre should *feel* like the object
matters more there. Flatten the worlds and you lose that — the wheels stop
feeling sacred and the marketplace stops feeling like daylight.

## The map — which route is which world

**Dark World**
- `/` — homepage (house-led front door)
- `/wheels`, `/wheels/:slug` — wheel catalogue + detail
- `/drive`, `/drive/:slug` — DRIVE index + issues
- the fitment finder (WheelFinder)
- `/sell` — seller recruitment (house-front)
- `/payment/return` — checkout / pay state
- 404, coming-soon, maintenance

**Paper World**
- `/search` + category pages (`/cars`, `/watches`, …) — marketplace browse
- `/listing/:slug` — marketplace listing
- seller flows: `/sell/apply`, `/sell/create`, `/sell/dashboard`, `/sell/edit/*`
- TRADE: `/trade`, `/trade/apply`, `/trade/:category`, `/trade/:category/:slug`
- `/about`, `/trust`, legal set (`/terms`, `/privacy`, `/cookies`, …)
- `/account/*`, `/messages/*` (currently gated; Paper when live)

**Rule of thumb:** house product + the buying ritual = **Dark**. Marketplace
browsing + reading/utility = **Paper**.

## Commerce model differs by world (why the verbs differ)

The two worlds are also two **commerce models** — this is *why* the buying verbs
differ, and it is deliberate:

- **Dark World = the ÉIRVOX shop.** House products (the DRIVE line, the fitted
  wheels) at a **set price**. Verbs: **Pay** and **Enquire** only. No offers, no
  haggling, no "Make an offer" / "Message seller" / "Express interest" — the price
  is the price.
- **Paper World = the marketplace.** A real classifieds-style market (think
  DoneDeal / Adverts): listings carry a genuine **offer + messaging** system and
  buyers negotiate with sellers. ÉIRVOX sells here too, but as **one seller among
  many, not at a fixed house price**. **"Make an offer" and "Message seller" are
  correct and expected here — they are NOT banned-verb violations.**

So the voice rule "no Express Interest / Message seller / Make an offer" applies
**only to fixed-price house products** (Dark World). On the marketplace those verbs
*are* the product. A wording audit must **not** strip them from `/listing/:slug`
or the messaging surfaces.

(A house product that is gated and still carries pre-BUY-verb copy — e.g.
DriveIssue's "Express interest" — must get the Pay/Enquire pass *before* it
un-gates. That is a real fix, not an exception to this rule.)

## The seam bridge — why it doesn't feel like two sites

The **Nav and Footer are one shared skeleton** (same structure, spacing,
wordmark, payment marks); only the surface tokens swap via a `dark` prop. Fox
orange behaves identically in both worlds. So crossing dark home → paper
marketplace reads as one company walking you between rooms, not two sites.
Crossing worlds on a click is the *intended* boundary, never a bug.

## ⚠️ Do NOT flatten the worlds (regression history)

A "white two-tone" rework (commit `7620fb2`, June 2026) once flattened the
Dark-World surfaces to white. That is exactly what produced, in the 19–20 June
2026 dark relaunch:

- the **black → white → black** journey (dark home → *white* DRIVE index → dark
  detail), and
- a **white `/wheels`** that also leaked the entire marketplace (tech, fashion)
  into the wheel catalogue.

Both were re-darkened and re-scoped on **20 June 2026**. **If you find a wheels /
DRIVE / checkout surface rendering white, it has been flattened — restore it to
Dark; do not make the rest white to match.**

## Customer-facing

Customers never see the words "Dark World / Paper World" — that is internal
vocabulary. Any public expression of the idea is in plain brand language only
(there is one tasteful line on `/about`).

## Authorised exceptions (mirrors the lockfile decision log)

- **19 Jun 2026** — homepage may render Dark as a house-led front door, including
  marketplace + TRADE *teaser* sections; the marketplace/TRADE *detail* surfaces
  stay Paper.
- **19 Jun 2026** — Dark extended to **Sell** (house-front recruitment); the
  browse/transact marketplace stays Paper.

Changes to the two-world model require a written decision from Renato, recorded
in the lockfile decision log **and** reflected here.
