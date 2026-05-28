<script lang="ts">
  import { currentPath, navigate, isActive } from './router';

  let menuOpen = false;

  const categories = [
    { label: 'Automotive', path: '/automotive' },
    { label: 'Watches', path: '/watches' },
    { label: 'Fashion', path: '/fashion' },
    { label: 'Tech', path: '/tech' },
  ];

  function handleNav(path: string) {
    navigate(path);
    menuOpen = false;
  }
</script>

<header class="nav">
  <div class="nav__inner page-container">
    <!-- Wordmark -->
    <div class="nav__left">
      <button class="nav__wordmark" on:click={() => handleNav('/')}>
        <span class="nav__e">É</span><span class="nav__rest">irvox</span>
      </button>
    </div>

    <!-- Search -->
    <div class="nav__centre">
      <div class="nav__search-wrap">
        <svg class="nav__search-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.2"/>
          <line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <input
          type="search"
          class="nav__search evx-caption"
          placeholder="Search listings — make, model, category…"
          aria-label="Search listings"
        />
      </div>
    </div>

    <!-- Nav links + actions -->
    <nav class="nav__right" aria-label="Main navigation">
      <ul class="nav__links">
        {#each categories as cat}
          <li>
            <button
              class="nav__link"
              class:nav__link--active={isActive(cat.path, $currentPath)}
              on:click={() => handleNav(cat.path)}
            >
              {cat.label}
            </button>
          </li>
        {/each}
      </ul>

      <button class="evx-btn evx-btn--primary evx-btn--sm nav__sell" on:click={() => handleNav('/sell')}>
        Sell
      </button>

      <button class="nav__login" on:click={() => handleNav('/login')}>Log in</button>

      <!-- Mobile hamburger -->
      <button
        class="nav__hamburger"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        on:click={() => menuOpen = !menuOpen}
      >
        <span class="nav__bar" class:nav__bar--open={menuOpen}></span>
        <span class="nav__bar" class:nav__bar--open={menuOpen}></span>
      </button>
    </nav>
  </div>

  <!-- Mobile drawer -->
  {#if menuOpen}
    <div class="nav__drawer" role="navigation" aria-label="Mobile navigation">
      <ul class="nav__drawer-links">
        {#each categories as cat}
          <li>
            <button class="nav__drawer-link" on:click={() => handleNav(cat.path)}>
              {cat.label}
            </button>
          </li>
        {/each}
        <li><button class="nav__drawer-link" on:click={() => handleNav('/drive')}>DRIVE</button></li>
        <li><button class="nav__drawer-link nav__drawer-link--sell" on:click={() => handleNav('/sell')}>Sell on Éirvox</button></li>
        <li><button class="nav__drawer-link" on:click={() => handleNav('/login')}>Log in</button></li>
      </ul>
    </div>
  {/if}
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--evx-paper);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .nav__inner {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    height: 60px;
  }

  .nav__left { flex-shrink: 0; }

  .nav__wordmark {
    display: flex;
    align-items: baseline;
    gap: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    line-height: 1;
  }

  .nav__e {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 22px;
    font-weight: 400;
    color: var(--evx-warm-black);
    letter-spacing: -0.01em;
  }

  .nav__rest {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    color: var(--evx-warm-black);
    letter-spacing: -0.015em;
  }

  .nav__centre {
    flex: 1;
    max-width: 400px;
  }

  .nav__search-wrap {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    border-bottom: 1px solid var(--evx-rule-light);
    padding-bottom: 6px;
  }

  .nav__search-icon { color: var(--evx-ink-soft); flex-shrink: 0; }

  .nav__search {
    flex: 1;
    background: transparent;
    border: none;
    padding: 0;
    color: var(--evx-warm-black);
    outline: none;
  }

  .nav__search::placeholder { color: var(--evx-ink-soft); }
  .nav__search::-webkit-search-decoration,
  .nav__search::-webkit-search-cancel-button { -webkit-appearance: none; }

  .nav__right {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    flex-shrink: 0;
    margin-left: auto;
  }

  .nav__links {
    display: flex;
    gap: var(--evx-space-xl);
  }

  .nav__link {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 400;
    color: var(--evx-warm-black);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
    position: relative;
  }

  .nav__link::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--evx-fox-orange);
    transform: scaleX(0);
    transition: transform 200ms ease;
  }

  .nav__link--active::after { transform: scaleX(1); }
  .nav__link:hover { opacity: 0.60; }

  .nav__sell { }

  .nav__login {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 400;
    color: var(--evx-warm-black);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .nav__login:hover { opacity: 0.60; }

  .nav__hamburger {
    display: none;
    flex-direction: column;
    gap: 6px;
    padding: 4px;
    cursor: pointer;
    background: none;
    border: none;
  }

  .nav__bar {
    display: block;
    width: 20px;
    height: 1px;
    background: var(--evx-warm-black);
    transition: all 200ms ease;
    transform-origin: center;
  }

  .nav__drawer {
    background: var(--evx-paper);
    border-top: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl) var(--evx-page-margin);
  }

  .nav__drawer-links {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  .nav__drawer-link {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 400;
    color: var(--evx-warm-black);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
  }

  .nav__drawer-link:hover { opacity: 0.60; }

  .nav__drawer-link--sell {
    color: var(--evx-fox-orange);
  }

  @media (max-width: 1023px) {
    .nav__centre { max-width: 280px; }
  }

  @media (max-width: 767px) {
    .nav__links,
    .nav__login,
    .nav__sell,
    .nav__centre { display: none; }

    .nav__hamburger { display: flex; }
  }
</style>
