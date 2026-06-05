<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from './router';

  const STORAGE_KEY = 'eirvox-cookie-consent';
  let visible = false;

  /** Push a consent update into Google's gtag (loaded in index.html
   *  with Consent Mode v2 defaults of all-denied). Granted enables
   *  Google Analytics tracking; denied leaves it as cookieless pings. */
  function gtagConsent(analyticsGranted: boolean) {
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    if (typeof w.gtag !== 'function') return;
    w.gtag('consent', 'update', {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage:        'denied',
      ad_user_data:      'denied',
      ad_personalization: 'denied',
    });
  }

  onMount(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      visible = !stored;
    } catch {
      // localStorage blocked (private mode etc.) - show the banner once
      visible = true;
    }
  });

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, 'all'); } catch {}
    gtagConsent(true);
    visible = false;
  }
  function essentialOnly() {
    try { localStorage.setItem(STORAGE_KEY, 'essential'); } catch {}
    gtagConsent(false);
    visible = false;
  }
</script>

{#if visible}
  <aside class="banner" role="region" aria-label="Cookie consent">
    <div class="banner__inner">
      <p class="banner__copy">
        <strong class="banner__pre">COOKIES.</strong>
        ÉIRVOX uses essential cookies to make the site work.
        We also use anonymous analytics to improve the platform.
        No behavioural advertising, ever.
        <button
          type="button"
          class="banner__link"
          on:click={() => { navigate('/cookies'); visible = false; }}
        >Read the policy →</button>
      </p>
      <div class="banner__actions">
        <button class="evx-btn evx-btn--ghost-paper evx-btn--sm banner__btn" on:click={essentialOnly}>
          Decline
        </button>
        <button class="evx-btn evx-btn--primary evx-btn--sm banner__btn" on:click={accept}>
          Accept all
        </button>
      </div>
    </div>
  </aside>
{/if}

<style>
  .banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 200;
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border-top: 2px solid var(--evx-fox-orange);
    padding: var(--evx-space-md);
    padding-bottom: calc(var(--evx-space-md) + env(safe-area-inset-bottom, 0px));
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.18);
  }

  .banner__inner {
    max-width: 1280px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--evx-space-lg);
    align-items: center;
  }

  .banner__copy {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(245, 242, 237, 0.85);
  }

  .banner__pre {
    font-family: var(--evx-font-mono);
    font-weight: 500;
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--evx-fox-orange);
    margin-right: var(--evx-space-xs);
  }

  .banner__link {
    background: none; border: none; padding: 0;
    font-family: inherit;
    font-size: inherit;
    color: var(--evx-paper);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: var(--evx-transition);
    margin-left: 4px;
  }
  .banner__link:hover { opacity: 0.70; }

  .banner__actions {
    display: flex;
    gap: var(--evx-space-sm);
    flex-shrink: 0;
  }

  .banner__btn { white-space: nowrap; }

  @media (max-width: 767px) {
    .banner__inner {
      grid-template-columns: 1fr;
      gap: var(--evx-space-md);
    }
    .banner__actions { justify-content: stretch; }
    .banner__btn { flex: 1; }
  }
</style>
