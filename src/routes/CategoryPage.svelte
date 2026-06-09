<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import LoadingCard from '../components/LoadingCard.svelte';
  import {
    getListings,
    getCategoryBySlug,
    getListingsCount,
    isCategoryPublic,
    type ListingWithExtras,
    type Category,
  } from '../lib/api';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  export let category: string;

  // ── State ──
  let cat: Category | null = null;
  let listings: ListingWithExtras[] = [];
  let totalCount = 0;
  let loading = true;
  let catNotFound = false;

  // Filters
  let selectedSubcategory = '';
  let maxPrice = 0;
  let sortBy: 'recent' | 'price_asc' | 'price_desc' | 'popular' = 'recent';
  let mobileFiltersOpen = false;
  let page = 1;
  const PAGE_SIZE = 15;

  // Vehicle filters (only shown for cars / automotive)
  let vehicleMake = '';
  let vehicleModel = '';
  let yearMin: number | null = null;
  let yearMax: number | null = null;
  let mileageMax: number | null = null;
  let county = '';

  $: isVehicleCategory = category === 'cars' || category === 'automotive';

  $: activeFilterCount =
    (selectedSubcategory ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (vehicleMake ? 1 : 0) +
    (vehicleModel ? 1 : 0) +
    (yearMin ? 1 : 0) +
    (yearMax ? 1 : 0) +
    (mileageMax ? 1 : 0) +
    (county ? 1 : 0);

  const IE_COUNTIES = [
    'Carlow','Cavan','Clare','Cork','Donegal','Dublin','Galway','Kerry','Kildare','Kilkenny',
    'Laois','Leitrim','Limerick','Longford','Louth','Mayo','Meath','Monaghan','Offaly','Roscommon',
    'Sligo','Tipperary','Waterford','Westmeath','Wexford','Wicklow','Antrim','Armagh','Down',
    'Fermanagh','Londonderry','Tyrone',
  ];

  // ── Load ──
  async function load() {
    loading = true;
    // Wheel-specialist scope (defence in depth; App.svelte already 404s
    // non-allowlisted category routes and v22 RLS returns no rows).
    if (!isCategoryPublic(category)) {
      catNotFound = true;
      cat = null;
      listings = [];
      loading = false;
      return;
    }
    cat = await getCategoryBySlug(category);
    if (!cat) {
      catNotFound = true;
      listings = [];
      loading = false;
      return;
    }
    catNotFound = false;
    applySeo(seo.category(category, cat.name, totalCount));

    const offset = (page - 1) * PAGE_SIZE;
    const [rows, n] = await Promise.all([
      getListings({
        category,
        subcategory: selectedSubcategory || undefined,
        sort: sortBy,
        limit: PAGE_SIZE,
        offset,
        priceMax: maxPrice || undefined,
        vehicleMake: vehicleMake || undefined,
        vehicleModel: vehicleModel || undefined,
        yearMin: yearMin ?? undefined,
        yearMax: yearMax ?? undefined,
        mileageMax: mileageMax ?? undefined,
        county: county || undefined,
      }),
      getListingsCount(category, selectedSubcategory || undefined),
    ]);

    listings = rows;
    totalCount = n;
    loading = false;
  }

  // Re-load on category prop change
  $: if (category) {
    page = 1; selectedSubcategory = ''; maxPrice = 0; sortBy = 'recent';
    vehicleMake = ''; vehicleModel = ''; yearMin = null; yearMax = null; mileageMax = null; county = '';
    void load();
  }

  // Re-load when filters/sort/page change
  let firstFilter = true;
  $: {
    selectedSubcategory; maxPrice; sortBy; page;
    vehicleMake; vehicleModel; yearMin; yearMax; mileageMax; county;
    if (firstFilter) firstFilter = false;
    else void load();
  }

  onMount(() => { void load(); });

  function reset() {
    selectedSubcategory = '';
    maxPrice = 0;
    sortBy = 'recent';
    vehicleMake = ''; vehicleModel = ''; yearMin = null; yearMax = null; mileageMax = null; county = '';
    page = 1;
  }

  // Pagination derived
  $: pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
</script>

<Nav />

<main id="main-content" class="category">
  <div class="page-container">

    {#if catNotFound}
      <header class="cat-header" style="border-bottom: none;">
        <div>
          <span class="evx-caption" style="color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md);">CATEGORY NOT FOUND</span>
          <h1 class="cat-header__title">{category}</h1>
          <p class="cat-header__desc">This category doesn't exist. Pick one from the menu or browse the home page.</p>
          <div style="margin-top: var(--evx-space-lg);">
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>Back to home →</button>
          </div>
        </div>
      </header>

    {:else}

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <button class="breadcrumb__item" on:click={() => navigate('/')}>HOME</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <span class="breadcrumb__item breadcrumb__item--current evx-caption">{cat?.name ?? category}</span>
      </nav>

      <!-- Header -->
      <header class="cat-header">
        <div class="cat-header__left">
          <span class="evx-caption cat-header__meta">
            CATEGORY · {totalCount} LISTING{totalCount === 1 ? '' : 'S'}
          </span>
          <h1 class="cat-header__title">{cat?.name ?? category}.</h1>
          {#if cat?.description}
            <p class="cat-header__desc">{cat.description}</p>
          {/if}
        </div>
        <div class="cat-header__actions">
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/sell/apply')}>
            Sell {cat?.name ?? category} →
          </button>
        </div>
      </header>

      <!-- Subcategory tabs -->
      {#if cat?.subcategories && cat.subcategories.length > 0}
        <div class="subcat-tabs" role="tablist">
          <button class="subcat-tab" class:subcat-tab--active={!selectedSubcategory}
                  on:click={() => { selectedSubcategory = ''; page = 1; }} role="tab">
            ALL · {totalCount}
          </button>
          {#each cat.subcategories as sub}
            <button class="subcat-tab" class:subcat-tab--active={selectedSubcategory === sub}
                    on:click={() => { selectedSubcategory = selectedSubcategory === sub ? '' : sub; page = 1; }}
                    role="tab">
              {sub.toUpperCase()}
            </button>
          {/each}
        </div>
      {/if}

      <!-- Body -->
      <div class="cat-body">

        <!-- Filter sidebar -->
        {#if mobileFiltersOpen}
          <div class="sidebar-backdrop"
               on:click={() => mobileFiltersOpen = false}
               on:keydown={(e) => e.key === 'Escape' && (mobileFiltersOpen = false)}
               role="button" tabindex="-1" aria-label="Close filters"></div>
        {/if}

        <aside class="sidebar" class:sidebar--open={mobileFiltersOpen} aria-label="Filters">
          <div class="sidebar__header">
            <span class="evx-label">Filters</span>
            <div class="sidebar__head-right">
              <button class="evx-caption sidebar__reset" on:click={reset}>Reset</button>
              <button class="sidebar__close" on:click={() => mobileFiltersOpen = false} aria-label="Close filters">×</button>
            </div>
          </div>

          {#if cat?.subcategories && cat.subcategories.length > 0}
            <div class="filter-group">
              <span class="evx-label filter-group__title">Subcategory</span>
              <ul class="filter-list">
                {#each cat.subcategories as sub}
                  <li>
                    <button class="filter-item" class:filter-item--active={selectedSubcategory === sub}
                            on:click={() => { selectedSubcategory = selectedSubcategory === sub ? '' : sub; page = 1; }}>
                      <span class="filter-item__label">{sub}</span>
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}

          {#if isVehicleCategory}
            <div class="filter-group">
              <span class="evx-label filter-group__title">Vehicle</span>
              <div class="filter-vehicle">
                <label class="evx-caption filter-vehicle__lbl" for="vf-make">Make</label>
                <input id="vf-make" type="text" class="filter-vehicle__input evx-caption"
                       placeholder="Any" bind:value={vehicleMake}
                       on:change={() => { page = 1; }} />

                <label class="evx-caption filter-vehicle__lbl" for="vf-model">Model</label>
                <input id="vf-model" type="text" class="filter-vehicle__input evx-caption"
                       placeholder="Any" bind:value={vehicleModel}
                       on:change={() => { page = 1; }} />

                <label class="evx-caption filter-vehicle__lbl" for="vf-ymin">Year from</label>
                <input id="vf-ymin" type="number" class="filter-vehicle__input evx-caption"
                       placeholder="Any" min="1900" max="2030" bind:value={yearMin}
                       on:change={() => { page = 1; }} />

                <label class="evx-caption filter-vehicle__lbl" for="vf-ymax">Year to</label>
                <input id="vf-ymax" type="number" class="filter-vehicle__input evx-caption"
                       placeholder="Any" min="1900" max="2030" bind:value={yearMax}
                       on:change={() => { page = 1; }} />

                <label class="evx-caption filter-vehicle__lbl" for="vf-miles">Max mileage (km)</label>
                <input id="vf-miles" type="number" class="filter-vehicle__input evx-caption"
                       placeholder="Any" min="0" bind:value={mileageMax}
                       on:change={() => { page = 1; }} />
              </div>
            </div>

            <div class="filter-group">
              <span class="evx-label filter-group__title">Location</span>
              <div class="filter-price">
                <label class="evx-caption filter-price__label" for="vf-county">County</label>
                <select id="vf-county" class="filter-vehicle__input evx-caption"
                        bind:value={county} on:change={() => { page = 1; }}>
                  <option value="">All Ireland</option>
                  {#each IE_COUNTIES as c}
                    <option value={c}>{c}</option>
                  {/each}
                </select>
              </div>
            </div>
          {/if}

          <div class="filter-group">
            <span class="evx-label filter-group__title">Price</span>
            <div class="filter-price">
              <label class="evx-caption filter-price__label" for="max-price">Max price (€)</label>
              <input id="max-price" type="number" class="filter-price__input evx-caption"
                     placeholder="Any" bind:value={maxPrice}
                     on:change={() => { page = 1; }} />
            </div>
          </div>

          <div class="filter-note evx-caption">
            All listings ship across Ireland and Northern Ireland unless noted.
          </div>

          <button class="evx-btn evx-btn--primary sidebar__apply" on:click={() => mobileFiltersOpen = false}>
            Show {listings.length} listings
          </button>
        </aside>

        <!-- Main grid -->
        <div class="cat-main">

          <div class="sort-bar">
            <button class="sort-bar__filters-toggle evx-caption"
                    on:click={() => mobileFiltersOpen = true}
                    aria-label="Open filters">
              ☰ FILTERS{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
            </button>
            <span class="evx-caption sort-bar__count">
              {listings.length} of {totalCount}
              {#if selectedSubcategory}
                <button class="sort-bar__chip" on:click={() => selectedSubcategory = ''}>
                  {selectedSubcategory} ✕
                </button>
              {/if}
            </span>
            <div class="sort-bar__right">
              <span class="evx-caption sort-bar__label">SORT</span>
              <select class="sort-bar__select evx-caption" bind:value={sortBy} aria-label="Sort listings">
                <option value="recent">Newest first</option>
                <option value="popular">Most viewed</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
          </div>

          {#if loading}
            <div class="listing-grid">
              {#each Array(6) as _, i (i)}<LoadingCard />{/each}
            </div>
          {:else if listings.length === 0 && totalCount === 0}
            <!-- Premium empty state (intentional, not broken) -->
            <div class="cat-coming-soon">
              <span class="evx-label cat-coming-soon__pre">COMING SOON</span>
              <h2 class="cat-coming-soon__h">
                Curated {cat?.name?.toLowerCase() ?? category} arriving with Cohort 03.
              </h2>
              <p class="cat-coming-soon__sub">
                We are admitting sellers by application. Every listing here will be from a
                seller approved by our team. Apply now to be the first in this category.
              </p>
              <div class="cat-coming-soon__actions">
                <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
                  Apply to sell →
                </button>
                <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/')}>
                  Back to home
                </button>
              </div>
              <div class="cat-coming-soon__meta">
                <span class="evx-caption">COHORT 03 · CLOSES 14 JUN</span>
              </div>
            </div>
          {:else if listings.length === 0}
            <div class="cat-empty">
              <p class="evx-caption">No listings match these filters.</p>
              <button class="evx-caption cat-empty__reset" on:click={reset}>Clear filters →</button>
            </div>
          {:else}
            <div class="listing-grid">
              {#each listings as listing (listing.id)}
                <ListingCard {listing} />
              {/each}
            </div>

            <!-- Real pagination -->
            <div class="pagination">
              <span class="evx-caption">
                SHOWING {((page - 1) * PAGE_SIZE) + 1}-{(page - 1) * PAGE_SIZE + listings.length} OF {totalCount}
              </span>
              <div class="pagination__actions">
                <button class="evx-btn evx-btn--ghost evx-btn--sm" disabled={page === 1}
                        on:click={() => page = Math.max(1, page - 1)}>
                  ← Previous
                </button>
                <span class="evx-caption pagination__page">
                  PAGE {page} OF {pageCount}
                </span>
                <button class="evx-btn evx-btn--ghost evx-btn--sm" disabled={page >= pageCount}
                        on:click={() => page = Math.min(pageCount, page + 1)}>
                  Next →
                </button>
              </div>
            </div>
          {/if}

        </div>
      </div>
    {/if}
  </div>
</main>

<Footer />

<style>
  .category { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Breadcrumb */
  .breadcrumb { display: flex; gap: var(--evx-space-sm); align-items: center; padding-top: var(--evx-space-xl); margin-bottom: var(--evx-space-xl); }
  .breadcrumb__item { font-family: var(--evx-font-mono); font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--evx-ink-soft); background: none; border: none; padding: 0; cursor: pointer; transition: var(--evx-transition); }
  .breadcrumb__item:hover { color: var(--evx-warm-black); }
  .breadcrumb__item--current { color: var(--evx-warm-black); cursor: default; }
  .breadcrumb__sep { color: var(--evx-rule-light); }

  /* Header */
  .cat-header { display: flex; justify-content: space-between; align-items: flex-end; gap: var(--evx-space-xl); margin-bottom: var(--evx-space-xl); padding-bottom: var(--evx-space-xl); border-bottom: 1px solid var(--evx-rule-light); }
  .cat-header__meta { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .cat-header__title { font-family: var(--evx-font-display); font-weight: 500; font-size: clamp(36px, 5vw, 64px); line-height: 1; letter-spacing: -0.025em; color: var(--evx-warm-black); }
  .cat-header__desc { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 480px; margin-top: var(--evx-space-md); }
  .cat-header__actions { display: flex; gap: var(--evx-space-md); flex-shrink: 0; }

  /* Subcategory tabs */
  .subcat-tabs { display: flex; gap: 0; overflow-x: auto; border-bottom: 1px solid var(--evx-rule-light); margin-bottom: var(--evx-space-xl); scrollbar-width: none; }
  .subcat-tabs::-webkit-scrollbar { display: none; }
  .subcat-tab { font-family: var(--evx-font-mono); font-size: 10px; font-weight: 400; letter-spacing: 0.07em; color: var(--evx-ink-soft); background: none; border: none; border-bottom: 2px solid transparent; padding: var(--evx-space-sm) var(--evx-space-lg); cursor: pointer; white-space: nowrap; transition: all 200ms ease; margin-bottom: -1px; }
  .subcat-tab:hover { color: var(--evx-warm-black); }
  .subcat-tab--active { color: var(--evx-warm-black); border-bottom-color: var(--evx-warm-black); }

  /* Body layout */
  .cat-body { display: grid; grid-template-columns: 220px 1fr; gap: var(--evx-space-3xl); align-items: start; }

  /* Sidebar */
  .sidebar { display: flex; flex-direction: column; gap: var(--evx-space-xl); position: sticky; top: 80px; }
  .sidebar__header { display: flex; justify-content: space-between; align-items: center; padding-bottom: var(--evx-space-md); border-bottom: 1px solid var(--evx-rule-light); }
  .sidebar__reset { background: none; border: none; color: var(--evx-fox-orange); cursor: pointer; transition: var(--evx-transition); padding: 0; }
  .sidebar__reset:hover { opacity: 0.70; }
  .filter-group { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .filter-group__title { color: var(--evx-ink-soft); }
  .filter-list { display: flex; flex-direction: column; gap: var(--evx-space-xs); list-style: none; padding: 0; margin: 0; }
  .filter-item { display: flex; justify-content: space-between; align-items: center; width: 100%; background: none; border: none; padding: var(--evx-space-xs) 0; cursor: pointer; transition: var(--evx-transition); }
  .filter-item:hover { opacity: 0.70; }
  .filter-item--active .filter-item__label { color: var(--evx-fox-orange); }
  .filter-item__label { font-size: 13px; color: var(--evx-warm-black); }
  .filter-price { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .filter-price__label { color: var(--evx-ink-soft); }
  .filter-price__input { background: transparent; border: none; border-bottom: 1px solid var(--evx-rule-light); padding: var(--evx-space-xs) 0; outline: none; color: var(--evx-warm-black); width: 100%; }
  .filter-vehicle { display: grid; grid-template-columns: 1fr; gap: var(--evx-space-sm); }
  .filter-vehicle__lbl { color: var(--evx-ink-soft); margin-top: var(--evx-space-xs); }
  .filter-vehicle__input { background: transparent; border: none; border-bottom: 1px solid var(--evx-rule-light); padding: var(--evx-space-xs) 0; outline: none; color: var(--evx-warm-black); width: 100%; }
  .filter-vehicle__input:focus { border-color: var(--evx-warm-black); }
  .filter-note { color: var(--evx-ink-soft); line-height: 1.6; }

  /* Sort bar */
  .sort-bar { display: flex; justify-content: space-between; align-items: center; padding: var(--evx-space-md) 0; border-bottom: 1px solid var(--evx-rule-light); margin-bottom: var(--evx-space-xl); }
  .sort-bar__count { color: var(--evx-ink-soft); }
  .sort-bar__chip { display: inline-block; border: 1px solid var(--evx-rule-light); padding: 2px 8px; margin-left: var(--evx-space-sm); cursor: pointer; }
  .sort-bar__right { display: flex; align-items: center; gap: var(--evx-space-sm); }
  .sort-bar__label { color: var(--evx-ink-soft); }
  .sort-bar__select { background: transparent; border: none; border-bottom: 1px solid var(--evx-rule-light); padding: 2px 0; outline: none; color: var(--evx-warm-black); cursor: pointer; }

  /* Grid */
  .listing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--evx-space-xl); margin-bottom: var(--evx-space-2xl); }

  /* Pagination */
  .pagination { display: flex; justify-content: space-between; align-items: center; padding-top: var(--evx-space-xl); border-top: 1px solid var(--evx-rule-light); margin-bottom: var(--evx-space-2xl); flex-wrap: wrap; gap: var(--evx-space-md); }
  .pagination__actions { display: flex; align-items: center; gap: var(--evx-space-md); }
  .pagination__page { color: var(--evx-ink-soft); }

  /* Empty / no-results */
  .cat-empty { padding: var(--evx-space-3xl) 0; display: flex; flex-direction: column; gap: var(--evx-space-md); color: var(--evx-ink-soft); }
  .cat-empty__reset { background: none; border: none; color: var(--evx-fox-orange); cursor: pointer; padding: 0; text-align: left; }

  /* Premium "coming soon" - when category has 0 listings */
  .cat-coming-soon {
    padding: var(--evx-space-3xl) var(--evx-space-2xl);
    border: 1px solid var(--evx-rule-light);
    background: var(--evx-paper);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    max-width: 640px;
    position: relative;
    overflow: hidden;
  }
  .cat-coming-soon::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: var(--evx-fox-orange);
  }
  .cat-coming-soon__pre { color: var(--evx-fox-orange); }
  .cat-coming-soon__h {
    font-family: var(--evx-font-display);
    font-size: clamp(24px, 3.4vw, 36px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.18;
    color: var(--evx-warm-black);
    margin: var(--evx-space-sm) 0;
  }
  .cat-coming-soon__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); max-width: 520px; }
  .cat-coming-soon__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; margin-top: var(--evx-space-md); }
  .cat-coming-soon__meta {
    margin-top: var(--evx-space-lg);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    color: var(--evx-fox-orange);
  }

  /* Mobile drawer triggers */
  .sort-bar__filters-toggle { display: none; background: none; border: 1px solid var(--evx-rule-light); padding: 8px 12px; cursor: pointer; color: var(--evx-warm-black); font-family: var(--evx-font-mono); transition: var(--evx-transition); }
  .sort-bar__filters-toggle:hover { border-color: var(--evx-warm-black); }
  .sidebar__head-right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .sidebar__close { display: none; background: none; border: none; color: var(--evx-warm-black); font-size: 24px; line-height: 1; cursor: pointer; padding: 4px 8px; }
  .sidebar-backdrop { display: none; position: fixed; inset: 0; background: rgba(26, 26, 26, 0.55); z-index: 95; cursor: pointer; }
  .sidebar__apply { display: none; width: 100%; margin-top: var(--evx-space-lg); }

  @media (max-width: 1023px) {
    .cat-body { grid-template-columns: 1fr; }
    .sidebar { position: fixed; top: 0; right: 0; bottom: 0; width: 320px; max-width: 88vw; background: var(--evx-paper); z-index: 100; padding: var(--evx-space-lg); overflow-y: auto; transform: translateX(100%); transition: transform 280ms ease; display: flex; box-shadow: -2px 0 24px rgba(0,0,0,0.10); }
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
