<script lang="ts">
  // ÉIRVOX pay button — Stripe Checkout (hosted redirect).
  // Replaces the Revolut embed/popup flow. On click we ask the edge
  // function for a Checkout Session and navigate to Stripe's hosted
  // page; the buyer returns to /#/payment/return where the order status
  // is verified server-side (PaymentReturn.svelte). The charge amount is
  // resolved SERVER-SIDE from the listing — props here are display-only.
  import { createEventDispatcher } from 'svelte';
  import { startCheckout } from './stripeCheckout';
  import { auth } from './auth';

  /** Display-only amount (server resolves the real charge from the listing). */
  export let amountEur: number;
  /** ÉIRVOX-owned listing id (LISTING MODE). */
  export let listingId: string | null = null;
  /** Buyer's chosen fulfilment. Required when listingId is set. */
  export let fulfilment: 'collection' | 'delivery' | null = null;
  /** Charge the listing's deposit_amount instead of the full price. */
  export let isDeposit: boolean = false;
  /** Path Stripe returns to after payment. */
  export let redirectPath: string = '/#/payment/return';
  /** Render a "Refund policy" link in the subline. Auto-on in LISTING MODE. */
  export let showRefundLink: boolean = false;
  /** v20 wheel consignment 2-axis variant selection (identifiers only). */
  export let variantStyleKey: string | null = null;
  export let variantFamilyKey: string | null = null;

  $: refundLinkVisible = showRefundLink || !!listingId;

  const dispatch = createEventDispatcher<{ error: { message: string } }>();

  let submitting = false;
  let error = '';

  async function pay() {
    error = '';
    if (!listingId) { error = 'Nothing to pay for.'; return; }
    if (fulfilment !== 'collection' && fulfilment !== 'delivery') {
      error = "Choose 'collection' or 'delivery' before paying.";
      return;
    }
    submitting = true;
    const res = await startCheckout({
      listingId,
      fulfilment,
      isDeposit,
      buyerEmail: $auth.profile?.email ?? $auth.user?.email,
      buyerProfileId: $auth.user?.id,
      variantStyleKey,
      variantFamilyKey,
      redirectPath,
    });
    // On success the browser has already navigated to Stripe.
    if (!res.ok) {
      submitting = false;
      error = res.error ?? 'Could not start checkout.';
      dispatch('error', { message: error });
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
</script>

<div class="paybtn">
  <button type="button" class="paybtn__go" onclick={pay} disabled={submitting}>
    {submitting ? 'Starting checkout…' : `Pay ${fmt(amountEur)}${isDeposit ? ' deposit' : ''}`}
  </button>

  {#if error}
    <p class="paybtn__err" role="alert">{error}</p>
  {/if}

  <p class="paybtn__sub">
    Secure payment by Stripe.
    {#if refundLinkVisible}
      <a href="/#/refund-policy">Refund policy</a>.
    {/if}
  </p>
</div>

<style>
  .paybtn { display: flex; flex-direction: column; gap: 8px; }
  .paybtn__go {
    padding: 14px 20px; border: none; cursor: pointer;
    background: #1A1A1A; color: #fff;
    font-family: 'JetBrains Mono', monospace; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .paybtn__go:disabled { opacity: 0.6; cursor: default; }
  .paybtn__err { color: #B4402C; font-size: 13px; margin: 0; }
  .paybtn__sub { color: #8A8680; font-size: 12px; margin: 0; }
  .paybtn__sub a { color: #1A1A1A; }
</style>
