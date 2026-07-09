// ============================================================
// POST /functions/v1/stripe-webhook
// ============================================================
// Receives Stripe events. Verifies the signature against
// STRIPE_WEBHOOK_SECRET, then on a completed Checkout Session calls
// the complete_order_stripe RPC (atomic reservation + listing
// transition), and fires seller + buyer emails.
//
// FAIL-CLOSED (deliberately, unlike the retired Revolut webhook):
// if STRIPE_WEBHOOK_SECRET is not set, EVERY request is rejected with
// 500 — we never process an unverified event. A missing secret must
// break loudly, not silently trust the caller.
//
// verify_jwt MUST be false on this function (Stripe signs with its own
// signature header, not a Supabase JWT). Deploy with:
//   supabase functions deploy stripe-webhook --no-verify-jwt
// ============================================================

import { getStripe } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import { sendEmail } from '../_shared/email.ts';

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');

function eur(amountEur: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amountEur);
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // FAIL-CLOSED: no secret configured → refuse to process anything.
  if (!WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — rejecting (fail-closed).');
    return new Response(JSON.stringify({ ok: false, error: 'webhook_not_configured' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new Response(JSON.stringify({ ok: false, error: 'missing_signature' }), { status: 401 });

  const stripe = getStripe();
  let event;
  try {
    // Async variant uses SubtleCrypto (required on Deno) for HMAC verification.
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.warn('[stripe-webhook] signature verification failed:', (err as Error).message);
    return new Response(JSON.stringify({ ok: false, error: 'signature_invalid' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  // We only act on a paid Checkout Session. Other events are acknowledged
  // with 200 so Stripe doesn't retry.
  if (event.type !== 'checkout.session.completed' && event.type !== 'checkout.session.async_payment_succeeded') {
    return new Response(JSON.stringify({ ok: true, ignored: event.type }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  const session = event.data.object as {
    id: string;
    payment_status?: string;
    payment_intent?: string;
  };
  // Only treat truly-paid sessions as completions.
  if (session.payment_status && session.payment_status !== 'paid') {
    return new Response(JSON.stringify({ ok: true, ignored: `payment_status=${session.payment_status}` }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Atomic reservation + listing transition (idempotent; returns
  // { already_processed: true } if the reservation is already terminal).
  const { data: result, error } = await supabaseAdmin.rpc('complete_order_stripe', {
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id: session.payment_intent ?? null,
  });
  if (error) {
    console.error('[stripe-webhook] complete_order_stripe failed:', error);
    // 500 → Stripe retries (transient DB issue).
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
  const r = result as Record<string, unknown> | null;
  if (!r || r.already_processed) {
    return new Response(JSON.stringify({ ok: true, already_processed: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  // Notifications — never fail the webhook if email fails.
  await Promise.allSettled([
    r.seller_email
      ? sendEmail({
          to: String(r.seller_email),
          subject: `New order ${r.reference} · ${eur(Number(r.amount_paid ?? r.item_price))} · ${r.listing_title}`,
          html: `<p>You have a buyer for <strong>${r.listing_title}</strong>. Open your seller dashboard: https://eirvox.ie/#/sell/dashboard</p>`,
          text: `New order ${r.reference} — ${r.listing_title}. Buyer: ${r.buyer_email}. https://eirvox.ie/#/sell/dashboard`,
          from: 'ÉIRVOX <orders@eirvox.ie>',
        })
      : Promise.resolve(),
    r.buyer_email
      ? sendEmail({
          to: String(r.buyer_email),
          subject: `Order ${r.reference} confirmed`,
          html: `<p>Order <strong>${r.reference}</strong> confirmed. ${r.seller_name ?? 'The seller'} will be in touch to arrange ${r.delivery_preference === 'delivery' ? 'delivery' : 'collection'}.</p>`,
          text: `Order ${r.reference} confirmed. For help: support@eirvox.ie`,
          from: 'ÉIRVOX <orders@eirvox.ie>',
        })
      : Promise.resolve(),
  ]);

  return new Response(JSON.stringify({ ok: true, reservation_id: r.reservation_id }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
