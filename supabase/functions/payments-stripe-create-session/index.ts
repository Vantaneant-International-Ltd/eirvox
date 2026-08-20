// ============================================================
// POST /functions/v1/payments-stripe-create-session
//
// Klarna checkout, sitting ALONGSIDE the Revolut path. Revolut still
// carries card / Apple Pay / Google Pay / Pay by Bank; this function
// exists only so a buyer can choose Klarna.
//
// SECURITY BOUNDARY: identical to payments-create-order. The server
// resolves the charge from the listing row and the variant matrix. A
// client-supplied amount is never trusted, in any mode.
//
// Body: { listing_id, fulfilment, buyer_email, buyer_profile_id?,
//         variant_style_key?, variant_family_key?, redirect_path? }
//
// NOTE ON DUPLICATION: the resolution below mirrors
// payments-create-order's resolveListingCharge deliberately. That
// function was left untouched so adding Klarna could not break a
// checkout that already takes money. The two MUST be converged the
// next time either is edited: two copies of price resolution is two
// chances to charge the wrong amount. Tracked in HANDOFF.md.
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { createKlarnaSession, stripeConfigured } from '../_shared/stripe.ts';
import { supabaseAdmin, ok, bad, oops, readJson, isValidEmail } from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';

type Fulfilment = 'collection' | 'delivery';
type StockState = 'in_stock' | 'incoming';

interface Body {
  listing_id?: string;
  fulfilment?: Fulfilment;
  buyer_email?: string;
  buyer_profile_id?: string;
  variant_style_key?: string;
  variant_family_key?: string;
  redirect_path?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE_ORIGIN = Deno.env.get('SITE_ORIGIN') ?? 'https://eirvox.ie';

Deno.serve(async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  // Fail closed and loudly. Without keys this must not pretend to work:
  // a dead Klarna button is worse than no Klarna button.
  if (!stripeConfigured()) {
    console.warn('[stripe-session] STRIPE_SECRET_KEY not set — Klarna is not enabled');
    return bad(req, 'Klarna is not available yet.');
  }

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = (await readJson<Body>(req)) ?? {};

  const listingId = (body.listing_id ?? '').trim();
  if (!UUID_RE.test(listingId)) return bad(req, 'Invalid listing_id.');

  const fulfilment = body.fulfilment;
  if (fulfilment !== 'collection' && fulfilment !== 'delivery') {
    return bad(req, "fulfilment must be 'collection' or 'delivery'.");
  }

  const buyerEmail = (body.buyer_email ?? '').trim().toLowerCase();
  if (!buyerEmail || !isValidEmail(buyerEmail)) {
    return bad(req, 'A valid email is required for Klarna.');
  }

  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('*, seller:sellers ( id, is_house )')
    .eq('id', listingId)
    .maybeSingle();

  if (error) {
    console.error('[stripe-session] listing lookup failed:', error.message);
    return oops(req, 'Could not load the listing.');
  }
  if (!data) return bad(req, 'Listing not found.');

  const row = data as Record<string, unknown>;
  const sellerRaw = row.seller;
  const seller = Array.isArray(sellerRaw) ? sellerRaw[0] : sellerRaw;
  const isHouse = !!(seller && typeof seller === 'object' && (seller as { is_house?: boolean }).is_house === true);
  if (!isHouse) return bad(req, 'This listing is not payable through ÉIRVOX checkout.');

  if (row.status !== 'active') {
    return bad(req, `Listing is ${String(row.status)}, not available for payment.`);
  }

  const price = Number(row.price);
  if (!Number.isFinite(price) || price <= 0) return bad(req, 'Listing price is not set.');

  const stockState: StockState = row.stock_state === 'incoming' ? 'incoming' : 'in_stock';

  if (fulfilment === 'collection' && row.collection_available !== true) {
    return bad(req, 'Collection is not available for this listing.');
  }
  if (fulfilment === 'delivery' && row.shipping_available !== true) {
    return bad(req, 'Delivery is not available for this listing.');
  }

  // ── Variant resolution ──────────────────────────────────────
  let variantStyleKey: string | null = null;
  let variantFamilyKey: string | null = null;
  let variantStyleLabel: string | null = null;
  let variantPriceDelta = 0;

  const { count: variantTotal, error: variantCountErr } = await supabaseAdmin
    .from('listing_variants')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId);

  if (variantCountErr) {
    const code = (variantCountErr as { code?: string }).code;
    if (code !== '42P01' && code !== 'PGRST205') {
      console.error('[stripe-session] variant count failed:', variantCountErr.message);
      return oops(req, 'Could not verify listing variants.');
    }
  }

  if ((variantTotal ?? 0) > 0) {
    const styleKey = typeof body.variant_style_key === 'string' ? body.variant_style_key.trim() : '';
    const familyKey = typeof body.variant_family_key === 'string' ? body.variant_family_key.trim() : '';
    if (!styleKey || !familyKey) return bad(req, 'This listing requires a fitment and style selection.');
    if (styleKey.length > 64 || familyKey.length > 64) return bad(req, 'Invalid variant selection.');

    const { data: variantRow, error: variantErr } = await supabaseAdmin
      .from('listing_variants')
      .select('id, style_key, style_label, family_key, stock_count, price_delta_eur')
      .eq('listing_id', listingId)
      .eq('style_key', styleKey)
      .eq('family_key', familyKey)
      .maybeSingle();

    if (variantErr) {
      console.error('[stripe-session] variant lookup failed:', variantErr.message);
      return oops(req, 'Could not verify the selected variant.');
    }
    if (!variantRow) return bad(req, 'Selected fitment and style combination is not available.');
    if (Number(variantRow.stock_count) <= 0) return bad(req, 'Selected fitment and style combination is sold out.');

    variantStyleKey   = String(variantRow.style_key);
    variantFamilyKey  = String(variantRow.family_key);
    variantStyleLabel = String(variantRow.style_label);
    variantPriceDelta = Number(variantRow.price_delta_eur) || 0;
  }

  // ── Amount. Deposits were removed (19 Aug 2026): one price, in full. ──
  let amountEur: number;
  if (fulfilment === 'collection') {
    amountEur = price + variantPriceDelta;
  } else {
    const shipping = Number(row.shipping_cost);
    if (!Number.isFinite(shipping) || shipping <= 0) {
      return bad(req, 'Shipping cost is not configured for this listing.');
    }
    amountEur = price + variantPriceDelta + shipping;
  }

  const titleSlice = typeof row.title === 'string' ? row.title.slice(0, 160) : 'ÉIRVOX';
  const variantSuffix = variantStyleLabel ? ` · ${variantStyleLabel}` : '';
  const description = `ÉIRVOX — ${titleSlice}${variantSuffix}`;

  const sellerId = typeof seller === 'object' && seller && 'id' in seller
    ? String((seller as { id: unknown }).id)
    : String(row.seller_id ?? '');

  const metadata: Record<string, string> = {
    provider: 'stripe_klarna',
    listing_id: String(row.id),
    listing_slug: typeof row.slug === 'string' ? row.slug.slice(0, 120) : '',
    seller_id: sellerId,
    stock_state: stockState,
    fulfilment,
    resolved_amount_eur: String(amountEur),
    buyer_email: buyerEmail.slice(0, 200),
  };
  if (variantStyleKey && variantFamilyKey) {
    metadata.variant_style_key   = variantStyleKey;
    metadata.variant_family_key  = variantFamilyKey;
    metadata.variant_style_label = variantStyleLabel ?? '';
    metadata.variant_price_delta = String(variantPriceDelta);
  }

  const redirectPath = typeof body.redirect_path === 'string' && body.redirect_path.startsWith('/')
    ? body.redirect_path
    : '/#/payment/return';

  try {
    const session = await createKlarnaSession({
      amountEur,
      description,
      buyerEmail,
      clientReferenceId: String(row.id),
      metadata,
      successUrl: `${SITE_ORIGIN}${redirectPath}?provider=stripe&id={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${SITE_ORIGIN}/#/wheels/${typeof row.slug === 'string' ? row.slug : ''}`,
      idempotencyKey: `evx-klarna-${listingId}-${buyerEmail}-${amountEur}`,
    });

    // Persist through the same RPC the Revolut path uses. Its first
    // argument is named p_revolut_order_id for historical reasons; it
    // stores whatever provider order id it is given, and a Stripe
    // session id (cs_…) is never mistakable for a Revolut UUID.
    const buyerProfileId = body.buyer_profile_id && /^[0-9a-f-]{36}$/i.test(body.buyer_profile_id)
      ? body.buyer_profile_id : null;
    const persistArgs: Record<string, unknown> = {
      p_revolut_order_id: session.id,
      p_listing_id: listingId,
      p_buyer_email: buyerEmail,
      p_buyer_profile_id: buyerProfileId,
      // Recorded to the cent. Prices carry cents now, so rounding
      // to whole euros here would file a reservation for an amount
      // the buyer was never charged. The charge itself is unchanged:
      // eurosToMinor already rounds to the nearest cent.
      p_amount_eur: Math.round(amountEur * 100) / 100,
      p_is_deposit: false,
      p_fulfilment: fulfilment,
    };
    if (variantStyleKey && variantFamilyKey) {
      persistArgs.p_variant_style_key  = variantStyleKey;
      persistArgs.p_variant_family_key = variantFamilyKey;
    }
    const { error: persistErr } = await supabaseAdmin.rpc('record_order_created', persistArgs);
    if (persistErr) {
      // Never fail the buyer's checkout on a persistence problem: the
      // session already exists at Stripe. Log loudly for reconciliation.
      console.error('[stripe-session] record_order_created failed:', persistErr);
    }

    return ok(req, { ok: true, session_id: session.id, checkout_url: session.url });
  } catch (err) {
    console.error('[stripe-session] failed:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return bad(req, msg.slice(0, 280));
  }
});
