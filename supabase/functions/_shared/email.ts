// ============================================================
// ÉIRVOX — Resend transactional email (Edge Function port)
// ============================================================
// Direct REST call so we don't depend on a Node-only SDK.
//
// Env vars (set via `supabase secrets set ...`):
//   RESEND_API_KEY   re_…
//   RESEND_FROM      "Name <addr@verified-domain>"
//                    Default: "ÉIRVOX <onboarding@resend.dev>"
// ============================================================

const API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('RESEND_FROM') ?? 'ÉIRVOX <onboarding@resend.dev>';

function requireKey(): string {
  if (!API_KEY) {
    throw new Error('RESEND_API_KEY missing. Set via `supabase secrets set RESEND_API_KEY=...`.');
  }
  return API_KEY;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
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
