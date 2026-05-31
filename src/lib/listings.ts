// ============================================================
// ÉIRVOX — Listing helpers (Supabase-backed)
// CRUD + storage upload + reservations
// ============================================================

import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// ── Types ───────────────────────────────────────────────────

export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'reserved'
  | 'sold'
  | 'removed';

/**
 * @deprecated v06 drops the listings.payment_mode column. Use
 * StockState + buyer-chosen fulfilment + deposit_amount presence
 * instead. Kept exported during the defensive transition window so
 * existing call sites (admin form, ListingDetail, create-order) keep
 * compiling until their commits replace them.
 */
export type PaymentMode = 'full' | 'full_plus_shipping' | 'deposit';

/** v06. Listing stock state. Drives the buyer payment-options matrix.
 *  DB column listings.stock_state, default 'in_stock' NOT NULL. */
export type StockState = 'in_stock' | 'incoming';

/** v06. DRIVE editorial issue state. Only meaningful when is_drive=true. */
export type DriveIssueState = 'open' | 'upcoming' | 'archived';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  storage_path: string;
  public_url: string | null;
  sort_order: number;
  created_at: string;
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
  seller_id: string;
  category_id: string | null;
  category_slug: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  condition: string | null;
  price: number;
  original_price: number | null;
  currency: string;
  accepts_offers: boolean;
  shipping_available: boolean;
  collection_available: boolean;
  shipping_cost: number | null;
  city: string | null;
  status: ListingStatus;
  views_count: number;
  /** @deprecated v06 drops this column. Optional so reads pre- and
   *  post-migration both compile. New code must not branch on it. */
  payment_mode?: PaymentMode;
  deposit_amount: number | null;
  /** v06. Optional during transition: undefined pre-migration; reads
   *  must fall back to 'in_stock'. */
  stock_state?: StockState;
  /** v06. NULL for non-DRIVE listings. */
  drive_issue_state?: DriveIssueState | null;
  drive_made_count?: number | null;
  drive_remaining_count?: number | null;
  drive_issue_date?: string | null;
  /** Already in DB; surface on the type. */
  is_drive?: boolean | null;
  drive_issue?: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface ListingWithExtras extends Listing {
  images: ListingImage[];
  specs: ListingSpec[];
}

export interface CreateListingInput {
  seller_id: string;
  category_id?: string | null;
  category_slug?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  condition?: string | null;
  price: number;
  original_price?: number | null;
  accepts_offers?: boolean;
  shipping_available?: boolean;
  collection_available?: boolean;
  shipping_cost?: number | null;
  city?: string | null;
  status?: ListingStatus;
}

export interface UpdateListingInput extends Partial<CreateListingInput> {}

export interface SpecInput {
  label: string;
  value: string;
}

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Categories ──────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.warn('[listings] getCategories error:', error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

// ── Listing CRUD ────────────────────────────────────────────

export async function createListing(input: CreateListingInput): Promise<Result<Listing>> {
  const payload = {
    status: 'draft' as ListingStatus,
    currency: 'EUR',
    accepts_offers: true,
    shipping_available: true,
    collection_available: true,
    ...input,
  };

  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select('*')
    .single();

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Listing };
}

export async function updateListing(
  id: string,
  patch: UpdateListingInput
): Promise<Result<Listing>> {
  // If marking active/pending, set published_at
  const payload: Record<string, unknown> = { ...patch };
  if (patch.status === 'active' || patch.status === 'pending_review') {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Listing };
}

/** Remove a listing: soft-delete the listing row (status='removed'
 *  so reservations / orders / enquiries that FK to it stay valid) and
 *  hard-delete its images everywhere they live -- storage bucket
 *  objects AND listing_images rows. Without this, every removed
 *  listing leaves orphans in the listing-images bucket forever, since
 *  storage has no cascade from postgres FKs.
 *
 *  Order: read paths first, then storage.remove, then DB row delete,
 *  finally the listing soft-delete. Storage failures are logged but
 *  do not block the DB cleanup (a stale storage object is recoverable;
 *  a listing stuck in a half-removed state is not).
 */
export async function deleteListing(id: string): Promise<Result<null>> {
  // 1. Read every image's storage path BEFORE we delete the rows.
  const { data: imgs, error: imgsErr } = await supabase
    .from('listing_images')
    .select('storage_path')
    .eq('listing_id', id);

  if (imgsErr) {
    console.warn('[deleteListing] could not read listing_images:', imgsErr.message);
  }

  const paths = (imgs ?? [])
    .map(r => (r as { storage_path: string | null }).storage_path)
    .filter((p): p is string => typeof p === 'string' && p.length > 0);

  // 2. Best-effort storage cleanup. supabase-js .remove([]) returns
  //    {data, error}; we log and continue on either failure.
  if (paths.length > 0) {
    const { error: storageErr } = await supabase
      .storage
      .from(LISTING_IMAGES_BUCKET)
      .remove(paths);

    if (storageErr) {
      console.warn('[deleteListing] storage cleanup partial/failed:', {
        listingId: id,
        paths,
        error: storageErr,
      });
    }
  }

  // 3. Drop the listing_images rows. Keeping them after deletion
  //    means the admin UI shows broken thumbnails for the removed
  //    listing. The listings FK CASCADE would handle this on a hard
  //    delete; we do it explicitly because we only soft-delete.
  if (paths.length > 0) {
    const { error: rowsErr } = await supabase
      .from('listing_images')
      .delete()
      .eq('listing_id', id);

    if (rowsErr) {
      console.error('[deleteListing] listing_images delete failed:', rowsErr);
      return { ok: false, error: friendlyError(rowsErr.message) };
    }
  }

  // 4. Soft-delete the listing itself.
  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' as ListingStatus })
    .eq('id', id);

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

/** Set the listing status — used by Mark as Sold / Reserved / etc. */
export async function setListingStatus(
  id: string,
  status: ListingStatus
): Promise<Result<Listing>> {
  return updateListing(id, { status });
}

/** Get all of a seller's listings (any status) with their cover image. */
export async function getSellerListings(sellerId: string): Promise<ListingWithExtras[]> {
  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', sellerId)
    .neq('status', 'removed')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[listings] getSellerListings error:', error.message);
    return [];
  }

  // Fetch images for these listings
  const ids = (listings ?? []).map(l => l.id);
  let images: ListingImage[] = [];
  if (ids.length > 0) {
    const { data: imgs } = await supabase
      .from('listing_images')
      .select('*')
      .in('listing_id', ids)
      .order('sort_order', { ascending: true });
    images = (imgs ?? []) as ListingImage[];
  }

  return (listings ?? []).map(l => ({
    ...(l as Listing),
    images: images.filter(i => i.listing_id === l.id),
    specs: [],
  }));
}

/** Get a single listing with images + specs (for /sell/edit). */
export async function getListingFull(id: string): Promise<ListingWithExtras | null> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !listing) return null;

  const [imgsRes, specsRes] = await Promise.all([
    supabase.from('listing_images').select('*').eq('listing_id', id).order('sort_order', { ascending: true }),
    supabase.from('listing_specs').select('*').eq('listing_id', id).order('sort_order', { ascending: true }),
  ]);

  return {
    ...(listing as Listing),
    images: (imgsRes.data ?? []) as ListingImage[],
    specs: (specsRes.data ?? []) as ListingSpec[],
  };
}

// ── Image upload ────────────────────────────────────────────

const LISTING_IMAGES_BUCKET = 'listing-images';

export interface UploadProgress {
  uploaded: number;
  total: number;
  filename: string;
}

/** Upload one image. Stored at <seller_id>/<listing_id>/<random>.<ext>. */
export async function uploadListingImage(
  sellerId: string,
  listingId: string,
  file: File,
  sortOrder: number
): Promise<Result<ListingImage>> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const rand = crypto.randomUUID().slice(0, 8);
  const path = `${sellerId}/${listingId}/${rand}.${ext}`;

  const { error: upErr } = await supabase
    .storage
    .from(LISTING_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (upErr) return { ok: false, error: friendlyError(upErr.message) };

  const { data: urlData } = supabase
    .storage
    .from(LISTING_IMAGES_BUCKET)
    .getPublicUrl(path);

  // Defensive: the table currently has a legacy `url` column that is
  // NOT NULL with no default, alongside the newer `storage_path` /
  // `public_url` pair the rest of the app reads from. Writing only
  // public_url fails every insert with "null value in column url
  // violates not-null constraint", which is what was breaking image
  // uploads. We write the same value to both so the insert succeeds
  // pre-migration. supabase/v09-listing-images-drop-legacy-url.sql
  // removes the legacy column; after that's applied, drop `url:` from
  // this insert in a follow-up commit.
  const { data, error: dbErr } = await supabase
    .from('listing_images')
    .insert({
      listing_id: listingId,
      url: urlData.publicUrl,
      storage_path: path,
      public_url: urlData.publicUrl,
      sort_order: sortOrder,
    })
    .select('*')
    .single();

  if (dbErr) {
    console.error('[uploadListingImage] DB insert failed:', {
      listingId,
      storagePath: path,
      pgError: dbErr,
    });
    return { ok: false, error: friendlyError(dbErr.message) };
  }
  return { ok: true, data: data as ListingImage };
}

export async function deleteListingImage(image: ListingImage): Promise<Result<null>> {
  // Best-effort: remove the storage object too
  await supabase.storage.from(LISTING_IMAGES_BUCKET).remove([image.storage_path]);

  const { error } = await supabase
    .from('listing_images')
    .delete()
    .eq('id', image.id);

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: null };
}

/** Update sort_order for a list of images in the given order. */
export async function reorderImages(orderedIds: string[]): Promise<Result<null>> {
  // Batch into updates — Supabase has no array UPDATE in PostgREST.
  const ops = orderedIds.map((id, idx) =>
    supabase.from('listing_images').update({ sort_order: idx }).eq('id', id)
  );
  const results = await Promise.all(ops);
  const failed = results.find(r => r.error);
  if (failed?.error) return { ok: false, error: friendlyError(failed.error.message) };
  return { ok: true, data: null };
}

// ── Specs (replace-on-save model) ───────────────────────────

/** Replace all specs for a listing with the given list (in order). */
export async function setListingSpecs(
  listingId: string,
  specs: SpecInput[]
): Promise<Result<null>> {
  // Delete existing
  const { error: delErr } = await supabase
    .from('listing_specs')
    .delete()
    .eq('listing_id', listingId);
  if (delErr) return { ok: false, error: friendlyError(delErr.message) };

  if (specs.length === 0) return { ok: true, data: null };

  const rows = specs
    .filter(s => s.label.trim() && s.value.trim())
    .map((s, idx) => ({
      listing_id: listingId,
      label: s.label.trim(),
      value: s.value.trim(),
      sort_order: idx,
    }));

  if (rows.length === 0) return { ok: true, data: null };

  const { error: insErr } = await supabase
    .from('listing_specs')
    .insert(rows);

  if (insErr) return { ok: false, error: friendlyError(insErr.message) };
  return { ok: true, data: null };
}

// ── Spec templates (client-side) ────────────────────────────

export const specTemplates: Record<string, string[]> = {
  cars:         ['Year', 'Make', 'Model', 'Variant / Trim', 'Mileage (km)', 'Body', 'Transmission', 'Fuel', 'NCT Valid Until', 'Service History', 'Registration'],
  automotive:   ['Make', 'Model', 'Year', 'Part Type', 'OEM / Aftermarket', 'Compatibility'],
  watches:      ['Brand', 'Reference', 'Movement', 'Case Size', 'Dial', 'Year'],
  fashion:      ['Brand', 'Size', 'Material', 'Colour', 'Season'],
  tech:         ['Brand', 'Model', 'Storage', 'Condition Notes'],
  'home-design':['Designer / Brand', 'Material', 'Dimensions', 'Period'],
  'audio-vinyl':['Brand', 'Model', 'Format', 'Year', 'Condition'],
  art:          ['Artist', 'Medium', 'Dimensions', 'Year', 'Edition'],
};

// ── Labels ──────────────────────────────────────────────────

export const listingStatusLabel: Record<ListingStatus, string> = {
  draft:          'Draft',
  pending_review: 'Pending review',
  active:         'Active',
  reserved:       'Reserved',
  sold:           'Sold',
  removed:        'Removed',
};

// ── Stats for the seller dashboard ──────────────────────────

export interface SellerStats {
  activeListings: number;
  totalListings: number;
  totalViews: number;
}

export async function getSellerStats(sellerId: string): Promise<SellerStats> {
  const { data: listings, error: lErr } = await supabase
    .from('listings')
    .select('status, views_count')
    .eq('seller_id', sellerId);

  if (lErr) console.warn('[listings] stats listings error:', lErr.message);

  const list = listings ?? [];
  return {
    activeListings: list.filter(l => l.status === 'active').length,
    totalListings:  list.filter(l => l.status !== 'removed').length,
    totalViews:     list.reduce((sum, l) => sum + (l.views_count ?? 0), 0),
  };
}

// ── Error mapping ──────────────────────────────────────────

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('infinite recursion')) {
    return 'Database policy is misconfigured. Run supabase/v04-marketplace-schema.sql to fix it.';
  }
  if (m.includes('does not exist') || m.includes('schema cache')) {
    return 'A required table is missing. Run supabase/v04-marketplace-schema.sql in Supabase.';
  }
  if (m.includes('row-level security')) {
    return 'Permission denied — make sure your seller account is approved.';
  }
  if (m.includes('bucket not found')) {
    return 'Storage buckets missing. Run supabase/v04-marketplace-schema.sql in Supabase.';
  }
  if (m.includes('exceeded the maximum')) {
    return 'That file is too large — keep image uploads under 6 MB.';
  }
  return msg;
}
