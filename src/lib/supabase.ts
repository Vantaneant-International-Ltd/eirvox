// ============================================================
// ÉIRVOX — Supabase client
// Public anon key. Safe to embed (read-only at row level —
// Row Level Security in the database enforces real access control).
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://arokrumaxjiidsqfpiii.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2tydW1heGppaWRzcWZwaWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzUzMzMsImV4cCI6MjA5NTU1MTMzM30.EdTZS0XHo9t51vCgdp3BvFHyTuhVNzT-kN6Pi-4aDqc';

// ── Database row types ──────────────────────────────────────

export type UserRole = 'buyer' | 'seller' | 'admin';

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
