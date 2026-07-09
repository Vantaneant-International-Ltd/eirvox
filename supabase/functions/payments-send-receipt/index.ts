// ============================================================
// POST /functions/v1/payments-send-receipt
// Body: { session_id: <stripe_checkout_session_id>, to: <email> }
// ============================================================
// Sends a branded receipt for a PAID reservation, looked up in our DB
// by Stripe Checkout session id (server source of truth). Only sends
// once the order is actually paid — the verified stripe-webhook flips
// the reservation to completed/deposit_paid.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { supabaseAdmin, ok, bad, oops, readJson, isValidEmail } from '../_shared/supabase-admin.ts';
import { sendEmail } from '../_shared/email.ts';

function eur(amountEur: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amountEur);
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;
  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  const body = (await readJson<{ session_id?: string; to?: string }>(req)) ?? {};
  const sessionId = (body.session_id ?? '').trim();
  const to = (body.to ?? '').trim().toLowerCase();
  if (!sessionId || !/^[a-zA-Z0-9_-]{8,}$/.test(sessionId)) return bad(req, 'Missing or invalid session_id.');
  if (!isValidEmail(to)) return bad(req, 'A valid email is required.');

  const { data: res, error } = await supabaseAdmin
    .from('reservations')
    .select('status, reference, item_price, deposit_amount, is_deposit, listing_id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();
  if (error) return oops(req, 'Could not read the order.');
  if (!res) return bad(req, 'Order not found.');
  if (res.status !== 'completed' && res.status !== 'deposit_paid') {
    return bad(req, 'This order is not paid yet.');
  }

  const { data: listing } = await supabaseAdmin.from('listings').select('title').eq('id', res.listing_id).maybeSingle();
  const amountPaid = res.is_deposit ? Number(res.deposit_amount) : Number(res.item_price);
  const title = (listing as { title?: string } | null)?.title ?? 'ÉIRVOX order';

  const r = await sendEmail({
    to,
    subject: `ÉIRVOX receipt · ${res.reference} · ${eur(amountPaid)}`,
    html: `<p>Receipt for <strong>${title}</strong></p><p>Reference: ${res.reference}<br>Paid: ${eur(amountPaid)} (${res.is_deposit ? 'deposit' : 'full payment'})</p><p>EIRVOX LIMITED, trading as ÉIRVOX · Dublin, Ireland</p>`,
    text: `ÉIRVOX receipt ${res.reference}\n${title}\nPaid: ${eur(amountPaid)} (${res.is_deposit ? 'deposit' : 'full payment'})\nEIRVOX LIMITED, trading as ÉIRVOX`,
    from: 'ÉIRVOX <receipts@eirvox.ie>',
  });
  if (!r.ok) return oops(req, 'Could not send the receipt.');
  return ok(req, { ok: true });
});
