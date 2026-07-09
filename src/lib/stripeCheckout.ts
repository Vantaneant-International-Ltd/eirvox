// ============================================================
// ÉIRVOX — Stripe Checkout (hosted redirect)
// ============================================================
// Replaces the Revolut embed SDK. With hosted Checkout we don't load
// any Stripe JS: the edge function creates a Checkout Session and
// returns its hosted-page URL, and we simply navigate to it. Stripe
// then redirects the buyer back to `/#/payment/return?session_id=…`,
// where PaymentReturn.svelte reads the server-verified order status.
//
// The publishable key (VITE_STRIPE_PUBLISHABLE_KEY) is only needed if
// you later switch to the embedded Payment Element; the redirect flow
// below does not require it.
// ============================================================

import { callFunction } from './supabase';

export interface StartCheckoutInput {
  listingId: string;
  fulfilment: 'collection' | 'delivery';
  isDeposit?: boolean;
  buyerEmail?: string;
  buyerProfileId?: string;
  variantStyleKey?: string | null;
  variantFamilyKey?: string | null;
  redirectPath?: string;
}

export interface StartCheckoutResult {
  ok: boolean;
  error?: string;
}

/** Create a Checkout Session server-side and redirect the browser to
 *  Stripe's hosted payment page. Resolves only on failure (on success
 *  the page navigates away). */
export async function startCheckout(input: StartCheckoutInput): Promise<StartCheckoutResult> {
  try {
    const res = await callFunction('stripe-create-checkout-session', {
      body: {
        listing_id: input.listingId,
        fulfilment: input.fulfilment,
        is_deposit: input.isDeposit ?? false,
        buyer_email: input.buyerEmail,
        buyer_profile_id: input.buyerProfileId,
        redirect_path: input.redirectPath ?? '/#/payment/return',
        ...(input.variantStyleKey && input.variantFamilyKey
          ? { variant_style_key: input.variantStyleKey, variant_family_key: input.variantFamilyKey }
          : {}),
      },
    });
    const data = (res ?? {}) as { url?: string; error?: string };
    if (!data.url) return { ok: false, error: data.error || 'Could not start checkout.' };
    window.location.href = data.url;
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}
