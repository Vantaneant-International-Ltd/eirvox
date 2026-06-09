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
        <p>ÉIRVOX started out of frustration.</p>

        <p>
          We wanted to sell a few premium pieces. DoneDeal felt wrong. eBay took its cut.
          StockX was friction. None of it fit what we were selling.
        </p>

        <p>
          So we posted to Facebook. It worked, in the rough way Facebook works. No proper
          pages. No system. No way to present a piece the way it deserved.
        </p>

        <p>
          The website was the answer. Clean pages that let a product breathe.
          Honest listings. A payment flow that respects both sides. Curation over volume.
          Ten things worth owning, not ten thousand to scroll past.
        </p>

        <p>
          That is still the whole idea. A curated home for premium goods in Ireland.
          Cars. Parts. Watches. The occasional thing that fits no category but earns
          its place anyway.
        </p>

        <p>
          Some of it we publish ourselves, under DRIVE. Designed in Ireland,
          assembled abroad, finished in Dublin. Small runs. Never repeated.
        </p>

        <p>
          The rest comes from sellers we choose to work with.
        </p>

        <p>
          We are small. We like it that way for now. Every piece on the site has
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
