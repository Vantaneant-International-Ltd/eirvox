<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import MarqueRule from '../lib/components/MarqueRule.svelte'
  import VerifiedMark from '../lib/components/VerifiedMark.svelte'
  import { listings } from '../lib/data/listings'

  export let params: { slug: string } = { slug: '' }

  const specRows = [
    { label: 'MATERIAL',      value: 'Pre-preg carbon fibre, 3K twill weave. Matte clearcoat.' },
    { label: 'GRIP',          value: 'Alcantara, perforated at the nine and three positions. OEM black contrast stitching.' },
    { label: 'TOP MARKER',    value: 'None. The wheel is unmarked at twelve.' },
    { label: 'COMPATIBILITY', value: 'AMG GT (C190, X290). DSG and MCT transmissions. Retains OEM paddle shifters.' },
    { label: 'ORIGIN',        value: 'Hand-laid in Stuttgart. Trim and final QC in Dublin.' },
    { label: 'WEIGHT',        value: '1.21 kg dry.' },
    { label: 'INCLUDES',      value: 'OEM AMG horn module, mounting hardware, ÉIRVOX certificate of authenticity, original transit case.' },
    { label: 'WARRANTY',      value: 'Twelve months on the carbon shell. Returns accepted within fourteen days if uninstalled.' },
  ]

  $: listing = listings.find(l => l.slug === params.slug)
  $: idx = listing ? listings.indexOf(listing) : -1
  $: prevListing = idx > 0 ? listings[idx - 1] : null
  $: nextListing = idx < listings.length - 1 ? listings[idx + 1] : null
  $: isAmgGt = params.slug === 'gt-carbon-steering-wheel'
  $: displayModel = isAmgGt ? 'GT' : (listing?.model ?? '')
  $: breadcrumb = listing
    ? ['Marketplace', 'Automotive', listing.marque, listing.title]
    : ['Marketplace', 'Automotive']

  let activeThumb = 0

  function pad(n: number): string {
    return n.toString().padStart(2, '0')
  }

  function formatPrice(price: number): string {
    if (price >= 1000) {
      const thousands = Math.floor(price / 1000)
      const remainder = (price % 1000).toString().padStart(3, '0')
      return `€${thousands},${remainder}`
    }
    return `€${price}`
  }
</script>

<Layout footerVariant="full" {breadcrumb}>
  {#if listing}
    <div
      class="page-container"
      style="padding-top: var(--evx-space-lg); padding-bottom: var(--evx-space-3xl);"
    >

      <!-- Lot navigation -->
      <nav class="lot-nav" aria-label="Listing navigation">
        {#if prevListing}
          <a class="lot-link" href="/#/automotive/{prevListing.slug}">← Previous</a>
        {:else}
          <span class="lot-link lot-disabled">← Previous</span>
        {/if}
        <span class="lot-sep" aria-hidden="true">|</span>
        <span class="lot-pos">{pad(idx + 1)} / {pad(listings.length)}</span>
        <span class="lot-sep" aria-hidden="true">|</span>
        {#if nextListing}
          <a class="lot-link" href="/#/automotive/{nextListing.slug}">Next →</a>
        {:else}
          <span class="lot-link lot-disabled">Next →</span>
        {/if}
      </nav>

      <!-- ── SECTION 1 — EDITORIAL HERO ──────────────────────────── -->
      <section class="hero">

        <div class="hero-meta-row">
          <span class="hero-meta-text">ÉDITION 001 · DUBLIN · OCT 2026</span>
          <span class="hero-meta-text">{listing.sku}</span>
        </div>
        <hr class="thin-rule" />

        <div class="hero-marque-rule">
          <MarqueRule
            marque={listing.marqueKey}
            text="SPECIFICATION · {listing.marque.toUpperCase()}"
          />
        </div>

        <div class="hero-grid">
          <div class="hero-text">
            <span class="hero-label">{listing.marque.toUpperCase()}</span>
            <p class="hero-display">{displayModel}<span class="orange-dot">.</span></p>
            <h1 class="hero-h1">Carbon Steering Wheel.</h1>
            <p class="hero-body">{listing.subtitle}</p>
          </div>

          <div class="hero-visual">
            <div class="main-image">
              <span class="plate-label">PLATE 01 · OF 04</span>
              <div class="img-center">
                <span class="img-circle" aria-hidden="true"></span>
                <span class="img-placeholder-text">PRODUCT PHOTOGRAPHY<br />5:6 / GRAPHITE</span>
              </div>
              <span class="shot-info">SHOT IN DUBLIN<br />17 OCT 2026<br />RJ / IN-HOUSE</span>
            </div>
            <div class="thumb-strip">
              {#each [0, 1, 2, 3] as i}
                <button
                  class="thumb"
                  class:thumb-active={activeThumb === i}
                  on:click={() => (activeThumb = i)}
                  aria-label="View plate {pad(i + 1)}"
                >
                  <span class="thumb-circle" aria-hidden="true"></span>
                </button>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION 2 — PRICE & PURCHASE ────────────────────────── -->
      <section class="purchase">

        <span class="purchase-label">PRICE</span>
        <p class="purchase-price">{formatPrice(listing.price)}</p>
        <p class="purchase-body">Inclusive of VAT. Free Ireland-only delivery, two to five working days.</p>

        <hr class="thin-rule purchase-rule-top" />

        <div class="meta-trio">
          <div class="meta-item">
            <span class="meta-item-label">CONDITION</span>
            <span class="meta-item-value">{listing.condition}</span>
          </div>
          <div class="meta-item-sep" aria-hidden="true"></div>
          <div class="meta-item">
            <span class="meta-item-label">LOCATION</span>
            <span class="meta-item-value">{listing.location}</span>
          </div>
          <div class="meta-item-sep" aria-hidden="true"></div>
          <div class="meta-item">
            <span class="meta-item-label">EDITION</span>
            {#if isAmgGt}
              <span class="meta-item-value meta-italic">One of one.</span>
            {:else}
              <span class="meta-item-value">—</span>
            {/if}
          </div>
        </div>

        <hr class="thin-rule purchase-rule-bottom" />

        <div class="cta-row">
          <button class="btn-primary">Buy Now — {formatPrice(listing.price)}</button>
          <a class="btn-ghost" href="/#/enquire">DM Seller →</a>
        </div>

        <div class="verified-wrap">
          <VerifiedMark />
        </div>

        <p class="trust-line">One human reads every message — that is Renato.</p>

        <div class="trust-steps" aria-hidden="true">
          <span class="trust-step">01</span>
          <span class="trust-step">02</span>
          <span class="trust-step">03</span>
        </div>
      </section>

      {#if isAmgGt}

        <!-- ── I — DESCRIPTION ──────────────────────────────────── -->
        <section class="ed-section">
          <hr class="thin-rule" />
          <div class="sec-label">
            <span class="sec-num">I</span>
            <span class="sec-title">Description</span>
          </div>
          <div class="reading-col">
            <p class="body-lg">A two-piece carbon shell hand-laid in Stuttgart, finished and trimmed in Dublin. Built around the original AMG horn module — installation is reversible and concours-correct.</p>
            <p class="body-md">The weave is 3K, the resin is matte. The grips at nine and three are Alcantara, perforated where the thumbs sit and stitched in OEM black thread. There is no top marker; the wheel is centred by feel, the way the car was designed.</p>
            <p class="body-md">This is not a replica and it is not a tuner part. It is what AMG would have built if AMG had been willing to make ten of them.</p>
          </div>
        </section>

        <!-- ── II — SPECIFICATION ───────────────────────────────── -->
        <section class="ed-section">
          <hr class="thin-rule" />
          <div class="sec-label">
            <span class="sec-num">II</span>
            <span class="sec-title">Specification</span>
          </div>
          <p class="spec-model">— Mercedes-AMG · GT (C190 / X290)</p>
          <h2 class="spec-intro">A complete bill of materials.</h2>
          <dl class="spec-table">
            {#each specRows as row}
              <div class="spec-row">
                <dt class="spec-dt">{row.label}</dt>
                <dd class="spec-dd">{row.value}</dd>
              </div>
            {/each}
          </dl>
        </section>

        <!-- ── III — PROVENANCE ──────────────────────────────────── -->
        <section class="ed-section">
          <hr class="thin-rule" />
          <div class="sec-label">
            <span class="sec-num">III</span>
            <span class="sec-title">Provenance</span>
          </div>
          <div class="reading-col">
            <p class="body-md">Sourced direct from one workshop in Stuttgart that supplies AMG's own carbon division. We take five each quarter. They are trimmed, assembled and photographed at our address in Dublin 02 before being listed.</p>
            <p class="body-md">If the piece is wrong in any way — fitment, finish, materials — it goes back. The ones on the shelf are the ones that passed.</p>
            <p class="signature">— Renato, Dublin</p>
          </div>
        </section>

        <!-- ── IV — HOW THIS WORKS ───────────────────────────────── -->
        <section class="ed-section ed-section-last">
          <hr class="thin-rule" />
          <div class="sec-label">
            <span class="sec-num">IV</span>
            <span class="sec-title">How this works</span>
          </div>
          <div class="reading-col">
            <p class="body-md">You pay through escrow. Your money sits with our payments provider, not with us, until you have the wheel in your hands and have confirmed it is what was listed. If something is off, you keep the money. If you go quiet, the funds release after seven days.</p>
            <p class="body-md">Delivery is Ireland-only and free at this price tier. Couriered, signed-for, two to five working days from order. You will be given a tracking link the same evening.</p>
            <a class="ghost-link" href="/#/about">Read the full trust &amp; escrow note →</a>
          </div>
        </section>

      {:else}

        <section class="ed-section ed-section-last">
          <hr class="thin-rule" />
          <p class="coming-soon">Full description coming soon.</p>
        </section>

      {/if}

    </div>

  {:else}
    <div class="page-container" style="padding-top: var(--evx-space-2xl); padding-bottom: var(--evx-space-3xl);">
      <p class="not-found">Listing not found.</p>
    </div>
  {/if}
</Layout>

<style>
  /* ── Lot navigation ──────────────────────────────────────────────────────── */

  .lot-nav {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .lot-link {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
    text-decoration: none;
  }

  .lot-disabled {
    opacity: 0.35;
  }

  .lot-sep,
  .lot-pos {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  /* ── Shared rule ─────────────────────────────────────────────────────────── */

  .thin-rule {
    border: none;
    border-top: 1px solid var(--evx-rule-light);
    margin: 0;
  }

  /* ── Hero section ────────────────────────────────────────────────────────── */

  .hero {
    margin-bottom: var(--evx-space-3xl);
  }

  .hero-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--evx-space-md);
  }

  .hero-meta-text {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  .hero-marque-rule {
    margin-top: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .hero-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .hero-display {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .orange-dot {
    color: var(--evx-fox-orange);
  }

  .hero-h1 {
    font-family: var(--evx-type-h1-family);
    font-weight: var(--evx-type-h1-weight);
    font-size: var(--evx-type-h1-size);
    line-height: var(--evx-type-h1-lh);
    letter-spacing: var(--evx-type-h1-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .hero-body {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-ink-soft);
    margin: var(--evx-space-md) 0 0;
  }

  /* ── Main image ──────────────────────────────────────────────────────────── */

  .main-image {
    position: relative;
    aspect-ratio: 5 / 6;
    background-color: var(--evx-graphite);
    overflow: hidden;
  }

  .plate-label {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-rule-dark);
  }

  .img-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--evx-space-md);
  }

  .img-circle {
    display: block;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    border: 1px dashed var(--evx-rule-dark);
    flex-shrink: 0;
  }

  .img-placeholder-text {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-rule-dark);
    text-align: center;
  }

  .shot-info {
    position: absolute;
    bottom: var(--evx-space-md);
    right: var(--evx-space-md);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-rule-dark);
    text-align: right;
    line-height: 1.6;
  }

  /* ── Thumbnail strip ─────────────────────────────────────────────────────── */

  .thumb-strip {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-top: 4px;
  }

  .thumb {
    position: relative;
    aspect-ratio: 5 / 6;
    background-color: var(--evx-graphite);
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .thumb-active {
    border-bottom-color: var(--evx-fox-orange);
  }

  .thumb-circle {
    display: block;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px dashed var(--evx-rule-dark);
  }

  /* ── Purchase section ────────────────────────────────────────────────────── */

  .purchase {
    margin-bottom: var(--evx-space-3xl);
  }

  .purchase-label {
    display: block;
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .purchase-price {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: 1;
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-md);
  }

  .purchase-body {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-ink-soft);
    margin: 0;
  }

  .purchase-rule-top  { margin-top: var(--evx-space-xl); }
  .purchase-rule-bottom { margin-bottom: var(--evx-space-xl); }

  /* ── Metadata trio ───────────────────────────────────────────────────────── */

  .meta-trio {
    display: flex;
    align-items: flex-start;
    gap: var(--evx-space-xl);
    padding: var(--evx-space-lg) 0;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .meta-item-sep {
    width: 1px;
    height: 44px;
    background-color: var(--evx-rule-light);
    flex-shrink: 0;
    align-self: center;
  }

  .meta-item-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .meta-item-value {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
  }

  .meta-italic {
    font-family: var(--evx-type-accent-family);
    font-style: var(--evx-type-accent-style);
    font-weight: var(--evx-type-accent-weight);
    font-size: var(--evx-type-body-size);
  }

  /* ── CTA row ─────────────────────────────────────────────────────────────── */

  .cta-row {
    display: flex;
    align-items: center;
    gap: var(--evx-space-lg);
    margin-bottom: var(--evx-space-xl);
  }

  .btn-primary {
    font-family: var(--evx-type-body-family);
    font-weight: 500;
    font-size: var(--evx-type-body-size);
    color: var(--evx-white);
    background-color: var(--evx-fox-orange);
    border: none;
    padding: var(--evx-space-md) var(--evx-space-xl);
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-ghost {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
    text-decoration: none;
    border-bottom: 1px solid var(--evx-warm-black);
    padding-bottom: 2px;
  }

  /* ── Trust block ─────────────────────────────────────────────────────────── */

  .verified-wrap {
    margin-bottom: var(--evx-space-xs);
  }

  .trust-line {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    padding-left: calc(8px + var(--evx-space-sm));
    margin: 0 0 var(--evx-space-xl);
  }

  .trust-steps {
    display: flex;
    gap: var(--evx-space-xl);
  }

  .trust-step {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  /* ── Editorial sections ──────────────────────────────────────────────────── */

  .ed-section {
    margin-top: var(--evx-space-3xl);
  }

  .ed-section-last {
    padding-bottom: var(--evx-space-xl);
  }

  .sec-label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
  }

  .sec-num {
    font-family: var(--evx-type-caption-family);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  .sec-title {
    font-family: var(--evx-type-accent-family);
    font-style: var(--evx-type-accent-style);
    font-weight: var(--evx-type-accent-weight);
    font-size: 24px;
    line-height: 1.2;
    color: var(--evx-warm-black);
  }

  /* ── Reading column ──────────────────────────────────────────────────────── */

  .reading-col {
    max-width: 620px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  .body-lg {
    font-family: var(--evx-type-body-family);
    font-weight: 500;
    font-size: 22px;
    line-height: 1.45;
    color: var(--evx-warm-black);
    margin: 0;
  }

  .body-md {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-ink-soft);
    margin: 0;
  }

  .signature {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    padding-left: var(--evx-space-md);
    margin: 0;
  }

  .ghost-link {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
    text-decoration: none;
    border-bottom: 1px solid var(--evx-warm-black);
    padding-bottom: 2px;
    display: inline;
  }

  /* ── Specification table ─────────────────────────────────────────────────── */

  .spec-model {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-ink-soft);
    margin: 0 0 var(--evx-space-md);
  }

  .spec-intro {
    font-family: var(--evx-type-h1-family);
    font-weight: var(--evx-type-h1-weight);
    font-size: var(--evx-type-h1-size);
    line-height: var(--evx-type-h1-lh);
    letter-spacing: var(--evx-type-h1-ls);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-xl);
  }

  .spec-table {
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--evx-rule-light);
  }

  .spec-row {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--evx-space-xl);
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    align-items: baseline;
  }

  .spec-dt {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .spec-dd {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── Fallback states ─────────────────────────────────────────────────────── */

  .coming-soon,
  .not-found {
    font-family: var(--evx-type-body-family);
    font-size: var(--evx-type-body-size);
    color: var(--evx-ink-soft);
    padding: var(--evx-space-xl) 0;
    margin: 0;
  }

  /* ── Mobile ──────────────────────────────────────────────────────────────── */

  @media (max-width: 768px) {
    .hero-grid {
      grid-template-columns: 1fr;
      gap: var(--evx-space-xl);
    }

    .hero-display {
      font-size: 48px;
    }

    .hero-h1 {
      font-size: 32px;
    }

    .meta-trio {
      flex-wrap: wrap;
      gap: var(--evx-space-lg);
    }

    .meta-item-sep {
      display: none;
    }

    .cta-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .spec-row {
      grid-template-columns: 1fr;
      gap: var(--evx-space-xs);
    }

    .purchase-price {
      font-size: 48px;
    }

    .spec-intro {
      font-size: 28px;
    }
  }
</style>
