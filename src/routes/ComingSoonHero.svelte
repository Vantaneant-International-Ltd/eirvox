<script lang="ts">
  import { onMount } from 'svelte';
  import { submitWaitlist, isValidEmail } from '../lib/waitlist';

  const STORAGE_KEY = 'eirvox_waitlist_email';

  let email = '';
  let subscribed = false;
  let submitting = false;
  let errorMsg = '';

  onMount(() => {
    if (localStorage.getItem(STORAGE_KEY)) subscribed = true;
  });

  async function submit(e: Event) {
    e.preventDefault();
    if (submitting) return;
    errorMsg = '';

    const value = email.trim();
    if (!isValidEmail(value)) {
      errorMsg = 'Please enter a valid email.';
      return;
    }

    submitting = true;
    const result = await submitWaitlist(value, 'coming_soon');
    submitting = false;

    if (result.ok || result.reason === 'duplicate') {
      // Treat duplicate as "you're in" - same UI as success, with a tailored line.
      localStorage.setItem(STORAGE_KEY, value);
      subscribed = true;
      if (result.ok === false) errorMsg = result.message;
      return;
    }

    errorMsg = result.message;
  }
</script>

<main class="cs">
  <header class="cs__top page-container">
    <img src="/brand/wordmark.png" alt="ÉIRVOX" class="cs__wordmark" />
    <span class="cs__note">Finished in Dublin</span>
  </header>

  <div class="cs__centre page-container">
    <div class="cs__inner">
      <span class="evx-label cs__eyebrow">FIRST ACCESS</span>

      <h1 class="cs__headline">Carbon steering wheels,<br />finished in Dublin.</h1>
      <p class="cs__stand">
        <span class="evx-editorial">A small line, made once.</span>
        Designed in Ireland, assembled abroad, finished in Dublin.
      </p>

      <div class="cs__group">
        {#if subscribed}
          <p class="cs__confirm">You're on the list.</p>
          <button type="button" class="evx-link"
                  on:click={() => { localStorage.removeItem(STORAGE_KEY); subscribed = false; email = ''; errorMsg = ''; }}>
            Use a different email →
          </button>
        {:else}
          <form class="cs__form" on:submit={submit}>
            <label class="sr-only" for="cs-email">Email address</label>
            <input
              id="cs-email"
              type="email"
              class="cs__input"
              placeholder="Your email"
              autocomplete="email"
              bind:value={email}
              disabled={submitting}
              required
            />
            <button type="submit" class="evx-btn evx-btn--primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Request access'}
            </button>
          </form>
          {#if errorMsg}
            <p class="cs__error" role="alert">{errorMsg}</p>
          {:else}
            <p class="cs__hint">One email when we open. Nothing else.</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <footer class="cs__footer page-container">
    <span class="cs__entity">EIRVOX LIMITED · a Vantanéant International Ltd company · CRO 806648</span>
    <div class="cs__legal">
      <a href="#/privacy">Privacy</a>
      <span aria-hidden="true">·</span>
      <a href="#/terms">Terms</a>
      <span aria-hidden="true">·</span>
      <a href="#/cookies">Cookies</a>
      <span aria-hidden="true">·</span>
      <a href="mailto:support@eirvox.ie">support@eirvox.ie</a>
    </div>
  </footer>
</main>

<style>
  .cs {
    min-height: 100vh;
    background: var(--evx-paper);
    color: var(--evx-ink);
    display: flex;
    flex-direction: column;
  }

  .cs__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-md);
    height: var(--evx-nav-height);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .cs__wordmark { height: 17px; width: auto; }
  .cs__note {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .cs__centre {
    flex: 1;
    display: flex;
    align-items: center;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }
  .cs__inner { max-width: 620px; animation: evx-rise 500ms ease both; }

  .cs__eyebrow { display: block; margin-bottom: var(--evx-space-lg); }

  .cs__headline {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(34px, 5vw, 60px);
    line-height: 1.05;
    letter-spacing: -0.03em;
  }
  .cs__stand {
    margin-top: var(--evx-space-lg);
    font-size: clamp(15px, 1.3vw, 18px);
    line-height: 1.55;
    color: var(--evx-ink-soft);
    max-width: 48ch;
  }

  .cs__group { margin-top: var(--evx-space-2xl); }
  .cs__form { display: flex; flex-wrap: wrap; gap: var(--evx-space-sm); max-width: 460px; }
  .cs__input {
    flex: 1 1 220px;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-ink);
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 13px 14px;
  }
  .cs__input::placeholder { color: var(--evx-ink-faint); }
  .cs__input:focus-visible { border-color: var(--evx-fox-orange); }

  .cs__hint, .cs__error {
    margin-top: var(--evx-space-md);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
  .cs__error { color: var(--evx-fox-orange); }
  .cs__confirm {
    font-size: 18px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-bottom: var(--evx-space-md);
  }

  .cs__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-light);
    flex-wrap: wrap;
  }
  .cs__entity, .cs__legal {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    color: var(--evx-ink-soft);
  }
  .cs__legal { display: flex; align-items: center; gap: 8px; }
  .cs__legal a { transition: var(--evx-transition); }
  .cs__legal a:hover { color: var(--evx-ink); }

  @media (max-width: 767px) {
    .cs__footer { flex-direction: column; align-items: flex-start; gap: var(--evx-space-sm); }
  }
</style>
