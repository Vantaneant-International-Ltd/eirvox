<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from './router';
  import { auth } from './auth';
  import { formatPrice, saveListing, unsaveListing, getMySavedItems } from './api';
  import type { ListingWithExtras, Seller } from './api';
  import SellerPill from './SellerPill.svelte';

  export let listing: ListingWithExtras;
  export let showBookmark: boolean = true;

  // Local saved state, kept in sync with the user's saved_items
  let saved = false;
  let savedReady = false;

  onMount(async () => {
    if (!$auth.user) { savedReady = true; return; }
    const ids = await getMySavedItems();
    saved = ids.includes(listing.id);
    savedReady = true;
  });

  async function toggleSave(e: MouseEvent) {
    e.stopPropagation();
    if (!$auth.user) { navigate('/login'); return; }
    saved = !saved; // optimistic
    const r = saved ? await saveListing(listing.id) : await unsaveListing(listing.id);
    if (!r.ok) saved = !saved; // revert
  }

  function handleBookmarkKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      void toggleSave(e as unknown as MouseEvent);
    }
  }

  // Deterministic placeholder colour from the id
  const bg = ['#2A2825', '#3A3632', '#31302D', '#282624', '#35312E', '#2E2C29', '#373430', '#2C2A27'];
  $: cardBg = bg[(listing.id?.charCodeAt(0) ?? 65) % bg.length];

  // Display tier (uppercase) - Supabase tiers are lower-case
  $: tier = (listing.seller?.tier ?? 'verified').toUpperCase() as 'HOUSE' | 'ATELIER' | 'VERIFIED';

  // Subtitle line - prefer subcategory, then condition, then subtitle
  $: eyebrow = listing.subcategory
    || (listing.category_slug ? prettyCategory(listing.category_slug) : '')
    || '';
  $: showCondition = !!listing.condition;

  function prettyCategory(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  $: slug = listing.slug ?? listing.id;

  // Defensive accessor for cover image
  $: cover = listing.cover_image ?? null;
</script>

<div
  class="card"
  on:click={() => navigate(`/listing/${slug}`)}
  on:keydown={(e) => e.key === 'Enter' && navigate(`/listing/${slug}`)}
  tabindex="0"
  role="link"
  aria-label="{listing.title} - {formatPrice(listing.price)}"
>
  <!-- Image area 5:6 ratio -->
  <div class="card__image" style={cover ? '' : `background: ${cardBg}`}>
    {#if cover}
      <img class="card__img" src={cover} alt={listing.title} loading="lazy" />
    {/if}

    {#if listing.featured}
      <span class="evx-caption card__badge">FEATURED</span>
    {/if}

    {#if showBookmark}
      <button
        type="button"
        class="card__bookmark"
        class:card__bookmark--saved={saved}
        on:click={toggleSave}
        on:keydown={handleBookmarkKey}
        aria-label={saved ? 'Remove from saved' : 'Save for later'}
        aria-pressed={saved}
      >
        {#if saved}
          <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true">
            <path d="M1 1h12v14L7 11l-6 4V1z"/>
          </svg>
        {:else}
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
            <path d="M1 1h12v14L7 11l-6 4V1z"/>
          </svg>
        {/if}
      </button>
    {/if}

    {#if !cover}
      <div class="card__placeholder">
        <span class="evx-caption card__placeholder-text">{listing.title}</span>
      </div>
    {/if}
  </div>

  <!-- Card body -->
  <div class="card__body">
    {#if eyebrow}
      <span class="evx-label card__eyebrow">
        {eyebrow}
        {#if showCondition}· {listing.condition}{/if}
      </span>
    {/if}

    <h3 class="card__title">{listing.title}</h3>

    {#if listing.subtitle}
      <p class="card__subtitle">{listing.subtitle}</p>
    {/if}

    <div class="card__meta">
      <div class="card__price-row">
        <span class="card__price">{formatPrice(listing.price)}</span>
        <span class="evx-caption card__location">{listing.city ?? ''}</span>
      </div>
      {#if listing.seller}
        <SellerPill tier={tier} name={listing.seller.trading_name} rating={listing.seller.rating ?? null} compact={false} />
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    display: flex; flex-direction: column;
    height: 100%;                          /* fill the grid cell so siblings line up */
    cursor: pointer; transition: var(--evx-transition); outline: none;
  }
  .card:hover { opacity: 0.88; }
  .card:focus-visible { outline: 2px solid var(--evx-fox-orange); outline-offset: 2px; }

  .card__image { position: relative; aspect-ratio: 5 / 6; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .card__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  .card__badge {
    position: absolute; top: var(--evx-space-md); left: var(--evx-space-md);
    background: var(--evx-fox-orange); color: var(--evx-white); padding: 2px 6px; z-index: 1;
  }

  .card__bookmark {
    position: absolute; top: var(--evx-space-md); right: var(--evx-space-md);
    width: 28px; height: 28px;
    background: rgba(26, 26, 26, 0.55); border: none; color: var(--evx-paper);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 200ms ease, color 200ms ease; z-index: 2;
  }
  .card__bookmark:hover { background: rgba(26, 26, 26, 0.80); }
  .card__bookmark--saved { color: var(--evx-fox-orange); background: rgba(26, 26, 26, 0.80); }
  .card__bookmark:focus-visible { outline: 2px solid var(--evx-fox-orange); outline-offset: 2px; }

  .card__placeholder {
    display: flex; align-items: center; justify-content: center;
    width: 100%; height: 100%; padding: var(--evx-space-xl);
  }
  .card__placeholder-text { color: rgba(245, 242, 237, 0.25); text-align: center; line-height: 1.5; }

  .card__body {
    padding: var(--evx-space-md) 0;
    display: flex; flex-direction: column; gap: var(--evx-space-xs);
    flex: 1;                                /* stretches so meta row hits the bottom */
  }
  .card__eyebrow { color: var(--evx-ink-soft); }
  .card__title {
    font-family: var(--evx-font-display); font-size: 16px; font-weight: 500;
    line-height: 1.25; letter-spacing: -0.01em; color: var(--evx-warm-black); margin: 2px 0;
    /* cap the title at two lines so wildly long titles can't shove the
       price out of alignment vs siblings */
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card__subtitle {
    font-family: var(--evx-font-mono); font-size: 11px; color: var(--evx-ink-soft); line-height: 1.5;
    /* same trick - cap at two lines so a verbose 'Stage 1 mapped · Res
       delete · 220-240bhp' kind of line doesn't bleed past its sibling */
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card__meta {
    display: flex; flex-direction: column; gap: var(--evx-space-sm);
    margin-top: auto;                       /* pin to bottom of the body */
    padding-top: var(--evx-space-sm); border-top: 1px solid var(--evx-rule-light);
  }
  .card__price-row { display: flex; justify-content: space-between; align-items: baseline; }
  .card__price { font-family: var(--evx-font-display); font-weight: 500; font-size: 18px; letter-spacing: -0.01em; color: var(--evx-warm-black); }
  .card__location { color: var(--evx-ink-soft); }
</style>
