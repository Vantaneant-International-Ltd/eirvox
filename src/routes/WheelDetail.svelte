<script lang="ts">
  // ============================================================
  // /wheels/:slug, the product page. Light, two-column, conventional.
  //
  // Gallery left (sticky), buy panel right, then specification,
  // dimensions, and the detail accordions. DRIVE and the fitted range
  // share this page; DRIVE only adds the edition line and the
  // champagne issue plate.
  //
  // COMMERCE IS UNCHANGED. Same VariantPicker + PayButton + server-side
  // amount resolution as before, the server resolves price and stock,
  // the client never sets an amount. Only the surface is new.
  // ============================================================
  import { onMount } from 'svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import {
    getListingBySlug, getListingVariants, formatPrice,
    type ListingWithExtras,
  } from '../lib/api';
  import PayButton from '../lib/PayButton.svelte';
  import VariantPicker from '../lib/VariantPicker.svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';

  export let slug: string;

  let loading = true;
  let listing: ListingWithExtras | null = null;
  let hasVariants = false;
  let activeImage = 0;

  async function load() {
    loading = true;
    activeImage = 0;
    listing = await getListingBySlug(slug);
    if (!listing) { loading = false; return; }

    applySeo(seo.listing(
      listing.title,
      listing.subtitle ?? '',
      formatPrice(listing.price),
      listing.city ?? '',
      listing.slug ?? listing.id,
    ));

    const vars = await getListingVariants(listing.id);
    hasVariants = vars.length > 0;
    loading = false;
  }

  $: if (slug) void load();
  onMount(() => { if (slug) void load(); });

  // ── Derived ──
  $: isDrive = listing?.is_drive === true;
  $: blurb = listing?.description ?? listing?.subtitle ?? '';
  $: images = listing?.images ?? [];
  $: activeImageUrl = images[activeImage]?.public_url ?? listing?.cover_image ?? null;
  $: specs = (listing?.specs ?? []) as { label: string; value: string }[];

  // ── Pay matrix (unchanged from the previous surface) ──
  $: isHouseListing = !!listing?.seller?.is_house;
  // DRIVE visibility is decoupled from purchasability: an 'active' issue
  // is publicly visible, but the buy controls only open when the issue
  // state is 'open'.
  $: driveOpen = listing?.drive_issue_state === 'open';
  $: payable = isHouseListing && listing?.status === 'active' && !hasVariants
    && (!isDrive || driveOpen);
  $: stockState = (listing?.stock_state ?? 'in_stock') as 'in_stock' | 'incoming';
  $: hasShipping = !!listing?.shipping_available;
  $: hasCollection = !!listing?.collection_available;
  $: depositConfigured = (listing?.deposit_amount ?? 0) > 0;
  $: shippingCostSet = (listing?.shipping_cost ?? 0) > 0;

  let fulfilment: 'collection' | 'delivery' | null = null;
  let isDeposit = false;
  $: if (listing?.id && fulfilment === null) {
    if (hasShipping && shippingCostSet)   fulfilment = 'delivery';
    else if (hasCollection)               fulfilment = 'collection';
    else if (hasShipping)                 fulfilment = 'delivery';
  }
  $: canDeposit = fulfilment === 'collection' && depositConfigured;
  $: mustDeposit = stockState === 'incoming' && fulfilment === 'collection';
  $: if (mustDeposit && !isDeposit) isDeposit = true;
  $: if (!canDeposit && isDeposit) isDeposit = false;
  $: deliverySelectedWithoutShipping = fulfilment === 'delivery' && !shippingCostSet;
  $: canShowPayButton = !!fulfilment && !deliverySelectedWithoutShipping;
  $: payAmount = !listing ? 0
    : isDeposit ? (listing.deposit_amount ?? 0)
    : fulfilment === 'delivery' ? listing.price + (listing.shipping_cost ?? 0)
    : listing.price;
</script>

<Nav />

<main id="main-content" class="pd">
  {#if loading}
    <div class="pd__state page-container">Loading.</div>
  {:else if !listing}
    <div class="pd__state page-container">
      <h1 class="evx-heading">This wheel isn't available.</h1>
      <button class="evx-btn evx-btn--ghost pd__state-cta" on:click={() => navigate('/wheels')}>Back to wheels</button>
    </div>
  {:else}

    <!-- ━━ CRUMB ━━ -->
    <nav class="pd__crumb page-container" aria-label="Breadcrumb">
      <button on:click={() => navigate('/wheels')}>Wheels</button>
      <span aria-hidden="true">/</span>
      <span>{isDrive ? 'DRIVE' : 'The range'}</span>
    </nav>

    <div class="pd__grid page-container">

      <!-- ━━ GALLERY ━━ -->
      <div class="pd__gallery">
        <div class="pd__main evx-tile" class:evx-tile--woven={!activeImageUrl}>
          {#if activeImageUrl}
            <img src={activeImageUrl} alt={listing.title} />
          {/if}
        </div>

        {#if images.length > 1}
          <div class="pd__thumbs">
            {#each images.slice(0, 5) as img, i (img.id)}
              <button class="pd__thumb evx-tile" class:pd__thumb--on={activeImage === i}
                      type="button" on:click={() => (activeImage = i)} aria-label={`View ${i + 1}`}>
                <img src={img.public_url} alt={`${listing.title} view ${i + 1}`} />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- ━━ BUY PANEL ━━ -->
      <div class="pd__panel">
        <div class="pd__tags">
          {#if isDrive}
            <span class="pd__plate">DRIVE {listing.drive_issue ?? ''}</span>
          {:else}
            <span class="evx-label">THE RANGE</span>
          {/if}
          {#if listing.vehicle_make}<span class="evx-label">{listing.vehicle_make}</span>{/if}
        </div>

        <h1 class="pd__title">{listing.title}</h1>
        {#if listing.subtitle}<p class="pd__sub">{listing.subtitle}</p>{/if}

        {#if isDrive}
          <!-- Edition SIZE only. A per-unit serial is gated until a
               database-backed registry record exists (lockfile §8). -->
          <p class="pd__edition">Limited to {listing.drive_made_count ?? 10}. Made once. Not reprinted.</p>
        {/if}

        <div class="pd__price-row">
          <span class="pd__price">{listing.price > 0 ? formatPrice(listing.price) : 'Price on enquiry'}</span>
          {#if listing.original_price && listing.original_price > listing.price}
            <!-- Quiet mono was-price. Never a strikethrough, never "SAVE €X". -->
            <span class="pd__was">Was {formatPrice(listing.original_price)}</span>
          {/if}
        </div>

        <!-- ── Buy path ── -->
        {#if hasVariants}
          <div class="pd__buy">
            <VariantPicker
              listingId={listing.id}
              basePriceEur={listing.price}
              originalPriceEur={listing.original_price ?? null}
              listingTitle={listing.title}
              fulfilment="collection"
            />
          </div>

        {:else if payable}
          <div class="pd__buy">
            {#if isDrive}
              <div class="pd__confirm">
                <span class="evx-label">CONFIRM YOUR CAR</span>
                <p>
                  DRIVE fits a range of cars. We confirm the fit with you before it ships,
                  so tell us the car when you order and we will come back to you.
                </p>
              </div>
            {/if}

            {#if hasCollection && hasShipping}
              <div class="pd__seg" role="group" aria-label="Fulfilment">
                <button class="pd__opt" class:pd__opt--on={fulfilment === 'collection'}
                        type="button" on:click={() => (fulfilment = 'collection')}>Collection</button>
                <button class="pd__opt" class:pd__opt--on={fulfilment === 'delivery'}
                        type="button" on:click={() => (fulfilment = 'delivery')}>Delivery</button>
              </div>
            {/if}

            {#if canDeposit}
              <div class="pd__seg" role="group" aria-label="Payment">
                <button class="pd__opt" class:pd__opt--on={!isDeposit}
                        type="button" on:click={() => (isDeposit = false)}>Pay in full · {formatPrice(listing.price)}</button>
                <button class="pd__opt" class:pd__opt--on={isDeposit}
                        type="button" on:click={() => (isDeposit = true)}>Deposit · {formatPrice(listing.deposit_amount ?? 0)}</button>
              </div>
            {/if}

            <div class="pd__total">
              <span class="evx-label">{isDeposit ? 'DEPOSIT NOW' : fulfilment === 'delivery' ? 'FULL PRICE + SHIPPING' : 'FULL PRICE'}</span>
              <span class="pd__total-fig">{formatPrice(payAmount)}</span>
            </div>

            {#if canShowPayButton}
              <PayButton
                listingId={listing.id}
                amountEur={payAmount}
                fulfilment={fulfilment}
                isDeposit={isDeposit}
                description={`ÉIRVOX · ${listing.title}`}
                showRefundLink={true}
              />
            {:else}
              <p class="pd__hint">Choose collection or delivery to continue.</p>
            {/if}

            {#if isDeposit}
              <p class="pd__hint">The deposit holds it for you. The balance is due when you collect.</p>
            {/if}
          </div>

        {:else if isDrive}
          <!-- Visible but not open: an honest state, no buy control. -->
          <div class="pd__buy pd__arrive">
            {#if listing.drive_issue_state === 'archived'}
              <span class="evx-label">DRIVE</span>
              <p class="pd__arrive-line">This issue is closed.</p>
            {:else}
              <span class="evx-label">ARRIVING</span>
              <p class="pd__arrive-line">{listing.drive_issue_date ?? 'Date to be confirmed'}</p>
              <p class="pd__hint">On sale when the run begins.</p>
            {/if}
          </div>

        {:else}
          <div class="pd__buy">
            <button class="evx-btn evx-btn--primary evx-btn--full" on:click={() => navigate('/wheels#fitment')}>
              Find your fit →
            </button>
          </div>
        {/if}

        <ul class="pd__assure">
          <li>Designed in Ireland, assembled abroad, finished in Dublin.</li>
          <li>If it isn't right, it doesn't ship.</li>
          {#if hasCollection}<li>Collect it from us in Dublin if you would rather.</li>{/if}
        </ul>
      </div>
    </div>

    <!-- ━━ SPECIFICATION ━━ -->
    {#if specs.length}
    <section class="evx-section evx-band pd__specs-band">
      <div class="page-container pd__specs">
        <div>
          <span class="evx-label">SPECIFICATION</span>
          <h2 class="evx-subhead pd__specs-h">What it is.</h2>
        </div>
        <dl class="pd__rows">
          {#each specs as sp (sp.label)}
            <div class="pd__row"><dt>{sp.label}</dt><dd>{sp.value}</dd></div>
          {/each}
        </dl>
      </div>
    </section>
    {/if}

    <!-- ━━ DETAIL ━━ -->
    <section class="evx-section">
      <div class="page-container pd__detail">
        {#if blurb}
          <details class="pd__acc" open>
            <summary>The detail</summary>
            <div class="pd__acc-body"><p>{blurb}</p></div>
          </details>
        {/if}
        <details class="pd__acc">
          <summary>Shipping &amp; collection</summary>
          <div class="pd__acc-body">
            <p>Posted anywhere in Ireland, packed to travel.</p>
            {#if hasCollection}<p>Collect it from us in Dublin if you would rather.</p>{/if}
            {#if isDrive && payable}
              <p>Made to order; ships when the run is finished{listing.drive_issue_date ? ` in ${listing.drive_issue_date}` : ''}.</p>
            {/if}
          </div>
        </details>
        <details class="pd__acc">
          <summary>Payment &amp; returns</summary>
          <div class="pd__acc-body">
            <p>Payment is taken directly by card, Apple Pay or Google Pay. There is no cart. Each wheel is paid for on its own page.</p>
            <p>Where a deposit is offered, it holds the wheel and the balance is due on collection.</p>
            <p><button class="evx-link" on:click={() => navigate('/refund-policy')}>Read the refund policy</button></p>
          </div>
        </details>
      </div>
    </section>
  {/if}
</main>

<Footer />

<style>
  .pd__state { padding-top: var(--evx-space-3xl); padding-bottom: var(--evx-space-3xl); }
  .pd__state-cta { margin-top: var(--evx-space-lg); }

  .pd__crumb {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-lg);
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .pd__crumb button { font: inherit; letter-spacing: inherit; color: inherit; background: none; border: none; padding: 0; }
  .pd__crumb button:hover { color: var(--evx-ink); }

  /* ── Layout ── */
  .pd__grid {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: var(--evx-space-3xl);
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-3xl);
    align-items: start;
  }

  /* ── Gallery ── */
  .pd__main { aspect-ratio: 1 / 1; }
  .pd__main > img { height: 100%; }
  .pd__thumbs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-sm);
  }
  .pd__thumb {
    aspect-ratio: 1 / 1;
    border: 1px solid transparent;
    padding: 0;
  }
  .pd__thumb--on { border-color: var(--evx-ink); }
  .pd__thumb > img { height: 100%; }

  /* ── Panel ── */
  .pd__panel { position: sticky; top: calc(var(--evx-nav-height) + 24px); }
  .pd__tags { display: flex; align-items: center; gap: var(--evx-space-md); }
  .pd__plate {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--evx-champagne);
    border: 1px solid var(--evx-champagne);
    padding: 4px 7px;
    line-height: 1;
  }

  .pd__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(26px, 2.6vw, 36px);
    line-height: 1.1;
    letter-spacing: -0.028em;
    margin-top: var(--evx-space-md);
  }
  .pd__sub {
    margin-top: var(--evx-space-sm);
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 18px;
    color: var(--evx-ink-soft);
  }
  .pd__edition {
    margin-top: var(--evx-space-md);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
  }

  .pd__price-row {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-md);
    margin-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .pd__price {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 28px;
    letter-spacing: -0.025em;
  }
  .pd__was {
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-faint);
  }

  .pd__buy { display: flex; flex-direction: column; gap: var(--evx-space-md); margin-top: var(--evx-space-lg); }

  .pd__confirm { display: flex; flex-direction: column; gap: 6px; }
  .pd__confirm p { font-size: 14px; line-height: 1.55; color: var(--evx-ink-soft); }

  .pd__seg { display: grid; grid-template-columns: 1fr 1fr; }
  .pd__opt {
    font-family: var(--evx-font-display);
    font-size: 13px;
    font-weight: 500;
    color: var(--evx-ink-soft);
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 12px 10px;
    transition: var(--evx-transition);
  }
  .pd__opt + .pd__opt { border-left: none; }
  .pd__opt--on { color: var(--evx-ink); border-color: var(--evx-ink); }
  .pd__opt--on + .pd__opt { border-left: none; }

  .pd__total {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-hair);
    border-bottom: 1px solid var(--evx-rule-hair);
  }
  .pd__total-fig {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    letter-spacing: -0.02em;
  }

  .pd__hint { font-size: 13px; line-height: 1.5; color: var(--evx-ink-soft); }

  .pd__arrive { gap: var(--evx-space-sm); }
  .pd__arrive-line { font-size: 18px; font-weight: 500; letter-spacing: -0.015em; }

  .pd__assure {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: var(--evx-space-xl);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }
  .pd__assure li {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.05em;
    line-height: 1.5;
    color: var(--evx-ink-soft);
  }

  /* ── Specification ── */
  .pd__specs-band { border-top: 1px solid var(--evx-rule-light); }
  .pd__specs { display: grid; grid-template-columns: 1fr 1.6fr; gap: var(--evx-space-2xl); }
  .pd__specs-h { margin-top: var(--evx-space-sm); }
  .pd__rows { display: flex; flex-direction: column; }
  .pd__row {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
    gap: var(--evx-space-md);
    padding: 13px 0;
    border-top: 1px solid var(--evx-rule-light);
  }
  .pd__row:last-child { border-bottom: 1px solid var(--evx-rule-light); }
  .pd__row dt {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .pd__row dd { font-size: 14px; color: var(--evx-ink); }

  /* ── Accordions ── */
  .pd__detail { max-width: 780px; }
  .pd__acc { border-top: 1px solid var(--evx-rule-light); }
  .pd__acc:last-child { border-bottom: 1px solid var(--evx-rule-light); }
  .pd__acc summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.01em;
    padding: var(--evx-space-md) 0;
    cursor: pointer;
    list-style: none;
  }
  .pd__acc summary::-webkit-details-marker { display: none; }
  .pd__acc summary::after {
    content: '+';
    font-family: var(--evx-font-mono);
    font-size: 15px;
    color: var(--evx-ink-soft);
  }
  .pd__acc[open] summary::after { content: '–'; }
  .pd__acc-body { padding-bottom: var(--evx-space-md); display: flex; flex-direction: column; gap: 10px; }
  .pd__acc-body p { font-size: 14.5px; line-height: 1.6; color: var(--evx-ink-soft); }

  @media (max-width: 1023px) {
    .pd__grid { grid-template-columns: 1fr; gap: var(--evx-space-xl); }
    .pd__panel { position: static; }
    .pd__specs { grid-template-columns: 1fr; gap: var(--evx-space-lg); }
  }
</style>
