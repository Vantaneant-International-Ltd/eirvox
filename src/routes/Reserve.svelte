<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.reserve()));
</script>

<Nav />

<main id="main-content" class="reserve-page">
  <div class="page-container">

    <header class="res-header">
      <h1 class="res-header__title">How reservations work.</h1>
      <p class="res-header__sub">
        A €49 refundable deposit reserves your item or allocation.
        No commitment until delivery — fully refundable if you change your mind before dispatch.
      </p>
    </header>

    <!-- Four steps -->
    <section class="res-steps">
      <div class="res-steps__grid">
        {#each [
          {
            n: '01',
            title: 'Pay the €49 deposit.',
            body: 'The deposit is processed via Revolut or payment link — details provided at reservation. It holds your item or allocation and takes it off the market for other buyers.',
          },
          {
            n: '02',
            title: 'We confirm within 48 hours.',
            body: 'For DRIVE pieces, we check fitment compatibility and confirm by email. For marketplace items, the seller is notified and the item is marked as reserved.',
          },
          {
            n: '03',
            title: 'Proceed when you\'re ready.',
            body: 'Agree the sale price with the seller (marketplace) or receive the balance invoice (DRIVE). The €49 deposit is credited against the final amount.',
          },
          {
            n: '04',
            title: 'Item ships. Deposit credited.',
            body: 'Your €49 deposit is deducted from the final balance. The item ships tracked and insured. Refund if anything doesn\'t proceed — no questions asked.',
          },
        ] as step}
          <div class="res-step">
            <span class="evx-label res-step__num">{step.n}</span>
            <h3 class="res-step__title">{step.title}</h3>
            <p class="res-step__body">{step.body}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- DRIVE vs marketplace -->
    <section class="res-compare">
      <h2 class="res-compare__heading">Marketplace vs. DRIVE.</h2>
      <div class="res-compare__grid">
        <div class="res-compare__col">
          <span class="evx-label res-compare__label">MARKETPLACE ITEMS</span>
          <ul class="res-compare__list">
            <li>€49 deposit · fully refundable</li>
            <li>Item reserved immediately on deposit</li>
            <li>Seller contacted within 2h</li>
            <li>Balance agreed direct with seller</li>
            <li>7-day window to complete or cancel</li>
            <li>Full refund if item doesn't match listing</li>
          </ul>
        </div>
        <div class="res-compare__col">
          <span class="evx-label res-compare__label">DRIVE ISSUES</span>
          <ul class="res-compare__list">
            <li>€49 deposit · holds your allocation</li>
            <li>Fitment confirmed by email within 48h</li>
            <li>Balance invoiced before dispatch</li>
            <li>Deposit non-refundable after fitment confirmed</li>
            <li>Full refund if QC fails on production piece</li>
            <li>Serialised for you · shipped tracked &amp; insured</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="res-faq">
      <h2 class="res-faq__heading">Common questions.</h2>
      <div class="res-faq__list">
        {#each [
          {
            q: 'What happens if I change my mind?',
            a: 'For marketplace items, the deposit is fully refundable before the item ships. For DRIVE, the deposit is refundable within 24 hours of reservation. After that, it covers the cost of materials and production planning.',
          },
          {
            q: 'How do I pay the deposit?',
            a: 'Deposit payment is via Revolut or a secure payment link — details are sent by email after your reservation request.',
          },
          {
            q: 'Is the €49 separate from the item price?',
            a: 'No. The €49 is deducted from the final amount. You pay the balance (price minus €49) when the sale completes.',
          },
          {
            q: 'What if the seller backs out?',
            a: 'Full refund within 24 hours, plus a €25 disruption credit for your next purchase.',
          },
        ] as item}
          <div class="res-faq__item">
            <h3 class="res-faq__q">{item.q}</h3>
            <p class="res-faq__a">{item.a}</p>
          </div>
        {/each}
      </div>
    </section>

    <div class="res-ctas">
      <button class="evx-btn evx-btn--primary" on:click={() => navigate('/automotive')}>
        Browse listings →
      </button>
      <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/drive')}>
        View DRIVE issues
      </button>
    </div>

  </div>
</main>

<Footer />

<style>
  .reserve-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .res-header {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    max-width: 640px;
    margin-bottom: var(--evx-space-2xl);
  }

  .res-header__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: var(--evx-space-lg);
  }

  .res-header__sub { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); }

  .res-steps { margin-bottom: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }

  .res-steps__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-xl);
  }

  .res-step {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 2px solid var(--evx-rule-light);
  }

  .res-step__num { color: var(--evx-fox-orange); }

  .res-step__title {
    font-family: var(--evx-font-display);
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }

  .res-step__body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  .res-compare { margin-bottom: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }

  .res-compare__heading {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-bottom: var(--evx-space-xl);
  }

  .res-compare__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--evx-space-3xl); }

  .res-compare__label { display: block; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-lg); }

  .res-compare__list {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    font-size: 14px;
    line-height: 1.5;
    color: var(--evx-warm-black);
  }

  .res-compare__list li {
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .res-faq { margin-bottom: var(--evx-space-2xl); }

  .res-faq__heading {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-bottom: var(--evx-space-xl);
  }

  .res-faq__list { display: flex; flex-direction: column; gap: 0; }

  .res-faq__item {
    padding: var(--evx-space-xl) 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .res-faq__q {
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
  }

  .res-faq__a { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  .res-ctas {
    display: flex;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  @media (max-width: 1023px) {
    .res-steps__grid { grid-template-columns: 1fr 1fr; }
    .res-compare__grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 767px) {
    .res-steps__grid { grid-template-columns: 1fr; }
  }
</style>
