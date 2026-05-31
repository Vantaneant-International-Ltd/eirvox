// ============================================================
// ÉIRVOX — API layer (Supabase-backed)
// Single source of truth for all read queries against the public
// site. Pages should import from here instead of touching Supabase
// directly.
// ============================================================

import { supabase, withTimeout } from './supabase';
import { getCurrentUser } from './auth';

// ── Re-exported / canonical types ────────────────────────────

export type SellerTier = 'verified' | 'atelier' | 'house';
export type ListingStatus = 'draft' | 'pending_review' | 'active' | 'reserved' | 'sold' | 'removed';
// Per-listing payment configuration; mirrors the DB column. The
// PayButton uses this to display the right amount; the server is the
// authoritative resolver via api/payments/create-order.
export type PaymentMode = 'full' | 'full_plus_shipping' | 'deposit';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  active?: boolean;
  subcategories?: string[];
  listing_count?: number;
}

export interface Seller {
  id: string;
  trading_name: string;
  handle: string | null;
  tier: SellerTier;
  city: string | null;
  bio: string | null;
  logo_url: string | null;
  // Surface-able contact (v1 is hands-off: listing pages show these
  // directly so buyers contact the seller without a platform middleman)
  email: string | null;
  phone: string | null;
  // Merchant-of-record flag. True only for the seller row representing
  // ÉIRVOX itself. Drives the PayButton render-gate on listing pages
  // (cosmetic) and is re-checked server-side in create-order (real).
  is_house: boolean;
  // Derived (not in DB yet, fall back to safe defaults)
  rating?: number;
  sales_count?: number;
  response_time?: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string | null;
  sort_order: number;
}

export interface ListingSpec {
  id: string;
  listing_id: string;
  label: string;
  value: string;
  sort_order: number;
}

export interface Listing {
  id: string;
  slug: string | null;
  seller_id: string;
  category_id: string | null;
  category_slug: string | null;
  subcategory: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  condition: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  city: string | null;
  status: ListingStatus;
  views_count: number;
  featured: boolean;
  shipping_available: boolean;
  collection_available: boolean;
  accepts_offers: boolean;
  // Payment configuration. Only meaningful when seller.is_house = true.
  // Server resolves the authoritative charge from these fields.
  payment_mode: PaymentMode;
  deposit_amount: number | null;
  shipping_cost: number | null;
  created_at: string;
  published_at: string | null;
}

export interface ListingWithExtras extends Listing {
  seller: Seller | null;
  cover_image: string | null;
  images?: ListingImage[];
  specs?: ListingSpec[];
}

export interface Tradesperson {
  id: string;
  slug: string | null;
  name: string;
  trade: string;
  tagline: string | null;
  bio: string | null;
  county: string | null;
  town: string | null;
  coverage_areas: string[];
  years_experience: number | null;
  qualifications: string[];
  rating: number | null;
  review_count: number;
  completed_jobs: number;
  phone: string | null;
  email: string | null;
  response_time: string | null;
  available_now: boolean;
  tier: 'listed' | 'pro';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verified: boolean;
  created_at: string;
}

export interface TradeCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  count?: number;
}

// Site settings shape — mirrors lib/admin.ts
export interface SiteSettings {
  cohort: { number: number; status: 'open' | 'closed'; closes_at: string; tagline: string };
  drive:  { issue_number: number; issue_title: string; total_allocation: number; remaining: number; price_eur: number };
  fees:   { verified_commission_pct: number; atelier_commission_pct: number; house_commission_pct: number; trade_listed_monthly_eur: number; trade_pro_monthly_eur: number };
  deposit:{ amount_eur: number; refundable: boolean };
}

const DEFAULT_SETTINGS: SiteSettings = {
  cohort:  { number: 3, status: 'open', closes_at: '2026-06-14', tagline: 'COHORT 03 · CLOSES 14 JUN' },
  drive:   { issue_number: 12, issue_title: 'PORSCHE 911 992 GT3', total_allocation: 200, remaining: 47, price_eur: 149 },
  fees:    { verified_commission_pct: 12, atelier_commission_pct: 10, house_commission_pct: 8, trade_listed_monthly_eur: 0, trade_pro_monthly_eur: 49 },
  deposit: { amount_eur: 49, refundable: true },
};

// ── Helpers ──────────────────────────────────────────────────

/** Format a price in euros. Accepts whole euros. */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price ?? 0);
}

/** Map a Supabase seller row's `tier` to the display label. */
export function sellerTierLabel(tier: SellerTier | string | null | undefined): string {
  if (!tier) return 'VERIFIED';
  return tier.toUpperCase();
}

/** Attach cover_image (first image sorted by sort_order) to a row. */
function attachCover(row: any): ListingWithExtras {
  const imgs: { public_url: string | null; sort_order: number }[] = row.images ?? [];
  imgs.sort((a, b) => a.sort_order - b.sort_order);
  return {
    ...(row as ListingWithExtras),
    cover_image: imgs[0]?.public_url ?? null,
    seller: row.seller ?? null,
  };
}

// ── Categories ───────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const [catsR, countsR] = await Promise.all([
    withTimeout(
      supabase.from('categories').select('*').order('sort_order', { ascending: true }),
      10_000, 'categories'),
    withTimeout(
      supabase.rpc('category_listing_counts'),
      10_000, 'category_listing_counts'),
  ]);

  if (!catsR.ok) return [];
  const cats = ((catsR.value as any).data ?? []) as Category[];

  let counts: Record<string, number> = {};
  if (countsR.ok) {
    const rows = ((countsR.value as any).data ?? []) as { category_slug: string; listing_count: number }[];
    counts = rows.reduce((acc, r) => { acc[r.category_slug] = Number(r.listing_count); return acc; }, {} as Record<string, number>);
  }

  return cats.map(c => ({ ...c, listing_count: counts[c.slug] ?? 0 }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Category;
}

// ── Listings ─────────────────────────────────────────────────

export interface ListingsOptions {
  category?: string;
  status?: ListingStatus | 'any';
  featured?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'recent' | 'oldest' | 'price_asc' | 'price_desc' | 'popular';
  seller_id?: string;
  subcategory?: string;
}

const LISTING_SELECT = `
  *,
  seller:sellers ( id, trading_name, handle, tier, city, logo_url, bio, email, phone, is_house ),
  images:listing_images ( id, public_url, sort_order )
`;

export async function getListings(options: ListingsOptions = {}): Promise<ListingWithExtras[]> {
  const {
    category, status = 'active', featured, limit = 24, offset = 0, sort = 'recent', seller_id, subcategory,
  } = options;

  let q = supabase.from('listings').select(LISTING_SELECT);

  if (status !== 'any') q = q.eq('status', status);
  if (category) q = q.eq('category_slug', category);
  if (subcategory) q = q.eq('subcategory', subcategory);
  if (featured) q = q.eq('featured', true);
  if (seller_id) q = q.eq('seller_id', seller_id);

  switch (sort) {
    case 'oldest':     q = q.order('created_at',   { ascending: true });  break;
    case 'price_asc':  q = q.order('price',        { ascending: true });  break;
    case 'price_desc': q = q.order('price',        { ascending: false }); break;
    case 'popular':    q = q.order('views_count',  { ascending: false }); break;
    default:           q = q.order('published_at', { ascending: false, nullsFirst: false })
                          .order('created_at',   { ascending: false });
  }

  q = q.range(offset, offset + limit - 1);

  const r = await withTimeout(q, 10_000, 'getListings');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: any[] | null; error: unknown };
  if (error || !data) return [];
  return data.map(attachCover);
}

export async function getListingBySlug(slug: string): Promise<ListingWithExtras | null> {
  // Try slug column first, fall back to id (so old UUID-style URLs still work)
  let { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:sellers ( id, trading_name, handle, tier, city, logo_url, bio, email, phone, is_house ),
      images:listing_images ( id, listing_id, storage_path, public_url, sort_order ),
      specs:listing_specs ( id, listing_id, label, value, sort_order )
    `)
    .eq('slug', slug)
    .maybeSingle();

  if ((!data || error) && /^[0-9a-f-]{36}$/.test(slug)) {
    const r2 = await supabase
      .from('listings')
      .select(`
        *,
        seller:sellers ( id, trading_name, handle, tier, city, logo_url, bio, email, phone, is_house ),
        images:listing_images ( id, listing_id, storage_path, public_url, sort_order ),
        specs:listing_specs ( id, listing_id, label, value, sort_order )
      `)
      .eq('id', slug)
      .maybeSingle();
    data = r2.data;
    error = r2.error;
  }

  if (error || !data) return null;

  const imgs = ((data as any).images ?? []) as ListingImage[];
  imgs.sort((a, b) => a.sort_order - b.sort_order);
  const specs = ((data as any).specs ?? []) as ListingSpec[];
  specs.sort((a, b) => a.sort_order - b.sort_order);

  return {
    ...(data as Listing),
    seller: (data as any).seller ?? null,
    cover_image: imgs[0]?.public_url ?? null,
    images: imgs,
    specs,
  };
}

export async function getFeaturedListings(limit = 8): Promise<ListingWithExtras[]> {
  return getListings({ featured: true, status: 'active', limit, sort: 'recent' });
}

export async function getRecentListings(limit = 8): Promise<ListingWithExtras[]> {
  return getListings({ status: 'active', limit, sort: 'recent' });
}

export async function getListingsBySeller(sellerId: string, limit = 8, excludeId?: string): Promise<ListingWithExtras[]> {
  const rows = await getListings({ seller_id: sellerId, status: 'active', limit: limit + 1 });
  return excludeId ? rows.filter(l => l.id !== excludeId).slice(0, limit) : rows.slice(0, limit);
}

export async function getSimilarListings(categorySlug: string | null, excludeId: string, limit = 4): Promise<ListingWithExtras[]> {
  if (!categorySlug) return [];
  const rows = await getListings({ category: categorySlug, status: 'active', limit: limit + 1 });
  return rows.filter(l => l.id !== excludeId).slice(0, limit);
}

/** Total count for pagination. */
export async function getListingsCount(category?: string, subcategory?: string): Promise<number> {
  let q = supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
  if (category) q = q.eq('category_slug', category);
  if (subcategory) q = q.eq('subcategory', subcategory);
  const { count } = await q;
  return count ?? 0;
}

/** Fire-and-forget view counter. */
export function incrementListingView(slug: string): void {
  void supabase.rpc('increment_listing_view', { listing_slug: slug });
}

// ── Search ───────────────────────────────────────────────────

export async function searchListings(query: string, limit = 24): Promise<ListingWithExtras[]> {
  const q = query.trim();
  if (!q) return [];
  const r = await withTimeout(
    supabase.rpc('search_listings', { q, lim: limit }),
    10_000, 'search_listings'
  );
  if (!r.ok) return [];
  const ids = (((r.value as any).data ?? []) as { id: string }[]).map(x => x.id);
  if (ids.length === 0) return [];

  // Re-fetch with joins
  const { data } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .in('id', ids);

  const order = new Map(ids.map((id, i) => [id, i]));
  return (data ?? [])
    .map(attachCover)
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function searchTradespeople(query: string, limit = 24): Promise<Tradesperson[]> {
  const q = query.trim();
  if (!q) return [];
  const r = await withTimeout(
    supabase.rpc('search_tradespeople', { q, lim: limit }),
    10_000, 'search_tradespeople'
  );
  if (!r.ok) return [];
  return ((r.value as any).data ?? []) as Tradesperson[];
}

// ── Tradespeople ─────────────────────────────────────────────

export async function getTradeCategories(): Promise<TradeCategory[]> {
  const [catsR, countsR] = await Promise.all([
    withTimeout(
      supabase.from('trade_categories').select('*').order('sort_order', { ascending: true }),
      10_000, 'trade_categories'),
    withTimeout(
      supabase.from('tradespeople').select('trade').eq('status', 'approved'),
      10_000, 'tradespeople_counts'),
  ]);

  if (!catsR.ok) return [];
  const cats = (((catsR.value as any).data ?? []) as TradeCategory[]);

  let counts: Record<string, number> = {};
  if (countsR.ok) {
    const rows = ((countsR.value as any).data ?? []) as { trade: string }[];
    counts = rows.reduce((acc, r) => { acc[r.trade] = (acc[r.trade] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  }

  return cats.map(c => ({ ...c, count: counts[c.slug] ?? 0 }));
}

export interface TradespeopleOptions {
  category?: string;
  county?: string;
  sort?: 'rating' | 'newest' | 'jobs';
  limit?: number;
}

export async function getTradespeople(options: TradespeopleOptions = {}): Promise<Tradesperson[]> {
  let q = supabase.from('tradespeople').select('*').eq('status', 'approved');
  if (options.category) q = q.eq('trade', options.category);
  if (options.county) q = q.eq('county', options.county);

  switch (options.sort) {
    case 'newest': q = q.order('created_at', { ascending: false }); break;
    case 'jobs':   q = q.order('completed_jobs', { ascending: false }); break;
    default:       q = q.order('rating', { ascending: false, nullsFirst: false });
  }
  if (options.limit) q = q.limit(options.limit);

  const r = await withTimeout(q, 10_000, 'tradespeople');
  if (!r.ok) return [];
  return (((r.value as any).data ?? []) as Tradesperson[]);
}

export async function getTradespersonBySlug(slug: string): Promise<Tradesperson | null> {
  const { data, error } = await supabase
    .from('tradespeople')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Tradesperson;
}

// ── Site settings ────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  const r = await withTimeout(
    supabase.from('site_settings').select('key, value'),
    10_000, 'site_settings'
  );
  if (!r.ok) return DEFAULT_SETTINGS;
  const rows = ((r.value as any).data ?? []) as { key: string; value: any }[];
  const map: Record<string, any> = {};
  for (const row of rows) map[row.key] = row.value;
  return {
    cohort:  { ...DEFAULT_SETTINGS.cohort,  ...(map.cohort  ?? {}) },
    drive:   { ...DEFAULT_SETTINGS.drive,   ...(map.drive   ?? {}) },
    fees:    { ...DEFAULT_SETTINGS.fees,    ...(map.fees    ?? {}) },
    deposit: { ...DEFAULT_SETTINGS.deposit, ...(map.deposit ?? {}) },
  };
}

// ── Saved items (buyer bookmarks) ────────────────────────────

export async function getMySavedItems(): Promise<string[]> {
  const u = getCurrentUser();
  if (!u) return [];
  const { data, error } = await supabase
    .from('saved_items')
    .select('listing_id')
    .eq('user_id', u.id);
  if (error || !data) return [];
  return data.map((r: any) => r.listing_id);
}

export async function getMySavedListings(): Promise<ListingWithExtras[]> {
  const u = getCurrentUser();
  if (!u) return [];
  const { data, error } = await supabase
    .from('saved_items')
    .select(`
      saved_at,
      listing:listings (
        ${LISTING_SELECT}
      )
    `)
    .eq('user_id', u.id)
    .order('saved_at', { ascending: false });
  if (error || !data) return [];
  return (data as any[])
    .map(r => r.listing)
    .filter(Boolean)
    .map(attachCover);
}

export async function saveListing(listingId: string): Promise<{ ok: boolean; error?: string }> {
  const u = getCurrentUser();
  if (!u) return { ok: false, error: 'Sign in to save items.' };
  const { error } = await supabase
    .from('saved_items')
    .upsert({ user_id: u.id, listing_id: listingId }, { onConflict: 'user_id,listing_id' });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function unsaveListing(listingId: string): Promise<{ ok: boolean; error?: string }> {
  const u = getCurrentUser();
  if (!u) return { ok: false, error: 'Sign in to save items.' };
  const { error } = await supabase
    .from('saved_items')
    .delete()
    .eq('user_id', u.id)
    .eq('listing_id', listingId);
  return error ? { ok: false, error: error.message } : { ok: true };
}

// Reservations are out of v1. Replaced by Express Interest /api/enquiries.
// The reservations TABLE is intentionally retained for the admin view of
// historical records.
