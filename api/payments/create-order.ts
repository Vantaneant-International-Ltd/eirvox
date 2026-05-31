// ============================================================
// POST /api/payments/create-order
//
// Two modes. The body carries one of:
//
//   LISTING MODE  (public, locked-down)
//     { listing_id: string, redirect_path?: string }
//
//     Server looks up the listing + seller, verifies the seller has
//     is_house = true (the merchant-of-record gate), and resolves the
//     charge amount from listing.payment_mode:
//       full                -> price
//       full_plus_shipping  -> price + shipping_cost
//       deposit             -> deposit_amount
//     The client cannot influence the amount. Anything supplied as
//     amount_eur is ignored in this mode. Description is built from
//     the listing title server-side.
//
//   ADMIN MODE   (existing €1 self-test on /admin/settings)
//     { amount_eur: number, description?: string, metadata?: Record<string,string>, redirect_path?: string }
//
//     Uses the client-supplied amount as-is. Kept for backwards
//     compatibility with the admin test page. Has no listing context
//     and never charges against a real listing.
//
// XOR: if both listing_id and amount_eur are supplied, listing_id wins.
// If neither, defaults to ADMIN MODE with €1.
//
// Returns both the hosted checkout_url (full-redirect flow) and the
// public token (embedded Checkout JS popup flow). Caller picks which.
//
// Rate-limited via the existing Upstash 'waitlist' bucket.
//
// SECURITY BOUNDARY: this endpoint is the real gate that decides
// whether a Revolut order can be created against an ÉIRVOX-owned
// listing. The client-side PayButton render-gate (commit 6) is
// cosmetic only. A tampered client passing a non-house listing_id
// or a manipulated amount is rejected here.
// ============================================================

import { createOrder, eurosToMinor } from '../_lib/revolut';
import { supabaseAdmin, ok, bad, oops, readJson } from '../_lib/supabase-admin';
import { rateLimit, rateLimitResponse } from '../_lib/ratelimit';

export const config = { runtime: 'edge' };

type PaymentMode = 'full' | 'full_plus_shipping' | 'deposit';

interface Body {
  listing_id?: string;
  amount_eur?: number;
  description?: string;
  metadata?: Record<string, string>;
  redirect_path?: string;
}

interface ResolvedCharge {
  amountEur: number;
  description: string;
  metadata: Record<string, string>;
  externalRef: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: { allow: 'POST' } });
  }

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(rl);

  const body = (await readJson<Body>(req)) ?? {};

  // Resolve charge — listing mode wins if both shapes are present.
  let resolved: ResolvedCharge | Response;
  if (typeof body.listing_id === 'string' && body.listing_id.trim()) {
    resolved = await resolveListingCharge(body.listing_id.trim(), body.metadata);
  } else {
    resolved = resolveAdminCharge(body);
  }
  if (resolved instanceof Response) return resolved;

  const redirectPath = (typeof body.redirect_path === 'string' && body.redirect_path.startsWith('/'))
    ? body.redirect_path
    : '/#/payment/return';

  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  let cleanOrigin = '';
  try {
    cleanOrigin = origin ? new URL(origin).origin : '';
  } catch {
    cleanOrigin = '';
  }
  const redirectUrl = cleanOrigin ? `${cleanOrigin}${redirectPath}` : undefined;

  try {
    const order = await createOrder({
      amount: eurosToMinor(resolved.amountEur),
      currency: 'EUR',
      description: resolved.description,
      merchant_order_ext_ref: resolved.externalRef,
      redirect_url: redirectUrl,
      metadata: resolved.metadata,
    });

    const token = order.token ?? (order as unknown as { public_id?: string }).public_id ?? null;

    if (!order.checkout_url && !token) {
      console.error('[create-order] Revolut returned no checkout_url or token', order);
      return oops('Revolut returned no checkout URL or token.');
    }

    return ok({
      ok: true,
      order_id: order.id,
      token,
      checkout_url: order.checkout_url,
    });
  } catch (err) {
    console.error('[create-order] failed:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return bad(msg.slice(0, 280));
  }
}

// ─────────────────────────────────────────────────────────────
// LISTING MODE — the security-critical path.
//
// Returns either a ResolvedCharge ready to send to Revolut, or a
// Response that should be returned to the caller verbatim (rejection).
// The body must NOT influence the charge amount in this mode.
// ─────────────────────────────────────────────────────────────
async function resolveListingCharge(
  listingId: string,
  clientMetadata: Record<string, string> | undefined,
): Promise<ResolvedCharge | Response> {
  if (!UUID_RE.test(listingId)) {
    return bad('Invalid listing_id.');
  }

  // Service-role read; RLS is bypassed deliberately because we are the
  // server resolving payment rules, not acting as the buyer.
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select(`
      id, slug, title, status, price, shipping_cost, payment_mode, deposit_amount, seller_id,
      seller:sellers ( id, is_house )
    `)
    .eq('id', listingId)
    .maybeSingle();

  if (error) {
    console.error('[create-order] listing lookup failed:', error.message);
    return oops('Could not load the listing.');
  }
  if (!data) {
    return bad('Listing not found.');
  }

  // PostgREST may surface a single-row inner join as an object or as a
  // one-element array depending on the relation cardinality. Normalise.
  const sellerRaw = (data as { seller: unknown }).seller;
  const seller = Array.isArray(sellerRaw) ? sellerRaw[0] : sellerRaw;
  const isHouse = !!(seller && typeof seller === 'object' && (seller as { is_house?: boolean }).is_house === true);

  if (!isHouse) {
    // Treat as "no PayButton path" rather than leaking the real reason
    // to a tampered client. Server log carries the detail.
    console.warn('[create-order] rejected non-house listing:', listingId);
    return bad('This listing is not payable through ÉIRVOX checkout.');
  }

  if (data.status !== 'active') {
    return bad(`Listing is ${data.status}, not available for payment.`);
  }

  const price = Number(data.price);
  if (!Number.isFinite(price) || price <= 0) {
    return bad('Listing price is not set.');
  }

  const mode = data.payment_mode as PaymentMode | null;
  if (mode !== 'full' && mode !== 'full_plus_shipping' && mode !== 'deposit') {
    return bad('Listing payment configuration is invalid.');
  }

  let amountEur: number;
  if (mode === 'full') {
    amountEur = price;
  } else if (mode === 'full_plus_shipping') {
    const shipping = Number(data.shipping_cost);
    if (!Number.isFinite(shipping) || shipping <= 0) {
      return bad('Listing is configured for full + shipping but shipping_cost is not set.');
    }
    amountEur = price + shipping;
  } else {
    const deposit = Number(data.deposit_amount);
    if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= price) {
      return bad('Listing is configured for deposit but deposit_amount is invalid.');
    }
    amountEur = deposit;
  }

  // Server-built description; we don't trust any client-supplied value
  // in listing mode (it could leak misleading copy into the Revolut
  // checkout sheet).
  const titleSlice = typeof data.title === 'string' ? data.title.slice(0, 160) : 'ÉIRVOX';
  const description = mode === 'deposit'
    ? `ÉIRVOX — ${titleSlice} (deposit)`
    : `ÉIRVOX — ${titleSlice}`;

  // Metadata: server-derived first, then optional non-conflicting
  // client fields appended (capped, string-only). The server fields
  // always win on key collision.
  const sellerId = typeof seller === 'object' && seller && 'id' in seller
    ? String((seller as { id: unknown }).id)
    : (data.seller_id ?? '');
  const metadata: Record<string, string> = {
    listing_id: String(data.id),
    listing_slug: typeof data.slug === 'string' ? data.slug.slice(0, 120) : '',
    seller_id: String(sellerId),
    payment_mode: mode,
    resolved_amount_eur: String(amountEur),
  };
  if (clientMetadata && typeof clientMetadata === 'object') {
    let count = 0;
    for (const [k, v] of Object.entries(clientMetadata)) {
      if (count >= 4) break;
      if (typeof v !== 'string') continue;
      const key = k.slice(0, 40);
      if (key in metadata) continue;
      metadata[key] = v.slice(0, 200);
      count++;
    }
  }

  return {
    amountEur,
    description,
    metadata,
    externalRef: `evx-listing-${String(data.id).slice(0, 8)}-${Date.now()}`,
  };
}

// ─────────────────────────────────────────────────────────────
// ADMIN MODE — backwards-compatible €1 self-test path.
// Honours the original Body shape used by /admin/settings.
// ─────────────────────────────────────────────────────────────
function resolveAdminCharge(body: Body): ResolvedCharge {
  const amountEur = typeof body.amount_eur === 'number' && body.amount_eur > 0 ? body.amount_eur : 1;
  const description = (typeof body.description === 'string' && body.description.trim())
    ? body.description.trim().slice(0, 200)
    : 'ÉIRVOX';

  const metadata: Record<string, string> = { amount_eur: String(amountEur), mode: 'admin_test' };
  if (body.metadata && typeof body.metadata === 'object') {
    let count = 0;
    for (const [k, v] of Object.entries(body.metadata)) {
      if (count >= 8) break;
      if (typeof v !== 'string') continue;
      metadata[k.slice(0, 40)] = v.slice(0, 200);
      count++;
    }
  }

  return {
    amountEur,
    description,
    metadata,
    externalRef: `evx-${Date.now()}`,
  };
}
