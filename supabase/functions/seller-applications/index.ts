// ============================================================
// POST /functions/v1/seller-applications
// Anonymous-friendly. Service-role insert into seller_applications
// with status='pending'. Approval into public.sellers happens via
// the admin panel.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import {
  supabaseAdmin, readJson, ok, bad, conflict, oops,
  isValidEmail, hashIpForTriage, clientIp,
} from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';

type Tier = 'house' | 'atelier' | 'verified';

interface Body {
  trading_name?: unknown; handle?: unknown;
  email?: unknown; phone?: unknown; city?: unknown;
  trading_since?: unknown; primary_category?: unknown;
  what_they_sell?: unknown; inventory_count?: unknown;
  price_low?: unknown; price_high?: unknown;
  sourcing_method?: unknown; tier?: unknown; profile_id?: unknown;
}

function s(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
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

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  const rl = await rateLimit(req, 'seller-applications');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = await readJson<Body>(req);
  if (!body) return bad(req, 'Missing or invalid JSON body.');

  const trading_name     = s(body.trading_name, 200);
  const rawEmail         = s(body.email, 320);
  const phone            = s(body.phone, 64);
  const primary_category = s(body.primary_category, 64);
  const what_they_sell   = s(body.what_they_sell, 2000);

  if (!trading_name)     return bad(req, 'Trading name is required.');
  if (!rawEmail || !isValidEmail(rawEmail)) return bad(req, 'Please enter a valid email.');
  if (!phone)            return bad(req, 'Phone is required.');
  if (!primary_category) return bad(req, 'Primary category is required.');
  if (!what_they_sell)   return bad(req, 'Please describe what you sell.');

  const email = rawEmail.toLowerCase();

  const handle           = s(body.handle, 64);
  const city             = s(body.city, 120);
  const trading_since    = nOrNull(body.trading_since);
  const inventory_count  = s(body.inventory_count, 64);
  const price_low        = nOrNull(body.price_low);
  const price_high       = nOrNull(body.price_high);
  const sourcing_method  = s(body.sourcing_method, 2000);
  const tier             = pickTier(body.tier);

  const profileIdCandidate = s(body.profile_id, 64);
  const profile_id = profileIdCandidate && /^[0-9a-f-]{36}$/i.test(profileIdCandidate)
    ? profileIdCandidate : null;

  const { data: existing, error: dupeErr } = await supabaseAdmin
    .from('seller_applications')
    .select('id')
    .eq('email', email)
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle();

  if (dupeErr) {
    console.error('[seller-applications] dedupe check failed:', dupeErr);
    return oops(req);
  }
  if (existing) {
    return conflict(req, 'You already have a pending application with this email.');
  }

  const user_agent = (req.headers.get('user-agent') ?? '').slice(0, 500);
  const ip_hash = await hashIpForTriage(clientIp(req));

  const { data, error } = await supabaseAdmin
    .from('seller_applications')
    .insert({
      profile_id, trading_name, handle, email, phone, city,
      trading_since, primary_category, what_they_sell,
      inventory_count, price_low, price_high, sourcing_method,
      tier, user_agent, ip_hash,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[seller-applications] insert failed:', error);
    return oops(req, 'Could not submit your application. Try again.');
  }

  return ok(req, { ok: true, id: data.id });
});
