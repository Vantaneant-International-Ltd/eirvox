<script lang="ts">
  export let variant: 'full' | 'compact' = 'full'
</script>

<footer class="footer">
  {#if variant === 'full'}
    <div class="footer-body page-container">

      <div class="col-brand">
        <span class="footer-wordmark">Éirvox</span>
        <p class="footer-tagline">A magazine that happens to sell things. Dublin, since 2025.</p>
      </div>

      <div class="col-links">
        <div class="link-group">
          <span class="group-label">Marketplace</span>
          <ul>
            <li><a href="/#/">All listings</a></li>
            <li><a href="/#/automotive">Automotive</a></li>
            <li><a href="/#/">Categories</a></li>
            <li><a href="/#/">Sell on Éirvox</a></li>
            <li><a href="/#/">Seller tiers</a></li>
          </ul>
        </div>
        <div class="link-group">
          <span class="group-label">House</span>
          <ul>
            <li><a href="/#/about">About</a></li>
            <li><a href="/#/">Trust &amp; escrow</a></li>
          </ul>
        </div>
      </div>

      <div class="col-meta">
        <div class="meta-group">
          <span class="group-label">Account</span>
          <p class="meta-text">renato@eirvox.ie</p>
        </div>
        <div class="meta-group">
          <span class="group-label">Registered</span>
          <div class="meta-stack">
            <p>ÉirVox Systems Ltd</p>
            <p>Dublin, Ireland</p>
            <p>eirvox.ie</p>
            <p>VAT &amp; CRO on request</p>
          </div>
        </div>
      </div>

    </div>
  {:else}
    <div class="footer-compact page-container">
      <span class="footer-wordmark">Éirvox</span>
      <p class="footer-tagline compact-tagline">A magazine that happens to sell things. Dublin, since 2025.</p>
    </div>
  {/if}

  <div class="footer-bottom">
    <div class="bottom-inner page-container">
      <span class="copyright">© 2026 ÉIRVOX SYSTEMS LTD · ALL RIGHTS RESERVED · DUBLIN</span>
    </div>
  </div>
</footer>

<style>
  .footer {
    background-color: var(--evx-warm-black);
    color: var(--evx-paper);
  }

  /* ── FULL ─────────────────────────────────────────────────────────────────── */

  .footer-body {
    display: grid;
    grid-template-columns: 2fr 2fr 1.5fr;
    gap: var(--evx-space-2xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .col-brand {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .footer-wordmark {
    display: block;
    font-family: var(--evx-font-sans);
    font-weight: 500;
    font-size: 24px;
    letter-spacing: -0.01em;
    color: var(--evx-paper);
  }

  .footer-tagline {
    font-family: var(--evx-font-serif);
    font-style: italic;
    font-weight: 400;
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-ink-soft);
    margin: 0;
  }

  .col-links {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .col-meta {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .link-group,
  .meta-group {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .group-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  ul a {
    font-family: var(--evx-font-sans);
    font-weight: 400;
    font-size: var(--evx-type-body-size);
    color: var(--evx-paper);
    transition: var(--evx-transition);
  }

  ul a:hover {
    opacity: 0.6;
  }

  .meta-text {
    font-family: var(--evx-font-sans);
    font-size: var(--evx-type-body-size);
    color: var(--evx-paper);
    margin: 0;
  }

  .meta-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .meta-stack p {
    font-family: var(--evx-font-sans);
    font-size: var(--evx-type-body-size);
    color: var(--evx-paper);
    margin: 0;
  }

  /* ── COMPACT ──────────────────────────────────────────────────────────────── */

  .footer-compact {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-xl);
    flex-wrap: wrap;
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-xl);
  }

  .compact-tagline {
    color: var(--evx-ink-soft);
  }

  /* ── BOTTOM BAR ───────────────────────────────────────────────────────────── */

  .footer-bottom {
    border-top: 1px solid var(--evx-rule-dark);
  }

  .bottom-inner {
    display: flex;
    align-items: center;
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-xl);
  }

  .copyright {
    font-family: var(--evx-font-mono);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  /* ── RESPONSIVE ───────────────────────────────────────────────────────────── */

  @media (max-width: 767px) {
    .footer-body {
      grid-template-columns: 1fr;
      gap: var(--evx-space-xl);
      padding-top: var(--evx-space-2xl);
    }

    .footer-compact {
      flex-direction: column;
      gap: var(--evx-space-sm);
    }
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    .footer-body {
      grid-template-columns: 1fr 1fr;
    }

    .col-brand {
      grid-column: 1 / -1;
    }
  }
</style>
