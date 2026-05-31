// ============================================================
// POST /api/report
// Body: ReportBody (see below)
// Codes: 200 created, 400 invalid, 429 rate-limited, 500 other
//
// Buyer-submitted reports against listings (DRIVE items included,
// since DRIVE items are listings). Anonymous: no login required.
// Service-role insert; the reports table has no public INSERT
// policy (see supabase/v08-reports.sql).
//
// Listings only today. The shape allows widening later (add a
// subject_type column + CHECK like enquiries) without an API
// contract change beyond a new optional field.
// ============================================================

import {
  supabaseAdmin,
  readJson,
  ok,
  bad,
  oops,
  isValidEmail,
  hashIpForTriage,
  clientIp,
} from './_lib/supabase-admin';
import { rateLimit, rateLimitResponse } from './_lib/ratelimit';
import { verifyTurnstile } from './_lib/turnstile';

export const config = { runtime: 'edge' };

type Reason =
  | 'prohibited_illegal'
  | 'scam_fraud'
  | 'counterfeit'
  | 'miscategorised'
  | 'offensive'
  | 'unavailable'
  | 'other';

const REASONS: ReadonlyArray<Reason> = [
  'prohibited_illegal',
  'scam_fraud',
  'counterfeit',
  'miscategorised',
  'offensive',
  'unavailable',
  'other',
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
  if (!t) return null;
  return t.slice(0, max);
}

function pickReason(v: unknown): Reason | null {
  return typeof v === 'string' && (REASONS as readonly string[]).includes(v)
    ? (v as Reason)
    : null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const rl = await rateLimit(req, 'reports');
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = await readJson<Body>(req);
  if (!body) return bad('Missing or invalid JSON body.');

  // listing_id is required (the table allows NULL only so deletion
  // preserves history; submissions must always reference a listing).
  const listingIdRaw = s(body.listing_id, 64);
  if (!listingIdRaw || !UUID_RE.test(listingIdRaw)) {
    return bad('Invalid listing reference.');
  }

  const reason = pickReason(body.reason);
  if (!reason) return bad('Please choose a reason.');

  const detail = s(body.detail, 4000);

  // reporter_email is optional. If present it must look like an email.
  const rawEmail = s(body.reporter_email, 320);
  if (rawEmail && !isValidEmail(rawEmail)) {
    return bad('Please enter a valid email or leave it blank.');
  }
  const reporter_email = rawEmail ? rawEmail.toLowerCase() : null;

  // Turnstile: no-op until TURNSTILE_SECRET_KEY is set in env. The
  // form does not render a widget yet either; this is the gate that
  // flips on the moment keys + widget land.
  const ip = clientIp(req);
  const ts = await verifyTurnstile(
    typeof body.turnstile_token === 'string' ? body.turnstile_token : null,
    ip,
  );
  if (!ts.ok) {
    console.warn('[api/report] turnstile rejected:', ts.reason);
    return bad('Captcha verification failed. Refresh and try again.');
  }

  const user_agent = (req.headers.get('user-agent') ?? '').slice(0, 500);
  const ip_hash = await hashIpForTriage(ip);

  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert({
      listing_id: listingIdRaw,
      reason,
      detail,
      reporter_email,
      user_agent,
      ip_hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/report] insert failed:', error);
    return oops('Could not send your report. Try again.');
  }

  return ok({ ok: true, id: data.id });
}
