<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.trust()));

  let faqOpen: Record<number, boolean> = {};
  function toggleFaq(i: number) { faqOpen = { ...faqOpen, [i]: !faqOpen[i] }; }

  const faqs = [
    {
      q: 'Is ÉIRVOX only for high-end items?',
      a: 'No. The quality bar is on the seller, not the price. A €135 cardigan from a vetted Donegal seller belongs on the same platform as a €13,000 car. What matters is honest condition and a real point of view.',
    },
    {
      q: 'Can I meet in person?',
      a: 'Collection is available on many listings. Arrange it with the seller through in-app messaging. ÉIRVOX does not require remote-only transactions.',
    },
    {
      q: 'How do you protect against scams?',
      a: 'Sellers are admitted by application, not open signup. Every applicant is reviewed by hand. Buyer and seller communication stays in-app so we can see the conversation if a dispute arises. Phone numbers and email addresses are never published on listings.',
    },
    {
      q: 'Can I sell from Northern Ireland?',
      a: 'Yes. ÉIRVOX operates across the island of Ireland. Prices show in Euro. Buyers in Northern Ireland can pay in Sterling by direct arrangement.',
    },
    {
      q: 'What can I not sell?',
      a: 'No counterfeits. No stolen goods. No items requiring export licences. No live animals. No weapons. Full prohibited list on request.',
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
        ÉIRVOX is the venue, not the broker. Payments go direct to sellers.
        Sellers are admitted by application, not open signup.
        Refunds where they are due. Nothing fabricated. Nothing oversold.
      </p>
    </header>

    <!-- 01 How money moves -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">01 · MONEY</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">How money moves.</h2>
          <p class="trust-section__sub">
            Marketplace transactions go straight from the buyer to the seller via Revolut.
            We never sit in the middle. We never hold buyer funds.
          </p>
        </div>
        <ol class="trust-steps">
          {#each [
            { n: '01', title: 'Buyer pays the seller direct.', body: 'Card, Apple Pay, or Google Pay on Revolut. ÉIRVOX is the venue, not the merchant of record.' },
            { n: '02', title: 'Reservation deposits are optional, per listing.', body: 'When a seller configures one, the deposit goes to the seller too. There is no ÉIRVOX escrow.' },
            { n: '03', title: 'House listings are the exception.', body: 'On items sold directly by ÉIRVOX, we are the merchant of record. Refunds for legitimate issues are at our discretion. See /refund-policy.' },
            { n: '04', title: 'No platform commission held back.', body: 'Sellers receive the full amount. Tier fees, if any, are billed separately.' },
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

    <!-- 02 Seller admission -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">02 · SELLERS</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">Admission by application.</h2>
          <p class="trust-section__sub">
            Every application is reviewed by hand. Three tiers.
            Cohorts open four times a year. No open signup.
          </p>
        </div>
        <div class="trust-bullets">
          <div class="trust-bullet">Applications go through a single five-step form.</div>
          <div class="trust-bullet">We read your sourcing pitch and consider your category.</div>
          <div class="trust-bullet">Shortlisted applicants take a 15-minute call.</div>
          <div class="trust-bullet">If approved, you go live with the next cohort.</div>
          <div class="trust-bullet">Trading names are locked once issued. Changes require admin approval to prevent impersonation.</div>
        </div>
      </div>
    </section>

    <!-- 03 Communication -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">03 · COMMUNICATION</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">Conversations stay on ÉIRVOX.</h2>
          <p class="trust-section__sub">
            Buyer and seller messaging happens in-app. Phone numbers and email
            addresses are not published on listings.
          </p>
        </div>
        <div class="trust-bullets">
          <div class="trust-bullet">In-app messaging on every listing, free, no commitment.</div>
          <div class="trust-bullet">Offers can be sent in one tap and replied to as a normal message.</div>
          <div class="trust-bullet">If a message looks like a phone or email handover, ÉIRVOX flags it. Off-platform deals are outside our refund policy.</div>
          <div class="trust-bullet">Disputes that begin on the platform can be reviewed by ÉIRVOX. Disputes that happen off it cannot.</div>
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
            On ÉIRVOX-owned listings, we refund for legitimate issues at our discretion.
            On seller listings, the seller is the merchant of record. Refunds are between buyer and seller.
          </p>
        </div>

        <div class="coverage">
          <div class="coverage__col coverage__col--covered">
            <span class="evx-label coverage__head">ÉIRVOX-OWNED</span>
            <ul class="coverage__list">
              {#each [
                { t: 'Item not as described', d: 'Undisclosed damage or material defect. Refund considered case by case.' },
                { t: 'Item not received', d: 'Lost in transit or never shipped. Refund processed once we confirm with the courier.' },
                { t: 'Fault on our side', d: 'We sold something we should not have. Full refund.' },
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
            <span class="evx-label coverage__head coverage__head--excluded">NOT COVERED</span>
            <ul class="coverage__list">
              {#each [
                { t: 'Buyer remorse', d: 'Item matches the listing and you changed your mind. That is a private resale.' },
                { t: 'Minor cosmetic differences', d: 'Within the seller stated condition. "Excellent" is not "mint".' },
                { t: 'Off-platform deals', d: 'If the transaction happened outside ÉIRVOX, we cannot mediate or refund.' },
                { t: 'Seller listings', d: 'On listings sold by other sellers, refunds are between you and them.' },
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

    <!-- 05 What you can not sell -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">05 · PROHIBITED</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">What does not belong.</h2>
        </div>
        <div class="trust-bullets">
          <div class="trust-bullet">Counterfeit items.</div>
          <div class="trust-bullet">Stolen goods.</div>
          <div class="trust-bullet">Items that require export licences we do not facilitate.</div>
          <div class="trust-bullet">Weapons. Live animals. Anything illegal under Irish law.</div>
        </div>
      </div>
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
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
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
    padding: var(--evx-space-2xl) 0;
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
    font-size: 26px;
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
  .coverage__col--covered { border-left: 3px solid #4a8c5b; }
  .coverage__col--excluded { border-left: 3px solid var(--evx-ink-soft); }

  .coverage__head { color: #4a8c5b; display: block; margin-bottom: var(--evx-space-lg); }
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
  .coverage__mark--good { color: #4a8c5b; border: 1.5px solid #4a8c5b; }
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

  .trust-faq {
    padding-top: var(--evx-space-2xl);
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
