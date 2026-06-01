-- ============================================================
-- v12-drive-deposit-amounts.sql
--
-- Sets deposit_amount on the four DRIVE listings updated by
-- v11. Deposits are 10% of price, rounded to a clean number:
--
--   001 BMW (€500)   ->  €50
--   002 Audi (€600)  ->  €60
--   003 Merc (€600)  ->  €60
--   004 VW   (€549)  ->  €55
--
-- Why now and not flip-time: the rows are launch-ready once
-- deposit_amount is set; admin only needs to flip status to
-- 'active' and drive_issue_state to 'open' when stock lands.
-- One fewer field to remember to fill under time pressure.
-- Trivially editable later via the admin DRIVE block in
-- SellerEdit if costs shift.
--
-- Why 10% and not flat €49: a flat token on a €500-600 product
-- under-signals commitment and reads cheap next to a premium
-- item. 10% scales correctly, matches parts/car industry norms,
-- and rounds cleanly per wheel.
--
-- These rows stay status='draft', drive_issue_state='upcoming'
-- after v12. No buy path is exercised until admin flips them.
-- Even if a row were accidentally activated, depositConfigured
-- (deposit_amount > 0) just enables the deposit option in the
-- PayButton matrix -- it doesn't auto-charge anything.
--
-- Matched on drive_issue. NOT ON CONFLICT(slug) -- consistent
-- with v11's correctness reasoning (slug 002 was renamed and
-- an upsert would risk inserting a fifth row).
--
-- Only touches listings rows. No new tables / functions /
-- policies, so no REVOKE/GRANT block per the HANDOFF.md rule.
--
-- Idempotent: UPDATE on identical values is a no-op.
--
-- Apply: this file is committed for repo-as-record. Applying
-- is coordinated externally; I do not apply data changes
-- myself.
-- ============================================================


-- ── PRE-APPLY HYGIENE (run BEFORE applying) ──
--
-- 1. Confirm the four rows from v11 are present and priced:
--    SELECT drive_issue, title, price, deposit_amount, status,
--           drive_issue_state, stock_state
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;
--    -> 4 rows. price = 500 / 600 / 600 / 549.
--       deposit_amount = NULL on first run; the new values on re-run.
--
-- 2. Confirm the 10%-rounded values are still correct against
--    current price (if you've edited prices since v11, recompute
--    the deposits before applying):
--    SELECT drive_issue, price,
--           CASE drive_issue
--             WHEN '001' THEN 50
--             WHEN '002' THEN 60
--             WHEN '003' THEN 60
--             WHEN '004' THEN 55
--           END AS will_set_deposit_to,
--           round(price * 0.10) AS exactly_10_pct
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;
--    -> the will_set_deposit_to column should be within
--       one or two euros of exactly_10_pct. Big divergence
--       means price was changed since v11; rewrite v12 first.


BEGIN;

UPDATE public.listings SET deposit_amount = 50 WHERE drive_issue = '001';
UPDATE public.listings SET deposit_amount = 60 WHERE drive_issue = '002';
UPDATE public.listings SET deposit_amount = 60 WHERE drive_issue = '003';
UPDATE public.listings SET deposit_amount = 55 WHERE drive_issue = '004';

COMMIT;


-- =============================================================
-- Reload PostgREST schema cache
-- =============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ── POST-APPLY STATE CHECKS (run AFTER applying) ──
--
-- 1. All four have a deposit set:
--    SELECT drive_issue, price, deposit_amount,
--           round(deposit_amount * 100.0 / price, 1) AS pct_of_price
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;
--    -> 4 rows. pct_of_price ~ 10 (10.0, 10.0, 10.0, 10.0 for 50/60/60/55
--       against 500/600/600/549 -- the VW pct rounds to 10.0).
--
-- 2. Status still draft (we did NOT flip anything to active):
--    SELECT drive_issue, status, drive_issue_state, stock_state
--      FROM public.listings
--     WHERE drive_issue IN ('001','002','003','004')
--     ORDER BY drive_issue;
--    -> 4 rows, all draft / upcoming / incoming.
--
-- 3. Buyer-flow effect of having deposit_amount set on a still-draft
--    listing: NO change. status='draft' alone hides the PayButton.
--    When admin later flips to status='active' AND
--    drive_issue_state='open', the deposit option becomes selectable
--    in the matrix (collection-only) per the verified canDeposit /
--    mustDeposit logic in src/routes/ListingDetail.svelte and
--    src/routes/DriveIssue.svelte.
