<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';

  let tier: 'verified' | 'atelier' = 'atelier';
  let tradingName = '';
  let handle = '';
  let email = '';
  let phone = '';
  let city = '';
  let tradingSince = '';
  let primaryCategory = '';
  let pitch = '';
  let agreed = false;
  let submitted = false;

  function submit() {
    if (tradingName && email && phone && city && primaryCategory && pitch && agreed) {
      submitted = true;
    }
  }

  const categories = ['Automotive', 'Watches', 'Fashion', 'Tech', 'Home & Design', 'Audio & Vinyl', 'Art'];
</script>

<Nav />

<main class="apply-page">
  <div class="page-container">

    {#if submitted}
      <div class="apply-success">
        <span class="evx-label apply-success__label">APPLICATION RECEIVED</span>
        <h1 class="apply-success__heading">We'll be in touch.</h1>
        <p class="apply-success__body">
          We respond to every application — usually within five working days.
          If you're approved, you'll receive a link to book your verification call.
        </p>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/')}>
          Return to marketplace →
        </button>
      </div>
    {:else}

      <header class="apply-header">
        <button class="evx-caption apply-back" on:click={() => navigate('/sell')}>
          ← Back to seller info
        </button>
        <h1 class="apply-header__title">Applying as {tier === 'atelier' ? 'Atelier' : 'Verified'}.</h1>
        <p class="apply-header__sub">
          {#if tier === 'atelier'}
            €19/mo · 5% commission · unlimited listings · custom shop page
          {:else}
            €0/mo · 7% commission · up to 10 listings
          {/if}
        </p>
      </header>

      <!-- Tier toggle -->
      <div class="apply-tier-toggle">
        <button
          class="tier-toggle-btn"
          class:tier-toggle-btn--active={tier === 'verified'}
          on:click={() => tier = 'verified'}
        >
          Verified · 7%
        </button>
        <button
          class="tier-toggle-btn tier-toggle-btn--dark"
          class:tier-toggle-btn--dark-active={tier === 'atelier'}
          on:click={() => tier = 'atelier'}
        >
          Atelier · 5%
        </button>
      </div>

      <form class="apply-form" on:submit|preventDefault={submit}>

        <div class="apply-row">
          <div class="apply-field">
            <label class="evx-caption apply-label" for="f-name">TRADING NAME</label>
            <input id="f-name" type="text" class="apply-input" placeholder="Moss & Co." bind:value={tradingName} required />
          </div>
          <div class="apply-field">
            <label class="evx-caption apply-label" for="f-handle">HANDLE</label>
            <input id="f-handle" type="text" class="apply-input" placeholder="@mossco" bind:value={handle} />
          </div>
        </div>

        <div class="apply-row">
          <div class="apply-field">
            <label class="evx-caption apply-label" for="f-email">EMAIL</label>
            <input id="f-email" type="email" class="apply-input" placeholder="hello@moss.co" bind:value={email} required />
          </div>
          <div class="apply-field">
            <label class="evx-caption apply-label" for="f-phone">PHONE</label>
            <input id="f-phone" type="tel" class="apply-input" placeholder="+353 85 …" bind:value={phone} required />
          </div>
        </div>

        <div class="apply-row">
          <div class="apply-field">
            <label class="evx-caption apply-label" for="f-city">CITY</label>
            <input id="f-city" type="text" class="apply-input" placeholder="Dublin 4" bind:value={city} required />
          </div>
          <div class="apply-field">
            <label class="evx-caption apply-label" for="f-since">TRADING SINCE</label>
            <input id="f-since" type="text" class="apply-input" placeholder="2023" bind:value={tradingSince} />
          </div>
        </div>

        <div class="apply-field apply-field--full">
          <label class="evx-caption apply-label" for="f-category">PRIMARY CATEGORY</label>
          <select id="f-category" class="apply-input apply-select" bind:value={primaryCategory} required>
            <option value="">Select a category…</option>
            {#each categories as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </div>

        <div class="apply-field apply-field--full">
          <label class="evx-caption apply-label" for="f-pitch">WHAT DO YOU SELL, AND WHY DOES IT BELONG ON ÉIRVOX?</label>
          <textarea
            id="f-pitch"
            class="apply-input apply-textarea"
            placeholder="Modern Tudor, Omega and Cartier with full sets, sourced through a Dublin AD network…"
            bind:value={pitch}
            rows="5"
            required
          ></textarea>
        </div>

        <div class="apply-photos">
          <span class="evx-caption apply-label">PHOTO SAMPLES · OBJECT PLATES</span>
          <div class="apply-photos__placeholder evx-caption">
            + ADD PHOTOS (optional at application stage)
          </div>
        </div>

        <label class="apply-agree">
          <input type="checkbox" bind:checked={agreed} required />
          <span class="evx-caption">
            I agree to ID + phone verification, and to the ÉIRVOX Seller Terms.
            Approval includes a short video call.
          </span>
        </label>

        <button type="submit" class="evx-btn evx-btn--primary apply-submit">
          Submit application →
        </button>

      </form>

    {/if}
  </div>
</main>

<Footer />

<style>
  .apply-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .apply-success {
    padding-top: var(--evx-space-3xl);
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .apply-success__label { color: var(--evx-fox-orange); }

  .apply-success__heading {
    font-family: var(--evx-font-display);
    font-size: 44px;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .apply-success__body { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  .apply-header { padding-top: var(--evx-space-2xl); margin-bottom: var(--evx-space-xl); }

  .apply-back {
    background: none;
    border: none;
    color: var(--evx-ink-soft);
    cursor: pointer;
    padding: 0;
    margin-bottom: var(--evx-space-xl);
    display: block;
    transition: var(--evx-transition);
  }

  .apply-back:hover { color: var(--evx-warm-black); }

  .apply-header__title {
    font-family: var(--evx-font-display);
    font-size: clamp(32px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
  }

  .apply-header__sub { font-size: 14px; color: var(--evx-ink-soft); }

  .apply-tier-toggle {
    display: flex;
    gap: 0;
    margin-bottom: var(--evx-space-2xl);
  }

  .tier-toggle-btn {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.04em;
    padding: 10px 20px;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    color: var(--evx-ink-soft);
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .tier-toggle-btn--active {
    background: transparent;
    color: var(--evx-warm-black);
    border-color: var(--evx-warm-black);
  }

  .tier-toggle-btn--dark {
    border-left: none;
    background: transparent;
    color: var(--evx-ink-soft);
  }

  .tier-toggle-btn--dark-active {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border-color: var(--evx-warm-black);
  }

  .apply-form {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .apply-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-xl);
  }

  .apply-field { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .apply-field--full { }

  .apply-label { color: var(--evx-ink-soft); }

  .apply-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    outline: none;
    width: 100%;
  }

  .apply-input:focus { border-bottom-color: var(--evx-warm-black); }
  .apply-input::placeholder { color: var(--evx-ink-soft); }

  .apply-select { -webkit-appearance: none; cursor: pointer; }

  .apply-textarea { resize: vertical; min-height: 120px; }

  .apply-photos { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .apply-photos__placeholder {
    height: 100px;
    border: 1px dashed var(--evx-rule-light);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--evx-ink-soft);
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .apply-photos__placeholder:hover { border-color: var(--evx-warm-black); color: var(--evx-warm-black); }

  .apply-agree {
    display: flex;
    gap: var(--evx-space-md);
    align-items: flex-start;
    cursor: pointer;
  }

  .apply-agree input { margin-top: 2px; flex-shrink: 0; accent-color: var(--evx-fox-orange); }
  .apply-agree span { color: var(--evx-ink-soft); line-height: 1.6; }

  .apply-submit { align-self: flex-start; }

  @media (max-width: 767px) {
    .apply-row { grid-template-columns: 1fr; }
  }
</style>
