// ============================================================
// ÉIRVOX — Resend transactional email wrapper (server-only)
// ============================================================
//
// Uses Resend's REST API directly (no @resend/node SDK so we don't
// pull a Node-only dep into Edge runtime). https://resend.com/docs
//
// Env vars (server-only, NO VITE_ prefix):
//   RESEND_API_KEY   re_…
//   RESEND_FROM      "Name <addr@verified-domain>"  e.g.
//                    "ÉIRVOX <receipts@eirvox.ie>" once the domain
//                    is verified in Resend. Until then,
//                    "ÉIRVOX <onboarding@resend.dev>" works.
// ============================================================

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM ?? 'ÉIRVOX <onboarding@resend.dev>';

function requireKey(): string {
  if (!API_KEY) {
    throw new Error('RESEND_API_KEY missing. Set in .env locally and Vercel project env in prod.');
  }
  return API_KEY;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional plain-text fallback (highly recommended for inboxing). */
  text?: string;
  /** Override the From header for this one send. */
  from?: string;
  /** Reply-To. Defaults to the FROM address. */
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const body = {
    from: input.from ?? FROM,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
    reply_to: input.replyTo,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${requireKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('[email] Resend rejected:', res.status, text);
    return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
  }
  try {
    const parsed = JSON.parse(text) as { id?: string };
    return { ok: true, id: parsed.id };
  } catch {
    return { ok: true };
  }
}
