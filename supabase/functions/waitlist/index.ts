// ============================================================
// POST /functions/v1/waitlist  { email, source? }
// Returns 200 ok / 400 invalid / 409 dupe / 429 ratelimit / 500
//
// Port of api/waitlist.ts. See supabase/functions/README.md.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { supabaseAdmin, readJson, ok, bad, conflict, oops, isValidEmail } from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';

interface Body {
  email?: unknown;
  source?: unknown;
}

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return bad(req, 'Method not allowed.');
  }

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = await readJson<Body>(req);
  if (!body) return bad(req, 'Missing or invalid JSON body.');

  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return bad(req, 'Please enter a valid email.');

  const rawSource = typeof body.source === 'string' ? body.source : '';
  const source = (rawSource || 'coming_soon').trim().slice(0, 64);

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email, source });

  if (!error) return ok(req);

  if (error.code === '23505') return conflict(req, "You're already on the list.");

  console.error('[waitlist] insert failed:', error);
  return oops(req, 'Something went wrong. Try again.');
});
