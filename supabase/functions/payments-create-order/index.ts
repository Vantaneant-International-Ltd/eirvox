// ============================================================
// POST /functions/v1/payments-create-order
// SECURITY BOUNDARY: server resolves the charge amount from the
// v06 matrix; client-supplied amount is ignored in LISTING mode.
// Two modes:
//   LISTING { listing_id, fulfilment, is_deposit?, redirect_path?, metadata? }
//   ADMIN   { amount_eur, description?, metadata?, redirect_path? }
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { createOrder, eurosToMinor } from '../_shared/revolut.ts';
import { supabaseAdmin, ok, bad, oops, readJson } from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';

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

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = (await readJson<Body>(req)) ?? {};

  let resolved: ResolvedCharge | Response;
  if (typeof body.listing_id === 'string' && body.listing_id.trim()) {
    resolved = await resolveListingCharge(req, body);
  } else {
    resolved = resolveAdminCharge(body);
  }
  if (resolved instanceof Response) return resolved;

  const redirectPath = (typeof body.redirect_path === 'string' && body.redirect_path.startsWith('/'))
    ? body.redirect_path
    : '/#/payment/return';

  const origin = req.headers.get('origin') || req.headers.get('referer') || '';
  let cleanOrigin = '';
  try { cleanOrigin = origin ? new URL(origin).origin : ''; } catch { cleanOrigin = ''; }
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
      return oops(req, 'Revolut returned no checkout URL or token.');
    }

    return ok(req, {
      ok: true,
      order_id: order.id,
      token,
      checkout_url: order.checkout_url,
    });
  } catch (err) {
    console.error('[create-order] failed:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return bad(req, msg.slice(0, 280));
  }
});

async function resolveListingCharge(req: Request, body: Body): Promise<ResolvedCharge | Response> {
  const listingId = (body.listing_id ?? '').trim();
  if (!UUID_RE.test(listingId)) return bad(req, 'Invalid listing_id.');

  const fulfilment = body.fulfilment;
  if (fulfilment !== 'collection' && fulfilment !== 'delivery') {
    return bad(req, "fulfilment must be 'collection' or 'delivery'.");
  }

  const isDeposit = body.is_deposit === true;

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
    return oops(req, 'Could not load the listing.');
  }
  if (!data) return bad(req, 'Listing not found.');

  const row = data as Record<string, unknown>;
  const sellerRaw = row.seller;
  const seller = Array.isArray(sellerRaw) ? sellerRaw[0] : sellerRaw;
  const isHouse = !!(seller && typeof seller === 'object' && (seller as { is_house?: boolean }).is_house === true);
  if (!isHouse) {
    console.warn('[create-order] rejected non-house listing:', listingId);
    return bad(req, 'This listing is not payable through ÉIRVOX checkout.');
  }

  if (row.status !== 'active') {
    return bad(req, `Listing is ${String(row.status)}, not available for payment.`);
  }

  const price = Number(row.price);
  if (!Number.isFinite(price) || price <= 0) return bad(req, 'Listing price is not set.');

  const rawStock = row.stock_state;
  const stockState: StockState = rawStock === 'incoming' ? 'incoming' : 'in_stock';

  if (fulfilment === 'collection' && row.collection_available !== true) {
    return bad(req, 'Collection is not available for this listing.');
  }
  if (fulfilment === 'delivery' && row.shipping_available !== true) {
    return bad(req, 'Delivery is not available for this listing.');
  }

  if (isDeposit && fulfilment === 'delivery') {
    return bad(req, 'Deposit is not available with delivery on this listing.');
  }
  if (!isDeposit && stockState === 'incoming' && fulfilment === 'collection') {
    return bad(req, 'This listing is incoming stock; collection requires a deposit.');
  }

  let amountEur: number;
  if (isDeposit) {
    const deposit = Number(row.deposit_amount);
    if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= price) {
      return bad(req, 'Deposit is not configured for this listing.');
    }
    amountEur = deposit;
  } else if (fulfilment === 'collection') {
    amountEur = price;
  } else {
    const shipping = Number(row.shipping_cost);
    if (!Number.isFinite(shipping) || shipping <= 0) {
      return bad(req, 'Shipping cost is not configured for this listing.');
    }
    amountEur = price + shipping;
  }

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

  return { amountEur, description, metadata, externalRef: `evx-${Date.now()}` };
}
