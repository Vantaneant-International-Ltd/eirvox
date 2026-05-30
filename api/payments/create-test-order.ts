// ============================================================
// POST /api/payments/create-test-order
//
// Creates a €1 Revolut order to validate the live integration
// end-to-end. Returns { checkout_url, order_id }.
//
// Body (all optional): { amount_eur, description, redirect_path }
//   amount_eur     defaults to 1
//   description    defaults to "ÉIRVOX live test charge"
//   redirect_path  defaults to /#/payment/return — joined to the
//                  Origin header so the buyer lands back on our site
//
// Rate-limited via the existing Upstash limiter (waitlist bucket —
// cheap defence against accidental click-spam burning Revolut quota).
// ============================================================

import { createOrder, eurosToMinor } from '../_lib/revolut';
import { ok, bad, oops, readJson } from '../_lib/supabase-admin';
import { rateLimit, rateLimitResponse } from '../_lib/ratelimit';

export const config = { runtime: 'edge' };

interface Body {
  amount_eur?: number;
  description?: string;
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
    : 'ÉIRVOX live test charge';
  const redirectPath = (typeof body.redirect_path === 'string' && body.redirect_path.startsWith('/'))
    ? body.redirect_path
    : '/#/payment/return';

  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  // Derive a clean origin from whatever the browser sent.
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
      merchant_order_ext_ref: `test-${Date.now()}`,
      redirect_url: redirectUrl,
      metadata: { purpose: 'test', amount_eur: String(amountEur) },
    });

    if (!order.checkout_url) {
      console.error('[create-test-order] no checkout_url returned', order);
      return oops('Revolut returned no checkout URL.');
    }

    return ok({ ok: true, order_id: order.id, checkout_url: order.checkout_url });
  } catch (err) {
    console.error('[create-test-order] failed:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // Don't echo the full Revolut error body to the client; admin sees it in logs.
    return bad(msg.slice(0, 280));
  }
}
