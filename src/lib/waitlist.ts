// ============================================================
// ÉIRVOX — Waitlist (Supabase-backed)
// Capture from the coming-soon page; review in /admin/waitlist.
// ============================================================

import { supabase, withTimeout, callFunction } from './supabase';

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

/** Submit a waitlist row via the Supabase Edge Function.
 *  Function runs with the service-role key on the server so the
 *  browser never needs anon INSERT on the waitlist table. */
export async function submitWaitlist(
  email: string,
  source = 'coming_soon'
): Promise<SubmitOutcome> {
  const value = email.trim().toLowerCase();
  if (!isValidEmail(value)) {
    return { ok: false, reason: 'invalid', message: 'Please enter a valid email.' };
  }

  let res: Response;
  try {
    res = await callFunction('waitlist', { body: { email: value, source } });
  } catch {
    return { ok: false, reason: 'error', message: 'Something went wrong. Try again.' };
  }

  if (res.ok) return { ok: true };

  if (res.status === 409) {
    return { ok: false, reason: 'duplicate', message: "You're already on the list." };
  }
  if (res.status === 400) {
    const body = await res.json().catch(() => null) as { error?: string } | null;
    return { ok: false, reason: 'invalid', message: body?.error ?? 'Please enter a valid email.' };
  }
  if (res.status === 429) {
    return { ok: false, reason: 'error', message: 'Too many submissions. Wait a moment and try again.' };
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
