<script lang="ts">
  import { siteFlags } from '../lib/flags';

  $: message = $siteFlags.maintenance_message;
  $: supportEmail = $siteFlags.support_email;
</script>

<main class="mt">
  <div class="mt__inner">
    <img src="/brand/symbol.png" alt="" class="mt__symbol mt__fade mt__fade--symbol" aria-hidden="true" />
    <img src="/brand/wordmark.png" alt="ÉIRVOX" class="mt__wordmark mt__fade mt__fade--wordmark" />

    <span class="mt__eyebrow mt__fade mt__fade--eyebrow">MAINTENANCE</span>

    <p class="mt__message mt__fade mt__fade--message">{message}</p>

    <div class="mt__rule mt__fade mt__fade--footer" aria-hidden="true"></div>
    <p class="mt__support mt__fade mt__fade--footer">
      Need to reach us in the meantime?
      <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
    </p>

    <div class="mt__social mt__fade mt__fade--footer">
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

    <div class="mt__legal mt__fade mt__fade--footer">
      <a href="#/privacy">Privacy</a>
      <span aria-hidden="true">·</span>
      <a href="#/terms">Terms</a>
      <span aria-hidden="true">·</span>
      <a href="#/cookies">Cookies</a>
    </div>
  </div>
</main>

<style>
  .mt {
    min-height: 100vh;
    background: var(--evx-paper);
    color: var(--evx-ink);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
  }
  .mt__inner {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .mt__symbol {
    height: 48px;
    width: 48px;
    margin-bottom: 22px;
  }
  .mt__wordmark {
    height: 48px;
    width: auto;
    margin-bottom: 28px;
  }

  .mt__eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #E8742C;
    margin-bottom: 20px;
  }

  .mt__message {
    font-family: 'Inter Tight', system-ui, sans-serif;
    font-size: 17px;
    line-height: 1.55;
    color: var(--evx-ink);
    max-width: 420px;
    margin-bottom: 56px;
  }

  .mt__rule {
    width: 120px;
    height: 1px;
    background: var(--evx-rule-light);
    margin-bottom: 20px;
  }
  .mt__support {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
  .mt__support a {
    color: var(--evx-ink);
    text-decoration: none;
    border-bottom: 1px solid var(--evx-rule-light);
    transition: border-color 200ms ease;
  }
  .mt__support a:hover { border-bottom-color: #E8742C; }

  .mt__social {
    display: flex;
    gap: 18px;
    margin-top: 24px;
  }
  .mt__social a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--evx-ink-soft);
    transition: color 200ms ease;
  }
  .mt__social a:hover { color: #E8742C; }

  .mt__legal {
    display: flex;
    gap: 8px;
    margin-top: 18px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
  .mt__legal a {
    color: var(--evx-ink-soft);
    text-decoration: none;
    transition: color 200ms ease;
  }
  .mt__legal a:hover { color: #E8742C; }

  /* Sequential fade-in */
  .mt__fade {
    opacity: 0;
    animation-fill-mode: forwards;
    animation-timing-function: ease-out;
  }
  .mt__fade--symbol   { animation: mt-fade 1s ease-out 0.2s forwards; }
  .mt__fade--wordmark { animation: mt-fade 1s ease-out 0.5s forwards; }
  .mt__fade--eyebrow  { animation: mt-fade 0.8s ease-out 0.9s forwards; }
  .mt__fade--message  { animation: mt-fade 0.8s ease-out 1.2s forwards; }
  .mt__fade--footer   { animation: mt-fade 0.6s ease-out 1.6s forwards; }

  @keyframes mt-fade { from { opacity: 0; } to { opacity: 1; } }

  @media (max-width: 600px) {
    .mt { padding: 48px 20px; }
    .mt__symbol { height: 36px; width: 36px; margin-bottom: 16px; }
    .mt__wordmark { height: 36px; margin-bottom: 22px; }
    .mt__message { font-size: 16px; margin-bottom: 44px; }
  }
</style>
