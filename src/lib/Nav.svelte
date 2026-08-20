<script lang="ts">
  // ============================================================
  // Nav, one light chrome for every public surface.
  //
  // Structure (top to bottom):
  //   1. Trust bar, a ledger of true facts. STATIC, never a scrolling
  //      marquee: lockfile §5 bans looping ambient motion.
  //   2. Bar, wordmark left, primary links right, one orange CTA.
  //
  // Both are LOCKED to the viewport as one slab (20 Aug 2026, Renato:
  // the top banner stays with you as you scroll). The slab condenses
  // once you leave the top of the page: the bar gives back height, the
  // trust ledger keeps all of its, because keeping it readable is the
  // whole point of pinning it.
  //
  // The measured slab height is published as --evx-chrome-height so the
  // surfaces with their own sticky furniture (the shop filter rail, the
  // product buy panel) and in-page anchors sit under it rather than
  // behind it. Measured, not hard-coded: it differs by breakpoint and
  // by scroll state.
  //
  // MARKETPLACE is present but locked: it routes to /marketplace, the
  // coming-soon page. Everything built behind it stays built.
  //
  // The `dark` prop is accepted and ignored. Dormant surfaces still
  // pass it; the public site has one light chrome now. Remove the prop
  // once the last dormant surface is re-papered.
  // ============================================================
  import { onMount } from 'svelte';
  import { currentPath, navigate, isActive } from './router';
  import { auth, signOut } from './auth';
  import WhatsAppButton from './WhatsAppButton.svelte';

  export let dark = false;
  dark; // intentionally unused, see header note

  let menuOpen = false;

  // Slab measurement + condense state.
  let tbEl: HTMLElement;
  let navEl: HTMLElement;
  let barEl: HTMLElement;
  let condensed = false;

  onMount(() => {
    const root = document.documentElement;

    // The open mobile panel lives inside the slab, so measure the two
    // pinned rows rather than the wrapper.
    const publish = () => {
      if (!tbEl || !barEl || !navEl) return;
      // The bar's own bottom hairline counts: leave it out and a sticky
      // rail parked at the published height covers it by a pixel.
      const rule = parseFloat(getComputedStyle(navEl).borderBottomWidth) || 0;
      const h = Math.round(tbEl.offsetHeight + barEl.offsetHeight + rule);
      root.style.setProperty('--evx-chrome-height', `${h}px`);
    };

    // 8px of slack so a rubber-band scroll doesn't flicker the slab.
    const onScroll = () => {
      const next = window.scrollY > 8;
      if (next === condensed) return;
      condensed = next;
      requestAnimationFrame(publish);
    };

    const ro = new ResizeObserver(publish);
    if (tbEl) ro.observe(tbEl);
    if (barEl) ro.observe(barEl);

    publish();
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      ro.disconnect();
      root.style.removeProperty('--evx-chrome-height');
    };
  });

  $: profile = $auth.profile;
  $: signedIn = !!$auth.user;
  $: isAdmin = profile?.role === 'admin';

  // Only true facts. No shipping, insurance, or response-time claims;
  // no ratings, counters, or origin phrasing outside the locked copy.
  const TRUST = [
    'DESIGNED IN IRELAND · FINISHED IN DUBLIN',
    '3K TWILL CARBON',
    'INTEGRATED LED SHIFT LIGHTS',
    'FITMENT CONFIRMED BEFORE YOU PAY',
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

  // Wheels, DRIVE and Fitment all live at /wheels, so a startsWith test
  // lit all three orange at once on the shop. Only the plain link marks
  // the section; the two anchor links never do, because there is no
  // reliable way to know which one you are parked at.
  function isLinkActive(link: { path: string }): boolean {
    if (link.path.includes('#')) return false;
    return isActive(link.path, $currentPath);
  }

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

<!-- Contact, mounted with the chrome so it appears on every public
     surface and on none of the gates or the admin panel. -->
<WhatsAppButton />

<!-- The pinned slab: trust ledger + bar, one block, locked to the top. -->
<div class="chrome" class:chrome--condensed={condensed}>

  <!-- 1 · Trust ledger -->
  <div class="tb" bind:this={tbEl}>
    <div class="tb__inner page-container">
      {#each TRUST as item, i}
        <span class="tb__item" class:tb__item--lead={i === 0} class:tb__item--fold={i > 1}>{item}</span>
      {/each}
    </div>
  </div>

  <!-- 2 · Bar -->
  <header class="nav" bind:this={navEl}>
    <div class="nav__inner page-container" bind:this={barEl}>

      <button class="nav__wordmark" on:click={() => handleNav('/')} aria-label="ÉIRVOX home">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="nav__wordmark-img" />
      </button>

      <nav class="nav__links" aria-label="Primary">
        {#each LINKS as link}
          <button
            class="nav__link"
            class:nav__link--mono={link.mono}
            class:nav__link--active={isLinkActive(link)}
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
</div>

<style>
  /* ── The pinned slab ── */
  /* One block, not two stacked stickies: the ledger and the bar move as
     a single piece so nothing slides out from under anything else. */
  .chrome {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--evx-paper);
  }

  /* ── Trust ledger ── */
  /* Was five equal grey scraps on a lifted sliver. It is now a ledger
     ruled off the page ground: hairline cells, the signature line in
     full ink, the rest supporting it. Same ground as the bar, so the
     slab reads as one object.
     No mark, no icon: §13's drift check bans icons in a trust strip and
     orange used as decoration, and a leading orange square was both. */
  .tb {
    background: var(--evx-paper);
    color: var(--evx-ink-soft);
    border-bottom: 1px solid var(--evx-rule-hair);
  }
  .tb__inner {
    display: flex;
    align-items: stretch;
    justify-content: center;
    height: 34px;
    overflow: hidden;
  }
  .tb__item {
    display: inline-flex;
    align-items: center;
    padding: 0 var(--evx-space-lg);
    /* Ruled right, framed left on the first cell, so the group closes
       on both sides however many cells the breakpoint keeps. */
    border-right: 1px solid var(--evx-rule-hair);
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.16em;
    white-space: nowrap;
    transition: color 200ms ease;
  }
  .tb__item:first-child { border-left: 1px solid var(--evx-rule-hair); }
  .tb__item--lead {
    color: var(--evx-ink);
    font-weight: 500;
  }
  @media (hover: hover) {
    .tb__item:hover { color: var(--evx-ink); }
  }

  /* ── Bar ── */
  /* Not sticky itself any more, .chrome carries the pin. */
  .nav {
    background: var(--evx-paper);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .nav__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-xl);
    height: var(--evx-nav-height);
    transition: height 220ms ease;
  }

  /* Condensed: away from the top of the page the bar gives back height
     so the pinned slab costs less of the screen. The ledger keeps all
     of its, since staying readable is why it is pinned. */
  .chrome--condensed .nav__inner { height: calc(var(--evx-nav-height) - 16px); }
  .chrome--condensed .nav { border-bottom-color: var(--evx-rule-light); }
  .chrome--condensed .nav__wordmark-img { height: 17px; }

  @media (prefers-reduced-motion: reduce) {
    .nav__inner,
    .nav__wordmark-img { transition: none; }
  }

  .nav__wordmark {
    display: inline-flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    flex-shrink: 0;
  }
  .nav__wordmark-img { height: 20px; width: auto; filter: invert(1); transition: height 220ms ease; }

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
    align-items: flex-end;
    gap: 4px;
    width: 44px;
    height: 44px;
    margin-right: -10px;
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
  /* Inside the pinned slab, so it has to fit the viewport on its own
     rather than run off the bottom of the screen. */
  .nav__panel {
    display: none;
    border-top: 1px solid var(--evx-rule-light);
    background: var(--evx-paper);
    padding: var(--evx-space-lg) 0 var(--evx-space-xl);
    max-height: calc(100dvh - var(--evx-chrome-height, 108px));
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .nav__panel-link {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
    width: 100%;
    min-height: 52px;
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
    font-size: 15px;
    min-height: 46px;
    color: var(--evx-ink-soft);
    padding: 7px 0;
  }
  .nav__panel-rule { margin: var(--evx-space-md) 0; }

  @media (max-width: 1023px) {
    .nav__wordmark-img { height: 17px; }
    .tb__item--fold { display: none; }
    .nav__links { display: none; }
    .nav__cta { display: none; }
    .nav__admin { display: none; }
    .nav__burger { display: flex; }
    .nav__panel { display: block; }
  }

  @media (max-width: 767px) {
    /* Two cells fit at this size, whole. Anything past that gets cut
       mid-word, and a truncated fact is worse than one fewer fact. */
    .tb__item:nth-child(n + 3) { display: none; }
    .tb__inner { height: 30px; }
    .tb__item {
      font-size: 9px;
      letter-spacing: 0.11em;
      padding: 0 var(--evx-space-md);
    }
    /* A pinned slab on a phone has to stay cheap: the bar condenses
       harder than it does on a desktop. */
    .chrome--condensed .nav__inner { height: calc(var(--evx-nav-height) - 10px); }
  }

  @media (max-width: 459px) {
    /* The signature line alone, unruled and centred. It is the one
       that has to survive; a second cell only fits from ~460 up. */
    .tb__item:nth-child(n + 2) { display: none; }
    .tb__item,
    .tb__item:first-child { border-left: none; border-right: none; }
  }
</style>
