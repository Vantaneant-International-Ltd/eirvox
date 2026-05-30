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
