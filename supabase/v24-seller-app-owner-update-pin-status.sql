-- v24-seller-app-owner-update-pin-status.sql
--
-- Purpose: pin status in the WITH CHECK of seller_applications_owner_update.
-- Currently USING restricts updates to the applicant's own pending row, but
-- WITH CHECK pins only profile_id, so an applicant can set status to any value
-- (e.g. 'approved') on their own pending application. This is not a privilege
-- escalation (becoming a seller requires the admin-gated approve_seller_application()
-- RPC, which inserts into sellers), but it lets an applicant mutate workflow state.
--
-- Fix: WITH CHECK gains "and status = 'pending'", so an applicant can edit their
-- own pending application but cannot change its status. USING is left unchanged.
--
-- Not applied automatically. Apply via the dashboard or migration flow.

alter policy "seller_applications_owner_update" on public.seller_applications
  with check (
    (profile_id is not null)
    and (profile_id = auth.uid())
    and (status = 'pending'::seller_application_status)
  );
