// ============================================================
// POST /api/payments/create-order
//
// Two modes. The body carries one of:
//
//   LISTING MODE  (public, locked-down)
//     { listing_id: string,
//       fulfilment: 'collection' | 'delivery',
//       is_deposit?: boolean,
//       redirect_path?: string,
//       metadata?: Record<string,string> }
//
//     Server looks up the listing + seller, verifies the seller has
//     is_house = true (the merchant-of-record gate), and resolves the
//     charge amount from the v06 matrix:
//
//       stock_state  fulfilment   is_deposit | result
//       ─────────────────────────────────────────────────────────────
//       in_stock     collection   true       | deposit_amount
//       in_stock     collection   false      | price
//       in_stock     delivery     true       | REJECT (delivery is full only)
//       in_stock     delivery     false      | price + shipping_cost
//       incoming     collection   true       | deposit_amount
//       incoming     collection   false      | REJECT (incoming + collection is deposit only)
//       incoming     delivery     true       | REJECT (delivery is full only)
//       incoming     delivery     false      | price + shipping_cost
//
//     The client cannot influence the amount. Anything supplied as
//     amount_eur is ignored. Description is built server-side from
//     the listing title.
//
//     Defensive: stock_state column may be absent pre-v06-migration;
//     reads fall back to 'in_stock'. payment_mode is intentionally
//     not read in this mode anymore (column may also be absent
//     post-migration); the matrix above is the only source of truth.
//
//   ADMIN MODE   (existing €1 self-test on /admin/settings)
//     { amount_eur: number, description?: string, metadata?: ..., redirect_path?: string }
//
//     Uses the client-supplied amount as-is. Kept for backwards
//     compatibility with the admin test page. Has no listing context.
//
// XOR: if both listing_id and amount_eur are supplied, listing_id wins.
// If neither, defaults to ADMIN MODE with €1.
//
// Rate-limited via the existing Upstash 'waitlist' bucket.
//
// SECURITY BOUNDARY: this endpoint is the real gate that decides
// whether a Revolut order can be created against an ÉIRVOX-owned
// listing. The client-side PayButton render-gate is cosmetic only.
// A tampered client passing a non-house listing_id, a manipulated
// amount, or an invalid stock/fulfilment combination is rejected here.
// ============================================================

import { createOrder, eurosToMinor } from '../_lib/revolut';
import { supabaseAdmin, ok, bad, oops, readJson } from '../_lib/supabase-admin';
import { rateLimit, rateLimitResponse } from '../_lib/ratelimit';

export const config = { runtime: 'edge' };

type Fulfilment = 'collection' | 'delivery';
type StockState = 'in_stock' | 'incoming';

interface Body {
  listing_id?: string;
  fulfilment?: Fulfilment;
  is_deposit?: boolean;
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

  let resolved: ResolvedCharge | Response;
  if (typeof body.listing_id === 'string' && body.listing_id.trim()) {
    resolved = await resolveListingCharge(body);
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
// LISTING MODE — the security-critical path. Applies the v06
// stock_state + fulfilment + is_deposit matrix server-side and
// rejects any invalid combination. Body fields are validated before
// any DB read; DB row is then loaded and re-validated against the
// matrix.
// ─────────────────────────────────────────────────────────────
async function resolveListingCharge(body: Body): Promise<ResolvedCharge | Response> {
  const listingId = (body.listing_id ?? '').trim();
  if (!UUID_RE.test(listingId)) {
    return bad('Invalid listing_id.');
  }

  const fulfilment = body.fulfilment;
  if (fulfilment !== 'collection' && fulfilment !== 'delivery') {
    return bad("fulfilment must be 'collection' or 'delivery'.");
  }

  const isDeposit = body.is_deposit === true;

  // Service-role read; RLS is bypassed deliberately because we are
  // the server resolving payment rules, not acting as the buyer.
  // SELECT '*' so the row carries new v06 columns when present and
  // simply lacks them pre-migration; readers below fall back safely.
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select(`
      *,
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

  const row = data as Record<string, unknown>;

  // Seller is_house gate.
  const sellerRaw = row.seller;
  const seller = Array.isArray(sellerRaw) ? sellerRaw[0] : sellerRaw;
  const isHouse = !!(seller && typeof seller === 'object' && (seller as { is_house?: boolean }).is_house === true);
  if (!isHouse) {
    console.warn('[create-order] rejected non-house listing:', listingId);
    return bad('This listing is not payable through ÉIRVOX checkout.');
  }

  if (row.status !== 'active') {
    return bad(`Listing is ${String(row.status)}, not available for payment.`);
  }

  const price = Number(row.price);
  if (!Number.isFinite(price) || price <= 0) {
    return bad('Listing price is not set.');
  }

  // Stock state: v06 column. Falls back to 'in_stock' if the column
  // is absent (pre-migration) or holds an unexpected value.
  const rawStock = row.stock_state;
  const stockState: StockState = rawStock === 'incoming' ? 'incoming' : 'in_stock';

  // Fulfilment must be enabled on the listing.
  if (fulfilment === 'collection' && row.collection_available !== true) {
    return bad('Collection is not available for this listing.');
  }
  if (fulfilment === 'delivery' && row.shipping_available !== true) {
    return bad('Delivery is not available for this listing.');
  }

  // Apply the matrix.
  // 1) Deposit is collection-only this phase. Reject deposit+delivery.
  if (isDeposit && fulfilment === 'delivery') {
    return bad('Deposit is not available with delivery on this listing.');
  }
  // 2) incoming + collection is deposit-only. Reject full+collection.
  if (!isDeposit && stockState === 'incoming' && fulfilment === 'collection') {
    return bad('This listing is incoming stock; collection requires a deposit.');
  }

  let amountEur: number;
  if (isDeposit) {
    const deposit = Number(row.deposit_amount);
    if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= price) {
      return bad('Deposit is not configured for this listing.');
    }
    amountEur = deposit;
  } else if (fulfilment === 'collection') {
    amountEur = price;
  } else {
    // delivery + full (in_stock or incoming): price + shipping_cost
    const shipping = Number(row.shipping_cost);
    if (!Number.isFinite(shipping) || shipping <= 0) {
      return bad('Shipping cost is not configured for this listing.');
    }
    amountEur = price + shipping;
  }

  // Server-built description; client copy is ignored to avoid
  // misleading text in the Revolut checkout sheet.
  const titleSlice = typeof row.title === 'string' ? row.title.slice(0, 160) : 'ÉIRVOX';
  const tag = isDeposit ? ' (deposit)' : '';
  const description = `ÉIRVOX — ${titleSlice}${tag}`;

  const sellerId = typeof seller === 'object' && seller && 'id' in seller
    ? String((seller as { id: unknown }).id)
    : String(row.seller_id ?? '');

  const metadata: Record<string, string> = {
    listing_id: String(row.id),
    listing_slug: typeof row.slug === 'string' ? row.slug.slice(0, 120) : '',
    seller_id: sellerId,
    stock_state: stockState,
    fulfilment,
    is_deposit: String(isDeposit),
    resolved_amount_eur: String(amountEur),
  };

  if (body.metadata && typeof body.metadata === 'object') {
    let count = 0;
    for (const [k, v] of Object.entries(body.metadata)) {
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
    externalRef: `evx-listing-${String(row.id).slice(0, 8)}-${Date.now()}`,
  };
}

// ─────────────────────────────────────────────────────────────
// ADMIN MODE — backwards-compatible €1 self-test path. Honours the
// original Body shape used by /admin/settings.
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
