<script lang="ts">
  import { navigate } from './router';
  import PaymentIcons from './PaymentIcons.svelte';

  let email = '';
  let subscribed = false;
  function subscribe(e: Event) {
    e.preventDefault();
    if (email.trim() && email.includes('@')) subscribed = true;
  }
</script>

<footer class="footer">
  <!-- Newsletter strip -->
  <div class="footer__news">
    <div class="footer__news-inner page-container">
      <div class="footer__news-text">
        <span class="evx-caption footer__news-pre">STAY IN THE LOOP</span>
        <h3 class="footer__news-h">New listings, DRIVE releases, and platform updates.</h3>
      </div>
      {#if subscribed}
        <div class="footer__news-ok">
          <span class="evx-label">SUBSCRIBED</span>
          <p>Thanks. You'll hear from us.</p>
        </div>
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
          <button type="submit" class="evx-btn evx-btn--primary evx-btn--sm footer__news-btn">
            Subscribe
          </button>
        </form>
      {/if}
    </div>
  </div>

  <!-- Main link columns: brand + 4 nav columns -->
  <div class="footer__body page-container">
    <div class="footer__col footer__col--brand">
      <button class="footer__wordmark" on:click={() => navigate('/')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="footer__wordmark-img" />
      </button>
      <p class="footer__tagline">
        Ireland's premium marketplace for enthusiast objects. Publisher of DRIVE, operator of TRADE.
      </p>
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

    <div class="footer__col">
      <span class="evx-label footer__head">Buy</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/automotive')}>Browse</button></li>
        <li><button on:click={() => navigate('/automotive')}>Automotive</button></li>
        <li><button on:click={() => navigate('/watches')}>Watches</button></li>
        <li><button on:click={() => navigate('/drive')}>DRIVE</button></li>
      </ul>
    </div>

    <div class="footer__col">
      <span class="evx-label footer__head">Sell</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/sell/apply')}>Apply</button></li>
        <li><button on:click={() => navigate('/sell')}>Tiers</button></li>
        <li><button on:click={() => navigate('/sell')}>Fees</button></li>
        <li><button on:click={() => navigate('/sell')}>Seller terms</button></li>
      </ul>
    </div>

    <div class="footer__col">
      <span class="evx-label footer__head">Trade</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/trade')}>Find a trade</button></li>
        <li><button on:click={() => navigate('/trade/apply')}>List a trade</button></li>
        <li><button on:click={() => navigate('/trade')}>Categories</button></li>
      </ul>
    </div>

    <div class="footer__col">
      <span class="evx-label footer__head">Company</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/about')}>About</button></li>
        <li><button on:click={() => navigate('/trust')}>Trust</button></li>
        <li><a href="mailto:support@eirvox.ie">Contact</a></li>
        <li><button on:click={() => navigate('/sitemap')}>Sitemap</button></li>
      </ul>
    </div>
  </div>

  <!-- Legal links + payments (single row, no labels) -->
  <div class="footer__meta page-container">
    <div class="footer__meta-legal">
      <button on:click={() => navigate('/terms')}>Terms</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/privacy')}>Privacy</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/cookies')}>Cookies</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/acceptable-use')}>Acceptable Use</button>
      <span class="footer__sep">·</span>
      <button on:click={() => navigate('/returns')}>Returns</button>
    </div>
    <div class="footer__meta-pay">
      <PaymentIcons />
    </div>
  </div>

  <!-- Bottom bar: copyright left, direct emails + locale right.
       Public contact is support@eirvox.ie (in the Company column above);
       these are direct lines kept available as fine print. -->
  <div class="footer__bar page-container">
    <span class="evx-caption footer__bar-text">
      © 2026 ÉIRVOX Systems Ltd · A Vantaneant International Ltd company
    </span>
    <span class="evx-caption footer__bar-text footer__bar-right">
      <a href="mailto:renato@eirvox.ie">renato@eirvox.ie</a>
      <span class="footer__sep">·</span>
      <a href="mailto:kevin@eirvox.ie">kevin@eirvox.ie</a>
      <span class="footer__sep">·</span>
      DUBLIN, IRELAND
    </span>
  </div>
</footer>

<style>
  .footer {
    background: var(--evx-graphite);
    color: var(--evx-paper);
    margin-top: auto;
  }

  /* Newsletter strip */
  .footer__news {
    background: rgba(245, 242, 237, 0.04);
    border-bottom: 1px solid var(--evx-rule-dark);
  }

  .footer__news-inner {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--evx-space-2xl);
    align-items: center;
    padding-top: var(--evx-space-xl);
    padding-bottom: var(--evx-space-xl);
  }

  .footer__news-text { display: flex; flex-direction: column; gap: var(--evx-space-xs); min-width: 0; }
  .footer__news-pre { color: var(--evx-fox-orange); }

  .footer__news-h {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-paper);
    line-height: 1.3;
  }

  .footer__news-form {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    flex-shrink: 0;
  }

  .footer__news-input {
    background: transparent;
    border: 1px solid var(--evx-rule-dark);
    color: var(--evx-paper);
    font-family: var(--evx-font-display);
    font-size: 14px;
    padding: 9px 14px;
    outline: none;
    width: 240px;
    transition: border-color 200ms ease;
  }
  .footer__news-input::placeholder { color: var(--evx-ink-soft); }
  .footer__news-input:focus { border-color: var(--evx-paper); }

  .footer__news-btn { white-space: nowrap; }

  .footer__news-ok {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: right;
  }
  .footer__news-ok span { color: var(--evx-fox-orange); }
  .footer__news-ok p { font-size: 14px; color: rgba(245,242,237,0.85); }

  /* Body: brand + 4 nav columns */
  .footer__body {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
    gap: var(--evx-space-2xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
  }

  .footer__col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .footer__col--brand { padding-right: var(--evx-space-xl); }

  .footer__wordmark {
    display: inline-flex;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    margin-bottom: var(--evx-space-sm);
  }
  .footer__wordmark-img {
    height: 24px;
    width: auto;
    display: block;
    filter: invert(1) brightness(1.05);
  }

  .footer__tagline {
    font-size: 13px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 320px;
  }

  .footer__social {
    display: flex;
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-sm);
  }

  .footer__social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px; height: 30px;
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

  .footer__head {
    color: var(--evx-ink-soft);
    display: block;
    margin-bottom: var(--evx-space-sm);
  }

  .footer__links {
    display: flex;
    flex-direction: column;
    gap: 10px;
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

  /* Meta row: legal links left, payments right. One line on desktop. */
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
    gap: 8px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
  .footer__meta-pay :global(.pmi) { gap: 5px; }
  .footer__meta-pay :global(.pmi__card svg) { height: 20px; }

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
    text-transform: uppercase;
  }
  .footer__meta-legal button:hover { color: var(--evx-paper); }

  .footer__sep { color: var(--evx-rule-dark); }

  /* Bottom bar */
  .footer__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-lg);
    flex-wrap: wrap;
  }

  .footer__bar-text {
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

  @media (max-width: 1199px) {
    .footer__body {
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
      gap: var(--evx-space-xl);
    }
    .footer__col--brand { grid-column: 1 / -1; padding-right: 0; }
    .footer__tagline { max-width: 520px; }
  }

  @media (max-width: 767px) {
    .footer__news-inner {
      grid-template-columns: 1fr;
      gap: var(--evx-space-md);
    }
    .footer__news-form {
      width: 100%;
      gap: var(--evx-space-sm);
    }
    .footer__news-input { width: 100%; flex: 1; }
    .footer__body {
      grid-template-columns: 1fr 1fr;
    }
    .footer__meta,
    .footer__bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }
    .footer__bar-right { text-align: left; justify-content: flex-start; }
  }
</style>
