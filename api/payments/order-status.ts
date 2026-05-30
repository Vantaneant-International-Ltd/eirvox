// ============================================================
// GET /api/payments/order-status?id=<revolut-order-id>
//
// Looks up a Revolut order and returns its public-safe state.
// Called by the /payment/return page after the buyer is bounced
// back from Revolut's hosted checkout.
//
// Doesn't store anything yet — for the v1 test loop we just read
// straight through to Revolut. Persistence (payments table) comes
// when listings start charging real money.
// ============================================================

import { getOrder, minorToEuros } from '../_lib/revolut';
import { ok, bad, oops } from '../_lib/supabase-admin';

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'GET' } });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id || !/^[a-zA-Z0-9-]{8,}$/.test(id)) {
    return bad('Missing or invalid order id.');
  }

  try {
    const order = await getOrder(id);
    return ok({
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
    return oops('Could not read order status.');
  }
}
