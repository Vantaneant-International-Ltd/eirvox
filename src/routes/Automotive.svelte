<script lang="ts">
  import Layout from '../lib/components/Layout.svelte';
  import ListingCard from '../lib/components/ListingCard.svelte';
  import SectionLabel from '../lib/components/SectionLabel.svelte';
  import Button from '../lib/components/Button.svelte';
  import { listings } from '../lib/data/listings';
</script>

<Layout footerVariant="compact">
  <div class="automotive page-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span class="evx-caption breadcrumb__item"><a href="/#/">Marketplace</a></span>
      <span class="evx-caption breadcrumb__sep">/</span>
      <span class="evx-caption breadcrumb__item"><a href="/#/automotive">Categories</a></span>
      <span class="evx-caption breadcrumb__sep">/</span>
      <span class="evx-caption breadcrumb__item"><a href="/#/automotive">Automotive</a></span>
      <span class="evx-caption breadcrumb__sep">/</span>
      <span class="evx-caption breadcrumb__item breadcrumb__item--current">Steering Wheels</span>
    </nav>

    <!-- Page Header -->
    <header class="auto-header">
      <h1 class="evx-display">Automotive<span class="orange-dot">.</span></h1>
      <p class="auto-header__intro reading-column">
        Eight pieces, hand-finished. OEM+ carbon, sourced through one shop in Stuttgart and one in Dublin.
      </p>
      <div class="auto-header__stats">
        <SectionLabel text="08 Listings · October 2026 · All Verified" rule="bottom" />
        <span class="evx-label auto-header__sort">SORT <span class="auto-header__sort-val">Lot order</span></span>
      </div>
    </header>

    <div class="auto-layout">
      <!-- Sidebar -->
      <aside class="auto-sidebar">
        <div class="sidebar__header">
          <span class="evx-label">Refine</span>
          <button class="evx-caption sidebar__reset">Reset All</button>
        </div>

        <div class="filter-group">
          <SectionLabel text="Marque  04 / 04" rule="bottom" />
          <ul class="filter-list">
            <li class="filter-item">
              <span class="filter-item__name">Audi</span>
              <span class="evx-caption filter-item__count">02</span>
            </li>
            <li class="filter-item">
              <span class="filter-item__name">BMW M</span>
              <span class="evx-caption filter-item__count">02</span>
            </li>
            <li class="filter-item">
              <span class="filter-item__name">Mercedes-AMG</span>
              <span class="evx-caption filter-item__count">02</span>
            </li>
            <li class="filter-item">
              <span class="filter-item__name">Volkswagen</span>
              <span class="evx-caption filter-item__count">02</span>
            </li>
          </ul>
        </div>

        <div class="filter-group">
          <SectionLabel text="Model  08 lines" rule="bottom" />
          <ul class="filter-list">
            {#each [
              ['Audi RS', '01'],
              ['Audi R8', '01'],
              ['BMW M2', '01'],
              ['BMW M3', '01'],
              ['AMG GT', '01'],
              ['AMG C63', '01'],
              ['Golf R', '01'],
              ['Golf GTI', '01'],
            ] as [model, count]}
              <li class="filter-item">
                <span class="filter-item__name">{model}</span>
                <span class="evx-caption filter-item__count">{count}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="filter-group">
          <SectionLabel text="Condition" rule="bottom" />
          <ul class="filter-list">
            <li class="filter-item">
              <span class="filter-item__name">OEM+ new</span>
              <span class="evx-caption filter-item__count">08</span>
            </li>
            <li class="filter-item filter-item--inactive">
              <span class="filter-item__name">Refinished</span>
              <span class="evx-caption filter-item__count">00</span>
            </li>
            <li class="filter-item filter-item--inactive">
              <span class="filter-item__name">Used</span>
              <span class="evx-caption filter-item__count">00</span>
            </li>
          </ul>
        </div>

        <div class="filter-group">
          <SectionLabel text="Price" rule="bottom" />
          <div class="filter-price">
            <div class="filter-price__range">
              <span class="evx-caption">€860 — €2,140</span>
            </div>
            <div class="filter-price__inputs">
              <div class="filter-price__field">
                <span class="evx-label">From</span>
                <input type="number" class="filter-price__input" placeholder="860" />
              </div>
              <div class="filter-price__field">
                <span class="evx-label">To</span>
                <input type="number" class="filter-price__input" placeholder="2140" />
              </div>
            </div>
          </div>
        </div>

        <div class="filter-group">
          <SectionLabel text="Location" rule="bottom" />
          <ul class="filter-list">
            {#each [
              ['Dublin', '04'],
              ['Cork', '01'],
              ['Galway', '01'],
              ['Limerick', '01'],
              ['Waterford', '01'],
            ] as [loc, count]}
              <li class="filter-item">
                <span class="filter-item__name">{loc}</span>
                <span class="evx-caption filter-item__count">{count}</span>
              </li>
            {/each}
          </ul>
        </div>

        <div class="filter-note">
          <p class="evx-caption">Every listing is sold by ÉIRVOX · Verified. There is no other tier yet.</p>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="auto-main">
        <div class="active-filters">
          <span class="evx-caption active-filters__text">
            FILTERED BY — All marques × OEM+ new × SHOWING 08 OF 08
          </span>
        </div>

        <div class="listing-grid">
          {#each listings as listing}
            <ListingCard
              marque={listing.marque}
              title={listing.title}
              subtitle={listing.subtitle}
              price={listing.priceDisplay}
              location={listing.location}
              slug={listing.slug}
              sku={listing.sku}
              lotNumber={listing.lotNumber}
            />
          {/each}
        </div>

        <div class="pagination">
          <span class="evx-caption pagination__info">SHOWING 01 — 08 OF 08</span>
          <div class="pagination__controls">
            <Button variant="ghost">Previous</Button>
            <Button variant="ghost">Next</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</Layout>

<style>
  .automotive {
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-3xl);
  }

  /* Breadcrumb */
  .breadcrumb {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    margin-bottom: var(--evx-space-2xl);
    color: var(--evx-ink-soft);
  }

  .breadcrumb__item a {
    color: var(--evx-ink-soft);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .breadcrumb__item a:hover {
    color: var(--evx-warm-black);
  }

  .breadcrumb__item--current {
    color: var(--evx-warm-black);
  }

  .breadcrumb__sep {
    color: var(--evx-rule-light);
  }

  /* Header */
  .auto-header {
    margin-bottom: var(--evx-space-2xl);
  }

  .auto-header__intro {
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-lg);
    margin-bottom: var(--evx-space-xl);
  }

  .auto-header__stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .auto-header__sort {
    color: var(--evx-ink-soft);
  }

  .auto-header__sort-val {
    color: var(--evx-warm-black);
    text-transform: none;
    letter-spacing: 0;
  }

  /* Layout */
  .auto-layout {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .orange-dot {
    color: var(--evx-fox-orange);
  }

  /* Sidebar */
  .auto-sidebar {
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
    color: var(--evx-ink-soft);
    cursor: pointer;
    padding: 0;
    transition: var(--evx-transition);
  }

  .sidebar__reset:hover {
    color: var(--evx-warm-black);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .filter-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .filter-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: var(--evx-transition);
    font-size: 14px;
  }

  .filter-item:hover {
    opacity: 0.70;
  }

  .filter-item--inactive {
    opacity: 0.40;
    cursor: default;
  }

  .filter-item__count {
    color: var(--evx-ink-soft);
  }

  .filter-price {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .filter-price__range {
    color: var(--evx-ink-soft);
  }

  .filter-price__inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-md);
  }

  .filter-price__field {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .filter-price__input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    font-family: 'Inter Tight', sans-serif;
    font-size: 14px;
    padding: var(--evx-space-xs) 0;
    outline: none;
    color: var(--evx-warm-black);
    width: 100%;
  }

  .filter-note {
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
  }

  .filter-note p {
    color: var(--evx-ink-soft);
  }

  /* Active Filters */
  .active-filters {
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }

  .active-filters__text {
    color: var(--evx-ink-soft);
  }

  /* Grid */
  .listing-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--evx-space-xl);
    margin-bottom: var(--evx-space-3xl);
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .pagination__info {
    color: var(--evx-ink-soft);
  }

  .pagination__controls {
    display: flex;
    gap: var(--evx-space-xl);
  }

  @media (max-width: 1023px) {
    .auto-layout {
      grid-template-columns: 1fr;
    }

    .auto-sidebar {
      position: static;
    }
  }

  @media (max-width: 767px) {
    .listing-grid {
      grid-template-columns: 1fr;
    }

    .auto-header__stats {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }

    .pagination {
      flex-direction: column;
      gap: var(--evx-space-md);
      align-items: flex-start;
    }
  }
</style>
