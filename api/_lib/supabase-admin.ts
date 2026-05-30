// ============================================================
// ÉIRVOX — Service-role Supabase client for /api/* routes
// ============================================================
// SERVER-ONLY. Never import this from src/. The service-role key
// bypasses RLS — leaking it into the browser bundle would let any
// visitor become an admin.
//
// Loaded from SUPABASE_SERVICE_ROLE_KEY (no VITE_ prefix on purpose
// so Vite cannot inline it into client code even if accidentally
// imported).
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'Set both in .env (local) and in Vercel project env (prod).'
  );
}

// Single client per cold start. autoRefreshToken / persistSession
// are off because there's no session to track on the server.
export const supabaseAdmin: SupabaseClient = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// ── JSON response helpers ──────────────────────────────────

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
}

export const ok = (body: unknown = { ok: true }) => json(body, { status: 200 });
export const bad = (msg: string) => json({ ok: false, error: msg }, { status: 400 });
export const conflict = (msg: string) => json({ ok: false, error: msg }, { status: 409 });
export const oops = (msg = 'Something went wrong.') =>
  json({ ok: false, error: msg }, { status: 500 });

// ── Input validation ──────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

/** Parse a JSON body, returning null if missing / malformed. */
export async function readJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ── IP fingerprinting for spam triage ─────────────────────
//
// We never store raw IPs. The hash + server-side pepper produces a
// stable per-submitter token without being reversible via a public
// rainbow table (IPv4 space is only ~4B addresses; an unsalted SHA-256
// of an IP is effectively plaintext to anyone with a precomputed table).
//
// IP_HASH_PEPPER is a server-only secret (no VITE_ prefix). If unset
// the helper returns null rather than storing a weak hash; admins
// triaging spam will see `ip_hash IS NULL` and know the env var is
// missing in this environment.

export async function hashIpForTriage(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const pepper = process.env.IP_HASH_PEPPER;
  if (!pepper) {
    console.warn('[supabase-admin] IP_HASH_PEPPER not set; skipping ip_hash');
    return null;
  }
  const data = new TextEncoder().encode(`${pepper}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Pull the first IP from x-forwarded-for, trimming whitespace.
 *  Returns null if the header is absent or empty. */
export function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() ?? '';
  return ip || null;
}
