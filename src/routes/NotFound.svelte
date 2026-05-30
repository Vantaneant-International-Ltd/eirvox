<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate, currentPath } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { getCategories, getFeaturedListings, type Category, type ListingWithExtras } from '../lib/api';

  let categories: Category[] = [];
  let featured: ListingWithExtras[] = [];

  onMount(async () => {
    applySeo(seo.notFound());
    [categories, featured] = await Promise.all([
      getCategories(),
      getFeaturedListings(3),
    ]);
  });

  $: attempted = $currentPath;
</script>

<Nav />

<main id="main-content" class="nf-page">
  <div class="page-container">

    <header class="nf-header">
      <span class="evx-caption nf-header__pre">ERROR · 404 · ROUTE NOT FOUND</span>
      <h1 class="nf-title">
        This page doesn't exist.
        <em class="nf-title__italic">The marketplace is waiting.</em>
      </h1>
      <p class="nf-sub">
        We couldn't find anything at <span class="nf-path"><span class="nf-path__hash">#</span>{attempted}</span>.
        It may have moved, been removed, or the link was mistyped.
      </p>

      <div class="nf-actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>
          Back to home →
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/automotive')}>
          Browse marketplace
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sitemap')}>
          Sitemap
        </button>
      </div>
    </header>

    <!-- Shortcuts -->
    <section class="nf-shortcuts">
      <div class="nf-shortcuts__head">
        <span class="evx-label">START HERE</span>
      </div>

      <div class="nf-cats">
        {#each categories as cat}
          <button class="nf-cat" on:click={() => navigate(`/${cat.slug}`)}>
            <span class="nf-cat__name">{cat.name}</span>
            <span class="evx-caption nf-cat__arrow">→</span>
          </button>
        {/each}
      </div>
    </section>

    <!-- Suggested listings -->
    <section class="nf-suggested">
      <div class="nf-shortcuts__head">
        <span class="evx-label">OR DROP INTO A LISTING</span>
      </div>
      {#if featured.length === 0}
        <p style="color: var(--evx-ink-soft); font-size: 14px; padding: var(--evx-space-md) 0;">
          No featured listings yet — they'll appear here as soon as Cohort 03 sellers go live.
        </p>
      {:else}
        <div class="nf-listings">
          {#each featured as l (l.id)}
            <button class="nf-listing" on:click={() => navigate(`/listing/${l.slug ?? l.id}`)}>
              <div class="nf-listing__thumb">
                {#if l.cover_image}<img src={l.cover_image} alt="" style="width:100%;height:100%;object-fit:cover;" />{/if}
              </div>
              <div class="nf-listing__body">
                <strong class="nf-listing__title">{l.title}</strong>
                <span class="evx-caption nf-listing__meta">
                  {l.subcategory ?? l.category_slug ?? ''}{(l.subcategory || l.category_slug) && l.city ? ' · ' : ''}{l.city ?? ''}
                </span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </section>

    <p class="nf-help evx-caption">
      Found a broken link on Éirvox? Email
      <a href="mailto:renato@eirvox.ie" class="nf-help__link">renato@eirvox.ie</a>
      with the URL and we'll fix it.
    </p>

  </div>
</main>

<Footer />

<style>
  .nf-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .nf-header {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
    max-width: 760px;
  }

  .nf-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-lg); }

  .nf-title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-lg);
  }

  .nf-title__italic {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
  }

  .nf-sub {
    font-size: 16px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-xl);
  }

  .nf-path {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-family: var(--evx-font-mono);
    font-size: 13px;
    background: rgba(0,0,0,0.04);
    padding: 2px 8px;
    color: var(--evx-warm-black);
    word-break: break-all;
  }

  .nf-path__hash { color: var(--evx-ink-soft); }

  .nf-actions {
    display: flex;
    gap: var(--evx-space-md);
    flex-wrap: wrap;
  }

  /* Shortcuts */
  .nf-shortcuts { margin-bottom: var(--evx-space-2xl); }
  .nf-shortcuts__head { margin-bottom: var(--evx-space-md); }
  .nf-shortcuts__head span { color: var(--evx-ink-soft); }

  .nf-cats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
    border: 1px solid var(--evx-rule-light);
  }

  .nf-cat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--evx-space-md);
    background: none;
    border: none;
    border-right: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: background 200ms ease;
  }
  .nf-cat:hover { background: rgba(0,0,0,0.02); }
  .nf-cat:nth-child(4n) { border-right: none; }
  .nf-cat:nth-last-child(-n+4) { border-bottom: none; }

  .nf-cat__name {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .nf-cat__arrow { color: var(--evx-ink-soft); }

  /* Suggested */
  .nf-suggested { margin-bottom: var(--evx-space-2xl); }

  .nf-listings {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
  }

  .nf-listing {
    display: grid;
    grid-template-columns: 60px 1fr;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    background: none;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
    align-items: center;
  }
  .nf-listing:hover { border-color: var(--evx-warm-black); }

  .nf-listing__thumb {
    width: 60px; height: 72px;
    background: var(--evx-graphite);
  }
  .nf-listing__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .nf-listing__title {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-warm-black);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .nf-listing__meta { color: var(--evx-ink-soft); }

  .nf-help {
    color: var(--evx-ink-soft);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }
  .nf-help__link {
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 1023px) {
    .nf-cats { grid-template-columns: repeat(2, 1fr); }
    .nf-cat:nth-child(4n) { border-right: 1px solid var(--evx-rule-light); }
    .nf-cat:nth-child(2n) { border-right: none; }
    .nf-cat:nth-last-child(-n+4) { border-bottom: 1px solid var(--evx-rule-light); }
    .nf-cat:nth-last-child(-n+2) { border-bottom: none; }
    .nf-listings { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .nf-cats { grid-template-columns: 1fr; }
    .nf-cat { border-right: none !important; }
  }
</style>
