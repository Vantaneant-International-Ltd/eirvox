<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import {
    getTradeCategories,
    getTradespeople,
    type Tradesperson,
    type TradeCategory,
  } from '../lib/api';

  export let categorySlug: string;

  let meta: TradeCategory | null = null;
  let all: Tradesperson[] = [];
  let loading = true;
  let notFound = false;

  let selectedCounty = '';
  let sortBy: 'rating' | 'jobs' | 'newest' = 'rating';

  async function load() {
    loading = true;
    notFound = false;
    const cats = await getTradeCategories();
    meta = cats.find(c => c.slug === categorySlug) ?? null;
    if (!meta) {
      notFound = true; loading = false; return;
    }
    all = await getTradespeople({
      category: categorySlug,
      county: selectedCounty || undefined,
      sort: sortBy === 'jobs' ? 'jobs' : sortBy === 'newest' ? 'newest' : 'rating',
    });
    applySeo({
      title: `${meta.name} · TRADE`,
      description: `${meta.description ?? ''} · ${all.length} verified ${meta.name.toLowerCase()} on ÉIRVOX TRADE.`,
      path: `/trade/${categorySlug}`,
    });
    loading = false;
  }

  // Distinct counties from the result set
  $: counties = Array.from(new Set(all.map(t => t.county).filter((c): c is string => !!c))).sort();

  onMount(load);
  $: if (categorySlug) { void load(); }
  // Re-fetch on filter changes
  let first = true;
  $: { selectedCounty; sortBy; if (first) first = false; else void load(); }

  $: filtered = all; // already filtered server-side
</script>

<Nav />

<main id="main-content" class="tc-page">
  <div class="page-container">

    {#if loading && !meta}
      <div class="tc-404"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
    {:else if notFound || !meta}
      <div class="tc-404">
        <span class="evx-label tc-404__label">CATEGORY NOT FOUND</span>
        <h1 class="tc-404__h">No trade category matches that link.</h1>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/trade')}>
          All trades →
        </button>
      </div>
    {:else}

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <button class="breadcrumb__item" on:click={() => navigate('/')}>HOME</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <button class="breadcrumb__item" on:click={() => navigate('/trade')}>TRADE</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <span class="breadcrumb__item breadcrumb__item--current evx-caption">{meta.name}</span>
      </nav>

      <!-- Header -->
      <header class="tc-header">
        <div>
          <span class="evx-caption tc-header__pre">CATEGORY · {filtered.length} VERIFIED</span>
          <h1 class="tc-header__title">{meta.name}.</h1>
          {#if meta.description}<p class="tc-header__desc">{meta.description}</p>{/if}
        </div>
        <div class="tc-header__actions">
          <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/trade')}>
            ← All trades
          </button>
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/trade/apply')}>
            List your trade →
          </button>
        </div>
      </header>

      <!-- Filter bar -->
      <div class="tc-filter">
        <div class="tc-filter__field">
          <label class="evx-caption tc-filter__label" for="cty">COUNTY</label>
          <select id="cty" class="tc-filter__select" bind:value={selectedCounty}>
            <option value="">All Ireland</option>
            {#each counties as c}
              <option value={c}>{c}</option>
            {/each}
          </select>
        </div>
        <div class="tc-filter__field">
          <label class="evx-caption tc-filter__label" for="srt">SORT</label>
          <select id="srt" class="tc-filter__select" bind:value={sortBy}>
            <option value="rating">Rating</option>
            <option value="jobs">Jobs completed</option>
            <option value="newest">Recently joined</option>
          </select>
        </div>
        <span class="evx-caption tc-filter__count">{filtered.length} verified</span>
      </div>

      <!-- Cards -->
      {#if loading}
        <div class="tc-grid">
          {#each Array(4) as _, i (i)}
            <div class="tc-card" style="opacity: 0.5; pointer-events: none;">
              <div class="tc-card__top">
                <div class="tc-card__avatar">·</div>
                <div class="tc-card__id">
                  <h3 class="tc-card__name" style="background: var(--evx-rule-light); height: 16px; width: 50%;"></h3>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else if filtered.length === 0}
        <div class="tc-empty">
          <span class="evx-label" style="color: var(--evx-fox-orange);">COMING SOON</span>
          <h3 style="font-family: var(--evx-font-display); font-size: 22px; font-weight: 500; letter-spacing: -0.01em; margin: var(--evx-space-sm) 0;">
            No verified {meta.name.toLowerCase()} yet.
          </h3>
          <p>Applications are open - first approvals will appear here.</p>
          <div style="margin-top: var(--evx-space-md);">
            <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/trade/apply')}>
              List your trade →
            </button>
          </div>
        </div>
      {:else}
        <div class="tc-grid">
          {#each filtered as t (t.id)}
            <button class="tc-card" on:click={() => navigate(`/trade/${categorySlug}/${t.slug ?? t.id}`)}>
              <div class="tc-card__top">
                <div class="tc-card__avatar">{t.name.charAt(0)}</div>
                <div class="tc-card__id">
                  <div class="tc-card__name-row">
                    <h3 class="tc-card__name">{t.name}</h3>
                    {#if t.tier === 'pro'}
                      <span class="evx-caption tc-card__pro">PRO</span>
                    {/if}
                  </div>
                  {#if t.town || t.county}
                    <span class="evx-caption tc-card__loc">{[t.town, t.county].filter(Boolean).join(', ')}</span>
                  {/if}
                  {#if t.available_now}
                    <span class="evx-caption tc-card__avail">● Available now</span>
                  {/if}
                </div>
              </div>

              {#if t.tagline}<p class="tc-card__tagline">{t.tagline}</p>{/if}

              {#if t.qualifications.length > 0}
                <div class="tc-card__quals">
                  {#each t.qualifications.slice(0, 3) as q}
                    <span class="evx-caption tc-card__qual">{q}</span>
                  {/each}
                  {#if t.qualifications.length > 3}
                    <span class="evx-caption tc-card__qual-more">+{t.qualifications.length - 3} more</span>
                  {/if}
                </div>
              {/if}

              <div class="tc-card__stats">
                {#if typeof t.rating === 'number' && t.rating > 0}
                  <div class="tc-card__stat">
                    <span class="tc-card__stat-val">★ {t.rating.toFixed(2)}</span>
                    <span class="evx-caption tc-card__stat-label">{t.review_count} reviews</span>
                  </div>
                {/if}
                {#if t.years_experience}
                  <div class="tc-card__stat">
                    <span class="tc-card__stat-val">{t.years_experience}y</span>
                    <span class="evx-caption tc-card__stat-label">experience</span>
                  </div>
                {/if}
                <div class="tc-card__stat">
                  <span class="tc-card__stat-val">{t.completed_jobs}</span>
                  <span class="evx-caption tc-card__stat-label">jobs done</span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}

    {/if}

  </div>
</main>

<Footer />

<style>
  .tc-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .tc-404 { padding: var(--evx-space-3xl) 0; display: flex; flex-direction: column; gap: var(--evx-space-md); align-items: flex-start; max-width: 480px; }
  .tc-404__label { color: var(--evx-fox-orange); }
  .tc-404__h { font-family: var(--evx-font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }

  .breadcrumb {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    padding-top: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
  }
  .breadcrumb__item {
    font-family: var(--evx-font-mono);
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none; border: none; padding: 0; cursor: pointer;
    transition: var(--evx-transition);
  }
  .breadcrumb__item:hover { color: var(--evx-warm-black); }
  .breadcrumb__item--current { color: var(--evx-warm-black); cursor: default; }
  .breadcrumb__sep { color: var(--evx-rule-light); }

  .tc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .tc-header__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .tc-header__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    line-height: 1;
    margin-bottom: var(--evx-space-sm);
  }
  .tc-header__desc {
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 480px;
  }
  .tc-header__actions { display: flex; gap: var(--evx-space-sm); flex-shrink: 0; }

  /* Filter bar */
  .tc-filter {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }
  .tc-filter__field { display: flex; flex-direction: column; gap: 2px; }
  .tc-filter__label { color: var(--evx-ink-soft); }
  .tc-filter__select {
    background: transparent;
    border: none;
    padding: 4px 0;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
  }
  .tc-filter__count { color: var(--evx-ink-soft); margin-left: auto; }

  /* Cards */
  .tc-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--evx-space-md);
  }

  .tc-card {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding: var(--evx-space-xl);
    background: none;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
  }
  .tc-card:hover { border-color: var(--evx-warm-black); }

  .tc-card__top { display: flex; gap: var(--evx-space-md); align-items: flex-start; }
  .tc-card__avatar {
    width: 56px; height: 56px;
    background: var(--evx-graphite);
    color: var(--evx-paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 24px;
    flex-shrink: 0;
  }
  .tc-card__id { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
  .tc-card__name-row { display: flex; gap: var(--evx-space-sm); align-items: center; flex-wrap: wrap; }
  .tc-card__name {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }
  .tc-card__pro {
    color: var(--evx-fox-orange);
    border: 1px solid var(--evx-fox-orange);
    padding: 1px 5px;
  }
  .tc-card__loc { color: var(--evx-ink-soft); }
  .tc-card__avail { color: var(--evx-fox-orange); }

  .tc-card__tagline {
    font-size: 14px;
    line-height: 1.6;
    color: var(--evx-warm-black);
  }

  .tc-card__quals { display: flex; flex-wrap: wrap; gap: var(--evx-space-xs); }
  .tc-card__qual {
    border: 1px solid var(--evx-rule-light);
    padding: 3px 7px;
    color: var(--evx-ink-soft);
  }
  .tc-card__qual-more { color: var(--evx-ink-soft); align-self: center; padding-left: 4px; }

  .tc-card__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }
  .tc-card__stat { display: flex; flex-direction: column; gap: 2px; }
  .tc-card__stat-val {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 16px;
    color: var(--evx-warm-black);
  }
  .tc-card__stat-label { color: var(--evx-ink-soft); }

  /* Empty */
  .tc-empty {
    padding: var(--evx-space-3xl) 0;
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
    color: var(--evx-ink-soft);
  }
  .tc-empty span:first-child { color: var(--evx-fox-orange); }

  @media (max-width: 1023px) {
    .tc-grid { grid-template-columns: 1fr; }
    .tc-header { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 767px) {
    .tc-card__stats { grid-template-columns: 1fr; }
    .tc-filter { flex-wrap: wrap; gap: var(--evx-space-md); }
    .tc-filter__count { margin-left: 0; flex-basis: 100%; }
  }
</style>
