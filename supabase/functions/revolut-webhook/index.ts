// ============================================================
// POST /functions/v1/revolut-webhook
// ============================================================
// Receives Merchant API events from Revolut. Verifies HMAC against
// REVOLUT_WEBHOOK_SECRET (configure the webhook URL + grab the secret
// in business.revolut.com → Developer → Webhooks). On a payment
// completion event, calls the complete_order RPC which atomically
// flips the reservation status + transitions the listing.status, then
// fires two emails: seller new-order notification + buyer confirmation.
//
// Verify-JWT is OFF on this function (Revolut is the only caller and
// they sign with HMAC, not JWT). DO NOT enable verify_jwt or Revolut
// callbacks will 401.
//
// Idempotent: complete_order returns {already_processed:true} when
// the reservation is already in a terminal state. We accept Revolut
// retries gracefully.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabase-admin.ts';
import { sendEmail } from '../_shared/email.ts';

const SECRET = Deno.env.get('REVOLUT_WEBHOOK_SECRET');

// Revolut HMAC verification (per Merchant API webhooks docs):
// signature = HMAC_SHA256(secret, timestamp + '.' + raw_body)
// Headers:  Revolut-Request-Timestamp, Revolut-Signature ('v1=<hex>')
// Replay protection: reject events older than 5 minutes.

async function verifyRevolutSignature(req: Request, rawBody: string): Promise<{ ok: boolean; reason?: string }> {
  if (!SECRET) {
    console.warn('[revolut-webhook] REVOLUT_WEBHOOK_SECRET missing — accepting all (DEV ONLY)');
    return { ok: true };  // dev/no-secret mode
  }
  const timestamp = req.headers.get('revolut-request-timestamp') ?? '';
  const signatureHeader = req.headers.get('revolut-signature') ?? '';
  if (!timestamp || !signatureHeader) return { ok: false, reason: 'missing_signature_headers' };

  // Replay protection: reject events older than 5 minutes
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'invalid_timestamp' };
  if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) return { ok: false, reason: 'stale_timestamp' };

  // Header format: "v1=<hex>". Strip prefix.
  const expected = signatureHeader.replace(/^v1=/, '');

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`));
  const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time compare to avoid timing leaks
  if (sigHex.length !== expected.length) return { ok: false, reason: 'signature_mismatch' };
  let diff = 0;
  for (let i = 0; i < sigHex.length; i++) diff |= sigHex.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
}

// Map Revolut event names → simplified state our RPC handles.
function eventToState(event: string): string | null {
  switch (event) {
    case 'ORDER_COMPLETED':       return 'COMPLETED';
    case 'ORDER_AUTHORISED':      return 'AUTHORISED';
    case 'ORDER_CANCELLED':       return 'CANCELLED';
    case 'ORDER_PAYMENT_FAILED':
    case 'ORDER_PAYMENT_DECLINED': return 'FAILED';
    default: return null;
  }
}

function eur(minorOrEur: number, alreadyEuros = true): string {
  const amount = alreadyEuros ? minorOrEur : minorOrEur / 100;
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(amount);
}

async function sendSellerNewOrderEmail(data: any): Promise<void> {
  if (!data.seller_email) {
    console.warn('[revolut-webhook] seller has no email; skipping seller notification');
    return;
  }
  const ref = data.reference;
  const variantStyleLabel = typeof data.variant_style_label === 'string' ? data.variant_style_label : '';
  const variantFamilyKey  = typeof data.variant_family_key  === 'string' ? data.variant_family_key  : '';
  const variantPriceDelta = Number(data.variant_price_delta_eur) || 0;
  const itemPriceResolved = Number(data.item_price) + variantPriceDelta;
  const amountPaid = data.is_deposit ? data.deposit_amount : itemPriceResolved;
  const balanceLine = data.is_deposit
    ? `Balance on collection: ${eur(Number(data.balance_amount) + variantPriceDelta)}`
    : 'Paid in full.';
  const fulfilment = data.delivery_preference === 'delivery' ? 'Delivery' : 'Collection';
  const variantSuffix = variantStyleLabel
    ? ` · ${variantStyleLabel}${variantFamilyKey ? ` (${variantFamilyKey.toUpperCase()})` : ''}`
    : '';
  const subject = `New order ${ref} · ${eur(amountPaid)} · ${data.listing_title}${variantSuffix}`;
  const text = [
    `ÉIRVOX · NEW ORDER ${ref}`,
    '',
    `Item:       ${data.listing_title}`,
    variantStyleLabel ? `Style:      ${variantStyleLabel}` : '',
    variantFamilyKey  ? `Fitment:    ${variantFamilyKey.toUpperCase()}` : '',
    `Listed at:  ${eur(itemPriceResolved)}`,
    `Paid:       ${eur(amountPaid)} (${data.is_deposit ? 'deposit' : 'full payment'})`,
    `${balanceLine}`,
    `Fulfilment: ${fulfilment}`,
    `Buyer:      ${data.buyer_email}`,
    '',
    `The buyer is waiting to hear from you. Reach out to arrange ${fulfilment.toLowerCase()}.`,
    '',
    `Manage this order in your seller dashboard.`,
    `https://eirvox.ie/#/sell/dashboard`,
    '',
    'Replies are not monitored.',
    '',
    'ÉIRVOX Systems Ltd · Dublin, Ireland',
  ].filter(Boolean).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;background:#F5F2ED;font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2ED;padding:48px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(26,26,26,0.08);">
      <tr><td style="padding:32px 32px 16px;border-bottom:1px solid rgba(26,26,26,0.08);">
        <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;color:#E8742C;">ÉIRVOX · NEW ORDER ${ref}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;letter-spacing:-0.02em;margin-top:10px;line-height:1.2;">You have a buyer.</div>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;width:140px;">Item</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:15px;font-weight:500;">${data.listing_title}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Paid</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:18px;font-weight:500;color:#1A1A1A;">${eur(amountPaid)} <span style="color:#8A8680;font-size:12px;">(${data.is_deposit ? 'deposit' : 'full payment'})</span></td></tr>
          ${data.is_deposit ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Balance</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:14px;">${eur(data.balance_amount)} on collection</td></tr>` : ''}
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Fulfilment</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:14px;">${fulfilment}</td></tr>
          <tr><td style="padding:10px 0;font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Buyer</td>
              <td style="padding:10px 0;font-family:'JetBrains Mono',monospace;font-size:13px;"><a href="mailto:${data.buyer_email}" style="color:#1A1A1A;text-decoration:underline;">${data.buyer_email}</a></td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 32px 28px;">
        <a href="https://eirvox.ie/#/sell/dashboard" style="display:inline-block;background:#1A1A1A;color:#FFFFFF;padding:12px 24px;text-decoration:none;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">Open seller dashboard</a>
      </td></tr>
      <tr><td style="padding:8px 32px 28px;font-size:13px;line-height:1.6;color:#8A8680;">
        The buyer is waiting to hear from you. Reach out to arrange ${fulfilment.toLowerCase()}. Replies to this email are not monitored.
      </td></tr>
    </table>
    <div style="max-width:560px;margin:18px auto 0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.06em;color:#8A8680;text-align:center;">
      ÉIRVOX SYSTEMS LTD · DUBLIN, IRELAND
    </div>
  </td></tr>
</table>
</body></html>`;
  const r = await sendEmail({ to: data.seller_email, subject, html, text, from: 'ÉIRVOX <orders@eirvox.ie>' });
  if (!r.ok) console.warn('[revolut-webhook] seller email failed:', r.error);
}

async function sendBuyerConfirmationEmail(data: any): Promise<void> {
  if (!data.buyer_email) return;
  const ref = data.reference;
  const variantStyleLabel = typeof data.variant_style_label === 'string' ? data.variant_style_label : '';
  const variantFamilyKey  = typeof data.variant_family_key  === 'string' ? data.variant_family_key  : '';
  const variantPriceDelta = Number(data.variant_price_delta_eur) || 0;
  const itemPriceResolved = Number(data.item_price) + variantPriceDelta;
  const amountPaid = data.is_deposit ? data.deposit_amount : itemPriceResolved;
  const subject = `Order ${ref} confirmed · ${eur(amountPaid)}`;
  const fulfilment = data.delivery_preference === 'delivery' ? 'Delivery' : 'Collection';
  const text = [
    `ÉIRVOX · ORDER ${ref}`,
    '',
    `Item:       ${data.listing_title}`,
    variantStyleLabel ? `Style:      ${variantStyleLabel}` : '',
    variantFamilyKey  ? `Fitment:    ${variantFamilyKey.toUpperCase()}` : '',
    `Paid:       ${eur(amountPaid)} (${data.is_deposit ? 'deposit' : 'full payment'})`,
    data.is_deposit ? `Balance:    ${eur(Number(data.balance_amount) + variantPriceDelta)} on collection` : '',
    `Fulfilment: ${fulfilment}`,
    '',
    `${data.seller_name ?? 'The seller'} has been notified. They will reach out to you to arrange ${fulfilment.toLowerCase()}.`,
    '',
    'Replies to this email are not monitored.',
    'For help: support@eirvox.ie',
    '',
    'ÉIRVOX Systems Ltd · Dublin, Ireland',
  ].filter(Boolean).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;background:#F5F2ED;font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#1A1A1A;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2ED;padding:48px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(26,26,26,0.08);">
      <tr><td style="padding:32px 32px 16px;border-bottom:1px solid rgba(26,26,26,0.08);">
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;color:#E8742C;">ÉIRVOX · ORDER ${ref}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:500;letter-spacing:-0.02em;margin-top:10px;line-height:1.2;">Order confirmed.</div>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;width:140px;">Item</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:15px;font-weight:500;">${data.listing_title}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Paid</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:18px;font-weight:500;">${eur(amountPaid)} <span style="color:#8A8680;font-size:12px;">(${data.is_deposit ? 'deposit' : 'full payment'})</span></td></tr>
          ${data.is_deposit ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Balance</td>
              <td style="padding:10px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:14px;">${eur(data.balance_amount)} on collection</td></tr>` : ''}
          <tr><td style="padding:10px 0;font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A8680;text-transform:uppercase;">Fulfilment</td>
              <td style="padding:10px 0;font-size:14px;">${fulfilment}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:8px 32px 28px;font-size:14px;line-height:1.65;color:#1A1A1A;">
        <strong>${data.seller_name ?? 'The seller'}</strong> has been notified. They will reach out to you to arrange ${fulfilment.toLowerCase()}.
      </td></tr>
      <tr><td style="padding:8px 32px 28px;font-size:13px;line-height:1.6;color:#8A8680;">
        Replies to this email are not monitored. For help, write to <a href="mailto:support@eirvox.ie" style="color:#1A1A1A;text-decoration:underline;">support@eirvox.ie</a>.
      </td></tr>
    </table>
    <div style="max-width:560px;margin:18px auto 0;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:0.06em;color:#8A8680;text-align:center;">
      ÉIRVOX SYSTEMS LTD · DUBLIN, IRELAND
    </div>
  </td></tr>
</table>
</body></html>`;
  const r = await sendEmail({ to: data.buyer_email, subject, html, text, from: 'ÉIRVOX <orders@eirvox.ie>' });
  if (!r.ok) console.warn('[revolut-webhook] buyer email failed:', r.error);
}

Deno.serve(async (req: Request) => {
  // CORS not strictly needed (Revolut server is the caller) but
  // OPTIONS preflight harmless.
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();

  const verify = await verifyRevolutSignature(req, rawBody);
  if (!verify.ok) {
    console.warn('[revolut-webhook] signature rejected:', verify.reason);
    return new Response(JSON.stringify({ ok: false, error: 'signature_invalid' }), { status: 401, headers: { 'content-type': 'application/json' } });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  const event = String(payload.event ?? '');
  const orderId = String(payload.order_id ?? payload.data?.id ?? '');
  if (!orderId) {
    console.warn('[revolut-webhook] payload missing order_id', payload);
    return new Response(JSON.stringify({ ok: true, ignored: 'no_order_id' }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const state = eventToState(event);
  if (!state) {
    // Unknown event type — acknowledge with 200 so Revolut doesn't retry
    return new Response(JSON.stringify({ ok: true, ignored: event }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  // Call the DB RPC that atomically updates reservation + listing
  const { data: result, error } = await supabaseAdmin.rpc('complete_order', {
    p_revolut_order_id: orderId,
    p_revolut_state: state,
  });
  if (error) {
    console.error('[revolut-webhook] complete_order failed:', error);
    // Return 500 so Revolut retries (transient DB issue)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  if (!result || (result as any).already_processed) {
    return new Response(JSON.stringify({ ok: true, already_processed: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  // Fire notifications — don't block / fail the webhook if email fails
  const r = result as any;
  if (state === 'COMPLETED' || state === 'AUTHORISED') {
    await Promise.allSettled([
      sendSellerNewOrderEmail(r),
      sendBuyerConfirmationEmail(r),
    ]);
  }

  return new Response(JSON.stringify({ ok: true, reservation_id: r.reservation_id }), { status: 200, headers: { 'content-type': 'application/json' } });
});
