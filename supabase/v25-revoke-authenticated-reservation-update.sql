-- v25 — Revoke authenticated UPDATE on reservations (order-state integrity).
--
-- Closes the RLS bypass where a signed-in buyer could PATCH their own reservation's
-- status/paid_at/item_price via PostgREST and self-mark it paid without paying
-- (reservations_buyer_update checks only buyer_id).
--
-- NOTE: `authenticated` holds a TABLE-LEVEL UPDATE grant on reservations, so a
-- column-level `REVOKE UPDATE (status, paid_at, item_price)` is a silent no-op
-- (you cannot revoke a column subset of a table grant). We therefore revoke the
-- table-level UPDATE entirely. There is no legitimate client-side writer of
-- reservations except the admin UI (src/lib/admin.ts) — all order-state changes go
-- through service-role edge functions (record_order_created / complete_order), which
-- are unaffected. service_role retains UPDATE.
--
-- SIDE EFFECT: the admin reservations UI (adminUpdateReservation) writes via the
-- authenticated client and will now get "permission denied". Admin order-state
-- changes must move to a service-role edge function / is_admin() RPC — hardening agenda.

revoke update on public.reservations from authenticated;
