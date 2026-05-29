<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { formatPrice, getSiteSettings, type SiteSettings } from '../lib/api';
  import { currentUser } from '../data/user';
  import { applySeo, seo } from '../lib/seo';

  export let issueSlug: string;

  // Synthetic "listing" for the DRIVE issue, built from site_settings.drive.
  // This keeps the existing template field accesses (.title, .price, etc.) working.
  type DriveListing = {
    title: string;
    price: number;
    slug: string;
    driveIssue: string;
    stockTotal: number;
    stock: number;
  };

  let listing: DriveListing | null = null;
  let settings: SiteSettings | null = null;

  onMount(async () => {
    applySeo(seo.reserveDrive(issueSlug));
    settings = await getSiteSettings();
    if (settings) {
      const d = settings.drive;
      listing = {
        title: d.issue_title,
        price: d.price_eur,
        slug: issueSlug,
        driveIssue: `DRV-${String(d.issue_number).padStart(3, '0')}`,
        stockTotal: d.total_allocation,
        stock: d.remaining,
      };
    }
  });

  let step = 1;
  const TOTAL_STEPS = 4;

  // Step 2 — Vehicle
  let vehicleYear = '';
  let vehicleMake = '';
  let vehicleModel = '';
  let vehicleTrim = '';
  let vin = '';
  let fitmentNotes = '';

  // Step 3 — buyer + payment
  let name = `${currentUser.firstName} ${currentUser.lastName}`;
  let email = currentUser.email;
  let phone = currentUser.phone;
  let paymentAcknowledged = false;

  function genReference(slug: string): string {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
    const n = (hash % 9000) + 1000;
    return `EV-DRV-${n}`;
  }
  $: reference = listing ? genReference(listing.slug) : 'EV-DRV-0000';

  $: step1Valid = !!listing;
  $: step2Valid = vehicleYear.trim() && vehicleMake.trim() && vehicleModel.trim();
  $: step3Valid = name.trim() && email.trim() && phone.trim() && paymentAcknowledged;

  function next() {
    if (step < TOTAL_STEPS) {
      step++;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  function prev() {
    if (step > 1) {
      step--;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
  function confirm() {
    if (step3Valid) {
      step = 4;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  const stepLabels = ['Allocation', 'Vehicle', 'Payment', 'Confirmed'];
</script>

<Nav />

<main id="main-content" class="rd-page">
  <div class="page-container">

    {#if !listing}
      <div class="rd-404">
        <span class="evx-label rd-404__label">ISSUE NOT FOUND</span>
        <h1 class="rd-404__h">We couldn't find that issue.</h1>
        <p class="rd-404__sub">It may have closed, or the link is incorrect.</p>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/drive')}>
          All DRIVE issues →
        </button>
      </div>
    {:else}

      <!-- Header / DRIVE bar -->
      <div class="rd-bar">
        <button class="rd-bar__back evx-caption" on:click={() => navigate(`/drive/${issueSlug}`)}>
          ← BACK TO ISSUE 003
        </button>
        <span class="evx-caption rd-bar__issue">DRIVE · {listing.driveIssue} · ALLOCATION CHECKOUT</span>
      </div>

      <header class="rd-header">
        {#if step < 4}
          <span class="evx-caption rd-header__pre">RESERVE ALLOCATION · €49 DEPOSIT</span>
          <h1 class="rd-title">
            Issue 003.
            <em class="rd-title__italic">Plate {listing.stockTotal && listing.stock ? (listing.stockTotal - listing.stock + 1) : '04'} of {listing.stockTotal ?? 8}.</em>
          </h1>
          <p class="rd-sub">
            DRIVE pieces are made to spec, in Dublin, one at a time. A €49 deposit holds your allocation
            while we confirm fitment for your car.
          </p>
        {/if}
      </header>

      {#if step < 4}
        <nav class="progress" aria-label="Allocation progress">
          {#each stepLabels.slice(0, 3) as label, i}
            {@const stepNum = i + 1}
            <div
              class="progress__step"
              class:progress__step--active={stepNum === step}
              class:progress__step--done={stepNum < step}
            >
              <span class="evx-label progress__num">{String(stepNum).padStart(2, '0')}</span>
              <span class="progress__label">{label}</span>
            </div>
          {/each}
        </nav>
      {/if}

      <!-- ════ STEP 1 · ALLOCATION ════ -->
      {#if step === 1}
        <div class="rd-grid">
          <section class="rd-main">
            <div class="rd-section">
              <h2 class="rd-h2">Confirm the allocation.</h2>
              <p class="rd-section__sub">
                You're reserving one of {listing.stockTotal ?? 8} pieces in Issue 003.
                One specification — no variants, no restocks.
              </p>
            </div>

            <div class="alloc-card">
              <div class="alloc-card__image">
                <span class="evx-caption alloc-card__plate">DRV-003 · PLATE 01</span>
                <span class="evx-caption alloc-card__placeholder">{listing.title}<br/>{listing.subtitle}</span>
              </div>
              <div class="alloc-card__body">
                <span class="evx-label alloc-card__issue">ISSUE 003 · MMXXVI</span>
                <h3 class="alloc-card__title">Mercedes-AMG GT.</h3>
                <p class="alloc-card__subtitle"><em>V8 Biturbo · C192. Eight pieces, no variants, no exceptions.</em></p>

                <div class="alloc-card__spec">
                  <div class="alloc-card__spec-row">
                    <span class="evx-caption alloc-card__spec-label">SHELL</span>
                    <span class="alloc-card__spec-val">One-piece forged carbon · matte</span>
                  </div>
                  <div class="alloc-card__spec-row">
                    <span class="evx-caption alloc-card__spec-label">WRAP</span>
                    <span class="alloc-card__spec-val">Alcantara · pre-stretched</span>
                  </div>
                  <div class="alloc-card__spec-row alloc-card__spec-row--champagne">
                    <span class="evx-caption alloc-card__spec-label">STITCH</span>
                    <span class="alloc-card__spec-val alloc-card__spec-val--champagne">Champagne · twelve-o'clock</span>
                  </div>
                  <div class="alloc-card__spec-row">
                    <span class="evx-caption alloc-card__spec-label">FINISH</span>
                    <span class="alloc-card__spec-val">Dublin · serialised</span>
                  </div>
                </div>

                <div class="alloc-card__price">
                  <span class="alloc-card__price-val">{formatPrice(listing.price)}</span>
                  <span class="evx-caption alloc-card__price-note">€49 deposit · balance €{(listing.price - 49).toLocaleString('en-IE')} due before dispatch</span>
                </div>
              </div>
            </div>

            <div class="rd-notice rd-notice--accent">
              <span class="evx-label rd-notice__label">MADE TO ORDER</span>
              <p class="rd-notice__body">
                DRIVE pieces are commissioned production. Once your allocation is confirmed, the piece is built specifically
                for your car — this typically takes 6–8 weeks. We don't reprint sold-out issues.
              </p>
            </div>

            <div class="rd-notice">
              <span class="evx-label rd-notice__label">REFUND POLICY</span>
              <p class="rd-notice__body">
                The €49 deposit is refunded in full within 24 hours of reservation, or if QC fails on the production piece.
                After 24 hours, the deposit covers materials and is non-refundable — that's how the limited run pays for itself.
              </p>
            </div>
          </section>

          <aside class="rd-side">
            <div class="rd-summary">
              <span class="evx-label rd-summary__label">ALLOCATION</span>
              <div class="rd-summary__rows">
                <div class="rd-summary__row">
                  <span>Issue</span>
                  <span class="rd-summary__val">{listing.driveIssue}</span>
                </div>
                <div class="rd-summary__row">
                  <span>Piece</span>
                  <span class="rd-summary__val">Carbon steering wheel</span>
                </div>
                <div class="rd-summary__row">
                  <span>Edition</span>
                  <span class="rd-summary__val">{listing.stockTotal ?? 8} total · {listing.stock ?? 5} remaining</span>
                </div>
                <div class="rd-summary__row">
                  <span>Full price</span>
                  <span class="rd-summary__val">{formatPrice(listing.price)}</span>
                </div>
                <div class="rd-summary__row rd-summary__row--total">
                  <span>Deposit today</span>
                  <span class="rd-summary__val rd-summary__val--accent">€49</span>
                </div>
              </div>
              <p class="evx-caption rd-summary__note">
                Balance €{(listing.price - 49).toLocaleString('en-IE')} invoiced before dispatch.
              </p>
            </div>
          </aside>
        </div>

        <div class="step-nav">
          <span class="evx-caption step-nav__count">Step 1 of 3</span>
          <button class="evx-btn evx-btn--primary" on:click={next}>
            Continue → Vehicle details
          </button>
        </div>

      <!-- ════ STEP 2 · VEHICLE ════ -->
      {:else if step === 2}
        <div class="rd-grid">
          <section class="rd-main">
            <div class="rd-section">
              <h2 class="rd-h2">Your car.</h2>
              <p class="rd-section__sub">
                The wheel is built to OEM spec for the AMG GT family (C190 / C192 / C257).
                Tell us what you're fitting it to so we can confirm compatibility before we cut the carbon.
              </p>
            </div>

            <div class="form-grid">
              <div class="form-row form-row--3">
                <div class="field">
                  <label class="evx-caption field-label" for="f-year">YEAR</label>
                  <input id="f-year" type="text" class="field-input" placeholder="2024" bind:value={vehicleYear} required />
                </div>
                <div class="field">
                  <label class="evx-caption field-label" for="f-make">MAKE</label>
                  <input id="f-make" type="text" class="field-input" placeholder="Mercedes-AMG" bind:value={vehicleMake} required />
                </div>
                <div class="field">
                  <label class="evx-caption field-label" for="f-model">MODEL</label>
                  <input id="f-model" type="text" class="field-input" placeholder="GT 63" bind:value={vehicleModel} required />
                </div>
              </div>

              <div class="form-row form-row--2">
                <div class="field">
                  <label class="evx-caption field-label" for="f-trim">TRIM (OPTIONAL)</label>
                  <input id="f-trim" type="text" class="field-input" placeholder="Premium Plus, S, R Pro…" bind:value={vehicleTrim} />
                </div>
                <div class="field">
                  <label class="evx-caption field-label" for="f-vin">VIN (OPTIONAL)</label>
                  <input id="f-vin" type="text" class="field-input" placeholder="WDC1670XXX0123456" bind:value={vin} />
                  <span class="field-hint evx-caption">Helps us double-check electronics revision against your build.</span>
                </div>
              </div>

              <div class="field">
                <label class="evx-caption field-label" for="f-notes">FITMENT NOTES (OPTIONAL)</label>
                <textarea
                  id="f-notes"
                  class="field-input field-textarea"
                  bind:value={fitmentNotes}
                  rows="4"
                  placeholder="Anything we should know — aftermarket steering column, paddle relocation, custom electronics, requested timing…"
                ></textarea>
              </div>
            </div>

            <div class="rd-notice">
              <span class="evx-label rd-notice__label">WHY WE ASK</span>
              <p class="rd-notice__body">
                We confirm fitment by email within 48 hours. If your trim isn't compatible — rare, but it happens with
                early C192 cars — your deposit is refunded in full and we don't proceed.
              </p>
            </div>
          </section>

          <aside class="rd-side">
            <div class="rd-summary">
              <span class="evx-label rd-summary__label">ALLOCATION</span>
              <div class="rd-summary__rows">
                <div class="rd-summary__row">
                  <span>Issue</span>
                  <span class="rd-summary__val">{listing.driveIssue}</span>
                </div>
                <div class="rd-summary__row rd-summary__row--total">
                  <span>Deposit today</span>
                  <span class="rd-summary__val rd-summary__val--accent">€49</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 2 of 3</span>
            <button class="evx-btn evx-btn--primary" on:click={next} disabled={!step2Valid}>
              Continue → Payment
            </button>
          </div>
        </div>

      <!-- ════ STEP 3 · PAYMENT (incl. contact) ════ -->
      {:else if step === 3}
        <div class="rd-grid">
          <section class="rd-main">
            <div class="rd-section">
              <h2 class="rd-h2">Your details &amp; payment.</h2>
              <p class="rd-section__sub">
                Where to reach you about fitment and dispatch. The Revolut payment link
                comes to the email below within the hour.
              </p>
            </div>

            <div class="form-grid">
              <div class="form-row form-row--2">
                <div class="field">
                  <label class="evx-caption field-label" for="f-name">FULL NAME</label>
                  <input id="f-name" type="text" class="field-input" bind:value={name} required />
                </div>
                <div class="field">
                  <label class="evx-caption field-label" for="f-email">EMAIL</label>
                  <input id="f-email" type="email" class="field-input" bind:value={email} required />
                </div>
              </div>

              <div class="field">
                <label class="evx-caption field-label" for="f-phone">PHONE</label>
                <input id="f-phone" type="tel" class="field-input" bind:value={phone} required />
              </div>
            </div>

            <div class="pay-method pay-method--active">
              <div class="pay-method__head">
                <div class="pay-method__radio"><span class="pay-method__dot"></span></div>
                <div class="pay-method__info">
                  <strong class="pay-method__title">Revolut payment link</strong>
                  <span class="evx-caption pay-method__sub">€49 allocation deposit · sent within the hour</span>
                </div>
                <span class="evx-caption pay-method__tag">CURRENT</span>
              </div>
              <p class="pay-method__body">
                We email you a Revolut link after you confirm below. Pay €49 from the link and your allocation is held.
                Fitment confirmation follows within 48 hours.
              </p>
            </div>

            <div class="pay-method pay-method--soon">
              <div class="pay-method__head">
                <div class="pay-method__radio pay-method__radio--disabled"></div>
                <div class="pay-method__info">
                  <strong class="pay-method__title pay-method__title--soon">Card &amp; Apple Pay</strong>
                  <span class="evx-caption pay-method__sub">Instant deposit at checkout</span>
                </div>
                <span class="evx-caption pay-method__tag pay-method__tag--soon">COMING SOON</span>
              </div>
              <p class="pay-method__body pay-method__body--soon">
                Card and Apple Pay checkout launches in H2 2026. Deposits don't go on Klarna — pieces are built to order
                and the deposit covers materials, not consumer-credit-protected purchases.
              </p>
            </div>

            <label class="pay-ack">
              <input type="checkbox" bind:checked={paymentAcknowledged} class="pay-ack__box" />
              <span class="pay-ack__body">
                I understand the €49 allocation deposit is <strong>refundable within 24 hours</strong> of reservation,
                or if QC fails on the production piece. After 24 hours it covers materials and is non-refundable.
              </span>
            </label>
          </section>

          <aside class="rd-side">
            <div class="rd-summary">
              <span class="evx-label rd-summary__label">REVIEW &amp; PAY</span>
              <div class="rd-summary__rows">
                <div class="rd-summary__row">
                  <span>Issue</span>
                  <span class="rd-summary__val">{listing.driveIssue}</span>
                </div>
                <div class="rd-summary__row">
                  <span>Vehicle</span>
                  <span class="rd-summary__val">{vehicleYear} {vehicleMake} {vehicleModel}</span>
                </div>
                <div class="rd-summary__row">
                  <span>Email</span>
                  <span class="rd-summary__val">{email}</span>
                </div>
                <div class="rd-summary__row">
                  <span>Full price</span>
                  <span class="rd-summary__val">{formatPrice(listing.price)}</span>
                </div>
                <div class="rd-summary__row rd-summary__row--total">
                  <span>Deposit today</span>
                  <span class="rd-summary__val rd-summary__val--accent">€49</span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 3 of 3</span>
            <button class="evx-btn evx-btn--primary" on:click={confirm} disabled={!step3Valid}>
              Confirm allocation →
            </button>
          </div>
        </div>

      <!-- ════ STEP 4 · CONFIRMATION ════ -->
      {:else}
        <div class="confirm">
          <span class="evx-label confirm__label">ALLOCATION RESERVED</span>
          <h2 class="confirm__h">
            Your allocation is reserved.
            <em class="confirm__italic">One of eight.</em>
          </h2>
          <p class="confirm__body">
            We've logged your allocation for {listing.driveIssue}.
            A Revolut payment link for €49 is on its way to <strong>{email}</strong> — usually within the hour.
            Fitment confirmation follows within 48 hours of payment.
          </p>

          <div class="confirm__details">
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">REFERENCE</span>
              <span class="confirm__detail-val">{reference}</span>
            </div>
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">ISSUE</span>
              <span class="confirm__detail-val">{listing.driveIssue} · Mercedes-AMG GT</span>
            </div>
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">VEHICLE</span>
              <span class="confirm__detail-val">{vehicleYear} {vehicleMake} {vehicleModel} {vehicleTrim}</span>
            </div>
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">DEPOSIT</span>
              <span class="confirm__detail-val confirm__detail-val--accent">€49 · refundable 24h</span>
            </div>
          </div>

          <div class="confirm__highlight">
            <span class="evx-label confirm__highlight-label">PRODUCTION TIMELINE</span>
            <p class="confirm__highlight-body">
              DRIVE pieces are built to order. <strong>Expect 6–8 weeks from confirmation</strong>
              to dispatch. We'll keep you updated through the build — typically two photos at the carbon stage,
              and one of the finished piece with its serial plate before it ships.
            </p>
          </div>

          <div class="confirm__next">
            <span class="evx-label confirm__next-label">WHAT HAPPENS NEXT</span>
            <ol class="confirm__steps">
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">01</span>
                <div>
                  <strong>Revolut link arrives by email.</strong>
                  <span>Within the hour. Pay €49 to lock the allocation.</span>
                </div>
              </li>
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">02</span>
                <div>
                  <strong>Fitment confirmation.</strong>
                  <span>Within 48 hours of payment. Full refund if your trim isn't compatible.</span>
                </div>
              </li>
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">03</span>
                <div>
                  <strong>Production begins.</strong>
                  <span>Carbon shell laid up. Alcantara wrap. Champagne stitch. 6–8 weeks.</span>
                </div>
              </li>
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">04</span>
                <div>
                  <strong>Balance invoiced before dispatch.</strong>
                  <span>€{(listing.price - 49).toLocaleString('en-IE')} due. Tracked &amp; insured shipping. Serialised for you.</span>
                </div>
              </li>
            </ol>
          </div>

          <div class="confirm__actions">
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/account/orders')}>
              View your reservations →
            </button>
            <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/drive')}>
              All DRIVE issues
            </button>
          </div>
        </div>
      {/if}

    {/if}

  </div>
</main>

<Footer />

<style>
  .rd-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* 404 */
  .rd-404 { display: flex; flex-direction: column; gap: var(--evx-space-md); align-items: flex-start; padding: var(--evx-space-3xl) 0; max-width: 480px; }
  .rd-404__label { color: var(--evx-fox-orange); }
  .rd-404__h { font-family: var(--evx-font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }
  .rd-404__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }

  /* DRIVE bar */
  .rd-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-lg);
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }
  .rd-bar__back {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    transition: var(--evx-transition);
  }
  .rd-bar__back:hover { color: var(--evx-warm-black); }
  .rd-bar__issue { color: var(--evx-fox-orange); }

  /* Header */
  .rd-header { margin-bottom: var(--evx-space-xl); }
  .rd-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .rd-title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 5.5vw, 64px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }
  .rd-title__italic { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; }
  .rd-sub { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 580px; }

  /* Progress */
  .progress {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .progress__step { display: flex; flex-direction: column; gap: 4px; padding: var(--evx-space-md) 0; border-bottom: 2px solid transparent; margin-bottom: -1px; opacity: 0.40; transition: opacity 200ms ease; }
  .progress__step--active { opacity: 1; border-bottom-color: var(--evx-fox-orange); }
  .progress__step--done { opacity: 0.70; }
  .progress__step--active .progress__num { color: var(--evx-fox-orange); }
  .progress__step--done .progress__num { color: var(--evx-warm-black); }
  .progress__num { color: var(--evx-ink-soft); }
  .progress__label { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }

  /* Layout */
  .rd-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--evx-space-2xl);
    margin-bottom: var(--evx-space-2xl);
    align-items: start;
  }
  .rd-main { display: flex; flex-direction: column; gap: var(--evx-space-2xl); min-width: 0; }

  .rd-section { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .rd-h2 { font-family: var(--evx-font-display); font-size: 28px; font-weight: 500; letter-spacing: -0.02em; color: var(--evx-warm-black); }
  .rd-section__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  /* Allocation card */
  .alloc-card {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
  }
  .alloc-card__image {
    aspect-ratio: 5 / 6;
    background: #3a2820;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .alloc-card__plate {
    position: absolute;
    top: var(--evx-space-sm); left: var(--evx-space-sm);
    color: var(--evx-fox-orange);
  }
  .alloc-card__placeholder { color: rgba(245,242,237,0.25); text-align: center; line-height: 1.7; padding: 0 var(--evx-space-md); }

  .alloc-card__body { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .alloc-card__issue { color: var(--evx-ink-soft); }
  .alloc-card__title {
    font-family: var(--evx-font-display);
    font-size: 32px; font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .alloc-card__subtitle {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 16px;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-md);
  }

  .alloc-card__spec {
    display: flex; flex-direction: column;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    margin: var(--evx-space-sm) 0;
  }
  .alloc-card__spec-row {
    display: flex; gap: var(--evx-space-md);
    padding: var(--evx-space-sm) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    align-items: center;
  }
  .alloc-card__spec-row:last-child { border-bottom: none; }
  .alloc-card__spec-row--champagne { border-color: var(--evx-champagne); }

  .alloc-card__spec-label { color: var(--evx-ink-soft); width: 70px; flex-shrink: 0; }
  .alloc-card__spec-val { font-size: 13px; color: var(--evx-warm-black); }
  .alloc-card__spec-val--champagne { color: var(--evx-champagne); }

  .alloc-card__price { display: flex; flex-direction: column; gap: 4px; margin-top: var(--evx-space-md); }
  .alloc-card__price-val {
    font-family: var(--evx-font-display);
    font-size: 32px; font-weight: 500;
    letter-spacing: -0.02em;
  }
  .alloc-card__price-note { color: var(--evx-ink-soft); }

  /* Notice */
  .rd-notice {
    padding: var(--evx-space-lg);
    border-left: 2px solid var(--evx-rule-light);
  }
  .rd-notice--accent {
    border-left-color: var(--evx-fox-orange);
    background: rgba(232,116,44,0.04);
  }
  .rd-notice__label { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-sm); }
  .rd-notice__body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  /* Side */
  .rd-side { position: sticky; top: 80px; }

  .rd-summary {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
  }
  .rd-summary__label { color: var(--evx-ink-soft); }

  .rd-summary__rows { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .rd-summary__row {
    display: flex; justify-content: space-between; gap: var(--evx-space-md);
    font-size: 13px; color: var(--evx-ink-soft);
    padding-bottom: var(--evx-space-sm);
    border-bottom: 1px solid var(--evx-rule-light);
    align-items: baseline;
  }
  .rd-summary__row:last-child { border-bottom: none; }
  .rd-summary__val { color: var(--evx-warm-black); text-align: right; max-width: 60%; }
  .rd-summary__val--accent { color: var(--evx-fox-orange); font-family: var(--evx-font-display); font-weight: 500; font-size: 18px; }
  .rd-summary__row--total {
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-warm-black);
    border-bottom: none;
    margin-top: var(--evx-space-sm);
  }
  .rd-summary__note { color: var(--evx-ink-soft); line-height: 1.5; }

  /* Form */
  .form-grid { display: flex; flex-direction: column; gap: var(--evx-space-xl); }
  .form-row { display: grid; gap: var(--evx-space-xl); }
  .form-row--2 { grid-template-columns: 1fr 1fr; }
  .form-row--3 { grid-template-columns: 100px 1fr 1fr; }
  .field { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .field-label { color: var(--evx-ink-soft); }
  .field-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-warm-black);
    outline: none;
    width: 100%;
  }
  .field-input:focus { border-bottom-color: var(--evx-warm-black); }
  .field-input::placeholder { color: var(--evx-ink-soft); }
  .field-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
  .field-hint { color: var(--evx-ink-soft); margin-top: 2px; }

  /* Payment methods */
  .pay-method { border: 1px solid var(--evx-rule-light); padding: var(--evx-space-lg); display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .pay-method--active { border-color: var(--evx-warm-black); }
  .pay-method--soon { opacity: 0.65; }
  .pay-method__head { display: flex; gap: var(--evx-space-md); align-items: center; }
  .pay-method__radio {
    width: 20px; height: 20px;
    border-radius: 50%;
    border: 2px solid var(--evx-warm-black);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .pay-method__radio--disabled { border-color: var(--evx-rule-light); }
  .pay-method__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--evx-fox-orange); }
  .pay-method__info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .pay-method__title { font-family: var(--evx-font-display); font-size: 16px; font-weight: 500; color: var(--evx-warm-black); }
  .pay-method__title--soon { color: var(--evx-ink-soft); }
  .pay-method__sub { color: var(--evx-ink-soft); }
  .pay-method__tag { color: var(--evx-fox-orange); border: 1px solid var(--evx-fox-orange); padding: 2px 6px; flex-shrink: 0; }
  .pay-method__tag--soon { color: var(--evx-ink-soft); border-color: var(--evx-rule-light); }
  .pay-method__body { font-size: 13px; line-height: 1.7; color: var(--evx-ink-soft); padding-left: 36px; }
  .pay-method__body--soon { padding-left: 36px; }

  .pay-ack { display: flex; gap: var(--evx-space-md); padding: var(--evx-space-md); border-top: 1px solid var(--evx-rule-light); cursor: pointer; align-items: flex-start; }
  .pay-ack__box { width: 18px; height: 18px; accent-color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }
  .pay-ack__body { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }
  .pay-ack__body strong { color: var(--evx-warm-black); font-weight: 500; }

  /* Step nav */
  .step-nav { display: flex; justify-content: flex-end; align-items: center; gap: var(--evx-space-md); padding-top: var(--evx-space-xl); border-top: 1px solid var(--evx-rule-light); }
  .step-nav--split { justify-content: space-between; }
  .step-nav__right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .step-nav__count { color: var(--evx-ink-soft); }
  .evx-btn:disabled { opacity: 0.40; cursor: not-allowed; }
  .evx-btn:disabled:hover { opacity: 0.40; }

  /* Confirmation */
  .confirm { max-width: 760px; display: flex; flex-direction: column; gap: var(--evx-space-xl); padding-top: var(--evx-space-2xl); }
  .confirm__label { color: var(--evx-fox-orange); }
  .confirm__h {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 64px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
  }
  .confirm__italic { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; }
  .confirm__body { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); }
  .confirm__body strong { color: var(--evx-warm-black); font-weight: 500; }

  .confirm__details { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--evx-rule-light); }
  .confirm__detail {
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    border-right: 1px solid var(--evx-rule-light);
    display: flex; flex-direction: column; gap: 4px;
  }
  .confirm__detail:nth-child(2n) { border-right: none; }
  .confirm__detail:nth-last-child(-n+2) { border-bottom: none; }
  .confirm__detail-label { color: var(--evx-ink-soft); }
  .confirm__detail-val { font-family: var(--evx-font-display); font-size: 15px; font-weight: 500; color: var(--evx-warm-black); }
  .confirm__detail-val--accent { color: var(--evx-fox-orange); }

  .confirm__highlight {
    border-left: 2px solid var(--evx-champagne);
    background: rgba(201, 169, 97, 0.06);
    padding: var(--evx-space-lg);
  }
  .confirm__highlight-label { color: var(--evx-champagne); display: block; margin-bottom: var(--evx-space-sm); }
  .confirm__highlight-body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }
  .confirm__highlight-body strong { color: var(--evx-warm-black); font-weight: 500; }

  .confirm__next { padding-top: var(--evx-space-xl); border-top: 1px solid var(--evx-rule-light); }
  .confirm__next-label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-lg); }
  .confirm__steps { display: flex; flex-direction: column; }
  .confirm__step {
    display: flex; gap: var(--evx-space-lg); align-items: flex-start;
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px; line-height: 1.6;
  }
  .confirm__step:last-child { border-bottom: none; }
  .confirm__step strong { color: var(--evx-warm-black); font-weight: 500; display: block; margin-bottom: 2px; }
  .confirm__step span { color: var(--evx-ink-soft); }
  .confirm__step-num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }

  .confirm__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; padding-top: var(--evx-space-md); }

  @media (max-width: 1023px) {
    .rd-grid { grid-template-columns: 1fr; }
    .rd-side { position: static; }
    .alloc-card { grid-template-columns: 1fr; }
    .alloc-card__image { max-width: 360px; }
    .confirm__details { grid-template-columns: 1fr; }
    .confirm__detail { border-right: none; }
    .confirm__detail:nth-last-child(-n+2) { border-bottom: 1px solid var(--evx-rule-light); }
    .confirm__detail:last-child { border-bottom: none; }
  }
  @media (max-width: 767px) {
    .rd-bar { flex-direction: column; align-items: flex-start; gap: var(--evx-space-xs); }
    .form-row--2, .form-row--3 { grid-template-columns: 1fr; }
    .progress { grid-template-columns: 1fr; }
    .step-nav--split { flex-direction: column; align-items: stretch; gap: var(--evx-space-md); }
    .step-nav__right { justify-content: space-between; }
  }
</style>
