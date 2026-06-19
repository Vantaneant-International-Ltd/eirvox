<script lang="ts">
  // ============================================================
  // Footer — ÉIRVOX imprint. One skeleton, two surface contexts.
  //   dark=false  → Paper (light pages: About, Trust, legal, …)
  //   dark=true   → dark surface (the wheels pages)
  // Only the surface tokens swap (local --f-* aliases map to existing
  // --evx-* tokens). Zero new colours, radii, shadows or typefaces.
  //
  // Zones: 1 identity + registry, 2 launch nav, 3 legal + payments.
  // No newsletter, no social, no personal emails, no VAT (commented
  // until verified). Registry carries the registered-address FACT token.
  // ============================================================
  import { navigate } from './router';
  import PaymentIcons from './PaymentIcons.svelte';

  export let dark = false;
</script>

<footer class="footer" class:footer--dark={dark}>
  <div class="footer__body page-container">

    <!-- Zone 1 · identity + registry -->
    <div class="footer__identity">
      <button class="footer__wordmark" on:click={() => navigate('/wheels')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="footer__logo" class:footer__logo--dark={dark} />
      </button>

      <p class="footer__origin">
        Designed in Ireland. <span class="footer__origin-em">Finished in Dublin.</span>
      </p>

      <div class="footer__registry">
        <span>EIRVOX LIMITED</span>
        <span class="footer__registry-dim">A VANTANÉANT INTERNATIONAL LTD COMPANY</span>
        <span>REGISTERED IN IRELAND · <a class="footer__verify" href="https://core.cro.ie" target="_blank" rel="noopener noreferrer">CRO 806648</a> · DUBLIN, IRELAND</span>
        <span>SUPPORT@EIRVOX.IE</span>
        <!-- Legal name EIRVOX LIMITED (no accent); brand wordmark stays ÉIRVOX
             (acute). Registered office withheld (private address); no VAT line
             until verified. -->
      </div>
    </div>

    <!-- Zone 2 · launch nav -->
    <div class="footer__nav">
      <div class="footer__col">
        <span class="footer__head">SHOP</span>
        <ul class="footer__links">
          <li><button on:click={() => navigate('/wheels')}>Wheels</button></li>
          <li><button on:click={() => navigate('/wheels')}>Find your fit</button></li>
          <li><button on:click={() => navigate('/drive')}>DRIVE</button></li>
        </ul>
      </div>
      <div class="footer__col">
        <span class="footer__head">HOUSE</span>
        <ul class="footer__links">
          <li><button on:click={() => navigate('/about')}>About</button></li>
          <li><button on:click={() => navigate('/trust')}>Trust</button></li>
          <li><a href="mailto:support@eirvox.ie">Contact</a></li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Zone 3 · legal + payments -->
  <div class="footer__meta page-container">
    <div class="footer__legal">
      <button on:click={() => navigate('/terms')}>TERMS</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/privacy')}>PRIVACY</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/cookies')}>COOKIES</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/acceptable-use')}>ACCEPTABLE USE</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/refund-policy')}>REFUND POLICY</button>
    </div>
    <div class="footer__pay">
      <PaymentIcons />
    </div>
  </div>

  <div class="footer__bar page-container">
    <span class="footer__bar-text">© 2026 EIRVOX LIMITED</span>
    <span class="footer__bar-text">DUBLIN, IRELAND</span>
  </div>
</footer>

<style>
  /* Surface tokens — local aliases over the existing --evx-* system. */
  .footer {
    --f-bg:   var(--evx-paper);
    --f-ink:  var(--evx-ink);
    --f-soft: var(--evx-ink-soft);
    --f-rule: var(--evx-rule-light);
    background: var(--f-bg);
    color: var(--f-ink);
    margin-top: auto;
  }
  .footer--dark {
    --f-bg:   var(--evx-surface);
    --f-ink:  var(--evx-paper);
    --f-soft: var(--evx-paper-soft);
    --f-rule: var(--evx-rule);
  }

  /* Body: identity + nav */
  .footer__body {
    display: grid;
    grid-template-columns: 2.2fr 1fr 1fr;
    gap: var(--evx-space-2xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .footer__identity { display: flex; flex-direction: column; gap: var(--evx-space-md); padding-right: var(--evx-space-xl); }

  .footer__wordmark { display: inline-flex; align-self: flex-start; background: none; border: none; padding: 0; cursor: pointer; }
  /* Canonical miniature wordmark: brand PNG. Identity zone, slightly
     larger than the 16px chrome bars. Inverted to paper on dark. */
  .footer__logo { height: 22px; width: auto; display: block; }
  .footer__logo--dark { filter: invert(1) brightness(1.05); }

  .footer__origin {
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--f-ink);
    margin-top: var(--evx-space-xs);
  }
  .footer__origin-em {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    color: var(--f-soft);
  }

  .footer__registry {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: var(--evx-space-md);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    line-height: 1.5;
    color: var(--f-soft);
  }
  .footer__registry-dim { opacity: 0.7; }
  .footer__verify {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: var(--evx-transition);
  }
  .footer__verify:hover { color: var(--f-ink); }

  /* Nav columns */
  .footer__nav { display: contents; }
  .footer__col { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .footer__head {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--f-soft);
    margin-bottom: var(--evx-space-sm);
  }
  .footer__links { display: flex; flex-direction: column; gap: 12px; }
  .footer__links button,
  .footer__links a {
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--f-ink);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    text-decoration: none;
    transition: var(--evx-transition);
  }
  .footer__links button:hover,
  .footer__links a:hover { opacity: 0.6; }

  /* Meta: legal + payments */
  .footer__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-lg);
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-top: 1px solid var(--f-rule);
    flex-wrap: wrap;
  }
  .footer__legal {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--f-soft);
  }
  .footer__legal button {
    font: inherit;
    letter-spacing: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .footer__legal button:hover { color: var(--f-ink); }
  .footer__sep { color: var(--f-rule); }
  .footer__pay :global(.pmi) { gap: 6px; }
  .footer__pay :global(.pmi__card svg) { height: 22px; }

  /* Bottom bar */
  .footer__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-xl);
    flex-wrap: wrap;
  }
  .footer__bar-text {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--f-soft);
  }

  @media (max-width: 767px) {
    .footer__body {
      grid-template-columns: 1fr 1fr;
      gap: var(--evx-space-xl);
    }
    .footer__identity { grid-column: 1 / -1; padding-right: 0; }
    .footer__meta, .footer__bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }
  }
</style>
