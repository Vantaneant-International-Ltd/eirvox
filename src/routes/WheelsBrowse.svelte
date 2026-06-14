<script lang="ts">
  // ============================================================
  // /wheels — the curated browse grid (warm paper). ÉIRVOX is the
  // single seller; the grid IS the catalogue. Live DB rows only — no
  // fabricated listings, counts, conditions, or seller layer. Filters
  // are derived from the real stock (MAKE + CONDITION) so they never
  // promise options that don't exist. Cards route to the paper wheel
  // detail (/wheels/:slug) and read BUY. Registry is coming-soon.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import { getListings, type ListingWithExtras } from '../lib/api';
  import { applySeo } from '../lib/seo';

  let all: ListingWithExtras[] = [];
  let loading = true;
  let make = '';
  let condition = '';
  let sortBy: 'recent' | 'price_asc' | 'price_desc' = 'recent';

  onMount(async () => {
    applySeo({
      title: 'Wheels — ÉIRVOX',
      description: 'The ÉIRVOX wheel catalogue — carbon steering wheels, finished in Dublin. Buy direct.',
      path: '/wheels',
    });
    all = await getListings({ sort: 'recent', limit: 48 });
    loading = false;
  });

  // Filter option lists derived from live stock only — never hardcoded.
  $: makes = Array.from(new Set(all.map(l => l.vehicle_make).filter(Boolean))) as string[];
  $: conditions = Array.from(new Set(all.map(l => l.condition).filter(Boolean))) as string[];

  $: filtered = all
    .filter(l => !make || l.vehicle_make === make)
    .filter(l => !condition || l.condition === condition)
    .slice()
    .sort((a, b) =>
      sortBy === 'price_asc' ? a.price - b.price :
      sortBy === 'price_desc' ? b.price - a.price : 0);

  $: dirty = !!make || !!condition || sortBy !== 'recent';
  function clearFilters() { make = ''; condition = ''; sortBy = 'recent'; }
</script>

<Nav />

<main id="main-content" class="wb">
  <div class="page-container">

    <header class="wb__head">
      <span class="evx-caption wb__pre">01 · WHEELS</span>
      <h1 class="wb__title">Wheels</h1>
      <p class="wb__stand evx-editorial">The catalogue.</p>
      <p class="wb__registry">Every ÉIRVOX wheel is recorded. Registry coming soon.</p>
    </header>

    <div class="wb__layout">
      <!-- Filter rail -->
      <aside class="wb__filters">
        <div class="wb__filter-head">
          <span class="evx-label">Filters</span>
          {#if dirty}<button class="wb__clear" type="button" on:click={clearFilters}>Clear</button>{/if}
        </div>

        <div class="wb__group">
          <label class="evx-label wb__label" for="wb-make">Make</label>
          <select id="wb-make" class="wb__select" bind:value={make}>
            <option value="">All makes</option>
            {#each makes as m}<option value={m}>{m}</option>{/each}
          </select>
        </div>

        <div class="wb__group">
          <label class="evx-label wb__label" for="wb-cond">Condition</label>
          <select id="wb-cond" class="wb__select" bind:value={condition}>
            <option value="">All conditions</option>
            {#each conditions as c}<option value={c}>{c}</option>{/each}
          </select>
        </div>

        <div class="wb__group">
          <label class="evx-label wb__label" for="wb-sort">Sort</label>
          <select id="wb-sort" class="wb__select" bind:value={sortBy}>
            <option value="recent">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>
      </aside>

      <!-- Results -->
      <section class="wb__results">
        <div class="wb__count evx-caption">
          {#if loading}Loading.{:else}{filtered.length} {filtered.length === 1 ? 'wheel' : 'wheels'}{/if}
        </div>

        {#if loading}
          <p class="wb__empty">Loading.</p>
        {:else if filtered.length === 0}
          <p class="wb__empty">{all.length === 0 ? 'No wheels live yet.' : 'No wheels match those filters.'}</p>
        {:else}
          <div class="wb__grid">
            {#each filtered as l (l.id)}
              <ListingCard listing={l} showSeller={false} showFeatured={false} showBookmark={false}
                           detailBase="/wheels" cta="Buy" />
            {/each}
          </div>
        {/if}
      </section>
    </div>

  </div>
</main>

<Footer />

<style>
  .wb { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .wb__head {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }
  .wb__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }
  .wb__title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 500;
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--evx-ink);
  }
  .wb__stand {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 19px;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-md);
  }
  .wb__registry {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-lg);
  }

  .wb__layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--evx-space-2xl);
  }

  /* Filter rail */
  .wb__filters { display: flex; flex-direction: column; gap: var(--evx-space-lg); }
  .wb__filter-head {
    display: flex; align-items: baseline; justify-content: space-between;
    padding-bottom: var(--evx-space-sm);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .wb__clear {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none; border: none; padding: 0; cursor: pointer;
    transition: var(--evx-transition);
  }
  .wb__clear:hover { color: var(--evx-fox-orange); }
  .wb__group { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .wb__label { color: var(--evx-ink-soft); }
  .wb__select {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-ink-soft);
    border-radius: 0;
    color: var(--evx-ink);
    font-family: var(--evx-font-display);
    font-size: 14px;
    padding: 6px 0;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }
  .wb__select:focus { outline: none; border-bottom-color: var(--evx-fox-orange); }

  /* Results */
  .wb__count {
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-lg);
  }
  .wb__empty {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    color: var(--evx-ink-soft);
    padding: var(--evx-space-xl) 0;
  }
  .wb__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-lg) var(--evx-space-md);
  }

  @media (min-width: 768px) {
    .wb__layout { grid-template-columns: 200px 1fr; gap: var(--evx-space-3xl); }
    .wb__grid { grid-template-columns: repeat(3, 1fr); gap: var(--evx-space-2xl) var(--evx-space-lg); }
  }
  @media (min-width: 1200px) {
    .wb__grid { grid-template-columns: repeat(4, 1fr); }
  }
</style>
