// ============================================================
// POST /api/waitlist  { email, source? }
// Body: { email: string, source?: string }
// Codes: 201 created, 409 duplicate, 400 invalid, 500 other
//
// Replaces the browser-side anon insert in src/lib/waitlist.ts.
// Service-role key bypasses RLS, so once this route is live the
// "Anyone can join waitlist" policy can be dropped (see
// supabase/v05-waitlist-anon-revoke.sql — apply AFTER this route
// is verified working in production).
// ============================================================

import { supabaseAdmin, readJson, ok, bad, conflict, oops, isValidEmail } from './_lib/supabase-admin';

export const config = { runtime: 'edge' };

interface Body {
  email?: unknown;
  source?: unknown;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const body = await readJson<Body>(req);
  if (!body) return bad('Missing or invalid JSON body.');

  const rawEmail = typeof body.email === 'string' ? body.email : '';
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return bad('Please enter a valid email.');

  const rawSource = typeof body.source === 'string' ? body.source : '';
  // Cap source length and strip whitespace so a misuse can't flood the column.
  const source = (rawSource || 'coming_soon').trim().slice(0, 64);

  const { error } = await supabaseAdmin
    .from('waitlist')
    .insert({ email, source });

  if (!error) return ok({ ok: true });

  if (error.code === '23505') return conflict("You're already on the list.");

  // Don't leak internal error text to the browser.
  console.error('[api/waitlist] insert failed:', error);
  return oops('Something went wrong. Try again.');
}
