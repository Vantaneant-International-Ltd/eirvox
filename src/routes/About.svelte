<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.about()));
</script>

<Nav />

<main id="main-content" class="about-page">
  <div class="page-container">

    <article class="about-article">
      <header class="about-article__head">
        <span class="evx-caption about-article__pre">ABOUT</span>
        <h1 class="about-article__title">About ÉIRVOX</h1>
      </header>

      <div class="about-article__body">
        <p>ÉIRVOX started the way most good things do. Out of frustration.</p>

        <p>
          We wanted to sell a few premium pieces. Not bury them in a DoneDeal feed next to
          everything else, not hand a cut to eBay, not deal with StockX and its endless friction.
          None of it fit what we were selling or how we wanted to sell it.
        </p>

        <p>
          So we did what made sense at the time. We posted to Facebook. It worked, but it was
          messy. No proper pages, no way to present a piece the way it deserved, no system
          behind any of it.
        </p>

        <p>
          The website came next. We built the thing we actually wanted to use. Clean pages
          that let a product breathe. Honest listings. A reservation and payment flow that
          respects both sides of the deal. Curation over volume, because we would rather show
          ten things worth owning than ten thousand things to scroll past.
        </p>

        <p>
          That is still the whole idea. ÉIRVOX is a curated home for premium goods in Ireland.
          Cars, parts, watches, the occasional thing that does not fit a category but earns
          its place anyway. Some of it we make ourselves under DRIVE, designed in Dublin and
          assembled in small runs, never repeated. The rest comes from sellers we choose to
          work with.
        </p>

        <p>
          We are still small. We like it that way for now. It means every piece on here
          passed through someone who cared whether it belonged.
        </p>
      </div>
    </article>

  </div>
</main>

<Footer />

<style>
  .about-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .about-article {
    max-width: 640px;
    margin: 0 auto;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .about-article__head {
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .about-article__pre {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-md);
  }

  .about-article__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--evx-warm-black);
  }

  .about-article__body {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  .about-article__body p {
    font-family: var(--evx-font-display);
    font-size: 17px;
    line-height: 1.75;
    color: var(--evx-warm-black);
    margin: 0;
  }
</style>
