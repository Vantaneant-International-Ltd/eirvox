-- ============================================================
-- ÉIRVOX v17 — Order persistence + new-message notifications
-- ============================================================
-- The web flow was: buyer pays Revolut → we never write anything to
-- our DB. That breaks order history, seller notifications, double-
-- booking prevention, and reconciliation. This migration:
--
-- 1. Extends the existing `reservations` table (which had the right
--    shape — just missing the Revolut linkage + a couple of fields).
-- 2. Locks the over-broad grants on reservations (7th recurrence of
--    the grant-hole pattern noted in HANDOFF migration rules).
-- 3. Adds two SECURITY DEFINER RPCs that the Edge Functions call:
--      record_order_created()  — payments-create-order calls this
--                                after Revolut returns an order id
--      complete_order()        — revolut-webhook calls this on
--                                ORDER_COMPLETED to flip the row +
--                                transition the listing.status
-- 4. Enables pg_net so a DB trigger can async-POST to the
--    message-notify Edge Function whenever a new message lands.
-- 5. Trigger on messages.INSERT → fire-and-forget POST.
-- ============================================================

BEGIN;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS revolut_order_id text,
  ADD COLUMN IF NOT EXISTS is_deposit boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS amount_paid_minor integer,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_revolut_order_id
  ON public.reservations(revolut_order_id) WHERE revolut_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_seller ON public.reservations(seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer  ON public.reservations(buyer_id,  status, created_at DESC);

REVOKE ALL ON public.reservations FROM anon, authenticated, public;
GRANT SELECT, INSERT, UPDATE ON public.reservations TO authenticated;

-- See live applied function bodies on the project; this file mirrors
-- what was applied via MCP as the audit trail.

CREATE OR REPLACE FUNCTION public.record_order_created(
  p_revolut_order_id  text,
  p_listing_id        uuid,
  p_buyer_email       text,
  p_buyer_profile_id  uuid,
  p_amount_eur        integer,
  p_is_deposit        boolean,
  p_fulfilment        text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_listing public.listings%ROWTYPE; v_id uuid; v_ref text;
BEGIN
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF v_listing IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  v_ref := 'EVX-' || to_char(now(), 'YY') || '-' || lpad(((random()*99999)::int)::text, 5, '0');
  INSERT INTO public.reservations (
    revolut_order_id, listing_id, seller_id, buyer_id, buyer_email,
    reference, status, is_deposit, item_price, deposit_amount, balance_amount,
    delivery_preference, reserved_at
  ) VALUES (
    p_revolut_order_id, p_listing_id, v_listing.seller_id, p_buyer_profile_id, p_buyer_email,
    v_ref, 'pending_deposit', p_is_deposit,
    v_listing.price,
    CASE WHEN p_is_deposit THEN p_amount_eur ELSE 0 END,
    GREATEST(v_listing.price - p_amount_eur, 0),
    p_fulfilment, now()
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_order_created(text, uuid, text, uuid, integer, boolean, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_order(p_revolut_order_id text, p_revolut_state text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_res public.reservations%ROWTYPE; v_new_status reservation_status; v_seller public.sellers%ROWTYPE; v_listing public.listings%ROWTYPE;
BEGIN
  SELECT * INTO v_res FROM public.reservations WHERE revolut_order_id = p_revolut_order_id;
  IF v_res IS NULL THEN RAISE EXCEPTION 'Reservation not found for revolut_order_id %', p_revolut_order_id; END IF;
  IF v_res.status IN ('completed','deposit_paid','cancelled','refunded') THEN
    RETURN jsonb_build_object('ok', true, 'already_processed', true, 'status', v_res.status);
  END IF;
  CASE p_revolut_state
    WHEN 'COMPLETED', 'AUTHORISED' THEN
      v_new_status := CASE WHEN v_res.is_deposit THEN 'deposit_paid'::reservation_status ELSE 'completed'::reservation_status END;
    WHEN 'CANCELLED', 'FAILED' THEN
      v_new_status := 'cancelled'::reservation_status;
    ELSE RAISE EXCEPTION 'Unhandled Revolut state %', p_revolut_state;
  END CASE;
  UPDATE public.reservations
    SET status = v_new_status,
        paid_at = CASE WHEN v_new_status IN ('deposit_paid','completed') THEN now() ELSE paid_at END,
        updated_at = now()
    WHERE id = v_res.id;
  IF v_new_status = 'deposit_paid' THEN
    UPDATE public.listings SET status = 'reserved' WHERE id = v_res.listing_id AND status = 'active';
  ELSIF v_new_status = 'completed' THEN
    UPDATE public.listings SET status = 'sold' WHERE id = v_res.listing_id AND status IN ('active','reserved');
  END IF;
  SELECT * INTO v_seller  FROM public.sellers  WHERE id = v_res.seller_id;
  SELECT * INTO v_listing FROM public.listings WHERE id = v_res.listing_id;
  RETURN jsonb_build_object(
    'ok', true, 'reservation_id', v_res.id, 'reference', v_res.reference,
    'status', v_new_status, 'is_deposit', v_res.is_deposit,
    'item_price', v_res.item_price, 'deposit_amount', v_res.deposit_amount,
    'balance_amount', v_res.balance_amount, 'buyer_email', v_res.buyer_email,
    'seller_email', v_seller.email, 'seller_name', v_seller.trading_name,
    'listing_id', v_listing.id, 'listing_title', v_listing.title, 'listing_slug', v_listing.slug,
    'delivery_preference', v_res.delivery_preference);
END; $$;

REVOKE EXECUTE ON FUNCTION public.complete_order(text, text) FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- See live function for the actual url + anon key (embedded — anon
-- key is public by design, fine to bake into a trigger).
CREATE OR REPLACE FUNCTION public._notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp, net, extensions
AS $$
DECLARE v_url text := 'https://arokrumaxjiidsqfpiii.supabase.co/functions/v1/message-notify';
        v_anon text := '<anon key — see live function>';
BEGIN
  PERFORM net.http_post(
    url := v_url,
    body := jsonb_build_object('message_id', NEW.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_anon, 'apikey', v_anon),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'message-notify dispatch failed: %', SQLERRM; RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_messages_notify ON public.messages;
CREATE TRIGGER trg_messages_notify
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._notify_new_message();

REVOKE EXECUTE ON FUNCTION public._notify_new_message() FROM PUBLIC, anon, authenticated;

COMMIT;
