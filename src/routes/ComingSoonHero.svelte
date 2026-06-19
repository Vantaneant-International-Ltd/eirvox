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
  <!-- top bar -->
  <div class="cs__top cs__fade cs__fade--wordmark">
    <img src="/brand/wordmark.png" alt="ÉIRVOX" class="cs__wordmark-img" />
    <span class="cs__top-note">Finished in Dublin</span>
  </div>

  <!-- centre -->
  <div class="cs__centre">
    <div class="cs__inner">
      <span class="cs__eyebrow cs__fade cs__fade--tagline"><span class="cs__dot" aria-hidden="true"></span>First access</span>

      <h1 class="cs__headline cs__fade cs__fade--tagline">Carbon steering wheels,<br />finished in Dublin.</h1>
      <p class="cs__standfirst cs__fade cs__fade--tagline">
        <span class="cs__italic">A small line, made once</span> — designed in Ireland, finished in Dublin, almost ready.
      </p>

      <div class="cs__group cs__fade cs__fade--group">
        {#if subscribed}
          <p class="cs__confirm">You're on the list.</p>
          <button type="button" class="cs__reset"
                  on:click={() => { localStorage.removeItem(STORAGE_KEY); subscribed = false; email = ''; errorMsg = ''; }}>
            Use a different email →
          </button>
        {:else}
          <form class="cs__form" on:submit={submit}>
            <label class="cs__sr" for="cs-email">Email address</label>
            <input
              id="cs-email"
              type="email"
              class="cs__input"
              placeholder="Your email"
              bind:value={email}
              disabled={submitting}
              required
            />
            <button type="submit" class="cs__btn" disabled={submitting}>
              {submitting ? 'Sending…' : 'Request access'}
            </button>
          </form>
          {#if errorMsg}
            <p class="cs__error" role="alert">{errorMsg}</p>
          {:else}
            <p class="cs__note">No spam · one email when we open</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>

  <!-- imprint -->
  <footer class="cs__footer cs__fade cs__fade--footer">
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
    background:
      radial-gradient(120% 90% at 78% 0%, rgba(232,116,44,0.05), transparent 46%),
      radial-gradient(90% 70% at 12% 100%, rgba(255,255,255,0.025), transparent 50%),
      var(--evx-black);
    color: var(--evx-paper);
    display: flex;
    flex-direction: column;
  }

  /* top bar */
  .cs__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30px 40px;
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
  }
  .cs__wordmark-img { height: 30px; width: auto; display: block; filter: invert(1) brightness(1.05); }
  .cs__top-note {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }

  /* centre */
  .cs__centre {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
  .cs__inner {
    width: 100%;
    max-width: 720px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .cs__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-bottom: 30px;
  }
  .cs__dot { width: 6px; height: 6px; background: var(--evx-paper-soft); flex: none; }

  .cs__headline {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(40px, 6vw, 72px);
    line-height: 0.98;
    letter-spacing: -0.035em;
    color: var(--evx-paper);
    margin: 0 0 24px;
  }
  .cs__standfirst {
    font-family: var(--evx-font-display);
    font-size: 18px;
    line-height: 1.5;
    color: var(--evx-ink-soft);
    margin: 0 0 40px;
    max-width: 30em;
  }
  .cs__italic { font-family: var(--evx-font-editorial); font-style: italic; color: var(--evx-paper); }

  /* group: form */
  .cs__group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 460px;
  }

  .cs__form {
    display: flex;
    height: 54px;
    border: 1px solid var(--evx-rule-strong);
    background: var(--evx-surface);
    transition: border-color 200ms ease;
  }
  .cs__form:focus-within { border-color: rgba(232,116,44,0.42); }

  .cs__sr {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    border: 0;
  }

  .cs__input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    color: var(--evx-paper);
    font-family: var(--evx-font-display);
    font-size: 15px;
    padding: 0 18px;
    outline: none;
  }
  .cs__input::placeholder { color: var(--evx-ink-faint); }

  .cs__btn {
    flex: none;
    background: var(--evx-fox-orange);
    color: #FFFFFF;
    border: none;
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    padding: 0 24px;
    cursor: pointer;
    transition: filter 200ms ease;
    white-space: nowrap;
  }
  .cs__btn:hover { filter: brightness(1.08); }
  .cs__btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .cs__input:disabled { opacity: 0.6; cursor: not-allowed; }

  .cs__note, .cs__error {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
    margin-top: 14px;
  }
  .cs__error { color: #C9665A; }

  .cs__confirm {
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-paper);
    padding: 16px 0 8px;
  }
  .cs__reset {
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: var(--evx-font-mono);
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--evx-ink-soft);
    transition: color 200ms ease;
  }
  .cs__reset:hover { color: var(--evx-fox-orange); }

  /* imprint */
  .cs__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px 24px;
    flex-wrap: wrap;
    padding: 26px 40px;
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
    border-top: 1px solid var(--evx-rule);
  }
  .cs__entity {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }
  .cs__legal {
    display: flex;
    gap: 8px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }
  .cs__legal a { color: var(--evx-ink-soft); text-decoration: none; transition: color 200ms ease; }
  .cs__legal a:hover { color: var(--evx-paper); }

  /* ── Sequential fade-in (film title card cadence) ── */
  .cs__fade {
    opacity: 0;
    animation-fill-mode: forwards;
    animation-timing-function: ease-out;
  }
  .cs__fade--wordmark { animation: cs-fade 1.2s ease-out 0.3s forwards; }
  .cs__fade--tagline  { animation: cs-fade 0.8s ease-out 1.0s forwards; }
  .cs__fade--group    { animation: cs-fade 0.8s ease-out 1.5s forwards; }
  .cs__fade--footer   { animation: cs-fade 0.6s ease-out 2.0s forwards; }

  @keyframes cs-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Mobile ── */
  @media (max-width: 600px) {
    .cs__top { padding: 22px 20px; }
    .cs__centre { padding: 32px 20px; }
    .cs__standfirst { font-size: 16px; }
    .cs__footer { padding: 20px; flex-direction: column; align-items: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cs__fade { animation: none !important; opacity: 1 !important; }
  }
</style>
