// ============================================================
// POST /api/enquiries
// Body: EnquiryBody (see below)
// Codes: 201 created, 400 invalid, 500 other
//
// Express Interest submissions. Replaces the reservation flow.
// Service-role insert; the enquiries table has no public INSERT policy.
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

export const config = { runtime: 'edge' };

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
  if (!t) return null;
  return t.slice(0, max);
}

function pickSubjectType(v: unknown): SubjectType | null {
  if (v === 'listing' || v === 'drive_issue' || v === 'tradesperson' || v === 'general') return v;
  return null;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const rl = await rateLimit(req, 'enquiries');
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = await readJson<Body>(req);
  if (!body) return bad('Missing or invalid JSON body.');

  const subject_type = pickSubjectType(body.subject_type);
  if (!subject_type) return bad('Invalid subject type.');

  // Required core fields.
  const name     = s(body.name, 120);
  const rawEmail = s(body.email, 320);
  const message  = s(body.message, 4000);

  if (!name)     return bad('Your name is required.');
  if (!rawEmail || !isValidEmail(rawEmail)) return bad('Please enter a valid email.');
  if (!message || message.length < 10) return bad('Message must be at least 10 characters.');

  const email = rawEmail.toLowerCase();
  const phone = s(body.phone, 64);

  // Subject-specific ref. The DB has a CHECK constraint enforcing
  // exactly-one matches subject_type; we mirror that here for a
  // friendlier error than the Postgres one.
  let listing_id: string | null = null;
  let tradesperson_id: string | null = null;
  let drive_issue_slug: string | null = null;

  if (subject_type === 'listing') {
    const v = s(body.listing_id, 64);
    if (!v || !UUID_RE.test(v)) return bad('Invalid listing reference.');
    listing_id = v;
  } else if (subject_type === 'tradesperson') {
    const v = s(body.tradesperson_id, 64);
    if (!v || !UUID_RE.test(v)) return bad('Invalid tradesperson reference.');
    tradesperson_id = v;
  } else if (subject_type === 'drive_issue') {
    const v = s(body.drive_issue_slug, 128);
    if (!v || !SLUG_RE.test(v)) return bad('Invalid DRIVE issue reference.');
    drive_issue_slug = v;
  }

  // profile_id: only accept UUID-shaped strings; we don't verify ownership
  // (the API is anonymous-friendly; admins triage).
  const profileIdRaw = s(body.profile_id, 64);
  const profile_id = profileIdRaw && UUID_RE.test(profileIdRaw) ? profileIdRaw : null;

  // Spam triage. ip_hash is salted with IP_HASH_PEPPER from env
  // (see api/_lib/supabase-admin.ts).
  const user_agent = (req.headers.get('user-agent') ?? '').slice(0, 500);
  const ip_hash = await hashIpForTriage(clientIp(req));

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .insert({
      subject_type,
      listing_id,
      tradesperson_id,
      drive_issue_slug,
      profile_id,
      name,
      email,
      phone,
      message,
      user_agent,
      ip_hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/enquiries] insert failed:', error);
    return oops('Could not send your enquiry. Try again.');
  }

  return ok({ ok: true, id: data.id });
}

