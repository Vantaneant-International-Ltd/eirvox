<script lang="ts">
  import Layout from '../lib/components/Layout.svelte';
  import Button from '../lib/components/Button.svelte';
  import VerifiedMark from '../lib/components/VerifiedMark.svelte';
  import MarqueRule from '../lib/components/MarqueRule.svelte';
  import SectionLabel from '../lib/components/SectionLabel.svelte';
  import { listings } from '../lib/data/listings';

  export let params: { slug?: string } = {};

  $: slug = params?.slug ?? '';
  $: listing = listings.find(l => l.slug === slug) ?? listings[0];
  $: currentIndex = listings.findIndex(l => l.slug === slug);
  $: prevListing = currentIndex > 0 ? listings[currentIndex - 1] : null;
  $: nextListing = currentIndex < listings.length - 1 ? listings[currentIndex + 1] : null;

  let activeThumb = 0;

  const isAMGGT = (slug: string) => slug === 'mercedes-amg-gt-carbon-steering-wheel';
</script>

<Layout footerVariant="full">
  <div class="detail page-container">
    <!-- Breadcrumb + Navigation -->
    <div class="detail__top">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="evx-caption"><a href="/#/">Marketplace</a></span>
        <span class="evx-caption breadcrumb__sep">/</span>
        <span class="evx-caption"><a href="/#/automotive">Automotive</a></span>
        <span class="evx-caption breadcrumb__sep">/</span>
        <span class="evx-caption"><a href="/#/automotive">{listing.marque}</a></span>
        <span class="evx-caption breadcrumb__sep">/</span>
        <span class="evx-caption breadcrumb__current">{listing.title}</span>
      </nav>
      <div class="detail__nav">
        {#if prevListing}
          <a href="/#/automotive/{prevListing.slug}" class="evx-caption detail__nav-link">← Previous</a>
        {:else}
          <span class="evx-caption detail__nav-link detail__nav-link--inactive">← Previous</span>
        {/if}
        <span class="evx-caption detail__nav-pos">
          {String(listing.lotNumber).padStart(2, '0')} / {String(listings.length).padStart(2, '0')}
        </span>
        {#if nextListing}
          <a href="/#/automotive/{nextListing.slug}" class="evx-caption detail__nav-link">Next →</a>
        {:else}
          <span class="evx-caption detail__nav-link detail__nav-link--inactive">Next →</span>
        {/if}
      </div>
    </div>

    <!-- SECTION 1: EDITORIAL HEADER -->
    <section class="detail__hero">
      <div class="detail__hero-left">
        <div class="detail__edition-bar">
          <span class="evx-caption">ÉDITION {String(listing.lotNumber).padStart(3, '0')} · DUBLIN · OCT 2026</span>
          <span class="evx-caption detail__sku">{listing.sku}</span>
        </div>

        <MarqueRule marque={listing.marque} text="SPECIFICATION · {listing.marque.toUpperCase()}" />

        <div class="detail__title-block">
          <span class="evx-label detail__marque-label">{listing.marque.toUpperCase()}</span>
          <h1 class="evx-display detail__model">{listing.title.split('—')[0].trim()}.</h1>
          <h2 class="detail__subtitle">{listing.title.includes('—') ? listing.title.split('—')[1].trim() : ''}</h2>
          <p class="detail__desc-line">{listing.subtitle}.</p>
        </div>
      </div>

      <div class="detail__hero-right">
        <div class="detail__image-wrap">
          <span class="evx-caption detail__plate-label">PLATE 01 · OF 04</span>
          <div class="detail__image">
            <div class="detail__img-placeholder">
              <div class="detail__img-circle"></div>
              <span class="evx-caption">PRODUCT PHOTOGRAPHY / 5:6 / GRAPHITE</span>
            </div>
          </div>
          <span class="evx-caption detail__photo-credit">SHOT IN DUBLIN / 17 OCT 2026 / RJ / IN-HOUSE</span>
        </div>

        <div class="detail__thumbs">
          {#each [0, 1, 2, 3] as i}
            <button
              class="detail__thumb"
              class:detail__thumb--active={activeThumb === i}
              on:click={() => activeThumb = i}
              aria-label="Thumbnail {i + 1}"
            ></button>
          {/each}
        </div>
      </div>
    </section>

    <!-- SECTION 2: PRICE & PURCHASE -->
    <section class="detail__purchase">
      <div class="detail__price-col">
        <span class="evx-label">Price</span>
        <p class="evx-display detail__price">{listing.priceDisplay}</p>
        <p class="detail__price-note">Inclusive of VAT. Free Ireland-only delivery, two to five working days.</p>

        <div class="detail__meta-row">
          <div class="detail__meta-item">
            <span class="evx-label">Condition</span>
            <span class="detail__meta-val">{listing.condition}</span>
          </div>
          <div class="detail__meta-item">
            <span class="evx-label">Location</span>
            <span class="detail__meta-val">{listing.location}</span>
          </div>
          <div class="detail__meta-item">
            <span class="evx-label">Edition</span>
            <em class="detail__meta-val detail__edition-italic">One of one.</em>
          </div>
        </div>

        <div class="detail__actions">
          <Button variant="primary" href="/#/enquire">Buy Now — {listing.priceDisplay}</Button>
          <Button variant="ghost" href="/#/enquire">DM Seller →</Button>
        </div>

        <VerifiedMark />

        <p class="evx-caption detail__human-note">One human reads every message — that is Renato.</p>
      </div>
    </section>

    <!-- SECTION 3: DESCRIPTION -->
    <section class="detail__section">
      <div class="detail__section-header">
        <span class="detail__roman">I</span>
        <h2>Description</h2>
      </div>
      <div class="reading-column detail__text">
        {#if isAMGGT(slug)}
          <p>
            A two-piece carbon shell hand-laid in Stuttgart, finished and trimmed in Dublin.
            Built around the original AMG horn module — installation is reversible and concours-correct.
          </p>
          <p>
            The weave is 3K, the resin is matte. The grips at nine and three are Alcantara, perforated
            where the thumbs sit and stitched in OEM black thread. There is no top marker; the wheel is
            centred by feel, the way the car was designed.
          </p>
          <p>
            This is not a replica and it is not a tuner part. It is what AMG would have built if AMG
            had been willing to make ten of them.
          </p>
        {:else}
          <p>
            A {listing.subtitle.toLowerCase()}, hand-finished and sourced from one of two suppliers
            trusted by the house. Every piece undergoes quality control in Dublin before listing.
          </p>
          <p>
            Installation is reversible. The part is concours-correct. This is not a replica — it is
            a factory-pattern component, finished to OEM specification.
          </p>
        {/if}
      </div>
    </section>

    <!-- SECTION 4: SPECIFICATION -->
    <section class="detail__section">
      <div class="detail__section-header">
        <span class="detail__roman">II</span>
        <h2>Specification</h2>
      </div>
      <p class="detail__section-subtitle evx-caption">— {listing.marque} · {listing.title.split('—')[0].trim().replace(' ', ' ')}</p>
      <p class="detail__section-note reading-column">A complete bill of materials.</p>

      <div class="spec-table">
        {#if isAMGGT(slug)}
          {#each [
            ['Material', 'Pre-preg carbon fibre, 3K twill weave. Matte clearcoat.'],
            ['Grip', 'Alcantara, perforated at nine and three. OEM black contrast stitching.'],
            ['Top Marker', 'None. The wheel is unmarked at twelve.'],
            ['Compatibility', 'AMG GT (C190, X290). DSG and MCT transmissions. Retains OEM paddle shifters.'],
            ['Origin', 'Hand-laid in Stuttgart. Trim and final QC in Dublin.'],
            ['Weight', '1.21 kg dry.'],
            ['Includes', 'OEM AMG horn module, mounting hardware, ÉIRVOX certificate of authenticity, original transit case.'],
            ['Warranty', 'Twelve months on the carbon shell. Returns accepted within fourteen days if uninstalled.'],
          ] as [label, value]}
            <div class="spec-row">
              <span class="evx-label spec-row__label">{label}</span>
              <span class="spec-row__value">{value}</span>
            </div>
          {/each}
        {:else}
          {#each [
            ['Material', 'Pre-preg carbon fibre. Matte clearcoat.'],
            ['Grip', 'Alcantara / leather to specification.'],
            ['Compatibility', `${listing.marque} · ${listing.title.split('—')[0].trim()}. Retains OEM paddle shifters.`],
            ['Origin', 'Hand-finished in Stuttgart. Final QC in Dublin.'],
            ['Includes', 'ÉIRVOX certificate of authenticity, original transit case.'],
            ['Warranty', 'Twelve months on the carbon shell. Returns within fourteen days if uninstalled.'],
          ] as [label, value]}
            <div class="spec-row">
              <span class="evx-label spec-row__label">{label}</span>
              <span class="spec-row__value">{value}</span>
            </div>
          {/each}
        {/if}
      </div>
    </section>

    <!-- SECTION 5: PROVENANCE -->
    <section class="detail__section">
      <div class="detail__section-header">
        <span class="detail__roman">III</span>
        <h2>Provenance</h2>
      </div>
      <div class="reading-column detail__text">
        {#if isAMGGT(slug)}
          <p>
            Sourced direct from one workshop in Stuttgart that supplies AMG's own carbon division.
            We take five each quarter. They are trimmed, assembled and photographed at our address
            in Dublin 02 before being listed.
          </p>
          <p>
            If the piece is wrong in any way — fitment, finish, materials — it goes back. The ones on
            the shelf are the ones that passed.
          </p>
        {:else}
          <p>
            Sourced from one shop in Stuttgart and one in Dublin. Both have supplied the same pattern to
            factory teams. Quality control is done in Dublin, by hand, before every listing goes live.
            If it doesn't meet the standard, it doesn't ship.
          </p>
        {/if}
        <p class="detail__signed">— Renato, Dublin</p>
      </div>
    </section>

    <!-- SECTION 6: HOW THIS WORKS -->
    <section class="detail__section">
      <div class="detail__section-header">
        <span class="detail__roman">IV</span>
        <h2>How this works</h2>
      </div>
      <div class="reading-column detail__text">
        <p>
          You pay through escrow. Your money sits with our payments provider, not with us, until you
          have the wheel in your hands and have confirmed it is what was listed. If something is off,
          you keep the money. If you go quiet, the funds release after seven days.
        </p>
        <p>
          Delivery is Ireland-only and free at this price tier. Couriered, signed-for, two to five
          working days from order. You will be given a tracking link the same evening.
        </p>
      </div>
      <div class="detail__trust-cta">
        <Button variant="ghost" href="/#/about">Read the full trust &amp; escrow note →</Button>
      </div>
    </section>
  </div>
</Layout>

<style>
  .detail {
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-3xl);
  }

  /* Top bar */
  .detail__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .breadcrumb {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    color: var(--evx-ink-soft);
  }

  .breadcrumb a {
    color: var(--evx-ink-soft);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .breadcrumb a:hover {
    color: var(--evx-warm-black);
  }

  .breadcrumb__sep {
    color: var(--evx-rule-light);
  }

  .breadcrumb__current {
    color: var(--evx-warm-black);
  }

  .detail__nav {
    display: flex;
    gap: var(--evx-space-xl);
    align-items: center;
  }

  .detail__nav-link {
    color: var(--evx-ink-soft);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .detail__nav-link:not(.detail__nav-link--inactive):hover {
    color: var(--evx-warm-black);
  }

  .detail__nav-link--inactive {
    opacity: 0.30;
    cursor: default;
  }

  .detail__nav-pos {
    color: var(--evx-ink-soft);
  }

  /* HERO */
  .detail__hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    margin-bottom: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .detail__edition-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-lg);
  }

  .detail__sku {
    color: var(--evx-ink-soft);
  }

  .detail__title-block {
    margin-top: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .detail__marque-label {
    color: var(--evx-ink-soft);
  }

  .detail__model {
    line-height: 1.04;
  }

  .detail__subtitle {
    font-size: 28px;
    line-height: 1.20;
    letter-spacing: -0.015em;
    font-weight: 400;
    color: var(--evx-ink-soft);
  }

  .detail__desc-line {
    color: var(--evx-ink-soft);
    font-size: 18px;
  }

  /* Image */
  .detail__image-wrap {
    position: relative;
  }

  .detail__plate-label {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    color: var(--evx-ink-soft);
    z-index: 1;
  }

  .detail__image {
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .detail__img-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--evx-space-md);
    color: var(--evx-ink-soft);
  }

  .detail__img-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px dashed var(--evx-ink-soft);
  }

  .detail__photo-credit {
    display: block;
    text-align: right;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-sm);
  }

  .detail__thumbs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-md);
  }

  .detail__thumb {
    aspect-ratio: 1;
    background: var(--evx-graphite);
    opacity: 0.50;
    cursor: pointer;
    border: none;
    transition: var(--evx-transition);
  }

  .detail__thumb:hover {
    opacity: 0.80;
  }

  .detail__thumb--active {
    opacity: 1;
    outline: 2px solid var(--evx-fox-orange);
    outline-offset: 2px;
  }

  /* PURCHASE */
  .detail__purchase {
    margin-bottom: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .detail__price-col {
    max-width: 560px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  .detail__price {
    font-size: 56px;
  }

  .detail__price-note {
    color: var(--evx-ink-soft);
    font-size: 14px;
  }

  .detail__meta-row {
    display: flex;
    gap: var(--evx-space-2xl);
    padding: var(--evx-space-lg) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .detail__meta-item {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .detail__meta-val {
    font-size: 14px;
    color: var(--evx-warm-black);
  }

  .detail__edition-italic {
    font-family: 'Newsreader', serif;
    font-style: italic;
    font-size: 16px;
  }

  .detail__actions {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
  }

  .detail__human-note {
    color: var(--evx-ink-soft);
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-md);
  }

  /* SECTIONS */
  .detail__section {
    margin-bottom: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .detail__section:last-of-type {
    border-bottom: none;
  }

  .detail__section-header {
    display: flex;
    gap: var(--evx-space-xl);
    align-items: baseline;
    margin-bottom: var(--evx-space-xl);
  }

  .detail__roman {
    font-family: 'Newsreader', serif;
    font-style: italic;
    font-size: 48px;
    line-height: 1;
    color: var(--evx-ink-soft);
  }

  .detail__section-header h2 {
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
  }

  .detail__section-subtitle {
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-lg);
    margin-top: calc(-1 * var(--evx-space-md));
  }

  .detail__section-note {
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-xl);
  }

  /* Spec table */
  .spec-table {
    max-width: 760px;
    display: flex;
    flex-direction: column;
  }

  .spec-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: var(--evx-space-lg);
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .spec-row__label {
    color: var(--evx-ink-soft);
    padding-top: 2px;
  }

  .spec-row__value {
    font-size: 15px;
    line-height: 1.60;
  }

  /* Detail text */
  .detail__text {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  .detail__text p {
    line-height: 1.70;
  }

  .detail__signed {
    font-style: italic;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-sm);
  }

  .detail__trust-cta {
    margin-top: var(--evx-space-xl);
  }

  /* Responsive */
  @media (max-width: 1023px) {
    .detail__hero {
      grid-template-columns: 1fr;
    }

    .detail__top {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-md);
    }

    .spec-row {
      grid-template-columns: 140px 1fr;
    }
  }

  @media (max-width: 767px) {
    .detail__meta-row {
      flex-direction: column;
      gap: var(--evx-space-lg);
    }

    .detail__price {
      font-size: 40px;
    }

    .spec-row {
      grid-template-columns: 1fr;
      gap: var(--evx-space-xs);
    }

    .detail__nav {
      gap: var(--evx-space-md);
    }
  }
</style>
