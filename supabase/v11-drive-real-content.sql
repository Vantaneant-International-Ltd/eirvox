-- ============================================================
-- v11-drive-real-content.sql
--
-- Replaces v06 placeholder DRIVE content with the real wheel
-- products from the four supplier spec PDFs (Atlas Refreshments,
-- 2026). Each of the four existing DRIVE rows is matched on
-- drive_issue (NOT slug) and updated in place. Issue 002 also
-- has its slug renamed from "002-porsche-911-gt3" (placeholder)
-- to "002-audi-8v-b9-rs" (real product).
--
-- Decision B: listings stay status='draft', drive_issue_state=
-- 'upcoming', stock_state='incoming'. They become VISIBLE on
-- the DRIVE index as upcoming issues but the buy path is not
-- exercised (drafts have no PayButton). Admin flips to
-- status='active', drive_issue_state='open' when stock lands,
-- via the DRIVE block in SellerEdit (commit d46de99).
--
-- deposit_amount stays NULL across all four. Per the spec
-- decision: deposit-and-full both intended at launch, deposits
-- collection-only per the existing PayButton matrix, but the
-- exact deposit figure is TBD. Admin sets it before flipping
-- to active. Until then, even if a row were accidentally
-- activated, the PayButton's depositConfigured check
-- (deposit_amount > 0) keeps the deposit option hidden, so
-- buyers can only pay in full.
--
-- Buyer-flow enforcement verified at the same time as writing
-- this file (commit ec2c44f's predecessor work):
--   * deposit only when fulfilment='collection' (canDeposit)
--   * delivery auto-flips isDeposit off (reactive guard)
--   * server refuses deposit+delivery (api/payments/create-order.ts)
--   * incoming + collection forces deposit (mustDeposit)
--   * incoming + delivery allows full payment (delivery follows arrival)
--
-- Common config for all four:
--   status                  = 'draft'        (not purchasable yet)
--   drive_issue_state       = 'upcoming'     (DRIVE index renders as upcoming)
--   stock_state             = 'incoming'     (~3 weeks out at seed time)
--   drive_made_count        = 10
--   drive_remaining_count   = 10             (full allocation at launch)
--   drive_issue_date        = 'Arriving June MMXXVI'  (soft display string, no exact date)
--   collection_available    = true
--   shipping_available      = true
--   shipping_cost           = 20             (€20 An Post default, matches v07)
--   deposit_amount          = NULL           (admin sets at activation; see above)
--
-- This migration only touches existing rows in public.listings.
-- No new tables, no new functions, no grant block needed --
-- listings table grants were set by v04/v05 and are not
-- changed here. See HANDOFF.md "Migration rules" for the
-- standing pattern (REVOKE+GRANT on every new object).
--
-- Idempotent: re-running re-applies the same field values to
-- the same rows; UPDATE on identical values is a no-op.
--
-- Apply: this file is committed for repo-as-record. Applying
-- is coordinated externally; I do not apply data changes
-- myself.
-- ============================================================


-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- 1. Confirm exactly 4 DRIVE rows match issues 001-004:
--    SELECT drive_issue, slug, title, status
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;
--    -> expect 4 rows on first run, slugs:
--       001-bmw-m3-competition
--       002-porsche-911-gt3            (will be renamed to 002-audi-8v-b9-rs)
--       003-mercedes-amg-gt
--       004-volkswagen-golf-r
--
-- 2. Confirm the target slug for the 002 rename is free
--    (no row OTHER than the drive_issue='002' row holds it,
--    which would block the rename via UNIQUE on slug):
--    SELECT slug, drive_issue
--      FROM public.listings
--     WHERE slug = '002-audi-8v-b9-rs'
--       AND drive_issue IS DISTINCT FROM '002';
--    -> expect 0 rows. First run: 0. Re-runs: still 0 (the row
--       holding the new slug IS drive_issue='002', which the
--       filter excludes).
--
-- 3. Snapshot pre-apply state for diffing:
--    SELECT drive_issue, slug, title, price, original_price,
--           status, drive_issue_state, stock_state,
--           drive_made_count, drive_remaining_count,
--           deposit_amount, shipping_cost
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;


BEGIN;


-- =============================================================
-- §1  Issue 001 -- BMW F Chassis M Sport
-- =============================================================
-- Source: BMW F Chassis Steering Wheel Spec PDF.
-- Slug unchanged (existing 001-bmw-m3-competition already aligns
-- with the F80 M3 PRIMARY fitment).

UPDATE public.listings
   SET title                 = 'BMW M Sport Carbon Steering Wheel',
       subtitle              = 'F30 / F80 M3 / F82 M4 · Carbon · Alcantara · LED',
       description           = 'OEM-shape M Sport flat-bottom, three-spoke. Gloss 2x2 twill carbon on the top rim, lower flat section, and all three spokes. Black alcantara grips, smooth finish.

LED strip at twelve o''clock displays RPM, gear, speed (KM/H), shift lights, 0-100 timer, coolant and oil temperatures across a minimum of nine selectable colours. Large black aluminium paddle shifters. OEM M Sport multifunction controls with chrome accents: M1, M2, RES and cruise scroll on the left spoke; MODE, phone, voice and scroll wheel on the right. M tri-colour stripe at the base of the lower carbon spoke.

Airbag module included. Plug-and-play with the original BMW connector; no cutting wires.

Primary fit: F30/F31, F80 M3, F82/F83 M4. Also compatible with F20/F21 1 Series, F22/F23 2 Series, F32/F33/F36 4 Series, F87 M2, F10/F11 5 Series LCI, F06/F12/F13 6 Series, F15 X5, F16 X6, F25 X3 LCI, F26 X4.',
       price                 = 500,
       original_price        = 649,
       status                = 'draft',
       drive_issue_state     = 'upcoming',
       stock_state           = 'incoming',
       drive_made_count      = 10,
       drive_remaining_count = 10,
       drive_issue_date      = 'Arriving June MMXXVI',
       deposit_amount        = NULL,
       collection_available  = true,
       shipping_available    = true,
       shipping_cost         = 20
 WHERE drive_issue = '001';


-- =============================================================
-- §2  Issue 002 -- Audi 8V/B9 RS  (slug rename from Porsche)
-- =============================================================
-- Source: Audi 8V B9 Steering Wheel Spec PDF.
-- The existing 002-porsche-911-gt3 slug is a v06 placeholder and
-- does not correspond to any real product; rename to match the
-- Audi spec actually being produced. UNIQUE(slug) pre-check is
-- in the hygiene block above.

UPDATE public.listings
   SET slug                  = '002-audi-8v-b9-rs',
       title                 = 'Audi RS-Style Carbon Steering Wheel',
       subtitle              = '8V RS3 / B9 RS4 / B9 RS5 · Carbon · Alcantara · LED',
       description           = 'R8 / RS-style flat-bottom, three-spoke. Gloss 2x2 twill carbon on the top rim, lower flat section, and all three spokes. Black alcantara grips with red contrast stitching.

LED strip at twelve o''clock displays RPM, shift lights, speed (KM/H), 0-100 timer, coolant and oil temperatures across a minimum of nine selectable colours. Large black aluminium paddle shifters. OEM Audi RS multifunction controls: VIEW, OK and scroll wheel on the left spoke; NAV, phone and volume scroll on the right. Drive Select rotary on the lower-left; red engine start/stop on the lower-right. Small red RS badge on the lower carbon spoke.

Airbag module with the chrome four-rings badge included. Plug-and-play with the original Audi connector; no cutting wires.

Primary fit: A3/S3/RS3 8V (2012-2020), A4/S4/RS4 B9 (2015-2023), A5/S5/RS5 B9 (2016-2023). Also compatible with Q5/SQ5 FY, Q7 4M, TT/TTS/TTRS 8S, R8 4S, Q2 GA.',
       price                 = 600,
       original_price        = 649,
       status                = 'draft',
       drive_issue_state     = 'upcoming',
       stock_state           = 'incoming',
       drive_made_count      = 10,
       drive_remaining_count = 10,
       drive_issue_date      = 'Arriving June MMXXVI',
       deposit_amount        = NULL,
       collection_available  = true,
       shipping_available    = true,
       shipping_cost         = 20
 WHERE drive_issue = '002';


-- =============================================================
-- §3  Issue 003 -- Mercedes W205
-- =============================================================
-- Source: Mercedes W205 Steering Wheel Spec v2 PDF.
-- Slug unchanged (existing 003-mercedes-amg-gt aligns with the
-- ALSO COMPATIBLE: AMG GT C190 fitment in the spec).

UPDATE public.listings
   SET title                 = 'Mercedes W205 Carbon Steering Wheel',
       subtitle              = 'C43 / C63 / C63S W205 · Carbon · Alcantara · LED',
       description           = 'AMG-style flat-bottom, three-spoke. Gloss 2x2 twill carbon on the top rim, lower flat section, and all three spokes. The lower carbon spoke is left clean -- no AMG badge, no text. Black alcantara grips with red contrast stitching.

LED strip at twelve o''clock displays RPM, shift lights, speed, 0-100 timer, coolant and oil temperatures across a minimum of nine selectable colours. Black aluminium paddle shifters. Mercedes multifunction controls -- cruise and driver assist on the left spoke; media, phone and voice on the right -- with chrome scroll wheels. Airbag cover carries the chrome Mercedes star only, no AMG text.

Airbag module included. Plug-and-play with the original Mercedes connector; no cutting wires.

Primary fit: C43/C63/C63S W205 (2015-2021). Also compatible with E63/E63S W213 pre-facelift, S63/S65 W222, A45 W176, CLA45 C117, GLA45 X156, GLC43/GLC63 X253/C253, AMG GT C190 (2015-2018), and W205 / W213 non-AMG variants as an upgrade fitment.',
       price                 = 600,
       original_price        = 649,
       status                = 'draft',
       drive_issue_state     = 'upcoming',
       stock_state           = 'incoming',
       drive_made_count      = 10,
       drive_remaining_count = 10,
       drive_issue_date      = 'Arriving June MMXXVI',
       deposit_amount        = NULL,
       collection_available  = true,
       shipping_available    = true,
       shipping_cost         = 20
 WHERE drive_issue = '003';


-- =============================================================
-- §4  Issue 004 -- VW Golf MK7/MK7.5 GTI
-- =============================================================
-- Source: VW MK7 Steering Wheel Spec PDF.
-- Slug unchanged (existing 004-volkswagen-golf-r aligns with the
-- PRIMARY fitment Golf MK7/MK7.5 GTI/GTD/GTE/R).

UPDATE public.listings
   SET title                 = 'VW Golf MK7 Carbon Steering Wheel',
       subtitle              = 'MK7 / MK7.5 GTI / R · Carbon · Alcantara · LED',
       description           = 'OEM Golf MK7 GTI flat-bottom, three-spoke. Gloss 2x2 twill carbon on the top rim, lower flat section, and all three spokes. Black alcantara grips with red contrast stitching. Gloss black VW badge on the airbag cover.

LED strip at twelve o''clock displays RPM, shift lights, speed, 0-100 timer, coolant and oil temperatures across a minimum of nine selectable colours. Satin silver DSG-type aluminium paddle shifters. GTI / R multifunction buttons -- cruise control on the left spoke, media and phone on the right -- matching the original VW GTI layout.

Airbag module included. Plug-and-play with the original VW four-pin connector; no cutting wires.

Primary fit: Golf MK7 (2013-2017) and MK7.5 (2017-2020), GTI/GTD/GTE/R. Also compatible with Polo GTI (2015-2020), Scirocco (2014-2018), Passat B8 R-Line (2015+), Tiguan R-Line (2016+), T-Roc R-Line (2017+), Jetta GLI (2015-2020), Arteon R-Line (2017+).',
       price                 = 549,
       original_price        = 599,
       status                = 'draft',
       drive_issue_state     = 'upcoming',
       stock_state           = 'incoming',
       drive_made_count      = 10,
       drive_remaining_count = 10,
       drive_issue_date      = 'Arriving June MMXXVI',
       deposit_amount        = NULL,
       collection_available  = true,
       shipping_available    = true,
       shipping_cost         = 20
 WHERE drive_issue = '004';


COMMIT;


-- =============================================================
-- §5  Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- 1. All four updated, with new titles + prices + status=draft +
--    drive_issue_state=upcoming + counts=10/10 + slug rename:
--    SELECT drive_issue, slug, title, price, original_price,
--           status, drive_issue_state, stock_state,
--           drive_made_count, drive_remaining_count,
--           deposit_amount, drive_issue_date, shipping_cost
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;
--    -> 4 rows:
--       001 | 001-bmw-m3-competition       | BMW M Sport Carbon Steering Wheel    | 500 | 649 | draft | upcoming | incoming | 10 | 10 | NULL | Arriving June MMXXVI | 20
--       002 | 002-audi-8v-b9-rs            | Audi RS-Style Carbon Steering Wheel  | 600 | 649 | draft | upcoming | incoming | 10 | 10 | NULL | Arriving June MMXXVI | 20
--       003 | 003-mercedes-amg-gt          | Mercedes W205 Carbon Steering Wheel  | 600 | 649 | draft | upcoming | incoming | 10 | 10 | NULL | Arriving June MMXXVI | 20
--       004 | 004-volkswagen-golf-r        | VW Golf MK7 Carbon Steering Wheel    | 549 | 599 | draft | upcoming | incoming | 10 | 10 | NULL | Arriving June MMXXVI | 20
--
-- 2. Old Porsche slug is gone:
--    SELECT 1 FROM public.listings WHERE slug = '002-porsche-911-gt3';
--    -> 0 rows
--
-- 3. No duplicate DRIVE rows (sanity check the UPDATE didn't
--    accidentally land twice):
--    SELECT drive_issue, count(*) FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     GROUP BY drive_issue ORDER BY drive_issue;
--    -> 4 rows each with count=1
--
-- 4. DRIVE index page (/#/drive) should now show 4 issues
--    rendered as UPCOMING with the new product titles. The DRIVE
--    issue detail pages (/#/drive/<slug>) should render the new
--    descriptions. No PayButton appears (status=draft +
--    drive_issue_state=upcoming gates it off).
--
-- 5. Admin path: open each in /#/admin/listings -> Edit listing
--    -> the new DRIVE block in SellerEdit (commit d46de99)
--    shows all 5 editorial fields populated. Fill deposit_amount,
--    flip drive_issue_state to 'open' and status to 'active' when
--    stock lands; that's the activation. Verify the PayButton's
--    deposit-only-on-collection enforcement (verified in code:
--    canDeposit gate, server refusal for deposit+delivery,
--    mustDeposit on incoming+collection) before public launch.
