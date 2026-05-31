// ============================================================
// ÉIRVOX — Admin helpers (Supabase-backed)
// All functions assume the caller has profile.role = 'admin'.
// RLS enforces this regardless.
// ============================================================

import { supabase, withTimeout } from './supabase';
import type {
  Listing,
  ListingStatus,
  Category,
  ListingImage,
  ListingSpec,
  Reservation,
  ReservationStatus,
} from './listings';
import type { Seller, SellerStatus, SellerTier } from './sellers';
import type { Profile, UserRole } from './supabase';

// ── Generic Result type ─────────────────────────────────────

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Stats + activity ───────────────────────────────────────

export interface AdminStats {
  total_listings: number;
  total_sellers: number;
  total_reservations: number;
  total_tradespeople: number;
  total_users: number;
  pending_listings: number;
  pending_sellers: number;
  pending_trade: number;
}

const EMPTY_STATS: AdminStats = {
  total_listings: 0,
  total_sellers: 0,
  total_reservations: 0,
  total_tradespeople: 0,
  total_users: 0,
  pending_listings: 0,
  pending_sellers: 0,
  pending_trade: 0,
};

export async function getAdminStats(): Promise<AdminStats> {
  const r = await withTimeout(
    supabase.rpc('admin_stats'),
    10_000,
    'admin_stats'
  );
  if (!r.ok) return EMPTY_STATS;
  const { data, error } = r.value as { data: AdminStats | null; error: unknown };
  if (error || !data) return EMPTY_STATS;
  return { ...EMPTY_STATS, ...(data as AdminStats) };
}

export type ActivityKind = 'listing' | 'seller' | 'reservation' | 'tradesperson';

export interface ActivityRow {
  kind: ActivityKind;
  ref_id: string;
  label: string;
  status: string;
  at: string;
}

export async function getRecentActivity(limit = 10): Promise<ActivityRow[]> {
  const r = await withTimeout(
    supabase
      .from('admin_activity_recent')
      .select('*')
      .order('at', { ascending: false })
      .limit(limit),
    10_000,
    'admin_activity_recent'
  );
  if (!r.ok) return [];
  const { data, error } = r.value as { data: ActivityRow[] | null; error: unknown };
  if (error || !data) return [];
  return data;
}

// ── Listings (admin) ───────────────────────────────────────

export interface AdminListing extends Listing {
  featured: boolean;
  featured_at: string | null;
  rejection_reason: string | null;
  seller: { id: string; trading_name: string | null; handle: string | null; is_house: boolean } | null;
  category: { id: string; name: string; slug: string } | null;
  cover_image: string | null;
}

export interface ListingFilters {
  status?: ListingStatus | 'all';
  category_slug?: string | 'all';
  search?: string;
  sort?: 'created_desc' | 'created_asc' | 'price_desc' | 'price_asc' | 'views_desc';
}

export async function getAllListings(filters: ListingFilters = {}): Promise<AdminListing[]> {
  let q = supabase
    .from('listings')
    .select(`
      *,
      seller:sellers ( id, trading_name, handle, is_house ),
      category:categories ( id, name, slug ),
      images:listing_images ( public_url, sort_order )
    `);

  if (filters.status && filters.status !== 'all') {
    q = q.eq('status', filters.status);
  }
  if (filters.category_slug && filters.category_slug !== 'all') {
    q = q.eq('category_slug', filters.category_slug);
  }
  if (filters.search?.trim()) {
    q = q.ilike('title', `%${filters.search.trim()}%`);
  }

  switch (filters.sort) {
    case 'price_desc':   q = q.order('price', { ascending: false }); break;
    case 'price_asc':    q = q.order('price', { ascending: true });  break;
    case 'views_desc':   q = q.order('views_count', { ascending: false }); break;
    case 'created_asc':  q = q.order('created_at', { ascending: true });  break;
    default:             q = q.order('created_at', { ascending: false });
  }

  const r = await withTimeout(q, 10_000, 'all_listings');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: any[] | null; error: unknown };
  if (error || !data) return [];

  return data.map(l => {
    const imgs = (l.images ?? []) as { public_url: string | null; sort_order: number }[];
    imgs.sort((a, b) => a.sort_order - b.sort_order);
    return {
      ...(l as AdminListing),
      cover_image: imgs[0]?.public_url ?? null,
    };
  });
}

export async function adminUpdateListing(
  id: string,
  patch: Partial<AdminListing> & { rejection_reason?: string | null }
): Promise<Result<AdminListing>> {
  const payload: Record<string, unknown> = { ...patch };
  // Don't try to update joins
  delete (payload as any).seller;
  delete (payload as any).category;
  delete (payload as any).cover_image;

  if (patch.status === 'active') {
    payload.published_at = new Date().toISOString();
  }
  if (patch.featured === true) {
    payload.featured_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as AdminListing };
}

export async function adminDeleteListing(id: string): Promise<Result<null>> {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

export async function adminBulkSetListingStatus(
  ids: string[],
  status: ListingStatus
): Promise<Result<null>> {
  if (ids.length === 0) return { ok: true, data: null };
  const { error } = await supabase
    .from('listings')
    .update({ status })
    .in('id', ids);
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

export async function getListingDetail(id: string): Promise<{
  listing: AdminListing;
  images: ListingImage[];
  specs: ListingSpec[];
} | null> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      seller:sellers ( id, trading_name, handle, is_house ),
      category:categories ( id, name, slug )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !listing) return null;

  const [imgsR, specsR] = await Promise.all([
    supabase.from('listing_images').select('*').eq('listing_id', id).order('sort_order', { ascending: true }),
    supabase.from('listing_specs').select('*').eq('listing_id', id).order('sort_order', { ascending: true }),
  ]);

  return {
    listing: { ...(listing as AdminListing), cover_image: null },
    images: (imgsR.data ?? []) as ListingImage[],
    specs: (specsR.data ?? []) as ListingSpec[],
  };
}

// ── Sellers (admin) ────────────────────────────────────────

export interface AdminSeller extends Seller {
  listings_count?: number;
  rating?: number | null;
}

export interface SellerFilters {
  status?: SellerStatus | 'all';
  tier?: SellerTier | 'all';
  search?: string;
}

export async function getAllSellers(filters: SellerFilters = {}): Promise<AdminSeller[]> {
  let q = supabase.from('sellers').select('*');

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.tier && filters.tier !== 'all') q = q.eq('tier', filters.tier);
  if (filters.search?.trim()) q = q.ilike('trading_name', `%${filters.search.trim()}%`);

  q = q.order('created_at', { ascending: false });

  const r = await withTimeout(q, 10_000, 'all_sellers');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: any[] | null; error: unknown };
  if (error || !data) return [];

  // Get listings counts in one query
  const ids = (data ?? []).map((s: any) => s.id);
  let countsBySeller: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: counts } = await supabase
      .from('listings')
      .select('seller_id')
      .in('seller_id', ids);
    countsBySeller = (counts ?? []).reduce((acc: Record<string, number>, row: any) => {
      acc[row.seller_id] = (acc[row.seller_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  return data.map((s: any) => ({
    ...(s as Seller),
    listings_count: countsBySeller[s.id] ?? 0,
  }));
}

export async function setSellerStatus(
  id: string,
  status: SellerStatus,
  rejection_reason?: string
): Promise<Result<Seller>> {
  const payload: Record<string, unknown> = { status };
  if (status === 'approved') payload.approved_at = new Date().toISOString();
  if (rejection_reason !== undefined) payload.bio = rejection_reason;

  const { data, error } = await supabase
    .from('sellers')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Seller };
}

export async function setSellerTier(id: string, tier: SellerTier): Promise<Result<Seller>> {
  const { data, error } = await supabase
    .from('sellers')
    .update({ tier })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Seller };
}

// ── Reservations (admin) ───────────────────────────────────

export interface AdminReservation extends Reservation {
  reference: string | null;
  cancellation_reason: string | null;
  refunded_at: string | null;
  listing: { id: string; title: string; price: number } | null;
  buyer: { id: string; full_name: string | null; email: string | null } | null;
  seller: { id: string; trading_name: string | null } | null;
}

export async function getAllReservations(status?: ReservationStatus | 'all'): Promise<AdminReservation[]> {
  let q = supabase
    .from('reservations')
    .select(`
      *,
      listing:listings ( id, title, price ),
      buyer:profiles!reservations_buyer_id_fkey ( id, full_name, email ),
      seller:sellers ( id, trading_name )
    `);

  if (status && status !== 'all') q = q.eq('status', status);
  q = q.order('reserved_at', { ascending: false });

  const r = await withTimeout(q, 10_000, 'all_reservations');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: any[] | null; error: unknown };
  if (error || !data) return [];
  return data as AdminReservation[];
}

export async function adminUpdateReservation(
  id: string,
  patch: Partial<AdminReservation>
): Promise<Result<AdminReservation>> {
  const payload: Record<string, unknown> = { ...patch };
  delete (payload as any).listing;
  delete (payload as any).buyer;
  delete (payload as any).seller;

  if (patch.status === 'cancelled') {
    payload.refunded_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('reservations')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as AdminReservation };
}

// ── Tradespeople (admin) ───────────────────────────────────

export type TradesPersonStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type TradesPersonTier   = 'listed' | 'pro';

export interface Tradesperson {
  id: string;
  profile_id: string | null;
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
  tier: TradesPersonTier;
  status: TradesPersonStatus;
  verified: boolean;
  applied_at: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradesFilters {
  status?: TradesPersonStatus | 'all';
  tier?: TradesPersonTier | 'all';
  trade?: string | 'all';
  search?: string;
}

export async function getAllTradespeople(filters: TradesFilters = {}): Promise<Tradesperson[]> {
  let q = supabase.from('tradespeople').select('*');

  if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
  if (filters.tier && filters.tier !== 'all') q = q.eq('tier', filters.tier);
  if (filters.trade && filters.trade !== 'all') q = q.eq('trade', filters.trade);
  if (filters.search?.trim()) q = q.ilike('name', `%${filters.search.trim()}%`);

  q = q.order('created_at', { ascending: false });

  const r = await withTimeout(q, 10_000, 'all_tradespeople');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: Tradesperson[] | null; error: unknown };
  if (error || !data) return [];
  return data;
}

export async function setTradesPersonStatus(id: string, status: TradesPersonStatus): Promise<Result<Tradesperson>> {
  const payload: Record<string, unknown> = { status };
  if (status === 'approved') payload.approved_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('tradespeople')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Tradesperson };
}

export async function setTradesPersonTier(id: string, tier: TradesPersonTier): Promise<Result<Tradesperson>> {
  const { data, error } = await supabase
    .from('tradespeople')
    .update({ tier })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Tradesperson };
}

// ── Users (admin) ──────────────────────────────────────────

export interface AdminUser extends Profile {
  suspended?: boolean;
  suspended_at?: string | null;
  suspension_reason?: string | null;
}

export async function getAllUsers(search?: string): Promise<AdminUser[]> {
  let q = supabase.from('profiles').select('*');
  if (search?.trim()) {
    const s = search.trim();
    q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%`);
  }
  q = q.order('created_at', { ascending: false });

  const r = await withTimeout(q, 10_000, 'all_users');
  if (!r.ok) return [];
  const { data, error } = r.value as { data: AdminUser[] | null; error: unknown };
  if (error || !data) return [];
  return data;
}

export async function setUserRole(id: string, role: UserRole): Promise<Result<AdminUser>> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as AdminUser };
}

export async function setUserSuspension(
  id: string,
  suspended: boolean,
  reason?: string
): Promise<Result<AdminUser>> {
  const payload: Record<string, unknown> = { suspended };
  if (suspended) {
    payload.suspended_at = new Date().toISOString();
    payload.suspension_reason = reason ?? null;
  } else {
    payload.suspended_at = null;
    payload.suspension_reason = null;
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as AdminUser };
}

// ── Categories (admin) — both marketplace + trade ─────────

export interface MarketplaceCategory extends Category {
  active: boolean;
}

export interface TradeCategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export async function getAllMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []) as MarketplaceCategory[];
}

export async function getAllTradeCategories(): Promise<TradeCategoryRow[]> {
  const { data, error } = await supabase
    .from('trade_categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return [];
  return (data ?? []) as TradeCategoryRow[];
}

export async function upsertMarketplaceCategory(
  patch: Partial<MarketplaceCategory> & { slug: string; name: string }
): Promise<Result<MarketplaceCategory>> {
  const { data, error } = await supabase
    .from('categories')
    .upsert(patch, { onConflict: 'slug' })
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as MarketplaceCategory };
}

export async function upsertTradeCategory(
  patch: Partial<TradeCategoryRow> & { slug: string; name: string }
): Promise<Result<TradeCategoryRow>> {
  const { data, error } = await supabase
    .from('trade_categories')
    .upsert(patch, { onConflict: 'slug' })
    .select('*')
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as TradeCategoryRow };
}

export async function deleteMarketplaceCategory(id: string): Promise<Result<null>> {
  const { count } = await supabase
    .from('listings')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Cannot delete — ${count} listings still use this category.` };
  }
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

export async function deleteTradeCategory(id: string, slug: string): Promise<Result<null>> {
  const { count } = await supabase
    .from('tradespeople')
    .select('*', { count: 'exact', head: true })
    .eq('trade', slug);
  if ((count ?? 0) > 0) {
    return { ok: false, error: `Cannot delete — ${count} tradespeople still in this category.` };
  }
  const { error } = await supabase.from('trade_categories').delete().eq('id', id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

export async function reorderCategories(
  table: 'categories' | 'trade_categories',
  orderedIds: string[]
): Promise<Result<null>> {
  const ops = orderedIds.map((id, idx) =>
    supabase.from(table).update({ sort_order: idx + 1 }).eq('id', id)
  );
  const results = await Promise.all(ops);
  const failed = results.find(r => r.error);
  if (failed?.error) return { ok: false, error: friendlyError(failed.error.message) };
  return { ok: true, data: null };
}

// ── Site settings ──────────────────────────────────────────

export interface CohortSettings {
  number: number;
  status: 'open' | 'closed';
  closes_at: string;
  tagline: string;
}

export interface DriveSettings {
  issue_number: number;
  issue_title: string;
  total_allocation: number;
  remaining: number;
  price_eur: number;
}

export interface FeesSettings {
  verified_commission_pct: number;
  atelier_commission_pct: number;
  house_commission_pct: number;
  trade_listed_monthly_eur: number;
  trade_pro_monthly_eur: number;
}

export interface DepositSettings {
  amount_eur: number;
  refundable: boolean;
}

export interface SiteSettingsBundle {
  cohort: CohortSettings;
  drive: DriveSettings;
  fees: FeesSettings;
  deposit: DepositSettings;
}

const DEFAULT_SETTINGS: SiteSettingsBundle = {
  cohort:  { number: 3, status: 'open', closes_at: '2026-06-14', tagline: 'COHORT 03 · CLOSES 14 JUN' },
  drive:   { issue_number: 12, issue_title: 'PORSCHE 911 992 GT3', total_allocation: 200, remaining: 47, price_eur: 149 },
  fees:    { verified_commission_pct: 12, atelier_commission_pct: 10, house_commission_pct: 8, trade_listed_monthly_eur: 0, trade_pro_monthly_eur: 49 },
  deposit: { amount_eur: 49, refundable: true },
};

export async function getSiteSettings(): Promise<SiteSettingsBundle> {
  const r = await withTimeout(
    supabase.from('site_settings').select('key, value'),
    10_000,
    'site_settings'
  );
  if (!r.ok) return DEFAULT_SETTINGS;
  const { data, error } = r.value as { data: { key: string; value: any }[] | null; error: unknown };
  if (error || !data) return DEFAULT_SETTINGS;

  const map: Record<string, any> = {};
  for (const row of data) map[row.key] = row.value;

  return {
    cohort:  { ...DEFAULT_SETTINGS.cohort,  ...(map.cohort  ?? {}) },
    drive:   { ...DEFAULT_SETTINGS.drive,   ...(map.drive   ?? {}) },
    fees:    { ...DEFAULT_SETTINGS.fees,    ...(map.fees    ?? {}) },
    deposit: { ...DEFAULT_SETTINGS.deposit, ...(map.deposit ?? {}) },
  };
}

export async function updateSiteSetting<K extends keyof SiteSettingsBundle>(
  key: K,
  value: SiteSettingsBundle[K]
): Promise<Result<null>> {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

// ── Labels (for UI) ────────────────────────────────────────

export const listingStatusBadge: Record<ListingStatus, { label: string; tone: 'neutral' | 'amber' | 'green' | 'red' | 'grey' }> = {
  draft:          { label: 'Draft',          tone: 'grey' },
  pending_review: { label: 'Pending review', tone: 'amber' },
  active:         { label: 'Active',         tone: 'green' },
  reserved:       { label: 'Reserved',       tone: 'amber' },
  sold:           { label: 'Sold',           tone: 'neutral' },
  removed:        { label: 'Removed',        tone: 'red' },
};

export const sellerStatusBadge: Record<SellerStatus, { label: string; tone: 'neutral' | 'amber' | 'green' | 'red' | 'grey' }> = {
  pending:   { label: 'Pending',   tone: 'amber' },
  approved:  { label: 'Approved',  tone: 'green' },
  rejected:  { label: 'Rejected',  tone: 'red' },
  suspended: { label: 'Suspended', tone: 'red' },
};

export const tradeStatusBadge = sellerStatusBadge as Record<TradesPersonStatus, { label: string; tone: 'neutral' | 'amber' | 'green' | 'red' | 'grey' }>;

export const reservationStatusBadge: Record<ReservationStatus, { label: string; tone: 'neutral' | 'amber' | 'green' | 'red' | 'grey' }> = {
  pending_deposit: { label: 'Awaiting deposit', tone: 'amber' },
  reserved:        { label: 'Reserved',         tone: 'amber' },
  confirmed:       { label: 'Confirmed',        tone: 'green' },
  shipped:         { label: 'Shipped',          tone: 'green' },
  completed:       { label: 'Completed',        tone: 'neutral' },
  cancelled:       { label: 'Cancelled',        tone: 'red' },
};

// ── Error mapping ──────────────────────────────────────────

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('infinite recursion')) {
    return 'Database policy is misconfigured. Run supabase/v04-rls-reset.sql to fix it.';
  }
  if (m.includes('does not exist') || m.includes('schema cache')) {
    return 'Admin tables missing. Run supabase/v04-admin-schema.sql in Supabase.';
  }
  if (m.includes('row-level security')) {
    return 'Permission denied — your profile.role must be admin.';
  }
  return msg;
}
