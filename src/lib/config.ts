/**
 * Site-wide mode flags.
 * Flip COMING_SOON to false to expose the full site.
 * Visitors can also bypass via the URL hash #dev (stored in sessionStorage).
 */
export const COMING_SOON = true;

export const DEV_BYPASS_KEY = 'eirvox_dev_bypass';

export function isDevBypassed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.location.hash === '#dev') {
    sessionStorage.setItem(DEV_BYPASS_KEY, '1');
    // Clear the bypass hash so the router lands on '/' cleanly.
    history.replaceState(null, '', window.location.pathname + window.location.search);
    return true;
  }
  return sessionStorage.getItem(DEV_BYPASS_KEY) === '1';
}
