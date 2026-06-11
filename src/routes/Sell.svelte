<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.sell()));
</script>

<Nav />

<main id="main-content" class="sell-page">
  <div class="page-container">

    <!-- Hero -->
    <header class="sell-hero">
      <div class="sell-hero__badge evx-caption">FOR SELLERS</div>
      <div class="sell-hero__inner">
        <div>
          <h1 class="sell-hero__title">Sell on ÉIRVOX.</h1>
          <p class="sell-hero__desc">
            A curated marketplace, not a feed. Lower fees than you'd pay elsewhere.
            Admission by application, considered listings, a quality bar that earns you better buyers.
          </p>
          <div class="sell-hero__actions">
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
              Apply to sell →
            </button>
            <button class="evx-btn evx-btn--ghost" on:click={() => document.getElementById('tiers')?.scrollIntoView({ behavior: 'smooth' })}>
              How the tiers work
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Tiers -->
    <section class="sell-tiers" id="tiers">
      <h2 class="sell-tiers__heading">Three doors into the house.</h2>

      <div class="tiers-grid">
        <!-- Verified -->
        <div class="tier-card">
          <span class="evx-caption tier-card__num">TIER 03</span>
          <h3 class="tier-card__name">Verified</h3>
          <p class="tier-card__price">7% commission · €0/mo</p>
          <ul class="tier-card__features">
            <li>+ Up to 10 active listings</li>
            <li>+ Standard listing tools</li>
            <li>+ Optional reservation deposits</li>
            <li>+ In-app buyer messaging</li>
            <li class="tier-card__neg">- No shop page</li>
          </ul>
          <button class="evx-btn evx-btn--ghost tier-card__cta" on:click={() => navigate('/sell/apply')}>
            Apply as Verified
          </button>
        </div>

        <!-- Atelier (recommended) -->
        <div class="tier-card tier-card--recommended">
          <span class="tier-card__rec-badge evx-caption">RECOMMENDED</span>
          <span class="evx-caption tier-card__num">TIER 02</span>
          <h3 class="tier-card__name tier-card__name--light">Atelier</h3>
          <p class="tier-card__price tier-card__price--light">5% commission · €19/mo</p>
          <ul class="tier-card__features tier-card__features--light">
            <li>+ Everything in Verified</li>
            <li>+ Custom shop page</li>
            <li>+ Unlimited listings</li>
            <li>+ Sales analytics</li>
            <li>+ Priority support</li>
          </ul>
          <button class="evx-btn evx-btn--primary tier-card__cta" on:click={() => navigate('/sell/apply')}>
            Apply as Atelier
          </button>
        </div>

        <!-- House -->
        <div class="tier-card tier-card--house">
          <span class="evx-caption tier-card__num">TIER 01 · INVITE</span>
          <h3 class="tier-card__name">House</h3>
          <p class="tier-card__price">By arrangement · invite only</p>
          <ul class="tier-card__features">
            <li>+ Homepage editorial features</li>
            <li>+ DRIVE issue scheduling</li>
            <li>+ ÉIRVOX photography &amp; copy</li>
            <li class="tier-card__neg">- By invitation only</li>
          </ul>
          <button class="evx-btn evx-btn--ghost tier-card__cta" disabled>
            By invitation
          </button>
        </div>
      </div>
    </section>

    <!-- What we look for -->
    <section class="sell-criteria">
      <div class="sell-criteria__inner">
        <div>
          <span class="evx-caption sell-criteria__pre">WHAT WE LOOK FOR</span>
          <h2 class="sell-criteria__heading">Four things.</h2>
          <p class="sell-criteria__sub">
            We respond to every applicant. Usually within five working days.
            Approval includes a short call.
          </p>
        </div>
        <ol class="sell-criteria__list">
          {#each [
            'A clear category and a strong point of view.',
            'Honest condition descriptions. No exaggeration.',
            'Decent photography. We can help if you are close.',
            'Reliable shipping or a real collection point.',
          ] as item, i}
            <li class="sell-criteria__item">
              <span class="evx-label sell-criteria__num">{String(i + 1).padStart(2, '0')}</span>
              <span class="sell-criteria__text">{item}</span>
            </li>
          {/each}
        </ol>
      </div>
    </section>

    <!-- CTA strip -->
    <div class="sell-bottom">
      <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
        Apply to sell →
      </button>
      <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/dashboard')}>
        Preview the dashboard
      </button>
      <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/create')}>
        Try the listing flow
      </button>
    </div>

  </div>
</main>

<Footer />

<style>
  .sell-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .sell-hero {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .sell-hero__badge {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-xl);
  }

  .sell-hero__inner {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .sell-hero__title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .sell-hero__desc {
    font-size: 16px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 480px;
    margin-bottom: var(--evx-space-xl);
  }

  .sell-hero__actions { display: flex; gap: var(--evx-space-md); }

  /* Tiers */
  .sell-tiers { margin-bottom: var(--evx-space-2xl); }

  .sell-tiers__heading {
    font-family: var(--evx-font-display);
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: var(--evx-space-2xl);
  }

  .tiers-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-2xl);
  }

  .tier-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    position: relative;
  }

  .tier-card--recommended {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border-color: var(--evx-warm-black);
  }

  .tier-card__rec-badge {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 8px;
  }

  .tier-card__num { color: var(--evx-ink-soft); }
  .tier-card--recommended .tier-card__num { color: rgba(245,242,237,0.5); }

  .tier-card__name {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
  }

  .tier-card__name--light { color: var(--evx-paper); }

  .tier-card__price { font-size: 14px; color: var(--evx-ink-soft); }
  .tier-card__price--light { color: rgba(245,242,237,0.6); }

  .tier-card__features {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    font-size: 13px;
    line-height: 1.5;
    color: var(--evx-warm-black);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .tier-card--recommended .tier-card__features {
    color: var(--evx-paper);
    border-color: var(--evx-rule-dark);
  }

  .tier-card__neg { opacity: 0.50; }

  .tier-card__cta { margin-top: var(--evx-space-sm); }

  /* Addon */
  .sell-addon {
    display: grid;
    grid-template-columns: 180px 1fr 1fr;
    gap: var(--evx-space-xl);
    padding: var(--evx-space-xl) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
    align-items: center;
  }

  .sell-addon__label { color: var(--evx-ink-soft); display: block; }

  .sell-addon__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 18px;
  }

  .sell-addon__price { color: var(--evx-ink-soft); }

  .sell-addon__mid,
  .sell-addon__right { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }

  /* Criteria */
  .sell-criteria {
    padding: var(--evx-space-2xl) 0;
    border-top: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .sell-criteria__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .sell-criteria__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }

  .sell-criteria__heading {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .sell-criteria__sub { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }

  .sell-criteria__list {
    display: flex;
    flex-direction: column;
    gap: 0;
    list-style: none;
  }

  .sell-criteria__item {
    display: flex;
    gap: var(--evx-space-xl);
    align-items: flex-start;
    padding: var(--evx-space-lg) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 15px;
    color: var(--evx-warm-black);
    line-height: 1.5;
  }

  .sell-criteria__num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }

  .sell-bottom {
    display: flex;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  @media (max-width: 1023px) {
    .sell-hero__inner { grid-template-columns: 1fr; }
    .tiers-grid { grid-template-columns: 1fr; }
    .sell-criteria__inner { grid-template-columns: 1fr; }
    .sell-addon { grid-template-columns: 1fr; }
  }
</style>
