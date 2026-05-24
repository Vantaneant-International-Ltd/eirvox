<script lang="ts">
  export let variant: 'full' | 'compact' = 'full';
</script>

<footer class="footer footer--{variant}">
  {#if variant === 'full'}
    <div class="footer__body page-container">
      <div class="footer__col footer__col--brand">
        <a href="/#/" class="footer__wordmark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10.5" stroke="#E8742C" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="5" fill="#E8742C"/>
          </svg>
          <span>Éirvox</span>
        </a>
        <p class="footer__tagline"><em>A magazine that happens to sell things. Dublin, since 2025.</em></p>
      </div>

      <div class="footer__col">
        <span class="evx-label footer__section-head">Marketplace</span>
        <ul class="footer__links">
          <li><a href="/#/automotive">All listings</a></li>
          <li><a href="/#/automotive">Automotive</a></li>
          <li><a href="/#/automotive">Categories</a></li>
          <li><a href="/#/enquire">Sell on Éirvox</a></li>
          <li><a href="/#/about">Seller tiers</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <span class="evx-label footer__section-head">House</span>
        <ul class="footer__links">
          <li><a href="/#/about">About</a></li>
          <li><a href="/#/about">Trust &amp; escrow</a></li>
          <li><a href="/#/">Account</a></li>
          <li><a href="mailto:renato@eirvox.ie">renato@eirvox.ie</a></li>
        </ul>
      </div>

      <div class="footer__col">
        <span class="evx-label footer__section-head">Registered</span>
        <p class="evx-caption footer__reg-block">
          ÉirVox Systems Ltd<br />
          Dublin, Ireland<br />
          eirvox.ie<br />
          VAT &amp; CRO on request
        </p>
      </div>
    </div>
  {:else}
    <div class="footer__compact page-container">
      <a href="/#/" class="footer__wordmark">Éirvox</a>
      <span class="footer__drive">Drive with intent.</span>
    </div>
  {/if}

  <div class="footer__bar page-container">
    <span class="evx-caption footer__copyright">
      © 2026 ÉIRVOX SYSTEMS LTD · ALL RIGHTS RESERVED · DUBLIN
    </span>
    <span class="evx-caption footer__build">
      v0.1 — DESIGN PREVIEW · BUILT BY ALAN
    </span>
  </div>
</footer>

<style>
  .footer {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    margin-top: var(--evx-space-3xl);
  }

  .footer__body {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr 1fr;
    gap: var(--evx-space-3xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-dark);
  }

  .footer__wordmark {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    font-family: 'Inter Tight', sans-serif;
    font-weight: 500;
    font-size: 20px;
    color: var(--evx-paper);
    text-decoration: none;
    margin-bottom: var(--evx-space-lg);
  }

  .footer__tagline {
    font-family: 'Newsreader', serif;
    font-style: italic;
    font-size: 15px;
    line-height: 1.60;
    color: var(--evx-ink-soft);
  }

  .footer__col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .footer__section-head {
    color: var(--evx-ink-soft);
    display: block;
  }

  .footer__section-head--spaced {
    margin-top: var(--evx-space-lg);
  }

  .footer__links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .footer__links a {
    font-size: 14px;
    color: var(--evx-paper);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .footer__links a:hover {
    opacity: 0.60;
  }

  .footer__reg-block {
    color: var(--evx-ink-soft);
    line-height: 1.80;
  }

  .footer__compact {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-dark);
  }

  .footer__drive {
    font-family: 'Newsreader', serif;
    font-style: italic;
    font-size: 18px;
    color: var(--evx-ink-soft);
  }

  .footer__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
  }

  .footer__copyright,
  .footer__build {
    color: var(--evx-ink-soft);
  }

  @media (max-width: 1023px) {
    .footer__body {
      grid-template-columns: 1fr 1fr;
      gap: var(--evx-space-2xl);
    }

    .footer__col--brand {
      grid-column: 1 / -1;
    }

    .footer__bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }
  }

  @media (max-width: 767px) {
    .footer__body {
      grid-template-columns: 1fr;
    }

    .footer__compact {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-md);
    }
  }
</style>
