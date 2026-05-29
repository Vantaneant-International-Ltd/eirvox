<script lang="ts">
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'eirvox_waitlist_email';

  let email = '';
  let subscribed = false;

  onMount(() => {
    if (localStorage.getItem(STORAGE_KEY)) subscribed = true;
  });

  function submit(e: Event) {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes('@')) return;
    localStorage.setItem(STORAGE_KEY, value);
    subscribed = true;
  }
</script>

<main class="cs">
  <div class="cs__inner">
    <img
      src="/brand/wordmark.svg"
      alt="ÉIRVOX"
      class="cs__wordmark cs__fade cs__fade--1"
    />

    <p class="cs__tagline cs__fade cs__fade--2">
      Ireland's premium marketplace for enthusiast objects.
    </p>

    <span class="cs__eyebrow cs__fade cs__fade--3">LAUNCHING SOON</span>

    {#if subscribed}
      <p class="cs__confirm cs__fade cs__fade--4">You're on the list.</p>
    {:else}
      <form class="cs__form cs__fade cs__fade--4" on:submit={submit}>
        <label class="cs__sr" for="cs-email">Email address</label>
        <input
          id="cs-email"
          type="email"
          class="cs__input"
          placeholder="Enter your email"
          bind:value={email}
          required
        />
        <button type="submit" class="cs__btn">Notify me</button>
      </form>
    {/if}

    <footer class="cs__footer cs__fade cs__fade--5">
      <span class="cs__entity">ÉIRVOX Systems Ltd · Dublin, Ireland</span>
      <div class="cs__social">
        <a href="https://instagram.com/eirvox.ie" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="4.5"/>
            <circle cx="12" cy="12" r="4.2"/>
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor"/>
          </svg>
        </a>
        <a href="https://linkedin.com/company/eirvox" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on LinkedIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.5 3h-15A1.5 1.5 0 003 4.5v15A1.5 1.5 0 004.5 21h15a1.5 1.5 0 001.5-1.5v-15A1.5 1.5 0 0019.5 3zM8.3 18H5.7V9.7h2.6V18zM7 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM18.3 18h-2.6v-4.2c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7V18h-2.6V9.7H13v1.1c.4-.6 1-1.3 2.2-1.3 1.6 0 3 1 3 3.3V18z"/>
          </svg>
        </a>
        <a href="https://x.com/eirvox" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on X">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.2 3H21l-7 8 8.2 10h-6.8l-5.3-6.5L4.9 21H2l7.5-8.5L1.8 3h6.9l4.8 6L18.2 3z"/>
          </svg>
        </a>
        <a href="https://tiktok.com/@eirvox" target="_blank" rel="noopener noreferrer" aria-label="ÉIRVOX on TikTok">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M16 3v1.6a4.4 4.4 0 003.6 4.3v2.8a7.2 7.2 0 01-3.6-1V15.5a5.5 5.5 0 11-5.5-5.5c.3 0 .5 0 .8.05v2.85a2.7 2.7 0 102.7 2.7V3H16z"/>
          </svg>
        </a>
      </div>
    </footer>
  </div>
</main>

<style>
  .cs {
    min-height: 100vh;
    background: #1A1A1A;
    color: #F5F2ED;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
  }

  .cs__inner {
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0;
  }

  /* Staggered fade-in */
  .cs__fade {
    opacity: 0;
    animation: cs-fade 800ms ease-out forwards;
  }
  .cs__fade--1 { animation-delay: 0ms; }
  .cs__fade--2 { animation-delay: 200ms; }
  .cs__fade--3 { animation-delay: 400ms; }
  .cs__fade--4 { animation-delay: 600ms; }
  .cs__fade--5 { animation-delay: 800ms; }

  @keyframes cs-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Wordmark */
  .cs__wordmark {
    width: 360px;
    max-width: 100%;
    height: auto;
    color: #F5F2ED;
    margin-bottom: 28px;
  }

  /* Tagline */
  .cs__tagline {
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.5;
    color: #8C8C8C;
    margin-bottom: 72px;
    max-width: 420px;
  }

  /* Eyebrow */
  .cs__eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #E8742C;
    margin-bottom: 28px;
  }

  /* Form */
  .cs__form {
    display: flex;
    align-items: stretch;
    gap: 12px;
    width: 100%;
    max-width: 420px;
    margin-bottom: 96px;
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
    min-width: 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(245, 242, 237, 0.25);
    color: #F5F2ED;
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-size: 15px;
    padding: 12px 4px;
    outline: none;
    transition: border-color 200ms ease;
  }
  .cs__input::placeholder { color: #5C5C5C; }
  .cs__input:focus { border-bottom-color: #F5F2ED; }
  .cs__input:disabled { opacity: 0.6; cursor: not-allowed; }

  .cs__btn {
    background: #E8742C;
    color: #FFFFFF;
    border: none;
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.01em;
    padding: 10px 22px;
    cursor: pointer;
    transition: opacity 200ms ease;
    white-space: nowrap;
  }
  .cs__btn:hover { opacity: 0.85; }
  .cs__btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .cs__confirm {
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-size: 15px;
    color: #F5F2ED;
    margin-bottom: 96px;
    padding: 12px 0;
  }

  /* Footer */
  .cs__footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .cs__entity {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    color: #5C5C5C;
  }

  .cs__social {
    display: flex;
    gap: 16px;
  }

  .cs__social a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #5C5C5C;
    transition: color 200ms ease;
  }
  .cs__social a:hover { color: #E8742C; }

  /* Mobile */
  @media (max-width: 600px) {
    .cs { padding: 32px 20px; }
    .cs__wordmark { width: 260px; margin-bottom: 24px; }
    .cs__tagline { font-size: 15px; margin-bottom: 56px; }
    .cs__eyebrow { margin-bottom: 24px; }
    .cs__form {
      flex-direction: column;
      gap: 16px;
      margin-bottom: 72px;
    }
    .cs__btn { width: 100%; padding: 12px 22px; }
    .cs__confirm { margin-bottom: 72px; }
  }
</style>
