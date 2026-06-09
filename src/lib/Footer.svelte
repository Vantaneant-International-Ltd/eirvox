<script lang="ts">
  import { navigate } from './router';
  import { siteFlags } from './flags';
  import PaymentIcons from './PaymentIcons.svelte';

  // Wheel-specialist scope: hide Sell / TRADE / non-wheel category links.
  // Flip wheel_specialist_mode off in /admin/settings to restore them.
  $: wheelMode = $siteFlags.wheel_specialist_mode;

  let email = '';
  let subscribed = false;
  function subscribe(e: Event) {
    e.preventDefault();
    if (email.trim() && email.includes('@')) subscribed = true;
  }
</script>

<footer class="footer">
  <div class="footer__body page-container" class:footer__body--tight={wheelMode}>
    <!-- Brand column -->
    <div class="footer__col footer__col--brand">
      <button class="footer__wordmark" on:click={() => navigate('/')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="footer__wordmark-img" />
      </button>

      <p class="footer__tagline">
        A curated marketplace for premium goods in Ireland.
        Publisher of DRIVE. Operator of TRADE.
      </p>

      <!-- Newsletter -->
      <div class="footer__news">
        <span class="footer__news-pre">JOIN THE LIST</span>
        {#if subscribed}
          <p class="footer__news-ok">
            <span class="footer__news-ok-label">ON THE LIST</span>
            Thanks. You'll hear from us first.
          </p>
        {:else}
          <form class="footer__news-form" on:submit={subscribe}>
            <label class="sr-only" for="newsletter-email">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              class="footer__news-input"
              placeholder="you@studio.ie"
              bind:value={email}
              required
            />
            <button type="submit" class="footer__news-btn">SUBSCRIBE →</button>
          </form>
        {/if}
      </div>

      <!-- Social -->
      <div class="footer__social">
        <a href="https://www.instagram.com/eirvox_" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on Instagram" class="footer__social-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4.5"/>
            <circle cx="12" cy="12" r="4.2"/>
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/%C3%A9irvox/" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on LinkedIn" class="footer__social-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM8.3 18H5.7V9.7h2.6V18zM7 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18.3 18h-2.6v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18h-2.6V9.7H13v1.1c.4-.6 1-1.3 2.2-1.3 1.6 0 3 1 3 3.3V18z"/>
          </svg>
        </a>
      </div>
    </div>

    {#if wheelMode}
    <!-- WHEELS (tight launch footer) -->
    <div class="footer__col">
      <span class="footer__head">WHEELS</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/wheels')}>Wheels</button></li>
        <li><button on:click={() => navigate('/wheels#how')}>Find your fit</button></li>
        <li><button on:click={() => navigate('/drive')}>DRIVE</button></li>
      </ul>
    </div>
    {:else}
    <!-- BUY -->
    <div class="footer__col">
      <span class="footer__head">BUY</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/automotive')}>Browse</button></li>
        <li><button on:click={() => navigate('/automotive')}>Automotive</button></li>
        <li><button on:click={() => navigate('/watches')}>Watches</button></li>
        <li><button on:click={() => navigate('/drive')}>DRIVE issues</button></li>
      </ul>
    </div>

    <!-- SELL -->
    <div class="footer__col">
      <span class="footer__head">SELL</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/sell/apply')}>Apply</button></li>
        <li><button on:click={() => navigate('/sell')}>Tiers</button></li>
        <li><button on:click={() => navigate('/sell')}>Seller terms</button></li>
        <li><button on:click={() => navigate('/sell')}>Fees</button></li>
      </ul>
    </div>

    <!-- TRADE -->
    <div class="footer__col">
      <span class="footer__head">TRADE</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/trade')}>Find a tradesperson</button></li>
        <li><button on:click={() => navigate('/trade/apply')}>List your trade</button></li>
        <li><button on:click={() => navigate('/trade')}>Categories</button></li>
      </ul>
    </div>
    {/if}

    <!-- HOUSE (About / Trust / Contact / Sitemap.
         Keeping the single Trust link per brief: do not expand into
         guarantee sub-links that imply live authentication/protection. -->
    <div class="footer__col">
      <span class="footer__head">HOUSE</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/about')}>About</button></li>
        <li><button on:click={() => navigate('/trust')}>Trust</button></li>
        <li><a href="mailto:support@eirvox.ie">Contact</a></li>
        <li><button on:click={() => navigate('/sitemap')}>Sitemap</button></li>
      </ul>
    </div>
  </div>

  <!-- Meta row: legal links left, payment marks right in full
       brand colour (Visa blue, Mastercard red/orange, Amex blue,
       Google Pay multi-colour, etc). Drives trust at a glance. -->
  <div class="footer__meta page-container">
    <div class="footer__meta-legal">
      <button on:click={() => navigate('/terms')}>TERMS &amp; CONDITIONS</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/privacy')}>PRIVACY POLICY</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/cookies')}>COOKIE POLICY</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/acceptable-use')}>ACCEPTABLE USE</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/refund-policy')}>REFUND POLICY</button>
    </div>
    <div class="footer__meta-pay">
      <PaymentIcons />
    </div>
  </div>

  <!-- Bottom bar: copyright + locale left (one mono line),
       founder fine-print emails right. Public contact stays
       support@eirvox.ie (in HOUSE column). -->
  <div class="footer__bar page-container">
    <span class="footer__bar-text">
      © 2026 ÉIRVOX SYSTEMS LTD
      <span class="footer__sep">·</span>
      TRADING AS ÉIRVOX
      <span class="footer__sep">·</span>
      A VANTANEANT INTERNATIONAL LTD COMPANY
      <span class="footer__sep">·</span>
      DUBLIN, IRELAND
    </span>
    <span class="footer__bar-text footer__bar-right">
      <a href="mailto:renato@eirvox.ie">RENATO@EIRVOX.IE</a>
      <span class="footer__sep">·</span>
      <a href="mailto:kevin@eirvox.ie">KEVIN@EIRVOX.IE</a>
    </span>
  </div>
</footer>

<style>
  .footer {
    background: var(--evx-graphite);
    color: var(--evx-paper);
    margin-top: auto;
  }

  /* ── Body grid: brand + 4 nav columns ── */
  .footer__body {
    display: grid;
    grid-template-columns: 2.2fr 1fr 1fr 1fr 1fr;
    gap: var(--evx-space-2xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
  }

  /* Wheel-specialist launch: brand + WHEELS + HOUSE only. */
  .footer__body--tight {
    grid-template-columns: 2.2fr 1fr 1fr;
  }

  .footer__col { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .footer__col--brand { padding-right: var(--evx-space-xl); gap: var(--evx-space-lg); }

  /* ── Brand: serif wordmark ── */
  .footer__wordmark {
    display: inline-flex;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  .footer__wordmark-img {
    height: 28px;
    width: auto;
    display: block;
    /* PNG is dark-on-transparent; invert for the dark footer background. */
    filter: invert(1) brightness(1.05);
  }

  .footer__tagline {
    font-size: 13px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
    max-width: 360px;
  }

  /* ── Newsletter (inside brand column) ── */
  .footer__news { display: flex; flex-direction: column; gap: var(--evx-space-sm); margin-top: var(--evx-space-md); }
  .footer__news-pre {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--evx-ink-soft);
    text-transform: uppercase;
  }

  .footer__news-form {
    display: flex;
    gap: 0;
    align-items: stretch;
    max-width: 360px;
  }
  .footer__news-input {
    flex: 1;
    background: transparent;
    border: 1px solid var(--evx-rule-dark);
    border-right: none;
    color: var(--evx-paper);
    font-family: var(--evx-font-display);
    font-size: 13px;
    padding: 10px 14px;
    outline: none;
    min-width: 0;
    transition: border-color 200ms ease;
  }
  .footer__news-input::placeholder { color: var(--evx-ink-soft); }
  .footer__news-input:focus { border-color: var(--evx-paper); }

  .footer__news-btn {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    color: var(--evx-paper);
    background: transparent;
    border: 1px solid var(--evx-rule-dark);
    padding: 0 18px;
    cursor: pointer;
    transition: var(--evx-transition);
    white-space: nowrap;
  }
  .footer__news-btn:hover { border-color: var(--evx-fox-orange); color: var(--evx-fox-orange); }

  .footer__news-ok {
    font-family: var(--evx-font-display);
    font-size: 13px;
    color: var(--evx-ink-soft);
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .footer__news-ok-label {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--evx-fox-orange);
  }

  /* ── Social outlined icon buttons ── */
  .footer__social { display: flex; gap: var(--evx-space-sm); }
  .footer__social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--evx-rule-dark);
    color: var(--evx-paper);
    text-decoration: none;
    transition: var(--evx-transition);
  }
  .footer__social-link:hover {
    border-color: var(--evx-fox-orange);
    color: var(--evx-fox-orange);
    opacity: 1;
  }

  /* ── Column headers (mono caps) ── */
  .footer__head {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--evx-ink-soft);
    text-transform: uppercase;
    margin-bottom: var(--evx-space-sm);
  }

  .footer__links {
    display: flex;
    flex-direction: column;
    gap: 12px;
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
  .footer__links a:hover { opacity: 0.6; }

  /* ── Meta row: legal links + payment marks ── */
  .footer__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-lg);
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-dark);
    flex-wrap: wrap;
  }
  .footer__meta-legal,
  .footer__meta-pay {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--evx-ink-soft);
  }
  .footer__meta-legal button {
    font-family: inherit;
    font-size: inherit;
    letter-spacing: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .footer__meta-legal button:hover { color: var(--evx-paper); }

  /* Payment marks in full colour - zombie-brained buyers respect
     the visa/mastercard/amex brand colours, not subtle greyscale. */
  .footer__meta-pay :global(.pmi) { gap: 6px; }
  .footer__meta-pay :global(.pmi__card svg) {
    height: 22px;
  }

  .footer__sep { color: var(--evx-rule-dark); }

  /* ── Bottom bar ── */
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
    color: var(--evx-ink-soft);
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .footer__bar-text a {
    color: inherit;
    text-decoration: none;
    transition: var(--evx-transition);
  }
  .footer__bar-text a:hover { color: var(--evx-paper); }
  .footer__bar-right { text-align: right; justify-content: flex-end; }

  /* ── Responsive ── */
  @media (max-width: 1199px) {
    .footer__body {
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
      gap: var(--evx-space-xl);
    }
    .footer__col--brand { grid-column: 1 / -1; padding-right: 0; }
    .footer__tagline { max-width: 560px; }
  }

  @media (max-width: 767px) {
    .footer__body { grid-template-columns: 1fr 1fr; }
    .footer__news-form { max-width: none; }
    .footer__meta,
    .footer__bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }
    .footer__bar-right { text-align: left; justify-content: flex-start; }
  }
</style>
