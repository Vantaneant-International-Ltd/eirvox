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
  </div>
</main>

<style>
  .mt {
    min-height: 100vh;
    background: #1A1A1A;
    color: #F5F2ED;
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
    filter: invert(1) brightness(1.05);
  }
  .mt__wordmark {
    height: 48px;
    width: auto;
    margin-bottom: 28px;
    filter: invert(1) brightness(1.05);
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
    color: #F5F2ED;
    max-width: 420px;
    margin-bottom: 56px;
  }

  .mt__rule {
    width: 120px;
    height: 1px;
    background: #2C2C2C;
    margin-bottom: 20px;
  }
  .mt__support {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #5C5C5C;
  }
  .mt__support a {
    color: #F5F2ED;
    text-decoration: none;
    border-bottom: 1px solid #2C2C2C;
    transition: border-color 200ms ease;
  }
  .mt__support a:hover { border-bottom-color: #E8742C; }

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
