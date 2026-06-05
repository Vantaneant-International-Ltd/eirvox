// ============================================================
// ÉIRVOX - Google Analytics pageview tracker (SPA-aware)
// ============================================================
// The gtag snippet in index.html loads with `send_page_view: false`
// because hash routing means GA's auto-pageview only fires once at
// initial load. This module subscribes to `currentPath` and emits a
// `page_view` event on every navigation, so GA records the SPA
// route as the page URL instead of always showing "/".
//
// Consent is enforced by gtag itself (Consent Mode v2 default-denied
// in index.html). When the user clicks Essential only in
// CookieBanner.svelte, analytics_storage stays denied and these
// page_view events are dropped server-side; on Accept all they start
// being recorded. So we can fire freely without checking consent
// here - gtag respects it.
// ============================================================

import { currentPath } from './router';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = 'G-SNEJVZK2LE';

function emitPageView(path: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  // The full hash route, e.g. "#/listing/vw-polo-gti-2017-stage-1"
  const pageLocation = `${window.location.origin}/#${path}`;
  window.gtag('event', 'page_view', {
    page_location: pageLocation,
    page_path: `#${path}`,
    page_title: document.title,
    send_to: GA_ID,
  });
}

let started = false;

/** Start the pageview tracker. Idempotent. Call once from App.svelte
 *  onMount. Emits the initial pageview + one per route change. */
export function initAnalytics(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  // Initial pageview for the route the visitor landed on
  let lastPath: string | null = null;
  const unsub = currentPath.subscribe(path => {
    if (path === lastPath) return;
    lastPath = path;
    emitPageView(path);
  });

  // Keep alive for the page lifetime; svelte stores cancel on unmount
  // but we never unmount App.svelte, so no need to retain the unsub.
  void unsub;
}
