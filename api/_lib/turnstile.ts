// ============================================================
// ÉIRVOX — Cloudflare Turnstile verification (env-gated)
// ============================================================
//
// Stub today; activates the moment TURNSTILE_SECRET_KEY appears in
// env. Mirrors the IP_HASH_PEPPER convention: if the secret is
// absent the helper returns "allowed" with a one-time warning, so
// the form works in dev / preview without any Turnstile setup.
//
// To turn on:
//   1. Get a Turnstile sitekey + secret from Cloudflare.
//   2. Set TURNSTILE_SECRET_KEY in Vercel (server env) and locally.
//   3. Set VITE_TURNSTILE_SITEKEY in the same places (client env)
//      and render the widget in the form; pass its token in the
//      JSON body as `turnstile_token`.
//   4. Routes calling verifyTurnstile() will start enforcing.
//
// Fail mode: production WITHOUT the secret currently still allows
// requests (warns once). When the secret is configured everywhere,
// switch to fail-closed by inverting the early return below.
// ============================================================

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

let warnedMissing = false;
function warnMissingOnce() {
  if (warnedMissing) return;
  warnedMissing = true;
  console.warn(
    '[turnstile] TURNSTILE_SECRET_KEY not set; skipping verification. ' +
    'Set it in Vercel env + .env to enable.'
  );
}

export interface TurnstileOutcome {
  /** True iff the token verified, or verification is disabled. */
  ok: boolean;
  /** Reason from Cloudflare if ok=false. */
  reason?: string;
}

/** Verify a client-supplied Turnstile token. When the secret env is
 *  absent, returns {ok: true} so the API stays usable in dev. */
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
