<script lang="ts">
  // ============================================================
  // ProductCard, the one catalogue card. Light, bordered, flat.
  //
  // A photo on a neutral tile, a mono tag, a title, a price. No
  // ratings, no badges, no "X viewing", no cart button, the card
  // routes to the product page and the buying happens there.
  //
  // Where a shot doesn't exist yet it renders a designed slot with a
  // mono annotation rather than a simulated product photograph.
  // ============================================================
  import { navigate } from './router';
  import { formatPrice, type ListingWithExtras } from './api';

  export let listing: ListingWithExtras;
  export let base: string = '/wheels';

  $: isDrive = listing.is_drive === true;
  $: image = listing.cover_image ?? listing.images?.[0]?.public_url ?? null;
  $: tag = isDrive
    ? `DRIVE ${listing.drive_issue ?? ''}`.trim()
    : (listing.vehicle_make ?? 'THE RANGE');
  $: href = `${base}/${listing.slug ?? listing.id}`;
</script>

<button class="pc" type="button" on:click={() => navigate(href)}>
  <div class="pc__tile evx-tile" class:evx-tile--woven={!image}>
    {#if image}
      <img src={image} alt={listing.title} loading="lazy" />
    {/if}
    <span class="pc__tag" class:pc__tag--drive={isDrive}>{tag}</span>
  </div>

  <div class="pc__body">
    <span class="pc__title">{listing.title}</span>
    {#if listing.subtitle}<span class="pc__sub">{listing.subtitle}</span>{/if}
    <span class="pc__price-row">
      {#if listing.price > 0}
        <span class="pc__price">{formatPrice(listing.price)}</span>
        {#if listing.original_price && listing.original_price > listing.price}
          <span class="pc__was">Was {formatPrice(listing.original_price)}</span>
        {/if}
      {:else}
        <span class="pc__price pc__price--tbc">Price on enquiry</span>
      {/if}
    </span>
  </div>
</button>

<style>
  .pc {
    display: flex;
    flex-direction: column;
    width: 100%;
    /* Lets the card shrink inside its track so the ellipsis can bite. */
    min-width: 0;
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 0;
    text-align: left;
    transition: var(--evx-transition);
  }
  .pc:hover { opacity: 0.86; }

  .pc__tile {
    aspect-ratio: 5 / 6;
    border-bottom: 1px solid var(--evx-rule-hair);
  }
  .pc__tile > img { height: 100%; }

  .pc__tag {
    position: absolute;
    z-index: 1;
    top: 10px;
    left: 10px;
    font-family: var(--evx-font-mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 3px 6px;
    line-height: 1;
  }
  /* Champagne is DRIVE-only, and only ever as type on a plate. */
  .pc__tag--drive { color: var(--evx-champagne); border-color: var(--evx-champagne); }

  .pc__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 5px;
    padding: var(--evx-space-lg) var(--evx-space-md) var(--evx-space-lg);
  }
  .pc__title {
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.25;
    color: var(--evx-ink);
  }
  .pc__sub {
    font-size: 13px;
    line-height: 1.4;
    color: var(--evx-ink-soft);
  }
  .pc__price-row {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-sm);
    margin-top: 3px;
  }
  .pc__price {
    font-family: var(--evx-font-display);
    font-size: 17px;
    font-weight: 500;
    color: var(--evx-ink);
  }
  .pc__price--tbc { font-size: 13px; color: var(--evx-ink-soft); }
  /* Never a strikethrough, never "SAVE €X", a quiet mono was-price. */
  .pc__was {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-faint);
  }

  /* Two-up on a phone: tighter, and the subtitle held to one line so
     the cards do not go ragged against each other. */
  @media (max-width: 599px) {
    .pc__body { padding: 10px; gap: 3px; }
    .pc__title { font-size: 13.5px; line-height: 1.3; }
    .pc__sub {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pc__price { font-size: 13.5px; }
    .pc__was { font-size: 9.5px; }
    .pc__tag { font-size: 8px; top: 7px; left: 7px; padding: 2px 5px; }
  }
</style>
