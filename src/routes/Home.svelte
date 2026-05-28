<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import {
    getFeaturedListings,
    getRecentListings,
    getCategoryCounts,
    categories,
    formatPrice,
  } from '../data/listings';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.home()));

  const featured = getFeaturedListings(12);
  const recent = getRecentListings(8);
  const counts = getCategoryCounts();
</script>

<Nav />

<main>
  <!-- DRIVE 003 HERO ──────────────────────────────── -->
  <section class="hero page-container">
    <div class="hero__inner">
      <div class="hero__text">
        <span class="evx-caption hero__issue">ISSUE 003 · MMXXVI · OPEN FOR RESERVATION</span>
        <h1 class="hero__title">
          Mercedes-AMG GT —
          <em class="hero__italic">carbon steering wheel.</em>
        </h1>
        <p class="hero__desc">
          Eight pieces. Forged carbon shell, Alcantara wrap, champagne stitch at twelve.
          One specification — no variants, no restocks. Finished and serialised in Dublin.
        </p>
        <div class="hero__price-row">
          <span class="hero__price">€4,250</span>
          <span class="hero__deposit evx-caption">· €49 refundable reservation deposit</span>
          <span class="hero__stock">
            <span class="hero__dot"></span>
            <span class="evx-caption">5 OF 8 REMAINING</span>
          </span>
        </div>
        <div class="hero__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/drive/003-mercedes-amg-gt')}>
            Reserve allocation — €49
          </button>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/drive/003-mercedes-amg-gt')}>
            Read Issue 003
          </button>
        </div>
      </div>
      <div class="hero__image">
        <span class="evx-caption hero__plate">DRV-003 · PLATE 01</span>
        <div class="hero__img-placeholder">
          <span class="evx-caption hero__img-label">Mercedes-AMG GT<br/>Carbon steering wheel</span>
        </div>
        <span class="evx-caption hero__img-caption">FORGED MACRO · ¾ ANGLE</span>
      </div>
    </div>
  </section>

  <!-- CATEGORY GRID ──────────────────────────────── -->
  <section class="categories page-container">
    <div class="categories__header">
      <span class="evx-label">Browse by category</span>
      <button class="evx-caption categories__all" on:click={() => navigate('/automotive')}>
        All categories →
      </button>
    </div>
    <div class="categories__grid">
      {#each categories as cat}
        <button class="cat-tile" on:click={() => navigate(`/${cat.slug}`)}>
          <div class="cat-tile__bg"></div>
          <span class="cat-tile__label">{cat.label}</span>
          <span class="evx-caption cat-tile__count">{counts[cat.slug]} listings</span>
        </button>
      {/each}
    </div>
  </section>

  <!-- FEATURED ───────────────────────────────────── -->
  <section class="featured page-container">
    <div class="featured__header">
      <div>
        <span class="evx-label">Featured this week</span>
        <h2 class="featured__heading">Twelve pieces, hand-picked.</h2>
      </div>
      <button class="evx-caption featured__all" on:click={() => navigate('/automotive')}>
        Browse all 31 →
      </button>
    </div>
    <div class="featured__grid">
      {#each featured as listing}
        <ListingCard {listing} />
      {/each}
    </div>
  </section>

  <!-- DRIVE BAND ─────────────────────────────────── -->
  <section class="drive-band">
    <div class="drive-band__inner page-container">
      <div class="drive-band__left">
        <span class="evx-label drive-band__label">ISSUE 003</span>
        <div class="drive-band__logo">DRIVE</div>
        <p class="drive-band__desc">
          Mercedes-AMG GT · V8 Biturbo · C192
        </p>
        <p class="drive-band__copy">
          Eight pieces. Forged carbon shell, Alcantara wrap, champagne stitch.
          Five of eight remaining. Reservations close on allocation — we do not reprint.
        </p>
      </div>
      <div class="drive-band__right">
        <span class="evx-caption drive-band__remaining">5 OF 8 REMAINING</span>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/drive/003-mercedes-amg-gt')}>
          Reserve · €49 deposit
        </button>
        <button class="evx-btn evx-btn--ghost-paper drive-band__archive" on:click={() => navigate('/drive')}>
          All DRIVE issues →
        </button>
      </div>
    </div>
  </section>

  <!-- RECENTLY LISTED ────────────────────────────── -->
  <section class="recent page-container">
    <div class="recent__header">
      <div>
        <span class="evx-label">Recently listed</span>
        <h2 class="recent__heading">Newest on Éirvox — last 48 hours.</h2>
      </div>
      <span class="evx-caption recent__sort">Sort: newest first →</span>
    </div>
    <div class="recent__grid">
      {#each recent as listing}
        <ListingCard {listing} />
      {/each}
    </div>
  </section>

  <!-- TRUST STRIP ────────────────────────────────── -->
  <section class="trust page-container">
    <div class="trust__inner">
      <div class="trust__item">
        <span class="evx-label trust__num">01</span>
        <h3 class="trust__title">€49 refundable reservation deposits.</h3>
        <p class="trust__desc">
          All reservation deposits are fully refundable until the item ships.
          No risk, no lock-in — just your place in the queue.
        </p>
      </div>
      <div class="trust__item">
        <span class="evx-label trust__num">02</span>
        <h3 class="trust__title">Every seller verified by application.</h3>
        <p class="trust__desc">
          Phone and ID verified before listing. Cohort-approved sellers across
          three tiers — no open signup, no anonymous listings.
        </p>
      </div>
      <div class="trust__item">
        <span class="evx-label trust__num">03</span>
        <h3 class="trust__title">Protected payments coming soon.</h3>
        <p class="trust__desc">
          Full Stripe Connect escrow in H2 2026. Until then, deposits are
          processed directly and refunded in full if anything doesn't proceed.
        </p>
      </div>
    </div>
  </section>

  <!-- TRADE BAND ────────────────────────────────────── -->
  <section class="trade-band page-container">
    <div class="trade-band__inner">
      <div class="trade-band__left">
        <span class="evx-caption trade-band__pre">DIRECTORY · ÉIRVOX TRADE</span>
        <h2 class="trade-band__h">Find verified tradespeople across Ireland.</h2>
        <p class="trade-band__sub">
          ID-checked, credential-verified, admitted by application.
          Flat monthly fee — no per-lead charges.
        </p>
        <div class="trade-band__actions">
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/trade')}>
            Browse all trades →
          </button>
          <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/trade/apply')}>
            List your trade
          </button>
        </div>
      </div>
      <div class="trade-band__cats">
        {#each [
          { slug: 'electricians', label: 'Electricians' },
          { slug: 'plumbers',     label: 'Plumbers' },
          { slug: 'mechanics',    label: 'Mechanics' },
          { slug: 'carpenters',   label: 'Carpenters' },
        ] as c}
          <button class="trade-band__cat" on:click={() => navigate(`/trade/${c.slug}`)}>
            <span class="trade-band__cat-label">{c.label}</span>
            <span class="evx-caption trade-band__cat-arrow">→</span>
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- SELL CTA ────────────────────────────────────── -->
  <section class="sell-cta page-container">
    <div class="sell-cta__inner">
      <div>
        <h2 class="sell-cta__heading">Sell on Éirvox.</h2>
        <p class="sell-cta__sub">Lower fees than you're used to. Three tiers, cohort-approved. Apply once — list as soon as you're verified.</p>
      </div>
      <div class="sell-cta__actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
          Apply to sell →
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell')}>
          Read the tiers
        </button>
      </div>
    </div>
  </section>
</main>

<Footer />

<style>
  main { flex: 1; }

  /* HERO */
  .hero {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .hero__inner {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: var(--evx-space-3xl);
    align-items: center;
  }

  .hero__issue {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-lg);
  }

  .hero__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(32px, 4vw, 56px);
    line-height: 1.08;
    letter-spacing: -0.02em;
    margin-bottom: var(--evx-space-lg);
    color: var(--evx-warm-black);
  }

  .hero__italic {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
  }

  .hero__desc {
    font-size: 16px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 480px;
    margin-bottom: var(--evx-space-xl);
  }

  .hero__price-row {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-xl);
    flex-wrap: wrap;
  }

  .hero__price {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 32px;
    letter-spacing: -0.015em;
  }

  .hero__deposit { color: var(--evx-ink-soft); }

  .hero__stock {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hero__dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--evx-fox-orange);
  }

  .hero__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }

  .hero__image {
    position: relative;
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero__plate {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    color: var(--evx-fox-orange);
  }

  .hero__img-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .hero__img-label {
    color: rgba(245, 242, 237, 0.30);
    line-height: 1.8;
  }

  .hero__img-caption {
    position: absolute;
    bottom: var(--evx-space-md);
    left: var(--evx-space-md);
    color: rgba(245, 242, 237, 0.35);
  }

  /* CATEGORIES */
  .categories {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .categories__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--evx-space-xl);
  }

  .categories__all {
    background: none;
    border: none;
    color: var(--evx-ink-soft);
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .categories__all:hover { color: var(--evx-warm-black); }

  .categories__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--evx-space-md);
  }

  .cat-tile {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
    padding: 0;
  }

  .cat-tile:hover { opacity: 0.78; }

  .cat-tile__bg {
    aspect-ratio: 1;
    background: var(--evx-graphite);
  }

  .cat-tile__label {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-warm-black);
    display: block;
  }

  .cat-tile__count {
    color: var(--evx-ink-soft);
    display: block;
  }

  /* FEATURED */
  .featured {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .featured__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--evx-space-xl);
  }

  .featured__heading {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 28px;
    letter-spacing: -0.015em;
    margin-top: var(--evx-space-sm);
    color: var(--evx-warm-black);
  }

  .featured__all {
    background: none;
    border: none;
    color: var(--evx-ink-soft);
    cursor: pointer;
    transition: var(--evx-transition);
    white-space: nowrap;
  }

  .featured__all:hover { color: var(--evx-warm-black); }

  .featured__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-xl);
  }

  /* DRIVE BAND */
  .drive-band {
    background: var(--evx-graphite);
    color: var(--evx-paper);
    padding: var(--evx-space-2xl) 0;
  }

  .drive-band__inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-3xl);
  }

  .drive-band__left { max-width: 560px; }

  .drive-band__label {
    color: var(--evx-ink-soft);
    display: block;
    margin-bottom: var(--evx-space-sm);
  }

  .drive-band__logo {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 48px;
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--evx-paper);
    margin-bottom: var(--evx-space-md);
  }

  .drive-band__desc {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    text-transform: uppercase;
    margin-bottom: var(--evx-space-md);
  }

  .drive-band__copy {
    font-size: 15px;
    line-height: 1.65;
    color: rgba(245, 242, 237, 0.75);
  }

  .drive-band__right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--evx-space-md);
    flex-shrink: 0;
  }

  .drive-band__remaining {
    color: var(--evx-fox-orange);
  }

  .drive-band__archive {
    font-size: 12px;
    border-color: transparent;
    color: var(--evx-ink-soft);
    padding: 0;
  }

  /* RECENTLY LISTED */
  .recent {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .recent__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--evx-space-xl);
  }

  .recent__heading {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 28px;
    letter-spacing: -0.015em;
    margin-top: var(--evx-space-sm);
    color: var(--evx-warm-black);
  }

  .recent__sort {
    color: var(--evx-ink-soft);
    white-space: nowrap;
  }

  .recent__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-xl);
  }

  /* TRUST STRIP */
  .trust {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .trust__inner {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-3xl);
  }

  .trust__item {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .trust__num {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-sm);
  }

  .trust__title {
    font-family: var(--evx-font-display);
    font-size: 17px;
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }

  .trust__desc {
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
  }

  /* TRADE BAND */
  .trade-band {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .trade-band__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    align-items: center;
  }
  .trade-band__left { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .trade-band__pre { color: var(--evx-fox-orange); }
  .trade-band__h {
    font-family: var(--evx-font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    line-height: 1.15;
  }
  .trade-band__sub {
    font-size: 15px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 480px;
  }
  .trade-band__actions { display: flex; gap: var(--evx-space-sm); flex-wrap: wrap; margin-top: var(--evx-space-sm); }

  .trade-band__cats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--evx-rule-light);
  }
  .trade-band__cat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--evx-space-md) var(--evx-space-lg);
    background: none;
    border: none;
    border-right: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: background 200ms ease;
  }
  .trade-band__cat:hover { background: rgba(0,0,0,0.02); }
  .trade-band__cat:nth-child(2n) { border-right: none; }
  .trade-band__cat:nth-last-child(-n+2) { border-bottom: none; }
  .trade-band__cat-label { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .trade-band__cat-arrow { color: var(--evx-ink-soft); }

  /* SELL CTA */
  .sell-cta {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .sell-cta__inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-3xl);
  }

  .sell-cta__heading {
    font-family: var(--evx-font-display);
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
  }

  .sell-cta__sub {
    font-size: 15px;
    color: var(--evx-ink-soft);
    line-height: 1.65;
    max-width: 440px;
  }

  .sell-cta__actions {
    display: flex;
    gap: var(--evx-space-md);
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 1199px) {
    .hero__inner { grid-template-columns: 1fr 320px; }
    .featured__grid { grid-template-columns: repeat(3, 1fr); }
    .recent__grid { grid-template-columns: repeat(3, 1fr); }
    .categories__grid { grid-template-columns: repeat(4, 1fr); }
  }

  @media (max-width: 1023px) {
    .hero__inner { grid-template-columns: 1fr; }
    .hero__image { display: none; }
    .trust__inner { grid-template-columns: 1fr 1fr; }
    .drive-band__inner { flex-direction: column; align-items: flex-start; }
    .drive-band__right { align-items: flex-start; }
    .sell-cta__inner { flex-direction: column; align-items: flex-start; }
    .trade-band__inner { grid-template-columns: 1fr; }
  }

  @media (max-width: 767px) {
    .featured__grid { grid-template-columns: repeat(2, 1fr); }
    .recent__grid { grid-template-columns: repeat(2, 1fr); }
    .categories__grid { grid-template-columns: repeat(3, 1fr); }
    .trust__inner { grid-template-columns: 1fr; }
    .featured__header { flex-direction: column; align-items: flex-start; gap: var(--evx-space-sm); }
    .recent__header { flex-direction: column; align-items: flex-start; gap: var(--evx-space-sm); }
  }
</style>
