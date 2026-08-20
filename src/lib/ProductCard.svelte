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
  // Sold out is read from live data, never hardcoded: the issue is
  // closed, or nothing is left of the run.
  $: soldOut = isDrive
    && (listing.drive_issue_state === 'archived' || listing.drive_remaining_count === 0);
  // Sorted, because listing_images comes back in whatever order the
  // join felt like and the second shot is the one that peeks on hover.
  $: gallery = (listing.images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(i => i.public_url)
    .filter(Boolean) as string[];
  $: image = listing.cover_image ?? gallery[0] ?? null;
  $: peek = gallery.find(u => u !== image) ?? null;
  $: tag = isDrive
    ? `DRIVE ${listing.drive_issue ?? ''}`.trim()
    : (listing.vehicle_make ?? 'THE RANGE');
  $: href = `${base}/${listing.slug ?? listing.id}`;
</script>

<button class="pc" type="button" on:click={() => navigate(href)}>
  <div class="pc__tile evx-tile" class:evx-tile--woven={!image} class:pc__tile--shot={!!image} class:pc__tile--sold={soldOut}>
    {#if image}
      <img class="pc__img" src={image} alt={listing.title} loading="lazy" />
      {#if peek}
        <!-- The second shot, revealed on hover. Hidden from assistive
             tech: it is the same product, not new information. -->
        <img class="pc__img pc__img--peek" src={peek} alt="" aria-hidden="true" loading="lazy" />
      {/if}
    {/if}
    <span class="pc__tag" class:pc__tag--drive={isDrive}>{tag}</span>
  </div>

  <div class="pc__body">
    <span class="pc__title">{listing.title}</span>
    <span class="pc__sub">{listing.subtitle ?? ''}</span>

    <!-- One status line, in the same position on every card. -->
    <span class="pc__foot">
      <span class="pc__status" class:pc__status--sold={soldOut}>
        <span class="pc__dot" aria-hidden="true"></span>
        {#if soldOut}
          Sold out · {listing.drive_made_count ?? 0} of {listing.drive_made_count ?? 0}
        {:else}
          Available now
        {/if}
      </span>
      {#if !soldOut}
        <span class="pc__price-row">
          {#if listing.price > 0}
            <span class="pc__price">{formatPrice(listing.price)}</span>
            {#if listing.original_price && listing.original_price > listing.price}
              <span class="pc__was">Was {formatPrice(listing.original_price)}</span>
            {/if}
          {:else}
            <span class="pc__price pc__price--tbc">On enquiry</span>
          {/if}
        </span>
      {/if}
    </span>
  </div>
</button>

<style>
  /* No border, no card. The tile is the card and the type sits under
     it on the page ground, the way a luxury grid is built. */
  .pc {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
  }


  .pc__tile {
    aspect-ratio: 4 / 5;
    background: var(--evx-paper-tile);
    transition: background 300ms ease;
  }
  @media (hover: hover) {
    .pc:hover .pc__tile { background: var(--evx-paper-tile-hi); }
  }
  /* Reads as unavailable before a word is read, and still lets the
     wheel look like the reason you came. */
  .pc__tile--sold { background: #DCDAD6; }
  .pc__tile--sold .pc__img { filter: saturate(0.15) brightness(1.06) opacity(0.82); }
  /* cover, not contain. These are real photographs with their own
     backgrounds, and contain left each one floating as a brighter
     rectangle inside a tile of a different tone: band, then tile, then
     photo, three greys stacked per card. Cover fills the tile edge to
     edge, so the photo IS the card and there is one tone, not three.
     It is also how the luxury grids are built. */
  .pc__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    transition: opacity 200ms ease;
  }
  .pc__img--peek { opacity: 0; }
  /* Hover only: on touch there is no hover, so the first shot stands.
     The base shot fades OUT as the second fades in. Crossfading into a
     still-opaque first shot is what read as a double exposure, and two
     unrelated photographs blended half way looks like a fault. */
  @media (hover: hover) {
    .pc:hover .pc__img:not(.pc__img--peek) { opacity: 0; }
    .pc:hover .pc__img--peek { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pc__img { transition: none; }
  }

  /* The tag sits on photography now rather than on a flat plate, so it
     carries its own ground. A small solid chip, not a gradient scrim:
     a scrim leaves a visible light haze across the top of a dark
     cockpit shot, and a haze reads as a fault rather than a label. */

  .pc__tag {
    position: absolute;
    z-index: 2;
    top: 12px;
    left: 12px;
    font-family: var(--evx-font-mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(10, 10, 10, 0.62);
    background: none;
    border: none;
    padding: 0;
    line-height: 1;
  }
  /* Only where there is a photograph under it. On the woven placeholder
     the tile is already flat and the chip would be a box for nothing. */
  .pc__tile--shot .pc__tag {
    color: rgba(10, 10, 10, 0.72);
    background: rgba(247, 247, 246, 0.94);
    padding: 5px 7px;
  }
  /* Champagne is DRIVE-only, and only ever as type on a plate. */
  .pc__tag--drive,
  .pc__tile--shot .pc__tag--drive { color: #8A6D2F; }

  .pc__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 3px;
    padding: var(--evx-space-md) 2px 0;
  }
  /* Clamped so every card in a row is the same height and the status
     lines share a baseline. Ragged titles were the misalignment. */
  .pc__title {
    font-family: var(--evx-font-display);
    font-size: 15.5px;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.25;
    color: var(--evx-ink);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
    min-height: 2.5em;
  }
  .pc__sub {
    font-size: 12.5px;
    line-height: 1.4;
    color: var(--evx-ink-soft);
    min-height: 1.4em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pc__foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--evx-space-sm);
    margin-top: 6px;
  }
  .pc__status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .pc__dot {
    width: 6px;
    height: 6px;
    flex-shrink: 0;
    background: var(--evx-fox-orange);
  }
  /* Sold out is a hollow mark, not a black slab across the photograph. */
  .pc__status--sold .pc__dot {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--evx-ink-faint);
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
    .pc__was { display: none; }
    .pc__status { font-size: 8.5px; letter-spacing: 0.06em; gap: 5px; }
    .pc__foot { gap: 6px; }
    .pc__tag { font-size: 8px; top: 7px; left: 7px; padding: 2px 5px; }
  }
</style>
