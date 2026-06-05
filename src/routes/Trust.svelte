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
      a: 'No. We have items from €135 to €48,500. The quality bar is on the seller, not the item. A €135 Aran cardigan from a Verified seller in Donegal sits on the same platform as a €4,250 DRIVE issue - because the trust system protects both.',
    },
    {
      q: 'What if I want to meet in person?',
      a: 'Collection is available on many listings. Arrange directly with the seller via Messages. ÉIRVOX does not mandate remote-only transactions for lower-value items.',
    },
    {
      q: 'How do you stop scams?',
      a: 'Every seller is phone and ID verified before their first listing goes live. Cohort approval means we\'ve reviewed their stock and their description standards. Buyers\' deposits are fully refundable until the item ships.',
    },
    {
      q: 'Can I sell from Northern Ireland?',
      a: 'Yes. ÉIRVOX operates across the island of Ireland, including Northern Ireland. Prices are displayed in Euro. Buyers in Northern Ireland can pay in Sterling if both parties agree.',
    },
    {
      q: 'What can\'t I sell?',
      a: 'No counterfeit items, no stolen goods, no items requiring export licences, no live animals, no weapons. Full prohibited items list on request.',
    },
  ];
</script>

<Nav />

<main id="main-content" class="trust-page">
  <div class="page-container">

    <header class="trust-hero">
      <span class="evx-caption trust-hero__pre">TRUST · DEPOSITS · AUTHENTICATION</span>
      <h1 class="trust-hero__title">
        Money moves only<br/>when both sides are happy.
      </h1>
      <!-- TODO TRUST&COMPLIANCE: copy below is factually incorrect under
           the current hands-off architecture (no €49 default deposit;
           ÉIRVOX does NOT hold marketplace deposits). Flagged as a
           launch-blocker; this whole page needs rewriting in the Trust &
           Compliance pass before public ship. Out of scope for the
           stock-state / DRIVE-as-listings phase. -->
      <p class="trust-hero__sub">
        Every reservation on ÉIRVOX is backed by a €49 refundable deposit.
        High-value items pass through our Dublin authentication centre.
        If anything is off, you get a refund - not an argument.
      </p>
    </header>

    <!-- 01 Deposits -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">01 · DEPOSITS</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">How the money flows.</h2>
          <!-- TODO TRUST&COMPLIANCE: "held by ÉIRVOX" is factually wrong.
               Marketplace deposits go direct to the seller's Revolut.
               ÉIRVOX-owned deposits go to ÉIRVOX's Revolut Merchant
               account (we are the merchant of record, not a custodian).
               Rewrite in the Trust & Compliance pass. -->
          <p class="trust-section__sub">
            All reservation deposits are held by ÉIRVOX and refunded in full if a transaction doesn't proceed.
            No hidden charges, no administration fees.
          </p>
        </div>
        <ol class="trust-steps">
          {#each [
            { n: '01', title: 'You pay a €49 deposit.', body: 'Processed via Revolut or payment link. Refundable in full until the item ships.' },
            { n: '02', title: 'Seller confirms within 48 hours.', body: 'If they don\'t confirm, your deposit is refunded - no questions, no support tickets.' },
            { n: '03', title: 'Balance agreed and paid.', body: 'Direct with the seller for marketplace items. ÉIRVOX invoices the balance for DRIVE.' },
            { n: '04', title: 'Item ships and deposit is credited.', body: 'The €49 is deducted from your final balance. Full refund if anything doesn\'t match.' },
            { n: '05', title: 'Full escrow coming in H2 2026.', body: 'Stripe Connect escrow will hold all funds until you confirm delivery. Currently in development.' },
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

    <!-- 02 Authentication -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">02 · AUTHENTICATION</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">Checked before it ships.</h2>
          <p class="trust-section__sub">
            A small physical team in Dublin handles every item above the value threshold.
            Required automatically - buyers and sellers can't opt out.
          </p>
        </div>
        <div class="trust-auth">
          <div class="trust-auth__steps">
            {#each [
              { n: '01', title: 'Seller ships to us.', body: 'Prepaid pack, tracked. €25 add-on, refunded if it fails.' },
              { n: '02', title: 'Expert inspects.', body: '11-point physical check. Photographed. Logged.' },
              { n: '03', title: 'Pass or fail.', body: 'Listing flagged, buyer refunded, seller suspended on fail.' },
              { n: '04', title: 'Forward to buyer.', body: 'Tamper-proof seal + numbered authenticity card.' },
            ] as step}
              <div class="trust-auth__step">
                <span class="evx-label trust-auth__num">{step.n}</span>
                <strong>{step.title}</strong>
                <span class="trust-auth__body">{step.body}</span>
              </div>
            {/each}
          </div>

          <div class="trust-auth__protocol">
            <div class="trust-auth__col">
              <span class="evx-label">11-POINT PROTOCOL</span>
              <ul class="trust-auth__list">
                <li>- Serial &amp; batch markings</li>
                <li>- Materials &amp; build</li>
                <li>- Stitching, weight, finish</li>
                <li>- Box, papers, accessories</li>
                <li>- Function &amp; operation</li>
                <li>- Provenance trail</li>
              </ul>
            </div>
            <div class="trust-auth__col">
              <span class="evx-label">REQUIRED ON</span>
              <ul class="trust-auth__list">
                <li>- All watches over €500</li>
                <li>- All sneakers over €200</li>
                <li>- Designer bags &amp; outerwear</li>
                <li>- Cameras &amp; lenses</li>
                <li>- Apple &amp; pro audio</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 03 Buyer protection -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">03 · BUYER PROTECTION</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">If the platform fails, you're covered.</h2>
        </div>
        <div class="trust-bullets">
          {#each [
            'Item arrives as described - or full refund.',
            'Tracked &amp; insured shipping - up to €2,500 included; higher cover at checkout.',
            '7-day dispute window - counted from confirmed delivery.',
            'Deposits refunded in full - no charge if sale doesn\'t proceed.',
            'Authenticated items - refund + audit if authentication is later contested.',
          ] as item}
            <div class="trust-bullet">{@html item}</div>
          {/each}
        </div>
      </div>
    </section>

    <!-- 04 Seller protection -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">04 · SELLER PROTECTION</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">You're covered too.</h2>
        </div>
        <div class="trust-bullets">
          {#each [
            'Reservation deposits - buyers are serious before they contact you.',
            'Verified buyers only - phone + ID before purchase.',
            'Documented shipping - disputes need photographic evidence of mismatch.',
            'Shipping label provided - DPD or An Post Express, pre-paid.',
            'Dispute mediation - ÉIRVOX reviews evidence on both sides.',
          ] as item}
            <div class="trust-bullet">{item}</div>
          {/each}
        </div>
      </div>
    </section>

    <!-- 05 Buyer Protection Guarantee -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">05 · BUYER PROTECTION GUARANTEE</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">What's covered. What isn't.</h2>
          <p class="trust-section__sub">
            We refund the buyer first, then sort it out with the seller. The guarantee covers the cases
            below - written plainly so there's no argument about it later.
          </p>
        </div>

        <div class="coverage">
          <!-- Covered -->
          <div class="coverage__col coverage__col--covered">
            <span class="evx-label coverage__head">COVERED</span>
            <ul class="coverage__list">
              {#each [
                { t: 'Item not as described', d: 'Material defect, undisclosed damage, wrong reference, missing accessories.' },
                { t: 'Item not received', d: 'Lost in transit, never shipped, or tracking shows non-delivery after 14 days.' },
                { t: 'Counterfeit items', d: 'Independent authentication fails - full refund + audit of the seller account.' },
                { t: 'Seller no-show', d: 'Seller goes dark after deposit. Full refund and credit on your next reservation.' },
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

          <!-- Not covered -->
          <div class="coverage__col coverage__col--excluded">
            <span class="evx-label coverage__head coverage__head--excluded">NOT COVERED</span>
            <ul class="coverage__list">
              {#each [
                { t: 'Buyer\'s remorse', d: 'Changed your mind after delivery and the item matches the listing - that\'s a private resale, not our problem to fix.' },
                { t: 'Minor cosmetic differences', d: 'Within the seller\'s stated condition. "Excellent" means light hairlines - those aren\'t a defect.' },
                { t: 'Market value changes', d: 'Price drops or rises after purchase. We\'re not a financial product.' },
                { t: 'Dispute filed after the window', d: 'Seven days from delivery confirmation. Outside that, the platform stops mediating.' },
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

        <div class="resolution">
          <span class="evx-label resolution__label">RESOLUTION TIMELINE</span>
          <div class="resolution__row">
            <div class="resolution__cell">
              <span class="resolution__num">24h</span>
              <span class="evx-caption resolution__cell-label">FIRST RESPONSE</span>
            </div>
            <div class="resolution__cell">
              <span class="resolution__num">5d</span>
              <span class="evx-caption resolution__cell-label">MOST DISPUTES RESOLVED</span>
            </div>
            <div class="resolution__cell">
              <span class="resolution__num">14d</span>
              <span class="evx-caption resolution__cell-label">COMPLEX CASES (AUTH, FORENSIC)</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 06 How to file a dispute -->
    <section class="trust-section">
      <span class="evx-caption trust-section__num">06 · FILING A DISPUTE</span>
      <div class="trust-section__inner">
        <div class="trust-section__left">
          <h2 class="trust-section__heading">How to file.</h2>
          <p class="trust-section__sub">
            Three steps. We work in your timezone - Dublin office hours plus Saturday morning cover.
          </p>
        </div>

        <ol class="dispute-steps">
          {#each [
            { n: '01', t: 'Open a dispute in Messages.', d: 'On the conversation with the seller, click the "Report dispute" link in the thread header. Tell us what happened in plain English - no template required.' },
            { n: '02', t: 'Send us your evidence.', d: 'Photos of the item as received, the original listing, tracking screenshots, the seller\'s messages. Anything that documents the mismatch.' },
            { n: '03', t: 'We mediate within 48 hours.', d: 'Both sides see our findings. If the buyer wins, the refund is processed the same day. If the seller wins, the buyer is told why with the evidence.' },
          ] as step}
            <li class="dispute-step">
              <span class="evx-label dispute-step__num">{step.n}</span>
              <div class="dispute-step__body">
                <strong class="dispute-step__title">{step.t}</strong>
                <p class="dispute-step__desc">{step.d}</p>
              </div>
            </li>
          {/each}
        </ol>

        <div class="dispute-contact">
          <span class="evx-caption dispute-contact__label">URGENT OR HIGH-VALUE?</span>
          <p class="dispute-contact__body">
            Items above €5,000, suspected counterfeit, or anything time-critical -
            email <a href="mailto:disputes@eirvox.ie" class="dispute-contact__link">disputes@eirvox.ie</a> directly
            and a senior team member responds within four hours during office hours.
          </p>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="trust-faq">
      <span class="evx-caption trust-section__num">COMMON QUESTIONS</span>
      <h2 class="trust-faq__heading">Five things people ask first.</h2>
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

  .trust-auth { display: flex; flex-direction: column; gap: var(--evx-space-2xl); }

  .trust-auth__steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-xl);
  }

  .trust-auth__step {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    font-size: 14px;
  }

  .trust-auth__num { color: var(--evx-fox-orange); }
  .trust-auth__step strong { color: var(--evx-warm-black); font-size: 15px; }
  .trust-auth__body { color: var(--evx-ink-soft); line-height: 1.6; }

  .trust-auth__protocol {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .trust-auth__col { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .trust-auth__list {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    font-size: 14px;
    color: var(--evx-ink-soft);
    line-height: 1.5;
  }

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

  /* ── 05 Coverage matrix ── */
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

  /* Resolution timeline */
  .resolution {
    margin-top: var(--evx-space-xl);
    padding: var(--evx-space-lg);
    background: rgba(232,116,44,0.04);
    border-left: 2px solid var(--evx-fox-orange);
  }
  .resolution__label { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .resolution__row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-lg);
  }
  .resolution__cell {
    display: flex; flex-direction: column;
    gap: 4px;
  }
  .resolution__num {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    line-height: 1;
  }
  .resolution__cell-label { color: var(--evx-ink-soft); line-height: 1.4; }

  /* ── 06 Dispute steps ── */
  .dispute-steps {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }
  .dispute-step {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: var(--evx-space-lg);
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
  }
  .dispute-step__num { color: var(--evx-fox-orange); margin-top: 2px; }
  .dispute-step__body { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .dispute-step__title {
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .dispute-step__desc { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }

  .dispute-contact {
    margin-top: var(--evx-space-lg);
    padding: var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-light);
  }
  .dispute-contact__label { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-sm); }
  .dispute-contact__body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }
  .dispute-contact__link { color: var(--evx-warm-black); text-decoration: underline; text-underline-offset: 3px; }

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
    .trust-auth__steps { grid-template-columns: 1fr 1fr; }
    .trust-auth__protocol { grid-template-columns: 1fr; }
    .coverage { grid-template-columns: 1fr; }
    .resolution__row { grid-template-columns: 1fr; gap: var(--evx-space-md); }
    .dispute-step { grid-template-columns: 1fr; }
  }

  @media (max-width: 767px) {
    .trust-auth__steps { grid-template-columns: 1fr; }
  }
</style>
