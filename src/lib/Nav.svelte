<script lang="ts">
  // ============================================================
  // Nav, one light chrome for every public surface.
  //
  // Structure (top to bottom):
  //   1. Trust bar, hairline strip of true facts. STATIC, never a
  //      scrolling marquee: lockfile §5 bans looping ambient motion and
  //      that rule survives the light rework.
  //   2. Bar, wordmark left, primary links right, one orange CTA.
  //
  // MARKETPLACE is present but locked: it routes to /marketplace, the
  // coming-soon page. Everything built behind it stays built.
  //
  // The `dark` prop is accepted and ignored. Dormant surfaces still
  // pass it; the public site has one light chrome now. Remove the prop
  // once the last dormant surface is re-papered.
  // ============================================================
  import { currentPath, navigate, isActive } from './router';
  import { auth, signOut } from './auth';

  export let dark = false;
  dark; // intentionally unused, see header note

  let menuOpen = false;

  $: profile = $auth.profile;
  $: signedIn = !!$auth.user;
  $: isAdmin = profile?.role === 'admin';

  // Only true facts. No shipping, insurance, or response-time claims;
  // no ratings, counters, or origin phrasing outside the locked copy.
  const TRUST = [
    'DESIGNED IN IRELAND · FINISHED IN DUBLIN',
    '3K TWILL CARBON',
    'INTEGRATED LED SHIFT LIGHTS',
    'DEPOSIT OR PAY IN FULL',
    'COLLECTION IN DUBLIN',
  ];

  // One flat IA. DRIVE and the finder are sections of the shop, not
  // separate worlds, they deep-link into /wheels.
  const LINKS = [
    { label: 'Wheels',      path: '/wheels' },
    { label: 'DRIVE',       path: '/wheels#drive',   mono: true },
    { label: 'Fitment',     path: '/wheels#fitment' },
    { label: 'Marketplace', path: '/marketplace',    locked: true },
    { label: 'About',       path: '/about' },
  ];

  function handleNav(path: string) {
    menuOpen = false;

    if (path.startsWith('mailto:') || path.startsWith('http')) {
      window.location.href = path;
      return;
    }

    // In-page anchor ("/wheels#drive"). The hash router can't carry a
    // second '#', so route first, then scroll once the target mounts.
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

  async function handleLogout() {
    menuOpen = false;
    await signOut();
    navigate('/');
  }
</script>

<!-- 1 · Trust bar -->
<div class="tb">
  <div class="tb__inner page-container">
    {#each TRUST as item, i}
      <span class="tb__item" class:tb__item--fold={i > 1}>{item}</span>
    {/each}
  </div>
</div>

<!-- 2 · Bar -->
<header class="nav">
  <div class="nav__inner page-container">

    <button class="nav__wordmark" on:click={() => handleNav('/')} aria-label="ÉIRVOX home">
      <img src="/brand/wordmark.png" alt="ÉIRVOX" class="nav__wordmark-img" />
    </button>

    <nav class="nav__links" aria-label="Primary">
      {#each LINKS as link}
        <button
          class="nav__link"
          class:nav__link--mono={link.mono}
          class:nav__link--active={isActive(link.path.split('#')[0], $currentPath)}
          on:click={() => handleNav(link.path)}
        >
          {link.label}
          {#if link.locked}<span class="nav__soon">Soon</span>{/if}
        </button>
      {/each}
    </nav>

    <div class="nav__actions">
      {#if isAdmin}
        <button class="nav__admin" on:click={() => handleNav('/admin')}>Admin</button>
      {/if}
      {#if signedIn}
        <button class="nav__admin" on:click={handleLogout}>Sign out</button>
      {/if}
      <button class="evx-btn evx-btn--primary evx-btn--sm nav__cta" on:click={() => handleNav('/wheels#fitment')}>
        Find your fit
      </button>

      <button
        class="nav__burger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        on:click={() => (menuOpen = !menuOpen)}
      >
        <span class="nav__burger-line" class:nav__burger-line--x={menuOpen}></span>
        <span class="nav__burger-line" class:nav__burger-line--hide={menuOpen}></span>
        <span class="nav__burger-line" class:nav__burger-line--y={menuOpen}></span>
      </button>
    </div>
  </div>

  {#if menuOpen}
    <div class="nav__panel">
      <div class="page-container">
        {#each LINKS as link}
          <button class="nav__panel-link" on:click={() => handleNav(link.path)}>
            {link.label}
            {#if link.locked}<span class="nav__soon">Soon</span>{/if}
          </button>
        {/each}
        <hr class="evx-rule nav__panel-rule" />
        <button class="nav__panel-link nav__panel-link--sm" on:click={() => handleNav('/trust')}>How buying works</button>
        <button class="nav__panel-link nav__panel-link--sm" on:click={() => handleNav('mailto:support@eirvox.ie')}>Contact</button>
        {#if isAdmin}
          <button class="nav__panel-link nav__panel-link--sm" on:click={() => handleNav('/admin')}>Admin</button>
        {/if}
        {#if signedIn}
          <button class="nav__panel-link nav__panel-link--sm" on:click={handleLogout}>Sign out</button>
        {/if}
      </div>
    </div>
  {/if}
</header>

<style>
  /* ── Trust bar ── */
  .tb {
    background: var(--evx-ink);
    color: rgba(255, 255, 255, 0.66);
  }
  .tb__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--evx-space-lg);
    height: 30px;
    overflow: hidden;
  }
  .tb__item {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    font-weight: 400;
    letter-spacing: 0.15em;
    white-space: nowrap;
  }
  .tb__item + .tb__item::before {
    content: '·';
    margin-right: var(--evx-space-lg);
    color: rgba(255, 255, 255, 0.3);
  }

  /* ── Bar ── */
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
    justify-content: space-between;
    gap: var(--evx-space-xl);
    height: var(--evx-nav-height);
  }

  .nav__wordmark {
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    flex-shrink: 0;
  }
  .nav__wordmark-img { height: 17px; width: auto; }

  .nav__links {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    margin-left: auto;
  }
  .nav__link {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-ink);
    background: none;
    border: none;
    padding: 0;
    transition: var(--evx-transition);
  }
  .nav__link:hover { opacity: 0.55; }
  .nav__link--active { color: var(--evx-fox-orange); }
  .nav__link--mono {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.12em;
  }
  .nav__soon {
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

  .nav__actions {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    flex-shrink: 0;
  }
  .nav__admin {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none;
    border: none;
    padding: 0;
    transition: var(--evx-transition);
  }
  .nav__admin:hover { color: var(--evx-ink); }

  /* ── Burger ── */
  .nav__burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    width: 24px;
    height: 24px;
    background: none;
    border: none;
    padding: 0;
  }
  .nav__burger-line {
    display: block;
    width: 20px;
    height: 1px;
    background: var(--evx-ink);
    transition: transform 200ms ease, opacity 200ms ease;
  }
  .nav__burger-line--x { transform: translateY(5px) rotate(45deg); }
  .nav__burger-line--y { transform: translateY(-5px) rotate(-45deg); }
  .nav__burger-line--hide { opacity: 0; }

  /* ── Mobile panel ── */
  .nav__panel {
    display: none;
    border-top: 1px solid var(--evx-rule-light);
    background: var(--evx-paper);
    padding: var(--evx-space-lg) 0 var(--evx-space-xl);
  }
  .nav__panel-link {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    width: 100%;
    font-family: var(--evx-font-display);
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-ink);
    background: none;
    border: none;
    padding: 10px 0;
    text-align: left;
  }
  .nav__panel-link--sm {
    font-size: 14px;
    color: var(--evx-ink-soft);
    padding: 7px 0;
  }
  .nav__panel-rule { margin: var(--evx-space-md) 0; }

  @media (max-width: 1023px) {
    .tb__item--fold { display: none; }
    .nav__links { display: none; }
    .nav__cta { display: none; }
    .nav__admin { display: none; }
    .nav__burger { display: flex; }
    .nav__panel { display: block; }
  }

  @media (max-width: 767px) {
    .tb__inner { justify-content: flex-start; }
  }
</style>
