<script lang="ts">
  import { currentPath, navigate, isActive } from './router';
  import { auth, signOut } from './auth';
  import { siteFlags } from './flags';

  // Dark surface variant (lockfile §6 shared skeleton: same structure +
  // spacing, only surface tokens swap). Dark house-front pages pass
  // dark; Paper marketplace/utility pages leave it false.
  export let dark = false;

  let menuOpen = false;
  let userMenuOpen = false;
  let userMenuEl: HTMLDivElement;
  let navSearch = '';

  // v20 — wheel-specialist scope. When on, hide the marketplace
  // category nav + TRADE + the broad search affordance. Show a
  // focused four-link nav instead.
  $: wheelMode = $siteFlags.wheel_specialist_mode;

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

  // House-led IA (full-vision homepage + dark house-front pages).
  // Wheels first (the desire engine), then the marketplace + TRADE.
  // Mirrors the approved eirvox-home-full / dc mocks.
  const houseNav = [
    { label: 'All wheels', path: '/wheels', mono: false },
    { label: 'DRIVE', path: '/drive', mono: true },
    { label: 'BMW fitted', path: '/wheels#range', mono: false },
    { label: 'Finder', path: '/wheels#fitment', mono: false },
  ];
  const houseNavMarket = [
    { label: 'Marketplace', path: '/search', mono: false },
    { label: 'TRADE', path: '/trade', mono: true },
    { label: 'Sell', path: '/sell', mono: false },
  ];

  // Wheel-specialist focused nav (lockfile §6 shared skeleton):
  // WHEELS · DRIVE · FINDER · ABOUT. FINDER scrolls to the fitment
  // section on /wheels (its "Check fitment" opens the finder ritual).
  // Contact lives in the footer imprint, not the top bar.
  const wheelNav = [
    { label: 'Wheels', path: '/wheels' },
    { label: 'DRIVE',  path: '/drive' },
    { label: 'Finder', path: '/wheels#fitment' },
    { label: 'About',  path: '/about' },
  ];

  const sellerSections = [
    { label: 'Apply', path: '/sell/apply' },
    { label: 'Create', path: '/sell/create' },
    { label: 'Dashboard', path: '/sell/dashboard' },
  ];

  $: isSellerRoute = $currentPath.startsWith('/sell');

  function handleNav(path: string) {
    if (path.startsWith('mailto:') || path.startsWith('http')) {
      window.location.href = path;
      return;
    }
    menuOpen = false;
    userMenuOpen = false;

    // In-page anchor (e.g. "/wheels#fitment"). The hash router can't carry
    // a second '#', so navigate to the route, then scroll the target into
    // view once it has mounted. No router change.
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

<svelte:window on:click={handleClickOutside} />

<header class="nav" class:nav--dark={dark}>
  <div class="nav__inner page-container" class:nav__inner--wheel={wheelMode}>
    <!-- Wordmark -->
    <div class="nav__left">
      <button class="nav__wordmark" on:click={() => handleNav('/')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="nav__wordmark-img" />
      </button>
    </div>

    <!-- Search (hidden in wheel-specialist mode; nothing to browse) -->
    {#if !wheelMode}
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
            placeholder="Find your fit — enter your model, e.g. F80 M3"
            aria-label="Search listings"
            bind:value={navSearch}
          />
        </form>
      </div>
    {/if}

    <!-- Centered wheel-mode tabs -->
    {#if wheelMode}
      <nav class="nav__wheelnav" aria-label="Primary">
        <ul class="nav__links">
          {#each wheelNav as cat}
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
      </nav>
    {/if}

    <!-- Nav links + actions -->
    <nav class="nav__right" aria-label="Main navigation">
      {#if !wheelMode}
        <ul class="nav__links">
          {#each houseNav as cat}
            <li>
              <button
                class="nav__link"
                class:nav__link--directory={cat.mono}
                class:nav__link--active={isActive(cat.path, $currentPath)}
                on:click={() => handleNav(cat.path)}
              >
                {cat.label}
              </button>
            </li>
          {/each}
          <li class="nav__sep" aria-hidden="true"></li>
          {#each houseNavMarket as d}
            <li>
              <button
                class="nav__link"
                class:nav__link--directory={d.mono}
                class:nav__link--active={isActive(d.path, $currentPath)}
                on:click={() => handleNav(d.path)}
              >
                {d.label}
              </button>
            </li>
          {/each}
        </ul>

        <button class="evx-btn evx-btn--primary evx-btn--sm nav__sell" on:click={() => handleNav('/wheels#fitment')}>
          Find your fit
        </button>
      {/if}

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
      </div>
    </div>
  {/if}

  <!-- Mobile drawer -->
  {#if menuOpen}
    <div class="nav__drawer" role="navigation" aria-label="Mobile navigation">
      <ul class="nav__drawer-links">
        {#if wheelMode}
          {#each wheelNav as cat}
            <li>
              <button class="nav__drawer-link" on:click={() => handleNav(cat.path)}>
                {cat.label}
              </button>
            </li>
          {/each}
        {:else}
          {#each [...houseNav, ...houseNavMarket] as cat}
            <li>
              <button class="nav__drawer-link" on:click={() => handleNav(cat.path)}>
                {cat.label}
              </button>
            </li>
          {/each}
        {/if}

        {#if signedIn}
          <li class="nav__drawer-divider" aria-hidden="true"></li>
          <li class="nav__drawer-user">
            <span class="evx-caption nav__drawer-role">
              {#if role === 'admin'}ADMIN{:else if role === 'seller'}SELLER{:else}BUYER{/if}
            </span>
            <span class="nav__drawer-email">{user?.email ?? ''}</span>
          </li>
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
    height: 64px;
  }
  /* Wheel-specialist: centered tabs — wordmark left, tabs centre, account right */
  .nav__inner--wheel {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
  }
  .nav__inner--wheel .nav__left { justify-self: start; }
  .nav__wheelnav { justify-self: center; }
  .nav__inner--wheel .nav__right { justify-self: end; margin-left: 0; }

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
    height: 32px;
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

  /* ── Dark surface variant (lockfile §6) ──────────────────────
     Same skeleton, only surface tokens swap. Fox orange behaviour is
     identical to Paper; champagne is never introduced in chrome. */
  .nav--dark { background: var(--evx-black); border-bottom-color: var(--evx-rule); }
  .nav--dark .nav__search-wrap { border-bottom-color: var(--evx-rule); }
  .nav--dark .nav__search { color: var(--evx-paper); }
  .nav--dark .nav__search::placeholder { color: var(--evx-ink-faint); }
  .nav--dark .nav__search-icon { color: var(--evx-paper-soft); }
  .nav--dark .nav__link { color: var(--evx-paper); }
  .nav--dark .nav__link:hover { opacity: 0.62; }
  .nav--dark .nav__login { color: var(--evx-paper); }
  .nav--dark .nav__sep { background: var(--evx-rule); }
  .nav--dark .nav__bar { background: var(--evx-paper); }
  .nav--dark .nav__drawer { background: var(--evx-black); border-top-color: var(--evx-rule); }
  .nav--dark .nav__drawer-link { color: var(--evx-paper); }
  .nav--dark .nav__avatar { background: var(--evx-paper); color: var(--evx-black); }
  /* Wordmark PNG is dark-on-transparent; invert to paper on dark. */
  .nav--dark .nav__wordmark-img { filter: invert(1) brightness(1.05); }
  .nav--dark .nav__user-menu,
  .nav--dark .nav__drawer { color: var(--evx-paper); }
</style>
