// ============================================================
// ÉIRVOX — Service-role Supabase client for Edge Functions
// ============================================================
// SERVER-ONLY. Never re-export this from anywhere a client could
// import it. The service-role key bypasses RLS — leaking it would
// let any visitor act as admin.
//
// Auto-injected env vars (you don't set these):
//   SUPABASE_URL                  the project URL
//   SUPABASE_SERVICE_ROLE_KEY     service-role JWT
// ============================================================

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.45.4';

const url = Deno.env.get('SUPABASE_URL');
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!url || !serviceKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'Both are auto-injected on Edge Functions — if absent the function ' +
    'is probably misconfigured or running outside Supabase.'
  );
}

export const supabaseAdmin: SupabaseClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

// ── JSON response helpers ──────────────────────────────────

import { corsHeaders } from './cors.ts';

export function json(req: Request, body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(req),
      ...(init.headers ?? {}),
    },
  });
}

export const ok       = (req: Request, body: unknown = { ok: true }) => json(req, body, { status: 200 });
export const bad      = (req: Request, msg: string)                  => json(req, { ok: false, error: msg }, { status: 400 });
export const conflict = (req: Request, msg: string)                  => json(req, { ok: false, error: msg }, { status: 409 });
export const oops     = (req: Request, msg = 'Something went wrong.') => json(req, { ok: false, error: msg }, { status: 500 });

// ── Input validation ──────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (v: string): boolean => EMAIL_RE.test(v.trim());

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
// Stable per-submitter token without storing raw IPs. Requires
// IP_HASH_PEPPER secret. Returns null when absent (admin sees
// NULL ip_hash → knows secret isn't set on this env).

export async function hashIpForTriage(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const pepper = Deno.env.get('IP_HASH_PEPPER');
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

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() ?? '';
  return ip || null;
}
