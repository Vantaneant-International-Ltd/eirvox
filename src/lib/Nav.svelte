<script lang="ts">
  let menuOpen = false;
</script>

<header class="nav">
  <div class="nav__inner page-container">
    <div class="nav__left">
      <a href="/#/" class="nav__wordmark">
        <svg class="nav__mark" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10.5" stroke="#E8742C" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="5" fill="#E8742C"/>
        </svg>
        <span>Éirvox</span>
      </a>
    </div>

    <div class="nav__centre">
      <input
        type="search"
        class="nav__search evx-caption"
        placeholder="Search the house…"
        aria-label="Search"
      />
    </div>

    <nav class="nav__right">
      <ul class="nav__links">
        <li><a href="/#/automotive" class="nav__link">Buy</a></li>
        <li><a href="/#/enquire" class="nav__link">Sell</a></li>
        <li><a href="/#/automotive" class="nav__link">Categories</a></li>
        <li><a href="/#/about" class="nav__link">About</a></li>
      </ul>
      <a href="/#/" class="nav__login">Log in</a>
      <button
        class="nav__hamburger"
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
        on:click={() => menuOpen = !menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  </div>

  {#if menuOpen}
    <div class="nav__mobile-menu">
      <ul class="nav__mobile-links">
        <li><a href="/#/automotive" on:click={() => menuOpen = false}>Buy</a></li>
        <li><a href="/#/enquire" on:click={() => menuOpen = false}>Sell</a></li>
        <li><a href="/#/automotive" on:click={() => menuOpen = false}>Categories</a></li>
        <li><a href="/#/about" on:click={() => menuOpen = false}>About</a></li>
        <li><a href="/#/" on:click={() => menuOpen = false}>Log in</a></li>
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
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-md);
  }

  .nav__left {
    flex-shrink: 0;
  }

  .nav__wordmark {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    font-family: 'Inter Tight', sans-serif;
    font-weight: 500;
    font-size: 20px;
    color: var(--evx-warm-black);
    text-decoration: none;
    letter-spacing: -0.01em;
  }

  .nav__mark {
    flex-shrink: 0;
  }

  .nav__centre {
    flex: 1;
    max-width: 480px;
  }

  .nav__search {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xs) 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.02em;
    color: var(--evx-warm-black);
    outline: none;
  }

  .nav__search::placeholder {
    color: var(--evx-ink-soft);
  }

  .nav__search:focus {
    border-bottom-color: var(--evx-warm-black);
  }

  /* Remove default search styling */
  .nav__search::-webkit-search-decoration,
  .nav__search::-webkit-search-cancel-button {
    -webkit-appearance: none;
  }

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
    list-style: none;
  }

  .nav__link {
    font-family: 'Inter Tight', sans-serif;
    font-size: 14px;
    font-weight: 400;
    color: var(--evx-warm-black);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .nav__link:hover {
    opacity: 0.60;
  }

  .nav__login {
    font-family: 'Inter Tight', sans-serif;
    font-size: 16px;
    font-weight: 400;
    color: var(--evx-warm-black);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .nav__login:hover {
    opacity: 0.60;
  }

  .nav__hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    padding: 4px;
    cursor: pointer;
    background: none;
    border: none;
  }

  .nav__hamburger span {
    display: block;
    width: 20px;
    height: 1px;
    background: var(--evx-warm-black);
  }

  .nav__mobile-menu {
    background: var(--evx-paper);
    border-top: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg) var(--evx-space-md);
  }

  .nav__mobile-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
  }

  .nav__mobile-links a {
    font-family: 'Inter Tight', sans-serif;
    font-size: 18px;
    font-weight: 400;
    color: var(--evx-warm-black);
    text-decoration: none;
  }

  @media (max-width: 767px) {
    .nav__links,
    .nav__login {
      display: none;
    }

    .nav__hamburger {
      display: flex;
    }

    .nav__centre {
      display: none;
    }
  }
</style>
