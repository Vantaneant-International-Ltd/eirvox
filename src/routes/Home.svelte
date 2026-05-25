<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Button from '../lib/components/Button.svelte'
  import VerifiedMark from '../lib/components/VerifiedMark.svelte'
  import MarqueRule from '../lib/components/MarqueRule.svelte'
</script>

<Layout>

  <!-- ── S1 HERO ─────────────────────────────────────────────────────── -->
  <section class="hero">
    <div class="hero-inner page-container">

      <div class="hero-meta">
        <div class="meta-left">
          <span class="evx-label">ÉIRVOX · DUBLIN</span>
          <span class="evx-caption">ISSUE 01 / 2026</span>
        </div>
        <span class="evx-caption">17 OCTOBER 2026</span>
      </div>

      <div class="hero-text">
        <p class="h-display">Ireland's premium marketplace<span class="odot">.</span></p>
        <p class="h-accent">Carefully<br>curated<span class="odot">.</span></p>
      </div>

      <hr class="rule" />

      <div class="hero-lower">
        <div class="hl-col">
          <span class="evx-label">VOLUME ONE</span>
          <p>Automotive — opening drop.</p>
          <p>Four rooms to follow.</p>
        </div>
        <div class="hl-col">
          <span class="evx-label">HOUSE</span>
          <p>Dublin, Ireland</p>
          <p>Founded 2025</p>
        </div>
        <div class="hl-col hl-end">
          <p>— Begin below.</p>
        </div>
      </div>

    </div>
  </section>

  <!-- ── S2 CURRENT DROP ──────────────────────────────────────────────── -->
  <section class="drop page-container">

    <div class="drop-top">
      <div class="drop-top-left">
        <span class="d-dot" aria-hidden="true"></span>
        <span class="evx-label">CURRENT DROP</span>
        <span class="evx-caption">OCTOBER 2026 · LOT 04</span>
      </div>
      <span class="evx-caption">8 ON THE FLOOR · 2 RESERVED · 6 AVAILABLE</span>
    </div>
    <hr class="rule" />

    <div class="listing">
      <div class="listing-text">
        <span class="evx-caption l-sku">EVX-MB-AMG-001 · DUBLIN 02</span>
        <MarqueRule marque="mercedes" text="Mercedes-AMG" />
        <h1 class="l-title">Mercedes-AMG<br>GT — Carbon<br>Steering Wheel.</h1>
        <p class="l-sub">3K Twill, Alcantara grips.</p>
      </div>
      <div class="listing-img-col">
        <span class="evx-caption l-plate">PLATE 01 · OF 04</span>
        <div class="listing-img">
          <span class="l-circle" aria-hidden="true"></span>
          <span class="evx-caption l-img-label">PRODUCT PHOTOGRAPHY — 5:6 EDITORIAL</span>
        </div>
        <p class="evx-caption l-shot">SHOT IN DUBLIN<br>OCT 2026</p>
      </div>
    </div>

    <div class="thumbs">
      <div class="thumb thumb-on"><span class="evx-caption">01</span></div>
      <div class="thumb"><span class="evx-caption">02</span></div>
      <div class="thumb"><span class="evx-caption">03</span></div>
      <div class="thumb"></div>
    </div>

    <div class="purchase">
      <p class="p-price">€1,840</p>
      <p class="evx-caption p-vat">incl. VAT · Free Ireland delivery</p>
      <div class="p-buttons">
        <Button variant="primary">Buy Now</Button>
        <Button variant="ghost">DM Seller</Button>
      </div>
      <VerifiedMark />
      <p class="evx-caption p-trust">Every enquiry is reviewed manually by the ÉIRVOX team.</p>
    </div>

  </section>

  <!-- ── S3 THE ROOMS ─────────────────────────────────────────────────── -->
  <section class="rooms page-container">

    <div class="rooms-top">
      <span class="evx-label">THE ROOMS — one open, four to come</span>
      <span class="evx-label">CATEGORIES · 05</span>
    </div>
    <hr class="rule" />

    <div class="room r-open">
      <span class="evx-label r-status r-open-label">01 — OPEN</span>
      <h2 class="r-title">Automotive</h2>
      <p class="evx-caption r-desc">OEM+ carbon, hand-finished</p>
      <div class="r-foot">
        <a href="/#/automotive" class="r-link r-link-open">Browse → 8 listings</a>
      </div>
    </div>

    <div class="rooms-grid">
      <div class="r-cell">
        <span class="evx-label r-status">02 — SOON</span>
        <h2 class="r-title">Furniture</h2>
        <p class="evx-caption r-desc">Studio &amp; vintage editions</p>
        <div class="r-foot">
          <a href="/#/" class="r-link">Notify me</a>
          <span class="evx-caption r-date">Q4 2026</span>
        </div>
      </div>
      <div class="r-cell">
        <span class="evx-label r-status">03 — SOON</span>
        <h2 class="r-title">Streetwear</h2>
        <p class="evx-caption r-desc">Archival &amp; deadstock</p>
        <div class="r-foot">
          <a href="/#/" class="r-link">Notify me</a>
          <span class="evx-caption r-date">Q1 2027</span>
        </div>
      </div>
    </div>

    <div class="rooms-grid">
      <div class="r-cell">
        <span class="evx-label r-status">04 — SOON</span>
        <h2 class="r-title">Mobility &amp; Tech</h2>
        <p class="evx-caption r-desc">E-bikes, audio, instruments</p>
        <div class="r-foot">
          <a href="/#/" class="r-link">Notify me</a>
          <span class="evx-caption r-date">Q2 2027</span>
        </div>
      </div>
      <div class="r-cell">
        <span class="evx-label r-status">05 — SOON</span>
        <h2 class="r-title">Watches &amp; Luxury</h2>
        <p class="evx-caption r-desc">Authenticated, papered</p>
        <div class="r-foot">
          <a href="/#/" class="r-link">Notify me</a>
          <span class="evx-caption r-date">Q3 2027</span>
        </div>
      </div>
    </div>

    <hr class="rule" />
    <div class="trust-row">
      <span class="evx-caption t-item"><span class="t-dot" aria-hidden="true"></span>Verified sellers</span>
      <span class="evx-caption t-pipe">|</span>
      <span class="evx-caption t-item"><span class="t-dot" aria-hidden="true"></span>Ireland-only delivery</span>
      <span class="evx-caption t-pipe">|</span>
      <span class="evx-caption t-item"><span class="t-dot" aria-hidden="true"></span>Escrow protected</span>
    </div>
    <hr class="rule" />

  </section>

</Layout>

<style>
  /* ── SHARED ─────────────────────────────────────────────────────────── */

  .rule {
    border: none;
    border-top: 1px solid var(--evx-rule-light);
    margin: 0;
  }

  .odot {
    color: var(--evx-fox-orange);
  }

  /* ── HERO ───────────────────────────────────────────────────────────── */

  .hero {
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .hero-inner {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .hero-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--evx-space-2xl);
  }

  .meta-left {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-xl);
  }

  .hero-text {
    margin-bottom: var(--evx-space-2xl);
  }

  .h-display {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .h-accent {
    font-family: var(--evx-type-accent-family);
    font-style: var(--evx-type-accent-style);
    font-weight: var(--evx-type-accent-weight);
    font-size: var(--evx-type-accent-size);
    line-height: var(--evx-type-accent-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .hero-lower {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-top: var(--evx-space-xl);
  }

  .hl-col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .hl-col p {
    margin: 0;
    font-family: var(--evx-font-sans);
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
  }

  .hl-end {
    text-align: right;
  }

  /* ── CURRENT DROP ───────────────────────────────────────────────────── */

  .drop {
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .drop-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--evx-space-md);
  }

  .drop-top-left {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
  }

  .d-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: var(--evx-fox-orange);
    flex-shrink: 0;
  }

  /* Two-column product layout */

  .listing {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-2xl);
    align-items: start;
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .listing-text {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .l-sku {
    color: var(--evx-ink-soft);
  }

  .l-title {
    font-family: var(--evx-type-h1-family);
    font-weight: var(--evx-type-h1-weight);
    font-size: var(--evx-type-h1-size);
    line-height: var(--evx-type-h1-lh);
    letter-spacing: var(--evx-type-h1-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .l-sub {
    font-family: var(--evx-font-sans);
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .listing-img-col {
    display: flex;
    flex-direction: column;
  }

  .l-plate {
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .listing-img {
    aspect-ratio: 5 / 6;
    background-color: var(--evx-graphite);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--evx-space-md);
  }

  .l-circle {
    display: block;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px dashed var(--evx-rule-dark);
  }

  .l-img-label {
    color: var(--evx-rule-dark);
  }

  .l-shot {
    text-align: right;
    margin-top: var(--evx-space-sm);
    color: var(--evx-ink-soft);
  }

  /* Thumbnails */

  .thumbs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-sm);
    margin-bottom: var(--evx-space-xl);
  }

  .thumb {
    aspect-ratio: 3 / 2;
    background-color: var(--evx-graphite);
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: var(--evx-space-xs);
    border: 1px solid transparent;
    cursor: pointer;
  }

  .thumb-on {
    border-color: var(--evx-fox-orange);
  }

  .thumb .evx-caption {
    color: var(--evx-rule-dark);
  }

  /* Purchase */

  .purchase {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    max-width: 480px;
  }

  .p-price {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: 1;
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .p-vat {
    color: var(--evx-ink-soft);
    margin-top: calc(-1 * var(--evx-space-xs));
  }

  .p-buttons {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
  }

  .p-trust {
    color: var(--evx-ink-soft);
  }

  /* ── ROOMS ──────────────────────────────────────────────────────────── */

  .rooms {
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .rooms-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-bottom: var(--evx-space-md);
  }

  /* Room base */

  .room {
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-xl);
  }

  .r-open {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .r-status {
    display: block;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-md);
  }

  .r-open-label {
    color: var(--evx-fox-orange);
  }

  .r-title {
    font-family: var(--evx-type-h2-family);
    font-weight: var(--evx-type-h2-weight);
    font-size: var(--evx-type-h2-size);
    line-height: var(--evx-type-h2-lh);
    letter-spacing: var(--evx-type-h2-ls);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-sm) 0;
  }

  .r-desc {
    color: var(--evx-ink-soft);
    margin: 0;
  }

  .r-foot {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: var(--evx-space-xl);
  }

  .r-link {
    font-family: var(--evx-font-sans);
    font-size: var(--evx-type-body-size);
    color: var(--evx-ink-soft);
    text-decoration: underline;
    text-decoration-color: var(--evx-rule-light);
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }

  .r-link-open {
    color: var(--evx-fox-orange);
    text-decoration-color: var(--evx-fox-orange);
  }

  .r-link:hover {
    opacity: 0.65;
  }

  .r-date {
    color: var(--evx-ink-soft);
  }

  /* 2-column room grid */

  .rooms-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-2xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .r-cell {
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-xl);
  }

  /* Trust badges */

  .trust-row {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-md);
  }

  .t-item {
    display: inline-flex;
    align-items: center;
    gap: var(--evx-space-sm);
    color: var(--evx-warm-black);
  }

  .t-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: var(--evx-fox-orange);
    flex-shrink: 0;
  }

  .t-pipe {
    color: var(--evx-rule-light);
  }

  /* ── RESPONSIVE ─────────────────────────────────────────────────────── */

  @media (max-width: 767px) {
    .hero-inner {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .h-display {
      font-size: 36px;
    }

    .h-accent {
      font-size: 28px;
    }

    .hero-meta {
      margin-bottom: var(--evx-space-xl);
    }

    .hero-lower {
      flex-direction: column;
      gap: var(--evx-space-lg);
    }

    .hl-end {
      text-align: left;
    }

    .drop-top {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }

    .listing {
      grid-template-columns: 1fr;
    }

    .rooms-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }

    .r-cell {
      border-top: 1px solid var(--evx-rule-light);
    }

    .trust-row {
      flex-wrap: wrap;
      gap: var(--evx-space-md);
    }

    .t-pipe {
      display: none;
    }

    .p-price {
      font-size: 44px;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .h-display {
      font-size: 48px;
    }

    .h-accent {
      font-size: 36px;
    }
  }
</style>
