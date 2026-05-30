<script lang="ts">
  import { navigate } from './router';

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

  <!-- Main link columns -->
  <div class="footer__body page-container">
    <!-- Brand -->
    <div class="footer__col footer__col--brand">
      <button class="footer__brand-mark" on:click={() => navigate('/')} aria-label="ÉIRVOX home">
        <img src="/brand/symbol.png" alt="" class="footer__symbol-img" aria-hidden="true" />
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="footer__wordmark-img" />
      </button>
      <p class="footer__tagline">
        Ireland's premium marketplace for enthusiast objects.
        Publisher of DRIVE — limited-run OEM+ pieces.
        Operator of TRADE — verified independent tradespeople.
      </p>
      <!-- Social -->
      <div class="footer__social">
        <a href="https://instagram.com/eirvox.ie" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on Instagram" class="footer__social-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4.5"/>
            <circle cx="12" cy="12" r="4.2"/>
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://linkedin.com/company/eirvox" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on LinkedIn" class="footer__social-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM8.3 18H5.7V9.7h2.6V18zM7 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18.3 18h-2.6v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18h-2.6V9.7H13v1.1c.4-.6 1-1.3 2.2-1.3 1.6 0 3 1 3 3.3V18z"/>
          </svg>
        </a>
        <a href="https://x.com/eirvox" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on X" class="footer__social-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.2 3H21l-7 8 8.2 10h-6.8l-5.3-6.5L4.9 21H2l7.5-8.5L1.8 3h6.9l4.8 6L18.2 3zm-1 16h1.7L6.9 4.9H5l12.2 14.1z"/>
          </svg>
        </a>
        <a href="https://tiktok.com/@eirvox" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on TikTok" class="footer__social-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16 3v1.6a4.4 4.4 0 003.6 4.3v2.8a7.2 7.2 0 01-3.6-1V15.5a5.5 5.5 0 11-5.5-5.5c.3 0 .5 0 .8.05v2.85a2.7 2.7 0 102.7 2.7V3H16z"/>
          </svg>
        </a>
      </div>
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

    <!-- Trade -->
    <div class="footer__col">
      <span class="evx-label footer__head">Trade</span>
      <ul class="footer__links">
        <li><button on:click={() => navigate('/trade')}>Find a tradesperson</button></li>
        <li><button on:click={() => navigate('/trade/apply')}>List your trade</button></li>
        <li><button on:click={() => navigate('/trade')}>Categories</button></li>
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
        <li><button on:click={() => navigate('/sitemap')}>Sitemap</button></li>
      </ul>
    </div>
  </div>

  <!-- Legal links row -->
  <div class="footer__legal-row page-container">
    <span class="evx-caption footer__legal-label">LEGAL</span>
    <div class="footer__legal-links">
      <button on:click={() => navigate('/terms')}>Terms &amp; Conditions</button>
      <span class="footer__legal-sep">·</span>
      <button on:click={() => navigate('/privacy')}>Privacy Policy</button>
      <span class="footer__legal-sep">·</span>
      <button on:click={() => navigate('/cookies')}>Cookie Policy</button>
      <span class="footer__legal-sep">·</span>
      <button on:click={() => navigate('/acceptable-use')}>Acceptable Use</button>
      <span class="footer__legal-sep">·</span>
      <button on:click={() => navigate('/returns')}>Returns &amp; Refunds</button>
    </div>
  </div>

  <!-- Copyright + parent company -->
  <div class="footer__bar page-container">
    <div class="footer__bar-left">
      <span class="evx-caption footer__legal">
        © 2026 ÉIRVOX Systems Ltd. Trading as ÉIRVOX.
        A Vantaneant International Ltd company. All rights reserved.
      </span>
      <span class="evx-caption footer__family">
        Part of the VNTA family ·
        <a href="https://vnta.xyz" target="_blank" rel="noopener noreferrer">vnta.xyz</a> ·
        <a href="https://vendr.ie" target="_blank" rel="noopener noreferrer">vendr.ie</a>
      </span>
    </div>
    <div class="footer__bar-right">
      <span class="evx-caption footer__legal">
        DUBLIN, IRELAND
      </span>
    </div>
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

  /* Body */
  .footer__body {
    display: grid;
    grid-template-columns: 1.6fr repeat(5, 1fr);
    gap: var(--evx-space-2xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-dark);
  }

  .footer__col {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .footer__brand-mark {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    margin-bottom: var(--evx-space-sm);
  }
  .footer__symbol-img {
    height: 28px;
    width: 28px;
    display: block;
    /* PNG is dark-on-transparent; invert for the dark footer background. */
    filter: invert(1) brightness(1.05);
  }
  .footer__wordmark-img {
    height: 26px;
    width: auto;
    display: block;
    filter: invert(1) brightness(1.05);
  }

  .footer__tagline {
    font-size: 13px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 280px;
  }

  /* Social row */
  .footer__social {
    display: flex;
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-md);
  }

  .footer__social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
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

  /* Legal links row */
  .footer__legal-row {
    display: flex;
    align-items: center;
    gap: var(--evx-space-lg);
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-md);
    flex-wrap: wrap;
  }
  .footer__legal-label { color: var(--evx-ink-soft); flex-shrink: 0; }
  .footer__legal-links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--evx-space-sm);
    align-items: center;
  }
  .footer__legal-links button {
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
  .footer__legal-links button:hover { color: var(--evx-paper); }
  .footer__legal-sep { color: var(--evx-rule-dark); }

  /* Bottom bar */
  .footer__bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-dark);
    flex-wrap: wrap;
  }

  .footer__legal { color: var(--evx-ink-soft); line-height: 1.6; }

  .footer__bar-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .footer__family {
    color: var(--evx-ink-soft);
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
  }
  .footer__family a {
    color: var(--evx-paper);
    text-decoration: none;
    transition: var(--evx-transition);
  }
  .footer__family a:hover { color: var(--evx-fox-orange); }

  @media (max-width: 1199px) {
    .footer__body {
      grid-template-columns: 1.5fr 1fr 1fr 1fr;
      gap: var(--evx-space-xl);
    }
    .footer__col--brand { grid-column: 1 / -1; }
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
    .footer__bar {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--evx-space-sm);
    }
  }
</style>
