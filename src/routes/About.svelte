<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.about()));
</script>

<Nav />

<main id="main-content" class="about-page">
  <div class="page-container">

    <header class="about-hero">
      <h1 class="about-hero__title">
        A premium marketplace<br/>
        <em class="about-hero__italic">that publishes its own pieces.</em>
      </h1>
      <p class="about-hero__sub">
        ÉIRVOX competes with DoneDeal Motors and Adverts on liquidity, with Chrono24 and Grailed
        on trust, and with Bring a Trailer on storytelling. The job is to give a first-time visitor
        the marketplace they need in under five seconds — and the brand they remember after the first transaction.
      </p>
    </header>

    <!-- Principles -->
    <section class="about-principles">
      <span class="evx-caption about-principles__pre">FOUR PRINCIPLES</span>
      <div class="about-principles__grid">
        {#each [
          {
            n: 'PR · 01',
            title: 'Liquidity is the first impression.',
            body: 'Every landing surface — home, category, search — shows populated inventory above the fold. A first-time visitor should count more than a dozen real listings without scrolling past the hero.',
          },
          {
            n: 'PR · 02',
            title: 'Editorial is texture, not architecture.',
            body: 'DRIVE lives at /drive and gets one band on the homepage. It informs the typography and photography standards everywhere else. It does not own the navigation.',
          },
          {
            n: 'PR · 03',
            title: 'Trust is typographic, not iconographic.',
            body: 'Seller tier, deposit status, authentication state — all surfaced in plain language and clear hierarchy. No badge stacks. No icon rows. One Verified mark in Fox Orange, used sparingly.',
          },
          {
            n: 'PR · 04',
            title: 'Refine marketplace usability — do not reinvent it.',
            body: 'Filters where filters belong. Search where search belongs. The mental model is DoneDeal with restraint, not a curated boutique. Steal the structure, replace the styling.',
          },
        ] as p}
          <div class="about-principle">
            <span class="evx-caption about-principle__n">{p.n}</span>
            <h3 class="about-principle__title">{p.title}</h3>
            <p class="about-principle__body">{p.body}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- What ÉIRVOX is -->
    <section class="about-is">
      <div class="about-is__grid">
        <div>
          <span class="evx-label about-is__label">IT IS</span>
          <ul class="about-is__list">
            <li>+ A marketplace for enthusiast objects across Ireland, starting with automotive.</li>
            <li>+ An escrow-backed platform with seller verification and high-value authentication.</li>
            <li>+ The publisher of DRIVE — limited-run OEM+ pieces, one specification per issue.</li>
            <li>+ A cohort-approved seller community across three tiers.</li>
            <li>+ A serious commercial product with a brand spine.</li>
          </ul>
        </div>
        <div>
          <span class="evx-label about-is__label about-is__label--neg">IT ISN'T</span>
          <ul class="about-is__list about-is__list--neg">
            <li>− A magazine, a portfolio site, or a sparse luxury campaign.</li>
            <li>− An open Craigslist-style classifieds with no quality bar.</li>
            <li>− A boutique with fewer than a hundred listings.</li>
            <li>− A social feed, a gamified app, or an AI-assistant surface.</li>
            <li>− A flat black-and-gold cliché.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section class="about-contact">
      <h2 class="about-contact__heading">Get in touch.</h2>
      <div class="about-contact__grid">
        <div>
          <span class="evx-caption about-contact__label">GENERAL</span>
          <a href="mailto:renato@eirvox.ie" class="about-contact__email">renato@eirvox.ie</a>
        </div>
        <div>
          <span class="evx-caption about-contact__label">PRESS</span>
          <p class="about-contact__body">Press kit on request. Contact via email above.</p>
        </div>
        <div>
          <span class="evx-caption about-contact__label">SELLERS</span>
          <p class="about-contact__body">
            <button class="about-contact__link" on:click={() => navigate('/sell/apply')}>
              Apply to sell on Éirvox →
            </button>
          </p>
        </div>
      </div>
    </section>

    <!-- Footer note -->
    <div class="about-legal evx-caption">
      ÉIRVOX SYSTEMS LTD · DUBLIN · CRO 712304 · VAT IE 3987654 N · FOUNDED MMXXVI
    </div>

  </div>
</main>

<Footer />

<style>
  .about-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .about-hero {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
    max-width: 760px;
  }

  .about-hero__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.08;
    margin-bottom: var(--evx-space-xl);
  }

  .about-hero__italic {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
  }

  .about-hero__sub { font-size: 16px; line-height: 1.75; color: var(--evx-ink-soft); }

  .about-principles {
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .about-principles__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-xl); }

  .about-principles__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-top: 1px solid var(--evx-rule-light);
    border-left: 1px solid var(--evx-rule-light);
  }

  .about-principle {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding: var(--evx-space-xl);
    border-right: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .about-principle__n { color: var(--evx-fox-orange); }

  .about-principle__title {
    font-family: var(--evx-font-display);
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
  }

  .about-principle__body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  .about-is {
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .about-is__grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--evx-space-3xl); }

  .about-is__label { display: block; margin-bottom: var(--evx-space-lg); color: var(--evx-ink-soft); }
  .about-is__label--neg { color: var(--evx-ink-soft); }

  .about-is__list {
    display: flex;
    flex-direction: column;
    gap: 0;
    font-size: 15px;
    line-height: 1.5;
  }

  .about-is__list li {
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    color: var(--evx-warm-black);
  }

  .about-is__list--neg li { opacity: 0.60; }

  .about-contact { margin-bottom: var(--evx-space-2xl); }

  .about-contact__heading {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-bottom: var(--evx-space-xl);
  }

  .about-contact__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-3xl);
  }

  .about-contact__label { display: block; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }

  .about-contact__email {
    font-family: var(--evx-font-display);
    font-size: 18px;
    font-weight: 500;
    color: var(--evx-warm-black);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .about-contact__email:hover { opacity: 0.60; }

  .about-contact__body { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }

  .about-contact__link {
    background: none;
    border: none;
    padding: 0;
    font-size: 14px;
    color: var(--evx-warm-black);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }

  .about-contact__link:hover { opacity: 0.60; }

  .about-legal {
    color: var(--evx-ink-soft);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  @media (max-width: 1023px) {
    .about-principles__grid { grid-template-columns: 1fr; }
    .about-is__grid { grid-template-columns: 1fr; }
    .about-contact__grid { grid-template-columns: 1fr; }
  }
</style>
