<script lang="ts">
  // ============================================================
  // 404, the honest dead end. Light, like everything else.
  //
  // Gated marketplace paths no longer land here: App.svelte routes
  // those to /marketplace so the visitor gets an explanation instead
  // of a wall. This page is now only a genuine wrong turn.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate, currentPath } from '../lib/router';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Not found',
    description: 'That page does not exist.',
    path: '/404',
    noindex: true,
  }));

  function go(path: string) {
    const hashIdx = path.indexOf('#');
    if (hashIdx > 0) {
      navigate(path.slice(0, hashIdx));
      const anchor = path.slice(hashIdx + 1);
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
      return;
    }
    navigate(path);
  }
</script>

<Nav />

<main id="main-content" class="nf evx-mark-host">
  <div class="evx-mark nf__mark" aria-hidden="true"></div>
  <div class="page-container nf__inner">
    <span class="evx-label">404</span>
    <h1 class="evx-display nf__title">There's nothing here.</h1>
    <p class="evx-lede nf__lede">
      The address <code class="nf__path">{$currentPath}</code> doesn't lead anywhere.
      It may have moved, or it may never have been there at all.
    </p>

    <div class="nf__actions">
      <button class="evx-btn evx-btn--primary" on:click={() => go('/wheels')}>Go to the shop</button>
      <button class="evx-link" on:click={() => go('/')}>Back to the front page</button>
    </div>

    <ul class="nf__links">
      <li><button on:click={() => go('/wheels#fitment')}>Find your fit</button></li>
      <li><button on:click={() => go('/wheels#drive')}>DRIVE</button></li>
      <li><button on:click={() => go('/about')}>About</button></li>
      <li><button on:click={() => go('/trust')}>How buying works</button></li>
      <li><a href="mailto:support@eirvox.ie">Contact</a></li>
    </ul>
  </div>
</main>

<Footer />

<style>
  .nf { overflow: hidden; }
  .nf__mark {
    top: 50%;
    right: -6vw;
    width: min(48vw, 460px);
    height: min(48vw, 460px);
    transform: translateY(-50%);
  }

  .nf__inner {
    padding-top: var(--evx-space-4xl);
    padding-bottom: var(--evx-space-4xl);
    max-width: 720px;
  }
  .nf__title { margin-top: var(--evx-space-md); }
  .nf__lede { margin-top: var(--evx-space-lg); }
  .nf__path {
    font-family: var(--evx-font-mono);
    font-size: 13px;
    color: var(--evx-ink);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .nf__actions {
    display: flex;
    align-items: center;
    gap: var(--evx-space-lg);
    margin-top: var(--evx-space-xl);
    flex-wrap: wrap;
  }

  .nf__links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--evx-space-lg);
    margin-top: var(--evx-space-3xl);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }
  .nf__links button,
  .nf__links a {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    padding: 0;
    transition: var(--evx-transition);
  }
  .nf__links button:hover,
  .nf__links a:hover { color: var(--evx-ink); }
</style>
