// ============================================================
// ÉIRVOX — SEO head management
// Updates document.title + meta tags per route. Hash-router friendly.
// ============================================================

const SITE = 'ÉIRVOX';
const SITE_URL = 'https://eirvox.ie';
const DEFAULT_DESC =
  "Ireland's premium marketplace for enthusiast objects. Verified sellers, reservation deposits, authenticated items.";
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

export interface SeoData {
  title: string;
  description: string;
  path?: string;
  ogImage?: string;
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

export function applySeo({ title, description, path = '/', ogImage = OG_IMAGE }: SeoData): void {
  if (typeof document === 'undefined') return;

  const fullTitle = title.includes(SITE) ? title : `${title} · ${SITE}`;
  const url = `${SITE_URL}${path === '/' ? '/' : `/#${path}`}`;

  document.title = fullTitle;

  getOrCreateMeta('meta[name="description"]', { name: 'description' }).setAttribute('content', description);

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
    title: "Ireland's Premium Marketplace",
    description:
      "Ireland's premium marketplace for enthusiast objects. Verified sellers, reservation deposits, authenticated items. Starting with Automotive.",
    path: '/',
  }),

  category: (slug: string, label: string, count: number): SeoData => ({
    title: label,
    description: `${label} on ÉIRVOX — ${count} listings from verified Irish sellers. Reservation deposits on every item, full buyer protection.`,
    path: `/${slug}`,
  }),

  listing: (title: string, subtitle: string | undefined, price: string, location: string, slug: string): SeoData => ({
    title,
    description: subtitle
      ? `${subtitle}. ${price}. ${location}. Express interest on ÉIRVOX — Ireland's premium marketplace.`
      : `${price}. ${location}. Express interest on ÉIRVOX — Ireland's premium marketplace.`,
    path: `/listing/${slug}`,
  }),

  drive: (): SeoData => ({
    title: 'DRIVE',
    description:
      'DRIVE is the editorial imprint of ÉIRVOX. Limited-run OEM+ pieces. One specification per issue. Finished in Dublin.',
    path: '/drive',
  }),

  driveIssue: (slug: string): SeoData => ({
    title: 'DRIVE 003 · Mercedes-AMG GT Carbon Steering Wheel',
    description:
      'DRIVE Issue 003. Forged carbon shell, Alcantara wrap, champagne stitch. Eight pieces. €4,250. Express interest to confirm your allocation.',
    path: `/drive/${slug}`,
  }),

  sell: (): SeoData => ({
    title: 'Sell on ÉIRVOX · Cohort 03 Open',
    description:
      'Sell on Ireland\'s premium marketplace. Three tiers — Verified, Atelier, House. Cohort 03 applications open until 14 June.',
    path: '/sell',
  }),

  sellApply: (): SeoData => ({
    title: 'Apply to sell · Cohort 03',
    description:
      'Apply to sell on ÉIRVOX. Five steps, three minutes. Cohort 03 reviews close 14 June; approved sellers go live 01 July.',
    path: '/sell/apply',
  }),

  sellCreate: (): SeoData => ({
    title: 'Create listing',
    description: 'Draft a new listing on ÉIRVOX — six steps from category to review.',
    path: '/sell/create',
  }),

  sellDashboard: (): SeoData => ({
    title: 'Seller dashboard preview',
    description: 'Preview of the ÉIRVOX seller dashboard. Going live with Cohort 03 on 01 July 2026.',
    path: '/sell/dashboard',
  }),

  trust: (): SeoData => ({
    title: 'Trust & Protection',
    description:
      "Buyer protection, authentication, and deposit handling on ÉIRVOX. How money moves, how items are checked, and what happens when something goes wrong.",
    path: '/trust',
  }),

  about: (): SeoData => ({
    title: 'About',
    description:
      "ÉIRVOX is Ireland's premium marketplace for enthusiast objects. Marketplace-led, editorial accent, cohort-approved sellers. Founded in Dublin, 2026.",
    path: '/about',
  }),

  login: (): SeoData => ({
    title: 'Sign in',
    description: 'Sign in to ÉIRVOX. Magic-link sign-in — no password required.',
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
      description: 'Your ÉIRVOX account — reservations, saved items, settings.',
      path: tab === 'overview' ? '/account' : `/account/${tab}`,
    };
  },

  messages: (): SeoData => ({
    title: 'Messages',
    description: 'Conversations with sellers on ÉIRVOX.',
    path: '/messages',
  }),

  sitemap: (): SeoData => ({
    title: 'Sitemap',
    description: 'Every page on ÉIRVOX — quick navigation for buyers, sellers, and crawlers.',
    path: '/sitemap',
  }),

  notFound: (): SeoData => ({
    title: 'Page not found',
    description: "The page you're looking for doesn't exist on ÉIRVOX. The marketplace is waiting.",
    path: '/404',
  }),
};
