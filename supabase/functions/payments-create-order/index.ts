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
import { supabaseAdmin, ok, bad, oops, readJson, isValidEmail } from '../_shared/supabase-admin.ts';
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
  // Order persistence + guest checkout: buyer must supply email here
  // unless they're authenticated (in which case we use the JWT user's email).
  buyer_email?: string;
  buyer_profile_id?: string;  // forwarded from client when signed in
  // 2-axis variant selection (wheel-specialist consignment line).
  // When the listing carries a variant matrix, the buyer must pick
  // exactly one (style, family) cell. Server re-resolves price + stock.
  variant_style_key?: string;
  variant_family_key?: string;
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

    // Persist a reservation row tied to this Revolut order. The
    // webhook (revolut-webhook) will look it up by revolut_order_id
    // when payment completes and flip the listing.status. Only
    // applies to LISTING mode — admin test charges (no listing_id)
    // skip persistence.
    if (typeof body.listing_id === 'string' && body.listing_id.trim()) {
      const buyerEmail = (body.buyer_email ?? '').trim().toLowerCase();
      if (buyerEmail && isValidEmail(buyerEmail)) {
        const buyerProfileId = body.buyer_profile_id && /^[0-9a-f-]{36}$/i.test(body.buyer_profile_id)
          ? body.buyer_profile_id : null;
        const variantStyleKey  = resolved.metadata.variant_style_key  || null;
        const variantFamilyKey = resolved.metadata.variant_family_key || null;
        const { error: persistErr } = await supabaseAdmin.rpc('record_order_created', {
          p_revolut_order_id: order.id,
          p_listing_id: body.listing_id.trim(),
          p_buyer_email: buyerEmail,
          p_buyer_profile_id: buyerProfileId,
          p_amount_eur: Math.round(resolved.amountEur),
          p_is_deposit: !!body.is_deposit,
          p_fulfilment: body.fulfilment ?? 'collection',
          p_variant_style_key:  variantStyleKey,
          p_variant_family_key: variantFamilyKey,
        });
        if (persistErr) {
          // Don't fail the buyer's checkout if persistence fails —
          // they've already gotten the Revolut order. We log it loudly;
          // admin can reconcile from the Revolut dashboard.
          console.error('[create-order] record_order_created failed:', persistErr);
        }
      } else {
        console.warn('[create-order] buyer_email missing/invalid — order not persisted');
      }
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

  // ── Variant resolution (wheel consignment matrix) ──────────
  // If the listing has any variants, the buyer MUST select one.
  // Server re-resolves the variant from style_key + family_key,
  // re-checks stock_count > 0, and computes the price_delta. The
  // client-supplied price is never trusted.
  let variantStyleKey: string | null = null;
  let variantFamilyKey: string | null = null;
  let variantStyleLabel: string | null = null;
  let variantPriceDelta = 0;

  const { count: variantTotal, error: variantCountErr } = await supabaseAdmin
    .from('listing_variants')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  if (variantCountErr) {
    console.error('[create-order] variant count failed:', variantCountErr.message);
    return oops(req, 'Could not verify listing variants.');
  }

  if ((variantTotal ?? 0) > 0) {
    const styleKey = typeof body.variant_style_key === 'string' ? body.variant_style_key.trim() : '';
    const familyKey = typeof body.variant_family_key === 'string' ? body.variant_family_key.trim() : '';
    if (!styleKey || !familyKey) {
      return bad(req, 'This listing requires a fitment and style selection.');
    }
    if (styleKey.length > 64 || familyKey.length > 64) {
      return bad(req, 'Invalid variant selection.');
    }
    const { data: variantRow, error: variantErr } = await supabaseAdmin
      .from('listing_variants')
      .select('id, style_key, style_label, family_key, stock_count, price_delta_eur')
      .eq('listing_id', listingId)
      .eq('style_key', styleKey)
      .eq('family_key', familyKey)
      .maybeSingle();

    if (variantErr) {
      console.error('[create-order] variant lookup failed:', variantErr.message);
      return oops(req, 'Could not verify the selected variant.');
    }
    if (!variantRow) {
      return bad(req, 'Selected fitment and style combination is not available.');
    }
    if (Number(variantRow.stock_count) <= 0) {
      return bad(req, 'Selected fitment and style combination is sold out.');
    }
    variantStyleKey   = String(variantRow.style_key);
    variantFamilyKey  = String(variantRow.family_key);
    variantStyleLabel = String(variantRow.style_label);
    variantPriceDelta = Number(variantRow.price_delta_eur) || 0;
  }

  let amountEur: number;
  if (isDeposit) {
    const deposit = Number(row.deposit_amount);
    if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= price) {
      return bad(req, 'Deposit is not configured for this listing.');
    }
    // Deposit is fixed; variant_price_delta applies to the balance,
    // not the deposit, by design.
    amountEur = deposit;
  } else if (fulfilment === 'collection') {
    amountEur = price + variantPriceDelta;
  } else {
    const shipping = Number(row.shipping_cost);
    if (!Number.isFinite(shipping) || shipping <= 0) {
      return bad(req, 'Shipping cost is not configured for this listing.');
    }
    amountEur = price + variantPriceDelta + shipping;
  }

  const titleSlice = typeof row.title === 'string' ? row.title.slice(0, 160) : 'ÉIRVOX';
  const tag = isDeposit ? ' (deposit)' : '';
  const variantSuffix = variantStyleLabel ? ` · ${variantStyleLabel}` : '';
  const description = `ÉIRVOX — ${titleSlice}${variantSuffix}${tag}`;

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
  if (variantStyleKey && variantFamilyKey) {
    metadata.variant_style_key   = variantStyleKey;
    metadata.variant_family_key  = variantFamilyKey;
    metadata.variant_style_label = variantStyleLabel ?? '';
    metadata.variant_price_delta = String(variantPriceDelta);
  }

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
