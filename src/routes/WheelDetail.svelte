<script lang="ts">
  // ============================================================
  // /wheels/:slug — warm-paper wheel detail (DRIVE + standard).
  //
  // Canonical anatomy on the Paper surface: hero (product shot edge-to-
  // edge on paper + static SVG dimension layer) → one-line statement →
  // mono spec table → macro strip → single orange CTA → accordions.
  //   * standard wheels (listing_variants present) -> VariantPicker
  //     (orange "Fits your <chassis>" tag, live finish chips, PayButton)
  //   * DRIVE wheels (is_drive, no variants) -> deposit/full pay block;
  //     champagne survives only on the DRIVE pill/plate.
  //
  // Commerce is unchanged: same VariantPicker + PayButton + server
  // amount resolution as the marketplace detail. Only the surface is new.
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
  import PhotoFrame from '../lib/wheels-ui/PhotoFrame.svelte';
  import FactNeeded from '../lib/FactNeeded.svelte';
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
  $: tier = isDrive ? 'DRIVE' : 'THE RANGE';
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
  // DRIVE visibility is decoupled from purchasability. An 'active' DRIVE
  // issue is visible to the public under RLS, but the Reserve/deposit
  // controls only open when the issue state is 'open'. 'upcoming' (or any
  // non-open) issue shows the product without a buy control. Non-DRIVE
  // house wheels are unaffected by this gate.
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

<div class="wd evx-root" on:scroll={onScroll}>

  <Nav dark />

  {#if loading}
    <div class="wd-state">Loading.</div>
  {:else if !listing}
    <div class="wd-state">
      <h1>This wheel isn't available.</h1>
      <Btn variant="ghost" size="md" on:click={() => navigate('/wheels')}>Back to wheels</Btn>
    </div>
  {:else}

    <!-- ━━ HERO — designed slot + static dimension annotation layer ━━ -->
    <section class="wd-hero">
      <div class="wd-slot wd-hero__slot" style="aspect-ratio:1 / 1;">
        {#if activeImageUrl}
          <img class="wd-hero__img" src={activeImageUrl} alt={listing.title} />
        {/if}

        <!-- Static schematic + numbered dimension callouts. Real figures
             arrive via the [FACT NEEDED] legend below; nothing is invented. -->
        <svg class="wd-dim" viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <circle cx="200" cy="200" r="150" stroke="rgba(244,241,236,0.22)" stroke-width="1" />
          <circle cx="200" cy="200" r="92" stroke="rgba(244,241,236,0.14)" stroke-width="1" />
          <circle cx="200" cy="200" r="15" fill="rgba(244,241,236,0.18)" />
          <!-- 3-spoke schematic -->
          <line x1="200" y1="200" x2="200" y2="108" stroke="rgba(244,241,236,0.14)" stroke-width="1" />
          <line x1="200" y1="200" x2="280" y2="246" stroke="rgba(244,241,236,0.14)" stroke-width="1" />
          <line x1="200" y1="200" x2="120" y2="246" stroke="rgba(244,241,236,0.14)" stroke-width="1" />
          <!-- ① overall ⌀ dimension line (below the circle) -->
          <line x1="58" y1="372" x2="342" y2="372" stroke="var(--evx-fox-orange)" stroke-width="1" />
          <line x1="58" y1="365" x2="58" y2="379" stroke="var(--evx-fox-orange)" stroke-width="1" />
          <line x1="342" y1="365" x2="342" y2="379" stroke="var(--evx-fox-orange)" stroke-width="1" />
          <circle cx="200" cy="372" r="11" fill="none" stroke="var(--evx-fox-orange)" stroke-width="1" />
          <text x="200" y="376" class="wd-dim__num">1</text>
          <!-- ② grip ⌀ leader (right) -->
          <line x1="292" y1="200" x2="356" y2="200" stroke="var(--evx-fox-orange)" stroke-width="1" stroke-dasharray="2 3" />
          <circle cx="367" cy="200" r="11" fill="none" stroke="var(--evx-fox-orange)" stroke-width="1" />
          <text x="367" y="204" class="wd-dim__num">2</text>
          <!-- ③ rim thickness leader (top, outer→grip ring) -->
          <line x1="200" y1="61" x2="200" y2="108" stroke="var(--evx-fox-orange)" stroke-width="1" stroke-dasharray="2 3" />
          <circle cx="200" cy="50" r="11" fill="none" stroke="var(--evx-fox-orange)" stroke-width="1" />
          <text x="200" y="54" class="wd-dim__num">3</text>
        </svg>

        <span class="wd-slot__cap">SHOT 01 · {isDrive ? '¾ FRONT · LED' : '¾ FRONT'}</span>
      </div>

      <dl class="wd-dim__legend">
        <div class="wd-dim__item"><dt><span class="wd-dim__no">1</span> Overall ⌀</dt><dd><FactNeeded label="overall diameter" /></dd></div>
        <div class="wd-dim__item"><dt><span class="wd-dim__no">2</span> Grip ⌀</dt><dd><FactNeeded label="grip diameter" /></dd></div>
        <div class="wd-dim__item"><dt><span class="wd-dim__no">3</span> Rim</dt><dd><FactNeeded label="rim thickness" /></dd></div>
      </dl>

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

    <!-- ━━ STATEMENT — tier, title, one-line statement ━━ -->
    <section class="wd-head">
      <div class="wd-head__tags">
        <TierTag tier={tier} />
        {#if listing.vehicle_make}<span class="evx-label wd-head__marque">{listing.vehicle_make}</span>{/if}
      </div>

      <h1 class="wd-head__title">{listing.title}</h1>
      {#if listing.subtitle}<p class="wd-head__statement">{listing.subtitle}</p>{/if}
      {#if isDrive}
        <!-- Edition SIZE only — never a per-unit serial (registry is gated
             until a DB-backed serial exists; lockfile §8). -->
        <span class="wd-head__edition">Limited to {listing.drive_made_count ?? 10} · Made once. Not reprinted.</span>
      {/if}
      <!-- 'Arriving' only for not-yet-open issues; an OPEN issue is buyable
           now, so 'Arriving' there reads as a contradiction. -->
      {#if isDrive && !driveOpen && arriving}<span class="wd-head__arriving">Arriving {arriving}</span>{/if}
    </section>

    <!-- ━━ SPECIFICATION — mono table ━━ -->
    {#if specs.length > 0}
      <section class="wd-detail">
        <span class="evx-label wd-detail__pre">Specification</span>
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

    <!-- ━━ MACRO STRIP — designed slots (no carbon-weave placeholder) ━━ -->
    <section class="wd-macro">
      <div class="wd-macro__grid">
        {#each ['MACRO · WEAVE', 'MACRO · GRIP', 'MACRO · HARDWARE'] as cap}
          <div class="wd-slot wd-macro__tile" style="aspect-ratio:1/1;">
            <span class="wd-slot__cap">{cap}</span>
          </div>
        {/each}
      </div>
    </section>

    <!-- ━━ CTA ZONE — one buy path: variants / deposit / arriving / finder ━━ -->
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
    {:else if payable}
      <section class="wd-pay">
        {#if isDrive}
          <!-- DRIVE confirm-your-car capture (NOT a fitment plate). The
               capture model is not wired yet, so it renders as a visible
               token rather than a dead input that captures nothing. -->
          <div class="wd-confirm">
            <span class="wd-confirm__label">Confirm your car</span>
            <p class="wd-confirm__note">DRIVE fits a range of cars. We match the fit to yours before it ships. <FactNeeded label="FITMENT CAPTURE MODEL" dark /></p>
          </div>
        {/if}
        {#if listing.original_price && listing.original_price > listing.price}
          <Money price={listing.price} was={listing.original_price} size={20} />
        {/if}
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
                    type="button" on:click={() => (isDeposit = false)}>Pay in full · {formatPrice(listing.price)}</button>
            <button class="wd-pay__opt" class:wd-pay__opt--on={isDeposit}
                    type="button" on:click={() => (isDeposit = true)}>Pay deposit · {formatPrice(listing.deposit_amount ?? 0)}</button>
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
                description={`ÉIRVOX · ${listing.title}`}
                showRefundLink={true}
              />
            {:else}
              <span class="wd-pay__hint">Choose collection or delivery to continue.</span>
            {/if}
          </div>
        </div>
      </section>
    {:else if isDrive}
      <!-- DRIVE visible but not open: honest arriving state, no buy control -->
      <section class="wd-pay">
        <div class="wd-arrive" class:wd-arrive--closed={listing.drive_issue_state === 'archived'}>
          {#if listing.drive_issue_state === 'archived'}
            <span class="wd-arrive__pre">DRIVE</span>
            <span class="wd-arrive__date">This issue is closed.</span>
          {:else}
            <span class="wd-arrive__pre">Arriving</span>
            <span class="wd-arrive__date">{listing.drive_issue_date ?? 'soon'}</span>
            <span class="wd-arrive__note">On sale when the run begins.</span>
          {/if}
        </div>
      </section>
    {:else}
      <section class="wd-pay">
        <Btn variant="ghost" size="md" full on:click={() => navigate('/wheels')}>
          Find your fit <Chevron size={12} color="var(--evx-paper)" />
        </Btn>
      </section>
    {/if}

    <!-- ━━ ACCORDIONS ━━ -->
    <section class="wd-acc-list">
      {#if blurb}
        <details class="wd-acc">
          <summary class="wd-acc__sum">The detail</summary>
          <div class="wd-acc__body"><p>{blurb}</p></div>
        </details>
      {/if}
      <details class="wd-acc">
        <summary class="wd-acc__sum">Shipping &amp; collection</summary>
        <div class="wd-acc__body">
          <p>Shipped via An Post, Ireland.</p>
          {#if hasCollection}<p>Collection by arrangement in Dublin.</p>{/if}
          {#if isDrive && payable}
            <p>Made to order; ships when the run is finished{listing.drive_issue_date ? ` in ${listing.drive_issue_date}` : ''}.</p>
          {/if}
        </div>
      </details>
    </section>

    <div class="wd-foot-pad" aria-hidden="true"></div>

    <Footer dark />
  {/if}
</div>

<style>
  .wd {
    min-height: 100%;
    height: 100vh;
    overflow-y: auto;
    background: var(--evx-paper);
    color: var(--evx-ink);
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
    background: rgba(245, 242, 237, 0.82);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .wd-top__icon {
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer;
  }
  .wd-top__menu { flex-direction: column; gap: 4px; }
  .wd-top__menu span { width: 16px; height: 1.5px; background: var(--evx-ink); }

  /* ── State ── */
  .wd-state {
    display: flex; flex-direction: column; gap: 16px; align-items: flex-start;
    padding: 60px 22px;
    font-family: var(--evx-font-display);
    color: var(--evx-ink-soft);
  }
  .wd-state h1 { font-size: 22px; font-weight: 500; color: var(--evx-ink); }

  /* ── Hero (designed slot + dimension layer) ── */
  .wd-hero { padding: 4px 18px 0; }
  .wd-hero__slot { position: relative; }
  .wd-hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .wd-dim { position: absolute; inset: 0; width: 100%; height: 100%; }
  .wd-dim__num {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    fill: var(--evx-fox-orange);
    text-anchor: middle;
  }
  .wd-dim__legend {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin: 12px 0 0;
    padding: 14px 0 0;
    border-top: 1px solid var(--evx-rule-light);
  }
  .wd-dim__item { display: flex; flex-direction: column; gap: 6px; }
  .wd-dim__item dt {
    display: flex; align-items: center; gap: 7px;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .wd-dim__item dd { margin: 0; }
  .wd-dim__no {
    display: inline-flex; align-items: center; justify-content: center;
    width: 16px; height: 16px;
    border: 1px solid var(--evx-fox-orange);
    border-radius: 50%;
    font-size: 9px;
    color: var(--evx-fox-orange);
  }

  .wd-thumbs { display: flex; gap: 8px; padding: 10px 0 0; }
  .wd-thumb {
    flex: 1;
    border-radius: 2px;
    overflow: hidden;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    padding: 0;
    cursor: pointer;
  }
  .wd-thumb--on { border-color: var(--evx-ink); }

  /* ── Header ── */
  .wd-head { padding: var(--evx-space-xl) 18px 0; }
  .wd-head__tags { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .wd-head__marque { color: var(--evx-ink-soft); }
  .wd-head__title {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: 32px;
    letter-spacing: -0.025em;
    line-height: 1.0;
  }
  .wd-head__statement {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 18px;
    color: var(--evx-ink-soft);
    margin: 14px 0 16px;
    max-width: 380px;
    line-height: 1.4;
  }
  .wd-head__arriving {
    display: inline-block;
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-champagne-dim);
  }

  /* ── Buy (VariantPicker host) ── */
  .wd-buy { padding: var(--evx-space-2xl) 18px 0; }

  /* ── Designed photo slot (shared) + macro strip ── */
  .wd-slot {
    position: relative;
    width: 100%;
    background: rgba(26, 26, 26, 0.045);
    border: 1px solid var(--evx-rule-light);
    border-radius: 3px;
    overflow: hidden;
  }
  .wd-slot__cap {
    position: absolute;
    left: 11px;
    bottom: 10px;
    font-family: var(--evx-font-mono);
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .wd-macro { padding: var(--evx-space-2xl) 18px 0; }
  .wd-macro__grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--evx-space-md); }

  /* ── Accordions (native details, type-only toggle, no icons) ── */
  .wd-acc-list { padding: var(--evx-space-2xl) 18px 0; }
  .wd-acc { border-top: 1px solid var(--evx-rule-light); }
  .wd-acc:last-child { border-bottom: 1px solid var(--evx-rule-light); }
  .wd-acc__sum {
    list-style: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-ink);
  }
  .wd-acc__sum::-webkit-details-marker { display: none; }
  .wd-acc__sum::after {
    content: '+';
    font-family: var(--evx-font-mono);
    font-size: 16px;
    color: var(--evx-ink-soft);
  }
  .wd-acc[open] .wd-acc__sum::after { content: '\2212'; }
  .wd-acc__body {
    padding: 0 0 16px;
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
  }
  .wd-acc__body p { margin: 0 0 8px; }
  .wd-acc__body p:last-child { margin-bottom: 0; }

  /* ── The detail ── */
  .wd-detail { padding: var(--evx-space-2xl) 18px 0; }
  .wd-detail__pre { color: var(--evx-ink-soft); display: block; margin-bottom: 6px; }
  .wd-detail__row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
    padding: 13px 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .wd-detail__row:last-child { border-bottom: none; }
  .wd-detail__k {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .wd-detail__v { font-size: 14px; color: var(--evx-ink); text-align: right; }

  /* ── DRIVE / non-variant pay block ── */
  .wd-pay { padding: 18px 18px 0; display: flex; flex-direction: column; gap: 12px; }
  .wd-pay__seg {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0;
    border: 1px solid var(--evx-rule-light); border-radius: 2px; overflow: hidden;
  }
  .wd-pay__opt {
    padding: 12px 10px;
    background: transparent;
    color: var(--evx-ink-soft);
    border: none;
    font-family: var(--evx-font-display);
    font-size: 13px;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease;
  }
  .wd-pay__opt + .wd-pay__opt { border-left: 1px solid var(--evx-rule-light); }
  .wd-pay__opt--on { background: var(--evx-ink); color: var(--evx-paper); }

  .wd-pay__bar {
    position: sticky;
    bottom: 0;
    margin: 8px -18px 0;
    padding: 14px 18px max(20px, env(safe-area-inset-bottom));
    background: rgba(245, 242, 237, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--evx-rule-light);
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

  /* DRIVE arriving (visible, not yet open) — calm champagne, no buy. */
  .wd-arrive {
    display: flex; flex-direction: column; gap: 4px;
    padding: 16px 18px;
    border: 1px solid var(--evx-champagne);
    border-radius: 2px;
    background: rgba(201, 169, 97, 0.06);
  }
  .wd-arrive--closed { border-color: var(--evx-rule-light); background: transparent; }
  .wd-arrive__pre {
    font-family: var(--evx-font-mono);
    font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--evx-champagne-dim);
  }
  .wd-arrive__date {
    font-family: var(--evx-font-display);
    font-size: 18px; font-weight: 500; color: var(--evx-ink);
  }
  .wd-arrive__note {
    font-family: var(--evx-font-mono); font-size: 11px; color: var(--evx-ink-soft);
  }

  .wd-foot-pad { height: 40px; }

  @media (min-width: 720px) {
    .wd-hero, .wd-head, .wd-buy, .wd-detail, .wd-macro, .wd-pay, .wd-acc-list {
      max-width: 560px; margin-left: auto; margin-right: auto;
    }
  }

  /* ── Dark reskin (matches Wheel_Detail_dc / DRIVE_Detail_dc) ──────────
     The rules above were authored for the white-rework page; these win by
     order and flip surfaces/text/borders to the locked dark world. Fox
     orange stays the only UI accent; champagne stays DRIVE-only. */
  .wd { background: var(--evx-black); color: var(--evx-paper); }
  .wd-state h1,
  .wd-head__title,
  .wd-detail__v,
  .wd-acc__sum,
  .wd-arrive__date { color: var(--evx-paper); }
  .wd-head__title { font-weight: 500; }
  .wd-slot { background: var(--evx-surface-2); border-color: var(--evx-rule); }
  .wd-top__icon,
  .wd-thumb,
  .wd-dim__legend,
  .wd-acc,
  .wd-detail__row,
  .wd-pay__seg,
  .wd-pay__opt + .wd-pay__opt { border-color: var(--evx-rule); }
  .wd-acc:last-child { border-bottom-color: var(--evx-rule); }
  .wd-arrive--closed { border-color: var(--evx-rule); }
  .wd-thumb--on { border-color: var(--evx-paper); }
  .wd-top__menu span { background: var(--evx-paper); }
  .wd-top--scrolled { background: rgba(14, 13, 12, 0.82); border-bottom-color: var(--evx-rule); }
  .wd-pay__opt--on { background: var(--evx-paper); color: var(--evx-black); }
  .wd-pay__bar { background: rgba(14, 13, 12, 0.92); border-top-color: var(--evx-rule); }
  .wd-pay__bar--drive { border-top-color: var(--evx-champagne); }

  /* DRIVE edition line — champagne (DRIVE-only chrome), edition SIZE only. */
  .wd-head__edition {
    display: inline-block;
    margin-top: 14px;
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-champagne);
    border: 1px solid var(--evx-champagne-dim);
    padding: 6px 11px;
    border-radius: 2px;
  }
  /* DRIVE confirm-your-car capture (honest note, no dead input). */
  .wd-confirm {
    border: 1px solid var(--evx-rule);
    background: var(--evx-surface);
    padding: 14px 16px;
    border-radius: 2px;
  }
  .wd-confirm__label {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
    margin-bottom: 8px;
  }
  .wd-confirm__note { font-size: 13px; color: var(--evx-paper-soft); line-height: 1.5; }
</style>
