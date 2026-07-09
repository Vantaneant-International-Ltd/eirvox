// ============================================================
// GET /functions/v1/payments-order-status?session_id=<stripe_checkout_session_id>
// Server source of truth: reads the reservation status from our DB by
// Stripe Checkout session id. Called by /#/payment/return after the
// buyer comes back from Stripe. (More robust than trusting a PSP echo:
// the reservation is only 'completed'/'deposit_paid' once the verified
// stripe-webhook has run complete_order_stripe.)
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { supabaseAdmin, ok, bad, oops } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== 'GET') return bad(req, 'Method not allowed.');

  const url = new URL(req.url);
  const id = url.searchParams.get('session_id') ?? url.searchParams.get('id');
  if (!id || !/^[a-zA-Z0-9_-]{8,}$/.test(id)) return bad(req, 'Missing or invalid session_id.');

  try {
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('status, reference, item_price, deposit_amount, is_deposit, delivery_preference')
      .eq('stripe_session_id', id)
      .maybeSingle();
    if (error) return oops(req, 'Could not read order status.');
    if (!data) return ok(req, { ok: true, found: false, state: 'PENDING' });

    const paid = data.status === 'completed' || data.status === 'deposit_paid';
    return ok(req, {
      ok: true,
      found: true,
      state: paid ? 'COMPLETED' : data.status === 'cancelled' ? 'CANCELLED' : 'PENDING',
      reference: data.reference,
      amount_eur: data.is_deposit ? data.deposit_amount : data.item_price,
      is_deposit: data.is_deposit,
      delivery_preference: data.delivery_preference,
    });
  } catch {
    return oops(req, 'Could not read order status.');
  }
});
