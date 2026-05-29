// ============================================================
// ÉIRVOX — Waitlist (Supabase-backed)
// Capture from the coming-soon page; review in /admin/waitlist.
// ============================================================

import { supabase, withTimeout } from './supabase';

export interface WaitlistEntry {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

export type SubmitOutcome =
  | { ok: true }
  | { ok: false; reason: 'duplicate' | 'invalid' | 'error'; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Insert a waitlist row. Maps Postgres unique-violation (23505) to a friendly outcome. */
export async function submitWaitlist(
  email: string,
  source = 'coming_soon'
): Promise<SubmitOutcome> {
  const value = email.trim().toLowerCase();
  if (!isValidEmail(value)) {
    return { ok: false, reason: 'invalid', message: 'Please enter a valid email.' };
  }

  const { error } = await supabase
    .from('waitlist')
    .insert({ email: value, source });

  if (!error) return { ok: true };

  // Supabase surfaces the Postgres SQLSTATE on error.code.
  if (error.code === '23505') {
    return { ok: false, reason: 'duplicate', message: "You're already on the list." };
  }
  return { ok: false, reason: 'error', message: 'Something went wrong. Try again.' };
}

/** All waitlist rows, newest first. */
export async function getAllWaitlist(): Promise<WaitlistEntry[]> {
  const r = await withTimeout(
    supabase.from('waitlist').select('*').order('created_at', { ascending: false }),
    10_000,
    'all_waitlist'
  );
  if (!r.ok) return [];
  const { data, error } = r.value as { data: WaitlistEntry[] | null; error: unknown };
  if (error || !data) return [];
  return data;
}

/** Cheap count for sidebar badge. Returns 0 on error so the UI never breaks. */
export async function getWaitlistCount(): Promise<number> {
  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });
  if (error || count == null) return 0;
  return count;
}
