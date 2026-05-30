<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import LoadingCard from '../components/LoadingCard.svelte';
  import {
    searchListings,
    searchTradespeople,
    type ListingWithExtras,
    type Tradesperson,
  } from '../lib/api';
  import { navigate, currentPath } from '../lib/router';
  import { applySeo } from '../lib/seo';

  let query = '';
  let listings: ListingWithExtras[] = [];
  let tradespeople: Tradesperson[] = [];
  let loading = false;
  let searched = false;

  // Read q from the hash query string
  function readQuery(path: string): string {
    const qIdx = path.indexOf('?');
    if (qIdx === -1) return '';
    return new URLSearchParams(path.slice(qIdx + 1)).get('q') ?? '';
  }

  $: currentQ = readQuery($currentPath);
  $: if (currentQ !== query) {
    query = currentQ;
    if (query.trim()) void runSearch();
  }

  onMount(() => {
    applySeo({ title: 'Search · ÉIRVOX', description: 'Search listings and tradespeople.', path: '/search' });
    query = readQuery($currentPath);
    if (query.trim()) void runSearch();
  });

  async function runSearch() {
    const q = query.trim();
    if (!q) { listings = []; tradespeople = []; searched = false; return; }
    loading = true;
    searched = true;
    [listings, tradespeople] = await Promise.all([
      searchListings(q, 24),
      searchTradespeople(q, 12),
    ]);
    loading = false;
  }

  function onSubmit(e: Event) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    void runSearch();
  }
</script>

<Nav />

<main id="main-content" class="search">
  <div class="page-container">

    <header class="search__head">
      <span class="evx-label search__pre">SEARCH</span>
      <h1 class="search__h">
        {searched
          ? (loading ? 'Searching…' : `Results for "${query}"`)
          : 'What are you looking for?'}
      </h1>

      <form class="search__form" on:submit={onSubmit} role="search">
        <input type="search"
               class="search__input"
               placeholder="e.g. Porsche, AMG carbon, Cartier, vintage watch"
               bind:value={query}
               autocomplete="off" />
        <button type="submit" class="evx-btn evx-btn--primary search__submit">Search</button>
      </form>
    </header>

    {#if loading}
      <div class="search__results">
        <div class="result-section">
          <h2 class="result-section__h">Listings</h2>
          <div class="listings-grid">
            {#each Array(6) as _, i (i)}<LoadingCard />{/each}
          </div>
        </div>
      </div>

    {:else if searched && listings.length === 0 && tradespeople.length === 0}
      <div class="empty">
        <span class="evx-label" style="color: var(--evx-fox-orange);">NO MATCHES</span>
        <h2 class="empty__h">No results for "{query}".</h2>
        <p class="empty__sub">
          Try a different search, fewer words, or browse a category.
        </p>
        <div class="empty__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>Back to home →</button>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/trade')}>Browse TRADE</button>
        </div>
      </div>

    {:else if searched}
      <div class="search__results">

        {#if listings.length > 0}
          <section class="result-section">
            <div class="result-section__head">
              <h2 class="result-section__h">Listings · {listings.length}</h2>
            </div>
            <div class="listings-grid">
              {#each listings as l (l.id)}
                <ListingCard listing={l} />
              {/each}
            </div>
          </section>
        {/if}

        {#if tradespeople.length > 0}
          <section class="result-section">
            <div class="result-section__head">
              <h2 class="result-section__h">Tradespeople · {tradespeople.length}</h2>
              <button class="evx-caption result-section__all"
                      on:click={() => navigate('/trade')}>
                All trades →
              </button>
            </div>
            <div class="trades-grid">
              {#each tradespeople as t (t.id)}
                <button class="trade-card" on:click={() => navigate(`/trade/${t.trade}/${t.slug ?? t.id}`)}>
                  <div class="trade-card__head">
                    <span class="evx-label trade-card__trade">{t.trade}</span>
                    {#if t.tier === 'pro'}<span class="trade-card__pro">PRO</span>{/if}
                  </div>
                  <h3 class="trade-card__name">{t.name}</h3>
                  {#if t.tagline}
                    <p class="trade-card__tag">{t.tagline}</p>
                  {/if}
                  <div class="trade-card__meta">
                    {#if t.town || t.county}
                      <span class="evx-caption">{[t.town, t.county].filter(Boolean).join(', ')}</span>
                    {/if}
                    {#if t.rating}
                      <span class="evx-caption">★ {t.rating}</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </section>
        {/if}
      </div>

    {:else}
      <div class="search__suggest">
        <p class="evx-caption" style="color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md);">
          POPULAR CATEGORIES
        </p>
        <div class="search__suggest-grid">
          {#each ['automotive', 'watches', 'fashion', 'tech', 'home-design', 'audio-vinyl', 'art'] as slug}
            <button class="search__chip" on:click={() => navigate(`/${slug}`)}>
              {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          {/each}
        </div>
      </div>
    {/if}

  </div>
</main>

<Footer />

<style>
  .search { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .search__head {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .search__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }

  .search__h {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: var(--evx-space-xl);
  }

  .search__form {
    display: flex;
    gap: var(--evx-space-md);
    align-items: center;
    max-width: 640px;
  }

  .search__input {
    flex: 1;
    font-family: var(--evx-font-display);
    font-size: 16px;
    color: var(--evx-warm-black);
    background: var(--evx-white);
    border: 1px solid var(--evx-rule-light);
    padding: 12px 16px;
    outline: none;
  }
  .search__input:focus { border-color: var(--evx-warm-black); }

  .search__submit { flex-shrink: 0; }

  /* Result sections */
  .result-section { margin-bottom: var(--evx-space-3xl); }
  .result-section__head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--evx-space-lg); }
  .result-section__h { font-family: var(--evx-font-display); font-size: 20px; font-weight: 500; letter-spacing: -0.01em; }
  .result-section__all { background: none; border: none; color: var(--evx-ink-soft); cursor: pointer; }
  .result-section__all:hover { color: var(--evx-warm-black); }

  .listings-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-xl); }

  .trades-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--evx-space-md); }

  .trade-card {
    text-align: left;
    border: 1px solid var(--evx-rule-light);
    background: var(--evx-paper);
    padding: var(--evx-space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .trade-card:hover { background: rgba(0,0,0,0.02); }

  .trade-card__head { display: flex; justify-content: space-between; align-items: center; }
  .trade-card__trade { color: var(--evx-fox-orange); text-transform: uppercase; }
  .trade-card__pro { font-family: var(--evx-font-mono); font-size: 10px; padding: 2px 6px; background: var(--evx-warm-black); color: var(--evx-paper); letter-spacing: 0.08em; }

  .trade-card__name { font-family: var(--evx-font-display); font-size: 17px; font-weight: 500; }
  .trade-card__tag { font-size: 13px; line-height: 1.5; color: var(--evx-ink-soft); }
  .trade-card__meta { display: flex; justify-content: space-between; padding-top: var(--evx-space-sm); border-top: 1px solid var(--evx-rule-light); color: var(--evx-ink-soft); }

  /* Empty */
  .empty {
    padding: var(--evx-space-3xl) 0;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    max-width: 560px;
  }
  .empty__h { font-family: var(--evx-font-display); font-size: 28px; font-weight: 500; letter-spacing: -0.01em; color: var(--evx-warm-black); }
  .empty__sub { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); }
  .empty__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; margin-top: var(--evx-space-md); }

  /* Suggest (no query) */
  .search__suggest { padding-top: var(--evx-space-xl); }
  .search__suggest-grid { display: flex; gap: var(--evx-space-sm); flex-wrap: wrap; }
  .search__chip {
    font-family: var(--evx-font-display);
    font-size: 13px;
    padding: 10px 16px;
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    color: var(--evx-warm-black);
    transition: var(--evx-transition);
  }
  .search__chip:hover { border-color: var(--evx-warm-black); }

  @media (max-width: 1023px) {
    .listings-grid { grid-template-columns: repeat(2, 1fr); }
    .trades-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 767px) {
    .listings-grid { grid-template-columns: 1fr; }
    .trades-grid { grid-template-columns: 1fr; }
    .search__form { flex-direction: column; align-items: stretch; }
  }
</style>
