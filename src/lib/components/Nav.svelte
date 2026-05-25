<script lang="ts">
  export let breadcrumb: string[] = []
</script>

<header class="nav">
  <div class="nav-inner page-container">
    <div class="nav-left">
      <a href="/#/" class="wordmark">Éirvox</a>
      <nav class="nav-links">
        <a href="/#/automotive" class="nav-link">Buy</a>
        <a href="/#/sell" class="nav-link">Sell</a>
        <a href="/#/about" class="nav-link">About</a>
      </nav>
    </div>
    <div class="nav-center">
      <input
        class="nav-search"
        type="search"
        placeholder="Search the house…"
        aria-label="Search"
        tabindex="-1"
      />
    </div>
    <div class="nav-right">
      <a href="/#/login" class="login-link">Log in</a>
    </div>
    <button class="hamburger" aria-label="Menu" type="button">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
  {#if breadcrumb.length > 0}
    <div class="breadcrumb-bar">
      <div class="breadcrumb-inner page-container">
        {#each breadcrumb as crumb, i}
          <span class="crumb">{crumb}</span>{#if i < breadcrumb.length - 1}<span class="sep">&nbsp;/&nbsp;</span>{/if}
        {/each}
      </div>
    </div>
  {/if}
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: var(--evx-paper);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    height: 64px;
    gap: var(--evx-space-xl);
  }

  /* LEFT ── wordmark + links */

  .nav-left {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    flex-shrink: 0;
  }

  .wordmark {
    font-family: var(--evx-font-sans);
    font-weight: 500;
    font-size: 20px;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    white-space: nowrap;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
  }

  .nav-link {
    font-family: var(--evx-font-sans);
    font-weight: 400;
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
    transition: var(--evx-transition);
    white-space: nowrap;
  }

  .nav-link:hover {
    opacity: 0.6;
  }

  /* CENTRE ── decorative search */

  .nav-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .nav-search {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xs) 0;
    font-family: var(--evx-font-mono);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-warm-black);
    width: 220px;
    max-width: 100%;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .nav-search::placeholder {
    color: var(--evx-ink-soft);
  }

  .nav-search::-webkit-search-cancel-button,
  .nav-search::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }

  /* RIGHT ── log in */

  .nav-right {
    flex-shrink: 0;
  }

  .login-link {
    font-family: var(--evx-font-sans);
    font-weight: 500;
    font-size: var(--evx-type-body-size);
    color: var(--evx-warm-black);
    transition: var(--evx-transition);
    white-space: nowrap;
  }

  .login-link:hover {
    opacity: 0.6;
  }

  /* HAMBURGER */

  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    margin-left: auto;
    flex-shrink: 0;
  }

  .hamburger span {
    display: block;
    width: 22px;
    height: 1px;
    background-color: var(--evx-warm-black);
  }

  /* BREADCRUMB */

  .breadcrumb-bar {
    border-top: 1px solid var(--evx-rule-light);
  }

  .breadcrumb-inner {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    padding-top: var(--evx-space-sm);
    padding-bottom: var(--evx-space-sm);
  }

  .crumb,
  .sep {
    font-family: var(--evx-font-mono);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
  }

  /* MOBILE */

  @media (max-width: 767px) {
    .nav-links,
    .nav-center,
    .nav-right {
      display: none;
    }

    .hamburger {
      display: flex;
    }
  }
</style>
