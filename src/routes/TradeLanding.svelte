<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { getTradeCategories, getTradespeople, type TradeCategory, type Tradesperson } from '../lib/api';

  let categories: TradeCategory[] = [];
  let featured: Tradesperson[] = [];
  let loading = true;

  $: totalCount = categories.reduce((sum, c) => sum + (c.count ?? 0), 0);

  let searchQ = '';
  let countyFilter = '';

  onMount(async () => {
    applySeo({
      title: 'TRADE · Verified tradespeople',
      description: "Ireland's verified independent tradespeople. ID-checked, credential-verified, admitted by application. Flat monthly fee, no per-lead charges.",
      path: '/trade',
    });

    [categories, featured] = await Promise.all([
      getTradeCategories(),
      getTradespeople({ sort: 'rating', limit: 6 }),
    ]);
    loading = false;
  });
</script>

<Nav />

<main id="main-content" class="trade-page">
  <div class="page-container">

    <!-- Hero -->
    <header class="trade-hero">
      <span class="evx-caption trade-hero__pre">
        DIRECTORY · ÉIRVOX TRADE{loading ? '' : ` · ${totalCount} VERIFIED`}
      </span>
      <h1 class="trade-hero__title">TRADE.</h1>
      <p class="trade-hero__sub">
        Ireland's verified independent tradespeople. Every person listed is
        <strong>ID-checked, credential-verified, and admitted by application</strong>.
        Flat monthly fee - no per-lead charges, no commission, no race to the bottom.
      </p>

      <div class="trade-hero__actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/trade/electricians')}>
          Browse trades →
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/trade/apply')}>
          List your trade
        </button>
      </div>
    </header>

    <!-- Trust strip -->
    <section class="trade-trust">
      <div class="trade-trust__item">
        <span class="evx-label trade-trust__num">01</span>
        <h3 class="trade-trust__title">ID &amp; credential verified.</h3>
        <p class="trade-trust__desc">
          Government ID, trade qualifications, and a short video call before anyone is listed.
        </p>
      </div>
      <div class="trade-trust__item">
        <span class="evx-label trade-trust__num">02</span>
        <h3 class="trade-trust__title">Flat monthly fee.</h3>
        <p class="trade-trust__desc">
          €9 or €29 a month. No charge per lead, no commission on work won.
        </p>
      </div>
      <div class="trade-trust__item">
        <span class="evx-label trade-trust__num">03</span>
        <h3 class="trade-trust__title">Rated by real customers.</h3>
        <p class="trade-trust__desc">
          Reviews come from real, verified jobs. No paid-for ratings. No fake profiles.
        </p>
      </div>
    </section>

    <!-- Search bar -->
    <section class="trade-search">
      <div class="trade-search__inner">
        <div class="trade-search__field">
          <label class="evx-caption trade-search__label" for="trade-cat">CATEGORY</label>
          <select
            id="trade-cat"
            class="trade-search__select"
            bind:value={searchQ}
            on:change={() => searchQ && navigate(`/trade/${searchQ}`)}
          >
            <option value="">All trades</option>
            {#each categories as cat}
              <option value={cat.slug}>{cat.name}</option>
            {/each}
          </select>
        </div>
        <div class="trade-search__field">
          <label class="evx-caption trade-search__label" for="trade-county">COUNTY</label>
          <input
            id="trade-county"
            type="text"
            class="trade-search__input"
            placeholder="Any county"
            bind:value={countyFilter}
          />
        </div>
        <button
          class="evx-btn evx-btn--primary trade-search__btn"
          on:click={() => searchQ && navigate(`/trade/${searchQ}`)}
        >
          Search →
        </button>
      </div>
    </section>

    <!-- Categories grid -->
    <section class="trade-cats">
      <div class="trade-cats__head">
        <span class="evx-label">Browse by trade</span>
        <span class="evx-caption trade-cats__total">{categories.length} categories</span>
      </div>
      <div class="trade-cats__grid">
        {#each categories as cat}
          <button
            class="trade-cat"
            class:trade-cat--empty={(cat.count ?? 0) === 0}
            on:click={() => (cat.count ?? 0) > 0 && navigate(`/trade/${cat.slug}`)}
            disabled={(cat.count ?? 0) === 0}
          >
            <div class="trade-cat__body">
              <span class="trade-cat__name">{cat.name}</span>
              <span class="evx-caption trade-cat__desc">{cat.description ?? ''}</span>
            </div>
            <span class="evx-caption trade-cat__count">
              {(cat.count ?? 0) > 0 ? `${cat.count} verified` : 'Coming soon'}
            </span>
          </button>
        {/each}
      </div>
    </section>

    <!-- Featured Pros -->
    <section class="trade-featured">
      <div class="trade-featured__head">
        <div>
          <span class="evx-label">Featured Pros</span>
          <h2 class="trade-featured__h">Top-rated, recently active.</h2>
        </div>
        <button class="evx-caption trade-featured__all" on:click={() => navigate('/trade/electricians')}>
          Browse all →
        </button>
      </div>
      {#if loading}
        <div class="trade-featured__grid">
          {#each Array(6) as _, i (i)}
            <div class="t-card" style="opacity: 0.5; pointer-events: none;">
              <div class="t-card__avatar">·</div>
              <div class="t-card__body">
                <span class="t-card__pro evx-caption">PRO</span>
                <h3 class="t-card__name" style="background: var(--evx-rule-light); height: 16px; width: 60%;"></h3>
                <p class="t-card__tagline" style="background: var(--evx-rule-light); height: 12px; width: 90%; margin-top: 8px;"></p>
              </div>
            </div>
          {/each}
        </div>
      {:else if featured.length === 0}
        <div style="padding: var(--evx-space-2xl); border: 1px dashed var(--evx-rule-light); text-align: center; color: var(--evx-ink-soft);">
          <p>No verified Pros yet - they'll appear here as soon as the first tradespeople are admitted.</p>
        </div>
      {:else}
        <div class="trade-featured__grid">
          {#each featured as t (t.id)}
            <button class="t-card" on:click={() => navigate(`/trade/${t.trade}/${t.slug ?? t.id}`)}>
              <div class="t-card__avatar">{t.name.charAt(0)}</div>
              <div class="t-card__body">
                {#if t.tier === 'pro'}<span class="t-card__pro evx-caption">PRO</span>{/if}
                <h3 class="t-card__name">{t.name}</h3>
                <span class="evx-caption t-card__trade">
                  {categories.find(c => c.slug === t.trade)?.name ?? t.trade}{t.county ? ` · ${t.county}` : ''}
                </span>
                {#if t.tagline}<p class="t-card__tagline">{t.tagline}</p>{/if}
                <div class="t-card__stats">
                  {#if typeof t.rating === 'number' && t.rating > 0}
                    <span class="t-card__stat">★ {t.rating.toFixed(2)} <em>({t.review_count})</em></span>
                  {/if}
                  {#if t.years_experience}<span class="t-card__stat">{t.years_experience}y exp</span>{/if}
                  {#if t.available_now}<span class="t-card__avail">● Available</span>{/if}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>

    <!-- How it works -->
    <section class="trade-how">
      <div class="trade-how__inner">
        <div class="trade-how__left">
          <span class="evx-label trade-how__pre">FOR CUSTOMERS</span>
          <h2 class="trade-how__h">How it works.</h2>
          <p class="trade-how__sub">
            Three steps. No bidding wars. No spam. Just verified people who do the work.
          </p>
        </div>
        <ol class="trade-how__steps">
          <li class="trade-how__step">
            <span class="evx-label trade-how__num">01</span>
            <div>
              <strong>Browse by trade.</strong>
              <span>15 categories, filtered by county and availability.</span>
            </div>
          </li>
          <li class="trade-how__step">
            <span class="evx-label trade-how__num">02</span>
            <div>
              <strong>Contact directly.</strong>
              <span>Quote request form for Pros, masked phone for Listed.</span>
            </div>
          </li>
          <li class="trade-how__step">
            <span class="evx-label trade-how__num">03</span>
            <div>
              <strong>Review afterwards.</strong>
              <span>Real reviews from real jobs build the rating that matters.</span>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- List your trade CTA -->
    <section class="trade-sell">
      <div class="trade-sell__inner">
        <div class="trade-sell__head">
          <span class="evx-label trade-sell__pre">FOR TRADESPEOPLE</span>
          <h2 class="trade-sell__h">List your trade.</h2>
          <p class="trade-sell__sub">
            Flat monthly fee. No commission. No per-lead charges. Verified directory, not a bidding pit.
          </p>
        </div>

        <div class="trade-tiers">
          <div class="trade-tier">
            <span class="evx-caption trade-tier__num">LISTED</span>
            <h3 class="trade-tier__name">€9 <em>per month</em></h3>
            <ul class="trade-tier__list">
              <li>+ Profile page with verification badge</li>
              <li>+ Up to 4 work photos</li>
              <li>+ One county coverage area</li>
              <li>+ Customer reviews</li>
              <li>+ Masked phone contact</li>
            </ul>
          </div>
          <div class="trade-tier trade-tier--dark">
            <span class="trade-tier__rec evx-caption">RECOMMENDED</span>
            <span class="evx-caption trade-tier__num trade-tier__num--light">PRO</span>
            <h3 class="trade-tier__name trade-tier__name--light">€29 <em>per month</em></h3>
            <ul class="trade-tier__list trade-tier__list--light">
              <li>+ Everything in Listed</li>
              <li>+ Up to 12 work photos</li>
              <li>+ Unlimited county coverage</li>
              <li>+ Featured in category</li>
              <li>+ Quote request form</li>
              <li>+ Priority in search</li>
            </ul>
          </div>
        </div>

        <div class="trade-sell__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/trade/apply')}>
            Apply to list →
          </button>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/terms')}>
            Read TRADE terms
          </button>
        </div>
      </div>
    </section>

  </div>
</main>

<Footer />

<style>
  .trade-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Hero */
  .trade-hero {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }
  .trade-hero__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-lg); }
  .trade-hero__title {
    font-family: var(--evx-font-display);
    font-size: clamp(72px, 12vw, 140px);
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 0.9;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-xl);
  }
  .trade-hero__sub {
    font-size: 17px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 640px;
    margin-bottom: var(--evx-space-xl);
  }
  .trade-hero__sub strong { color: var(--evx-warm-black); font-weight: 500; }
  .trade-hero__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }

  /* Trust strip */
  .trade-trust {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    margin-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .trade-trust__item { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .trade-trust__num { color: var(--evx-fox-orange); }
  .trade-trust__title {
    font-family: var(--evx-font-display);
    font-size: 17px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }
  .trade-trust__desc { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  /* Search */
  .trade-search {
    background: rgba(0,0,0,0.02);
    padding: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }
  .trade-search__inner {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: var(--evx-space-lg);
    align-items: end;
  }
  .trade-search__field { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .trade-search__label { color: var(--evx-ink-soft); }
  .trade-search__select,
  .trade-search__input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-warm-black);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-warm-black);
    outline: none;
  }
  .trade-search__select { cursor: pointer; -webkit-appearance: none; }
  .trade-search__input::placeholder { color: var(--evx-ink-soft); }
  .trade-search__btn { white-space: nowrap; }

  /* Categories grid */
  .trade-cats { margin-bottom: var(--evx-space-2xl); }
  .trade-cats__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--evx-space-md);
  }
  .trade-cats__head span { color: var(--evx-ink-soft); }
  .trade-cats__total { color: var(--evx-ink-soft); }

  .trade-cats__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border: 1px solid var(--evx-rule-light);
  }
  .trade-cat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md) var(--evx-space-lg);
    background: none;
    border: none;
    border-right: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: background 200ms ease;
  }
  .trade-cat:hover:not(:disabled) { background: rgba(0,0,0,0.02); }
  .trade-cat:nth-child(3n) { border-right: none; }
  .trade-cat:nth-last-child(-n+3) { border-bottom: none; }
  .trade-cat--empty { opacity: 0.50; cursor: not-allowed; }

  .trade-cat__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .trade-cat__name {
    font-family: var(--evx-font-display);
    font-size: 15px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .trade-cat__desc { color: var(--evx-ink-soft); line-height: 1.5; }
  .trade-cat__count {
    color: var(--evx-fox-orange);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .trade-cat--empty .trade-cat__count { color: var(--evx-ink-soft); }

  /* Featured */
  .trade-featured { margin-bottom: var(--evx-space-2xl); }
  .trade-featured__head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: var(--evx-space-xl);
  }
  .trade-featured__h {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-top: var(--evx-space-sm);
  }
  .trade-featured__all {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    transition: var(--evx-transition);
  }
  .trade-featured__all:hover { color: var(--evx-warm-black); }

  .trade-featured__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
  }

  .t-card {
    display: flex;
    gap: var(--evx-space-md);
    padding: var(--evx-space-lg);
    background: none;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
    align-items: flex-start;
  }
  .t-card:hover { border-color: var(--evx-warm-black); }

  .t-card__avatar {
    width: 44px; height: 44px;
    background: var(--evx-graphite);
    color: var(--evx-paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    flex-shrink: 0;
  }

  .t-card__body { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }

  .t-card__pro {
    color: var(--evx-fox-orange);
    border: 1px solid var(--evx-fox-orange);
    padding: 1px 5px;
    align-self: flex-start;
    margin-bottom: var(--evx-space-xs);
  }
  .t-card__name {
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .t-card__trade { color: var(--evx-ink-soft); }
  .t-card__tagline {
    font-size: 13px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
    margin: var(--evx-space-xs) 0;
  }
  .t-card__stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--evx-space-md);
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
    font-family: var(--evx-font-mono);
    font-size: 11px;
  }
  .t-card__stat { color: var(--evx-warm-black); }
  .t-card__stat em { font-style: normal; color: var(--evx-ink-soft); }
  .t-card__avail { color: var(--evx-fox-orange); }

  /* How it works */
  .trade-how {
    padding: var(--evx-space-2xl) 0;
    margin-bottom: var(--evx-space-2xl);
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .trade-how__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
  }
  .trade-how__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }
  .trade-how__h {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: var(--evx-space-md);
  }
  .trade-how__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  .trade-how__steps { display: flex; flex-direction: column; gap: 0; }
  .trade-how__step {
    display: flex;
    gap: var(--evx-space-lg);
    align-items: flex-start;
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px;
    line-height: 1.7;
  }
  .trade-how__step:last-child { border-bottom: none; }
  .trade-how__step strong { color: var(--evx-warm-black); font-weight: 500; display: block; margin-bottom: 2px; }
  .trade-how__step span { color: var(--evx-ink-soft); }
  .trade-how__num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }

  /* List your trade */
  .trade-sell { margin-bottom: var(--evx-space-2xl); }

  .trade-sell__head { max-width: 640px; margin-bottom: var(--evx-space-2xl); }
  .trade-sell__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-sm); }
  .trade-sell__h {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: var(--evx-space-md);
  }
  .trade-sell__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  .trade-tiers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-xl);
  }
  .trade-tier {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl);
    position: relative;
  }
  .trade-tier--dark { background: var(--evx-warm-black); color: var(--evx-paper); border-color: var(--evx-warm-black); }
  .trade-tier__rec {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 8px;
  }
  .trade-tier__num { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .trade-tier__num--light { color: rgba(245,242,237,0.6); }
  .trade-tier__name {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }
  .trade-tier__name em { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; font-size: 16px; color: var(--evx-ink-soft); }
  .trade-tier__name--light { color: var(--evx-paper); }
  .trade-tier__name--light em { color: rgba(245,242,237,0.6); }
  .trade-tier__list {
    display: flex; flex-direction: column;
    gap: var(--evx-space-sm);
    font-size: 14px; line-height: 1.5;
    color: var(--evx-warm-black);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
  }
  .trade-tier__list--light { color: var(--evx-paper); border-color: var(--evx-rule-dark); }

  .trade-sell__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }

  @media (max-width: 1023px) {
    .trade-trust { grid-template-columns: 1fr; gap: var(--evx-space-lg); }
    .trade-search__inner { grid-template-columns: 1fr; }
    .trade-cats__grid { grid-template-columns: 1fr 1fr; }
    .trade-cat:nth-child(3n) { border-right: 1px solid var(--evx-rule-light); }
    .trade-cat:nth-child(2n) { border-right: none; }
    .trade-cat:nth-last-child(-n+3) { border-bottom: 1px solid var(--evx-rule-light); }
    .trade-cat:nth-last-child(-n+2) { border-bottom: none; }
    .trade-featured__grid { grid-template-columns: 1fr 1fr; }
    .trade-how__inner { grid-template-columns: 1fr; }
    .trade-tiers { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .trade-cats__grid { grid-template-columns: 1fr; }
    .trade-cat { border-right: none !important; }
    .trade-featured__grid { grid-template-columns: 1fr; }
  }
</style>
