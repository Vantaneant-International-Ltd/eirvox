<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { createCheckoutInstance, type RevolutCheckoutInstance } from './revolutCheckout';

  /** Amount the buyer will pay, in euros. */
  export let amountEur: number;
  /** Free text shown on the Revolut checkout / Revolut Pay sheet. */
  export let description: string = 'ÉIRVOX';
  /** Free-form metadata attached to the order (visible in admin queue). */
  export let metadata: Record<string, string> = {};
  /** Path Revolut should redirect to on completion if the buyer uses
   *  the redirect/popup flow (popup also fires onSuccess in-place). */
  export let redirectPath: string = '/#/payment/return';

  const dispatch = createEventDispatcher<{
    success: { orderId: string };
    error: { message: string };
    cancel: undefined;
  }>();

  // Mount target for the native Revolut Pay button.
  let payTarget: HTMLDivElement;
  let instance: RevolutCheckoutInstance | null = null;

  let booting = true;
  let orderId = '';
  let bootError = '';
  // True after a successful payment (popup onSuccess or Revolut Pay onSuccess).
  let paid = false;
  // Set while the popup is open.
  let popupOpen = false;

  async function bootOrder() {
    booting = true;
    bootError = '';
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount_eur: amountEur,
          description,
          metadata,
          redirect_path: redirectPath,
        }),
      });
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) {
        bootError = res.status === 404
          ? 'API not running. Use `npm run dev:api`.'
          : `Server returned non-JSON (${res.status}).`;
        booting = false;
        return;
      }
      const body = await res.json();
      if (!res.ok || !body.token) {
        bootError = body.error ?? 'Could not create the payment order.';
        booting = false;
        return;
      }
      orderId = body.order_id;
      instance = await createCheckoutInstance(body.token, 'prod');

      // Mount the native Revolut Pay button into our slot.
      if (payTarget && instance.revolutPay) {
        instance.revolutPay(payTarget, {
          // Sensible defaults; Revolut renders the branded button with its R icon.
          buttonStyle: { size: 'large', radius: 'small' },
        });
      }
    } catch (err) {
      bootError = err instanceof Error ? err.message : 'Could not load Revolut.';
    }
    booting = false;
  }

  function openOtherMethods() {
    if (!instance || popupOpen) return;
    popupOpen = true;
    instance.payWithPopup({
      onSuccess: () => { popupOpen = false; paid = true; dispatch('success', { orderId }); },
      onError: (err: unknown) => {
        popupOpen = false;
        const message = err instanceof Error ? err.message : 'Payment failed.';
        dispatch('error', { message });
      },
      onCancel: () => { popupOpen = false; dispatch('cancel'); },
    });
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    void bootOrder();
  });

  onDestroy(() => {
    try { instance?.destroy?.(); } catch { /* ignore */ }
  });

  $: amountFmt = new Intl.NumberFormat('en-IE', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amountEur || 0);
</script>

<div class="paybtn">
  {#if booting}
    <div class="paybtn__loading" aria-live="polite">Loading payment…</div>
  {:else if bootError}
    <div class="paybtn__err" role="alert">{bootError}</div>
    <button class="paybtn__retry" type="button" on:click={bootOrder}>Try again</button>
  {:else if paid}
    <div class="paybtn__ok" role="status">
      <span class="paybtn__ok-label">PAYMENT RECEIVED</span>
      <span class="paybtn__ok-amount">{amountFmt}</span>
    </div>
  {:else}
    <!-- Native Revolut Pay button (rendered by embed.js into this target) -->
    <div class="paybtn__rev" bind:this={payTarget}></div>

    <button class="paybtn__other" type="button" on:click={openOtherMethods} disabled={popupOpen || !instance}>
      {popupOpen ? 'Opening…' : `Pay ${amountFmt} another way (Apple Pay · Google Pay · Card · Bank)`}
    </button>
  {/if}
</div>

<style>
  .paybtn {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    width: 100%;
    max-width: 420px;
  }

  /* Revolut Pay button injects its own styled <button>. We just give
     the wrapper sensible width and let Revolut handle the visuals. */
  .paybtn__rev { width: 100%; min-height: 48px; }

  .paybtn__other {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    border-radius: 2px;
    padding: 10px 14px;
    cursor: pointer;
    transition: var(--evx-transition);
    text-align: center;
  }
  .paybtn__other:hover:not(:disabled) { color: var(--evx-warm-black); border-color: var(--evx-warm-black); }
  .paybtn__other:disabled { opacity: 0.5; cursor: not-allowed; }

  .paybtn__loading {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    padding: 12px 0;
  }

  .paybtn__err {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    color: #C9665A;
    padding: 12px;
    border: 1px solid #C9665A;
    border-radius: 2px;
  }
  .paybtn__retry {
    font-family: var(--evx-font-display);
    font-size: 13px;
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border: none;
    border-radius: 2px;
    padding: 10px 16px;
    cursor: pointer;
    align-self: flex-start;
  }

  .paybtn__ok {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    border: 1px solid rgba(232, 116, 44, 0.3);
    background: rgba(232, 116, 44, 0.04);
    border-radius: 2px;
  }
  .paybtn__ok-label {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
  }
  .paybtn__ok-amount {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
</style>
