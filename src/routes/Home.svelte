<script lang="ts">
  import Layout from '../lib/components/Layout.svelte';
  import Button from '../lib/components/Button.svelte';
  import VerifiedMark from '../lib/components/VerifiedMark.svelte';
  import SectionLabel from '../lib/components/SectionLabel.svelte';
</script>

<Layout>
  <!-- HERO -->
  <section class="hero page-container">
    <div class="hero__meta">
      <span class="evx-caption">ÉIRVOX · DUBLIN</span>
      <span class="evx-caption hero__meta-sep">·</span>
      <span class="evx-caption">ISSUE 01 / 2026</span>
      <span class="evx-caption hero__meta-sep">·</span>
      <span class="evx-caption">17 OCTOBER 2026</span>
    </div>

    <h1 class="evx-display hero__headline">Ireland's premium marketplace<span class="hero__dot">.</span></h1>
    <p class="evx-accent hero__accent">Carefully curated.</p>

    <div class="hero__info">
      <div class="hero__info-col">
        <span class="evx-label">Volume One</span>
        <p class="evx-caption hero__info-text">Automotive — opening drop.</p>
        <p class="evx-caption hero__info-text">Four rooms to follow.</p>
      </div>
      <div class="hero__info-col">
        <span class="evx-label">House</span>
        <p class="evx-caption hero__info-text">Dublin, Ireland</p>
        <p class="evx-caption hero__info-text">Founded 2025</p>
      </div>
      <p class="evx-accent hero__begin">— Begin below.</p>
    </div>
  </section>

  <!-- CURRENT DROP -->
  <section class="drop">
    <div class="drop__header page-container">
      <div class="drop__header-left">
        <SectionLabel text="Current Drop" rule="top" />
        <span class="evx-caption drop__issue">OCTOBER 2026 · LOT 04</span>
      </div>
      <span class="evx-caption drop__stats">8 ON THE FLOOR · 2 RESERVED · 6 AVAILABLE</span>
    </div>

    <div class="drop__featured page-container">
      <div class="drop__image-col">
        <div class="drop__image-main">
          <span class="evx-caption drop__plate">PLATE 01 · OF 04</span>
          <div class="drop__image-placeholder">
            <div class="drop__placeholder-circle"></div>
            <span class="evx-caption">PRODUCT PHOTOGRAPHY / 5:6 / GRAPHITE</span>
          </div>
          <span class="evx-caption drop__photo-credit">SHOT IN DUBLIN / 17 OCT 2026 / RJ / IN-HOUSE</span>
        </div>
        <div class="drop__thumbs">
          {#each [1, 2, 3, 4] as i}
            <div class="drop__thumb" class:drop__thumb--active={i === 1}></div>
          {/each}
        </div>
      </div>

      <div class="drop__info-col">
        <span class="evx-caption drop__sku">EVX-MB-AMG-001 · DUBLIN 02</span>
        <span class="evx-label drop__marque">Mercedes-AMG</span>
        <h1 class="drop__title">GT — Carbon Steering Wheel.</h1>
        <p class="drop__subtitle">3K Twill, Alcantara grips.</p>
        <span class="evx-caption drop__edition">PLATE 01 · OF 04</span>
        <div class="drop__price-block">
          <p class="evx-display drop__price">€1,840</p>
          <span class="evx-caption drop__price-note">incl. VAT · Free Ireland delivery</span>
        </div>
        <div class="drop__actions">
          <Button variant="primary" href="/#/automotive/mercedes-amg-gt-carbon-steering-wheel">Buy Now — €1,840</Button>
          <Button variant="ghost" href="/#/enquire">DM Seller</Button>
        </div>
        <VerifiedMark />
      </div>
    </div>
  </section>

  <!-- THE ROOMS -->
  <section class="rooms page-container">
    <div class="rooms__header">
      <SectionLabel text="The Rooms — one open, four to come" rule="top" />
      <span class="evx-label rooms__count">CATEGORIES · 05</span>
    </div>

    <!-- Room 01: OPEN -->
    <div class="room room--open">
      <span class="evx-caption room__status--open">01 — OPEN</span>
      <h2 class="room__name">Automotive</h2>
      <p class="room__desc">OEM+ carbon, hand-finished</p>
      <div class="room__footer">
        <a href="/#/automotive" class="room__browse">Browse →</a>
        <span class="evx-caption room__count">8 listings</span>
      </div>
    </div>

    <!-- Rooms 02–05: SOON -->
    <div class="rooms__soon-grid">
      {#each [
        { num: '02', name: 'Furniture', desc: 'Studio & vintage editions', date: 'Q4 2026' },
        { num: '03', name: 'Streetwear', desc: 'Archival & deadstock', date: 'Q1 2027' },
        { num: '04', name: 'Mobility & Tech', desc: 'E-bikes, audio, instruments', date: 'Q2 2027' },
        { num: '05', name: 'Watches & Luxury', desc: 'Authenticated, papered', date: 'Q3 2027' },
      ] as r}
        <div class="room room--soon">
          <span class="evx-caption room__status--soon">{r.num} — SOON</span>
          <h2 class="room__name">{r.name}</h2>
          <p class="room__desc">{r.desc}</p>
          <div class="room__footer">
            <a href="/#/enquire" class="room__notify">Notify me</a>
            <span class="evx-caption room__date">{r.date}</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="rooms__trust">
      <span class="rooms__trust-item evx-caption">
        <span class="rooms__trust-mark" aria-hidden="true">■</span>
        Verified sellers
      </span>
      <span class="rooms__trust-sep">|</span>
      <span class="rooms__trust-item evx-caption">
        <span class="rooms__trust-mark" aria-hidden="true">■</span>
        Ireland-only delivery
      </span>
      <span class="rooms__trust-sep">|</span>
      <span class="rooms__trust-item evx-caption">
        <span class="rooms__trust-mark" aria-hidden="true">■</span>
        Escrow protected
      </span>
    </div>
  </section>
</Layout>

<style>
  /* HERO */
  .hero {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .hero__meta {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    margin-bottom: var(--evx-space-xl);
    color: var(--evx-ink-soft);
  }

  .hero__meta-sep {
    color: var(--evx-rule-light);
  }

  .hero__headline {
    margin-bottom: var(--evx-space-md);
  }

  .hero__dot {
    color: var(--evx-fox-orange);
  }

  .hero__accent {
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-3xl);
  }

  .hero__info {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--evx-space-lg);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .hero__info-col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .hero__info-text {
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-xs);
  }

  .hero__begin {
    text-align: right;
    color: var(--evx-ink-soft);
    align-self: flex-end;
  }

  /* CURRENT DROP */
  .drop {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .drop__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--evx-space-2xl);
  }

  .drop__header-left {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .drop__issue,
  .drop__stats {
    color: var(--evx-ink-soft);
  }

  .drop__featured {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .drop__image-col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .drop__image-main {
    position: relative;
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drop__plate {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    color: var(--evx-ink-soft);
  }

  .drop__photo-credit {
    position: absolute;
    bottom: var(--evx-space-md);
    right: var(--evx-space-md);
    color: var(--evx-ink-soft);
    text-align: right;
  }

  .drop__image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--evx-space-md);
    color: var(--evx-ink-soft);
  }

  .drop__placeholder-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 1px dashed var(--evx-ink-soft);
  }

  .drop__thumbs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-sm);
  }

  .drop__thumb {
    aspect-ratio: 1;
    background: var(--evx-graphite);
    opacity: 0.50;
  }

  .drop__thumb--active {
    opacity: 1;
    outline: 2px solid var(--evx-fox-orange);
    outline-offset: 2px;
  }

  .drop__info-col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    padding-top: var(--evx-space-lg);
  }

  .drop__sku,
  .drop__edition {
    color: var(--evx-ink-soft);
  }

  .drop__marque {
    color: var(--evx-ink-soft);
  }

  .drop__title {
    font-size: 44px;
    line-height: 1.10;
    letter-spacing: -0.02em;
    font-weight: 500;
  }

  .drop__subtitle {
    color: var(--evx-ink-soft);
    font-size: 18px;
  }

  .drop__price-block {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-lg);
  }

  .drop__price {
    font-size: 48px;
  }

  .drop__price-note {
    color: var(--evx-ink-soft);
  }

  .drop__actions {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
  }

  /* ROOMS */
  .rooms {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .rooms__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--evx-space-xl);
  }

  .rooms__count {
    color: var(--evx-ink-soft);
  }

  /* Room 01 — open, full width */
  .room--open {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding: var(--evx-space-xl) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: 0;
  }

  .room__status--open {
    color: var(--evx-fox-orange);
  }

  .room__status--soon {
    color: var(--evx-ink-soft);
  }

  /* Rooms 02-05 — soon, 2-col grid */
  .rooms__soon-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .room--soon {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding: var(--evx-space-xl) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    opacity: 0.60;
  }

  .room--soon:nth-child(odd) {
    padding-right: var(--evx-space-3xl);
    border-right: 1px solid var(--evx-rule-light);
  }

  .room--soon:nth-child(even) {
    padding-left: var(--evx-space-3xl);
  }

  .room__name {
    font-size: 28px;
    line-height: 1.20;
    letter-spacing: -0.015em;
    font-weight: 500;
  }

  .room__desc {
    font-size: 14px;
    color: var(--evx-ink-soft);
    flex: 1;
  }

  .room__footer {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: var(--evx-space-sm);
  }

  .room__browse,
  .room__notify {
    font-family: 'Inter Tight', sans-serif;
    font-size: 14px;
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .room__count,
  .room__date {
    color: var(--evx-ink-soft);
  }

  /* Trust row */
  .rooms__trust {
    display: flex;
    gap: var(--evx-space-xl);
    align-items: center;
    padding-top: var(--evx-space-xl);
    color: var(--evx-ink-soft);
  }

  .rooms__trust-item {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
  }

  .rooms__trust-mark {
    color: var(--evx-fox-orange);
    font-size: 8px;
  }

  .rooms__trust-sep {
    color: var(--evx-rule-light);
  }

  @media (max-width: 1023px) {
    .hero__info {
      grid-template-columns: 1fr 1fr;
    }

    .hero__begin {
      grid-column: 1 / -1;
      text-align: left;
    }

    .drop__featured {
      grid-template-columns: 1fr;
    }

    .rooms__header {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }

    .rooms__trust {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 767px) {
    .hero__info {
      grid-template-columns: 1fr;
    }

    .rooms__soon-grid {
      grid-template-columns: 1fr;
    }

    .room--soon:nth-child(odd) {
      padding-right: 0;
      border-right: none;
    }

    .room--soon:nth-child(even) {
      padding-left: 0;
    }

    .drop__header {
      flex-direction: column;
      gap: var(--evx-space-md);
    }

    .drop__title {
      font-size: 32px;
    }

    .drop__price {
      font-size: 36px;
    }
  }
</style>
