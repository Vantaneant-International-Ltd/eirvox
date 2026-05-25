<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import ListingCard from '../lib/components/ListingCard.svelte'
  import { listings } from '../lib/data/listings'

  function formatPrice(price: number): string {
    if (price >= 1000) {
      const thousands = Math.floor(price / 1000)
      const remainder = (price % 1000).toString().padStart(3, '0')
      return `€${thousands},${remainder}`
    }
    return `€${price}`
  }

  function pad(n: number): string {
    return n.toString().padStart(2, '0')
  }

  let selectedMarques: string[] = []
  let selectedConditions: string[] = []
  let minPrice = ''
  let maxPrice = ''
  let selectedLocation = ''
  let sortBy = 'featured'
  let sidebarOpen = false

  const marques = [
    { key: 'audi',       label: 'Audi' },
    { key: 'mercedes',   label: 'Mercedes-AMG' },
    { key: 'bmw',        label: 'BMW M' },
    { key: 'volkswagen', label: 'Volkswagen' },
  ]

  const conditions = ['OEM+ new', 'OEM used', 'Aftermarket new']

  const allLocations = [...new Set(listings.map(l => l.location))].sort()

  $: minPriceNum = minPrice !== '' ? parseFloat(minPrice) : null
  $: maxPriceNum = maxPrice !== '' ? parseFloat(maxPrice) : null

  $: filteredListings = listings.filter(l => {
    if (selectedMarques.length > 0 && !selectedMarques.includes(l.marqueKey)) return false
    if (selectedConditions.length > 0 && !selectedConditions.includes(l.condition)) return false
    if (minPriceNum !== null && l.price < minPriceNum) return false
    if (maxPriceNum !== null && l.price > maxPriceNum) return false
    if (selectedLocation && l.location !== selectedLocation) return false
    return true
  })

  $: sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price
    if (sortBy === 'price-desc') return b.price - a.price
    return 0
  })

  $: hasFilters =
    selectedMarques.length > 0 ||
    selectedConditions.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    selectedLocation !== ''

  function resetFilters() {
    selectedMarques = []
    selectedConditions = []
    minPrice = ''
    maxPrice = ''
    selectedLocation = ''
  }

  function toggleMarque(key: string) {
    if (selectedMarques.includes(key)) {
      selectedMarques = selectedMarques.filter(m => m !== key)
    } else {
      selectedMarques = [...selectedMarques, key]
    }
  }

  function toggleCondition(cond: string) {
    if (selectedConditions.includes(cond)) {
      selectedConditions = selectedConditions.filter(c => c !== cond)
    } else {
      selectedConditions = [...selectedConditions, cond]
    }
  }
</script>

<Layout
  footerVariant="full"
  breadcrumb={['Marketplace', 'Categories', 'Automotive', 'Steering Wheels']}
>
  <div class="page-container">

    <header class="page-header">
      <h1 class="page-headline">Automotive<span class="dot" aria-hidden="true">.</span></h1>
      <p class="page-desc">Premium OEM+ and factory-spec interior components, sourced and verified across the island of Ireland.</p>
      <div class="header-meta">
        <div class="meta-stats">
          <span class="meta-stat">{pad(listings.length)} LISTINGS</span>
          <span class="meta-sep">·</span>
          <span class="meta-stat">OCTOBER 2026</span>
          <span class="meta-sep">·</span>
          <span class="meta-stat">ALL VERIFIED</span>
        </div>
        <div class="sort-control">
          <label class="sort-label" for="sort-select">SORT</label>
          <select id="sort-select" class="sort-select" bind:value={sortBy}>
            <option value="featured">Featured</option>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
          </select>
        </div>
      </div>
    </header>

    <button class="filter-toggle" on:click={() => (sidebarOpen = !sidebarOpen)}>
      {sidebarOpen ? 'HIDE FILTERS' : 'SHOW FILTERS'}
    </button>

    <div class="filter-bar">
      {#if hasFilters}
        <span class="filter-bar-label">FILTERED BY —</span>
        {#if selectedMarques.length > 0}
          <button class="filter-chip" on:click={() => (selectedMarques = [])}>
            {selectedMarques.map(m => marques.find(x => x.key === m)?.label).join(', ')} ×
          </button>
        {/if}
        {#if selectedConditions.length > 0}
          <button class="filter-chip" on:click={() => (selectedConditions = [])}>
            {selectedConditions.join(', ')} ×
          </button>
        {/if}
        {#if selectedLocation}
          <button class="filter-chip" on:click={() => (selectedLocation = '')}>
            {selectedLocation} ×
          </button>
        {/if}
      {/if}
      <span class="showing-count">
        SHOWING {pad(sortedListings.length)} OF {pad(listings.length)}
      </span>
    </div>

    <div class="page-body">

      <aside class="sidebar" class:open={sidebarOpen}>
        <div class="sidebar-header">
          <span class="sidebar-title">REFINE</span>
          <button class="reset-btn" on:click={resetFilters}>RESET</button>
        </div>

        <div class="filter-group">
          <span class="filter-group-label">MARQUE</span>
          <div class="marque-swatches">
            {#each marques as m}
              <button
                class="marque-swatch"
                class:active={selectedMarques.includes(m.key)}
                on:click={() => toggleMarque(m.key)}
              >
                <span class="swatch-dot" data-marque={m.key}></span>
                <span class="swatch-label">{m.label}</span>
              </button>
            {/each}
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group-label">CONDITION</span>
          <div class="checkbox-list">
            {#each conditions as cond}
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedConditions.includes(cond)}
                  on:change={() => toggleCondition(cond)}
                />
                <span class="checkbox-label">{cond}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group-label">PRICE</span>
          <div class="price-inputs">
            <input
              type="number"
              class="price-input"
              placeholder="MIN €"
              bind:value={minPrice}
            />
            <input
              type="number"
              class="price-input"
              placeholder="MAX €"
              bind:value={maxPrice}
            />
          </div>
        </div>

        <div class="filter-group">
          <span class="filter-group-label">LOCATION</span>
          <div class="checkbox-list">
            {#each allLocations as loc}
              <label class="checkbox-item">
                <input
                  type="radio"
                  name="location"
                  value={loc}
                  checked={selectedLocation === loc}
                  on:change={() => (selectedLocation = loc)}
                />
                <span class="checkbox-label">{loc}</span>
              </label>
            {/each}
            {#if selectedLocation}
              <button class="clear-btn" on:click={() => (selectedLocation = '')}>Clear</button>
            {/if}
          </div>
        </div>

        <div class="verification-note">
          <span class="vmark" aria-hidden="true"></span>
          <p class="vmark-text">All listings sold by ÉIRVOX and verified before despatch.</p>
        </div>
      </aside>

      <main class="main-col">
        {#if sortedListings.length === 0}
          <p class="no-results">No listings match your current filters.</p>
        {:else}
          <div class="listing-grid">
            {#each sortedListings as listing, i}
              <ListingCard
                marque={listing.marque}
                title={listing.title}
                subtitle={listing.subtitle}
                price={formatPrice(listing.price)}
                location={listing.location}
                slug={listing.slug}
                sku={listing.sku}
                lotNumber={i + 1}
                totalLots={sortedListings.length}
              />
            {/each}
          </div>
        {/if}

        <div class="pagination">
          <span class="pagination-info">
            SHOWING {pad(Math.min(1, sortedListings.length))} — {pad(sortedListings.length)} OF {pad(listings.length)}
          </span>
          <div class="pagination-buttons">
            <button class="page-btn" disabled>←</button>
            <button class="page-btn" disabled>→</button>
          </div>
        </div>
      </main>

    </div>
  </div>
</Layout>

<style>
  /* ── Page header ─────────────────────────────────────────────────────────── */

  .page-header {
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-lg);
  }

  .page-headline {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-md);
  }

  .dot {
    color: var(--evx-fox-orange);
  }

  .page-desc {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-ink-soft);
    max-width: 580px;
    margin: 0 0 var(--evx-space-lg);
  }

  .header-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-lg);
    flex-wrap: wrap;
  }

  .meta-stats {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
  }

  .meta-stat {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  .meta-sep {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    color: var(--evx-rule-light);
  }

  .sort-control {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
  }

  .sort-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .sort-select {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: 4px var(--evx-space-sm);
    cursor: pointer;
  }

  /* ── Mobile filter toggle ────────────────────────────────────────────────── */

  .filter-toggle {
    display: none;
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-warm-black);
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) var(--evx-space-md);
    cursor: pointer;
    margin-bottom: var(--evx-space-md);
  }

  /* ── Active filter bar ───────────────────────────────────────────────────── */

  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    flex-wrap: wrap;
    padding: var(--evx-space-sm) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }

  .filter-bar-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .filter-chip {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: 2px var(--evx-space-sm);
    cursor: pointer;
  }

  .showing-count {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-left: auto;
  }

  /* ── Page body layout ────────────────────────────────────────────────────── */

  .page-body {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  /* ── Sidebar ─────────────────────────────────────────────────────────────── */

  .sidebar {
    position: sticky;
    top: 80px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sidebar-title {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-warm-black);
  }

  .reset-btn {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }

  .filter-group-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-xs);
  }

  .marque-swatches {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .marque-swatch {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .swatch-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }

  .swatch-dot[data-marque="audi"]       { background-color: var(--evx-audi-red); }
  .swatch-dot[data-marque="mercedes"]   { background-color: var(--evx-mercedes-champagne); }
  .swatch-dot[data-marque="bmw"]        { background-color: var(--evx-bmw-blue); }
  .swatch-dot[data-marque="volkswagen"] { background-color: var(--evx-vw-red); }

  .marque-swatch.active .swatch-dot {
    outline: 2px solid var(--evx-warm-black);
    outline-offset: 2px;
  }

  .swatch-label {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
  }

  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    cursor: pointer;
  }

  .checkbox-label {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
  }

  .price-inputs {
    display: flex;
    gap: var(--evx-space-sm);
  }

  .price-input {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xs) var(--evx-space-sm);
    width: 100%;
  }

  .clear-btn {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .verification-note {
    display: flex;
    align-items: flex-start;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }

  .vmark {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: var(--evx-fox-orange);
    flex-shrink: 0;
    margin-top: 3px;
  }

  .vmark-text {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    margin: 0;
  }

  /* ── Main column ─────────────────────────────────────────────────────────── */

  .listing-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--evx-space-xl) var(--evx-space-lg);
  }

  .no-results {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-ink-soft);
    padding: var(--evx-space-xl) 0;
  }

  /* ── Pagination ──────────────────────────────────────────────────────────── */

  .pagination {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
    margin-top: var(--evx-space-xl);
  }

  .pagination-info {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  .pagination-buttons {
    display: flex;
    gap: var(--evx-space-sm);
  }

  .page-btn {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xs) var(--evx-space-sm);
    cursor: default;
    opacity: 0.4;
  }

  /* ── Mobile ──────────────────────────────────────────────────────────────── */

  @media (max-width: 768px) {
    .filter-toggle {
      display: block;
    }

    .page-body {
      grid-template-columns: 1fr;
      gap: var(--evx-space-lg);
    }

    .sidebar {
      display: none;
      position: static;
    }

    .sidebar.open {
      display: flex;
    }

    .listing-grid {
      grid-template-columns: 1fr;
    }

    .page-headline {
      font-size: 40px;
    }
  }
</style>
