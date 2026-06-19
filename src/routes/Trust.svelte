<script lang="ts">
  // ============================================================
  // /trust — warm paper. Wheel/DRIVE commerce proof only.
  //
  // ÉIRVOX sells its own wheels directly: pay ÉIRVOX via Revolut,
  // deposits hold a wheel from an incoming run, collection in Dublin or
  // post within Ireland, refunds at our discretion as merchant of
  // record. No marketplace, no sellers, no cohorts, no commission — that
  // surface stays gated. Unsupplied facts render as [FACT NEEDED].
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import FactNeeded from '../lib/FactNeeded.svelte';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.trust()));

  let faqOpen: Record<number, boolean> = {};
  function toggleFaq(i: number) { faqOpen = { ...faqOpen, [i]: !faqOpen[i] }; }

  const faqs = [
    {
      q: 'Can I pay a deposit instead of the full price?',
      a: 'On wheels from an incoming run, yes. The deposit is shown on the wheel before you pay. It holds your place in the run; the balance is due on collection or before we post it.',
    },
    {
      q: 'Where are the wheels made?',
      a: 'Designed in Ireland, assembled abroad by a specialist carbon manufacturer, and finished in Dublin before they ship.',
    },
    {
      q: 'Can I collect in person?',
      a: 'Yes. Collection is by arrangement in Dublin. Otherwise we post within Ireland.',
    },
    {
      q: 'How do I know it fits my car?',
      a: 'The fitment finder confirms your chassis before you buy. You pick your series and model; we match the wheel. You never need a part code.',
    },
    {
      q: 'Do you ship outside Ireland?',
      a: 'Not at the moment. ÉIRVOX ships within Ireland only.',
    },
  ];
</script>

<Nav />

<main id="main-content" class="trust-page">
  <div class="page-container">

    <header class="trust-hero">
      <span class="evx-caption trust-hero__pre">TRUST</span>
      <h1 class="trust-hero__title">
        Trust earned,<br/>not promised.
      </h1>
      <p class="trust-hero__sub">
        ÉIRVOX designs, finishes and sells its own wheels. You pay ÉIRVOX directly,
        by card or Apple Pay. A deposit can hold a wheel from an incoming run.
        Nothing fabricated. Nothing oversold.
      </p>
    </header>

    <!-- 01 How you pay -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">01 · PAYMENT</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">How you pay.</h2>
          <p class="trust-section__sub">
            Every wheel is bought directly from ÉIRVOX through Revolut. There is no cart,
            and no third party in the middle.
          </p>
        </div>
        <ol class="trust-steps">
          {#each [
            { n: '01', title: 'You pay ÉIRVOX directly.', body: 'We design, finish and sell these wheels. We are the merchant of record for every one.' },
            { n: '02', title: 'Card, Apple Pay or Google Pay.', body: 'Checkout runs through Revolut. The price is resolved on our server at the moment you pay.' },
            { n: '03', title: 'Pay in full, or place a deposit.', body: 'A deposit holds a wheel from an incoming run; the balance follows before it ships.' },
            { n: '04', title: 'We never hold funds for anyone else.', body: 'There is no escrow. You are paying ÉIRVOX for an ÉIRVOX wheel.' },
          ] as step}
            <li class="trust-step">
              <span class="evx-label trust-step__num">{step.n}</span>
              <div>
                <strong class="trust-step__title">{step.title}</strong>
                <span class="trust-step__body"> {step.body}</span>
              </div>
            </li>
          {/each}
        </ol>
      </div>
    </section>

    <!-- 02 Deposits -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">02 · DEPOSITS</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">How deposits work.</h2>
          <p class="trust-section__sub">
            Some wheels are made to order in a limited run. A deposit holds your place;
            the balance is due before the wheel ships or on collection.
          </p>
        </div>
        <div class="trust-bullets">
          <div class="trust-bullet">The deposit amount is shown on each wheel, before you pay.</div>
          <div class="trust-bullet">It holds one wheel from the incoming run for you.</div>
          <div class="trust-bullet">The balance is due on collection in Dublin, or before we post it.</div>
          <div class="trust-bullet">If the run is cancelled, the deposit is refunded in full.</div>
        </div>
      </div>
    </section>

    <!-- 03 Collection & delivery -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">03 · DELIVERY</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">Collection and delivery.</h2>
          <p class="trust-section__sub">
            Collect by arrangement in Dublin, or have your wheel posted within Ireland.
          </p>
        </div>
        <div class="trust-bullets">
          <div class="trust-bullet">Collection is by arrangement in Dublin.</div>
          <div class="trust-bullet">Posted within Ireland via <FactNeeded label="SHIPPING CARRIER" />.</div>
          <div class="trust-bullet">We do not ship outside Ireland at this time.</div>
          <div class="trust-bullet">Fitment is confirmed before purchase, so the wheel that arrives is the one for your car.</div>
        </div>
      </div>
    </section>

    <!-- 04 Refunds -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">04 · REFUNDS</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">Where refunds apply.</h2>
          <p class="trust-section__sub">
            We sell our own wheels, so a refund is between you and ÉIRVOX. We refund
            legitimate issues at our discretion.
          </p>
        </div>

        <div class="coverage">
          <div class="coverage__col coverage__col--covered">
            <span class="evx-label coverage__head">REFUNDED</span>
            <ul class="coverage__list">
              {#each [
                { t: 'Not as described', d: 'Undisclosed damage or a material defect. Considered case by case.' },
                { t: 'Not received', d: 'Lost in transit or never shipped. Refunded once we confirm with the carrier.' },
                { t: 'Our error', d: 'We shipped the wrong wheel or specification. Full refund.' },
              ] as item}
                <li class="coverage__item">
                  <span class="coverage__mark coverage__mark--good">+</span>
                  <div>
                    <strong>{item.t}</strong>
                    <span>{item.d}</span>
                  </div>
                </li>
              {/each}
            </ul>
          </div>

          <div class="coverage__col coverage__col--excluded">
            <span class="evx-label coverage__head coverage__head--excluded">NOT REFUNDED</span>
            <ul class="coverage__list">
              {#each [
                { t: 'Change of mind', d: 'The wheel matches what you bought. That is a private resale.' },
                { t: 'Minor cosmetic variation', d: 'Within the finish described. Carbon is a natural-weave material.' },
                { t: 'Fitment you confirmed', d: 'The finder confirmed your chassis before purchase.' },
              ] as item}
                <li class="coverage__item">
                  <span class="coverage__mark coverage__mark--bad">−</span>
                  <div>
                    <strong>{item.t}</strong>
                    <span>{item.d}</span>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        </div>

        <p class="trust-section__sub" style="margin-top: 24px;">
          Full policy at <a href="#/refund-policy">/refund-policy</a>.
        </p>
      </div>
    </section>

    <!-- Company close -->
    <section class="trust-close">
      <span class="evx-caption trust-section__num">THE COMPANY</span>
      <p class="trust-close__line">
        EIRVOX LIMITED · CRO 806648 —
        <a href="https://core.cro.ie" target="_blank" rel="noopener noreferrer">verifiable at core.cro.ie</a>.
        Every wheel is finished in Dublin before it ships.
      </p>
    </section>

    <!-- FAQ -->
    <section class="trust-faq">
      <span class="evx-caption trust-section__num">COMMON QUESTIONS</span>
      <h2 class="trust-faq__heading">Five things people ask.</h2>
      <div class="trust-faq__list">
        {#each faqs as faq, i}
          <div class="trust-faq__item">
            <button
              class="trust-faq__q"
              on:click={() => toggleFaq(i)}
              aria-expanded={faqOpen[i] ?? i === 0}
            >
              {faq.q}
              <span class="trust-faq__icon">{(faqOpen[i] ?? i === 0) ? '−' : '+'}</span>
            </button>
            {#if faqOpen[i] ?? i === 0}
              <p class="trust-faq__a">{faq.a}</p>
            {/if}
          </div>
        {/each}
      </div>
    </section>

  </div>
</main>

<Footer />

<style>
  .trust-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .trust-hero {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-3xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-3xl);
  }

  .trust-hero__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-lg); }

  .trust-hero__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.08;
    margin-bottom: var(--evx-space-lg);
  }

  .trust-hero__sub { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); max-width: 560px; }

  .trust-section {
    padding: var(--evx-space-3xl) 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .trust-section__num { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-xl); }

  .trust-section__inner {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .trust-section__heading {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .trust-section__sub { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }
  .trust-section__sub a { color: var(--evx-warm-black); text-decoration: underline; text-underline-offset: 3px; }

  .trust-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    list-style: none;
  }

  .trust-step {
    display: flex;
    gap: var(--evx-space-xl);
    align-items: flex-start;
    padding: var(--evx-space-lg) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px;
    line-height: 1.65;
  }

  .trust-step__num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }
  .trust-step__title { color: var(--evx-warm-black); font-weight: 500; }
  .trust-step__body { color: var(--evx-ink-soft); }

  .trust-bullets {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .trust-bullet {
    font-size: 15px;
    color: var(--evx-warm-black);
    padding: var(--evx-space-lg) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    line-height: 1.5;
  }

  .coverage {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-md);
  }

  .coverage__col {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
  }
  .coverage__col--covered { border-left: 3px solid var(--evx-fox-orange); }
  .coverage__col--excluded { border-left: 3px solid var(--evx-ink-soft); }

  .coverage__head { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-lg); }
  .coverage__head--excluded { color: var(--evx-ink-soft); }

  .coverage__list {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }
  .coverage__item {
    display: flex;
    gap: var(--evx-space-md);
    align-items: flex-start;
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .coverage__item:last-child { border-bottom: none; padding-bottom: 0; }

  .coverage__mark {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-family: var(--evx-font-mono);
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    margin-top: 2px;
  }
  .coverage__mark--good { color: var(--evx-fox-orange); border: 1.5px solid var(--evx-fox-orange); }
  .coverage__mark--bad { color: var(--evx-ink-soft); border: 1.5px solid var(--evx-ink-soft); }

  .coverage__item strong {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-warm-black);
    display: block;
    margin-bottom: 2px;
  }
  .coverage__item span {
    font-size: 13px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    display: block;
  }

  /* Company close */
  .trust-close {
    padding: var(--evx-space-3xl) 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .trust-close__line {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.03em;
    line-height: 1.8;
    color: var(--evx-ink-soft);
    max-width: 620px;
  }
  .trust-close__line a { color: var(--evx-fox-orange); text-decoration: underline; text-underline-offset: 3px; }

  .trust-faq {
    padding-top: var(--evx-space-3xl);
    margin-bottom: var(--evx-space-2xl);
  }

  .trust-faq__heading {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: var(--evx-space-2xl);
  }

  .trust-faq__list { display: flex; flex-direction: column; gap: 0; }

  .trust-faq__item {
    border-top: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg) 0;
  }

  .trust-faq__q {
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 400;
    color: var(--evx-warm-black);
    text-align: left;
  }

  .trust-faq__icon { color: var(--evx-ink-soft); font-size: 18px; flex-shrink: 0; }

  .trust-faq__a {
    font-size: 14px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
    padding-top: var(--evx-space-md);
    max-width: 640px;
  }

  @media (max-width: 1023px) {
    .trust-section__inner { grid-template-columns: 1fr; }
    .coverage { grid-template-columns: 1fr; }
  }
</style>
