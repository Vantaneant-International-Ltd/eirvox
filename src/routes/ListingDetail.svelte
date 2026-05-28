<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import SellerPill from '../lib/SellerPill.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import {
    getListingBySlug,
    getSeller,
    getSimilarListings,
    getSellerListings,
    formatPrice,
    type Category,
  } from '../data/listings';
  import { navigate } from '../lib/router';

  export let slug: string;

  $: listing = getListingBySlug(slug);
  $: seller = listing ? getSeller(listing.sellerId) : undefined;
  $: similar = listing ? getSimilarListings(listing, 4) : [];
  $: sellerMore = (listing && seller) ? getSellerListings(seller.id, listing.slug).slice(0, 4) : [];

  const categoryLabels: Record<Category, string> = {
    automotive: 'Automotive',
    watches: 'Watches',
    fashion: 'Fashion',
    tech: 'Tech',
    'home-design': 'Home & Design',
    'audio-vinyl': 'Audio & Vinyl',
    art: 'Art',
  };

  let questionText = '';
  let questions = [
    { q: 'Is delivery available nationwide?', a: 'Yes — tracked and insured shipping to all of Ireland and Northern Ireland.' },
    { q: 'Are you open to offers?', a: 'Message the seller directly to discuss pricing.' },
  ];
</script>

<Nav />

{#if !listing || !seller}
  <main class="detail-404 page-container">
    <h1 class="evx-heading">Listing not found.</h1>
    <p>This listing may have been removed or the URL is incorrect.</p>
    <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/automotive')}>
      Browse all listings →
    </button>
  </main>
{:else}
  <main class="detail">
    <div class="page-container">
      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <button class="breadcrumb__item" on:click={() => navigate('/')}>HOME</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <button class="breadcrumb__item" on:click={() => navigate(`/${listing.category}`)}>
          {categoryLabels[listing.category]}
        </button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <span class="breadcrumb__item breadcrumb__item--current evx-caption">{listing.subcategory}</span>
      </nav>

      <!-- Main split -->
      <div class="detail__body">
        <!-- LEFT: Gallery -->
        <div class="detail__gallery">
          <!-- Main image -->
          <div class="gallery__main">
            {#if listing.authenticated}
              <span class="evx-caption gallery__badge gallery__badge--auth">AUTHENTICATED · {listing.condition}</span>
            {:else}
              <span class="evx-caption gallery__badge">{listing.condition}</span>
            {/if}
            <div class="gallery__placeholder">
              <span class="evx-caption gallery__placeholder-text">{listing.title}</span>
              {#if listing.listingId}
                <span class="evx-caption gallery__listing-id">{listing.listingId} · {listing.city} · PLATE 01</span>
              {/if}
            </div>
          </div>
          <!-- Thumbs -->
          <div class="gallery__thumbs">
            {#each ['01', '02', '03', '04', '05'] as n, i}
              <button class="gallery__thumb" class:gallery__thumb--active={i === 0} aria-label="Photo {n}">
                <span class="evx-caption gallery__thumb-label">{n}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- RIGHT: Deal panel -->
        <div class="detail__panel">
          <!-- Condition strip -->
          <div class="panel__condition-strip evx-caption">
            {listing.condition}
            {#if listing.authenticated} · AUTHENTICATED{/if}
            {#if listing.ships} · SHIPS{/if}
            {#if listing.collection} · COLLECTION{/if}
          </div>

          <!-- Title -->
          <h1 class="panel__title">{listing.title}</h1>
          <p class="panel__subtitle">{listing.subtitle}</p>

          <!-- Price -->
          <div class="panel__price-block">
            <div class="panel__price-row">
              <span class="panel__price">{formatPrice(listing.price)}</span>
              {#if listing.originalPrice}
                <span class="panel__original">{formatPrice(listing.originalPrice)}</span>
                <span class="panel__saving evx-caption">SAVE {formatPrice(listing.originalPrice - listing.price)}</span>
              {/if}
            </div>
            {#if listing.stock !== undefined}
              <div class="panel__stock">
                <span class="panel__stock-dot"></span>
                <span class="evx-caption">{listing.stock} OF {listing.stockTotal} REMAINING</span>
              </div>
            {/if}
          </div>

          <!-- CTA block -->
          <div class="panel__ctas">
            {#if listing.isDrive}
              <button class="evx-btn evx-btn--primary panel__cta-main" on:click={() => navigate(`/reserve/drive/${listing.driveIssue ? listing.driveIssue.toLowerCase().replace('drv-', '00') : '003'}-mercedes-amg-gt`)}>
                Reserve allocation — €49 deposit
              </button>
            {:else}
              <button class="evx-btn evx-btn--primary panel__cta-main" on:click={() => navigate(`/reserve/${listing.slug}`)}>
                Reserve for €49
              </button>
            {/if}
            <button class="evx-btn evx-btn--ghost panel__cta-offer" on:click={() => navigate('/messages')}>
              Message seller
            </button>
          </div>

          <!-- Expandable: How reservation works -->
          <details class="hrw">
            <summary class="hrw__summary">
              <span class="hrw__icon" aria-hidden="true">+</span>
              <span class="hrw__title">How reservation works</span>
            </summary>
            <ol class="hrw__steps">
              <li class="hrw__step">
                <span class="evx-label hrw__num">01</span>
                <span class="hrw__step-text">
                  <strong>Pay €49 deposit.</strong>
                  We email a Revolut payment link — usually within the hour.
                </span>
              </li>
              <li class="hrw__step">
                <span class="evx-label hrw__num">02</span>
                <span class="hrw__step-text">
                  <strong>We hold the item.</strong>
                  Off the market while you arrange the deal with {seller.name}.
                </span>
              </li>
              <li class="hrw__step">
                <span class="evx-label hrw__num">03</span>
                <span class="hrw__step-text">
                  <strong>You agree the deal in Messages.</strong>
                  Price, viewing, delivery — direct with the seller.
                </span>
              </li>
              <li class="hrw__step">
                <span class="evx-label hrw__num">04</span>
                <span class="hrw__step-text">
                  <strong>Deposit credits against balance.</strong>
                  €49 deducted from your final amount. Full refund if the deal doesn't proceed.
                </span>
              </li>
            </ol>
            <a class="hrw__more evx-caption" href="#/trust">Full buyer protection details →</a>
          </details>

          <!-- Trust rows -->
          <div class="panel__trust">
            <div class="panel__trust-row">
              <span class="evx-label panel__trust-num">01</span>
              <div class="panel__trust-text">
                <strong>€49 refundable deposit.</strong>
                Holds your reservation until you're ready to proceed. Fully refundable if you don't go ahead.
              </div>
            </div>
            {#if listing.authenticated}
              <div class="panel__trust-row">
                <span class="evx-label panel__trust-num">02</span>
                <div class="panel__trust-text">
                  <strong>Authenticated by ÉIRVOX.</strong>
                  Physically inspected in Dublin — passed our 11-point check.
                </div>
              </div>
            {/if}
            <div class="panel__trust-row">
              <span class="evx-label panel__trust-num">{listing.authenticated ? '03' : '02'}</span>
              <div class="panel__trust-text">
                <strong>Protected payments coming soon.</strong>
                Full escrow on every transaction launches H2 2026. Until then, deposits are manual and fully refundable.
              </div>
            </div>
          </div>

          <!-- Seller card -->
          <div class="panel__seller">
            <div class="panel__seller-header">
              <div class="panel__seller-avatar">{seller.name.charAt(0)}</div>
              <div class="panel__seller-info">
                <div class="panel__seller-name">{seller.name}</div>
                <SellerPill tier={seller.tier} name={seller.name} rating={seller.rating} compact={true} />
                <span class="evx-caption panel__seller-loc">{seller.location}</span>
              </div>
              <button class="evx-caption panel__seller-shop" on:click={() => navigate('/account')}>
                VIEW SHOP →
              </button>
            </div>
            <div class="panel__seller-stats">
              {#if seller.rating > 0}
                <div class="panel__seller-stat">
                  <span class="panel__seller-stat-val">★ {seller.rating.toFixed(2)}</span>
                  {#if seller.sales > 0}
                    <span class="evx-caption">{seller.sales} sales</span>
                  {/if}
                </div>
              {/if}
              <div class="panel__seller-stat">
                <span class="panel__seller-stat-val">{seller.responseTime}</span>
                <span class="evx-caption">response time</span>
              </div>
              <div class="panel__seller-stat">
                <span class="panel__seller-stat-val">Since {seller.since}</span>
                <span class="evx-caption">on ÉIRVOX</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Below the fold -->
      <div class="detail__below">
        <!-- Description + Q&A (left) -->
        <div class="detail__left-col">
          <!-- Description -->
          <section class="detail-section">
            <h2 class="detail-section__heading">Description</h2>
            {#each listing.description.split('\n\n') as para}
              <p class="detail-section__para">{para}</p>
            {/each}
          </section>

          <!-- Specification table -->
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

          <!-- Public Q&A -->
          <section class="detail-section">
            <h2 class="detail-section__heading">Public questions · {questions.length}</h2>
            <p class="evx-caption qa__meta">Answers visible to all buyers. Use Messages for private questions.</p>
            <div class="qa-list">
              {#each questions as qa}
                <div class="qa-item">
                  <p class="qa-q">Q. {qa.q}</p>
                  <p class="qa-a"><strong>{seller.name}</strong> {qa.a}</p>
                </div>
              {/each}
            </div>
            <div class="qa-input">
              <input
                type="text"
                class="qa-input__field evx-caption"
                placeholder="Ask publicly — e.g. Will you ship to Belfast?"
                bind:value={questionText}
              />
            </div>
          </section>
        </div>

        <!-- Right sidebar -->
        <div class="detail__right-col">
          {#if listing.authenticated}
            <div class="detail-aside-card">
              <span class="evx-caption detail-aside-card__title">AUTHENTICATED BY ÉIRVOX</span>
              <p class="detail-aside-card__body">
                Physically inspected at our Dublin authentication centre.
                Passed an 11-point protocol covering serials, movement, dial alignment, lume reactivity, weight, and finish.
              </p>
              <button class="evx-caption detail-aside-card__link" on:click={() => navigate('/trust')}>
                WHAT WE CHECK →
              </button>
            </div>
          {/if}

          <div class="detail-aside-card">
            <span class="evx-caption detail-aside-card__title">DELIVERY</span>
            {#if listing.ships}
              <p class="detail-aside-card__body">Tracked &amp; insured — DPD Express, 2–3 days</p>
            {/if}
            {#if listing.collection}
              <p class="detail-aside-card__body">Collection — by arrangement, {listing.city}</p>
            {/if}
          </div>

          <div class="detail-aside-card">
            <span class="evx-caption detail-aside-card__title">RESERVATION</span>
            <p class="detail-aside-card__body">
              Reserve with a €49 fully refundable deposit. No commitment until the item ships.
            </p>
            <button class="evx-caption detail-aside-card__link" on:click={() => navigate('/reserve')}>
              HOW RESERVATIONS WORK →
            </button>
          </div>
        </div>
      </div>

      <!-- More from seller -->
      {#if sellerMore.length > 0}
        <section class="more-from">
          <div class="more-from__header">
            <h2 class="more-from__heading">More from {seller.name}</h2>
            <button class="evx-caption more-from__all" on:click={() => navigate('/account')}>
              View shop · {sellerMore.length + 1} listings →
            </button>
          </div>
          <div class="more-from__grid">
            {#each sellerMore as l}
              <ListingCard listing={l} />
            {/each}
          </div>
        </section>
      {/if}

      <!-- Similar listings -->
      {#if similar.length > 0}
        <section class="similar">
          <div class="similar__header">
            <h2 class="similar__heading">Similar listings</h2>
            <button class="evx-caption similar__all" on:click={() => navigate(`/${listing.category}`)}>
              All {categoryLabels[listing.category]} →
            </button>
          </div>
          <div class="similar__grid">
            {#each similar as l}
              <ListingCard listing={l} />
            {/each}
          </div>
        </section>
      {/if}
    </div>
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
  .breadcrumb {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    padding-top: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
  }

  .breadcrumb__item {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .breadcrumb__item:hover { color: var(--evx-warm-black); }
  .breadcrumb__item--current { color: var(--evx-warm-black); cursor: default; }
  .breadcrumb__sep { color: var(--evx-rule-light); }

  /* Main split */
  .detail__body {
    display: grid;
    grid-template-columns: 1fr 440px;
    gap: var(--evx-space-3xl);
    margin-bottom: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  /* Gallery */
  .gallery__main {
    position: relative;
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-md);
  }

  .gallery__badge {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    background: var(--evx-graphite-mid);
    color: var(--evx-paper);
    padding: 3px 8px;
  }

  .gallery__badge--auth {
    background: transparent;
    border: 1px solid var(--evx-fox-orange);
    color: var(--evx-fox-orange);
  }

  .gallery__placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--evx-space-md);
    text-align: center;
    padding: var(--evx-space-xl);
  }

  .gallery__placeholder-text {
    color: rgba(245, 242, 237, 0.25);
    line-height: 1.6;
  }

  .gallery__listing-id {
    position: absolute;
    bottom: var(--evx-space-md);
    left: var(--evx-space-md);
    color: rgba(245, 242, 237, 0.30);
  }

  .gallery__thumbs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--evx-space-sm);
  }

  .gallery__thumb {
    aspect-ratio: 1;
    background: var(--evx-graphite-mid);
    border: 1px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--evx-transition);
    opacity: 0.50;
  }

  .gallery__thumb--active { opacity: 1; border-color: var(--evx-fox-orange); }
  .gallery__thumb-label { color: rgba(245, 242, 237, 0.40); }

  /* Panel */
  .panel__condition-strip {
    color: var(--evx-ink-soft);
    letter-spacing: 0.06em;
    margin-bottom: var(--evx-space-lg);
    text-transform: uppercase;
  }

  .panel__title {
    font-family: var(--evx-font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 500;
    line-height: 1.1;
    letter-spacing: -0.015em;
    margin-bottom: var(--evx-space-sm);
  }

  .panel__subtitle {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-xl);
  }

  .panel__price-block {
    padding: var(--evx-space-lg) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }

  .panel__price-row {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-md);
  }

  .panel__price {
    font-family: var(--evx-font-display);
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .panel__original {
    font-size: 16px;
    color: var(--evx-ink-soft);
    text-decoration: line-through;
  }

  .panel__saving { color: var(--evx-fox-orange); }

  .panel__stock {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: var(--evx-space-sm);
  }

  .panel__stock-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--evx-fox-orange);
    flex-shrink: 0;
  }

  .panel__ctas {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-xl);
  }

  .panel__cta-main { width: 100%; justify-content: space-between; }
  .panel__cta-offer { width: 100%; }

  /* How reservation works — expandable */
  .hrw {
    margin-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-md);
  }
  .hrw__summary {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    cursor: pointer;
    list-style: none;
    padding: var(--evx-space-xs) 0;
    color: var(--evx-warm-black);
    font-family: var(--evx-font-display);
    font-size: 13px;
    font-weight: 500;
    transition: var(--evx-transition);
  }
  .hrw__summary::-webkit-details-marker { display: none; }
  .hrw__summary:hover { opacity: 0.70; }
  .hrw__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px; height: 18px;
    border: 1px solid var(--evx-rule-light);
    color: var(--evx-ink-soft);
    font-family: var(--evx-font-mono);
    font-size: 12px;
    line-height: 1;
    transition: transform 200ms ease;
  }
  .hrw[open] .hrw__icon { transform: rotate(45deg); }
  .hrw__steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }
  .hrw__step {
    display: flex;
    gap: var(--evx-space-md);
    padding: var(--evx-space-sm) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    align-items: flex-start;
  }
  .hrw__step:last-child { border-bottom: none; }
  .hrw__num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }
  .hrw__step-text { font-size: 13px; line-height: 1.65; color: var(--evx-ink-soft); }
  .hrw__step-text strong { color: var(--evx-warm-black); font-weight: 500; }
  .hrw__more {
    display: inline-block;
    margin-top: var(--evx-space-md);
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }
  .hrw__more:hover { opacity: 0.70; }

  .panel__trust {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    padding: var(--evx-space-xl) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }

  .panel__trust-row {
    display: flex;
    gap: var(--evx-space-md);
    align-items: flex-start;
  }

  .panel__trust-num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 1px; }

  .panel__trust-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
  }

  .panel__trust-text strong { color: var(--evx-warm-black); font-weight: 500; }

  /* Seller card */
  .panel__seller {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
  }

  .panel__seller-header {
    display: flex;
    align-items: flex-start;
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-lg);
  }

  .panel__seller-avatar {
    width: 40px;
    height: 40px;
    background: var(--evx-graphite);
    color: var(--evx-paper);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 18px;
    flex-shrink: 0;
  }

  .panel__seller-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  .panel__seller-name {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 16px;
  }

  .panel__seller-loc { color: var(--evx-ink-soft); }

  .panel__seller-shop {
    background: none;
    border: none;
    color: var(--evx-ink-soft);
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    transition: var(--evx-transition);
  }

  .panel__seller-shop:hover { color: var(--evx-warm-black); }

  .panel__seller-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-md);
  }

  .panel__seller-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .panel__seller-stat-val {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 15px;
  }

  /* Below fold */
  .detail__below {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--evx-space-3xl);
    margin-bottom: var(--evx-space-3xl);
  }

  .detail-section { margin-bottom: var(--evx-space-2xl); }

  .detail-section__heading {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    margin-bottom: var(--evx-space-lg);
  }

  .detail-section__para {
    font-size: 15px;
    line-height: 1.75;
    color: var(--evx-ink);
    margin-bottom: var(--evx-space-md);
  }

  .spec-table { width: 100%; border-collapse: collapse; }

  .spec-row { border-bottom: 1px solid var(--evx-rule-light); }

  .spec-label {
    color: var(--evx-ink-soft);
    padding: var(--evx-space-md) 0;
    width: 160px;
    vertical-align: top;
  }

  .spec-value {
    font-size: 14px;
    padding: var(--evx-space-md) 0;
    color: var(--evx-warm-black);
  }

  .qa__meta { color: var(--evx-ink-soft); margin-bottom: var(--evx-space-xl); }

  .qa-list { display: flex; flex-direction: column; gap: var(--evx-space-xl); }

  .qa-item { display: flex; flex-direction: column; gap: var(--evx-space-sm); }

  .qa-q { font-size: 14px; color: var(--evx-ink-soft); }

  .qa-a {
    font-size: 14px;
    line-height: 1.6;
    color: var(--evx-warm-black);
    padding-left: var(--evx-space-lg);
    border-left: 2px solid var(--evx-rule-light);
  }

  .qa-input { margin-top: var(--evx-space-xl); }

  .qa-input__field {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md) 0;
    outline: none;
    color: var(--evx-warm-black);
  }

  .qa-input__field::placeholder { color: var(--evx-ink-soft); }

  /* Aside cards */
  .detail-aside-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    margin-bottom: var(--evx-space-md);
  }

  .detail-aside-card__title {
    display: block;
    color: var(--evx-fox-orange);
    margin-bottom: var(--evx-space-md);
  }

  .detail-aside-card__body {
    font-size: 13px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .detail-aside-card__link {
    background: none;
    border: none;
    color: var(--evx-warm-black);
    cursor: pointer;
    padding: 0;
    margin-top: var(--evx-space-sm);
    display: block;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }

  .detail-aside-card__link:hover { opacity: 0.60; }

  /* More / Similar */
  .more-from, .similar {
    margin-bottom: var(--evx-space-3xl);
    padding-top: var(--evx-space-2xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .more-from__header, .similar__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--evx-space-xl);
  }

  .more-from__heading, .similar__heading {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }

  .more-from__all, .similar__all {
    background: none;
    border: none;
    color: var(--evx-ink-soft);
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .more-from__all:hover, .similar__all:hover { color: var(--evx-warm-black); }

  .more-from__grid, .similar__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-xl);
  }

  @media (max-width: 1023px) {
    .detail__body { grid-template-columns: 1fr; }
    .detail__below { grid-template-columns: 1fr; }
    .more-from__grid, .similar__grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 767px) {
    .more-from__grid, .similar__grid { grid-template-columns: 1fr; }
    .panel__seller-stats { grid-template-columns: 1fr 1fr; }
  }
</style>
