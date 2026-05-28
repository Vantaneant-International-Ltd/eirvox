import { writable } from 'svelte/store';

function getPath(): string {
  if (typeof window === 'undefined') return '/';
  const hash = window.location.hash;
  if (!hash || hash === '#' || hash === '#/') return '/';
  return hash.slice(1);
}

export const currentPath = writable<string>(getPath());

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    currentPath.set(getPath());
    window.scrollTo(0, 0);
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
