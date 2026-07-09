-- v26 — Stripe payments (replaces Revolut). TEMPLATE: apply at cutover, NOT before.
--
-- Adds Stripe order columns + RPCs mirroring the retired Revolut ones, then tears
-- down the Revolut column/RPCs. All order-state writes remain service-role only
-- (see v25: authenticated has no UPDATE on reservations).
--
-- Apply (after STRIPE_* secrets are set and the edge functions deployed):
--   supabase db execute -f supabase/v26-stripe-payments.sql   (or via the SQL editor)

-- ── columns ────────────────────────────────────────────────
alter table public.reservations add column if not exists stripe_session_id text unique;
alter table public.reservations add column if not exists stripe_payment_intent_id text;

-- ── record a pending reservation when a Checkout Session is created ──
create or replace function public.record_order_created_stripe(
  p_stripe_session_id text,
  p_listing_id uuid,
  p_buyer_email text,
  p_buyer_profile_id uuid,
  p_amount_eur integer,
  p_is_deposit boolean,
  p_fulfilment text,
  p_variant_style_key text default null,
  p_variant_family_key text default null
) returns uuid
  language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_listing public.listings%rowtype; v_variant public.listing_variants%rowtype; v_id uuid; v_ref text;
begin
  select * into v_listing from public.listings where id = p_listing_id;
  if v_listing is null then raise exception 'Listing not found'; end if;
  if p_variant_style_key is not null and p_variant_family_key is not null then
    select * into v_variant from public.listing_variants
      where listing_id = p_listing_id and style_key = p_variant_style_key and family_key = p_variant_family_key;
    if v_variant is null then raise exception 'Variant not found'; end if;
    if v_variant.stock_count <= 0 then raise exception 'Variant sold out' using errcode='P0001'; end if;
  end if;
  v_ref := 'EVX-' || to_char(now(),'YY') || '-' || lpad(((random()*99999)::int)::text,5,'0');
  insert into public.reservations (
    stripe_session_id, listing_id, seller_id, buyer_id, buyer_email, reference, status, is_deposit,
    item_price, deposit_amount, balance_amount, delivery_preference, reserved_at,
    variant_id, variant_style_key, variant_style_label, variant_family_key, variant_price_delta_eur
  ) values (
    p_stripe_session_id, p_listing_id, v_listing.seller_id, p_buyer_profile_id, p_buyer_email, v_ref, 'pending_deposit', p_is_deposit,
    v_listing.price, case when p_is_deposit then p_amount_eur else 0 end, greatest(v_listing.price - p_amount_eur, 0), p_fulfilment, now(),
    v_variant.id, v_variant.style_key, v_variant.style_label, v_variant.family_key, coalesce(v_variant.price_delta_eur,0)
  ) returning id into v_id;
  return v_id;
end; $$;

-- ── complete an order on a verified Stripe webhook ──────────
create or replace function public.complete_order_stripe(
  p_stripe_session_id text,
  p_stripe_payment_intent_id text default null
) returns jsonb
  language plpgsql security definer set search_path to 'public','pg_temp'
as $$
declare v_res public.reservations%rowtype; v_new_status reservation_status; v_seller public.sellers%rowtype; v_listing public.listings%rowtype;
begin
  select * into v_res from public.reservations where stripe_session_id = p_stripe_session_id;
  if v_res is null then raise exception 'Reservation not found for stripe_session_id %', p_stripe_session_id; end if;
  if v_res.status in ('completed','deposit_paid','cancelled','refunded') then
    return jsonb_build_object('ok', true, 'already_processed', true, 'status', v_res.status);
  end if;
  v_new_status := case when v_res.is_deposit then 'deposit_paid'::reservation_status else 'completed'::reservation_status end;
  update public.reservations
     set status = v_new_status, paid_at = now(), stripe_payment_intent_id = coalesce(p_stripe_payment_intent_id, stripe_payment_intent_id), updated_at = now()
   where id = v_res.id;
  if v_res.variant_id is not null and v_res.variant_decremented_at is null then
    perform public.decrement_variant_stock(v_res.listing_id, v_res.variant_style_key, v_res.variant_family_key);
    update public.reservations set variant_decremented_at = now() where id = v_res.id;
  end if;
  if v_new_status = 'deposit_paid' then
    update public.listings set status = 'reserved' where id = v_res.listing_id and status = 'active';
  else
    update public.listings set status = 'sold' where id = v_res.listing_id and status in ('active','reserved');
  end if;
  select * into v_seller from public.sellers where id = v_res.seller_id;
  select * into v_listing from public.listings where id = v_res.listing_id;
  return jsonb_build_object('ok', true, 'reservation_id', v_res.id, 'reference', v_res.reference, 'status', v_new_status,
    'is_deposit', v_res.is_deposit, 'item_price', v_res.item_price, 'amount_paid', case when v_res.is_deposit then v_res.deposit_amount else v_res.item_price end,
    'buyer_email', v_res.buyer_email, 'seller_email', v_seller.email, 'seller_name', v_seller.trading_name,
    'listing_title', v_listing.title, 'delivery_preference', v_res.delivery_preference);
end; $$;

-- ── Revolut teardown (strip all Revolut mentions) ──────────
drop function if exists public.complete_order(text, text);
drop function if exists public.record_order_created(text, uuid, text, uuid, integer, boolean, text);
drop function if exists public.record_order_created(text, uuid, text, uuid, integer, boolean, text, text, text);
alter table public.reservations drop column if exists revolut_order_id;
