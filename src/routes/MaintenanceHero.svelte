<script lang="ts">
  import { siteFlags } from '../lib/flags';

  $: message = $siteFlags.maintenance_message;
  $: supportEmail = $siteFlags.support_email;
</script>

<main class="mt">
  <!-- top bar -->
  <div class="mt__top mt__fade mt__fade--wordmark">
    <img src="/brand/wordmark.png" alt="ÉIRVOX" class="mt__wordmark-img" />
    <span class="mt__top-note">Finished in Dublin</span>
  </div>

  <!-- centre -->
  <div class="mt__centre">
    <div class="mt__inner">
      <span class="mt__eyebrow mt__fade mt__fade--eyebrow"><span class="mt__dot" aria-hidden="true"></span>Under maintenance</span>
      <h1 class="mt__headline mt__fade mt__fade--message">Back shortly.</h1>
      <p class="mt__standfirst mt__fade mt__fade--message"><span class="mt__italic">{message}</span></p>

      <a class="mt__support mt__fade mt__fade--footer" href={`mailto:${supportEmail}`}>
        <span class="mt__dot" aria-hidden="true"></span>{supportEmail}
      </a>
    </div>
  </div>

  <!-- imprint -->
  <footer class="mt__footer mt__fade mt__fade--footer">
    <span class="mt__entity">EIRVOX LIMITED · a Vantanéant International Ltd company · CRO 806648</span>
    <div class="mt__legal">
      <a href="#/privacy">Privacy</a>
      <span aria-hidden="true">·</span>
      <a href="#/terms">Terms</a>
      <span aria-hidden="true">·</span>
      <a href="#/cookies">Cookies</a>
    </div>
  </footer>
</main>

<style>
  .mt {
    min-height: 100vh;
    background:
      radial-gradient(120% 90% at 78% 0%, rgba(232,116,44,0.05), transparent 46%),
      radial-gradient(90% 70% at 12% 100%, rgba(255,255,255,0.025), transparent 50%),
      var(--evx-black);
    color: var(--evx-paper);
    display: flex;
    flex-direction: column;
  }

  .mt__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30px 40px;
    max-width: 1280px;
    margin: 0 auto;
    width: 100%;
  }
  .mt__wordmark-img { height: 30px; width: auto; display: block; filter: invert(1) brightness(1.05); }
  .mt__top-note {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }

  .mt__centre {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
  }
  .mt__inner {
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .mt__eyebrow {
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
  .mt__dot { width: 6px; height: 6px; background: var(--evx-paper-soft); flex: none; }
  /* The support action is the page's primary CTA — its dot stays the signal colour. */
  .mt__support .mt__dot { background: var(--evx-fox-orange); }

  .mt__headline {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(44px, 6.5vw, 80px);
    line-height: 0.98;
    letter-spacing: -0.035em;
    margin: 0 0 24px;
  }
  .mt__standfirst {
    font-family: var(--evx-font-display);
    font-size: 18px;
    line-height: 1.5;
    color: var(--evx-ink-soft);
    margin: 0 0 38px;
    max-width: 28em;
  }
  .mt__italic { font-family: var(--evx-font-editorial); font-style: italic; color: var(--evx-paper); }

  .mt__support {
    display: inline-flex;
    align-items: center;
    gap: 11px;
    border: 1px solid var(--evx-rule-strong);
    background: var(--evx-surface);
    color: var(--evx-paper);
    text-decoration: none;
    height: 52px;
    padding: 0 26px;
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: border-color 200ms ease;
  }
  .mt__support:hover { border-color: var(--evx-ink-soft); }

  .mt__footer {
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
  .mt__entity {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }
  .mt__legal {
    display: flex;
    gap: 8px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }
  .mt__legal a { color: var(--evx-ink-soft); text-decoration: none; transition: color 200ms ease; }
  .mt__legal a:hover { color: var(--evx-paper); }

  /* Sequential fade-in (opacity only) */
  .mt__fade { opacity: 0; animation-fill-mode: forwards; animation-timing-function: ease-out; }
  .mt__fade--wordmark { animation: mt-fade 1s ease-out 0.2s forwards; }
  .mt__fade--eyebrow  { animation: mt-fade 0.8s ease-out 0.6s forwards; }
  .mt__fade--message  { animation: mt-fade 0.8s ease-out 0.9s forwards; }
  .mt__fade--footer   { animation: mt-fade 0.6s ease-out 1.3s forwards; }
  @keyframes mt-fade { from { opacity: 0; } to { opacity: 1; } }

  @media (max-width: 600px) {
    .mt__top { padding: 22px 20px; }
    .mt__centre { padding: 32px 20px; }
    .mt__footer { padding: 20px; flex-direction: column; align-items: flex-start; }
  }
  @media (prefers-reduced-motion: reduce) {
    .mt__fade { animation: none !important; opacity: 1 !important; }
  }
</style>
