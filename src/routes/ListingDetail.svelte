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
  import ReportListingDialog from '../lib/ReportListingDialog.svelte';
  import { navigate, currentPath } from '../lib/router';
  import { auth } from '../lib/auth';
  import { getOrCreateConversation } from '../lib/messaging';
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

  // Share — prefer native share sheet (mobile iOS/Android system UI),
  // fall back to clipboard with a quick visual confirmation. The URL
  // we share is always the canonical /#/listing/:slug path so it round-
  // trips correctly through hash routing.
  let shareToast = '';
  let shareToastTimer: ReturnType<typeof setTimeout> | null = null;
  function flashShareToast(msg: string) {
    shareToast = msg;
    if (shareToastTimer) clearTimeout(shareToastTimer);
    shareToastTimer = setTimeout(() => { shareToast = ''; }, 2400);
  }
  async function shareListing() {
    if (!listing) return;
    const url = `${window.location.origin}/#/listing/${listing.slug ?? listing.id}`;
    const title = listing.title;
    const text = `${title} — on ÉIRVOX`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User cancelled the system share sheet — silent, NOT an error
        if (err instanceof Error && err.name === 'AbortError') return;
        // Any other failure → fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      flashShareToast('Link copied');
    } catch {
      flashShareToast('Copy failed — long-press the address bar instead');
    }
  }

  // Buyers contact sellers via in-app messaging only — phone + email
  // are not surfaced. House listings are DM-able too (the house seller
  // is a person, not the platform).
  let messageBusy = false;
  let messageErr = '';
  async function messageSeller(prefilledDraft?: string) {
    if (!listing) return;
    if (!$auth.user) {
      navigate(`/login?next=${encodeURIComponent('/listing/' + slug)}`);
      return;
    }
    messageBusy = true;
    messageErr = '';
    const r = await getOrCreateConversation(listing.id);
    messageBusy = false;
    if (!r.ok) { messageErr = r.error; return; }
    // Hand a pre-filled draft to the thread via sessionStorage so the
    // composer opens with the offer line already typed and the buyer
    // just hits Send. Thread.svelte reads + clears this on mount.
    if (prefilledDraft) {
      try { sessionStorage.setItem(`eirvox_thread_draft_${r.data}`, prefilledDraft); } catch { /* private mode */ }
    }
    navigate(`/messages/${r.data}`);
  }

  async function makeOffer() {
    if (!listing) return;
    const raw = window.prompt(`Make an offer on "${listing.title}". Enter your amount in € (just the number):`);
    if (raw == null) return;  // user cancelled
    const amount = Math.round(Number(raw.replace(/[^\d.]/g, '')));
    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert('Please enter a valid number, e.g. 8500');
      return;
    }
    if (amount >= listing.price) {
      const ok = window.confirm(`Your offer of €${amount.toLocaleString()} is at or above the asking price of €${listing.price.toLocaleString()}. Send anyway?`);
      if (!ok) return;
    }
    const draft = `Offer: €${amount.toLocaleString()}\n\nHi, I'd like to offer €${amount.toLocaleString()} for "${listing.title}". Let me know if that works.`;
    await messageSeller(draft);
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
  let showPayOptions = false;  // collapsed by default; "More options →"

  // Zombie-proof defaults: pick the most "normal" option on listing
  // load so the buyer doesn't have to think before they can tap Pay.
  //   Fulfilment: delivery if priced, else collection (so the headline
  //               amount works without a click).
  //   Deposit:    false (pay-in-full is the obvious path; deposit is
  //               surfaced via the disclosure unless mustDeposit forces it).
  // Triggers only when fulfilment is still null (avoids overriding an
  // explicit user pick on the same listing).
  $: if (listing?.id && fulfilment === null) {
    if (hasShipping && shippingCostSet)        fulfilment = 'delivery';
    else if (hasCollection)                    fulfilment = 'collection';
    else if (hasShipping)                      fulfilment = 'delivery';
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

            <!-- Save + Share buttons (top right of gallery) -->
            <div class="gallery__actions">
              <button class="gallery__action"
                      class:gallery__action--on={saved}
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
                <span class="gallery__action-label">{saved ? 'Saved' : 'Save'}</span>
              </button>
              <button class="gallery__action" on:click={shareListing} aria-label="Share this listing">
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
                  <path d="M7 1v10M3 5l4-4 4 4M1 11v3a1 1 0 001 1h10a1 1 0 001-1v-3"/>
                </svg>
                <span class="gallery__action-label">Share</span>
              </button>
            </div>
            {#if shareToast}
              <div class="gallery__toast" role="status">{shareToast}</div>
            {/if}
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

                <!-- Primary CTA: one big button at the resolved amount.
                     Defaults pre-pick fulfilment + payment mode so a
                     first-time buyer sees a clear "Pay €X" without
                     fiddling with toggles. Alternatives live in
                     "More options" below. -->
                {#if deliverySelectedWithoutShipping}
                  <p class="evx-caption panel__pay-hint">
                    Delivery isn't priced for this listing yet. Switch to collection below, or message the seller.
                  </p>
                {:else if canShowPayButton}
                  <div class="panel__pay-primary">
                    <span class="evx-caption panel__pay-mode-label">{payModeLabel}</span>
                    <span class="panel__pay-mode-amount">{formatPrice(payAmount)}</span>
                    {#if isDeposit}
                      <span class="evx-caption panel__pay-mode-of">of {formatPrice(listing.price)} · balance on collection</span>
                    {/if}
                  </div>
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

                <!-- More options disclosure (collection vs delivery,
                     full vs deposit). Hidden behind a toggle so the
                     primary path stays single-tap. -->
                {#if (hasCollection && hasShipping) || (canFull && canDeposit)}
                  <button class="panel__pay-disclose evx-caption"
                          type="button"
                          on:click={() => showPayOptions = !showPayOptions}
                          aria-expanded={showPayOptions}>
                    {showPayOptions ? 'Hide options' : 'More options'} →
                  </button>
                {/if}

                {#if showPayOptions}
                  <div class="panel__pay-extras">
                    {#if hasCollection && hasShipping}
                      <div class="panel__pay-row">
                        <span class="evx-caption panel__pay-row-label">Fulfilment</span>
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
                      </div>
                    {/if}

                    {#if canFull && canDeposit}
                      <div class="panel__pay-row">
                        <span class="evx-caption panel__pay-row-label">Payment</span>
                        <div class="panel__pay-options" role="group" aria-label="Payment">
                          <button class="panel__pay-opt" class:panel__pay-opt--on={!isDeposit}
                                  type="button" on:click={() => isDeposit = false}>
                            Full · {formatPrice(listing.price)}
                          </button>
                          <button class="panel__pay-opt" class:panel__pay-opt--on={isDeposit}
                                  type="button" on:click={() => isDeposit = true}>
                            Deposit · {formatPrice(listing.deposit_amount ?? 0)}
                          </button>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            {:else}
              <div class="panel__contact-stack">
                <button class="evx-btn evx-btn--primary panel__cta-main" on:click={() => messageSeller()} disabled={messageBusy}>
                  {messageBusy ? 'Opening…' : 'Message seller'}
                </button>
                {#if listing.accepts_offers !== false}
                  <button class="evx-btn evx-btn--ghost panel__cta-main" on:click={makeOffer} disabled={messageBusy}>
                    Make an offer
                  </button>
                {/if}
              </div>
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
              <p class="detail-aside-card__body">An Post registered recommended, 2-3 days. DPD Express on request.</p>
            {/if}
            {#if listing.collection_available}
              <p class="detail-aside-card__body">Collection — by arrangement, {listing.city ?? 'see listing'}</p>
            {/if}
            {#if !listing.shipping_available && !listing.collection_available}
              <p class="detail-aside-card__body">Ask the seller for delivery options.</p>
            {/if}
          </div>

          <div class="detail-aside-card">
            <span class="evx-caption detail-aside-card__title">CONTACT</span>
            <p class="detail-aside-card__body">
              Chat with the seller in-app. Everything stays on ÉIRVOX so the refund policy covers you.
            </p>
            <button class="evx-caption detail-aside-card__link" on:click={messageSeller} disabled={messageBusy}>
              {messageBusy ? 'OPENING…' : 'MESSAGE SELLER →'}
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
          {#if listing.accepts_offers !== false}
            <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={makeOffer} disabled={messageBusy}>
              Offer
            </button>
          {/if}
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => messageSeller()} disabled={messageBusy}>
            {messageBusy ? '…' : 'Message'}
          </button>
        {/if}
      </div>
    </div>

    <!-- Seller contact panel — buyers reach sellers via in-app messaging.
         Phone + email stay in DB for ID / 2FA but are never surfaced
         publicly. Deals done in-app are covered by the refund policy;
         off-site is the buyer's own risk. -->
    <section id="seller-contact" class="detail-contact page-container">
      <header class="detail-contact__head">
        <span class="evx-caption detail-contact__pre">CONTACT</span>
        <h2 class="detail-contact__h">
          Message <em>{listing.seller?.trading_name ?? 'the seller'}</em>.
        </h2>
        <p class="detail-contact__sub">
          All conversations happen on ÉIRVOX. Sharing phone, email or WhatsApp moves the deal off-site —
          ÉIRVOX refund protection ends the moment you leave the app.
        </p>
      </header>

      <div class="detail-contact__cta">
        {#if messageErr}<p class="detail-contact__err">{messageErr}</p>{/if}
        <div class="detail-contact__cta-row">
          <button class="evx-btn evx-btn--primary" on:click={() => messageSeller()} disabled={messageBusy}>
            {messageBusy ? 'Opening…' : 'Message seller →'}
          </button>
          {#if listing.accepts_offers !== false}
            <button class="evx-btn evx-btn--ghost" on:click={makeOffer} disabled={messageBusy}>
              Make an offer
            </button>
          {/if}
        </div>
        <p class="evx-caption detail-contact__cta-note">
          {#if !$auth.user}You'll be asked to sign in or create an account first.{:else}Free. No commitment.{/if}
        </p>
      </div>

      <dl class="detail-contact__list">
        <div class="detail-contact__row">
          <dt>Trading name</dt>
          <dd>
            {listing.seller?.trading_name ?? '—'}
          </dd>
        </div>
        {#if listing.seller?.handle}
          <div class="detail-contact__row">
            <dt>Instagram</dt>
            <dd>
              <a class="detail-contact__ig"
                 href={`https://instagram.com/${listing.seller.handle.replace(/^@/, '')}`}
                 target="_blank" rel="noopener noreferrer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" style="vertical-align: -2px; margin-right: 6px;">
                  <rect x="3" y="3" width="18" height="18" rx="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
                </svg>
                @{listing.seller.handle.replace(/^@/, '')}
              </a>
            </dd>
          </div>
        {/if}
        {#if listing.seller?.city}
          <div class="detail-contact__row">
            <dt>Based in</dt>
            <dd>{listing.seller.city}</dd>
          </div>
        {/if}
        {#if listing.seller?.created_at}
          <div class="detail-contact__row">
            <dt>Joined</dt>
            <dd>{new Date(listing.seller.created_at).toLocaleDateString('en-IE', { month: 'short', year: 'numeric' })}</dd>
          </div>
        {/if}
      </dl>

      <div class="detail-contact__report">
        <ReportListingDialog listingId={listing.id} listingTitle={listing.title} />
      </div>
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

  .gallery__actions {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    z-index: 2;
    display: flex;
    gap: 6px;
  }
  .gallery__action {
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
  .gallery__action:hover { background: rgba(26, 26, 26, 0.85); }
  .gallery__action--on { color: var(--evx-fox-orange); }
  .gallery__toast {
    position: absolute;
    bottom: var(--evx-space-md);
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
    background: rgba(26, 26, 26, 0.85);
    color: var(--evx-paper);
    padding: 8px 14px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    pointer-events: none;
    animation: toastIn 200ms ease;
  }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @media (max-width: 480px) {
    .gallery__action-label { display: none; }
    .gallery__action { padding: 8px; }
  }

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
  .panel__pay-primary {
    display: flex; align-items: baseline; gap: var(--evx-space-sm); flex-wrap: wrap;
    padding-bottom: 4px;
  }
  .panel__pay-mode-label { color: var(--evx-fox-orange); font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
  .panel__pay-mode-amount { font-family: var(--evx-font-display); font-size: 28px; font-weight: 500; color: var(--evx-warm-black); letter-spacing: -0.02em; }
  .panel__pay-mode-of { color: var(--evx-ink-soft); font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; width: 100%; }
  .panel__pay-hint { color: var(--evx-ink-soft); }
  .panel__pay-disclose {
    background: none; border: none; padding: 4px 0; cursor: pointer;
    color: var(--evx-ink-soft); text-align: left;
    transition: color 200ms ease;
  }
  .panel__pay-disclose:hover { color: var(--evx-warm-black); }
  .panel__pay-extras {
    display: flex; flex-direction: column; gap: var(--evx-space-md);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
  }
  .panel__pay-row { display: flex; flex-direction: column; gap: 6px; }
  .panel__pay-row-label { color: var(--evx-ink-soft); }

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
  .detail-contact__cta {
    display: flex; flex-direction: column; align-items: flex-start;
    gap: var(--evx-space-sm); padding: var(--evx-space-md) 0 var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light); margin-bottom: var(--evx-space-md);
  }
  .detail-contact__cta-row {
    display: flex; gap: var(--evx-space-sm); flex-wrap: wrap;
  }
  .panel__contact-stack {
    display: flex; flex-direction: column; gap: 8px;
  }
  .detail-contact__cta-note { color: var(--evx-ink-soft); }
  .detail-contact__err {
    color: #DC2626; font-size: 12px;
    background: rgba(220, 38, 38, 0.08); padding: 6px 10px;
    border-left: 3px solid #DC2626;
  }
  .detail-contact__handle {
    font-family: var(--evx-font-mono);
    font-size: 13px;
    color: var(--evx-ink-soft);
  }
  .detail-contact__ig {
    color: var(--evx-warm-black);
    text-decoration: none !important;
    display: inline-flex; align-items: center;
    transition: color 200ms ease;
  }
  .detail-contact__ig:hover { color: var(--evx-fox-orange); }
  .detail-contact__missing {
    margin-top: var(--evx-space-md);
    font-size: 14px;
    font-style: italic;
    color: var(--evx-ink-soft);
  }
  .detail-contact__report {
    margin-top: var(--evx-space-xl);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
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
