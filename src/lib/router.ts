import { writable } from 'svelte/store';

function getPath(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return '/';
  return hash.slice(1);
}

export const currentPath = writable<string>(getPath());

/** Re-sync currentPath from the current URL. Required after a
 *  history.replaceState() that strips the hash (the #dev / #maintenance /
 *  #coming-soon / #exit-preview bypass handlers in flags.ts), because
 *  replaceState does NOT fire a hashchange event. Without this the store
 *  stays on the stale bypass token (e.g. 'dev'), which matches no route
 *  and falls through to NotFound until a manual refresh. */
export function syncPath(): void {
  currentPath.set(getPath());
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentPath.set(getPath());
    // Scroll to top + send focus to main content for keyboard/AT users.
    // Defer to next frame so the new route has mounted.
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      const main = document.getElementById('main-content');
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    });
  });
}

export function navigate(to: string): void {
  if (typeof window !== 'undefined') {
    window.location.hash = to;
  }
}

export interface RouteParams {
  [key: string]: string;
}

export function matchRoute(pattern: string, path: string): RouteParams | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: RouteParams = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

export function isActive(linkPath: string, currentPathValue: string): boolean {
  if (linkPath === '/') return currentPathValue === '/';
  return currentPathValue.startsWith(linkPath);
}
