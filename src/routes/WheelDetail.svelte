<script lang="ts">
  // ============================================================
  // /wheels/:slug — dark cinematic wheel detail (DRIVE + standard).
  //
  // The marketplace ListingDetail/DriveIssue pages render the LIGHT
  // marketplace chrome (Nav + Footer + paper backgrounds). For wheels
  // that broke the cinematic dark experience: tapping a wheel from the
  // dark /wheels page or the finder dropped the buyer onto a white page.
  //
  // This page is the dark shell from the approved prototype (pages 6-11):
  //   * minimal top bar (back · wordmark · home)
  //   * full-bleed carbon hero + thumbnail strip
  //   * tier tag (champagne DRIVE / outlined STANDARD), title, blurb
  //   * standard wheels (listing_variants present) -> VariantPicker, which
  //     is already dark and carries the orange "Fits your <chassis>" tag,
  //     the live finish chips with accent swatches, and the real PayButton
  //   * DRIVE wheels (is_drive, no variants) -> dark deposit/full pay block
  //   * "The detail" spec rows + shipping line
  //
  // Commerce is unchanged: the same VariantPicker + PayButton + server
  // amount resolution as the marketplace detail. Only the shell is new.
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
  import WheelsMenu from '../lib/WheelsMenu.svelte';
  import PhotoFrame from '../lib/wheels-ui/PhotoFrame.svelte';
  import Btn from '../lib/wheels-ui/Btn.svelte';
  import Money from '../lib/wheels-ui/Money.svelte';
  import Chevron from '../lib/wheels-ui/Chevron.svelte';
  import TierTag from '../lib/wheels-ui/TierTag.svelte';

  export let slug: string;

  let loading = true;
  let listing: ListingWithExtras | null = null;
  let hasVariants = false;
  let activeImage = 0;
  let scrolled = false;
  let menuOpen = false;

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

  function onScroll(e: Event) {
    scrolled = (e.currentTarget as HTMLElement).scrollTop > 14;
  }

  // ── Derived ──
  $: isDrive = listing?.is_drive === true;
  $: tier = isDrive ? 'DRIVE' : 'STANDARD';
  $: blurb = listing?.description ?? listing?.subtitle ?? '';
  $: images = listing?.images ?? [];
  $: activeImageUrl = images[activeImage]?.public_url ?? listing?.cover_image ?? null;
  $: specs = (listing?.specs ?? []) as { label: string; value: string }[];
  $: arriving = isDrive
    ? `${listing?.drive_issue_date ? listing.drive_issue_date.toUpperCase() : 'UPCOMING'} · ${listing?.drive_made_count ?? 10} made`
    : '';

  // ── DRIVE / non-variant house pay matrix (mirrors ListingDetail) ──
  // Standard wheels go through VariantPicker; this covers DRIVE issues
  // and any house wheel without a finish matrix.
  $: isHouseListing = !!listing?.seller?.is_house;
  $: payable = isHouseListing && listing?.status === 'active' && !hasVariants;
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

<div class="wd evx-root" on:scroll={onScroll}>

  <!-- ━━ TOP BAR ━━ -->
  <header class="wd-top" class:wd-top--scrolled={scrolled}>
    <button class="wd-top__icon" type="button" on:click={() => navigate('/wheels')} aria-label="Back to wheels">
      <Chevron dir="left" size={13} color="var(--evx-paper)" />
    </button>
    <button class="wd-top__home" type="button" on:click={() => navigate('/wheels')} aria-label="ÉIRVOX wheels"
            style="background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center;">
      <img src="/brand/wordmark.png" alt="ÉIRVOX"
           style="height:14px;width:auto;display:block;filter:invert(1) brightness(1.05);" />
    </button>
    <button class="wd-top__icon wd-top__menu" type="button" on:click={() => (menuOpen = true)} aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>

  <WheelsMenu open={menuOpen} on:close={() => (menuOpen = false)} />

  {#if loading}
    <div class="wd-state">Loading.</div>
  {:else if !listing}
    <div class="wd-state">
      <h1>This wheel isn't available.</h1>
      <Btn variant="ghost" size="md" on:click={() => navigate('/wheels')}>Back to wheels</Btn>
    </div>
  {:else}

    <!-- ━━ HERO ━━ -->
    <section class="wd-hero">
      <PhotoFrame
        lit={isDrive}
       
        aspect="1 / 1"
        index={activeImage + 1}
        caption={`${listing.title}${isDrive ? ' · LED lit' : ' · carbon, unlit'}`}
        src={activeImageUrl}
        alt={listing.title}
      />
      {#if images.length > 1}
        <div class="wd-thumbs">
          {#each images.slice(0, 4) as img, i (img.id)}
            <button class="wd-thumb" class:wd-thumb--on={activeImage === i}
                    type="button" on:click={() => (activeImage = i)} aria-label={`View ${i + 1}`}>
              <PhotoFrame lit={isDrive} glyph={false} aspect="1 / 1"
                          src={img.public_url} alt={`${listing.title} view ${i + 1}`} />
            </button>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ━━ HEADER ━━ -->
    <section class="wd-head">
      <div class="wd-head__tags">
        <TierTag tier={tier} />
        {#if listing.vehicle_make}<span class="evx-label wd-head__marque">{listing.vehicle_make}</span>{/if}
      </div>

      <h1 class="wd-head__title">{listing.title}</h1>
      {#if blurb}<p class="wd-head__blurb">{blurb}</p>{/if}

      <div class="wd-head__price">
        <Money price={listing.price} was={listing.original_price ?? null} size={22} />
        {#if isDrive && arriving}<span class="wd-head__arriving">Arriving {arriving}</span>{/if}
      </div>
    </section>

    <!-- ━━ BUY: standard wheels via VariantPicker (dark, live finishes) ━━ -->
    {#if hasVariants}
      <section class="wd-buy">
        <VariantPicker
          listingId={listing.id}
          basePriceEur={listing.price}
          originalPriceEur={listing.original_price ?? null}
          listingTitle={listing.title}
          fulfilment="collection"
        />
      </section>
    {/if}

    <!-- ━━ THE DETAIL ━━ -->
    {#if specs.length > 0}
      <section class="wd-detail">
        <span class="evx-label wd-detail__pre">The detail</span>
        <div class="wd-detail__rows">
          {#each specs as sp (sp.label)}
            <div class="wd-detail__row">
              <span class="wd-detail__k">{sp.label}</span>
              <span class="wd-detail__v">{sp.value}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ━━ SHIPPING + DRIVE pay block ━━ -->
    <section class="wd-ship">
      <div class="wd-ship__line">
        <span class="wd-ship__dot" aria-hidden="true"></span>
        <span>Shipped via An Post, Ireland.</span>
      </div>
      {#if isDrive}
        <p class="wd-ship__note">
          Made to order. Reserve now; ships when the run is finished{listing.drive_issue_date ? ` in ${listing.drive_issue_date}` : ''}.
        </p>
      {/if}
    </section>

    <!-- DRIVE / non-variant house wheel: dark deposit/full pay bar -->
    {#if payable}
      <section class="wd-pay">
        {#if hasCollection && hasShipping}
          <div class="wd-pay__seg" role="group" aria-label="Fulfilment">
            <button class="wd-pay__opt" class:wd-pay__opt--on={fulfilment === 'collection'}
                    type="button" on:click={() => (fulfilment = 'collection')}>Collection</button>
            <button class="wd-pay__opt" class:wd-pay__opt--on={fulfilment === 'delivery'}
                    type="button" on:click={() => (fulfilment = 'delivery')}>Delivery</button>
          </div>
        {/if}
        {#if canDeposit}
          <div class="wd-pay__seg" role="group" aria-label="Payment">
            <button class="wd-pay__opt" class:wd-pay__opt--on={!isDeposit}
                    type="button" on:click={() => (isDeposit = false)}>Pay full · {formatPrice(listing.price)}</button>
            <button class="wd-pay__opt" class:wd-pay__opt--on={isDeposit}
                    type="button" on:click={() => (isDeposit = true)}>Reserve · {formatPrice(listing.deposit_amount ?? 0)}</button>
          </div>
        {/if}
        <div class="wd-pay__bar" class:wd-pay__bar--drive={isDrive}>
          <div class="wd-pay__meta">
            <span class="wd-pay__mode">{isDeposit ? 'DEPOSIT' : fulfilment === 'delivery' ? 'FULL + SHIPPING' : 'FULL PRICE'}</span>
            <Money price={payAmount} size={18} />
          </div>
          <div class="wd-pay__cta">
            {#if canShowPayButton}
              <PayButton
                listingId={listing.id}
                amountEur={payAmount}
                fulfilment={fulfilment}
                isDeposit={isDeposit}
                description={`ÉIRVOX — ${listing.title}`}
                showRefundLink={true}
              />
            {:else}
              <span class="wd-pay__hint">Choose collection or delivery to continue.</span>
            {/if}
          </div>
        </div>
      </section>
    {:else if !hasVariants}
      <section class="wd-pay">
        {#if isDrive}
          <Btn variant="ghost" size="md" full href="mailto:support@eirvox.ie?subject=DRIVE%20interest">
            Express interest
          </Btn>
        {:else}
          <Btn variant="ghost" size="md" full on:click={() => navigate('/wheels')}>
            Find your fit <Chevron size={12} color="var(--evx-paper)" />
          </Btn>
        {/if}
      </section>
    {/if}

    <div class="wd-foot-pad" aria-hidden="true"></div>
  {/if}
</div>

<style>
  .wd {
    min-height: 100%;
    height: 100vh;
    overflow-y: auto;
    background: var(--evx-black);
    color: var(--evx-paper);
    -webkit-overflow-scrolling: touch;
  }

  /* ── Top bar ── */
  .wd-top {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: transparent;
    border-bottom: 1px solid transparent;
    transition: background 240ms ease, border-color 240ms ease;
  }
  .wd-top--scrolled {
    background: rgba(14, 13, 12, 0.82);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--evx-rule-soft);
  }
  .wd-top__icon {
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1px solid var(--evx-rule);
    background: transparent;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .wd-top__menu { flex-direction: column; gap: 4px; }
  .wd-top__menu span { width: 16px; height: 1.5px; background: var(--evx-paper); }

  /* ── State ── */
  .wd-state {
    display: flex; flex-direction: column; gap: 16px; align-items: flex-start;
    padding: 60px 22px;
    font-family: var(--evx-font-display);
    color: var(--evx-paper-soft);
  }
  .wd-state h1 { font-size: 22px; font-weight: 500; color: var(--evx-paper); }

  /* ── Hero ── */
  .wd-hero { padding: 4px 0 0; }
  .wd-thumbs { display: flex; gap: 8px; padding: 10px 18px 0; }
  .wd-thumb {
    flex: 1;
    border-radius: 2px;
    overflow: hidden;
    border: 1px solid var(--evx-rule);
    background: transparent;
    padding: 0;
    cursor: pointer;
  }
  .wd-thumb--on { border-color: var(--evx-paper); }

  /* ── Header ── */
  .wd-head { padding: 24px 18px 0; }
  .wd-head__tags { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .wd-head__marque { color: var(--evx-ink-soft); }
  .wd-head__title {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: 32px;
    letter-spacing: -0.025em;
    line-height: 1.0;
  }
  .wd-head__blurb {
    font-size: 14px;
    color: var(--evx-paper-soft);
    margin: 12px 0 18px;
    max-width: 360px;
    line-height: 1.5;
  }
  .wd-head__price { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .wd-head__arriving {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-champagne);
  }

  /* ── Buy (VariantPicker host) ── */
  .wd-buy { padding: 24px 18px 0; }

  /* ── The detail ── */
  .wd-detail { padding: 30px 18px 0; }
  .wd-detail__pre { color: var(--evx-ink-soft); display: block; margin-bottom: 6px; }
  .wd-detail__row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
    padding: 13px 0;
    border-bottom: 1px solid var(--evx-rule-soft);
  }
  .wd-detail__row:last-child { border-bottom: none; }
  .wd-detail__k {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .wd-detail__v { font-size: 14px; color: var(--evx-paper); text-align: right; }

  /* ── Shipping ── */
  .wd-ship { padding: 22px 18px 0; }
  .wd-ship__line {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 0;
    border-top: 1px solid var(--evx-rule);
    font-size: 13.5px;
    color: var(--evx-paper);
  }
  .wd-ship__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--evx-fox-orange); }
  .wd-ship__note {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    color: var(--evx-ink-soft);
    line-height: 1.5;
  }

  /* ── DRIVE / non-variant pay block ── */
  .wd-pay { padding: 18px 18px 0; display: flex; flex-direction: column; gap: 12px; }
  .wd-pay__seg {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0;
    border: 1px solid var(--evx-rule); border-radius: 2px; overflow: hidden;
  }
  .wd-pay__opt {
    padding: 12px 10px;
    background: transparent;
    color: var(--evx-paper-soft);
    border: none;
    font-family: var(--evx-font-display);
    font-size: 13px;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease;
  }
  .wd-pay__opt + .wd-pay__opt { border-left: 1px solid var(--evx-rule); }
  .wd-pay__opt--on { background: var(--evx-paper); color: var(--evx-black); }

  .wd-pay__bar {
    position: sticky;
    bottom: 0;
    margin: 8px -18px 0;
    padding: 14px 18px max(20px, env(safe-area-inset-bottom));
    background: rgba(14, 13, 12, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--evx-rule);
    display: flex; align-items: center; gap: 14px;
    z-index: 5;
  }
  /* DRIVE buy bar carries the champagne identity (the only champagne CTA). */
  .wd-pay__bar--drive { border-top-color: var(--evx-champagne); }
  .wd-pay__meta { flex-shrink: 0; min-width: 110px; }
  .wd-pay__mode {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-bottom: 4px;
  }
  .wd-pay__cta { flex: 1; }
  .wd-pay__hint { font-family: var(--evx-font-mono); font-size: 11px; color: var(--evx-ink-soft); }

  .wd-foot-pad { height: 40px; }

  @media (min-width: 720px) {
    .wd-hero, .wd-head, .wd-buy, .wd-detail, .wd-ship, .wd-pay {
      max-width: 560px; margin-left: auto; margin-right: auto;
    }
  }
</style>
