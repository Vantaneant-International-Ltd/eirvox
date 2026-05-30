// ============================================================
// POST /api/payments/create-order
//
// Creates a Revolut order and returns both the hosted checkout_url
// (full-redirect flow) and the public token (embedded Checkout JS
// popup flow). Caller picks which to use.
//
// Body (all optional):
//   amount_eur     numeric. Default 1 (admin €1 self-test).
//   description    free text shown on the Revolut checkout.
//   metadata       Record<string, string> attached to the order.
//   redirect_path  defaults to /#/payment/return. Joined to the
//                  request Origin so the buyer lands back on our
//                  site. Only used by the redirect path; popup
//                  flow ignores it.
//
// Rate-limited via the existing Upstash 'waitlist' bucket — cheap
// defence against accidental click-spam burning Revolut quota.
// ============================================================

import { createOrder, eurosToMinor } from '../_lib/revolut';
import { ok, bad, oops, readJson } from '../_lib/supabase-admin';
import { rateLimit, rateLimitResponse } from '../_lib/ratelimit';

export const config = { runtime: 'edge' };

interface Body {
  amount_eur?: number;
  description?: string;
  metadata?: Record<string, string>;
  redirect_path?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = (await readJson<Body>(req)) ?? {};
  const amountEur = typeof body.amount_eur === 'number' && body.amount_eur > 0 ? body.amount_eur : 1;
  const description = (typeof body.description === 'string' && body.description.trim())
    ? body.description.trim().slice(0, 200)
    : 'ÉIRVOX';
  const redirectPath = (typeof body.redirect_path === 'string' && body.redirect_path.startsWith('/'))
    ? body.redirect_path
    : '/#/payment/return';

  // Sanitise metadata: string values only, cap counts and lengths so a
  // misuse can't push huge payloads into Revolut.
  const metadata: Record<string, string> = { amount_eur: String(amountEur) };
  if (body.metadata && typeof body.metadata === 'object') {
    let count = 0;
    for (const [k, v] of Object.entries(body.metadata)) {
      if (count >= 8) break;
      if (typeof v !== 'string') continue;
      metadata[k.slice(0, 40)] = v.slice(0, 200);
      count++;
    }
  }

  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  let cleanOrigin = '';
  try {
    cleanOrigin = origin ? new URL(origin).origin : '';
  } catch {
    cleanOrigin = '';
  }
  const redirectUrl = cleanOrigin ? `${cleanOrigin}${redirectPath}` : undefined;

  try {
    const order = await createOrder({
      amount: eurosToMinor(amountEur),
      currency: 'EUR',
      description,
      merchant_order_ext_ref: `evx-${Date.now()}`,
      redirect_url: redirectUrl,
      metadata,
    });

    // Revolut returns the embed-checkout token in `token` (newer API)
    // or `public_id` (older). Surface whatever's present so the client
    // can feed Revolut Checkout JS.
    const token = order.token ?? (order as unknown as { public_id?: string }).public_id ?? null;

    if (!order.checkout_url && !token) {
      console.error('[create-order] Revolut returned no checkout_url or token', order);
      return oops('Revolut returned no checkout URL or token.');
    }

    return ok({
      ok: true,
      order_id: order.id,
      token,
      checkout_url: order.checkout_url,
    });
  } catch (err) {
    console.error('[create-order] failed:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return bad(msg.slice(0, 280));
  }
}
