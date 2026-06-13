<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import FactNeeded from '../lib/FactNeeded.svelte';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.about()));
</script>

<Nav />

<main id="main-content" class="about-page">
  <div class="page-container">

    <!-- Head -->
    <header class="about-head">
      <span class="evx-caption about-head__pre">ABOUT · DUBLIN</span>
      <h1 class="about-head__title">A carbon steering-wheel specialist in Dublin.</h1>
      <p class="about-head__line">Fewer, better things — and the truth about all of them.</p>
    </header>

    <!-- What ÉIRVOX is -->
    <section class="about-intro">
      <p>
        ÉIRVOX makes limited-run carbon steering wheels for BMW drivers in Ireland — a fitted
        range, and a numbered edition line called DRIVE. Each DRIVE issue is made once and not
        reprinted.
      </p>
      <p>
        Every wheel is designed in Ireland, assembled abroad by a specialist carbon manufacturer,
        and finished in Dublin before it ships. If it isn't right, it doesn't ship.
      </p>
    </section>

    <!-- Process -->
    <section class="about-process">
      <span class="evx-caption about-process__pre">THE PROCESS</span>
      <div class="about-process__grid">
        <div class="about-process__media" role="img"
             aria-label="Workbench photograph, to be added">
          <span class="about-process__slot">SHOT 10 · BENCH ENVIRONMENTAL — NO PERSON REQUIRED</span>
        </div>
        <ol class="about-steps">
          <li class="about-step">
            <span class="evx-label about-step__num">01</span>
            <div>
              <strong class="about-step__title">Designed</strong>
              <span class="about-step__body"> In Ireland. Geometry, weave, trim and LED behaviour are specified here.</span>
            </div>
          </li>
          <li class="about-step">
            <span class="evx-label about-step__num">02</span>
            <div>
              <strong class="about-step__title">Assembled</strong>
              <span class="about-step__body"> Abroad, by a specialist carbon manufacturer.</span>
            </div>
          </li>
          <li class="about-step">
            <span class="evx-label about-step__num">03</span>
            <div>
              <strong class="about-step__title">Finished</strong>
              <span class="about-step__body"> In Dublin. Inspection, trim and LED fitting, function test, packing. </span>
              <FactNeeded label="EXACT FINISHING STEPS" />
            </div>
          </li>
          <li class="about-step">
            <span class="evx-label about-step__num">04</span>
            <div>
              <strong class="about-step__title">Fitted &amp; shipped</strong>
              <span class="about-step__body"> Collected in Dublin, or shipped within Ireland. </span>
              <FactNeeded label="SHIPPING CARRIER · FITTING OFFERED / PRICE" />
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- Registry colophon -->
    <section class="about-registry">
      <div class="about-registry__inner">
        <span class="about-registry__line">ÉIRVOX SYSTEMS LTD · TRADING AS ÉIRVOX</span>
        <span class="about-registry__line about-registry__line--dim">A VANTANEANT INTERNATIONAL LTD COMPANY</span>
        <span class="about-registry__line">REGISTERED IN IRELAND · <a class="about-registry__verify" href="https://core.cro.ie" target="_blank" rel="noopener noreferrer">CRO 712304</a> · DUBLIN, IRELAND</span>
        <span class="about-registry__line">SUPPORT@EIRVOX.IE</span>
        <!-- Registered office withheld (private address); no VAT line until verified. -->
      </div>
    </section>

  </div>
</main>

<Footer />

<style>
  .about-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Head */
  .about-head {
    max-width: 760px;
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-3xl);
  }
  .about-head__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .about-head__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.08;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-lg);
  }
  .about-head__line {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 20px;
    line-height: 1.4;
    color: var(--evx-ink-soft);
  }

  /* Intro */
  .about-intro {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    margin-bottom: var(--evx-space-3xl);
  }
  .about-intro p {
    font-family: var(--evx-font-display);
    font-size: 17px;
    line-height: 1.75;
    color: var(--evx-warm-black);
  }

  /* Process */
  .about-process {
    padding-top: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-3xl);
  }
  .about-process__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-xl); }
  .about-process__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--evx-space-2xl);
    align-items: start;
  }
  .about-process__media {
    aspect-ratio: 4 / 5;
    background: rgba(26, 26, 26, 0.045);
    border: 1px solid var(--evx-rule-light);
    display: flex;
    align-items: flex-end;
    padding: var(--evx-space-md);
    max-width: 320px;
  }
  .about-process__slot {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    color: var(--evx-ink-soft);
    line-height: 1.5;
  }

  .about-steps { display: flex; flex-direction: column; gap: 0; list-style: none; }
  .about-step {
    display: flex;
    gap: var(--evx-space-xl);
    align-items: flex-start;
    padding: var(--evx-space-lg) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px;
    line-height: 1.65;
  }
  .about-step__num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }
  .about-step__title { color: var(--evx-warm-black); font-weight: 500; }
  .about-step__body { color: var(--evx-ink-soft); }

  /* Registry colophon */
  .about-registry {
    padding-top: var(--evx-space-3xl);
    border-top: 1px solid var(--evx-rule-light);
  }
  .about-registry__inner {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.04em;
    line-height: 1.5;
    color: var(--evx-ink-soft);
  }
  .about-registry__line--dim { opacity: 0.7; }
  .about-registry__verify {
    color: var(--evx-fox-orange);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (min-width: 768px) {
    .about-process__grid { grid-template-columns: 320px 1fr; }
  }
</style>
