// ============================================================
// ÉIRVOX — Site flags (DB-backed, admin-toggleable)
// ============================================================
//
// Two independent visibility gates:
//   coming_soon  — pre-launch landing. Visitors see ComingSoonHero,
//                  email capture goes into waitlist.
//   maintenance  — temporary outage banner page with support email.
//                  Takes precedence over coming_soon when both on.
//
// Both live in public.site_settings under key='flags' so the admin
// panel can flip them without a redeploy. Anon SELECT on
// site_settings is already permitted via site_settings_public_read.
//
// Cached in localStorage for instant render on next load — flags
// change rarely, eventual consistency is fine.
// ============================================================

import { writable, derived } from 'svelte/store';
import { supabase } from './supabase';

export interface SiteFlags {
  coming_soon: boolean;
  maintenance: boolean;
  maintenance_message: string;
  support_email: string;
}

const CACHE_KEY = 'eirvox_site_flags';

const DEFAULT_FLAGS: SiteFlags = {
  // Default to coming_soon=true so a fresh deploy with no DB row
  // still shows the gate (fail-safe).
  coming_soon: true,
  maintenance: false,
  maintenance_message: "We're making a quick update. We'll be back shortly.",
  support_email: 'support@eirvox.ie',
};

/** Read cached flags from localStorage. Returns the defaults if no cache. */
function readCache(): SiteFlags {
  if (typeof localStorage === 'undefined') return DEFAULT_FLAGS;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return DEFAULT_FLAGS;
    return { ...DEFAULT_FLAGS, ...(JSON.parse(raw) as Partial<SiteFlags>) };
  } catch {
    return DEFAULT_FLAGS;
  }
}

function writeCache(flags: SiteFlags) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(flags)); } catch { /* quota or private mode */ }
}

/** Single source of truth for the SPA. Initialised from cache (instant),
 *  then refreshed from Supabase. */
export const siteFlags = writable<SiteFlags>(readCache());

/** True until the first DB load resolves. Lets gates render the safe
 *  default (coming_soon) immediately without showing a flash of the
 *  real site to someone who shouldn't see it. */
export const flagsLoading = writable<boolean>(true);

let loadStarted = false;

/** Fetch the live flags from Supabase and update the store + cache.
 *  Idempotent (only fires once per page load). Call from App.svelte. */
export async function loadSiteFlags(): Promise<void> {
  if (loadStarted) return;
  loadStarted = true;

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'flags')
    .maybeSingle();

  if (error || !data) {
    // Network error / missing row -> stay on cached/default flags.
    flagsLoading.set(false);
    return;
  }

  const next = { ...DEFAULT_FLAGS, ...(data.value as Partial<SiteFlags>) };
  siteFlags.set(next);
  writeCache(next);
  flagsLoading.set(false);
}

/** Admin: write new flag values. Updates DB, store, and cache. */
export async function updateSiteFlags(patch: Partial<SiteFlags>): Promise<{ ok: boolean; error?: string }> {
  // Read current to merge (so partial updates don't drop other keys)
  let current: SiteFlags = DEFAULT_FLAGS;
  siteFlags.subscribe(v => { current = v; })();

  const next = { ...current, ...patch };

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'flags', value: next }, { onConflict: 'key' });

  if (error) return { ok: false, error: error.message };

  siteFlags.set(next);
  writeCache(next);
  return { ok: true };
}

// ── Dev bypass (moved from config.ts) ─────────────────────────

export const DEV_BYPASS_KEY = 'eirvox_dev_bypass';

/** Returns true if the visitor has the #dev bypass flag set in
 *  sessionStorage (or just hit a #dev URL). Bypasses BOTH coming_soon
 *  and maintenance gates. */
export function isDevBypassed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash === '#dev') {
    sessionStorage.setItem(DEV_BYPASS_KEY, '1');
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }
  return sessionStorage.getItem(DEV_BYPASS_KEY) === '1';
}

// ── Derived: which gate (if any) should the app render? ────────

export type GateMode = 'maintenance' | 'coming_soon' | 'live' | 'loading';

/** Resolve the active gate. Pass the current bypass state. */
export function resolveGate(flags: SiteFlags, bypassed: boolean, loading: boolean): GateMode {
  if (bypassed) return 'live';
  if (flags.maintenance) return 'maintenance';
  if (flags.coming_soon) return 'coming_soon';
  if (loading) return 'loading';
  return 'live';
}
