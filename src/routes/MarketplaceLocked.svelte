<script lang="ts">
  // ============================================================
  // /marketplace, the lock.
  //
  // The marketplace is built (categories, listings, seller flows,
  // TRADE, messaging) and sits behind this page. It opens one category
  // at a time, each when the verification operation behind it exists.
  //
  // Every gated marketplace path routes here instead of a hard 404, so
  // a visitor who reaches one gets an explanation rather than a wall.
  //
  // Email capture writes to the same waitlist edge function as the
  // coming-soon gate, tagged source='marketplace' so the two lists stay
  // separable in /admin/waitlist.
  //
  // No category names are promised, no dates, no counts, nothing here
  // commits to a thing that isn't operationally true yet.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { submitWaitlist, isValidEmail } from '../lib/waitlist';

  const STORAGE_KEY = 'eirvox_marketplace_waitlist';

  let email = '';
  let subscribed = false;
  let submitting = false;
  let errorMsg = '';

  onMount(() => {
    applySeo({
      title: 'Marketplace',
      description: 'A curated market for enthusiast objects, opening one category at a time. Join the list.',
      path: '/marketplace',
    });
    try { if (localStorage.getItem(STORAGE_KEY)) subscribed = true; } catch (e) { /* private mode */ }
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
    const result = await submitWaitlist(value, 'marketplace');
    submitting = false;

    // A duplicate means they're already on the list, same outcome.
    if (result.ok || result.reason === 'duplicate') {
      try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode */ }
      subscribed = true;
      if (result.ok === false) errorMsg = result.message;
      return;
    }

    errorMsg = result.message;
  }
</script>

<Nav />

<main id="main-content" class="mk">

  <section class="mk__head page-container">
    <span class="evx-label">MARKETPLACE · NOT OPEN YET</span>
    <h1 class="evx-display mk__title">A market you don't have to<br />second-guess.</h1>
    <p class="evx-lede mk__lede">
      The marketplace is built. It isn't open, because opening a category before we can
      verify what's in it would make the whole thing worth less than nothing.
    </p>
    <p class="evx-lede mk__lede">
      <span class="evx-editorial">Fewer, better things, and the truth about all of them.</span>
    </p>
  </section>

  <!-- How it opens -->
  <section class="evx-section evx-band">
    <div class="page-container">
      <span class="evx-label">HOW IT OPENS</span>
      <ol class="mk__steps">
        <li class="mk__step">
          <span class="evx-label mk__num">01</span>
          <strong>One category at a time</strong>
          <p>Not a catalogue of everything on day one. A category opens when there's a real operation behind it.</p>
        </li>
        <li class="mk__step">
          <span class="evx-label mk__num">02</span>
          <strong>Verified where we can verify</strong>
          <p>We start where we can put our own hands on the thing, and widen out from there.</p>
        </li>
        <li class="mk__step">
          <span class="evx-label mk__num">03</span>
          <strong>Sellers are admitted</strong>
          <p>Not open signup. Sellers apply and we review them before anything of theirs goes up.</p>
        </li>
      </ol>
    </div>
  </section>

  <!-- Capture -->
  <section class="evx-section evx-dark">
    <div class="page-container mk__capture">
      <div>
        <h2 class="evx-heading mk__cap-h">Know when it opens.</h2>
        <p class="evx-lede">
          One email when the first category is live. Nothing else, and you can leave the list any time.
        </p>
      </div>

      {#if subscribed}
        <p class="mk__done">You're on the list. We'll write once, when there's something real to open.</p>
      {:else}
        <form class="mk__form" on:submit={submit}>
          <label class="sr-only" for="mk-email">Email address</label>
          <input
            id="mk-email"
            type="email"
            class="mk__input"
            placeholder="you@example.com"
            autocomplete="email"
            bind:value={email}
            disabled={submitting}
          />
          <button class="evx-btn evx-btn--primary" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Join the list'}
          </button>
          {#if errorMsg}<p class="mk__err">{errorMsg}</p>{/if}
        </form>
      {/if}
    </div>
  </section>

  <!-- Back to the shop -->
  <section class="evx-section--tight">
    <div class="page-container mk__back">
      <p class="evx-lede">In the meantime, the wheel shop is open.</p>
      <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/wheels')}>See the shop →</button>
    </div>
  </section>
</main>

<Footer />

<style>
  .mk__head { padding-top: var(--evx-space-3xl); padding-bottom: var(--evx-space-2xl); }
  .mk__title { margin-top: var(--evx-space-md); max-width: 18ch; }
  .mk__lede { margin-top: var(--evx-space-lg); }

  .mk__steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-xl);
    margin-top: var(--evx-space-xl);
  }
  .mk__step {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-ink);
  }
  .mk__num { color: var(--evx-ink-faint); }
  .mk__step strong { font-size: 17px; font-weight: 500; letter-spacing: -0.015em; }
  .mk__step p { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }

  .mk__capture {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--evx-space-2xl);
    align-items: center;
  }
  .mk__cap-h { color: #FFFFFF; }
  .mk__capture .evx-lede { margin-top: var(--evx-space-md); }

  .mk__form { display: flex; flex-wrap: wrap; gap: var(--evx-space-sm); }
  .mk__input {
    flex: 1 1 240px;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: #FFFFFF;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.28);
    padding: 13px 14px;
  }
  .mk__input::placeholder { color: rgba(255, 255, 255, 0.38); }
  .mk__input:focus-visible { border-color: var(--evx-fox-orange); }
  .mk__err {
    flex-basis: 100%;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-fox-orange);
  }
  .mk__done {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.04em;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.78);
    border-left: 1px solid var(--evx-fox-orange);
    padding-left: var(--evx-space-md);
  }

  .mk__back {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-lg);
    flex-wrap: wrap;
  }

  @media (max-width: 1023px) {
    .mk__steps { grid-template-columns: 1fr; }
    .mk__capture { grid-template-columns: 1fr; align-items: start; }
  }
</style>
