<script lang="ts">
  import Nav from './Nav.svelte';
  import Footer from './Footer.svelte';
  import { navigate } from './router';
  import { gatedLegalMode } from './flags';

  export let title: string;
  export let lastUpdated: string = '1 June 2026';
  export let sections: { num: string; id: string; label: string }[] = [];
  export let intro: string = '';
</script>

{#if !$gatedLegalMode}
  <Nav />
{:else}
  <!-- Visitor arrived via the coming-soon / maintenance gate. Render
       a slim dark top strip instead of the full Nav so the policy
       view doesn't leak the rest of the site's structure. -->
  <header class="legal-gated-top">
    <a class="legal-gated-top__back" href="#/" aria-label="Back to ÉIRVOX">← Back</a>
    <img src="/brand/wordmark.png" alt="ÉIRVOX" class="legal-gated-top__wordmark" />
    <span class="legal-gated-top__spacer"></span>
  </header>
{/if}

<main id="main-content" class="legal-page" class:legal-page--gated={$gatedLegalMode}>
  <div class="page-container">

    <header class="legal-header">
      <span class="evx-caption legal-header__pre">LEGAL · ÉIRVOX SYSTEMS LTD</span>
      <h1 class="legal-title">{title}</h1>
      {#if intro}
        <p class="legal-intro">{intro}</p>
      {/if}
      <p class="legal-meta evx-caption">Last updated: {lastUpdated} · Effective immediately</p>
    </header>

    <div class="legal-body">
      <!-- Sticky section nav -->
      {#if sections.length > 0}
        <aside class="legal-toc" aria-label="Sections">
          <span class="evx-label legal-toc__title">CONTENTS</span>
          <ul class="legal-toc__list">
            {#each sections as s}
              <li>
                <a href="#{s.id}" class="legal-toc__link">
                  <span class="legal-toc__num evx-caption">{s.num}</span>
                  <span class="legal-toc__label">{s.label}</span>
                </a>
              </li>
            {/each}
          </ul>
        </aside>
      {/if}

      <div class="legal-content">
        <slot />

        <div class="legal-corporate">
          <span class="evx-label legal-corporate__label">CORPORATE STRUCTURE</span>
          <p class="legal-corporate__body">
            ÉIRVOX is operated by <strong>ÉIRVOX Systems Ltd</strong>, trading as ÉIRVOX.
            ÉIRVOX Systems Ltd is a wholly owned subsidiary of
            <strong>Vantaneant International Ltd</strong>
            (<a href="https://vnta.xyz" class="legal-link" target="_blank" rel="noopener noreferrer">vnta.xyz</a>),
            which also operates <strong>Vendr</strong>
            (<a href="https://vendr.ie" class="legal-link" target="_blank" rel="noopener noreferrer">vendr.ie</a>).
            References to "we" or "us" in this document mean ÉIRVOX Systems Ltd unless otherwise stated.
          </p>
        </div>

        <div class="legal-footer-note">
          <span class="evx-label legal-footer-note__label">QUESTIONS?</span>
          <p class="legal-footer-note__body">
            Anything unclear, anything to flag — email
            <a href="mailto:renato@eirvox.ie" class="legal-link">renato@eirvox.ie</a>
            and we'll come back to you within 48 hours.
          </p>
        </div>

        <div class="legal-cross">
          <span class="evx-caption">RELATED</span>
          <div class="legal-cross__links">
            <button on:click={() => navigate('/terms')}>Terms</button>
            <button on:click={() => navigate('/privacy')}>Privacy</button>
            <button on:click={() => navigate('/cookies')}>Cookies</button>
            <button on:click={() => navigate('/acceptable-use')}>Acceptable Use</button>
            <button on:click={() => navigate('/returns')}>Returns &amp; Refunds</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</main>

{#if !$gatedLegalMode}
  <Footer />
{:else}
  <footer class="legal-gated-bot">
    <div class="legal-gated-bot__inner">
      <span class="legal-gated-bot__entity">ÉIRVOX Systems Ltd · Dublin, Ireland</span>
      <div class="legal-gated-bot__links">
        <a href="#/privacy">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="#/terms">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="#/cookies">Cookies</a>
        <span aria-hidden="true">·</span>
        <a href="#/acceptable-use">Acceptable Use</a>
        <span aria-hidden="true">·</span>
        <a href="#/returns">Returns</a>
      </div>
    </div>
  </footer>
{/if}

<style>
  .legal-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* ── Gated chrome (when visitor came via coming-soon / maintenance) ── */
  .legal-gated-top {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    background: #1A1A1A;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(245, 242, 237, 0.08);
  }
  .legal-gated-top__back {
    justify-self: start;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: #8C8C8C;
    text-decoration: none;
    transition: color 200ms ease;
  }
  .legal-gated-top__back:hover { color: #E8742C; }
  .legal-gated-top__wordmark {
    justify-self: center;
    height: 20px;
    width: auto;
    filter: invert(1) brightness(1.05);
  }
  .legal-gated-top__spacer { width: 1px; }

  .legal-page--gated {
    background: var(--evx-paper);
    padding-top: var(--evx-space-xl);
  }
  .legal-page--gated .legal-toc { display: none; }
  .legal-page--gated .legal-body { grid-template-columns: 1fr; }

  .legal-gated-bot {
    background: #1A1A1A;
    color: #F5F2ED;
    padding: 28px 24px;
  }
  .legal-gated-bot__inner {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: center;
    text-align: center;
  }
  .legal-gated-bot__entity {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: #5C5C5C;
  }
  .legal-gated-bot__links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: #5C5C5C;
  }
  .legal-gated-bot__links a {
    color: #F5F2ED;
    text-decoration: none;
    transition: color 200ms ease;
  }
  .legal-gated-bot__links a:hover { color: #E8742C; }

  /* Header */
  .legal-header {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
    max-width: 760px;
  }

  .legal-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }

  .legal-title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-lg);
    line-height: 1;
  }

  .legal-intro { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }
  .legal-meta { color: var(--evx-ink-soft); }

  /* Body layout */
  .legal-body {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  /* Section nav */
  .legal-toc {
    position: sticky;
    top: 80px;
    border-right: 1px solid var(--evx-rule-light);
    padding-right: var(--evx-space-md);
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
  .legal-toc__title { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }

  .legal-toc__list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .legal-toc__link {
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: var(--evx-space-sm);
    padding: 6px 0;
    align-items: baseline;
    color: var(--evx-warm-black);
    text-decoration: none;
    transition: var(--evx-transition);
  }
  .legal-toc__link:hover { opacity: 0.65; }

  .legal-toc__num { color: var(--evx-ink-soft); }

  .legal-toc__label {
    font-family: var(--evx-font-display);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
  }

  /* Content area */
  .legal-content {
    max-width: 720px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
  }

  /* Default styles for slot content */
  :global(.legal-content .legal-section) {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }
  :global(.legal-content .legal-section:first-child) {
    padding-top: 0;
    border-top: none;
  }
  :global(.legal-content .legal-section__num) {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-fox-orange);
  }
  :global(.legal-content .legal-section__h) {
    font-family: var(--evx-font-display);
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    line-height: 1.2;
    scroll-margin-top: 80px;
  }
  :global(.legal-content .legal-section p) {
    font-size: 15px;
    line-height: 1.75;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-md);
  }
  :global(.legal-content .legal-section p:last-child) { margin-bottom: 0; }
  :global(.legal-content .legal-section strong) { color: var(--evx-warm-black); font-weight: 500; }
  :global(.legal-content .legal-section ul) {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-left: var(--evx-space-lg);
    list-style: none;
    margin-bottom: var(--evx-space-md);
  }
  :global(.legal-content .legal-section ul li) {
    font-size: 14px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
    position: relative;
  }
  :global(.legal-content .legal-section ul li::before) {
    content: '·';
    position: absolute;
    left: -16px;
    color: var(--evx-fox-orange);
    font-weight: 700;
  }
  :global(.legal-content .legal-link),
  :global(.legal-content a) {
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Corporate structure disclosure */
  .legal-corporate {
    padding: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
  }
  .legal-corporate__label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .legal-corporate__body {
    font-size: 14px;
    line-height: 1.75;
    color: var(--evx-ink-soft);
  }
  .legal-corporate__body strong { color: var(--evx-warm-black); font-weight: 500; }

  /* Footer note + cross-links */
  .legal-footer-note {
    padding: var(--evx-space-lg);
    background: rgba(232, 116, 44, 0.04);
    border-left: 2px solid var(--evx-fox-orange);
  }
  .legal-footer-note__label { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-sm); }
  .legal-footer-note__body { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  .legal-link {
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .legal-cross {
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }
  .legal-cross > span { color: var(--evx-ink-soft); }
  .legal-cross__links { display: flex; flex-wrap: wrap; gap: var(--evx-space-md); }
  .legal-cross__links button {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black);
    cursor: pointer;
    font-family: var(--evx-font-display);
    font-size: 14px;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }
  .legal-cross__links button:hover { opacity: 0.65; }

  @media (max-width: 1023px) {
    .legal-body { grid-template-columns: 1fr; }
    .legal-toc { display: none; }
  }
</style>
