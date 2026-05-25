<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Button from '../lib/components/Button.svelte'
</script>

<Layout breadcrumb={['House', 'Sell on Éirvox']} footerVariant="full">

  <!-- ── S1 HERO ────────────────────────────────────────────────────────── -->
  <section class="hero page-container">
    <span class="evx-label">SELL ON ÉIRVOX</span>
    <h1 class="hero-headline">Not everyone can list here. That's the point.</h1>
    <p class="reading-column hero-body">
      Éirvox is a curated marketplace. Every seller is reviewed, every listing is verified, and every transaction is protected by escrow. If your work meets our standard, we want to hear from you.
    </p>
  </section>

  <!-- ── S2 WHAT WE LOOK FOR ────────────────────────────────────────────── -->
  <section class="criteria page-container">
    <span class="evx-label">WHAT WE LOOK FOR</span>

    <div class="criteria-blocks">
      <div class="criteria-block">
        <div class="criteria-numeral">I</div>
        <h2>Quality over quantity.</h2>
        <p class="reading-column">
          We list five to ten pieces per drop, not five hundred. Every item must be something we would buy ourselves — OEM+ specification, hand-finished, properly documented. If it needs a disclaimer, it doesn't belong here.
        </p>
      </div>

      <div class="criteria-block">
        <div class="criteria-numeral">II</div>
        <h2>Photography that respects the object.</h2>
        <p class="reading-column">
          Listings on Éirvox are editorial, not classified ads. We photograph everything in-house on graphite at 5:6. If you're listing through us, we handle the photography. If you're an approved seller listing independently, your images must meet our spec.
        </p>
      </div>

      <div class="criteria-block">
        <div class="criteria-numeral">III</div>
        <h2>Provenance and transparency.</h2>
        <p class="reading-column">
          Where was it made? By whom? What materials? Every listing includes a bill of materials and a provenance note. If you can't answer those questions clearly, the item isn't ready.
        </p>
      </div>

      <div class="criteria-block">
        <div class="criteria-numeral">IV</div>
        <h2>Fair pricing.</h2>
        <p class="reading-column">
          We don't inflate. We don't run sales. Prices are inclusive of VAT and reflect what the item is worth. If we think your price is wrong — too high or too low — we'll tell you.
        </p>
      </div>
    </div>
  </section>

  <!-- ── S3 SELLER TIERS ────────────────────────────────────────────────── -->
  <section class="tiers page-container">
    <span class="evx-label">SELLER TIERS</span>
    <p class="tiers-intro">There are two ways to sell on Éirvox. Both require approval.</p>

    <div class="tiers-grid">
      <!-- TIER 1 -->
      <div class="tier-card">
        <span class="evx-label tier-badge tier-badge-primary">TIER 01</span>
        <h2>Sold by ÉIRVOX</h2>
        <p class="tier-body">
          We buy the item from you outright, or take it on consignment. We photograph it, list it, handle the sale, and manage delivery. You supply the piece — we do the rest.
        </p>
        <div class="tier-details">
          <div class="detail-line">
            <span class="evx-caption">Commission:</span>
            <span class="evx-caption detail-value">agreed per item</span>
          </div>
          <div class="detail-line">
            <span class="evx-caption">Photography:</span>
            <span class="evx-caption detail-value">handled by Éirvox</span>
          </div>
          <div class="detail-line">
            <span class="evx-caption">Escrow:</span>
            <span class="evx-caption detail-value">managed by Éirvox</span>
          </div>
          <div class="detail-line">
            <span class="evx-caption">Listing:</span>
            <span class="evx-caption detail-value">written by Éirvox</span>
          </div>
        </div>
        <p class="tier-note tier-note-primary">This is how all current listings work.</p>
      </div>

      <!-- TIER 2 -->
      <div class="tier-card">
        <span class="evx-label tier-badge tier-badge-muted">TIER 02</span>
        <h2>Verified Seller</h2>
        <p class="tier-body">
          You list and sell under your own name, with the Éirvox verified mark. You handle your own photography (to our spec), write your own listing (we review it), and manage your own shipping. Escrow still applies — the buyer is always protected.
        </p>
        <div class="tier-details">
          <div class="detail-line">
            <span class="evx-caption">Commission:</span>
            <span class="evx-caption detail-value">percentage per sale</span>
          </div>
          <div class="detail-line">
            <span class="evx-caption">Photography:</span>
            <span class="evx-caption detail-value">yours, to our spec</span>
          </div>
          <div class="detail-line">
            <span class="evx-caption">Escrow:</span>
            <span class="evx-caption detail-value">managed by Éirvox</span>
          </div>
          <div class="detail-line">
            <span class="evx-caption">Listing:</span>
            <span class="evx-caption detail-value">yours, reviewed by Éirvox</span>
          </div>
        </div>
        <p class="tier-note tier-note-muted">Coming Q1 2027.</p>
      </div>
    </div>
  </section>

  <!-- ── S4 THE REVIEW PROCESS ──────────────────────────────────────────── -->
  <section class="review-process page-container">
    <span class="evx-label">THE REVIEW PROCESS</span>

    <div class="process-steps">
      <div class="process-step">
        <div class="step-number">01</div>
        <h2>Apply.</h2>
        <p class="reading-column">
          Write to us with what you want to sell, where it comes from, and why it belongs on Éirvox. Include photos if you have them — they don't need to be final. We read every application ourselves.
        </p>
      </div>

      <div class="process-step">
        <div class="step-number">02</div>
        <h2>We review.</h2>
        <p class="reading-column">
          We'll look at the item, the provenance, and the asking price. If it meets our standard, we'll discuss terms — commission, photography, timeline. If it doesn't, we'll tell you why.
        </p>
      </div>

      <div class="process-step">
        <div class="step-number">03</div>
        <h2>You're listed.</h2>
        <p class="reading-column">
          Once approved, your item goes through our photography and editorial process (Tier 1) or our review process (Tier 2). It goes live in the next drop.
        </p>
      </div>
    </div>
  </section>

  <!-- ── S5 APPLY CTA ──────────────────────────────────────────────────── -->
  <section class="apply-cta page-container">
    <div class="cta-content">
      <h1 class="cta-headline">Ready to sell?</h1>
      <p class="reading-column cta-body">Write to Renato. Tell us what you have.</p>
      <Button variant="primary" href="/#/enquire">Apply to sell</Button>
      <p class="cta-note">renato@eirvox.ie · Allow 48 hours.</p>
    </div>
  </section>

</Layout>

<style>
  /* ── SECTION 1: HERO ────────────────────────────────────────────────── */

  .hero {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .hero > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .hero-headline {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    letter-spacing: var(--evx-type-display-ls);
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

  /* ── SECTION 2: WHAT WE LOOK FOR ────────────────────────────────────── */

  .criteria {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .criteria > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .criteria-blocks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
  }

  .criteria-block {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .criteria-numeral {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .criteria-block h2 {
    margin: 0;
  }

  .criteria-block p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 3: SELLER TIERS ────────────────────────────────────────── */

  .tiers {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .tiers > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-md);
  }

  .tiers-intro {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-2xl) 0;
  }

  .tiers-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-2xl);
  }

  .tier-card {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding: var(--evx-space-xl);
    border: 1px solid var(--evx-rule-light);
    background-color: var(--evx-white);
  }

  .tier-badge {
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .tier-badge-primary {
    color: var(--evx-fox-orange);
  }

  .tier-badge-muted {
    color: var(--evx-ink-soft);
  }

  .tier-card h2 {
    margin: 0;
  }

  .tier-body {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .tier-details {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }

  .detail-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .detail-line .evx-caption {
    color: var(--evx-ink-soft);
  }

  .detail-value {
    color: var(--evx-warm-black);
  }

  .tier-note {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    margin: var(--evx-space-md) 0 0 0;
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
  }

  .tier-note-primary {
    color: var(--evx-fox-orange);
  }

  .tier-note-muted {
    color: var(--evx-ink-soft);
  }

  /* ── SECTION 4: REVIEW PROCESS ──────────────────────────────────────── */

  .review-process {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .review-process > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .process-steps {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--evx-space-3xl);
  }

  .process-step {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .step-number {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-sm);
  }

  .process-step h2 {
    margin: 0;
  }

  .process-step p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 5: APPLY CTA ──────────────────────────────────────────── */

  .apply-cta {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .cta-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--evx-space-xl);
    max-width: 620px;
    margin: 0 auto;
    text-align: center;
  }

  .cta-headline {
    font-family: var(--evx-type-h1-family);
    font-weight: var(--evx-type-h1-weight);
    font-size: var(--evx-type-h1-size);
    line-height: var(--evx-type-h1-lh);
    letter-spacing: var(--evx-type-h1-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .cta-body {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .cta-note {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    margin: 0;
  }

  /* ── RESPONSIVE ────────────────────────────────────────────────────── */

  @media (max-width: 1023px) {
    .criteria-blocks {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
    }

    .tiers-grid {
      grid-template-columns: 1fr;
    }

    .process-steps {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
    }
  }

  @media (max-width: 767px) {
    .hero {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .hero-headline {
      font-size: 40px;
      margin-bottom: var(--evx-space-lg);
    }

    .criteria {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .tiers {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .review-process {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .apply-cta {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .cta-headline {
      font-size: 32px;
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .hero-headline {
      font-size: 48px;
    }

    .criteria-blocks {
      grid-template-columns: 1fr;
    }
  }
</style>
