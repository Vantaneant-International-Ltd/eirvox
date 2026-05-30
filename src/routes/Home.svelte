<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import LoadingCard from '../components/LoadingCard.svelte';
  import {
    getFeaturedListings,
    getRecentListings,
    getCategories,
    getSiteSettings,
    getTradeCategories,
    formatPrice,
    type ListingWithExtras,
    type Category,
    type TradeCategory,
    type SiteSettings,
  } from '../lib/api';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  let categories: Category[] = [];
  let featured: ListingWithExtras[] = [];
  let recent: ListingWithExtras[] = [];
  let tradeCats: TradeCategory[] = [];
  let settings: SiteSettings | null = null;

  let featLoading = true;
  let recentLoading = true;
  let catsLoading = true;
  let tradeLoading = true;

  onMount(async () => {
    applySeo(seo.home());

    // Settings + categories first (drive hero) — these block initial paint
    [settings, categories, tradeCats] = await Promise.all([
      getSiteSettings(),
      getCategories(),
      getTradeCategories(),
    ]);
    catsLoading = false;
    tradeLoading = false;

    // Listings can lazy-load
    void getFeaturedListings(8).then(rows => { featured = rows; featLoading = false; });
    void getRecentListings(8).then(rows => { recent = rows; recentLoading = false; });
  });

  function driveTagline(s: SiteSettings | null): string {
    if (!s) return 'OPEN FOR RESERVATION';
    return `ISSUE ${String(s.drive.issue_number).padStart(3, '0')} · OPEN FOR RESERVATION`;
  }
</script>

<Nav />

<main>
  <!-- DRIVE HERO ──────────────────────────────────── -->
  <section class="hero page-container">
    <div class="hero__inner">
      <div class="hero__text">
        <span class="evx-caption hero__issue">{driveTagline(settings)}</span>
        <h1 class="hero__title">
          {#if settings}
            {settings.drive.issue_title}
            <em class="hero__italic">·</em>
          {:else}
            Current DRIVE issue
          {/if}
        </h1>
        <p class="hero__desc">
          {settings ? `${settings.drive.total_allocation} pieces. Reservations close on allocation — we do not reprint.`
                    : 'Each issue is one product, made once. Reservation deposit holds your allocation.'}
        </p>
        <div class="hero__price-row">
          <span class="hero__price">{formatPrice(settings?.drive.price_eur ?? 149)}</span>
          {#if settings}
            <span class="hero__deposit evx-caption">· {formatPrice(settings.deposit.amount_eur)} refundable reservation deposit</span>
            <span class="hero__stock">
              <span class="hero__dot"></span>
              <span class="evx-caption">
                {settings.drive.remaining} OF {settings.drive.total_allocation} REMAINING
              </span>
            </span>
          {/if}
        </div>
        <div class="hero__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/drive')}>
            Reserve allocation — {formatPrice(settings?.deposit.amount_eur ?? 49)}
          </button>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/drive')}>
            Read current issue
          </button>
        </div>
      </div>
      <div class="hero__image">
        <span class="evx-caption hero__plate">DRV-{String(settings?.drive.issue_number ?? 0).padStart(3, '0')}</span>
        <div class="hero__img-placeholder">
          <span class="evx-caption hero__img-label">
            {settings?.drive.issue_title ?? 'DRIVE'}
          </span>
        </div>
        <span class="evx-caption hero__img-caption">CURRENT ISSUE</span>
      </div>
    </div>
  </section>

  <!-- CATEGORY GRID ────────────────────────────────── -->
  <section class="categories page-container">
    <div class="categories__header">
      <span class="evx-label">Browse by category</span>
    </div>
    {#if catsLoading}
      <div class="categories__grid">
        {#each Array(7) as _, i (i)}
          <div class="cat-tile cat-tile--skeleton">
            <div class="cat-tile__bg"></div>
            <span class="cat-tile__label cat-tile__label--skel"></span>
            <span class="cat-tile__count cat-tile__count--skel"></span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="categories__grid">
        {#each categories as cat}
          <button class="cat-tile" on:click={() => navigate(`/${cat.slug}`)}>
            <div class="cat-tile__bg"></div>
            <span class="cat-tile__label">{cat.name}</span>
            <span class="evx-caption cat-tile__count">
              {cat.listing_count ?? 0} listing{(cat.listing_count ?? 0) === 1 ? '' : 's'}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  <!-- FEATURED ─────────────────────────────────────── -->
  <section class="featured page-container">
    <div class="featured__header">
      <div>
        <span class="evx-label">Featured this week</span>
        <h2 class="featured__heading">Hand-picked by the house.</h2>
      </div>
    </div>

    {#if featLoading}
      <div class="featured__grid">
        {#each Array(4) as _, i (i)}<LoadingCard />{/each}
      </div>
    {:else if featured.length === 0}
      <div class="empty-state">
        <span class="evx-label empty-state__pre">COMING SOON</span>
        <h3 class="empty-state__h">First featured listings arriving with Cohort 03.</h3>
        <p class="empty-state__sub">
          Until sellers are vetted in, we leave this space intentionally empty.
        </p>
        <div class="empty-state__actions">
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/sell/apply')}>
            Apply to sell →
          </button>
        </div>
      </div>
    {:else}
      <div class="featured__grid">
        {#each featured as listing (listing.id)}
          <ListingCard {listing} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- DRIVE BAND ────────────────────────────────────── -->
  <section class="drive-band">
    <div class="drive-band__inner page-container">
      <div class="drive-band__left">
        <span class="evx-label drive-band__label">
          ISSUE {String(settings?.drive.issue_number ?? 0).padStart(3, '0')}
        </span>
        <div class="drive-band__logo">DRIVE</div>
        <p class="drive-band__desc">{settings?.drive.issue_title ?? '—'}</p>
        <p class="drive-band__copy">
          {settings ? `${settings.drive.total_allocation} pieces. ${settings.drive.remaining} remaining. Reservations close on allocation — we do not reprint.` : ''}
        </p>
      </div>
      <div class="drive-band__right">
        {#if settings}
          <span class="evx-caption drive-band__remaining">
            {settings.drive.remaining} OF {settings.drive.total_allocation} REMAINING
          </span>
        {/if}
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/drive')}>
          Reserve · {formatPrice(settings?.deposit.amount_eur ?? 49)} deposit
        </button>
        <button class="evx-btn evx-btn--ghost-paper drive-band__archive" on:click={() => navigate('/drive')}>
          All DRIVE issues →
        </button>
      </div>
    </div>
  </section>

  <!-- RECENTLY LISTED ──────────────────────────────── -->
  <section class="recent page-container">
    <div class="recent__header">
      <div>
        <span class="evx-label">Recently listed</span>
        <h2 class="recent__heading">Latest on the marketplace.</h2>
      </div>
      <span class="evx-caption recent__sort">Sort: newest first →</span>
    </div>

    {#if recentLoading}
      <div class="recent__grid">
        {#each Array(4) as _, i (i)}<LoadingCard />{/each}
      </div>
    {:else if recent.length === 0}
      <div class="empty-state">
        <span class="evx-label empty-state__pre">COMING SOON</span>
        <h3 class="empty-state__h">No listings yet — Cohort 03 closes 14 June.</h3>
        <p class="empty-state__sub">
          Approved sellers will appear here as soon as their first listings go live.
        </p>
      </div>
    {:else}
      <div class="recent__grid">
        {#each recent as listing (listing.id)}
          <ListingCard {listing} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- TRUST STRIP ──────────────────────────────────── -->
  <section class="trust page-container">
    <div class="trust__inner">
      <div class="trust__item">
        <span class="evx-label trust__num">01</span>
        <h3 class="trust__title">{formatPrice(settings?.deposit.amount_eur ?? 49)} refundable reservation deposits.</h3>
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
        {#if tradeLoading}
          {#each Array(4) as _, i (i)}
            <div class="trade-band__cat trade-band__cat--skel">
              <span class="trade-band__cat-label" style="opacity: 0.2;">··················</span>
            </div>
          {/each}
        {:else}
          {#each tradeCats.slice(0, 4) as c}
            <button class="trade-band__cat" on:click={() => navigate(`/trade/${c.slug}`)}>
              <span class="trade-band__cat-label">{c.name}</span>
              <span class="evx-caption trade-band__cat-arrow">{c.count ?? 0} →</span>
            </button>
          {/each}
        {/if}
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
  .hero { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }
  .hero__inner { display: grid; grid-template-columns: 1fr 420px; gap: var(--evx-space-3xl); align-items: center; }
  .hero__issue { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-lg); }
  .hero__title { font-family: var(--evx-font-display); font-weight: 500; font-size: clamp(32px, 4vw, 56px); line-height: 1.08; letter-spacing: -0.02em; margin-bottom: var(--evx-space-lg); color: var(--evx-warm-black); }
  .hero__italic { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; }
  .hero__desc { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 480px; margin-bottom: var(--evx-space-xl); }
  .hero__price-row { display: flex; align-items: baseline; gap: var(--evx-space-md); margin-bottom: var(--evx-space-xl); flex-wrap: wrap; }
  .hero__price { font-family: var(--evx-font-display); font-weight: 500; font-size: 32px; letter-spacing: -0.015em; }
  .hero__deposit { color: var(--evx-ink-soft); }
  .hero__stock { display: flex; align-items: center; gap: 6px; }
  .hero__dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--evx-fox-orange); }
  .hero__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }
  .hero__image { position: relative; aspect-ratio: 5 / 6; background: var(--evx-graphite); display: flex; align-items: center; justify-content: center; }
  .hero__plate { position: absolute; top: var(--evx-space-md); right: var(--evx-space-md); color: var(--evx-fox-orange); }
  .hero__img-placeholder { display: flex; align-items: center; justify-content: center; text-align: center; padding: 0 var(--evx-space-xl); }
  .hero__img-label { color: rgba(245, 242, 237, 0.30); line-height: 1.8; }
  .hero__img-caption { position: absolute; bottom: var(--evx-space-md); left: var(--evx-space-md); color: rgba(245, 242, 237, 0.35); }

  /* CATEGORIES */
  .categories { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }
  .categories__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--evx-space-xl); }
  .categories__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--evx-space-md); }
  .cat-tile { display: flex; flex-direction: column; gap: var(--evx-space-sm); background: none; border: none; cursor: pointer; text-align: left; transition: var(--evx-transition); padding: 0; }
  .cat-tile:hover { opacity: 0.78; }
  .cat-tile__bg { aspect-ratio: 1; background: var(--evx-graphite); }
  .cat-tile__label { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); display: block; }
  .cat-tile__count { color: var(--evx-ink-soft); display: block; }
  .cat-tile--skeleton { pointer-events: none; }
  .cat-tile--skeleton .cat-tile__bg { background: var(--evx-graphite); opacity: 0.5; }
  .cat-tile__label--skel { display: inline-block; height: 14px; width: 60%; background: var(--evx-rule-light); }
  .cat-tile__count--skel { display: inline-block; height: 10px; width: 40%; background: var(--evx-rule-light); }

  /* FEATURED */
  .featured { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }
  .featured__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--evx-space-xl); }
  .featured__heading { font-family: var(--evx-font-display); font-weight: 500; font-size: 28px; letter-spacing: -0.015em; margin-top: var(--evx-space-sm); color: var(--evx-warm-black); }
  .featured__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-xl); }

  /* Empty state (intentional, premium) */
  .empty-state {
    padding: var(--evx-space-2xl) var(--evx-space-xl);
    border: 1px solid var(--evx-rule-light);
    background: var(--evx-paper);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    max-width: 720px;
  }
  .empty-state__pre { color: var(--evx-fox-orange); }
  .empty-state__h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }
  .empty-state__sub { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }
  .empty-state__actions { margin-top: var(--evx-space-md); }

  /* DRIVE BAND */
  .drive-band { background: var(--evx-graphite); color: var(--evx-paper); padding: var(--evx-space-2xl) 0; }
  .drive-band__inner { display: flex; justify-content: space-between; align-items: center; gap: var(--evx-space-3xl); }
  .drive-band__left { max-width: 560px; }
  .drive-band__label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .drive-band__logo { font-family: var(--evx-font-display); font-weight: 500; font-size: 48px; letter-spacing: -0.03em; line-height: 1; color: var(--evx-paper); margin-bottom: var(--evx-space-md); }
  .drive-band__desc { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.06em; color: var(--evx-ink-soft); text-transform: uppercase; margin-bottom: var(--evx-space-md); }
  .drive-band__copy { font-size: 15px; line-height: 1.65; color: rgba(245, 242, 237, 0.75); }
  .drive-band__right { display: flex; flex-direction: column; align-items: flex-end; gap: var(--evx-space-md); flex-shrink: 0; }
  .drive-band__remaining { color: var(--evx-fox-orange); }
  .drive-band__archive { font-size: 12px; border-color: transparent; color: var(--evx-ink-soft); padding: 0; }

  /* RECENTLY LISTED */
  .recent { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }
  .recent__header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--evx-space-xl); }
  .recent__heading { font-family: var(--evx-font-display); font-weight: 500; font-size: 28px; letter-spacing: -0.015em; margin-top: var(--evx-space-sm); color: var(--evx-warm-black); }
  .recent__sort { color: var(--evx-ink-soft); white-space: nowrap; }
  .recent__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-xl); }

  /* TRUST STRIP */
  .trust { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }
  .trust__inner { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--evx-space-3xl); }
  .trust__item { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .trust__num { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-sm); }
  .trust__title { font-family: var(--evx-font-display); font-size: 17px; font-weight: 500; line-height: 1.3; letter-spacing: -0.01em; color: var(--evx-warm-black); }
  .trust__desc { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }

  /* TRADE BAND */
  .trade-band { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); border-bottom: 1px solid var(--evx-rule-light); }
  .trade-band__inner { display: grid; grid-template-columns: 1fr 1fr; gap: var(--evx-space-3xl); align-items: center; }
  .trade-band__left { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .trade-band__pre { color: var(--evx-fox-orange); }
  .trade-band__h { font-family: var(--evx-font-display); font-size: clamp(24px, 3vw, 36px); font-weight: 500; letter-spacing: -0.015em; color: var(--evx-warm-black); line-height: 1.15; }
  .trade-band__sub { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 480px; }
  .trade-band__actions { display: flex; gap: var(--evx-space-sm); flex-wrap: wrap; margin-top: var(--evx-space-sm); }
  .trade-band__cats { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--evx-rule-light); }
  .trade-band__cat { display: flex; justify-content: space-between; align-items: center; padding: var(--evx-space-md) var(--evx-space-lg); background: none; border: none; border-right: 1px solid var(--evx-rule-light); border-bottom: 1px solid var(--evx-rule-light); cursor: pointer; transition: background 200ms ease; }
  .trade-band__cat:hover { background: rgba(0,0,0,0.02); }
  .trade-band__cat:nth-child(2n) { border-right: none; }
  .trade-band__cat:nth-last-child(-n+2) { border-bottom: none; }
  .trade-band__cat-label { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .trade-band__cat-arrow { color: var(--evx-ink-soft); }
  .trade-band__cat--skel { pointer-events: none; opacity: 0.4; }

  /* SELL CTA */
  .sell-cta { padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-2xl); }
  .sell-cta__inner { display: flex; justify-content: space-between; align-items: center; gap: var(--evx-space-3xl); }
  .sell-cta__heading { font-family: var(--evx-font-display); font-size: 36px; font-weight: 500; letter-spacing: -0.02em; color: var(--evx-warm-black); margin-bottom: var(--evx-space-sm); }
  .sell-cta__sub { font-size: 15px; color: var(--evx-ink-soft); line-height: 1.65; max-width: 440px; }
  .sell-cta__actions { display: flex; gap: var(--evx-space-md); flex-shrink: 0; }

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
