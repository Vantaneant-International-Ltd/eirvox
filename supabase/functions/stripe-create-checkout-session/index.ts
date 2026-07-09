// ============================================================
// POST /functions/v1/stripe-create-checkout-session
// ============================================================
// Creates a Stripe Checkout Session for an ÉIRVOX house listing and
// returns its hosted-page URL. Replaces payments-create-order (Revolut).
//
// SECURITY BOUNDARY: the charge amount is resolved SERVER-SIDE from the
// listing row (+ variant/deposit/fulfilment matrix). The client only
// sends identifiers (listing_id, fulfilment, is_deposit, variant keys);
// any client-supplied amount is ignored. Same contract as the retired
// Revolut function.
//
// Body: { listing_id, fulfilment: 'collection'|'delivery', is_deposit?,
//         buyer_email, buyer_profile_id?, variant_style_key?,
//         variant_family_key?, redirect_path? }
// ============================================================

import { handleCors } from '../_shared/cors.ts';
import { getStripe, eurosToMinor } from '../_shared/stripe.ts';
import { supabaseAdmin, ok, bad, oops, readJson, isValidEmail } from '../_shared/supabase-admin.ts';
import { rateLimit, rateLimitResponse } from '../_shared/ratelimit.ts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Body {
  listing_id?: string;
  fulfilment?: 'collection' | 'delivery';
  is_deposit?: boolean;
  buyer_email?: string;
  buyer_profile_id?: string;
  variant_style_key?: string;
  variant_family_key?: string;
  redirect_path?: string;
}

Deno.serve(async (req: Request) => {
  const pre = handleCors(req);
  if (pre) return pre;
  if (req.method !== 'POST') return bad(req, 'Method not allowed.');

  const rl = await rateLimit(req, 'waitlist');
  if (!rl.allowed) return rateLimitResponse(req, rl);

  const body = (await readJson<Body>(req)) ?? {};
  const listingId = (body.listing_id ?? '').trim();
  if (!UUID_RE.test(listingId)) return bad(req, 'Invalid listing_id.');

  const fulfilment = body.fulfilment;
  if (fulfilment !== 'collection' && fulfilment !== 'delivery') {
    return bad(req, "fulfilment must be 'collection' or 'delivery'.");
  }
  const isDeposit = body.is_deposit === true;

  const buyerEmail = (body.buyer_email ?? '').trim().toLowerCase();
  if (!isValidEmail(buyerEmail)) return bad(req, 'A valid buyer_email is required.');

  // ── Resolve the listing + charge SERVER-SIDE ──────────────
  const { data: listing, error: listErr } = await supabaseAdmin
    .from('listings')
    .select('*, seller:sellers ( id, is_house )')
    .eq('id', listingId)
    .maybeSingle();
  if (listErr) return oops(req, 'Could not load the listing.');
  if (!listing) return bad(req, 'Listing not found.');

  const row = listing as Record<string, unknown>;
  const sellerRaw = row.seller;
  const seller = Array.isArray(sellerRaw) ? sellerRaw[0] : sellerRaw;
  const isHouse = !!(seller && typeof seller === 'object' && (seller as { is_house?: boolean }).is_house === true);
  if (!isHouse) return bad(req, 'This listing is not payable through ÉIRVOX checkout.');
  if (row.status !== 'active') return bad(req, `Listing is ${String(row.status)}, not available for payment.`);

  const price = Number(row.price);
  if (!Number.isFinite(price) || price <= 0) return bad(req, 'Listing price is not set.');

  const stockState = row.stock_state === 'incoming' ? 'incoming' : 'in_stock';
  if (fulfilment === 'collection' && row.collection_available !== true) return bad(req, 'Collection is not available for this listing.');
  if (fulfilment === 'delivery' && row.shipping_available !== true) return bad(req, 'Delivery is not available for this listing.');
  if (isDeposit && fulfilment === 'delivery') return bad(req, 'Deposit is not available with delivery on this listing.');
  if (!isDeposit && stockState === 'incoming' && fulfilment === 'collection') return bad(req, 'Incoming stock requires a deposit for collection.');

  // Variant resolution (re-priced server-side).
  let variantStyleKey: string | null = null;
  let variantFamilyKey: string | null = null;
  let variantPriceDelta = 0;
  const { count: variantTotal } = await supabaseAdmin
    .from('listing_variants').select('id', { count: 'exact', head: true }).eq('listing_id', listingId);
  if ((variantTotal ?? 0) > 0) {
    const sk = (body.variant_style_key ?? '').trim();
    const fk = (body.variant_family_key ?? '').trim();
    if (!sk || !fk) return bad(req, 'This listing requires a fitment and style selection.');
    const { data: variant, error: vErr } = await supabaseAdmin
      .from('listing_variants')
      .select('style_key, family_key, stock_count, price_delta_eur')
      .eq('listing_id', listingId).eq('style_key', sk).eq('family_key', fk).maybeSingle();
    if (vErr) return oops(req, 'Could not verify the selected variant.');
    if (!variant) return bad(req, 'Selected fitment and style combination is not available.');
    if (Number(variant.stock_count) <= 0) return bad(req, 'Selected fitment and style combination is sold out.');
    variantStyleKey = String(variant.style_key);
    variantFamilyKey = String(variant.family_key);
    variantPriceDelta = Number(variant.price_delta_eur) || 0;
  }

  let amountEur: number;
  if (isDeposit) {
    const deposit = Number(row.deposit_amount);
    if (!Number.isFinite(deposit) || deposit <= 0 || deposit >= price) return bad(req, 'Deposit is not configured for this listing.');
    amountEur = deposit;
  } else if (fulfilment === 'collection') {
    amountEur = price + variantPriceDelta;
  } else {
    const shipping = Number(row.shipping_cost);
    if (!Number.isFinite(shipping) || shipping <= 0) return bad(req, 'Shipping cost is not configured for this listing.');
    amountEur = price + variantPriceDelta + shipping;
  }

  const title = typeof row.title === 'string' ? row.title.slice(0, 160) : 'ÉIRVOX';
  const description = `ÉIRVOX — ${title}${isDeposit ? ' (deposit)' : ''}`;

  const redirectPath = (typeof body.redirect_path === 'string' && body.redirect_path.startsWith('/')) ? body.redirect_path : '/#/payment/return';
  const origin = (() => { try { return new URL(req.headers.get('origin') || 'https://eirvox.ie').origin; } catch { return 'https://eirvox.ie'; } })();

  // ── Create the Stripe Checkout Session ────────────────────
  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: buyerEmail,
      line_items: [{
        quantity: 1,
        price_data: { currency: 'eur', unit_amount: eurosToMinor(amountEur), product_data: { name: description } },
      }],
      success_url: `${origin}${redirectPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#/payment/cancelled`,
      metadata: {
        listing_id: String(row.id),
        seller_id: String((seller as { id?: unknown })?.id ?? row.seller_id ?? ''),
        is_deposit: String(isDeposit),
        fulfilment,
        resolved_amount_eur: String(amountEur),
        ...(variantStyleKey ? { variant_style_key: variantStyleKey, variant_family_key: variantFamilyKey ?? '' } : {}),
      },
    });
  } catch (err) {
    console.error('[stripe-create-checkout-session] Stripe error:', err);
    return oops(req, 'Could not start checkout.');
  }

  // Persist a pending reservation keyed by the Stripe session id. The
  // stripe-webhook looks it up on checkout.session.completed.
  const persistArgs: Record<string, unknown> = {
    p_stripe_session_id: session.id,
    p_listing_id: listingId,
    p_buyer_email: buyerEmail,
    p_buyer_profile_id: (body.buyer_profile_id && /^[0-9a-f-]{36}$/i.test(body.buyer_profile_id)) ? body.buyer_profile_id : null,
    p_amount_eur: Math.round(amountEur),
    p_is_deposit: isDeposit,
    p_fulfilment: fulfilment,
  };
  if (variantStyleKey && variantFamilyKey) {
    persistArgs.p_variant_style_key = variantStyleKey;
    persistArgs.p_variant_family_key = variantFamilyKey;
  }
  const { error: persistErr } = await supabaseAdmin.rpc('record_order_created_stripe', persistArgs);
  if (persistErr) {
    // TODO(cutover): consider failing the checkout here instead of proceeding,
    // to avoid a paid session with no reservation row (see audit HIGH #4).
    console.error('[stripe-create-checkout-session] record_order_created_stripe failed:', persistErr);
  }

  return ok(req, { url: session.url, id: session.id });
});
