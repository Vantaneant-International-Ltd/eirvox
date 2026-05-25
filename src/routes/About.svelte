<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Button from '../lib/components/Button.svelte'
</script>

<Layout breadcrumb={['House', 'About']} footerVariant="full">

  <!-- ── S1 HERO STATEMENT ──────────────────────────────────────────────── -->
  <section class="hero page-container">
    <div class="hero-meta">
      <span class="evx-label">ÉIRVOX · DUBLIN</span>
    </div>
    <div class="hero-meta">
      <span class="evx-label">THE HOUSE · MMXXVI</span>
    </div>

    <h1 class="hero-headline">A curation house for objects worth keeping.</h1>
    <p class="hero-subline">A magazine that happens to sell things.</p>

    <p class="reading-column hero-body">
      Founded in Dublin. We publish limited drops — five to ten pieces, one specification, no restocks. Every listing is photographed in-house, verified by hand, and sold through escrow.
    </p>
  </section>

  <!-- ── S2 HOW IT WORKS ────────────────────────────────────────────────── -->
  <section class="how-works page-container">
    <span class="evx-label">HOW THE HOUSE WORKS</span>

    <div class="works-blocks">
      <div class="work-block">
        <div class="work-numeral">I</div>
        <h2>We source.</h2>
        <p class="reading-column">
          Each vertical has one supply chain. We take five to ten pieces per quarter. Manufactured to our specifications overseas, then inspected, verified and photographed in Dublin. If the piece is wrong in any way — fitment, finish, materials — it goes back.
        </p>
      </div>

      <div class="work-block">
        <div class="work-numeral">II</div>
        <h2>We verify.</h2>
        <p class="reading-column">
          Every item is inspected, photographed and listed at our address in Dublin. There is one specification per drop and no variants. The photography is editorial — 5:6 plates, shot in-house, on graphite. What you see in the listing is what arrives.
        </p>
      </div>

      <div class="work-block">
        <div class="work-numeral">III</div>
        <h2>We protect the transaction.</h2>
        <p class="reading-column">
          Payment is held in escrow by our payments provider, not by us. Your money does not move until you have the item in your hands and have confirmed it matches the listing. If it doesn't, you keep the money. If you go quiet, funds release after seven days.
        </p>
      </div>
    </div>
  </section>

  <!-- ── S3 THE ROOMS ──────────────────────────────────────────────────── -->
  <section class="rooms page-container">
    <span class="evx-label">THE ROOMS</span>

    <div class="rooms-list">
      <div class="room-item">
        <span class="evx-label room-status">01 — AUTOMOTIVE</span>
        <h2>Automotive</h2>
        <p>OEM+ carbon steering wheels. Hand-finished, serialised, escrow-protected.</p>
        <div class="room-action">
          <Button variant="ghost" href="/#/automotive">Browse automotive</Button>
        </div>
      </div>

      <div class="room-item">
        <span class="evx-label room-status">02 — FURNITURE</span>
        <h2>Furniture</h2>
        <p>Studio & vintage editions</p>
        <span class="evx-caption room-date">Q4 2026</span>
      </div>

      <div class="room-item">
        <span class="evx-label room-status">03 — STREETWEAR</span>
        <h2>Streetwear</h2>
        <p>Archival & deadstock</p>
        <span class="evx-caption room-date">Q1 2027</span>
      </div>

      <div class="room-item">
        <span class="evx-label room-status">04 — MOBILITY & TECH</span>
        <h2>Mobility & Tech</h2>
        <p>E-bikes, audio, instruments</p>
        <span class="evx-caption room-date">Q2 2027</span>
      </div>

      <div class="room-item">
        <span class="evx-label room-status">05 — WATCHES & LUXURY</span>
        <h2>Watches & Luxury</h2>
        <p>Authenticated, papered</p>
        <span class="evx-caption room-date">Q3 2027</span>
      </div>
    </div>
  </section>

  <!-- ── S4 THE PEOPLE ──────────────────────────────────────────────────── -->
  <section class="people page-container">
    <span class="evx-label">THE HOUSE</span>

    <div class="people-list">
      <div class="person">
        <h2>Renato Gusani</h2>
        <p>Co-founder. Sources, verifies, photographs, and reads every message.</p>
      </div>

      <div class="person">
        <h2>Kevin Singpurwala</h2>
        <p>Co-founder. Payments, infrastructure, and operations.</p>
      </div>
    </div>
  </section>

  <!-- ── S5 REGISTERED DETAILS ──────────────────────────────────────────── -->
  <section class="registered page-container">
    <div class="reg-section">
      <span class="evx-label">REGISTERED</span>
      <div class="reg-content">
        <p>ÉirVox Systems Ltd</p>
        <p>Dublin, Ireland</p>
        <p>eirvox.ie</p>
        <p>VAT & CRO on request</p>
      </div>
    </div>

    <div class="reg-section">
      <span class="evx-label">AFFILIATION</span>
      <div class="reg-content">
        <p>Parent · vnta.xyz</p>
        <p>Sister · vendr.ie</p>
      </div>
    </div>

    <div class="reg-section">
      <span class="evx-label">WRITE</span>
      <div class="reg-content">
        <p>renato@eirvox.ie</p>
        <div class="contact-button">
          <Button variant="ghost" href="/#/enquire">Write to the house</Button>
        </div>
      </div>
    </div>
  </section>

</Layout>

<style>
  /* ── SECTION 1: HERO STATEMENT ──────────────────────────────────────── */

  .hero {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .hero-meta {
    display: block;
    margin-bottom: var(--evx-space-sm);
  }

  .hero-headline {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: var(--evx-space-2xl) 0 var(--evx-space-lg) 0;
  }

  .hero-subline {
    font-family: var(--evx-type-accent-family);
    font-style: var(--evx-type-accent-style);
    font-weight: var(--evx-type-accent-weight);
    font-size: var(--evx-type-accent-size);
    line-height: var(--evx-type-accent-lh);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-xl) 0;
  }

  .hero-body {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 2: HOW IT WORKS ────────────────────────────────────────── */

  .how-works {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .how-works > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .works-blocks {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--evx-space-3xl);
  }

  .work-block {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .work-numeral {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .work-block h2 {
    margin: 0;
  }

  .work-block p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 3: THE ROOMS ──────────────────────────────────────────── */

  .rooms {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .rooms > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .rooms-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-2xl);
    row-gap: var(--evx-space-3xl);
  }

  .room-item {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .room-item:nth-child(1) {
    grid-column: 1 / -1;
    padding-bottom: var(--evx-space-2xl);
  }

  .room-status {
    color: var(--evx-ink-soft);
  }

  .room-item:nth-child(1) .room-status {
    color: var(--evx-fox-orange);
  }

  .room-item h2 {
    margin: 0;
  }

  .room-item p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .room-action {
    margin-top: var(--evx-space-md);
  }

  .room-date {
    color: var(--evx-ink-soft);
  }

  /* ── SECTION 4: THE PEOPLE ────────────────────────────────────────── */

  .people {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .people > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .people-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
  }

  .person {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .person h2 {
    margin: 0;
  }

  .person p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 5: REGISTERED DETAILS ────────────────────────────────── */

  .registered {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .reg-section {
    margin-bottom: var(--evx-space-3xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .reg-section:last-child {
    margin-bottom: 0;
  }

  .reg-section > .evx-label {
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .reg-content {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .reg-content p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .contact-button {
    margin-top: var(--evx-space-sm);
  }

  /* ── RESPONSIVE ────────────────────────────────────────────────────── */

  @media (max-width: 767px) {
    .hero {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .hero-headline {
      font-size: 40px;
      margin: var(--evx-space-xl) 0 var(--evx-space-md) 0;
    }

    .hero-subline {
      font-size: 28px;
      margin-bottom: var(--evx-space-lg);
    }

    .how-works {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .works-blocks {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
    }

    .rooms {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .rooms-list {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
      row-gap: var(--evx-space-2xl);
    }

    .room-item:nth-child(1) {
      grid-column: auto;
    }

    .people {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .people-list {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
    }

    .registered {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .hero-headline {
      font-size: 48px;
    }

    .hero-subline {
      font-size: 36px;
    }

    .works-blocks {
      grid-template-columns: 1fr 1fr;
      gap: var(--evx-space-2xl);
    }

    .work-block:nth-child(3) {
      grid-column: 1 / -1;
    }
  }
</style>
