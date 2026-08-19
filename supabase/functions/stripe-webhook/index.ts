// ============================================================
// POST /functions/v1/stripe-webhook
//
// Klarna payment outcomes. Mirrors revolut-webhook: verify the
// signature first, then mark the order through the same
// complete_order RPC, so both providers converge on one order state.
//
// Env:
//   STRIPE_WEBHOOK_SECRET   whsec_… from the Stripe dashboard endpoint
//
// Configure the endpoint in Stripe with these events:
//   checkout.session.completed
//   checkout.session.async_payment_succeeded   (Klarna settles async)
//   checkout.session.async_payment_failed
//   checkout.session.expired
//
// Klarna is an async method: checkout.session.completed can arrive
// with payment_status 'unpaid' while Klarna underwrites. Only
// 'paid' is treated as money received. Getting this wrong means
// shipping a wheel against a payment that never lands.
//
// This function must be deployed with --no-verify-jwt: Stripe cannot
// present a Supabase JWT. The signature check is the authentication.
// ============================================================

import { verifyWebhook } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';

interface StripeEvent {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  // Read the body as raw text: the signature covers the exact bytes,
  // so parsing before verifying would break the check.
  const rawBody = await req.text();
  const verified = await verifyWebhook(rawBody, req.headers.get('stripe-signature'));
  if (!verified.ok) {
    console.warn('[stripe-webhook] signature rejected:', verified.reason);
    return json(401, { ok: false, error: 'signature_invalid' });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return json(400, { ok: false, error: 'invalid_json' });
  }

  const type = event.type ?? '';
  const session = event.data?.object ?? {};
  const sessionId = typeof session.id === 'string' ? session.id : '';

  if (!sessionId) {
    console.warn('[stripe-webhook] event without a session id:', type);
    return json(200, { ok: true, ignored: 'no_session_id' });
  }

  // Map Stripe's session state onto the states complete_order already
  // understands from Revolut, so the admin views read the same either way.
  const paymentStatus = typeof session.payment_status === 'string' ? session.payment_status : '';
  let state: string | null = null;

  switch (type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      // Klarna can complete the checkout before the money is confirmed.
      state = paymentStatus === 'paid' ? 'COMPLETED' : 'PENDING';
      break;
    case 'checkout.session.async_payment_failed':
      state = 'FAILED';
      break;
    case 'checkout.session.expired':
      state = 'CANCELLED';
      break;
    default:
      // Stripe sends plenty we did not subscribe to. Acknowledge and
      // move on: a non-200 makes Stripe retry forever.
      return json(200, { ok: true, ignored: type });
  }

  const { data: result, error } = await supabaseAdmin.rpc('complete_order', {
    p_revolut_order_id: sessionId,
    p_revolut_state: state,
  });

  if (error) {
    console.error('[stripe-webhook] complete_order failed:', error.message, { sessionId, type, state });
    // 500 so Stripe retries: a dropped payment confirmation is worse
    // than a duplicate delivery of the same event.
    return json(500, { ok: false, error: 'persist_failed' });
  }

  console.log('[stripe-webhook] handled', { type, sessionId, state, result });
  return json(200, { ok: true });
});
