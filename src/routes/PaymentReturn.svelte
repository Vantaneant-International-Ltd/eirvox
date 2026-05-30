<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';

  let loading = true;
  let error = '';
  let state: string = '';
  let amount: number | null = null;
  let orderId = '';

  onMount(async () => {
    // Revolut redirects back with ?order_id=... (or sometimes just ?id=...).
    // We read either. Hash routing means the query is on the path *after*
    // the #, so window.location.hash carries '/payment/return?id=...'.
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    const search = qIdx >= 0 ? hash.slice(qIdx + 1) : '';
    const params = new URLSearchParams(search);
    orderId = params.get('id') || params.get('order_id') || '';

    if (!orderId) {
      // Fallback: real URL query string (some integrations land here instead).
      const fallback = new URLSearchParams(window.location.search);
      orderId = fallback.get('id') || fallback.get('order_id') || '';
    }

    if (!orderId) {
      error = 'No order id in URL. The redirect from Revolut was incomplete.';
      loading = false;
      return;
    }

    try {
      const res = await fetch(`/api/payments/order-status?id=${encodeURIComponent(orderId)}`);
      const body = await res.json();
      if (!res.ok || !body.ok) {
        error = body.error ?? 'Could not read order status.';
      } else {
        state = body.state;
        amount = body.amount_eur;
      }
    } catch {
      error = 'Network error fetching order status.';
    }
    loading = false;
  });

  $: tone =
    state === 'COMPLETED' || state === 'AUTHORISED' ? 'ok' :
    state === 'CANCELLED' || state === 'FAILED' ? 'err' :
    state === 'PENDING' || state === 'PROCESSING' ? 'pending' :
    'pending';

  $: label =
    state === 'COMPLETED' ? 'PAYMENT COMPLETE' :
    state === 'AUTHORISED' ? 'AUTHORISED' :
    state === 'PENDING' ? 'PENDING' :
    state === 'PROCESSING' ? 'PROCESSING' :
    state === 'CANCELLED' ? 'CANCELLED' :
    state === 'FAILED' ? 'FAILED' :
    'CHECKING…';
</script>

<Nav />

<main id="main-content" class="pr">
  <div class="pr__inner page-container">
    {#if loading}
      <span class="evx-label pr__label pr__label--pending">CHECKING…</span>
      <h1 class="pr__h">Looking up your payment.</h1>
    {:else if error}
      <span class="evx-label pr__label pr__label--err">SOMETHING WENT WRONG</span>
      <h1 class="pr__h">We couldn't read the order.</h1>
      <p class="pr__body">{error}</p>
      <div class="pr__actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>Back to ÉIRVOX</button>
      </div>
    {:else}
      <span class="evx-label pr__label pr__label--{tone}">{label}</span>
      <h1 class="pr__h">
        {#if state === 'COMPLETED'}
          Thanks — your payment of €{amount} went through.
        {:else if state === 'AUTHORISED'}
          Authorised — €{amount} is on hold pending capture.
        {:else if state === 'CANCELLED'}
          You cancelled. No money moved.
        {:else if state === 'FAILED'}
          The payment failed. No money moved.
        {:else}
          Still processing. Refresh in a moment.
        {/if}
      </h1>
      <dl class="pr__meta">
        <div><dt>Order ID</dt><dd class="pr__mono">{orderId}</dd></div>
        {#if amount != null}
          <div><dt>Amount</dt><dd>€{amount}</dd></div>
        {/if}
        <div><dt>State</dt><dd class="pr__mono">{state}</dd></div>
      </dl>
      <div class="pr__actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>Back to ÉIRVOX</button>
        {#if state === 'PENDING' || state === 'PROCESSING'}
          <button class="evx-btn evx-btn--ghost" on:click={() => location.reload()}>Refresh status</button>
        {/if}
      </div>
    {/if}
  </div>
</main>

<Footer />

<style>
  .pr { flex: 1; padding-top: var(--evx-space-3xl); padding-bottom: var(--evx-space-3xl); }
  .pr__inner { max-width: 680px; }
  .pr__label { display: block; margin-bottom: var(--evx-space-md); }
  .pr__label--ok { color: var(--evx-fox-orange); }
  .pr__label--err { color: #C9665A; }
  .pr__label--pending { color: var(--evx-ink-soft); }
  .pr__h {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-lg);
    line-height: 1.15;
  }
  .pr__body { font-size: 15px; color: var(--evx-ink-soft); line-height: 1.7; margin-bottom: var(--evx-space-lg); }
  .pr__meta {
    display: flex;
    flex-direction: column;
    gap: 0;
    border-top: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }
  .pr__meta > div {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: var(--evx-space-md);
    padding: 14px 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .pr__meta dt {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    text-transform: uppercase;
  }
  .pr__meta dd { font-size: 14px; color: var(--evx-warm-black); }
  .pr__mono { font-family: var(--evx-font-mono); font-size: 12px; word-break: break-all; }
  .pr__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }
</style>
