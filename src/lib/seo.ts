// ============================================================
// ÉIRVOX - SEO head management
// Updates document.title + meta tags per route. Hash-router friendly.
// ============================================================

const SITE = 'ÉIRVOX';
const SITE_URL = 'https://eirvox.ie';
const DEFAULT_DESC =
  "Carbon steering wheels you'll want the moment you see them — and know are real. The DRIVE line and a fitted BMW range. Designed in Ireland, finished in Dublin.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SeoData {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
  /** Emit <meta name="robots" content="noindex, follow">. Used for 404
   *  and gated routes so crawlers drop hidden paths. Default false. */
  noindex?: boolean;
}

function getOrCreateMeta(selector: string, attrs: Record<string, string>): HTMLMetaElement {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  return el;
}

function getOrCreateLink(rel: string): HTMLLinkElement {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
}

export function applySeo({ title, description, path = '/', ogImage = OG_IMAGE, noindex = false }: SeoData): void {
  if (typeof document === 'undefined') return;

  const fullTitle = title.includes(SITE) ? title : `${title} · ${SITE}`;
  const url = `${SITE_URL}${path === '/' ? '/' : `/#${path}`}`;

  document.title = fullTitle;

  getOrCreateMeta('meta[name="description"]', { name: 'description' }).setAttribute('content', description);

  // Robots. Every page sets this explicitly so navigating away from a
  // noindex 404 restores index,follow on the next route.
  getOrCreateMeta('meta[name="robots"]', { name: 'robots' })
    .setAttribute('content', noindex ? 'noindex, follow' : 'index, follow');

  // Canonical
  getOrCreateLink('canonical').setAttribute('href', url);

  // Open Graph
  getOrCreateMeta('meta[property="og:title"]', { property: 'og:title' }).setAttribute('content', fullTitle);
  getOrCreateMeta('meta[property="og:description"]', { property: 'og:description' }).setAttribute('content', description);
  getOrCreateMeta('meta[property="og:url"]', { property: 'og:url' }).setAttribute('content', url);
  getOrCreateMeta('meta[property="og:image"]', { property: 'og:image' }).setAttribute('content', ogImage);
  getOrCreateMeta('meta[property="og:type"]', { property: 'og:type' }).setAttribute('content', 'website');
  getOrCreateMeta('meta[property="og:site_name"]', { property: 'og:site_name' }).setAttribute('content', SITE);

  // Twitter
  getOrCreateMeta('meta[name="twitter:card"]', { name: 'twitter:card' }).setAttribute('content', 'summary_large_image');
  getOrCreateMeta('meta[name="twitter:title"]', { name: 'twitter:title' }).setAttribute('content', fullTitle);
  getOrCreateMeta('meta[name="twitter:description"]', { name: 'twitter:description' }).setAttribute('content', description);
  getOrCreateMeta('meta[name="twitter:image"]', { name: 'twitter:image' }).setAttribute('content', ogImage);
}

// ── Per-route SEO data ──────────────────────────────────────

export const seo = {
  home: (): SeoData => ({
    title: 'ÉIRVOX — Carbon Steering Wheels',
    description:
      "Carbon steering wheels you'll want the moment you see them — and know are real. The DRIVE line and a fitted BMW range. Designed in Ireland, finished in Dublin.",
    path: '/',
  }),

  category: (slug: string, label: string, count: number): SeoData => ({
    title: label,
    description: `${label} on ÉIRVOX - ${count} listings from verified Irish sellers. Express interest, no commitment until you've spoken with the seller.`,
    path: `/${slug}`,
  }),

  listing: (title: string, subtitle: string | undefined, price: string, _location: string, slug: string): SeoData => ({
    title,
    description: subtitle
      ? `${subtitle}. Finished in Dublin, fitted to your car. ${price}.`
      : `Finished in Dublin, fitted to your car. ${price}.`,
    path: `/listing/${slug}`,
  }),

  drive: (): SeoData => ({
    title: 'DRIVE',
    description:
      'DRIVE is the editorial imprint of ÉIRVOX. Limited-run OEM+ pieces. One specification per issue. Finished in Dublin.',
    path: '/drive',
  }),

  driveIssue: (slug: string): SeoData => ({
    title: 'DRIVE',
    description:
      'A DRIVE issue from ÉIRVOX — one specification, a limited run, finished in Dublin.',
    path: `/drive/${slug}`,
  }),

  sell: (): SeoData => ({
    title: 'Sell on ÉIRVOX',
    description:
      'Sell on Ireland\'s premium marketplace. Three tiers - Verified, Atelier, House. Admission by application.',
    path: '/sell',
  }),

  sellApply: (): SeoData => ({
    title: 'Apply to sell',
    description:
      'Apply to sell on ÉIRVOX. Five steps, three minutes. Every applicant is reviewed by hand.',
    path: '/sell/apply',
  }),

  sellCreate: (): SeoData => ({
    title: 'Create listing',
    description: 'Draft a new listing on ÉIRVOX - six steps from category to review.',
    path: '/sell/create',
  }),

  sellDashboard: (): SeoData => ({
    title: 'Seller dashboard preview',
    description: 'Preview of the ÉIRVOX seller dashboard.',
    path: '/sell/dashboard',
  }),

  trust: (): SeoData => ({
    title: 'Trust',
    description:
      'How buying an ÉIRVOX wheel works — you pay us directly, and we stand behind what we ship.',
    path: '/trust',
  }),

  about: (): SeoData => ({
    title: 'About',
    description:
      'ÉIRVOX is a carbon steering-wheel specialist in Dublin. A fitted BMW range and the DRIVE edition line. Designed in Ireland, assembled abroad, finished in Dublin.',
    path: '/about',
  }),

  login: (): SeoData => ({
    title: 'Sign in',
    description: 'Sign in to ÉIRVOX. Magic-link sign-in - no password required.',
    path: '/login',
  }),

  account: (tab: string): SeoData => {
    const titles: Record<string, string> = {
      overview: 'Account',
      orders: 'Your reservations',
      saved: 'Saved items',
      settings: 'Settings',
    };
    return {
      title: titles[tab] ?? 'Account',
      description: 'Your ÉIRVOX account - reservations, saved items, settings.',
      path: tab === 'overview' ? '/account' : `/account/${tab}`,
    };
  },

  sitemap: (): SeoData => ({
    title: 'Sitemap',
    description: 'Every page on ÉIRVOX - quick navigation for buyers, sellers, and crawlers.',
    path: '/sitemap',
  }),

  notFound: (): SeoData => ({
    title: 'Page not found',
    description: "The page you're looking for doesn't exist on ÉIRVOX.",
    path: '/404',
    noindex: true,
  }),
};
