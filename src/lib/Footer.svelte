<script lang="ts">
  import { navigate } from './router';
</script>

<footer class="footer">
  <div class="footer__body page-container">
    <!-- Brand -->
    <div class="footer__col footer__col--brand">
      <button class="footer__wordmark" on:click={() => navigate('/')}>
        <span class="footer__e">É</span><span class="footer__rest">irvox</span>
      </button>
      <p class="footer__tagline">
        A premium marketplace for enthusiast objects across Ireland and Northern Ireland.
        Publisher of DRIVE — limited-run OEM+ pieces.
      </p>
    </div>

    <!-- Buy -->
    <div class="footer__col">
      <span class="evx-label footer__head">Buy</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/automotive')}>Browse</button></li>
        <li><button on:click={() => navigate('/automotive')}>Automotive</button></li>
        <li><button on:click={() => navigate('/watches')}>Watches</button></li>
        <li><button on:click={() => navigate('/drive')}>DRIVE issues</button></li>
      </ul>
    </div>

    <!-- Sell -->
    <div class="footer__col">
      <span class="evx-label footer__head">Sell</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/sell/apply')}>Apply</button></li>
        <li><button on:click={() => navigate('/sell')}>Tiers</button></li>
        <li><button on:click={() => navigate('/sell')}>Seller terms</button></li>
        <li><button on:click={() => navigate('/sell')}>Fees</button></li>
      </ul>
    </div>

    <!-- Trust -->
    <div class="footer__col">
      <span class="evx-label footer__head">Trust</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/trust')}>Deposits</button></li>
        <li><button on:click={() => navigate('/trust')}>Authentication</button></li>
        <li><button on:click={() => navigate('/trust')}>Buyer protection</button></li>
        <li><button on:click={() => navigate('/trust')}>Disputes</button></li>
      </ul>
    </div>

    <!-- House -->
    <div class="footer__col">
      <span class="evx-label footer__head">House</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/about')}>About</button></li>
        <li><button on:click={() => navigate('/drive')}>DRIVE</button></li>
        <li><button on:click={() => navigate('/about')}>Press</button></li>
        <li><a href="mailto:renato@eirvox.ie">Contact</a></li>
      </ul>
    </div>
  </div>

  <!-- Legal bar -->
  <div class="footer__bar page-container">
    <span class="evx-caption footer__legal">
      ÉIRVOX SYSTEMS LTD · DUBLIN · CRO 712304
    </span>
    <span class="evx-caption footer__legal footer__legal--right">
      VAT IE 3987654 N ·
      <button on:click={() => navigate('/trust')}>TERMS</button> ·
      <button on:click={() => navigate('/trust')}>PRIVACY</button> ·
      <button on:click={() => navigate('/trust')}>COOKIES</button>
    </span>
  </div>
</footer>

<style>
  .footer {
    background: var(--evx-graphite);
    color: var(--evx-paper);
    margin-top: auto;
  }

  .footer__body {
    display: grid;
    grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
    gap: var(--evx-space-3xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-dark);
  }

  .footer__col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .footer__wordmark {
    display: flex;
    align-items: baseline;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    margin-bottom: var(--evx-space-sm);
  }

  .footer__e {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 22px;
    font-weight: 400;
    color: var(--evx-paper);
  }

  .footer__rest {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    color: var(--evx-paper);
    letter-spacing: -0.015em;
  }

  .footer__tagline {
    font-size: 13px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 240px;
  }

  .footer__head {
    color: var(--evx-ink-soft);
    display: block;
    margin-bottom: var(--evx-space-sm);
  }

  .footer__links {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .footer__links button,
  .footer__links a {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 400;
    color: var(--evx-paper);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
    text-decoration: none;
  }

  .footer__links button:hover,
  .footer__links a:hover { opacity: 0.60; }

  .footer__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
  }

  .footer__legal {
    color: var(--evx-ink-soft);
  }

  .footer__legal button {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .footer__legal button:hover { color: var(--evx-paper); }

  @media (max-width: 1199px) {
    .footer__body {
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--evx-space-2xl);
    }

    .footer__col--brand {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 767px) {
    .footer__body {
      grid-template-columns: 1fr 1fr;
    }

    .footer__bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }
  }
</style>
