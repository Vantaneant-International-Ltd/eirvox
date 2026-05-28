<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';

  export let title: string = 'Coming soon.';
  export let description: string = 'This section is under construction. Check back soon.';
</script>

<Nav />

<main class="cs-page">
  <div class="page-container cs-inner">
    <div class="cs-content">
      <span class="evx-caption cs-pre">ÉIRVOX · IN PROGRESS</span>
      <h1 class="cs-title">{title}</h1>
      <p class="cs-desc">{description}</p>
      <div class="cs-actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>
          Back to marketplace →
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/about')}>
          About Éirvox
        </button>
      </div>
    </div>
  </div>
</main>

<Footer />

<style>
  .cs-page { flex: 1; }

  .cs-inner {
    display: flex;
    align-items: flex-start;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .cs-content { max-width: 480px; }

  .cs-pre {
    display: block;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-xl);
  }

  .cs-title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: var(--evx-space-lg);
  }

  .cs-desc {
    font-size: 16px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-xl);
  }

  .cs-actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }
</style>
