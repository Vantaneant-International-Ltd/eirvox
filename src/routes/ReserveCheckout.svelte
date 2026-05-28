<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import SellerPill from '../lib/SellerPill.svelte';
  import { navigate } from '../lib/router';
  import { getListingBySlug, getSeller, formatPrice } from '../data/listings';
  import { currentUser } from '../data/user';

  export let listingSlug: string;

  $: listing = getListingBySlug(listingSlug);
  $: seller = listing ? getSeller(listing.sellerId) : undefined;

  let step = 1;
  const TOTAL_STEPS = 4;

  // Step 2 — buyer details
  let name = `${currentUser.firstName} ${currentUser.lastName}`;
  let email = currentUser.email;
  let phone = currentUser.phone;
  let delivery: 'collection' | 'shipping' | 'either' = 'either';
  let note = '';

  // Step 3 — payment ack
  let paymentAcknowledged = false;

  // Generate a deterministic reference like EV-2026-0847
  function genReference(slug: string): string {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
    const n = (hash % 9000) + 1000;
    return `EV-2026-${n}`;
  }

  $: reference = listing ? genReference(listing.slug) : 'EV-2026-0000';

  $: step1Valid = !!listing;
  $: step2Valid = name.trim() && email.trim() && phone.trim() && delivery;
  $: step3Valid = paymentAcknowledged;

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

  const stepLabels = ['Item', 'Your details', 'Payment', 'Confirmed'];
</script>

<Nav />

<main class="rc-page">
  <div class="page-container">

    {#if !listing || !seller}
      <div class="rc-404">
        <span class="evx-label rc-404__label">LISTING NOT FOUND</span>
        <h1 class="rc-404__h">We couldn't find that listing.</h1>
        <p class="rc-404__sub">It may have been sold, removed, or the link is incorrect.</p>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/automotive')}>
          Browse marketplace →
        </button>
      </div>
    {:else}

      <!-- Header -->
      <header class="rc-header">
        <button class="rc-back evx-caption" on:click={() => navigate(`/listing/${listing.slug}`)}>
          ← Back to listing
        </button>

        {#if step < 4}
          <span class="evx-caption rc-header__pre">RESERVE · €49 REFUNDABLE DEPOSIT</span>
          <h1 class="rc-title">Reserve this item.</h1>
          <p class="rc-sub">
            Four steps. The deposit is fully refundable until the item ships — no commitment until you and {seller.name} agree the deal.
          </p>
        {/if}
      </header>

      <!-- Progress -->
      {#if step < 4}
        <nav class="progress" aria-label="Reservation progress">
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

      <!-- ════ STEP 1 · ITEM ════ -->
      {#if step === 1}
        <div class="rc-grid">
          <section class="rc-main">
            <div class="rc-section">
              <h2 class="rc-h2">Confirm the item.</h2>
              <p class="rc-section__sub">
                You're reserving the item below. A €49 deposit holds it for you while you arrange the deal with the seller.
              </p>
            </div>

            <div class="item-card">
              <div class="item-card__image" style="background: {listing.isDrive ? '#3a2820' : '#2A2825'}">
                {#if listing.isDrive}
                  <span class="evx-caption item-card__drive">{listing.driveIssue}</span>
                {/if}
                <span class="evx-caption item-card__placeholder">{listing.title}</span>
              </div>
              <div class="item-card__body">
                <span class="evx-label item-card__eyebrow">
                  {listing.subcategory} · {listing.condition}
                </span>
                <h3 class="item-card__title">{listing.title}</h3>
                {#if listing.subtitle}
                  <p class="item-card__subtitle">{listing.subtitle}</p>
                {/if}
                <div class="item-card__price-row">
                  <span class="item-card__price">{formatPrice(listing.price)}</span>
                  <span class="evx-caption item-card__city">{listing.city}</span>
                </div>
                <div class="item-card__seller">
                  <SellerPill tier={seller.tier} name={seller.name} rating={seller.rating} compact={false} />
                </div>
              </div>
            </div>

            <div class="rc-notice rc-notice--accent">
              <span class="evx-label rc-notice__label">NOT A PURCHASE</span>
              <p class="rc-notice__body">
                This is not a purchase. The €49 deposit holds the item off the market while you and the seller
                arrange the deal directly — price agreement, inspection, delivery. The full {formatPrice(listing.price)}
                isn't paid until both sides are ready.
              </p>
            </div>
          </section>

          <aside class="rc-side">
            <div class="rc-summary">
              <span class="evx-label rc-summary__label">RESERVATION SUMMARY</span>
              <div class="rc-summary__rows">
                <div class="rc-summary__row">
                  <span>Item</span>
                  <span class="rc-summary__val">{listing.title}</span>
                </div>
                <div class="rc-summary__row">
                  <span>Seller</span>
                  <span class="rc-summary__val">{seller.name}</span>
                </div>
                <div class="rc-summary__row">
                  <span>Asking price</span>
                  <span class="rc-summary__val">{formatPrice(listing.price)}</span>
                </div>
                <div class="rc-summary__row rc-summary__row--total">
                  <span>Deposit today</span>
                  <span class="rc-summary__val rc-summary__val--accent">€49</span>
                </div>
              </div>
              <p class="evx-caption rc-summary__note">Fully refundable until the item ships.</p>
            </div>
          </aside>
        </div>

        <div class="step-nav">
          <span class="evx-caption step-nav__count">Step 1 of 3</span>
          <button class="evx-btn evx-btn--primary" on:click={next}>
            Continue →
          </button>
        </div>

      <!-- ════ STEP 2 · YOUR DETAILS ════ -->
      {:else if step === 2}
        <div class="rc-grid">
          <section class="rc-main">
            <div class="rc-section">
              <h2 class="rc-h2">Your details.</h2>
              <p class="rc-section__sub">
                Where to reach you and how you'd like to take delivery. The seller will see this information
                once your deposit is confirmed.
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
                <span class="field-hint evx-caption">For the seller to reach you about delivery — not shared elsewhere.</span>
              </div>

              <div class="field">
                <span class="evx-caption field-label">DELIVERY PREFERENCE</span>
                <div class="radio-list">
                  {#each [
                    { value: 'collection', label: 'Collection', desc: `Pick up from ${listing.city}.` },
                    { value: 'shipping',   label: 'Shipping',   desc: 'Tracked & insured to your address.' },
                    { value: 'either',     label: 'Either',     desc: 'I\'m happy with whatever works for the seller.' },
                  ] as opt}
                    <label class="radio">
                      <input type="radio" name="delivery" value={opt.value} bind:group={delivery} class="radio__box" />
                      <div class="radio__body">
                        <strong class="radio__title">{opt.label}</strong>
                        <span class="radio__desc evx-caption">{opt.desc}</span>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>

              <div class="field">
                <label class="evx-caption field-label" for="f-note">NOTE TO SELLER (OPTIONAL)</label>
                <textarea
                  id="f-note"
                  class="field-input field-textarea"
                  bind:value={note}
                  rows="4"
                  placeholder="Anything they should know — best time to be reached, specific questions, viewing arrangement, etc."
                ></textarea>
              </div>
            </div>
          </section>

          <aside class="rc-side">
            <div class="rc-summary">
              <span class="evx-label rc-summary__label">SUMMARY</span>
              <div class="rc-summary__rows">
                <div class="rc-summary__row">
                  <span>Item</span>
                  <span class="rc-summary__val">{listing.title}</span>
                </div>
                <div class="rc-summary__row rc-summary__row--total">
                  <span>Deposit today</span>
                  <span class="rc-summary__val rc-summary__val--accent">€49</span>
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
              Continue →
            </button>
          </div>
        </div>

      <!-- ════ STEP 3 · PAYMENT ════ -->
      {:else if step === 3}
        <div class="rc-grid">
          <section class="rc-main">
            <div class="rc-section">
              <h2 class="rc-h2">Payment.</h2>
              <p class="rc-section__sub">
                We'll send you a Revolut payment link by email within the hour. Once the €49 lands,
                we confirm the reservation with {seller.name}.
              </p>
            </div>

            <div class="pay-method pay-method--active">
              <div class="pay-method__head">
                <div class="pay-method__radio"><span class="pay-method__dot"></span></div>
                <div class="pay-method__info">
                  <strong class="pay-method__title">Revolut payment link</strong>
                  <span class="evx-caption pay-method__sub">€49 deposit · sent to {email || 'your email'} within the hour</span>
                </div>
                <span class="evx-caption pay-method__tag">CURRENT</span>
              </div>
              <p class="pay-method__body">
                After you confirm the reservation below, our team sends a Revolut payment link
                to your email. Click the link, pay €49, and the reservation is live.
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
                Stripe-powered card and Apple Pay checkout launches in H2 2026 alongside full escrow.
                Until then, deposits are processed manually via Revolut — same protection, same refund policy.
              </p>
            </div>

            <label class="pay-ack">
              <input type="checkbox" bind:checked={paymentAcknowledged} class="pay-ack__box" />
              <span class="pay-ack__body">
                I understand the deposit is <strong>€49 refundable</strong> until the item ships,
                and that I'll receive a Revolut payment link by email within the hour.
              </span>
            </label>
          </section>

          <aside class="rc-side">
            <div class="rc-summary">
              <span class="evx-label rc-summary__label">REVIEW &amp; PAY</span>
              <div class="rc-summary__rows">
                <div class="rc-summary__row">
                  <span>Item</span>
                  <span class="rc-summary__val">{listing.title}</span>
                </div>
                <div class="rc-summary__row">
                  <span>Seller</span>
                  <span class="rc-summary__val">{seller.name}</span>
                </div>
                <div class="rc-summary__row">
                  <span>Delivery</span>
                  <span class="rc-summary__val rc-summary__val--cap">
                    {delivery === 'either' ? 'Either' : delivery === 'collection' ? 'Collection' : 'Shipping'}
                  </span>
                </div>
                <div class="rc-summary__row">
                  <span>Email</span>
                  <span class="rc-summary__val">{email}</span>
                </div>
                <div class="rc-summary__row rc-summary__row--total">
                  <span>Deposit today</span>
                  <span class="rc-summary__val rc-summary__val--accent">€49</span>
                </div>
              </div>
              <p class="evx-caption rc-summary__note">
                Item is held for 14 days from confirmation. Extendable on request.
              </p>
            </div>
          </aside>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 3 of 3</span>
            <button class="evx-btn evx-btn--primary" on:click={confirm} disabled={!step3Valid}>
              Confirm reservation →
            </button>
          </div>
        </div>

      <!-- ════ STEP 4 · CONFIRMATION ════ -->
      {:else}
        <div class="confirm">
          <span class="evx-label confirm__label">RESERVATION RECEIVED</span>
          <h2 class="confirm__h">
            Reserved. <em class="confirm__italic">Watch your inbox.</em>
          </h2>
          <p class="confirm__body">
            We've logged your reservation for the {listing.title}.
            A Revolut payment link for €49 is on its way to <strong>{email}</strong> — usually within the hour,
            always within four.
          </p>

          <div class="confirm__details">
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">REFERENCE</span>
              <span class="confirm__detail-val">{reference}</span>
            </div>
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">ITEM</span>
              <span class="confirm__detail-val">{listing.title}</span>
            </div>
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">DEPOSIT</span>
              <span class="confirm__detail-val confirm__detail-val--accent">€49 · refundable</span>
            </div>
            <div class="confirm__detail">
              <span class="evx-caption confirm__detail-label">SELLER</span>
              <span class="confirm__detail-val">{seller.name} · {seller.location}</span>
            </div>
          </div>

          <div class="confirm__next">
            <span class="evx-label confirm__next-label">WHAT HAPPENS NEXT</span>
            <ol class="confirm__steps">
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">01</span>
                <div>
                  <strong>Revolut link arrives by email.</strong>
                  <span>Within the hour. Pay €49 from the link.</span>
                </div>
              </li>
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">02</span>
                <div>
                  <strong>We confirm with {seller.name}.</strong>
                  <span>Item is held off the market — usually within 4 hours of payment.</span>
                </div>
              </li>
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">03</span>
                <div>
                  <strong>You and the seller arrange the deal.</strong>
                  <span>Price, viewing, delivery — through Messages, no third parties.</span>
                </div>
              </li>
              <li class="confirm__step">
                <span class="evx-label confirm__step-num">04</span>
                <div>
                  <strong>Deposit credits against the balance.</strong>
                  <span>€49 deducted from the final amount. Refund if the deal doesn't proceed.</span>
                </div>
              </li>
            </ol>
          </div>

          <div class="confirm__actions">
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/account/orders')}>
              View your reservations →
            </button>
            <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/')}>
              Back to marketplace
            </button>
          </div>
        </div>
      {/if}

    {/if}

  </div>
</main>

<Footer />

<style>
  .rc-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* 404 */
  .rc-404 {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
    padding: var(--evx-space-3xl) 0;
    max-width: 480px;
  }
  .rc-404__label { color: var(--evx-fox-orange); }
  .rc-404__h { font-family: var(--evx-font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }
  .rc-404__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }

  /* Header */
  .rc-header { padding-top: var(--evx-space-2xl); margin-bottom: var(--evx-space-xl); }

  .rc-back {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    display: block; margin-bottom: var(--evx-space-xl);
    transition: var(--evx-transition);
  }
  .rc-back:hover { color: var(--evx-warm-black); }

  .rc-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }

  .rc-title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .rc-sub { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 560px; }

  /* Progress */
  .progress {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .progress__step {
    display: flex; flex-direction: column; gap: 4px;
    padding: var(--evx-space-md) 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    opacity: 0.40;
    transition: opacity 200ms ease;
  }
  .progress__step--active { opacity: 1; border-bottom-color: var(--evx-fox-orange); }
  .progress__step--done { opacity: 0.70; }
  .progress__step--active .progress__num { color: var(--evx-fox-orange); }
  .progress__step--done .progress__num { color: var(--evx-warm-black); }
  .progress__num { color: var(--evx-ink-soft); }
  .progress__label { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }

  /* Layout */
  .rc-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--evx-space-2xl);
    margin-bottom: var(--evx-space-2xl);
    align-items: start;
  }

  .rc-main { display: flex; flex-direction: column; gap: var(--evx-space-2xl); min-width: 0; }

  .rc-section { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .rc-h2 {
    font-family: var(--evx-font-display);
    font-size: 28px; font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .rc-section__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  /* Item card */
  .item-card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
  }
  .item-card__image {
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .item-card__drive {
    position: absolute;
    top: var(--evx-space-sm); left: var(--evx-space-sm);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 6px;
  }
  .item-card__placeholder { color: rgba(245,242,237,0.30); text-align: center; padding: 0 var(--evx-space-md); line-height: 1.5; }

  .item-card__body { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .item-card__eyebrow { color: var(--evx-ink-soft); }
  .item-card__title {
    font-family: var(--evx-font-display);
    font-size: 20px; font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
  }
  .item-card__subtitle {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    color: var(--evx-ink-soft);
  }
  .item-card__price-row {
    display: flex; align-items: baseline; gap: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    margin-top: var(--evx-space-md);
  }
  .item-card__price {
    font-family: var(--evx-font-display);
    font-size: 26px; font-weight: 500;
    letter-spacing: -0.02em;
  }
  .item-card__city { color: var(--evx-ink-soft); }
  .item-card__seller { margin-top: var(--evx-space-sm); }

  /* Notice */
  .rc-notice {
    padding: var(--evx-space-lg);
    border-left: 2px solid var(--evx-rule-light);
  }
  .rc-notice--accent {
    border-left-color: var(--evx-fox-orange);
    background: rgba(232,116,44,0.04);
  }
  .rc-notice__label { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-sm); }
  .rc-notice__body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  /* Side summary */
  .rc-side { position: sticky; top: 80px; }

  .rc-summary {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }
  .rc-summary__label { color: var(--evx-ink-soft); }

  .rc-summary__rows { display: flex; flex-direction: column; gap: var(--evx-space-sm); }

  .rc-summary__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--evx-space-md);
    font-size: 13px;
    color: var(--evx-ink-soft);
    padding-bottom: var(--evx-space-sm);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .rc-summary__row:last-child { border-bottom: none; }

  .rc-summary__val {
    color: var(--evx-warm-black);
    text-align: right;
    max-width: 60%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rc-summary__val--cap { text-transform: capitalize; }
  .rc-summary__val--accent { color: var(--evx-fox-orange); font-family: var(--evx-font-display); font-weight: 500; font-size: 18px; }

  .rc-summary__row--total {
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-warm-black);
    border-bottom: none;
    margin-top: var(--evx-space-sm);
  }

  .rc-summary__note { color: var(--evx-ink-soft); line-height: 1.5; }

  /* Form (shared shape) */
  .form-grid { display: flex; flex-direction: column; gap: var(--evx-space-xl); }
  .form-row { display: grid; gap: var(--evx-space-xl); }
  .form-row--2 { grid-template-columns: 1fr 1fr; }
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
    transition: border-color 200ms ease;
  }
  .field-input:focus { border-bottom-color: var(--evx-warm-black); }
  .field-input::placeholder { color: var(--evx-ink-soft); }
  .field-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
  .field-hint { color: var(--evx-ink-soft); margin-top: 2px; }

  /* Radio list */
  .radio-list { display: flex; flex-direction: column; gap: var(--evx-space-sm); margin-top: var(--evx-space-sm); }
  .radio {
    display: flex; gap: var(--evx-space-md); align-items: flex-start;
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: border-color 200ms ease, background 200ms ease;
  }
  .radio:has(.radio__box:checked) {
    border-color: var(--evx-fox-orange);
    background: rgba(232,116,44,0.04);
  }
  .radio__box {
    width: 18px; height: 18px; flex-shrink: 0;
    accent-color: var(--evx-fox-orange);
    margin-top: 2px;
  }
  .radio__body { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .radio__title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .radio__desc { color: var(--evx-ink-soft); line-height: 1.5; }

  /* Payment methods */
  .pay-method {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
  }
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
  .pay-method__radio--disabled {
    border-color: var(--evx-rule-light);
  }
  .pay-method__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--evx-fox-orange); }

  .pay-method__info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .pay-method__title { font-family: var(--evx-font-display); font-size: 16px; font-weight: 500; color: var(--evx-warm-black); }
  .pay-method__title--soon { color: var(--evx-ink-soft); }
  .pay-method__sub { color: var(--evx-ink-soft); }

  .pay-method__tag {
    color: var(--evx-fox-orange);
    border: 1px solid var(--evx-fox-orange);
    padding: 2px 6px;
    flex-shrink: 0;
  }
  .pay-method__tag--soon { color: var(--evx-ink-soft); border-color: var(--evx-rule-light); }

  .pay-method__body { font-size: 13px; line-height: 1.7; color: var(--evx-ink-soft); padding-left: 36px; }
  .pay-method__body--soon { padding-left: 36px; }

  .pay-ack {
    display: flex; gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    cursor: pointer;
    align-items: flex-start;
  }
  .pay-ack__box {
    width: 18px; height: 18px;
    accent-color: var(--evx-fox-orange);
    flex-shrink: 0;
    margin-top: 2px;
  }
  .pay-ack__body { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }
  .pay-ack__body strong { color: var(--evx-warm-black); font-weight: 500; }

  /* Step nav */
  .step-nav {
    display: flex; justify-content: flex-end; align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }
  .step-nav--split { justify-content: space-between; }
  .step-nav__right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .step-nav__count { color: var(--evx-ink-soft); }

  .evx-btn:disabled { opacity: 0.40; cursor: not-allowed; }
  .evx-btn:disabled:hover { opacity: 0.40; }

  /* Confirmation */
  .confirm {
    max-width: 720px;
    display: flex; flex-direction: column;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-2xl);
  }
  .confirm__label { color: var(--evx-fox-orange); }
  .confirm__h {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 64px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--evx-warm-black);
  }
  .confirm__italic { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; }
  .confirm__body { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); }
  .confirm__body strong { color: var(--evx-warm-black); font-weight: 500; }

  .confirm__details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border: 1px solid var(--evx-rule-light);
  }
  .confirm__detail {
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    border-right: 1px solid var(--evx-rule-light);
    display: flex; flex-direction: column;
    gap: 4px;
  }
  .confirm__detail:nth-child(2n) { border-right: none; }
  .confirm__detail:nth-last-child(-n+2) { border-bottom: none; }
  .confirm__detail-label { color: var(--evx-ink-soft); }
  .confirm__detail-val { font-family: var(--evx-font-display); font-size: 15px; font-weight: 500; color: var(--evx-warm-black); }
  .confirm__detail-val--accent { color: var(--evx-fox-orange); }

  .confirm__next { padding-top: var(--evx-space-xl); border-top: 1px solid var(--evx-rule-light); }
  .confirm__next-label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-lg); }

  .confirm__steps { display: flex; flex-direction: column; gap: 0; }
  .confirm__step {
    display: flex; gap: var(--evx-space-lg); align-items: flex-start;
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px;
    line-height: 1.6;
  }
  .confirm__step:last-child { border-bottom: none; }
  .confirm__step strong { color: var(--evx-warm-black); font-weight: 500; display: block; margin-bottom: 2px; }
  .confirm__step span { color: var(--evx-ink-soft); }
  .confirm__step-num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }

  .confirm__actions {
    display: flex; gap: var(--evx-space-md); flex-wrap: wrap;
    padding-top: var(--evx-space-md);
  }

  @media (max-width: 1023px) {
    .rc-grid { grid-template-columns: 1fr; }
    .rc-side { position: static; }
    .item-card { grid-template-columns: 1fr; }
    .item-card__image { max-width: 280px; }
    .confirm__details { grid-template-columns: 1fr; }
    .confirm__detail { border-right: none; }
    .confirm__detail:nth-last-child(-n+2) { border-bottom: 1px solid var(--evx-rule-light); }
    .confirm__detail:last-child { border-bottom: none; }
  }
  @media (max-width: 767px) {
    .form-row--2 { grid-template-columns: 1fr; }
    .progress { grid-template-columns: 1fr; }
    .progress__step { padding: var(--evx-space-sm) 0; }
    .step-nav--split { flex-direction: column; align-items: stretch; gap: var(--evx-space-md); }
    .step-nav__right { justify-content: space-between; }
  }
</style>
