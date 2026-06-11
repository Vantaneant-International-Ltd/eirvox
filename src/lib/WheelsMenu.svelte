<script lang="ts">
  // ============================================================
  // WheelsMenu — dark slide-in drawer for the wheel-specialist pages.
  //
  // The old marketplace Nav carried account + admin access in its user
  // menu. The dark /wheels pages have a minimal top bar with no Nav, so
  // that access was stranded (the burger did nothing). This drawer
  // restores it, adapted to the dark design: wheel nav + account/admin
  // when signed in. Controlled via `open`; emits `close`.
  // ============================================================
  import { createEventDispatcher } from 'svelte';
  import { navigate } from './router';
  import { auth, signOut } from './auth';
  import { siteFlags } from './flags';

  export let open = false;

  const dispatch = createEventDispatcher<{ close: void }>();
  function close() { dispatch('close'); }

  $: signedIn = !!$auth.user;
  $: role = $auth.profile?.role;
  $: isAdmin = role === 'admin';
  $: isSeller = role === 'seller' || role === 'admin';
  // Seller dashboard lives under /sell, which is 404'd while the
  // wheel-specialist launch is on. Hide the link there; admins manage
  // listings via the Admin panel. Returns when the flag is flipped off.
  $: wheelMode = $siteFlags.wheel_specialist_mode;

  function go(path: string) {
    close();
    navigate(path);
  }

  async function handleSignOut() {
    close();
    await signOut();
    navigate('/wheels');
  }

  const wheelLinks = [
    { label: 'Wheels',       path: '/wheels' },
    { label: 'Find your fit', path: '/wheels' },
    { label: 'DRIVE',        path: '/drive' },
    { label: 'About',        path: '/about' },
    { label: 'Trust',        path: '/trust' },
  ];
</script>

{#if open}
  <div class="wm" role="dialog" aria-modal="true" aria-label="Menu"
       on:click|self={close}
       on:keydown={(e) => { if (e.key === 'Escape') close(); }}>
    <aside class="wm__panel">
      <header class="wm__head">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="wm__logo" />
        <button class="wm__close" type="button" on:click={close} aria-label="Close menu">✕</button>
      </header>

      <nav class="wm__nav">
        {#each wheelLinks as l}
          <button class="wm__link" type="button" on:click={() => go(l.path)}>{l.label}</button>
        {/each}
        <a class="wm__link" href="mailto:support@eirvox.ie" on:click={close}>Contact</a>
      </nav>

      <div class="wm__rule"></div>

      <nav class="wm__nav wm__nav--account">
        {#if signedIn}
          {#if isSeller && !wheelMode}
            <button class="wm__link" type="button" on:click={() => go('/sell/dashboard')}>My listings</button>
          {/if}
          {#if isAdmin}
            <button class="wm__link wm__link--accent" type="button" on:click={() => go('/admin')}>Admin</button>
          {/if}
          <button class="wm__link wm__link--muted" type="button" on:click={handleSignOut}>Sign out</button>
        {:else}
          <button class="wm__link wm__link--accent" type="button" on:click={() => go('/login')}>Sign in</button>
        {/if}
      </nav>

      <div class="wm__foot">
        <span class="wm__foot-meta">© ÉIRVOX 2026 · Dublin, IE</span>
      </div>
    </aside>
  </div>
{/if}

<style>
  .wm {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(14, 13, 12, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    justify-content: flex-end;
    animation: wm-fade 200ms ease both;
  }
  .wm__panel {
    width: min(86vw, 360px);
    height: 100%;
    background: var(--evx-black);
    border-left: 1px solid var(--evx-rule);
    display: flex;
    flex-direction: column;
    padding: 18px 22px max(22px, env(safe-area-inset-bottom));
    animation: wm-slide 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
    overflow-y: auto;
  }

  .wm__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0 22px;
  }
  .wm__logo {
    height: 16px;
    width: auto;
    display: block;
    /* PNG is dark-on-transparent; invert for the dark drawer. */
    filter: invert(1) brightness(1.05);
  }
  .wm__close {
    width: 38px; height: 38px;
    border-radius: 50%;
    border: 1px solid var(--evx-rule);
    background: transparent;
    color: var(--evx-paper);
    font-size: 16px;
    cursor: pointer;
  }

  .wm__nav { display: flex; flex-direction: column; }
  .wm__link {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-paper);
    background: none;
    border: none;
    text-align: left;
    text-decoration: none;
    padding: 13px 0;
    cursor: pointer;
    transition: opacity 160ms ease, color 160ms ease;
  }
  .wm__link:hover { opacity: 0.62; }
  .wm__link--accent { color: var(--evx-fox-orange); }
  .wm__link--muted { color: var(--evx-ink-soft); font-size: 16px; }

  .wm__rule {
    height: 1px;
    background: var(--evx-rule);
    margin: 14px 0;
  }
  .wm__nav--account { flex: 0 0 auto; }

  .wm__foot { margin-top: auto; padding-top: 24px; }
  .wm__foot-meta {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    color: var(--evx-ink-faint, var(--evx-ink-soft));
  }

  @keyframes wm-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes wm-slide { from { transform: translateX(8%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }
</style>
