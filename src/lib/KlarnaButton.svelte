<script lang="ts">
  // ============================================================
  // KlarnaButton — pay in instalments, via Stripe.
  //
  // Sits alongside PayButton (Revolut card / Apple Pay / Google Pay).
  // Renders NOTHING unless site_settings.flags.klarna_enabled is on,
  // so the mark cannot appear on a checkout that cannot take a Klarna
  // payment.
  //
  // The server resolves the amount from the listing and the variant
  // matrix, exactly as the Revolut path does. Anything shown here is
  // display only.
  // ============================================================
  import { auth } from './auth';
  import { siteFlags } from './flags';
  import { callFunction } from './supabase';
  import { isValidEmail } from './waitlist';

  export let listingId: string;
  export let fulfilment: 'collection' | 'delivery' | null = null;
  export let variantStyleKey: string | null = null;
  export let variantFamilyKey: string | null = null;
  export let redirectPath: string = '/#/payment/return';

  let email = '';
  let submitting = false;
  let errorMsg = '';

  $: enabled = $siteFlags.klarna_enabled;
  $: accountEmail = $auth.profile?.email ?? $auth.user?.email ?? '';
  $: effectiveEmail = (accountEmail || email).trim().toLowerCase();
  $: ready = !!fulfilment && isValidEmail(effectiveEmail);

  async function start() {
    if (submitting || !ready) return;
    errorMsg = '';
    submitting = true;
    try {
      const res = await callFunction('payments-stripe-create-session', {
        body: {
          listing_id: listingId,
          fulfilment,
          buyer_email: effectiveEmail,
          buyer_profile_id: $auth.user?.id,
          redirect_path: redirectPath,
          ...(variantStyleKey && variantFamilyKey
            ? { variant_style_key: variantStyleKey, variant_family_key: variantFamilyKey }
            : {}),
        },
      });

      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        errorMsg = res.status === 404
          ? 'Klarna is not set up on this site yet.'
          : `Server returned an unexpected response (${res.status}).`;
        submitting = false;
        return;
      }

      const body = await res.json();
      if (!res.ok || !body.checkout_url) {
        errorMsg = body.error ?? 'Could not start the Klarna checkout.';
        submitting = false;
        return;
      }

      window.location.href = body.checkout_url;
    } catch {
      errorMsg = 'Network error starting the Klarna checkout.';
      submitting = false;
    }
  }
</script>

{#if enabled}
  <div class="kl">
    <div class="kl__rule" aria-hidden="true"><span>or</span></div>

    {#if !accountEmail}
      <label class="kl__field">
        <span class="sr-only">Email for your Klarna order</span>
        <input
          type="email"
          class="kl__input"
          placeholder="Email for your order"
          autocomplete="email"
          bind:value={email}
          disabled={submitting}
        />
      </label>
    {/if}

    <button class="kl__btn" type="button" on:click={start} disabled={!ready || submitting}>
      {submitting ? 'Opening Klarna…' : 'Pay with Klarna'}
    </button>

    {#if !fulfilment}
      <p class="kl__note">Choose collection or delivery first.</p>
    {:else if errorMsg}
      <p class="kl__note kl__note--err">{errorMsg}</p>
    {:else}
      <p class="kl__note">You will finish on Klarna's site. Klarna decides what terms you are offered.</p>
    {/if}
  </div>
{/if}

<style>
  .kl { display: flex; flex-direction: column; gap: var(--evx-space-sm); }

  .kl__rule {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    margin: var(--evx-space-sm) 0;
  }
  .kl__rule::before,
  .kl__rule::after {
    content: '';
    flex: 1;
    border-top: 1px solid var(--evx-rule-hair);
  }
  .kl__rule span {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }

  .kl__field { display: block; }
  .kl__input {
    width: 100%;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-ink);
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 12px 14px;
  }
  .kl__input::placeholder { color: var(--evx-ink-faint); }
  .kl__input:focus-visible { border-color: var(--evx-fox-orange); }

  /* Type, rule and the house palette. No Klarna pink, no badge
     artwork: the brand system has one accent and this is not it. */
  .kl__btn {
    width: 100%;
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-ink);
    background: var(--evx-paper);
    border: 1px solid var(--evx-ink);
    padding: 14px 26px;
    transition: var(--evx-transition);
  }
  .kl__btn:hover:not(:disabled) { opacity: 0.7; }
  .kl__btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .kl__note {
    font-size: 12.5px;
    line-height: 1.5;
    color: var(--evx-ink-soft);
  }
  .kl__note--err { color: var(--evx-fox-orange); }
</style>
