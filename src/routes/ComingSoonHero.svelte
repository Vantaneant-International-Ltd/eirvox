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
  <div class="cs__inner">
    <h1 class="cs__wordmark-h cs__fade cs__fade--wordmark" aria-label="ÉIRVOX">
      <img src="/brand/wordmark.png" alt="ÉIRVOX" class="cs__wordmark-img" />
    </h1>

    <h2 class="cs__headline cs__fade cs__fade--tagline">Carbon steering wheels, finished in Dublin.</h2>
    <p class="cs__standfirst cs__fade cs__fade--tagline">The wheel you didn't know you wanted.</p>

    <div class="cs__group cs__fade cs__fade--group">
      <div class="cs__rule" aria-hidden="true"></div>
      <span class="cs__eyebrow">LAUNCHING SOON</span>

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
            placeholder="Enter your email"
            bind:value={email}
            disabled={submitting}
            required
          />
          <button type="submit" class="cs__btn" disabled={submitting}>
            {submitting ? 'Sending…' : 'Notify me'}
          </button>
        </form>
        {#if errorMsg}
          <p class="cs__error" role="alert">{errorMsg}</p>
        {/if}
      {/if}
    </div>

    <p class="cs__origin cs__fade cs__fade--footer">Designed in Ireland, assembled abroad, finished in Dublin.</p>

    <footer class="cs__footer cs__fade cs__fade--footer">
      <span class="cs__entity">ÉIRVOX Systems Ltd · Dublin, Ireland</span>
      <div class="cs__legal">
        <a href="#/privacy">Privacy</a>
        <span aria-hidden="true">·</span>
        <a href="#/terms">Terms</a>
        <span aria-hidden="true">·</span>
        <a href="#/cookies">Cookies</a>
      </div>
      <div class="cs__social">
        <a href="https://www.instagram.com/eirvox_" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4.5"/>
            <circle cx="12" cy="12" r="4.2"/>
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/%C3%A9irvox/" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on LinkedIn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM8.3 18H5.7V9.7h2.6V18zM7 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18.3 18h-2.6v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18h-2.6V9.7H13v1.1c.4-.6 1-1.3 2.2-1.3 1.6 0 3 1 3 3.3V18z"/>
          </svg>
        </a>
      </div>
    </footer>
  </div>
</main>

<style>
  .cs {
    min-height: 100vh;
    background: var(--evx-paper);
    background-image: none;
    color: var(--evx-ink);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
  }

  .cs__inner {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  /* ── Wordmark (PNG) ── */
  .cs__wordmark-h {
    margin: 0 0 18px;
    line-height: 0;          /* prevents h1's default line-height baseline padding */
  }

  .cs__wordmark-img {
    height: 72px;            /* glyph height ~52px after the centred-glyph crop */
    width: auto;
    display: block;
  }

  /* ── Headline + standfirst (the two beats: trust + desire) ── */
  .cs__headline {
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-weight: 500;
    font-size: 27px;
    line-height: 1.12;
    letter-spacing: -0.02em;
    color: var(--evx-ink);
    margin: 0 0 12px;
    max-width: 440px;
  }
  .cs__standfirst {
    font-family: 'Newsreader', Georgia, serif;
    font-style: italic;
    font-weight: 400;
    font-size: 18px;
    line-height: 1.4;
    color: var(--evx-ink-soft);
    margin: 0 0 32px;
    max-width: 380px;
  }
  .cs__origin {
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-weight: 400;
    font-size: 13px;
    line-height: 1.5;
    color: var(--evx-ink-soft);
    margin: 0 0 28px;
    max-width: 380px;
  }

  /* ── Group: rule + eyebrow + form, held together ── */
  .cs__group {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-bottom: 56px;
  }

  .cs__rule {
    width: 120px;
    height: 1px;
    background: var(--evx-rule-light);
    margin-bottom: 24px;
  }

  .cs__eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #E8742C;
    margin-bottom: 20px;
  }

  /* ── Form: single baseline, no boxes ── */
  .cs__form {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    width: 100%;
    max-width: 420px;
  }

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
    min-width: 320px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-ink-soft);
    border-radius: 0;
    color: var(--evx-ink);
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-weight: 400;
    font-size: 14px;
    padding: 8px 0;
    outline: none;
    transition: border-color 200ms ease;
  }
  .cs__input::placeholder { color: var(--evx-ink-soft); }
  .cs__input:focus { border-bottom-color: var(--evx-ink); }

  .cs__btn {
    background: #E8742C;
    color: #FFFFFF;
    border: none;
    border-radius: 2px;
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-size: 14px;
    font-weight: 500;
    padding: 10px 24px;
    cursor: pointer;
    transition: opacity 200ms ease;
    white-space: nowrap;
  }
  .cs__btn:hover { opacity: 0.85; }
  .cs__btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .cs__input:disabled { opacity: 0.6; cursor: not-allowed; }

  .cs__error {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #C9665A;
    margin-top: 14px;
  }

  .cs__confirm {
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-size: 14px;
    color: var(--evx-ink);
    padding: 8px 0;
  }
  .cs__reset {
    background: none; border: none; padding: 0; cursor: pointer;
    font-family: 'JetBrains Mono', Menlo, monospace;
    font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--evx-ink-soft);
    transition: color 200ms ease;
  }
  .cs__reset:hover { color: #E8742C; }

  /* ── Footer ── */
  .cs__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .cs__entity {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }

  .cs__social {
    display: flex;
    gap: 18px;
  }

  .cs__social a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--evx-ink-soft);
    transition: color 200ms ease;
  }
  .cs__social a:hover { color: #E8742C; }

  .cs__legal {
    display: flex;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
  .cs__legal a {
    color: var(--evx-ink-soft);
    text-decoration: none;
    transition: color 200ms ease;
  }
  .cs__legal a:hover { color: #E8742C; }

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
    .cs { padding: 48px 20px; }
    .cs__wordmark-h { margin-bottom: 14px; }
    .cs__wordmark-img { height: 52px; }
    .cs__headline { font-size: 23px; max-width: 320px; }
    .cs__standfirst { font-size: 16px; margin-bottom: 28px; max-width: 320px; }
    .cs__group { margin-bottom: 44px; }
    .cs__rule { margin-bottom: 20px; }
    .cs__eyebrow { margin-bottom: 18px; }
    .cs__form {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
    }
    .cs__input { min-width: 0; width: 100%; text-align: center; }
    .cs__btn { width: 100%; }
  }
</style>
