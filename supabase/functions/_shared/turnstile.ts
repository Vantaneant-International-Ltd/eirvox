// ============================================================
// ÉIRVOX — Cloudflare Turnstile (Edge Function port)
// ============================================================
// Behaviour unchanged: stub today, enforces the moment
// TURNSTILE_SECRET_KEY is set.
// ============================================================

const SECRET = Deno.env.get('TURNSTILE_SECRET_KEY');
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

let warnedMissing = false;
function warnMissingOnce() {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(
    '[turnstile] TURNSTILE_SECRET_KEY not set; skipping verification.'
  );
}

export interface TurnstileOutcome {
  ok: boolean;
  reason?: string;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  remoteIp: string | null = null,
): Promise<TurnstileOutcome> {
  if (!SECRET) {
    warnMissingOnce();
    return { ok: true };
  }
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'missing_token' };
  }
  const form = new URLSearchParams();
  form.set('secret', SECRET);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  let res: Response;
  try {
    res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
  } catch (err) {
    console.warn('[turnstile] verify fetch failed:', err);
    return { ok: false, reason: 'verify_unreachable' };
  }
  const payload = await res.json().catch(() => null) as
    | { success?: boolean; 'error-codes'?: string[] }
    | null;
  if (payload?.success) return { ok: true };
  return { ok: false, reason: payload?.['error-codes']?.[0] ?? 'verify_failed' };
}
