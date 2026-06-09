// ============================================================
// ÉIRVOX - Site flags (DB-backed, admin-toggleable)
// ============================================================
//
// Two independent visibility gates:
//   coming_soon  - pre-launch landing. Visitors see ComingSoonHero,
//                  email capture goes into waitlist.
//   maintenance  - temporary outage banner page with support email.
//                  Takes precedence over coming_soon when both on.
//
// Both live in public.site_settings under key='flags' so the admin
// panel can flip them without a redeploy. Anon SELECT on
// site_settings is already permitted via site_settings_public_read.
//
// Cached in localStorage for instant render on next load - flags
// change rarely, eventual consistency is fine.
// ============================================================

import { writable, derived } from 'svelte/store';
import { supabase } from './supabase';

export interface SiteFlags {
  coming_soon: boolean;
  maintenance: boolean;
  maintenance_message: string;
  support_email: string;
  // v20. Wheel-specialist scope.
  //
  // When true:
  //   - Nav.svelte renders the tight nav (Wheels / How / About /
  //     Contact) and hides the marketplace categories + TRADE.
  //   - Public listing queries (getListings + search) filter to
  //     category_slug IN public_category_allowlist. Non-automotive
  //     listings stay in the DB (reversible) but disappear from the
  //     public site.
  //   - Home renders the wheel-focused page.
  //
  // To revert to full marketplace: set wheel_specialist_mode=false in
  // /admin/settings. Nothing is deleted. The marketplace categories
  // re-appear, non-automotive listings re-appear, all DRIVE/TRADE
  // infrastructure is intact.
  wheel_specialist_mode: boolean;
  /** Whitelist of category_slug values surfaced to the public site
   *  when wheel_specialist_mode is on. Order is preserved for nav. */
  public_category_allowlist: string[];
}

const CACHE_KEY = 'eirvox_site_flags';

const DEFAULT_FLAGS: SiteFlags = {
  // Default to coming_soon=true so a fresh deploy with no DB row
  // still shows the gate (fail-safe).
  coming_soon: true,
  maintenance: false,
  maintenance_message: "We're making a quick update. We'll be back shortly.",
  support_email: 'support@eirvox.ie',
  // Default ON: the wheel-specialist repositioning is the launch
  // posture. Toggle off in /admin/settings to expose the full
  // marketplace; nothing is destructively removed.
  wheel_specialist_mode: true,
  // Wheels only. A listing is public iff is_drive (DRIVE wheels) OR its
  // category_slug is in this list. 'cars' was dropped deliberately: the
  // only 'cars' listing (VW Polo) is owner-set to draft and must stay
  // hidden. The BMW consignment wheel carries category 'automotive'.
  // Keep in lockstep with the v22 RLS fail-closed default.
  public_category_allowlist: ['automotive'],
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

/** True when the visitor is hitting a legal page (Privacy / Terms / etc.)
 *  while a gate (coming_soon or maintenance) would otherwise be active.
 *  LegalLayout reads this to render stripped chrome instead of the full
 *  Nav + Footer, so coming-soon visitors don't see the whole site
 *  through the policy links. App.svelte sets it. */
export const gatedLegalMode = writable<boolean>(false);

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

// ── Gate previews (production-safe) ───────────────────────────
//
// Admins bypass both gates by default (so /admin works after a
// coming-soon flip), which means they can't see what visitors see.
// These two hashes opt into a per-tab preview:
//
//   <host>/#maintenance   → render MaintenanceHero this tab only
//   <host>/#coming-soon   → render ComingSoonHero this tab only
//   <host>/#exit-preview  → clear both, go back to normal
//
// Both stored in sessionStorage so the preview dies when the tab
// closes. No DEV gate - harmless in production (only renders a
// hero a regular visitor would already see).

export const MAINTENANCE_PREVIEW_KEY = 'eirvox_maintenance_preview';
export const COMING_SOON_PREVIEW_KEY = 'eirvox_coming_soon_preview';

function clearAllPreviews() {
  sessionStorage.removeItem(MAINTENANCE_PREVIEW_KEY);
  sessionStorage.removeItem(COMING_SOON_PREVIEW_KEY);
}

export function isMaintenancePreviewed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash === '#maintenance') {
    sessionStorage.setItem(MAINTENANCE_PREVIEW_KEY, '1');
    sessionStorage.removeItem(COMING_SOON_PREVIEW_KEY);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }
  if (window.location.hash === '#exit-preview') {
    clearAllPreviews();
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return false;
  }
  return sessionStorage.getItem(MAINTENANCE_PREVIEW_KEY) === '1';
}

export function isComingSoonPreviewed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash === '#coming-soon') {
    sessionStorage.setItem(COMING_SOON_PREVIEW_KEY, '1');
    sessionStorage.removeItem(MAINTENANCE_PREVIEW_KEY);
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }
  if (window.location.hash === '#exit-preview') {
    clearAllPreviews();
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return false;
  }
  return sessionStorage.getItem(COMING_SOON_PREVIEW_KEY) === '1';
}

// ── Derived: which gate (if any) should the app render? ────────

export type GateMode = 'maintenance' | 'coming_soon' | 'live' | 'loading';

/** Resolve the active gate. Pass the current bypass + preview state.
 *  Precedence: maintenance preview > coming-soon preview > dev bypass >
 *  maintenance flag > coming_soon flag > loading > live. */
export function resolveGate(
  flags: SiteFlags,
  bypassed: boolean,
  loading: boolean,
  maintenancePreview: boolean = false,
  comingSoonPreview: boolean = false,
): GateMode {
  if (maintenancePreview) return 'maintenance';
  if (comingSoonPreview) return 'coming_soon';
  if (bypassed) return 'live';
  if (flags.maintenance) return 'maintenance';
  if (flags.coming_soon) return 'coming_soon';
  if (loading) return 'loading';
  return 'live';
}
