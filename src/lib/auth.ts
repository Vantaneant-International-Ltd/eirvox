// ============================================================
// ÉIRVOX — Auth store + helpers
// Tracks Supabase session + the user's profile (incl. role).
// ============================================================

import { writable, derived, get } from 'svelte/store';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, fetchProfile, type Profile, type UserRole } from './supabase';

// ── Stores ──────────────────────────────────────────────────

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialised: boolean;
}

const initial: AuthState = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  initialised: false,
};

export const auth = writable<AuthState>(initial);

/** Convenience derived stores */
export const currentUser = derived(auth, $a => $a.user);
export const currentProfile = derived(auth, $a => $a.profile);
export const currentRole = derived(auth, $a => $a.profile?.role ?? null);
export const isAuthenticated = derived(auth, $a => !!$a.session);
export const isLoading = derived(auth, $a => $a.loading);

// ── Internal helpers ────────────────────────────────────────

async function applySession(session: Session | null) {
  if (!session) {
    auth.update(s => ({
      ...s,
      session: null,
      user: null,
      profile: null,
      loading: false,
    }));
    return;
  }

  // Set immediately with what we have so guards can react
  auth.update(s => ({
    ...s,
    session,
    user: session.user,
    loading: true,
  }));

  // Fetch profile (role lives there)
  const profile = await fetchProfile(session.user.id);

  auth.update(s => ({
    ...s,
    session,
    user: session.user,
    profile,
    loading: false,
  }));
}

// ── Init: call once from App.svelte onMount ────────────────

let initStarted = false;

export async function initAuth(): Promise<void> {
  if (initStarted) return;
  initStarted = true;

  // Restore any existing session from storage
  const { data } = await supabase.auth.getSession();
  await applySession(data.session);

  // Listen for future changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });

  auth.update(s => ({ ...s, initialised: true }));
}

// ── Public actions ──────────────────────────────────────────

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** Email + password sign-up. Creates a profile row on success
 *  (profiles row should be auto-created by a Supabase trigger;
 *  if not, we backfill name and email after sign-up). */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const trimmedEmail = email.trim();
  const trimmedName = fullName.trim();

  if (!trimmedEmail || !password || !trimmedName) {
    return { ok: false, error: 'Please fill in every field.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      data: { full_name: trimmedName },
    },
  });

  if (error) {
    return { ok: false, error: friendlyAuthError(error.message) };
  }

  // If a session came back, try to ensure name/email are in the profile.
  // If your DB has an auth.users → profiles trigger this is redundant, harmless.
  if (data.user) {
    await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          full_name: trimmedName,
          email: trimmedEmail,
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();
  }

  return { ok: true };
}

/** Email + password sign-in. */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  const trimmed = email.trim();
  if (!trimmed || !password) return { ok: false, error: 'Email and password are both required.' };

  const { error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

/** Sign out. */
export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Send a password-reset email. */
export async function resetPassword(email: string): Promise<AuthResult> {
  const trimmed = email.trim();
  if (!trimmed) return { ok: false, error: 'Please enter your email.' };

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/#/login` : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo,
  });

  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  return { ok: true };
}

// ── Role helpers (sync; read current store) ─────────────────

export function getCurrentUser(): User | null {
  return get(auth).user;
}

export function getCurrentProfile(): Profile | null {
  return get(auth).profile;
}

export function getCurrentRole(): UserRole | null {
  return get(auth).profile?.role ?? null;
}

export function isAdmin(): boolean {
  return getCurrentRole() === 'admin';
}

export function isSeller(): boolean {
  const role = getCurrentRole();
  return role === 'seller' || role === 'admin';
}

// ── Error mapping ──────────────────────────────────────────

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password don\'t match.';
  if (m.includes('user already registered')) return 'An account with that email already exists. Try logging in.';
  if (m.includes('email not confirmed')) return 'Confirm your email first — check your inbox.';
  if (m.includes('weak password') || m.includes('password should be at least')) {
    return 'That password is too weak — use at least 8 characters with a mix of letters and numbers.';
  }
  if (m.includes('rate limit')) return 'Too many attempts. Wait a minute and try again.';
  if (m.includes('email rate limit')) return 'Too many emails sent. Wait a few minutes.';
  return msg;
}
