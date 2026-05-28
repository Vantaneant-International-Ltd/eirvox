<script lang="ts">
  import type { Listing } from '../data/listings';
  import { getSeller, formatPrice } from '../data/listings';
  import { savedItems } from '../data/user';
  import SellerPill from './SellerPill.svelte';
  import { navigate } from './router';

  export let listing: Listing;
  export let showBookmark: boolean = true;

  $: seller = getSeller(listing.sellerId);

  let saved = savedItems.includes(listing.slug);

  function toggleSave(e: MouseEvent) {
    e.stopPropagation();
    saved = !saved;
  }

  function handleBookmarkKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
      e.preventDefault();
      saved = !saved;
    }
  }

  const bg = [
    '#2A2825', '#3A3632', '#31302D', '#282624',
    '#35312E', '#2E2C29', '#373430', '#2C2A27',
  ];

  // Deterministic bg pick from slug
  $: cardBg = bg[listing.id.charCodeAt(0) % bg.length];
</script>

<div
  class="card"
  on:click={() => navigate(`/listing/${listing.slug}`)}
  on:keydown={(e) => e.key === 'Enter' && navigate(`/listing/${listing.slug}`)}
  tabindex="0"
  role="link"
  aria-label="{listing.title} — {formatPrice(listing.price)}"
>
  <!-- Image area 5:6 ratio -->
  <div class="card__image" style="background: {cardBg}">
    {#if listing.isDrive}
      <span class="evx-caption card__drive-badge">{listing.driveIssue}</span>
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

    <div class="card__placeholder">
      <span class="evx-caption card__placeholder-text">{listing.title}</span>
    </div>
    {#if listing.listingId}
      <span class="evx-caption card__id">{listing.listingId}</span>
    {/if}
  </div>

  <!-- Card body -->
  <div class="card__body">
    <span class="evx-label card__eyebrow">
      {listing.subcategory}
      {#if listing.condition}
        · {listing.condition}
      {/if}
    </span>

    <h3 class="card__title">{listing.title}</h3>

    {#if listing.subtitle}
      <p class="card__subtitle">{listing.subtitle}</p>
    {/if}

    <div class="card__meta">
      <div class="card__price-row">
        <span class="card__price">{formatPrice(listing.price)}</span>
        {#if listing.stock !== undefined}
          <span class="evx-caption card__stock">{listing.stock}/{listing.stockTotal} remaining</span>
        {:else}
          <span class="evx-caption card__location">{listing.city}</span>
        {/if}
      </div>
      {#if seller}
        <SellerPill tier={seller.tier} name={seller.name} rating={seller.rating} compact={false} />
      {/if}
    </div>
  </div>
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: var(--evx-transition);
    outline: none;
  }

  .card:hover { opacity: 0.88; }
  .card:focus-visible { outline: 2px solid var(--evx-fox-orange); outline-offset: 2px; }

  .card__image {
    position: relative;
    aspect-ratio: 5 / 6;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card__drive-badge {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 6px;
    z-index: 1;
  }

  .card__bookmark {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    width: 28px; height: 28px;
    background: rgba(26, 26, 26, 0.55);
    border: none;
    color: var(--evx-paper);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 200ms ease, color 200ms ease;
    z-index: 2;
  }
  .card__bookmark:hover { background: rgba(26, 26, 26, 0.80); }
  .card__bookmark--saved { color: var(--evx-fox-orange); background: rgba(26, 26, 26, 0.80); }
  .card__bookmark:focus-visible { outline: 2px solid var(--evx-fox-orange); outline-offset: 2px; }

  .card__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: var(--evx-space-xl);
  }

  .card__placeholder-text {
    color: rgba(245, 242, 237, 0.25);
    text-align: center;
    line-height: 1.5;
  }

  .card__id {
    position: absolute;
    bottom: var(--evx-space-md);
    right: var(--evx-space-md);
    color: rgba(245, 242, 237, 0.30);
  }

  .card__body {
    padding: var(--evx-space-md) 0;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .card__eyebrow {
    color: var(--evx-ink-soft);
  }

  .card__title {
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    margin: 2px 0;
  }

  .card__subtitle {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    color: var(--evx-ink-soft);
    line-height: 1.5;
  }

  .card__meta {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
  }

  .card__price-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .card__price {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 18px;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }

  .card__location,
  .card__stock {
    color: var(--evx-ink-soft);
  }
</style>
