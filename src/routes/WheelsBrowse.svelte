<script lang="ts">
  // ============================================================
  // /wheels, the shop. One catalogue, one light surface.
  //
  // DRIVE is folded in here as a collection rather than a separate
  // editorial surface (19 Aug 2026 direction change). #drive and
  // #fitment are the anchors the nav and footer deep-link to.
  //
  // Live DB rows only. Filter options are derived from real stock so
  // the UI never offers an option that returns nothing.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ProductCard from '../lib/ProductCard.svelte';
  import WheelFinder from '../lib/WheelFinder.svelte';
  import { getListings, type ListingWithExtras } from '../lib/api';
  import { applySeo } from '../lib/seo';

  const CONSIGNMENT_SLUG = 'bmw-m-sport-carbon-consignment';

  type Collection = 'all' | 'range' | 'drive';

  let all: ListingWithExtras[] = [];
  let loading = true;
  let collection: Collection = 'all';
  let make = '';
  let sortBy: 'recent' | 'price_asc' | 'price_desc' = 'recent';
  let finderOpen = false;

  $: consignment = all.find(l => l.slug === CONSIGNMENT_SLUG)
    ?? all.find(l => l.slug?.includes('consignment'))
    ?? all.find(l => l.is_drive !== true)
    ?? null;

  onMount(async () => {
    applySeo({
      title: 'Wheels',
      description: 'The ÉIRVOX wheel catalogue. A fitted BMW range and the DRIVE line. Designed in Ireland, assembled abroad, finished in Dublin.',
      path: '/wheels',
    });

    const rows = await getListings({ sort: 'recent', limit: 48 });
    // The shop is wheels only: DRIVE plus the fitted range. Marketplace
    // categories never appear here, whatever the flag state.
    all = rows.filter(l => l.is_drive === true || l.category_slug === 'automotive');
    loading = false;
  });

  $: makes = Array.from(new Set(all.map(l => l.vehicle_make).filter(Boolean))) as string[];

  $: filtered = all
    .filter(l => collection === 'all'
      || (collection === 'drive' && l.is_drive === true)
      || (collection === 'range' && l.is_drive !== true))
    .filter(l => !make || l.vehicle_make === make)
    .slice()
    .sort((a, b) =>
      sortBy === 'price_asc'  ? a.price - b.price :
      sortBy === 'price_desc' ? b.price - a.price : 0);

  $: driveItems = all.filter(l => l.is_drive === true);

  $: dirty = collection !== 'all' || !!make || sortBy !== 'recent';
  function clearFilters() { collection = 'all'; make = ''; sortBy = 'recent'; }
</script>

<Nav />

<main id="main-content">

  <!-- ━━ HEAD ━━ -->
  <header class="wb__head page-container">
    <span class="evx-label">THE SHOP</span>
    <h1 class="evx-display wb__title">Wheels</h1>
    <p class="evx-lede wb__lede">
      The fitted BMW range and the DRIVE line. Every wheel is designed in Ireland,
      assembled abroad, and finished in Dublin before it goes out to you.
    </p>
  </header>

  <!-- ━━ FILTER BAR ━━ -->
  <div class="fbar">
    <div class="fbar__inner page-container">
      <div class="fbar__tabs" role="group" aria-label="Collection">
        <button class="fbar__tab" class:fbar__tab--on={collection === 'all'}   on:click={() => (collection = 'all')}>All wheels</button>
        <button class="fbar__tab" class:fbar__tab--on={collection === 'range'} on:click={() => (collection = 'range')}>The range</button>
        <button class="fbar__tab" class:fbar__tab--on={collection === 'drive'} on:click={() => (collection = 'drive')}>DRIVE</button>
      </div>

      <div class="fbar__controls">
        {#if makes.length > 1}
          <label class="fbar__field">
            <span class="sr-only">Make</span>
            <select bind:value={make}>
              <option value="">All makes</option>
              {#each makes as m}<option value={m}>{m}</option>{/each}
            </select>
          </label>
        {/if}
        <label class="fbar__field">
          <span class="sr-only">Sort</span>
          <select bind:value={sortBy}>
            <option value="recent">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
        {#if dirty}<button class="fbar__clear" on:click={clearFilters}>Clear</button>{/if}
      </div>
    </div>
  </div>

  <!-- ━━ GRID ━━ -->
  <!-- The catalogue is a light band: nothing on this surface but wheels,
       and they are shot on light grounds. -->
  <section class="evx-section--loose evx-light wb__grid-band">
    <div class="page-container">
      <p class="wb__count">
        {#if loading}Loading.{:else}{filtered.length} {filtered.length === 1 ? 'wheel' : 'wheels'}{/if}
      </p>

      {#if loading}
        <div class="grid">{#each Array(6) as _, i (i)}<div class="grid__skel"></div>{/each}</div>
      {:else if filtered.length}
        <div class="grid">{#each filtered as l (l.id)}<ProductCard listing={l} />{/each}</div>
      {:else}
        <p class="wb__empty">Nothing in this collection yet.</p>
      {/if}
    </div>
  </section>

  <!-- ━━ FITMENT ━━ -->
  <section class="evx-section evx-band" id="fitment">
    <div class="page-container fit">
      <div class="fit__copy">
        <span class="evx-label">FITMENT</span>
        <h2 class="evx-heading">Check it fits before you pay.</h2>
        <p class="evx-lede">
          Give us the chassis and the finder comes back with the fit, the finish
          options, and the price for your car.
        </p>
        <button class="evx-btn evx-btn--ink fit__cta" on:click={() => (finderOpen = true)} disabled={!consignment}>
          {consignment ? 'Check fitment' : 'Fitment opens with the range'}
        </button>
      </div>
    </div>
  </section>

  <!-- ━━ DRIVE ━━ -->
  <section class="evx-pit" id="drive">
    <div class="page-container evx-section">
      <span class="evx-label drive__eyebrow">DRIVE</span>
      <h2 class="evx-heading drive__h">Made once. Not reprinted.</h2>
      <p class="evx-lede drive__lede">
        One specification per issue, with integrated LED. When an issue closes, it stays closed.
      </p>

      {#if driveItems.length}
        <div class="drive__row">
          {#each driveItems.slice(0, 4) as d (d.id)}
            <button class="dchip" type="button" on:click={() => { collection = 'drive'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <span class="dchip__issue">DRIVE {d.drive_issue ?? ''}</span>
              <span class="dchip__title">{d.title}</span>
            </button>
          {/each}
        </div>
        <button class="drive__all" on:click={() => { collection = 'drive'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Show the DRIVE collection →
        </button>
      {:else}
        <p class="drive__empty">The next issue is in preparation.</p>
      {/if}
    </div>
  </section>
</main>

<Footer />

{#if finderOpen && consignment}
  <WheelFinder
    consignmentSlug={consignment.slug ?? CONSIGNMENT_SLUG}
    consignmentId={consignment.id}
    basePriceEur={consignment.price}
    on:close={() => (finderOpen = false)}
  />
{/if}

<style>
  .wb__head { padding-top: var(--evx-space-3xl); padding-bottom: var(--evx-space-xl); }
  .wb__title { margin-top: var(--evx-space-sm); }
  .wb__lede { margin-top: var(--evx-space-md); }

  /* ── Filter bar ── */
  /* The band runs full-bleed and needs breathing room at the seams,
     because a light block butting the dark page with no air reads as a
     mistake rather than a decision. */
  .fbar {
    position: sticky;
    /* Under the whole pinned slab (ledger + bar), not just the bar. */
    top: var(--evx-chrome-height);
    z-index: 20;
    background: var(--evx-paper);
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .fbar__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-lg);
    min-height: 54px;
    flex-wrap: wrap;
  }
  .fbar__tabs { display: flex; align-items: center; gap: var(--evx-space-lg); }
  .fbar__tab {
    min-height: 44px;
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    border-bottom: 1px solid transparent;
    padding: 4px 0;
    transition: var(--evx-transition);
  }
  .fbar__tab:hover { color: var(--evx-ink); }
  .fbar__tab--on { color: var(--evx-ink); border-bottom-color: var(--evx-fox-orange); }

  .fbar__controls { display: flex; align-items: center; gap: var(--evx-space-md); }
  .fbar__field select {
    min-height: 44px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink);
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 7px 10px;
  }
  .fbar__clear {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    padding: 0;
  }
  .fbar__clear:hover { color: var(--evx-ink); }

  /* ── Grid ── */
  .wb__count {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-lg);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--evx-space-lg);
  }
  .grid__skel {
    aspect-ratio: 5 / 7;
    background: var(--evx-paper-panel);
    border: 1px solid var(--evx-rule-light);
  }
  .wb__empty { color: var(--evx-ink-soft); font-size: 15px; }

  /* ── Fitment ── */
  .fit__copy { max-width: 56ch; }
  .fit__copy .evx-heading { margin-top: var(--evx-space-sm); }
  .fit__copy .evx-lede { margin-top: var(--evx-space-sm); }
  .fit__cta { margin-top: var(--evx-space-lg); }

  /* ── DRIVE ── */
  .drive__eyebrow { color: var(--evx-champagne); }
  .drive__h { color: var(--evx-ink); margin-top: var(--evx-space-sm); }
  .drive__lede { margin-top: var(--evx-space-sm); }
  .drive__row {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--evx-space-md);
    margin-top: var(--evx-space-xl);
  }
  .dchip {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    min-height: 76px;
    padding: var(--evx-space-md);
    background: none;
    border: 1px solid var(--evx-rule-light);
    text-align: left;
    transition: var(--evx-transition);
  }
  .dchip:hover { opacity: 0.7; }
  .dchip__issue {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    color: var(--evx-champagne);
  }
  .dchip__title { font-size: 14px; font-weight: 500; color: var(--evx-ink); letter-spacing: -0.01em; }
  .drive__all {
    margin-top: var(--evx-space-xl);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-ink);
    background: none;
    border: none;
    border-bottom: 1px solid var(--evx-ink-faint);
    padding: 0 0 3px;
  }
  .drive__all:hover { opacity: 0.65; }
  .drive__empty { color: var(--evx-ink-soft); font-size: 15px; margin-top: var(--evx-space-lg); }

  @media (max-width: 1023px) {
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .drive__row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 599px) {
    .wb__head { padding-top: var(--evx-space-2xl); }
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--evx-space-sm); }
    .drive__row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--evx-space-sm); }
    /* The collection tabs are the primary control on this page, so they
       scroll horizontally rather than wrapping into the sort control. */
    .fbar__inner {
      align-items: center;
      gap: var(--evx-space-md);
      flex-wrap: nowrap;
      padding-top: var(--evx-space-sm);
      padding-bottom: var(--evx-space-sm);
    }
    .fbar__tabs {
      gap: var(--evx-space-md);
      overflow-x: auto;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }
    .fbar__tabs::-webkit-scrollbar { display: none; }
    .fbar__tab { white-space: nowrap; }
    .fbar__controls { flex-shrink: 0; }
  }

  /* Last controls under the touch guidance: they are links by
     appearance but actions by function. */
  @media (max-width: 767px) {
    .drive__all { padding-top: 12px; padding-bottom: 12px; }
  }
</style>
