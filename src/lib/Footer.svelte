<script lang="ts">
  // ============================================================
  // Footer, ÉIRVOX imprint. One light surface.
  //
  // Zones: 1 identity + registry · 2 nav columns · 3 legal + payment
  // marks · 4 ghosted wordmark.
  //
  // No newsletter here (the marketplace waitlist lives on /marketplace),
  // no social, no personal emails, no VAT line until verified. The
  // registered office is withheld, private address, and the open
  // [FACT NEEDED] token for it is tracked in HANDOFF.md.
  //
  // `dark` is accepted and ignored; dormant surfaces still pass it.
  // ============================================================
  import { navigate } from './router';
  import PaymentIcons from './PaymentIcons.svelte';

  export let dark = false;
  dark; // intentionally unused, one light chrome now

  function go(path: string) {
    const hashIdx = path.indexOf('#');
    if (hashIdx > 0) {
      const route = path.slice(0, hashIdx);
      const anchor = path.slice(hashIdx + 1);
      navigate(route);
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
      return;
    }
    navigate(path);
  }
</script>

<footer class="ft">
  <div class="ft__body page-container">

    <!-- Zone 1 · identity + registry -->
    <div class="ft__identity">
      <button class="ft__wordmark" on:click={() => go('/')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="ft__logo" />
      </button>

      <p class="ft__origin">
        Designed in Ireland. <span class="ft__origin-em">Finished in Dublin.</span>
      </p>

      <div class="ft__registry">
        <span>EIRVOX LIMITED</span>
        <span class="ft__registry-dim">A VANTANÉANT INTERNATIONAL LTD COMPANY</span>
        <span>REGISTERED IN IRELAND · <a class="ft__verify" href="https://core.cro.ie" target="_blank" rel="noopener noreferrer">CRO 806648</a> · DUBLIN, IRELAND</span>
        <span>SUPPORT@EIRVOX.IE</span>
        <!-- Legal name EIRVOX LIMITED (no accent); brand wordmark keeps
             the acute. No VAT line until verified. -->
      </div>
    </div>

    <!-- Zone 2 · nav -->
    <div class="ft__col">
      <span class="ft__head">SHOP</span>
      <ul class="ft__links">
        <li><button on:click={() => go('/wheels')}>All wheels</button></li>
        <li><button on:click={() => go('/wheels#drive')}>DRIVE</button></li>
        <li><button on:click={() => go('/wheels#fitment')}>Find your fit</button></li>
      </ul>
    </div>

    <div class="ft__col">
      <span class="ft__head">HOUSE</span>
      <ul class="ft__links">
        <li><button on:click={() => go('/about')}>About</button></li>
        <li><button on:click={() => go('/trust')}>How buying works</button></li>
        <li><button on:click={() => go('/marketplace')}>Marketplace <span class="ft__soon">Soon</span></button></li>
        <li><a href="mailto:support@eirvox.ie">Contact</a></li>
      </ul>
    </div>
  </div>

  <!-- Zone 3 · legal + payments -->
  <div class="ft__meta page-container">
    <div class="ft__legal">
      <button on:click={() => go('/terms')}>TERMS</button>
      <span class="ft__sep">·</span>
      <button on:click={() => go('/privacy')}>PRIVACY</button>
      <span class="ft__sep">·</span>
      <button on:click={() => go('/cookies')}>COOKIES</button>
      <span class="ft__sep">·</span>
      <button on:click={() => go('/acceptable-use')}>ACCEPTABLE USE</button>
      <span class="ft__sep">·</span>
      <button on:click={() => go('/refund-policy')}>REFUND POLICY</button>
    </div>
    <div class="ft__pay"><PaymentIcons /></div>
  </div>

  <div class="ft__bar page-container">
    <span class="ft__bar-text">© 2026 EIRVOX LIMITED</span>
    <span class="ft__bar-text">DUBLIN, IRELAND</span>
  </div>

  <!-- Zone 4 · ghosted wordmark -->
  <div class="ft__ghost" aria-hidden="true">ÉIRVOX</div>
</footer>

<style>
  .ft {
    background: var(--evx-paper);
    border-top: 1px solid var(--evx-rule-light);
    margin-top: auto;
    overflow: hidden;
  }

  .ft__body {
    display: grid;
    grid-template-columns: 2.4fr 1fr 1fr;
    gap: var(--evx-space-2xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .ft__identity {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding-right: var(--evx-space-xl);
  }
  .ft__wordmark {
    display: inline-flex;
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
  }
  .ft__logo { height: 22px; width: auto; }

  .ft__origin {
    font-size: 14px;
    color: var(--evx-ink);
    margin-top: var(--evx-space-xs);
  }
  .ft__origin-em {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    color: var(--evx-ink-soft);
  }

  .ft__registry {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: var(--evx-space-sm);
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.04em;
    line-height: 1.5;
    color: var(--evx-ink-soft);
  }
  .ft__registry-dim { opacity: 0.72; }
  .ft__verify {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: var(--evx-transition);
  }
  .ft__verify:hover { color: var(--evx-ink); }

  .ft__col { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .ft__head {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-xs);
  }
  .ft__links { display: flex; flex-direction: column; }
  .ft__links button,
  .ft__links a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 44px;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-ink);
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    transition: var(--evx-transition);
  }
  .ft__links button:hover,
  .ft__links a:hover { opacity: 0.55; }
  .ft__soon {
    font-family: var(--evx-font-mono);
    font-size: 8.5px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
    border: 1px solid var(--evx-rule-light);
    padding: 2px 4px;
    line-height: 1;
  }

  .ft__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-lg);
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-light);
    flex-wrap: wrap;
  }
  .ft__legal {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--evx-ink-soft);
  }
  .ft__legal button {
    font: inherit;
    letter-spacing: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 14px 0;
    transition: var(--evx-transition);
  }
  .ft__legal button:hover { color: var(--evx-ink); }
  .ft__sep { color: var(--evx-rule-light); }
  .ft__pay :global(.pmi) { gap: 6px; }
  .ft__pay :global(.pmi__card svg) { height: 22px; }

  .ft__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-lg);
    flex-wrap: wrap;
  }
  .ft__bar-text {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--evx-ink-soft);
  }

  /* Ghosted wordmark, the sign over the door. Shown whole: the crop
     that used to sit here cut the letterforms in half. */
  .ft__ghost {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(56px, 16vw, 210px);
    line-height: 1.06;
    letter-spacing: -0.03em;
    text-align: center;
    color: var(--evx-ink);
    opacity: 0.055;
    user-select: none;
    padding: var(--evx-space-lg) 0 var(--evx-space-xl);
  }

  @media (max-width: 767px) {
    .ft__body { grid-template-columns: 1fr 1fr; gap: var(--evx-space-lg); padding-top: var(--evx-space-2xl); }
    .ft__legal { gap: 4px 14px; }
    .ft__identity { grid-column: 1 / -1; padding-right: 0; }
    .ft__meta, .ft__bar { flex-direction: column; align-items: flex-start; gap: var(--evx-space-sm); }
  }
</style>
