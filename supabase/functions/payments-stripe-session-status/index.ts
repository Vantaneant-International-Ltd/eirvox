// ============================================================
// GET /functions/v1/payments-stripe-session-status?id=cs_…
//
// The Klarna equivalent of payments-order-status. Kept separate from
// that function so the Revolut return path is not touched.
//
// Returns only what the return page needs to show an honest state.
// Never trust the redirect itself: Stripe's success_url fires before
// Klarna has necessarily settled.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { getSession, stripeConfigured } from '../_shared/stripe.ts';
import { ok, bad, oops } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'GET') return bad(req, 'Method not allowed.');
  if (!stripeConfigured()) return bad(req, 'Klarna is not available yet.');

  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!id.startsWith('cs_') || id.length > 200) return bad(req, 'Invalid session id.');

  try {
    const session = await getSession(id);
    // Map onto the same vocabulary payments-order-status returns, so
    // the return page renders one set of states for both providers.
    const state =
      session.payment_status === 'paid'    ? 'COMPLETED' :
      session.status === 'expired'         ? 'CANCELLED' :
      session.payment_status === 'unpaid'  ? 'PENDING'   : 'PENDING';

    return ok(req, {
      ok: true,
      state,
      amount_eur: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
      provider: 'stripe_klarna',
    });
  } catch (err) {
    console.error('[stripe-session-status] failed:', err);
    return oops(req, 'Could not read the payment status.');
  }
});
