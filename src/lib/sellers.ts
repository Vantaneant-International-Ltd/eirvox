// ============================================================
// ÉIRVOX — Seller helpers (Supabase-backed)
// ============================================================

import { supabase, callFunction } from './supabase';
import { getCurrentUser } from './auth';

export type SellerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type SellerTier   = 'verified' | 'atelier' | 'house';

export interface Seller {
  id: string;
  profile_id: string;
  trading_name: string;
  handle: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
  logo_url: string | null;
  primary_category: string | null;
  what_they_sell: string | null;
  inventory_count: string | null;
  price_low: number | null;
  price_high: number | null;
  sourcing_method: string | null;
  trading_since: string | null;
  tier: SellerTier;
  status: SellerStatus;
  applied_at: string;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  is_house?: boolean;
}

export interface SellerApplyInput {
  trading_name: string;
  handle?: string;
  email: string;
  phone: string;
  city: string;
  trading_since?: string;
  primary_category: string;
  what_they_sell: string;
  inventory_count: string;
  price_low?: number | null;
  price_high?: number | null;
  sourcing_method: string;
  tier: SellerTier;
}

export interface SellerProfilePatch {
  trading_name?: string;
  handle?: string | null;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  logo_url?: string | null;
}

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

// ── Fetch ────────────────────────────────────────────────────

/** Fetch the seller record for the currently signed-in user. */
export async function getMySeller(): Promise<Seller | null> {
  const user = getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[sellers] getMySeller error:', error.message);
    return null;
  }
  return (data as Seller | null) ?? null;
}

// ── Apply ────────────────────────────────────────────────────

export interface SellerApplicationStub {
  id: string;
}

/** Submit a seller application via the serverless route.
 *  Anonymous-friendly: works whether or not the visitor is signed in.
 *  Writes to seller_applications (not sellers — sellers only gets
 *  rows on admin approval via approve_seller_application()).
 *
 *  Local dev: `npm run dev:api` (vercel dev) to exercise the API.
 *  Plain `npm run dev` (vite only) will 404 the call. */
export async function applyAsSeller(input: SellerApplyInput): Promise<Result<SellerApplicationStub>> {
  // Attach profile_id when signed in so admins can link the application
  // back to a user account; anonymous applications send null.
  const user = getCurrentUser();

  let res: Response;
  try {
    res = await callFunction('seller-applications', {
      body: {
        profile_id: user?.id ?? null,
        trading_name: input.trading_name,
        handle: input.handle,
        email: input.email,
        phone: input.phone,
        city: input.city,
        trading_since: input.trading_since,
        primary_category: input.primary_category,
        what_they_sell: input.what_they_sell,
        inventory_count: input.inventory_count,
        price_low: input.price_low,
        price_high: input.price_high,
        sourcing_method: input.sourcing_method,
        tier: input.tier,
      },
    });
  } catch {
    return { ok: false, error: 'Could not reach the server. Try again in a moment.' };
  }

  const payload = await res.json().catch(() => null) as
    | { ok?: boolean; id?: string; error?: string }
    | null;

  if (res.ok && payload?.id) {
    return { ok: true, data: { id: payload.id } };
  }
  if (res.status === 409) {
    return { ok: false, error: payload?.error ?? 'You already have a pending application.' };
  }
  if (res.status === 400) {
    return { ok: false, error: payload?.error ?? 'Please check the form and try again.' };
  }
  if (res.status === 429) {
    return { ok: false, error: 'Too many submissions. Wait a moment and try again.' };
  }
  return { ok: false, error: payload?.error ?? 'Could not submit your application. Try again.' };
}

// ── Update profile ──────────────────────────────────────────

export async function updateSellerProfile(
  sellerId: string,
  patch: SellerProfilePatch
): Promise<Result<Seller>> {
  const { data, error } = await supabase
    .from('sellers')
    .update(patch)
    .eq('id', sellerId)
    .select('*')
    .single();

  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, data: data as Seller };
}

// ── Logo upload (Supabase Storage) ──────────────────────────

const SELLER_LOGOS_BUCKET = 'seller-logos';

export async function uploadSellerLogo(
  sellerId: string,
  file: File
): Promise<Result<string>> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${sellerId}.${ext}`;

  const { error: upErr } = await supabase
    .storage
    .from(SELLER_LOGOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (upErr) return { ok: false, error: friendlyError(upErr.message) };

  const { data: urlData } = supabase
    .storage
    .from(SELLER_LOGOS_BUCKET)
    .getPublicUrl(path);

  const publicUrl = urlData.publicUrl + `?v=${Date.now()}`; // cache-bust on overwrite

  const { error: dbErr } = await supabase
    .from('sellers')
    .update({ logo_url: publicUrl })
    .eq('id', sellerId);

  if (dbErr) return { ok: false, error: friendlyError(dbErr.message) };
  return { ok: true, data: publicUrl };
}

// ── Status labels ──────────────────────────────────────────

export const sellerStatusLabel: Record<SellerStatus, string> = {
  pending:   'Pending review',
  approved:  'Approved',
  rejected:  'Declined',
  suspended: 'Suspended',
};

// ── Error mapping ──────────────────────────────────────────

function friendlyError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('infinite recursion')) {
    return 'Database policy is misconfigured. Run supabase/v04-marketplace-schema.sql to fix it.';
  }
  if (m.includes('row-level security')) {
    return 'Permission denied — make sure you are signed in.';
  }
  if (m.includes('does not exist') || m.includes('schema cache')) {
    return 'The marketplace tables are missing. Run supabase/v04-marketplace-schema.sql in the Supabase SQL Editor.';
  }
  if (m.includes('duplicate key') && m.includes('profile_id')) {
    return 'You already have a seller application — view its status on the dashboard.';
  }
  if (m.includes('duplicate key') && m.includes('handle')) {
    return 'That handle is taken — try a different one.';
  }
  return msg;
}
