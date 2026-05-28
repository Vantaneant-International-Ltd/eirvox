<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import SellerPill from '../lib/SellerPill.svelte';
  import {
    getListingsByCategory,
    getCategoryMeta,
    formatPrice,
    type Category,
    type Listing,
    type Condition,
  } from '../data/listings';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  export let category: string;

  $: if (typeof document !== 'undefined' && category && meta) {
    applySeo(seo.category(category, meta.label, allListings.length));
  }

  $: cat = category as Category;
  $: meta = getCategoryMeta(cat);
  $: allListings = getListingsByCategory(cat);

  // Filter state
  let selectedCondition: Condition | '' = '';
  let maxPrice = 0;
  let sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'newest' = 'relevance';
  let mobileFiltersOpen = false;

  $: activeFilterCount = (selectedCondition ? 1 : 0) + (maxPrice ? 1 : 0);

  $: filtered = allListings
    .filter(l => !selectedCondition || l.condition === selectedCondition)
    .filter(l => !maxPrice || l.price <= maxPrice)
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return 0;
    });

  const PAGE_SIZE = 15;
  let page = 1;
  $: paginated = filtered.slice(0, page * PAGE_SIZE);
  $: hasMore = filtered.length > page * PAGE_SIZE;

  function reset() {
    selectedCondition = '';
    maxPrice = 0;
    sortBy = 'relevance';
    page = 1;
  }

  const conditions: Condition[] = ['OEM+ New', 'Refinished', 'Used — Excellent', 'Used — Good', 'Mint'];

  const categoryLabels: Record<Category, string> = {
    automotive: 'Automotive',
    watches: 'Watches',
    fashion: 'Fashion',
    tech: 'Tech',
    'home-design': 'Home & Design',
    'audio-vinyl': 'Audio & Vinyl',
    art: 'Art',
  };
</script>

<Nav />

<main id="main-content" class="category">
  <div class="page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <button class="breadcrumb__item" on:click={() => navigate('/')}>HOME</button>
      <span class="breadcrumb__sep evx-caption">/</span>
      <span class="breadcrumb__item breadcrumb__item--current evx-caption">{categoryLabels[cat] ?? cat}</span>
    </nav>

    <!-- Header -->
    <header class="cat-header">
      <div class="cat-header__left">
        <span class="evx-caption cat-header__meta">
          CATEGORY · {allListings.length} LISTINGS · UPDATED 4 MINUTES AGO
        </span>
        <h1 class="cat-header__title">{categoryLabels[cat] ?? cat}.</h1>
        {#if meta}
          <p class="cat-header__desc">{meta.description}</p>
        {/if}
      </div>
      <div class="cat-header__actions">
        <button class="evx-btn evx-btn--ghost evx-btn--sm">Save this search</button>
        <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/sell')}>
          Sell {categoryLabels[cat]} →
        </button>
      </div>
    </header>

    <!-- Subcategory tabs -->
    {#if meta?.subcategories}
      <div class="subcat-tabs" role="tablist">
        <button class="subcat-tab subcat-tab--active" role="tab">ALL · {allListings.length}</button>
        {#each meta.subcategories as sub}
          {@const count = allListings.filter(l => l.subcategory === sub).length}
          {#if count > 0}
            <button class="subcat-tab" role="tab">{sub.toUpperCase()} · {count}</button>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Body -->
    <div class="cat-body">
      <!-- Filter sidebar / mobile drawer -->
      {#if mobileFiltersOpen}
        <div
          class="sidebar-backdrop"
          on:click={() => mobileFiltersOpen = false}
          on:keydown={(e) => e.key === 'Escape' && (mobileFiltersOpen = false)}
          role="button"
          tabindex="-1"
          aria-label="Close filters"
        ></div>
      {/if}
      <aside class="sidebar" class:sidebar--open={mobileFiltersOpen} aria-label="Filters">
        <div class="sidebar__header">
          <span class="evx-label">Filters</span>
          <div class="sidebar__head-right">
            <button class="evx-caption sidebar__reset" on:click={reset}>Reset</button>
            <button
              class="sidebar__close"
              on:click={() => mobileFiltersOpen = false}
              aria-label="Close filters"
            >×</button>
          </div>
        </div>

        <!-- Condition -->
        <div class="filter-group">
          <span class="evx-label filter-group__title">Condition</span>
          <ul class="filter-list">
            {#each conditions as cond}
              {@const count = allListings.filter(l => l.condition === cond).length}
              {#if count > 0}
                <li>
                  <button
                    class="filter-item"
                    class:filter-item--active={selectedCondition === cond}
                    on:click={() => { selectedCondition = selectedCondition === cond ? '' : cond; page = 1; }}
                  >
                    <span class="filter-item__label">{cond}</span>
                    <span class="evx-caption filter-item__count">{count}</span>
                  </button>
                </li>
              {/if}
            {/each}
          </ul>
        </div>

        <!-- Price -->
        <div class="filter-group">
          <span class="evx-label filter-group__title">Price</span>
          <div class="filter-price">
            <label class="evx-caption filter-price__label" for="max-price">Max price</label>
            <input
              id="max-price"
              type="number"
              class="filter-price__input evx-caption"
              placeholder="Any"
              bind:value={maxPrice}
              on:change={() => { page = 1; }}
            />
          </div>
        </div>

        <!-- Location note -->
        <div class="filter-note evx-caption">
          All listings ship across Ireland and Northern Ireland unless noted.
        </div>

        <!-- Apply (drawer footer, mobile only) -->
        <button class="evx-btn evx-btn--primary sidebar__apply" on:click={() => mobileFiltersOpen = false}>
          Show {filtered.length} listings
        </button>
      </aside>

      <!-- Main grid -->
      <div class="cat-main">
        <!-- Sort + active filter bar -->
        <div class="sort-bar">
          <button
            class="sort-bar__filters-toggle evx-caption"
            on:click={() => mobileFiltersOpen = true}
            aria-label="Open filters"
          >
            ☰ FILTERS{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>
          <span class="evx-caption sort-bar__count">
            {filtered.length} of {allListings.length}
            {#if selectedCondition}<span class="sort-bar__chip">{selectedCondition} ✕</span>{/if}
          </span>
          <div class="sort-bar__right">
            <span class="evx-caption sort-bar__label">SORT</span>
            <select class="sort-bar__select evx-caption" bind:value={sortBy} aria-label="Sort listings">
              <option value="relevance">Relevance</option>
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        {#if paginated.length > 0}
          <div class="listing-grid">
            {#each paginated as listing}
              <ListingCard {listing} />
            {/each}
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <span class="evx-caption">SHOWING 1–{paginated.length} OF {filtered.length}</span>
            {#if hasMore}
              <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => page++}>
                Load more
              </button>
            {/if}
          </div>
        {:else}
          <div class="cat-empty">
            <p class="evx-caption">No listings match these filters.</p>
            <button class="evx-caption cat-empty__reset" on:click={reset}>Clear filters →</button>
          </div>
        {/if}

        <!-- SEO block -->
        <div class="seo-block">
          <p class="seo-block__text evx-caption">
            {#if cat === 'automotive'}
              ÉIRVOX automotive is Ireland's premium marketplace for OEM+ parts, performance modifications and full enthusiast builds.
              Every listing is posted by a phone-and-ID-verified seller.
              Atelier and Verified sellers are admitted in cohorts to keep listing quality high.
              Fees start at 5%.
            {:else if cat === 'watches'}
              ÉIRVOX watches — authenticated Swiss and Japanese timepieces from verified Irish sellers.
              Authentication available on all pieces above €500.
              Full set listings prioritised.
            {:else}
              ÉIRVOX is Ireland's premium marketplace for enthusiast objects across {categoryLabels[cat]}.
              All sellers are verified by application. Deposits are refundable.
            {/if}
          </p>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />

<style>
  .category { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    padding-top: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
  }

  .breadcrumb__item {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .breadcrumb__item:hover { color: var(--evx-warm-black); }
  .breadcrumb__item--current { color: var(--evx-warm-black); cursor: default; }
  .breadcrumb__sep { color: var(--evx-rule-light); }

  /* Header */
  .cat-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .cat-header__meta { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }

  .cat-header__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(36px, 5vw, 64px);
    line-height: 1;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
  }

  .cat-header__desc {
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 480px;
    margin-top: var(--evx-space-md);
  }

  .cat-header__actions { display: flex; gap: var(--evx-space-md); flex-shrink: 0; }

  /* Subcategory tabs */
  .subcat-tabs {
    display: flex;
    gap: 0;
    overflow-x: auto;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
    scrollbar-width: none;
  }

  .subcat-tabs::-webkit-scrollbar { display: none; }

  .subcat-tab {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.07em;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: var(--evx-space-sm) var(--evx-space-lg);
    cursor: pointer;
    white-space: nowrap;
    transition: all 200ms ease;
    margin-bottom: -1px;
  }

  .subcat-tab:hover { color: var(--evx-warm-black); }
  .subcat-tab--active { color: var(--evx-warm-black); border-bottom-color: var(--evx-warm-black); }

  /* Body layout */
  .cat-body {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  /* Sidebar */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
    position: sticky;
    top: 80px;
  }

  .sidebar__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .sidebar__reset {
    background: none;
    border: none;
    color: var(--evx-fox-orange);
    cursor: pointer;
    transition: var(--evx-transition);
    padding: 0;
  }

  .sidebar__reset:hover { opacity: 0.70; }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .filter-group__title { color: var(--evx-ink-soft); }

  .filter-list { display: flex; flex-direction: column; gap: var(--evx-space-xs); }

  .filter-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    padding: var(--evx-space-xs) 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .filter-item:hover { opacity: 0.70; }

  .filter-item--active .filter-item__label { color: var(--evx-fox-orange); }

  .filter-item__label { font-size: 13px; color: var(--evx-warm-black); }
  .filter-item__count { color: var(--evx-ink-soft); }

  .filter-price { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .filter-price__label { color: var(--evx-ink-soft); }

  .filter-price__input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xs) 0;
    outline: none;
    color: var(--evx-warm-black);
    width: 100%;
  }

  .filter-note { color: var(--evx-ink-soft); line-height: 1.6; }

  /* Main */
  .sort-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }

  .sort-bar__count { color: var(--evx-ink-soft); }

  .sort-bar__chip {
    display: inline-block;
    border: 1px solid var(--evx-rule-light);
    padding: 2px 8px;
    margin-left: var(--evx-space-sm);
    cursor: pointer;
  }

  .sort-bar__right { display: flex; align-items: center; gap: var(--evx-space-sm); }
  .sort-bar__label { color: var(--evx-ink-soft); }

  .sort-bar__select {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: 2px 0;
    outline: none;
    color: var(--evx-warm-black);
    cursor: pointer;
  }

  .listing-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-xl);
    margin-bottom: var(--evx-space-2xl);
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .cat-empty {
    padding: var(--evx-space-3xl) 0;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    color: var(--evx-ink-soft);
  }

  .cat-empty__reset {
    background: none;
    border: none;
    color: var(--evx-fox-orange);
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .seo-block {
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-2xl);
  }

  .seo-block__text { color: var(--evx-ink-soft); line-height: 1.8; }

  /* Mobile filter drawer triggers */
  .sort-bar__filters-toggle {
    display: none;
    background: none;
    border: 1px solid var(--evx-rule-light);
    padding: 8px 12px;
    cursor: pointer;
    color: var(--evx-warm-black);
    font-family: var(--evx-font-mono);
    transition: var(--evx-transition);
  }
  .sort-bar__filters-toggle:hover { border-color: var(--evx-warm-black); }

  .sidebar__head-right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .sidebar__close {
    display: none;
    background: none; border: none;
    color: var(--evx-warm-black);
    font-size: 24px; line-height: 1;
    cursor: pointer; padding: 4px 8px;
  }

  .sidebar-backdrop {
    display: none;
    position: fixed; inset: 0;
    background: rgba(26, 26, 26, 0.55);
    z-index: 95;
    cursor: pointer;
  }

  .sidebar__apply { display: none; width: 100%; margin-top: var(--evx-space-lg); }

  @media (max-width: 1023px) {
    .cat-body { grid-template-columns: 1fr; }

    /* Sidebar becomes a slide-in drawer */
    .sidebar {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 320px;
      max-width: 88vw;
      background: var(--evx-paper);
      z-index: 100;
      padding: var(--evx-space-lg);
      overflow-y: auto;
      transform: translateX(100%);
      transition: transform 280ms ease;
      display: flex;
      box-shadow: -2px 0 24px rgba(0,0,0,0.10);
    }
    .sidebar--open { transform: translateX(0); }
    .sidebar-backdrop { display: block; }
    .sidebar__close { display: inline-block; }
    .sidebar__apply { display: inline-flex; }

    .sort-bar__filters-toggle { display: inline-block; }
    .sort-bar { gap: var(--evx-space-sm); flex-wrap: wrap; }
    .sort-bar__count { order: 3; flex-basis: 100%; }

    .listing-grid { grid-template-columns: repeat(2, 1fr); }
    .cat-header { flex-direction: column; align-items: flex-start; }
  }

  @media (max-width: 767px) {
    .listing-grid { grid-template-columns: 1fr; }
  }
</style>
