<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';

  let email = '';
  let submitted = false;

  function submit() {
    if (email) submitted = true;
  }
</script>

<Nav />

<main class="login-page">
  <div class="login-inner page-container">

    {#if submitted}
      <div class="login-success">
        <span class="evx-label">CHECK YOUR EMAIL</span>
        <h1 class="login-success__heading">Magic link sent.</h1>
        <p class="login-success__body">
          We've sent a sign-in link to <strong>{email}</strong>.
          It expires in 15 minutes.
        </p>
        <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => submitted = false}>
          Try a different address
        </button>
      </div>
    {:else}
      <div class="login-form-wrap">
        <div class="login-header">
          <h1 class="login-header__title">Sign in to Éirvox.</h1>
          <p class="login-header__sub">
            No password needed — we'll send a sign-in link to your email.
          </p>
        </div>

        <form class="login-form" on:submit|preventDefault={submit}>
          <div class="login-field">
            <label class="evx-caption login-label" for="login-email">EMAIL ADDRESS</label>
            <input
              id="login-email"
              type="email"
              class="login-input"
              placeholder="you@studio.ie"
              bind:value={email}
              required
            />
          </div>
          <button type="submit" class="evx-btn evx-btn--primary login-submit">
            Send sign-in link →
          </button>
        </form>

        <div class="login-cohort">
          <p class="evx-caption login-cohort__text">
            Not a seller yet? Cohort 03 is open until 14 June.
          </p>
          <button class="evx-caption login-cohort__link" on:click={() => navigate('/sell/apply')}>
            Apply to sell →
          </button>
        </div>
      </div>
    {/if}

  </div>
</main>

<Footer />

<style>
  .login-page { flex: 1; display: flex; align-items: center; }

  .login-inner {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .login-form-wrap {
    width: 100%;
    max-width: 400px;
  }

  .login-header { margin-bottom: var(--evx-space-2xl); }

  .login-header__title {
    font-family: var(--evx-font-display);
    font-size: 40px;
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: var(--evx-space-md);
  }

  .login-header__sub { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); }

  .login-form { display: flex; flex-direction: column; gap: var(--evx-space-xl); margin-bottom: var(--evx-space-2xl); }

  .login-field { display: flex; flex-direction: column; gap: var(--evx-space-sm); }

  .login-label { color: var(--evx-ink-soft); }

  .login-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-warm-black);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 18px;
    color: var(--evx-warm-black);
    outline: none;
  }

  .login-input::placeholder { color: var(--evx-ink-soft); }

  .login-submit { width: 100%; }

  .login-cohort {
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .login-cohort__text { color: var(--evx-ink-soft); }

  .login-cohort__link {
    background: none;
    border: none;
    padding: 0;
    color: var(--evx-fox-orange);
    cursor: pointer;
    text-align: left;
  }

  .login-success {
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-3xl);
  }

  .login-success__heading {
    font-family: var(--evx-font-display);
    font-size: 40px;
    font-weight: 500;
    letter-spacing: -0.025em;
  }

  .login-success__body { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); }
</style>
