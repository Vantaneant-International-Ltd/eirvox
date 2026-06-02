// ============================================================
// POST /functions/v1/waitlist  { email, source? }
// Returns 200 ok / 400 invalid / 409 dupe / 429 ratelimit / 500
//
// Port of api/waitlist.ts. See supabase/functions/README.md.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { supabaseAdmin, readJson, ok, bad, conflict, oops, isValidEmail } from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';
import { sendEmail } from '../_shared/email.ts';

interface Body {
  email?: unknown;
  source?: unknown;
}

/** Branded welcome email sent only on a successful FIRST insert.
 *  Dupes (409) get no second email — they were already welcomed.
 *  If RESEND_API_KEY isn't set the call returns ok:false and we
 *  swallow it: the user is still on the list, just won't see a
 *  confirm email until secrets are wired. */
async function sendWelcomeEmail(to: string): Promise<void> {
  const subject = "You're on the ÉIRVOX list.";
  const preheader = "We'll write to you first when the next drop lands.";
  const text = [
    'ÉIRVOX',
    '',
    "YOU'RE ON.",
    '',
    'Thanks for joining the ÉIRVOX waitlist.',
    '',
    "We're admitting new buyers and sellers in cohorts. You'll hear",
    'from us first when the next drop lands — cars, watches, design',
    'objects, all sourced with the same eye.',
    '',
    'No spam between now and then. We mean it.',
    '',
    'ÉIRVOX Systems Ltd · Dublin, Ireland',
    'https://eirvox.ie',
  ].join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;background:#F5F2ED;font-family:-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#1A1A1A;">
<span style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F2ED;padding:48px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid rgba(26,26,26,0.08);">
      <tr><td style="padding:32px 32px 16px;border-bottom:1px solid rgba(26,26,26,0.08);">
        <div style="font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:11px;letter-spacing:0.08em;color:#E8742C;">ÉIRVOX · WAITLIST</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:500;letter-spacing:-0.01em;line-height:1.1;margin-top:10px;">You're on.</div>
      </td></tr>
      <tr><td style="padding:24px 32px;font-size:15px;line-height:1.65;color:#1A1A1A;">
        <p style="margin:0 0 14px;">Thanks for joining the ÉIRVOX waitlist.</p>
        <p style="margin:0 0 14px;">We're admitting new buyers and sellers in cohorts. You'll hear from us first when the next drop lands — cars, watches, design objects, all sourced with the same eye.</p>
        <p style="margin:0;">No spam between now and then. We mean it.</p>
      </td></tr>
      <tr><td style="padding:8px 32px 28px;font-size:13px;line-height:1.6;color:#8A8680;">
        Questions? Reply to this email or write to
        <a href="mailto:support@eirvox.ie" style="color:#1A1A1A;text-decoration:underline;">support@eirvox.ie</a>.
      </td></tr>
    </table>
    <div style="max-width:560px;margin:18px auto 0;font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.06em;color:#8A8680;text-align:center;">
      ÉIRVOX SYSTEMS LTD · DUBLIN, IRELAND
    </div>
  </td></tr>
</table>
</body></html>`;
  try {
    const r = await sendEmail({ to, subject, html, text, replyTo: 'support@eirvox.ie' });
    if (!r.ok) console.warn('[waitlist] welcome email failed (insert still succeeded):', r.error);
  } catch (err) {
    console.warn('[waitlist] welcome email threw (insert still succeeded):', err);
  }
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return bad(req, 'Method not allowed.');
  }

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = await readJson<Body>(req);
  if (!body) return bad(req, 'Missing or invalid JSON body.');

  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return bad(req, 'Please enter a valid email.');

  const rawSource = typeof body.source === 'string' ? body.source : '';
  const source = (rawSource || 'coming_soon').trim().slice(0, 64);

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email, source });

  if (!error) {
    // Synchronous await: the EdgeRuntime.waitUntil fire-and-forget
    // pattern was silently no-op'ing the email call. Adds ~300ms to
    // the user-facing response, totally acceptable.
    console.log('[waitlist] insert ok, about to send welcome email to', email);
    await sendWelcomeEmail(email);
    console.log('[waitlist] welcome email path complete for', email);
    return ok(req);
  }

  if (error.code === '23505') return conflict(req, "You're already on the list.");

  console.error('[waitlist] insert failed:', error);
  return oops(req, 'Something went wrong. Try again.');
});
