// ============================================================
// POST /functions/v1/enquiries
// Express Interest submissions. Service-role insert.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import {
  supabaseAdmin, readJson, ok, bad, oops,
  isValidEmail, hashIpForTriage, clientIp,
} from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';

type SubjectType = 'listing' | 'drive_issue' | 'tradesperson' | 'general';

interface Body {
  subject_type?: unknown;
  listing_id?: unknown;
  tradesperson_id?: unknown;
  drive_issue_slug?: unknown;
  profile_id?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  message?: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,128}$/;

function s(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function pickSubjectType(v: unknown): SubjectType | null {
  if (v === 'listing' || v === 'drive_issue' || v === 'tradesperson' || v === 'general') return v;
  return null;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  const rl = await rateLimit(req, 'enquiries');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = await readJson<Body>(req);
  if (!body) return bad(req, 'Missing or invalid JSON body.');

  const subject_type = pickSubjectType(body.subject_type);
  if (!subject_type) return bad(req, 'Invalid subject type.');

  const name     = s(body.name, 120);
  const rawEmail = s(body.email, 320);
  const message  = s(body.message, 4000);

  if (!name)     return bad(req, 'Your name is required.');
  if (!rawEmail || !isValidEmail(rawEmail)) return bad(req, 'Please enter a valid email.');
  if (!message || message.length < 10) return bad(req, 'Message must be at least 10 characters.');

  const email = rawEmail.toLowerCase();
  const phone = s(body.phone, 64);

  let listing_id: string | null = null;
  let tradesperson_id: string | null = null;
  let drive_issue_slug: string | null = null;

  if (subject_type === 'listing') {
    const v = s(body.listing_id, 64);
    if (!v || !UUID_RE.test(v)) return bad(req, 'Invalid listing reference.');
    listing_id = v;
  } else if (subject_type === 'tradesperson') {
    const v = s(body.tradesperson_id, 64);
    if (!v || !UUID_RE.test(v)) return bad(req, 'Invalid tradesperson reference.');
    tradesperson_id = v;
  } else if (subject_type === 'drive_issue') {
    const v = s(body.drive_issue_slug, 128);
    if (!v || !SLUG_RE.test(v)) return bad(req, 'Invalid DRIVE issue reference.');
    drive_issue_slug = v;
  }

  const profileIdRaw = s(body.profile_id, 64);
  const profile_id = profileIdRaw && UUID_RE.test(profileIdRaw) ? profileIdRaw : null;

  const user_agent = (req.headers.get('user-agent') ?? '').slice(0, 500);
  const ip_hash = await hashIpForTriage(clientIp(req));

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .insert({
      subject_type, listing_id, tradesperson_id, drive_issue_slug,
      profile_id, name, email, phone, message, user_agent, ip_hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[enquiries] insert failed:', error);
    return oops(req, 'Could not send your enquiry. Try again.');
  }

  return ok(req, { ok: true, id: data.id });
});
