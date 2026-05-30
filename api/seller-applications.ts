// ============================================================
// POST /api/seller-applications
// Body: SellerApplicationBody (see below)
// Codes: 201 created, 400 invalid, 409 already pending, 500 other
//
// Replaces the browser-side anon insert in src/lib/sellers.ts.
// Anonymous-friendly: no auth required (matches the locked
// architecture rule "seller applications stay anonymous").
// Writes to public.seller_applications with status='pending';
// approval into public.sellers happens via the
// approve_seller_application() helper called from the admin panel.
// ============================================================

import {
  supabaseAdmin,
  readJson,
  ok,
  bad,
  conflict,
  oops,
  isValidEmail,
} from './_lib/supabase-admin';

export const config = { runtime: 'edge' };

type Tier = 'house' | 'atelier' | 'verified';

interface Body {
  trading_name?: unknown;
  handle?: unknown;
  email?: unknown;
  phone?: unknown;
  city?: unknown;
  trading_since?: unknown;
  primary_category?: unknown;
  what_they_sell?: unknown;
  inventory_count?: unknown;
  price_low?: unknown;
  price_high?: unknown;
  sourcing_method?: unknown;
  tier?: unknown;
  profile_id?: unknown; // optional, when signed in
}

function s(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function nOrNull(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }
  return null;
}

function pickTier(v: unknown): Tier {
  if (v === 'house' || v === 'atelier' || v === 'verified') return v;
  return 'verified';
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const body = await readJson<Body>(req);
  if (!body) return bad('Missing or invalid JSON body.');

  // Required fields. Long-form prose fields capped to sensible lengths.
  const trading_name     = s(body.trading_name, 200);
  const rawEmail         = s(body.email, 320);
  const phone            = s(body.phone, 64);
  const primary_category = s(body.primary_category, 64);
  const what_they_sell   = s(body.what_they_sell, 2000);

  if (!trading_name)     return bad('Trading name is required.');
  if (!rawEmail || !isValidEmail(rawEmail)) return bad('Please enter a valid email.');
  if (!phone)            return bad('Phone is required.');
  if (!primary_category) return bad('Primary category is required.');
  if (!what_they_sell)   return bad('Please describe what you sell.');

  const email = rawEmail.toLowerCase();

  // Optional fields.
  const handle           = s(body.handle, 64);
  const city             = s(body.city, 120);
  const trading_since    = nOrNull(body.trading_since);
  const inventory_count  = s(body.inventory_count, 64);
  const price_low        = nOrNull(body.price_low);
  const price_high       = nOrNull(body.price_high);
  const sourcing_method  = s(body.sourcing_method, 2000);
  const tier             = pickTier(body.tier);

  // profile_id: trust only if it's a UUID-shaped string. We don't validate
  // ownership here because the route is anonymous-friendly; admins triage.
  const profileIdCandidate = s(body.profile_id, 64);
  const profile_id = profileIdCandidate && /^[0-9a-f-]{36}$/i.test(profileIdCandidate)
    ? profileIdCandidate
    : null;

  // Soft-dedupe: reject a second pending application for the same email.
  // We don't enforce this with a unique constraint because withdraw/reject
  // followed by a fresh application is a legitimate workflow.
  const { data: existing, error: dupeErr } = await supabaseAdmin
    .from('seller_applications')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (dupeErr) {
    console.error('[api/seller-applications] dedupe check failed:', dupeErr);
    return oops();
  }
  if (existing) {
    return conflict('You already have a pending application with this email.');
  }

  // Spam-triage metadata.
  const ua = req.headers.get('user-agent') ?? '';
  const user_agent = ua.slice(0, 500);

  // We don't store raw IPs. The hash gives us "same submitter" grouping
  // without holding an identifier. SHA-256 via Web Crypto (Edge runtime).
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() ?? '';
  const ip_hash = ip ? await sha256Hex(ip) : null;

  const { data, error } = await supabaseAdmin
    .from('seller_applications')
    .insert({
      profile_id,
      trading_name,
      handle,
      email,
      phone,
      city,
      trading_since,
      primary_category,
      what_they_sell,
      inventory_count,
      price_low,
      price_high,
      sourcing_method,
      tier,
      user_agent,
      ip_hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[api/seller-applications] insert failed:', error);
    return oops('Could not submit your application. Try again.');
  }

  return ok({ ok: true, id: data.id });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
