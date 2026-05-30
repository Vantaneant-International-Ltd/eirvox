// ============================================================
// POST /api/payments/send-receipt
// Body: { order_id: string, to: string }
//
// Fetches the Revolut order, builds a branded receipt email,
// sends via Resend. Returns { ok }.
//
// v1 surface: triggered from /payment/return after a successful
// charge. Buyer types their email, hits Send, Resend mails them
// a copy. Future flow (real listings) would auto-send using the
// email collected at checkout time.
// ============================================================

import { getOrder, minorToEuros } from '../_lib/revolut';
import { sendEmail } from '../_lib/email';
import { ok, bad, oops, readJson, isValidEmail } from '../_lib/supabase-admin';
import { rateLimit, rateLimitResponse } from '../_lib/ratelimit';

export const config = { runtime: 'edge' };

interface Body { order_id?: unknown; to?: unknown }

const UUID_LIKE = /^[a-zA-Z0-9-]{8,}$/;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = await readJson<Body>(req);
  if (!body) return bad('Missing or invalid JSON body.');

  const orderId = typeof body.order_id === 'string' ? body.order_id.trim() : '';
  const to = typeof body.to === 'string' ? body.to.trim().toLowerCase() : '';

  if (!orderId || !UUID_LIKE.test(orderId)) return bad('Invalid order_id.');
  if (!isValidEmail(to)) return bad('Invalid recipient email.');

  let order;
  try {
    order = await getOrder(orderId);
  } catch (err) {
    console.error('[send-receipt] Revolut fetch failed:', err);
    return oops('Could not look up the order.');
  }

  // Only send receipts for orders that actually moved money.
  if (order.state !== 'COMPLETED' && order.state !== 'AUTHORISED') {
    return bad(`Order is ${order.state}; nothing to receipt yet.`);
  }

  const amountEur = minorToEuros(order.amount);
  const amountFmt = new Intl.NumberFormat('en-IE', {
    style: 'currency', currency: order.currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amountEur);
  const dateFmt = new Date(order.created_at).toLocaleString('en-IE', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const subject = `ÉIRVOX receipt · ${amountFmt}`;

  // Plain-text fallback (deliverability + accessibility)
  const text = [
    'ÉIRVOX',
    '',
    'PAYMENT RECEIVED',
    '',
    `Amount        ${amountFmt}`,
    `Reference     ${order.id}`,
    `Date          ${dateFmt}`,
    `State         ${order.state}`,
    '',
    'This is an automated receipt from ÉIRVOX. Keep it for your records.',
    '',
    'ÉIRVOX Systems Ltd · Dublin, Ireland',
    'https://eirvox.ie',
  ].join('\n');

  // Branded HTML. Inline styles only (most email clients strip <style>).
  const html = `
<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#F5F2ED;font-family:-apple-system,BlinkMacSystemFont,'Inter Tight',Helvetica,Arial,sans-serif;color:#1A1A1A;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2ED;padding:48px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(26,26,26,0.08);">
      <tr><td style="padding:32px 32px 16px;border-bottom:1px solid rgba(26,26,26,0.08);">
        <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;color:#E8742C;margin-bottom:6px;">ÉIRVOX · RECEIPT</div>
        <div style="font-size:24px;font-weight:500;letter-spacing:-0.01em;line-height:1.2;">Payment received.</div>
      </td></tr>
      <tr><td style="padding:24px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr><td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.06em;color:#8A8680;text-transform:uppercase;width:120px;">Amount</td>
              <td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:18px;font-weight:500;">${amountFmt}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.06em;color:#8A8680;text-transform:uppercase;">Reference</td>
              <td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:12px;word-break:break-all;">${order.id}</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.06em;color:#8A8680;text-transform:uppercase;">Date</td>
              <td style="padding:12px 0;border-bottom:1px solid rgba(26,26,26,0.08);font-size:14px;">${dateFmt}</td></tr>
          <tr><td style="padding:12px 0;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.06em;color:#8A8680;text-transform:uppercase;">State</td>
              <td style="padding:12px 0;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:12px;">${order.state}</td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:16px 32px 32px;font-size:13px;line-height:1.65;color:#8A8680;">
        Keep this receipt for your records. Anything looks wrong? Reply to this email or contact
        <a href="mailto:support@eirvox.ie" style="color:#1A1A1A;text-decoration:underline;">support@eirvox.ie</a>.
      </td></tr>
    </table>
    <div style="max-width:560px;margin:18px auto 0;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.06em;color:#8A8680;text-align:center;">
      ÉIRVOX SYSTEMS LTD · DUBLIN, IRELAND
    </div>
  </td></tr>
</table>
</body></html>`;

  const result = await sendEmail({ to, subject, html, text, replyTo: 'support@eirvox.ie' });
  if (!result.ok) {
    return oops(result.error ?? 'Could not send email.');
  }

  return ok({ ok: true, id: result.id });
}
