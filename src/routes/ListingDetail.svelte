<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import SellerPill from '../lib/SellerPill.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import LoadingCard from '../components/LoadingCard.svelte';
  import {
    getListingBySlug,
    getSimilarListings,
    getListingsBySeller,
    getMySavedItems,
    saveListing,
    unsaveListing,
    incrementListingView,
    formatPrice,
    type ListingWithExtras,
  } from '../lib/api';
  import PayButton from '../lib/PayButton.svelte';
  import { navigate, currentPath } from '../lib/router';
  import { auth } from '../lib/auth';
  import { applySeo, seo } from '../lib/seo';

  export let slug: string;

  // ── State ──
  let loading = true;
  let listing: ListingWithExtras | null = null;
  let similar: ListingWithExtras[] = [];
  let sellerMore: ListingWithExtras[] = [];

  let activeImage = 0;
  let saved = false;

  // ── Load ──
  async function load() {
    loading = true;
    activeImage = 0;
    listing = await getListingBySlug(slug);

    if (!listing) {
      loading = false;
      return;
    }

    // Fire-and-forget view counter
    if (listing.slug) incrementListingView(listing.slug);

    applySeo(seo.listing(
      listing.title,
      listing.subtitle ?? '',
      formatPrice(listing.price),
      listing.city ?? '',
      listing.slug ?? listing.id,
    ));

    // In parallel: similar, more-from-seller, saved status
    const [sim, more, savedIds] = await Promise.all([
      getSimilarListings(listing.category_slug, listing.id, 4),
      getListingsBySeller(listing.seller_id, 4, listing.id),
      $auth.user ? getMySavedItems() : Promise.resolve([] as string[]),
    ]);

    similar = sim;
    sellerMore = more;
    saved = savedIds.includes(listing.id);
    loading = false;
  }

  $: if (slug) void load();

  onMount(() => {
    if (slug) void load();
  });

  // ── Actions ──
  async function toggleSave() {
    if (!$auth.user) {
      try { sessionStorage.setItem('eirvox-return-to', $currentPath); } catch {}
      navigate('/login');
      return;
    }
    if (!listing) return;
    saved = !saved; // optimistic
    const r = saved ? await saveListing(listing.id) : await unsaveListing(listing.id);
    if (!r.ok) saved = !saved;
  }

  // v1 is hands-off: ÉIRVOX is the venue, not the broker. Buyers see
  // the seller's contact directly and reach out off-platform. No
  // platform-facilitated messaging, no enquiry queue routing.
  function scrollToContact() {
    document.getElementById('seller-contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Mobile sticky CTA can't host the embedded Revolut button cleanly
  // (it would create a second order alongside the panel button). On
  // payable listings the sticky button scrolls the user up to the
  // main PayButton instead.
  function scrollToPay() {
    document.getElementById('pay-block')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Derived: display tier for SellerPill
  $: tier = ((listing?.seller?.tier ?? 'verified').toUpperCase()) as 'HOUSE' | 'ATELIER' | 'VERIFIED';
  $: avatarLetter = (listing?.seller?.trading_name ?? '·').charAt(0).toUpperCase();
  $: prettyCategory = listing?.category_slug
    ? listing.category_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '';

  // Active image source
  $: activeImageUrl = listing?.images?.[activeImage]?.public_url ?? listing?.cover_image ?? null;
  $: imageCount = listing?.images?.length ?? 0;

  // PayButton render gate (cosmetic — the server in
  // api/payments/create-order independently re-checks is_house and
  // resolves the amount; a tampered client cannot bypass it).
  $: isHouseListing = !!listing?.seller?.is_house;
  $: payable = isHouseListing && listing?.status === 'active';

  // v06 matrix wiring (buyer-side; server is authoritative).
  //   stock_state: 'in_stock' or 'incoming' (defaults to 'in_stock'
  //     when the column is absent pre-migration).
  //   fulfilment: buyer's chosen 'collection' or 'delivery'. Required
  //     by the server.
  //   isDeposit: when true, server charges deposit_amount.
  //
  // Matrix:
  //   in_stock + collection: full OR deposit
  //   in_stock + delivery  : full only (price + shipping)
  //   incoming + collection: deposit only
  //   incoming + delivery  : full only (price + shipping)
  $: stockState = (listing?.stock_state ?? 'in_stock') as 'in_stock' | 'incoming';
  $: hasShipping = !!listing?.shipping_available;
  $: hasCollection = !!listing?.collection_available;
  $: depositConfigured = (listing?.deposit_amount ?? 0) > 0;
  $: shippingCostSet = (listing?.shipping_cost ?? 0) > 0;

  let fulfilment: 'collection' | 'delivery' | null = null;
  let isDeposit = false;

  // Auto-pick fulfilment when only one option is enabled. Reset to
  // null whenever a new listing loads (slug change) so the picker is
  // fresh.
  $: if (listing?.id) {
    if (hasCollection && !hasShipping) fulfilment = 'collection';
    else if (hasShipping && !hasCollection) fulfilment = 'delivery';
  }

  // Matrix-derived gates for the local controls.
  $: canFull = fulfilment !== null && !(stockState === 'incoming' && fulfilment === 'collection');
  $: canDeposit = fulfilment === 'collection' && depositConfigured;
  $: mustDeposit = stockState === 'incoming' && fulfilment === 'collection';

  // Force the deposit flag into a valid state for the current combo.
  $: if (mustDeposit && !isDeposit) isDeposit = true;
  $: if (!canDeposit && isDeposit) isDeposit = false;

  // Delivery requires shipping_cost set; if it isn't, suppress the
  // PayButton so the buyer doesn't see a delivery total that silently
  // omits shipping. Server (api/payments/create-order) also rejects
  // delivery + null shipping_cost. The €20 An Post default for house
  // listings lives in the shipping_cost column (data, not code).
  $: deliverySelectedWithoutShipping = fulfilment === 'delivery' && !shippingCostSet;
  $: canShowPayButton = !!fulfilment && !deliverySelectedWithoutShipping;

  // Display amount for the success-state strip + mode label. Server
  // is still authoritative on what's actually charged. The display
  // formula adds shipping_cost when delivery is selected; when
  // shipping_cost is null/0 we suppress the PayButton above rather
  // than silently displaying just price.
  $: payAmount = !listing
    ? 0
    : isDeposit
      ? (listing.deposit_amount ?? 0)
      : fulfilment === 'delivery'
        ? listing.price + (listing.shipping_cost ?? 0)
        : listing.price;

  $: payModeLabel = isDeposit
    ? 'DEPOSIT'
    : fulfilment === 'delivery'
      ? 'FULL PRICE + SHIPPING'
      : 'FULL PRICE';
</script>

<Nav />

{#if loading}
  <main id="main-content" class="detail page-container">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <span class="breadcrumb__item breadcrumb__item--current evx-caption">Loading…</span>
    </nav>
    <div class="detail__body">
      <div class="detail__gallery">
        <div class="gallery__main">
          <div class="gallery__placeholder">
            <span class="evx-caption gallery__placeholder-text">Loading listing…</span>
          </div>
        </div>
      </div>
      <div class="detail__panel">
        <span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span>
      </div>
    </div>
  </main>

{:else if !listing}
  <main id="main-content" class="detail-404 page-container">
    <span class="evx-label" style="color: var(--evx-fox-orange);">404</span>
    <h1 class="evx-heading">This listing doesn't exist or has been removed.</h1>
    <p style="font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 520px;">
      The URL may have changed or the seller withdrew it. Browse what's currently active in the marketplace.
    </p>
    <div style="display: flex; gap: var(--evx-space-md); flex-wrap: wrap; margin-top: var(--evx-space-md);">
      <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>Back to home →</button>
      <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/automotive')}>Browse listings</button>
    </div>
  </main>

{:else}
  <main id="main-content" class="detail">
    <div class="page-container">

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <button class="breadcrumb__item" on:click={() => navigate('/')}>HOME</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        {#if listing.category_slug}
          <button class="breadcrumb__item" on:click={() => navigate(`/${listing.category_slug}`)}>
            {prettyCategory}
          </button>
          <span class="breadcrumb__sep evx-caption">/</span>
        {/if}
        <span class="breadcrumb__item breadcrumb__item--current evx-caption">
          {listing.subcategory ?? listing.title}
        </span>
      </nav>

      <!-- Main split -->
      <div class="detail__body">

        <!-- LEFT: Gallery -->
        <div class="detail__gallery">
          <div class="gallery__main">
            {#if listing.condition}
              <span class="evx-caption gallery__badge">{listing.condition}</span>
            {/if}

            {#if activeImageUrl}
              <img src={activeImageUrl} alt={listing.title} class="gallery__img" />
            {:else}
              <div class="gallery__placeholder">
                <span class="evx-caption gallery__placeholder-text">
                  {listing.title}
                </span>
                <span class="evx-caption gallery__listing-id">
                  {listing.city ?? ''}
                </span>
              </div>
            {/if}

            <!-- Save button (top right of gallery) -->
            <button class="gallery__save"
                    class:gallery__save--saved={saved}
                    on:click={toggleSave}
                    aria-label={saved ? 'Remove from saved' : 'Save listing'}>
              {#if saved}
                <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden="true">
                  <path d="M1 1h12v14L7 11l-6 4V1z"/>
                </svg>
              {:else}
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
                  <path d="M1 1h12v14L7 11l-6 4V1z"/>
                </svg>
              {/if}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>

          <!-- Thumbs -->
          {#if imageCount > 1}
            <div class="gallery__thumbs">
              {#each listing.images ?? [] as img, i}
                <button class="gallery__thumb"
                        class:gallery__thumb--active={i === activeImage}
                        on:click={() => activeImage = i}
                        aria-label="Photo {i + 1}">
                  {#if img.public_url}
                    <img src={img.public_url} alt="" />
                  {:else}
                    <span class="evx-caption gallery__thumb-label">{String(i + 1).padStart(2, '0')}</span>
                  {/if}
                </button>
              {/each}
            </div>
          {:else if !activeImageUrl}
            <p class="evx-caption" style="color: var(--evx-ink-soft); margin-top: var(--evx-space-sm);">
              Images coming soon.
            </p>
          {/if}
        </div>

        <!-- RIGHT: Deal panel -->
        <div class="detail__panel">

          {#if listing.condition || listing.shipping_available || listing.collection_available}
            <div class="panel__condition-strip evx-caption">
              {listing.condition ?? 'GOOD CONDITION'}
              {#if listing.shipping_available} · SHIPS{/if}
              {#if listing.collection_available} · COLLECTION{/if}
            </div>
          {/if}

          <h1 class="panel__title">{listing.title}</h1>
          {#if listing.subtitle}
            <p class="panel__subtitle">{listing.subtitle}</p>
          {/if}

          <div class="panel__price-block">
            <div class="panel__price-row">
              <span class="panel__price">{formatPrice(listing.price)}</span>
              {#if listing.original_price && listing.original_price > listing.price}
                <span class="panel__original">{formatPrice(listing.original_price)}</span>
                <span class="panel__saving evx-caption">
                  SAVE {formatPrice(listing.original_price - listing.price)}
                </span>
              {/if}
            </div>
          </div>

          <div class="panel__ctas">
            {#if listing.status === 'sold'}
              <button class="evx-btn evx-btn--primary panel__cta-main" disabled>
                Sold
              </button>
            {:else if listing.status === 'reserved'}
              <button class="evx-btn evx-btn--primary panel__cta-main" disabled>
                Reserved
              </button>
            {:else if payable}
              <div class="panel__pay" id="pay-block">

                {#if hasCollection && hasShipping}
                  <div class="panel__pay-options" role="group" aria-label="Fulfilment">
                    <button class="panel__pay-opt" class:panel__pay-opt--on={fulfilment === 'collection'}
                            type="button" on:click={() => fulfilment = 'collection'}>
                      Collection
                    </button>
                    <button class="panel__pay-opt" class:panel__pay-opt--on={fulfilment === 'delivery'}
                            type="button" on:click={() => fulfilment = 'delivery'}>
                      Delivery
                    </button>
                  </div>
                {/if}

                {#if canFull && canDeposit}
                  <div class="panel__pay-options" role="group" aria-label="Payment">
                    <button class="panel__pay-opt" class:panel__pay-opt--on={!isDeposit}
                            type="button" on:click={() => isDeposit = false}>
                      Pay full · {formatPrice(listing.price)}
                    </button>
                    <button class="panel__pay-opt" class:panel__pay-opt--on={isDeposit}
                            type="button" on:click={() => isDeposit = true}>
                      Deposit · {formatPrice(listing.deposit_amount ?? 0)}
                    </button>
                  </div>
                {/if}

                <div class="panel__pay-mode">
                  <span class="evx-caption panel__pay-mode-label">{payModeLabel}</span>
                  <span class="panel__pay-mode-amount">{formatPrice(payAmount)}</span>
                  {#if isDeposit}
                    <span class="evx-caption panel__pay-mode-of">of {formatPrice(listing.price)} total · balance on collection</span>
                  {/if}
                </div>

                {#if !fulfilment}
                  <p class="evx-caption panel__pay-hint">Pick collection or delivery to continue.</p>
                {:else if deliverySelectedWithoutShipping}
                  <p class="evx-caption panel__pay-hint">Delivery is not priced yet for this listing. Pick collection, or contact the seller.</p>
                {:else if canShowPayButton}
                  <PayButton
                    listingId={listing.id}
                    amountEur={payAmount}
                    description={listing.title}
                    fulfilment={fulfilment}
                    isDeposit={isDeposit}
                  />
                {/if}

                {#if mustDeposit}
                  <p class="evx-caption panel__pay-hint">
                    Awaiting stock. Deposit holds your place; balance paid in person on collection.
                  </p>
                {/if}
              </div>
            {:else}
              <button class="evx-btn evx-btn--primary panel__cta-main" on:click={scrollToContact}>
                Contact seller
              </button>
            {/if}
          </div>

          <!-- Seller card -->
          {#if listing.seller}
            <div class="panel__seller">
              <div class="panel__seller-header">
                <div class="panel__seller-avatar">
                  {#if listing.seller.logo_url}
                    <img src={listing.seller.logo_url} alt="" />
                  {:else}
                    {avatarLetter}
                  {/if}
                </div>
                <div class="panel__seller-info">
                  <div class="panel__seller-name">{listing.seller.trading_name}</div>
                  <SellerPill tier={tier} name={listing.seller.trading_name} rating={listing.seller.rating ?? null} compact={true} />
                  {#if listing.seller.city}
                    <span class="evx-caption panel__seller-loc">{listing.seller.city}</span>
                  {/if}
                </div>
              </div>
              {#if listing.seller.bio}
                <p style="font-size: 13px; line-height: 1.6; color: var(--evx-ink-soft); margin-top: var(--evx-space-sm);">
                  {listing.seller.bio}
                </p>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      <!-- Below the fold -->
      <div class="detail__below">
        <div class="detail__left-col">

          {#if listing.description}
            <section class="detail-section">
              <h2 class="detail-section__heading">Description</h2>
              {#each (listing.description ?? '').split('\n\n') as para}
                {#if para.trim()}
                  <p class="detail-section__para">{para}</p>
                {/if}
              {/each}
            </section>
          {/if}

          {#if listing.specs && listing.specs.length > 0}
            <section class="detail-section">
              <h2 class="detail-section__heading">Specification</h2>
              <table class="spec-table">
                <tbody>
                  {#each listing.specs as spec}
                    <tr class="spec-row">
                      <td class="spec-label evx-caption">{spec.label.toUpperCase()}</td>
                      <td class="spec-value">{spec.value}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </section>
          {/if}
        </div>

        <div class="detail__right-col">
          <div class="detail-aside-card">
            <span class="evx-caption detail-aside-card__title">DELIVERY</span>
            {#if listing.shipping_available}
              <p class="detail-aside-card__body">Tracked &amp; insured — DPD Express, 2–3 days</p>
            {/if}
            {#if listing.collection_available}
              <p class="detail-aside-card__body">Collection — by arrangement, {listing.city ?? 'see listing'}</p>
            {/if}
            {#if !listing.shipping_available && !listing.collection_available}
              <p class="detail-aside-card__body">Contact seller for delivery options.</p>
            {/if}
          </div>

          <div class="detail-aside-card">
            <span class="evx-caption detail-aside-card__title">CONTACT</span>
            <p class="detail-aside-card__body">
              Reach out to {listing.seller?.trading_name ?? 'the seller'} directly. ÉIRVOX doesn't take messages on their behalf.
            </p>
            <button class="evx-caption detail-aside-card__link" on:click={scrollToContact}>
              SEE SELLER CONTACT →
            </button>
          </div>

          <div class="detail-aside-card">
            <span class="evx-caption detail-aside-card__title">LISTING</span>
            <p class="detail-aside-card__body" style="font-family: var(--evx-font-mono);">
              {listing.views_count} view{listing.views_count === 1 ? '' : 's'}
            </p>
            <p class="detail-aside-card__body" style="font-family: var(--evx-font-mono);">
              Listed {new Date(listing.published_at ?? listing.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <!-- More from seller -->
      {#if sellerMore.length > 0 && listing.seller}
        <section class="more-from">
          <div class="more-from__header">
            <h2 class="more-from__heading">More from {listing.seller.trading_name}</h2>
          </div>
          <div class="more-from__grid">
            {#each sellerMore as l (l.id)}
              <ListingCard listing={l} />
            {/each}
          </div>
        </section>
      {/if}

      <!-- Similar listings -->
      {#if similar.length > 0 && listing.category_slug}
        <section class="similar">
          <div class="similar__header">
            <h2 class="similar__heading">Similar listings</h2>
            <button class="evx-caption similar__all" on:click={() => navigate(`/${listing.category_slug}`)}>
              All {prettyCategory} →
            </button>
          </div>
          <div class="similar__grid">
            {#each similar as l (l.id)}
              <ListingCard listing={l} />
            {/each}
          </div>
        </section>
      {/if}
    </div>

    <!-- Mobile sticky CTA -->
    <div class="sticky-cta" role="region" aria-label="Listing actions">
      <div class="sticky-cta__price">
        <span class="evx-caption sticky-cta__price-label">
          {#if payable && isDeposit}DEPOSIT
          {:else if payable}PAY
          {:else}FROM{/if}
        </span>
        <span class="sticky-cta__price-val">
          {formatPrice(payable ? payAmount : listing.price)}
        </span>
      </div>
      <div class="sticky-cta__btns">
        {#if listing.status === 'sold'}
          <button class="evx-btn evx-btn--primary evx-btn--sm" disabled>Sold</button>
        {:else if listing.status === 'reserved'}
          <button class="evx-btn evx-btn--primary evx-btn--sm" disabled>Reserved</button>
        {:else if payable}
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={scrollToPay}>
            Pay
          </button>
        {:else}
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={scrollToContact}>
            Contact seller
          </button>
        {/if}
      </div>
    </div>

    <!-- Seller contact panel — v1 is hands-off, ÉIRVOX is the venue not the broker -->
    <section id="seller-contact" class="detail-contact page-container">
      <header class="detail-contact__head">
        <span class="evx-caption detail-contact__pre">CONTACT</span>
        <h2 class="detail-contact__h">Reach out to <em>{listing.seller?.trading_name ?? 'the seller'}</em>.</h2>
        <p class="detail-contact__sub">
          ÉIRVOX curates the listing but doesn't broker contact. Get in touch with the seller directly using the details below.
        </p>
      </header>

      <dl class="detail-contact__list">
        <div class="detail-contact__row">
          <dt>Trading name</dt>
          <dd>{listing.seller?.trading_name ?? '—'}{#if listing.seller?.handle} <span class="detail-contact__handle">·  @{listing.seller.handle}</span>{/if}</dd>
        </div>
        {#if listing.seller?.email}
          <div class="detail-contact__row">
            <dt>Email</dt>
            <dd><a href={`mailto:${listing.seller.email}?subject=${encodeURIComponent('Re: ' + listing.title)}`}>{listing.seller.email}</a></dd>
          </div>
        {/if}
        {#if listing.seller?.phone}
          <div class="detail-contact__row">
            <dt>Phone</dt>
            <dd><a href={`tel:${listing.seller.phone.replace(/\s+/g, '')}`}>{listing.seller.phone}</a></dd>
          </div>
        {/if}
        {#if listing.seller?.city}
          <div class="detail-contact__row">
            <dt>Based in</dt>
            <dd>{listing.seller.city}</dd>
          </div>
        {/if}
      </dl>

      {#if !listing.seller?.email && !listing.seller?.phone}
        <p class="detail-contact__missing">
          This seller hasn't added contact details yet. We've nudged them to update their profile.
        </p>
      {/if}
    </section>
  </main>
{/if}

<Footer />

<style>
  .detail { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .detail-404 {
    flex: 1;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  /* Breadcrumb */
  .breadcrumb { display: flex; gap: var(--evx-space-sm); align-items: center; padding-top: var(--evx-space-xl); margin-bottom: var(--evx-space-xl); }
  .breadcrumb__item { font-family: var(--evx-font-mono); font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--evx-ink-soft); background: none; border: none; padding: 0; cursor: pointer; transition: var(--evx-transition); }
  .breadcrumb__item:hover { color: var(--evx-warm-black); }
  .breadcrumb__item--current { color: var(--evx-warm-black); cursor: default; }
  .breadcrumb__sep { color: var(--evx-rule-light); }

  /* Main split */
  .detail__body { display: grid; grid-template-columns: 1fr 440px; gap: var(--evx-space-3xl); margin-bottom: var(--evx-space-3xl); padding-bottom: var(--evx-space-3xl); border-bottom: 1px solid var(--evx-rule-light); }

  /* Gallery */
  .gallery__main { position: relative; aspect-ratio: 5 / 6; background: var(--evx-graphite); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: var(--evx-space-md); margin-bottom: var(--evx-space-md); overflow: hidden; }
  .gallery__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  .gallery__badge { position: absolute; top: var(--evx-space-md); left: var(--evx-space-md); background: var(--evx-graphite-mid); color: var(--evx-paper); padding: 3px 8px; z-index: 2; }

  .gallery__placeholder { display: flex; flex-direction: column; align-items: center; gap: var(--evx-space-md); text-align: center; padding: var(--evx-space-xl); }
  .gallery__placeholder-text { color: rgba(245, 242, 237, 0.25); line-height: 1.6; }
  .gallery__listing-id { color: rgba(245, 242, 237, 0.30); }

  .gallery__save {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    z-index: 2;
    background: rgba(26, 26, 26, 0.6);
    color: var(--evx-paper);
    border: none;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 200ms ease, color 200ms ease;
  }
  .gallery__save:hover { background: rgba(26, 26, 26, 0.85); }
  .gallery__save--saved { color: var(--evx-fox-orange); }

  .gallery__thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--evx-space-sm); }
  .gallery__thumb { aspect-ratio: 1; background: var(--evx-graphite-mid); border: 1px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--evx-transition); opacity: 0.50; overflow: hidden; padding: 0; }
  .gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
  .gallery__thumb--active { opacity: 1; border-color: var(--evx-fox-orange); }
  .gallery__thumb-label { color: rgba(245, 242, 237, 0.40); }

  /* Panel */
  .panel__condition-strip { color: var(--evx-ink-soft); letter-spacing: 0.06em; margin-bottom: var(--evx-space-lg); text-transform: uppercase; }
  .panel__title { font-family: var(--evx-font-display); font-size: clamp(24px, 3vw, 36px); font-weight: 500; line-height: 1.1; letter-spacing: -0.015em; margin-bottom: var(--evx-space-sm); }
  .panel__subtitle { font-family: var(--evx-font-mono); font-size: 12px; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-xl); }
  .panel__price-block { padding: var(--evx-space-lg) 0; border-top: 1px solid var(--evx-rule-light); border-bottom: 1px solid var(--evx-rule-light); margin-bottom: var(--evx-space-xl); }
  .panel__price-row { display: flex; align-items: baseline; gap: var(--evx-space-md); }
  .panel__price { font-family: var(--evx-font-display); font-size: 36px; font-weight: 500; letter-spacing: -0.02em; }
  .panel__original { font-size: 16px; color: var(--evx-ink-soft); text-decoration: line-through; }
  .panel__saving { color: var(--evx-fox-orange); }
  .panel__ctas { display: flex; flex-direction: column; gap: var(--evx-space-md); margin-bottom: var(--evx-space-xl); }
  .panel__cta-main { width: 100%; justify-content: space-between; }
  .panel__cta-offer { width: 100%; }

  /* Pay block — wraps the PayButton with fulfilment + payment-option
     pickers and a resolved-amount label. Server is authoritative on
     what's actually charged. */
  .panel__pay { display: flex; flex-direction: column; gap: var(--evx-space-md); width: 100%; }
  .panel__pay-options { display: flex; gap: var(--evx-space-xs); flex-wrap: wrap; }
  .panel__pay-opt {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    padding: 10px 14px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .panel__pay-opt:hover { color: var(--evx-warm-black); border-color: var(--evx-warm-black); }
  .panel__pay-opt--on {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border-color: var(--evx-warm-black);
  }
  .panel__pay-mode { display: flex; align-items: baseline; gap: var(--evx-space-sm); flex-wrap: wrap; }
  .panel__pay-mode-label { color: var(--evx-fox-orange); }
  .panel__pay-mode-amount { font-family: var(--evx-font-display); font-size: 18px; font-weight: 500; color: var(--evx-warm-black); }
  .panel__pay-mode-of { color: var(--evx-ink-soft); }
  .panel__pay-hint { color: var(--evx-ink-soft); }

  /* Seller card */
  .panel__seller { border: 1px solid var(--evx-rule-light); padding: var(--evx-space-lg); }
  .panel__seller-header { display: flex; align-items: flex-start; gap: var(--evx-space-md); }
  .panel__seller-avatar { width: 40px; height: 40px; background: var(--evx-graphite); color: var(--evx-paper); display: flex; align-items: center; justify-content: center; font-family: var(--evx-font-display); font-weight: 500; font-size: 18px; flex-shrink: 0; overflow: hidden; }
  .panel__seller-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .panel__seller-info { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .panel__seller-name { font-family: var(--evx-font-display); font-weight: 500; font-size: 16px; }
  .panel__seller-loc { color: var(--evx-ink-soft); }

  /* Below fold */
  .detail__below { display: grid; grid-template-columns: 1fr 320px; gap: var(--evx-space-3xl); margin-bottom: var(--evx-space-3xl); }
  .detail-section { margin-bottom: var(--evx-space-2xl); }
  .detail-section__heading { font-family: var(--evx-font-display); font-size: 22px; font-weight: 500; letter-spacing: -0.01em; margin-bottom: var(--evx-space-lg); }
  .detail-section__para { font-size: 15px; line-height: 1.75; color: var(--evx-ink); margin-bottom: var(--evx-space-md); }
  .spec-table { width: 100%; border-collapse: collapse; }
  .spec-row { border-bottom: 1px solid var(--evx-rule-light); }
  .spec-label { color: var(--evx-ink-soft); padding: var(--evx-space-md) 0; width: 160px; vertical-align: top; }
  .spec-value { font-size: 14px; padding: var(--evx-space-md) 0; color: var(--evx-warm-black); }

  /* Aside cards */
  .detail-aside-card { border: 1px solid var(--evx-rule-light); padding: var(--evx-space-lg); margin-bottom: var(--evx-space-md); }
  .detail-aside-card__title { display: block; color: var(--evx-fox-orange); margin-bottom: var(--evx-space-md); }
  .detail-aside-card__body { font-size: 13px; line-height: 1.65; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-sm); }
  .detail-aside-card__link { background: none; border: none; color: var(--evx-warm-black); cursor: pointer; padding: 0; margin-top: var(--evx-space-sm); display: block; text-decoration: underline; text-underline-offset: 3px; transition: var(--evx-transition); }
  .detail-aside-card__link:hover { opacity: 0.60; }

  /* More / Similar */
  .more-from, .similar { margin-bottom: var(--evx-space-3xl); padding-top: var(--evx-space-2xl); border-top: 1px solid var(--evx-rule-light); }
  .more-from__header, .similar__header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--evx-space-xl); }
  .more-from__heading, .similar__heading { font-family: var(--evx-font-display); font-size: 20px; font-weight: 500; letter-spacing: -0.01em; }
  .similar__all { background: none; border: none; color: var(--evx-ink-soft); cursor: pointer; transition: var(--evx-transition); }
  .similar__all:hover { color: var(--evx-warm-black); }
  .more-from__grid, .similar__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-xl); }

  /* Sticky mobile CTA bar */
  .sticky-cta { display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 90; background: var(--evx-paper); border-top: 1px solid var(--evx-rule-light); padding: var(--evx-space-sm) var(--evx-space-md); padding-bottom: calc(var(--evx-space-sm) + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -2px 8px rgba(0,0,0,0.06); align-items: center; justify-content: space-between; gap: var(--evx-space-md); }
  .sticky-cta__price { display: flex; flex-direction: column; gap: 0; min-width: 0; }
  .sticky-cta__price-label { color: var(--evx-ink-soft); font-size: 10px; }
  .sticky-cta__price-val { font-family: var(--evx-font-display); font-weight: 500; font-size: 20px; letter-spacing: -0.01em; }
  .detail-contact {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    border-top: 1px solid var(--evx-rule-light);
    margin-top: var(--evx-space-2xl);
  }
  .detail-contact__head {
    margin-bottom: var(--evx-space-xl);
    max-width: 640px;
  }
  .detail-contact__pre {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-sm);
  }
  .detail-contact__h {
    font-family: var(--evx-font-display);
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
  }
  .detail-contact__h em {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
  }
  .detail-contact__sub {
    font-size: 15px;
    color: var(--evx-ink-soft);
    line-height: 1.6;
  }
  .detail-contact__list {
    display: flex;
    flex-direction: column;
    gap: 0;
    max-width: 640px;
  }
  .detail-contact__row {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: var(--evx-space-lg);
    padding: 16px 0;
    border-bottom: 1px solid var(--evx-rule-light);
    align-items: baseline;
  }
  .detail-contact__row dt {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .detail-contact__row dd {
    font-size: 15px;
    color: var(--evx-warm-black);
  }
  .detail-contact__row dd a {
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }
  .detail-contact__row dd a:hover { color: var(--evx-fox-orange); }
  .detail-contact__handle {
    font-family: var(--evx-font-mono);
    font-size: 13px;
    color: var(--evx-ink-soft);
  }
  .detail-contact__missing {
    margin-top: var(--evx-space-md);
    font-size: 14px;
    font-style: italic;
    color: var(--evx-ink-soft);
  }
  @media (max-width: 600px) {
    .detail-contact__row { grid-template-columns: 1fr; gap: 4px; }
  }

  .sticky-cta__btns { display: flex; gap: var(--evx-space-sm); flex-shrink: 0; }

  @media (max-width: 1023px) {
    .detail__body { grid-template-columns: 1fr; }
    .detail__below { grid-template-columns: 1fr; }
    .more-from__grid, .similar__grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 767px) {
    .more-from__grid, .similar__grid { grid-template-columns: 1fr; }
    .detail { padding-bottom: 80px; }
    .sticky-cta { display: flex; }
  }
</style>
