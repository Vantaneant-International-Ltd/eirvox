<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { auth } from '../lib/auth';
  import { navigate, currentPath } from '../lib/router';
  import type { UserRole } from '../lib/supabase';

  export let requireAuth: boolean = false;
  export let requireRole: UserRole | undefined = undefined;

  // Are we waiting for the initial auth check?
  $: pending = $auth.loading || !$auth.initialised;
  $: signedIn = !!$auth.user;
  $: role = $auth.profile?.role;
  $: hasRequiredRole = !requireRole || role === requireRole || role === 'admin';

  // If requireRole is set, we implicitly require auth.
  $: effectiveRequireAuth = requireAuth || !!requireRole;

  // Redirect to login if missing auth - only after init.
  let redirected = false;
  $: if (!pending && effectiveRequireAuth && !signedIn && !redirected) {
    redirected = true;
    // Remember where the user was trying to go so we can return there later.
    try {
      sessionStorage.setItem('eirvox-return-to', $currentPath);
    } catch { /* ignore */ }
    navigate('/login');
  }
</script>

{#if pending}
  <Nav />
  <main id="main-content" class="guard-loading">
    <div class="guard__inner page-container">
      <div class="guard__spinner" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <span class="evx-label guard__loading-label">CHECKING ACCESS…</span>
    </div>
  </main>
  <Footer />
{:else if effectiveRequireAuth && !signedIn}
  <Nav />
  <main id="main-content" class="guard-redirecting">
    <div class="guard__inner page-container">
      <span class="evx-label">REDIRECTING TO SIGN IN</span>
    </div>
  </main>
  <Footer />
{:else if requireRole && !hasRequiredRole}
  <Nav />
  <main id="main-content" class="guard-forbidden">
    <div class="guard__inner page-container">
      <span class="evx-label guard__error-label">ACCESS DENIED</span>
      <h1 class="guard__h">You don't have access to this page.</h1>
      <p class="guard__sub">
        This area is for <strong>{requireRole}s</strong>. Your current account is signed in as
        a <strong>{role ?? 'buyer'}</strong>.
        {#if requireRole === 'seller'}
          If you'd like to become a seller, apply to Cohort 03 below.
        {:else if requireRole === 'admin'}
          If you believe this is a mistake, contact us at <a href="mailto:support@eirvox.ie">support@eirvox.ie</a>.
        {/if}
      </p>
      <div class="guard__actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/')}>
          Back to home →
        </button>
        {#if requireRole === 'seller'}
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/apply')}>
            Apply to sell
          </button>
        {/if}
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/account')}>
          Your account
        </button>
      </div>
    </div>
  </main>
  <Footer />
{:else}
  <slot />
{/if}

<style>
  .guard-loading,
  .guard-redirecting,
  .guard-forbidden {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .guard__inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    max-width: 560px;
    width: 100%;
  }

  .guard__loading-label,
  .guard__error-label { color: var(--evx-fox-orange); }

  .guard__spinner {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .guard__spinner span {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--evx-warm-black);
    animation: g-pulse 1200ms ease-in-out infinite;
  }
  .guard__spinner span:nth-child(2) { animation-delay: 150ms; background: var(--evx-fox-orange); }
  .guard__spinner span:nth-child(3) { animation-delay: 300ms; }

  @keyframes g-pulse {
    0%, 60%, 100% { opacity: 0.30; transform: scale(1); }
    30% { opacity: 1; transform: scale(1.3); }
  }

  .guard__h {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--evx-warm-black);
  }

  .guard__sub {
    font-size: 15px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
  }
  .guard__sub strong { color: var(--evx-warm-black); font-weight: 500; text-transform: capitalize; }
  .guard__sub a { color: var(--evx-warm-black); text-decoration: underline; text-underline-offset: 3px; }

  .guard__actions {
    display: flex;
    gap: var(--evx-space-md);
    flex-wrap: wrap;
    margin-top: var(--evx-space-md);
  }
</style>
