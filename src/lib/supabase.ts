// ============================================================
// ÉIRVOX — Supabase client
// Public anon key. Safe to embed (read-only at row level —
// Row Level Security in the database enforces real access control).
// Loaded from VITE_SUPABASE_* env vars; see .env.example.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Copy .env.example to .env and fill them in.'
  );
}

/** Base URL for Supabase Edge Functions. The endpoints previously
 *  served at /api/* (Vercel serverless) now live at
 *  <project>.supabase.co/functions/v1/<name>. Stays here so client
 *  code never hardcodes the URL — see supabase/functions/README.md. */
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`;

/** Wrapper around fetch() for calls to Edge Functions. Adds the
 *  required `apikey` and `Authorization` headers (anon key by default;
 *  callers can pass the user JWT via opts.authToken). */
export async function callFunction(
  name: string,
  opts: { method?: string; body?: unknown; authToken?: string; query?: Record<string, string> } = {},
): Promise<Response> {
  const url = new URL(`${SUPABASE_FUNCTIONS_URL}/${name}`);
  if (opts.query) for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  const token = opts.authToken ?? SUPABASE_ANON_KEY;
  return fetch(url.toString(), {
    method: opts.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

// ── Database row types ──────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'tradesperson' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  city: string | null;
  country: string | null;
  created_at: string;
  updated_at?: string;
}

// ── Client ──────────────────────────────────────────────────

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Magic-link tokens return in the URL hash. Without PKCE, that hash
    // collides with the hash-based router and the token can leak into
    // server logs via Referer. PKCE replaces the implicit hash token
    // with a one-time code exchanged for the session.
    flowType: 'pkce',
    storageKey: 'eirvox-auth',
  },
});

// ── Typed query helpers ─────────────────────────────────────

/** Fetch a profile row by user id. Returns null if missing. */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[supabase] fetchProfile error:', error.message);
    return null;
  }
  return data as Profile | null;
}

/** Race a promise against a timeout. Returns a Result-style object so
 *  callers can present a sensible UI instead of a forever-spinner.
 *  Common cause of timeouts: PostgREST schema cache out of sync after
 *  RLS policy changes — run supabase/v04-rls-reset.sql to clear. */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 10_000,
  label = 'query'
): Promise<{ ok: true; value: T } | { ok: false; reason: 'timeout' | 'error'; error?: unknown }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const value = await Promise.race<T>([
      promise as Promise<T>,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Timeout (${ms}ms) waiting for ${label}`)),
          ms
        );
      }),
    ]);
    return { ok: true, value };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes('timeout')) {
      return { ok: false, reason: 'timeout' };
    }
    return { ok: false, reason: 'error', error: e };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Update a profile. Caller must be the owner (enforced by RLS). */
export async function updateProfile(
  userId: string,
  patch: Partial<Omit<Profile, 'id' | 'created_at' | 'role'>>
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.warn('[supabase] updateProfile error:', error.message);
    return null;
  }
  return data as Profile;
}
