// ============================================================
// GET /functions/v1/payments-order-status?id=<revolut-order-id>
// Public-safe pass-through to Revolut's order lookup.
// Called by /payment/return after the buyer comes back.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { getOrder, minorToEuros } from '../_shared/revolut.ts';
import { ok, bad, oops } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'GET') return bad(req, 'Method not allowed.');

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id || !/^[a-zA-Z0-9-]{8,}$/.test(id)) {
    return bad(req, 'Missing or invalid order id.');
  }

  try {
    const order = await getOrder(id);
    return ok(req, {
      ok: true,
      id: order.id,
      state: order.state,
      amount_eur: minorToEuros(order.amount),
      currency: order.currency,
      created_at: order.created_at,
      updated_at: order.updated_at,
      description: (order.metadata && order.metadata.amount_eur) ? order.metadata : undefined,
    });
  } catch (err) {
    console.error('[order-status] failed:', err);
    return oops(req, 'Could not read order status.');
  }
});
