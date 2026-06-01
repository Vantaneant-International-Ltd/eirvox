<script lang="ts">
  import { currentPath, navigate, isActive } from './router';
  import { auth, signOut } from './auth';

  let menuOpen = false;
  let userMenuOpen = false;
  let userMenuEl: HTMLDivElement;
  let navSearch = '';

  // Derived auth state
  $: profile = $auth.profile;
  $: user = $auth.user;
  $: signedIn = !!user;
  $: role = profile?.role;
  $: showAdminLink = role === 'admin';
  $: showSellerLink = role === 'seller' || role === 'admin';

  $: initials = (() => {
    if (!user) return '';
    const name = profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? '';
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return trimmed.slice(0, 2).toUpperCase();
  })();

  function handleClickOutside(e: MouseEvent) {
    if (userMenuOpen && userMenuEl && !userMenuEl.contains(e.target as Node)) {
      userMenuOpen = false;
    }
  }

  async function handleLogout() {
    userMenuOpen = false;
    menuOpen = false;
    await signOut();
    navigate('/');
  }

  const categories = [
    { label: 'Cars', path: '/cars' },
    { label: 'Automotive', path: '/automotive' },
    { label: 'Watches', path: '/watches' },
    { label: 'Fashion', path: '/fashion' },
    { label: 'Tech', path: '/tech' },
  ];

  const directories = [
    { label: 'DRIVE', path: '/drive' },
    { label: 'TRADE', path: '/trade' },
  ];

  const sellerSections = [
    { label: 'Apply', path: '/sell/apply' },
    { label: 'Create', path: '/sell/create' },
    { label: 'Dashboard', path: '/sell/dashboard' },
  ];

  $: isSellerRoute = $currentPath.startsWith('/sell');

  function handleNav(path: string) {
    navigate(path);
    menuOpen = false;
    userMenuOpen = false;
  }
</script>

<svelte:window on:click={handleClickOutside} />

<header class="nav">
  <div class="nav__inner page-container">
    <!-- Wordmark -->
    <div class="nav__left">
      <button class="nav__wordmark" on:click={() => handleNav('/')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="nav__wordmark-img" />
      </button>
    </div>

    <!-- Search -->
    <div class="nav__centre">
      <form class="nav__search-wrap" on:submit|preventDefault={() => {
        const q = navSearch.trim();
        if (q) handleNav(`/search?q=${encodeURIComponent(q)}`);
      }}>
        <svg class="nav__search-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.2"/>
          <line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        <input
          type="search"
          class="nav__search evx-caption"
          placeholder="Search listings — make, model, category…"
          aria-label="Search listings"
          bind:value={navSearch}
        />
      </form>
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
        <li class="nav__sep" aria-hidden="true"></li>
        {#each directories as d}
          <li>
            <button
              class="nav__link nav__link--directory"
              class:nav__link--active={isActive(d.path, $currentPath)}
              on:click={() => handleNav(d.path)}
            >
              {d.label}
            </button>
          </li>
        {/each}
      </ul>

      <button class="evx-btn evx-btn--primary evx-btn--sm nav__sell" on:click={() => handleNav('/sell')}>
        Sell
      </button>

      {#if signedIn}
        <div class="nav__user" bind:this={userMenuEl}>
          <button
            class="nav__avatar"
            on:click={() => userMenuOpen = !userMenuOpen}
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            aria-label="Account menu"
          >
            <span class="nav__avatar-initials">{initials}</span>
            {#if role === 'admin'}<span class="nav__avatar-dot" aria-hidden="true"></span>{/if}
          </button>

          {#if userMenuOpen}
            <div class="nav__user-menu" role="menu">
              <div class="nav__user-head">
                <span class="evx-caption nav__user-role">
                  {#if role === 'admin'}ADMIN{:else if role === 'seller'}SELLER{:else}BUYER{/if}
                </span>
                <span class="nav__user-email">{user?.email ?? ''}</span>
              </div>
              <button class="nav__user-item" on:click={() => handleNav('/account')} role="menuitem">Account</button>
              <button class="nav__user-item" on:click={() => handleNav('/messages')} role="menuitem">Inbox</button>
              {#if showSellerLink}
                <button class="nav__user-item" on:click={() => handleNav('/sell/dashboard')} role="menuitem">My listings</button>
              {/if}
              {#if showAdminLink}
                <button class="nav__user-item nav__user-item--accent" on:click={() => handleNav('/admin')} role="menuitem">Admin</button>
              {/if}
              <div class="nav__user-divider" aria-hidden="true"></div>
              <button class="nav__user-item" on:click={handleLogout} role="menuitem">Log out</button>
            </div>
          {/if}
        </div>
      {:else}
        <button class="nav__login" on:click={() => handleNav('/login')}>Log in</button>
      {/if}

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

  <!-- Seller sub-bar (only on /sell/* routes) -->
  {#if isSellerRoute}
    <div class="nav__seller-bar">
      <div class="nav__seller-bar-inner page-container">
        <span class="evx-caption nav__seller-label">SELLER</span>
        <span class="nav__seller-sep">·</span>
        <button
          class="nav__seller-link"
          class:nav__seller-link--active={$currentPath === '/sell'}
          on:click={() => handleNav('/sell')}
        >Tiers</button>
        {#each sellerSections as item}
          <button
            class="nav__seller-link"
            class:nav__seller-link--active={$currentPath === item.path}
            on:click={() => handleNav(item.path)}
          >{item.label}</button>
        {/each}
        <span class="nav__seller-cohort evx-caption">COHORT 03 · CLOSES 14 JUN</span>
      </div>
    </div>
  {/if}

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
        <li><button class="nav__drawer-link" on:click={() => handleNav('/trade')}>TRADE</button></li>
        <li><button class="nav__drawer-link nav__drawer-link--sell" on:click={() => handleNav('/sell')}>Sell on Éirvox</button></li>

        {#if signedIn}
          <li class="nav__drawer-divider" aria-hidden="true"></li>
          <li class="nav__drawer-user">
            <span class="evx-caption nav__drawer-role">
              {#if role === 'admin'}ADMIN{:else if role === 'seller'}SELLER{:else}BUYER{/if}
            </span>
            <span class="nav__drawer-email">{user?.email ?? ''}</span>
          </li>
          <li><button class="nav__drawer-link" on:click={() => handleNav('/account')}>Account</button></li>
          <li><button class="nav__drawer-link" on:click={() => handleNav('/messages')}>Inbox</button></li>
          {#if showSellerLink}
            <li><button class="nav__drawer-link" on:click={() => handleNav('/sell/dashboard')}>My listings</button></li>
          {/if}
          {#if showAdminLink}
            <li><button class="nav__drawer-link nav__drawer-link--sell" on:click={() => handleNav('/admin')}>Admin</button></li>
          {/if}
          <li><button class="nav__drawer-link" on:click={handleLogout}>Log out</button></li>
        {:else}
          <li class="nav__drawer-divider" aria-hidden="true"></li>
          <li><button class="nav__drawer-link" on:click={() => handleNav('/login')}>Log in</button></li>
        {/if}
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
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    line-height: 1;
  }

  .nav__wordmark-img {
    height: 26px;
    width: auto;
    display: block;
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

  .nav__link--directory {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
  }

  .nav__sep {
    width: 1px;
    height: 14px;
    background: var(--evx-rule-light);
    margin: 0 -8px;
    align-self: center;
  }

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

  .nav__messages {
    position: relative;
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--evx-warm-black);
    display: flex;
    align-items: center;
    transition: var(--evx-transition);
  }

  .nav__messages:hover { opacity: 0.60; }

  .nav__messages-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 14px; height: 14px;
    padding: 0 4px;
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    font-family: var(--evx-font-mono);
    font-size: 9px;
    font-weight: 500;
    border-radius: 7px;
    line-height: 1;
  }

  /* ── User avatar + dropdown ── */
  .nav__user { position: relative; }

  .nav__avatar {
    width: 30px; height: 30px;
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border: none;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
    border-radius: 50%;
    transition: var(--evx-transition);
    position: relative;
  }
  .nav__avatar:hover { opacity: 0.82; }

  .nav__avatar-initials { line-height: 1; }

  .nav__avatar-dot {
    position: absolute;
    top: -2px; right: -2px;
    width: 8px; height: 8px;
    background: var(--evx-fox-orange);
    border-radius: 50%;
    border: 1.5px solid var(--evx-paper);
  }

  .nav__user-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
    z-index: 200;
    padding: var(--evx-space-xs);
    display: flex;
    flex-direction: column;
  }

  .nav__user-head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--evx-space-sm) var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xs);
  }
  .nav__user-role { color: var(--evx-fox-orange); }
  .nav__user-email {
    font-family: var(--evx-font-display);
    font-size: 13px;
    color: var(--evx-warm-black);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav__user-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--evx-space-sm) var(--evx-space-md);
    background: none;
    border: none;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    cursor: pointer;
    text-align: left;
    transition: background 200ms ease;
  }
  .nav__user-item:hover { background: rgba(0,0,0,0.04); }
  .nav__user-item--accent { color: var(--evx-fox-orange); }

  .nav__user-badge {
    display: inline-flex;
    align-items: center; justify-content: center;
    min-width: 18px; height: 18px;
    padding: 0 5px;
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    border-radius: 9px;
    line-height: 1;
  }

  .nav__user-divider {
    height: 1px;
    background: var(--evx-rule-light);
    margin: var(--evx-space-xs) 0;
  }

  /* Mobile drawer user-block additions */
  .nav__drawer-divider {
    height: 1px;
    background: var(--evx-rule-light);
    margin: var(--evx-space-sm) 0;
  }

  .nav__drawer-user {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: var(--evx-space-sm);
  }

  .nav__drawer-role { color: var(--evx-fox-orange); }
  .nav__drawer-email {
    font-family: var(--evx-font-display);
    font-size: 13px;
    color: var(--evx-ink-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

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

  .nav__drawer-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px; height: 18px;
    padding: 0 6px;
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    border-radius: 9px;
    margin-left: 8px;
    line-height: 1;
  }

  /* Seller sub-bar */
  .nav__seller-bar {
    background: rgba(232, 116, 44, 0.04);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .nav__seller-bar-inner {
    display: flex;
    align-items: center;
    gap: var(--evx-space-lg);
    height: 36px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nav__seller-bar-inner::-webkit-scrollbar { display: none; }

  .nav__seller-label { color: var(--evx-fox-orange); flex-shrink: 0; }

  .nav__seller-sep { color: var(--evx-rule-light); flex-shrink: 0; }

  .nav__seller-link {
    background: none;
    border: none;
    padding: 0;
    font-family: var(--evx-font-display);
    font-size: 13px;
    color: var(--evx-warm-black);
    cursor: pointer;
    transition: var(--evx-transition);
    white-space: nowrap;
  }

  .nav__seller-link:hover { opacity: 0.60; }
  .nav__seller-link--active { color: var(--evx-fox-orange); font-weight: 500; }

  .nav__seller-cohort {
    color: var(--evx-ink-soft);
    margin-left: auto;
    white-space: nowrap;
    flex-shrink: 0;
  }

  @media (max-width: 1023px) {
    .nav__centre { max-width: 280px; }
  }

  @media (max-width: 767px) {
    .nav__links,
    .nav__login,
    .nav__sell,
    .nav__messages,
    .nav__user,
    .nav__centre { display: none; }

    .nav__hamburger { display: flex; }
  }
</style>
