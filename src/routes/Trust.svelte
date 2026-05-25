<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Button from '../lib/components/Button.svelte'
</script>

<Layout breadcrumb={['House', 'Trust & Escrow']} footerVariant="full">

  <!-- ── S1 HEADER ──────────────────────────────────────────────────────── -->
  <section class="header page-container">
    <span class="evx-label">TRUST & ESCROW</span>
    <h1 class="header-headline">Your money doesn't move until you're satisfied.</h1>
    <p class="reading-column header-body">
      Every transaction on Éirvox is protected by escrow. We never hold your funds — a licensed payments provider does. This page explains exactly how it works, step by step.
    </p>
  </section>

  <!-- ── S2 HOW ESCROW WORKS ─────────────────────────────────────────────── -->
  <section class="how-escrow page-container">
    <span class="evx-label">HOW IT WORKS</span>

    <div class="steps">
      <div class="step">
        <div class="step-number">01</div>
        <h2>You pay.</h2>
        <p class="reading-column">
          When you click Buy Now, your payment is captured and held by our escrow provider. The money leaves your account but does not reach the seller. It sits in a protected holding account.
        </p>
      </div>

      <div class="step">
        <div class="step-number">02</div>
        <h2>We ship.</h2>
        <p class="reading-column">
          The item is dispatched within one working day. Couriered, signed-for, tracked. You receive a tracking link the same evening. Delivery is two to five working days, Ireland only.
        </p>
      </div>

      <div class="step">
        <div class="step-number">03</div>
        <h2>You confirm.</h2>
        <p class="reading-column">
          When the item arrives, inspect it. Check the fitment, the finish, the materials against the listing. If everything matches, confirm delivery in your account. The funds release to the seller.
        </p>
      </div>

      <div class="step">
        <div class="step-number">04</div>
        <h2>Or you don't.</h2>
        <p class="reading-column">
          If the item is not as listed — wrong specification, damage in transit, anything materially different from the listing — you open a dispute. The funds return to you. If you neither confirm nor dispute within seven days, the funds release automatically.
        </p>
      </div>
    </div>
  </section>

  <!-- ── S3 WHAT'S COVERED ──────────────────────────────────────────────── -->
  <section class="whats-covered page-container">
    <span class="evx-label">WHAT'S COVERED</span>
    <div class="covered-text">
      <p class="reading-column">
        Escrow covers the purchase price including VAT. Delivery is free at all current price tiers and is included in the escrow window.
      </p>
      <p class="reading-column">
        Returns are accepted within fourteen days of delivery if the item has not been installed or modified. Return shipping is on us.
      </p>
    </div>
  </section>

  <!-- ── S4 WHAT'S NOT COVERED ──────────────────────────────────────────── -->
  <section class="whats-not-covered page-container">
    <span class="evx-label">WHAT'S NOT COVERED</span>
    <div class="not-covered-text">
      <p class="reading-column">
        Escrow does not cover buyer's remorse, change of vehicle, or items that have been installed. Once an item is fitted to a car, it is yours.
      </p>
      <p class="reading-column">
        Custom orders, if offered in future, will have separate terms noted on the listing.
      </p>
    </div>
  </section>

  <!-- ── S5 PAYMENT METHODS ──────────────────────────────────────────────── -->
  <section class="payment-methods page-container">
    <span class="evx-label">PAYMENT METHODS</span>
    <div class="payment-text">
      <p class="reading-column">
        We accept all major credit and debit cards. Apple Pay and Google Pay are available at checkout. Bank transfers are accepted for orders over €1,500 — contact us to arrange.
      </p>
      <p class="reading-column">
        All prices are inclusive of Irish VAT at the applicable rate.
      </p>
    </div>
  </section>

  <!-- ── S6 CONTACT ──────────────────────────────────────────────────────── -->
  <section class="contact page-container">
    <span class="evx-label">QUESTIONS</span>
    <div class="contact-content">
      <p class="reading-column">
        If anything about this process is unclear, write to us. Messages are handled by Renato or Kevin, not outsourced support.
      </p>
      <div class="contact-action">
        <Button variant="ghost" href="/#/enquire">Write to us</Button>
      </div>
      <p class="evx-caption contact-email">renato@eirvox.ie</p>
    </div>
  </section>

</Layout>

<style>
  /* ── SECTION 1: HEADER ──────────────────────────────────────────────── */

  .header {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .header > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .header-headline {
    font-family: var(--evx-type-display-family);
    font-weight: var(--evx-type-display-weight);
    font-size: var(--evx-type-display-size);
    line-height: var(--evx-type-display-lh);
    letter-spacing: var(--evx-type-display-ls);
    color: var(--evx-warm-black);
    margin: 0 0 var(--evx-space-xl) 0;
  }

  .header-body {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 2: HOW ESCROW WORKS ────────────────────────────────────── */

  .how-escrow {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .how-escrow > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .steps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
  }

  .step {
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

  .step h2 {
    margin: 0;
  }

  .step p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 3: WHAT'S COVERED ──────────────────────────────────────── */

  .whats-covered {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .whats-covered > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .covered-text {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .covered-text p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 4: WHAT'S NOT COVERED ────────────────────────────────── */

  .whats-not-covered {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .whats-not-covered > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .not-covered-text {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .not-covered-text p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 5: PAYMENT METHODS ────────────────────────────────────── */

  .payment-methods {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .payment-methods > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .payment-text {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .payment-text p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── SECTION 6: CONTACT ────────────────────────────────────────────── */

  .contact {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .contact > .evx-label {
    display: block;
    margin-bottom: var(--evx-space-2xl);
  }

  .contact-content {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .contact-content p {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .contact-action {
    margin-top: var(--evx-space-sm);
  }

  .contact-email {
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-sm);
  }

  /* ── RESPONSIVE ────────────────────────────────────────────────────── */

  @media (max-width: 767px) {
    .header {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .header-headline {
      font-size: 40px;
      margin-bottom: var(--evx-space-lg);
    }

    .how-escrow {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .steps {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
    }

    .whats-covered {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .whats-not-covered {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .payment-methods {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .contact {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .header-headline {
      font-size: 48px;
    }

    .steps {
      grid-template-columns: 1fr;
    }
  }
</style>
