// ============================================================
// POST /functions/v1/report
// Anonymous reports against listings. Service-role insert.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import {
  supabaseAdmin, readJson, ok, bad, oops,
  isValidEmail, hashIpForTriage, clientIp,
} from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';
import { verifyTurnstile } from '../_shared/turnstile.ts';

type Reason =
  | 'prohibited_illegal' | 'scam_fraud' | 'counterfeit'
  | 'miscategorised' | 'offensive' | 'unavailable' | 'other';

const REASONS: ReadonlyArray<Reason> = [
  'prohibited_illegal','scam_fraud','counterfeit',
  'miscategorised','offensive','unavailable','other',
];

interface Body {
  listing_id?: unknown;
  reason?: unknown;
  detail?: unknown;
  reporter_email?: unknown;
  turnstile_token?: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function s(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function pickReason(v: unknown): Reason | null {
  return typeof v === 'string' && (REASONS as readonly string[]).includes(v)
    ? (v as Reason) : null;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  const rl = await rateLimit(req, 'reports');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = await readJson<Body>(req);
  if (!body) return bad(req, 'Missing or invalid JSON body.');

  const listingIdRaw = s(body.listing_id, 64);
  if (!listingIdRaw || !UUID_RE.test(listingIdRaw)) {
    return bad(req, 'Invalid listing reference.');
  }

  const reason = pickReason(body.reason);
  if (!reason) return bad(req, 'Please choose a reason.');

  const detail = s(body.detail, 4000);

  const rawEmail = s(body.reporter_email, 320);
  if (rawEmail && !isValidEmail(rawEmail)) {
    return bad(req, 'Please enter a valid email or leave it blank.');
  }
  const reporter_email = rawEmail ? rawEmail.toLowerCase() : null;

  const ip = clientIp(req);
  const ts = await verifyTurnstile(
    typeof body.turnstile_token === 'string' ? body.turnstile_token : null,
    ip,
  );
  if (!ts.ok) {
    console.warn('[report] turnstile rejected:', ts.reason);
    return bad(req, 'Captcha verification failed. Refresh and try again.');
  }

  const user_agent = (req.headers.get('user-agent') ?? '').slice(0, 500);
  const ip_hash = await hashIpForTriage(ip);

  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert({
      listing_id: listingIdRaw,
      reason, detail, reporter_email, user_agent, ip_hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[report] insert failed:', error);
    return oops(req, 'Could not send your report. Try again.');
  }

  return ok(req, { ok: true, id: data.id });
});
