<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { signIn, signUp, resetPassword, auth, isAdmin, isSeller } from '../lib/auth';
  import { supabase } from '../lib/supabase';

  onMount(async () => {
    applySeo(seo.login());

    // PKCE foot-gun: magic-link redirects land here with `?code=…` in
    // the URL. If we don't scrub it before any outbound link click, the
    // code leaks via the Referer header. detectSessionInUrl handles the
    // exchange; we strip the query string immediately after.
    if (typeof window !== 'undefined' && window.location.search.includes('code=')) {
      try { await supabase.auth.exchangeCodeForSession(window.location.href); } catch { /* already exchanged */ }
      const cleanPath = window.location.pathname + window.location.hash;
      history.replaceState(null, '', cleanPath);
    }
  });

  type Mode = 'login' | 'signup' | 'reset';
  let mode: Mode = 'login';

  // Shared
  let email = '';
  let password = '';

  // Signup-only
  let fullName = '';
  let confirmPassword = '';

  // UI state
  let loading = false;
  let error = '';
  let success = '';

  function clearMessages() {
    error = '';
    success = '';
  }

  function switchMode(next: Mode) {
    mode = next;
    clearMessages();
  }

  function routeAfterAuth() {
    if (isAdmin()) navigate('/admin');
    else if (isSeller()) navigate('/sell/dashboard');
    else navigate('/account');
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    clearMessages();
    loading = true;

    const result = await signIn(email, password);

    loading = false;
    if (!result.ok) {
      error = result.error ?? 'Something went wrong. Try again.';
      return;
    }

    // Wait for the auth store to settle (onAuthStateChange + profile fetch).
    // `let unsub` so the callback can safely reference it when Svelte fires
    // the subscription synchronously on subscribe().
    const settled = await new Promise<boolean>((resolve) => {
      const start = Date.now();
      let unsub: (() => void) | null = null;
      unsub = auth.subscribe((s) => {
        if (s.user && !s.loading) {
          unsub?.();
          resolve(true);
        } else if (Date.now() - start > 3000) {
          unsub?.();
          resolve(false);
        }
      });
    });

    if (settled) routeAfterAuth();
    else navigate('/account');
  }

  async function handleSignup(e: Event) {
    e.preventDefault();
    clearMessages();

    if (password !== confirmPassword) {
      error = 'Passwords don\'t match.';
      return;
    }

    loading = true;
    const result = await signUp(email, password, fullName);
    loading = false;

    if (!result.ok) {
      error = result.error ?? 'Could not create account.';
      return;
    }

    success = 'Account created - check your email to confirm, then sign in.';
    // Switch to login mode but keep the email pre-filled
    password = '';
    confirmPassword = '';
    mode = 'login';
  }

  async function handleReset(e: Event) {
    e.preventDefault();
    clearMessages();
    loading = true;

    const result = await resetPassword(email);
    loading = false;

    if (!result.ok) {
      error = result.error ?? 'Could not send reset email.';
      return;
    }
    success = 'Reset link sent. Check your email - it expires in 60 minutes.';
  }
</script>

<Nav />

<main id="main-content" class="login-page">
  <div class="login-inner page-container">
    <div class="login-form-wrap">

      <!-- Header -->
      <div class="login-header">
        {#if mode === 'reset'}
          <span class="evx-caption login-header__pre">RECOVER ACCESS</span>
          <h1 class="login-header__title">Reset your password.</h1>
          <p class="login-header__sub">
            Enter the email you signed up with and we'll send a reset link.
          </p>
        {:else}
          <span class="evx-caption login-header__pre">ÉIRVOX · ACCOUNT</span>
          <h1 class="login-header__title">
            {mode === 'login' ? 'Sign in to Éirvox.' : 'Create your account.'}
          </h1>
          <p class="login-header__sub">
            {#if mode === 'login'}
              Welcome back. Sign in to manage your reservations, messages, and saved items.
            {:else}
              Free account. No newsletter spam. You can apply to sell or list on TRADE separately.
            {/if}
          </p>
        {/if}
      </div>

      <!-- Mode tabs (only when not resetting) -->
      {#if mode !== 'reset'}
        <div class="login-tabs" role="tablist" aria-label="Account mode">
          <button
            class="login-tab"
            class:login-tab--active={mode === 'login'}
            on:click={() => switchMode('login')}
            role="tab"
            aria-selected={mode === 'login'}
            type="button"
          >Log in</button>
          <button
            class="login-tab"
            class:login-tab--active={mode === 'signup'}
            on:click={() => switchMode('signup')}
            role="tab"
            aria-selected={mode === 'signup'}
            type="button"
          >Sign up</button>
        </div>
      {/if}

      <!-- Status messages -->
      {#if error}
        <div class="login-msg login-msg--error" role="alert">
          <span class="evx-label login-msg__label">ERROR</span>
          <p>{error}</p>
        </div>
      {/if}
      {#if success}
        <div class="login-msg login-msg--ok" role="status">
          <span class="evx-label login-msg__label">OK</span>
          <p>{success}</p>
        </div>
      {/if}

      <!-- LOGIN FORM -->
      {#if mode === 'login'}
        <form class="login-form" on:submit={handleLogin}>
          <div class="login-field">
            <label class="evx-caption login-label" for="login-email">EMAIL ADDRESS</label>
            <input
              id="login-email"
              type="email"
              class="login-input"
              placeholder="you@studio.ie"
              bind:value={email}
              required
              autocomplete="email"
              disabled={loading}
            />
          </div>

          <div class="login-field">
            <div class="login-label-row">
              <label class="evx-caption login-label" for="login-password">PASSWORD</label>
              <button type="button" class="login-forgot" on:click={() => switchMode('reset')}>
                Forgot password?
              </button>
            </div>
            <input
              id="login-password"
              type="password"
              class="login-input"
              placeholder="••••••••"
              bind:value={password}
              required
              autocomplete="current-password"
              disabled={loading}
            />
          </div>

          <button type="submit" class="evx-btn evx-btn--primary login-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <p class="login-switch evx-caption">
            New to Éirvox?
            <button type="button" class="login-switch__link" on:click={() => switchMode('signup')}>
              Create an account →
            </button>
          </p>
        </form>

      <!-- SIGNUP FORM -->
      {:else if mode === 'signup'}
        <form class="login-form" on:submit={handleSignup}>
          <div class="login-field">
            <label class="evx-caption login-label" for="signup-name">FULL NAME</label>
            <input
              id="signup-name"
              type="text"
              class="login-input"
              placeholder="Renato Gusani"
              bind:value={fullName}
              required
              autocomplete="name"
              disabled={loading}
            />
          </div>

          <div class="login-field">
            <label class="evx-caption login-label" for="signup-email">EMAIL ADDRESS</label>
            <input
              id="signup-email"
              type="email"
              class="login-input"
              placeholder="you@studio.ie"
              bind:value={email}
              required
              autocomplete="email"
              disabled={loading}
            />
          </div>

          <div class="login-field">
            <label class="evx-caption login-label" for="signup-password">PASSWORD</label>
            <input
              id="signup-password"
              type="password"
              class="login-input"
              placeholder="At least 8 characters"
              bind:value={password}
              required
              minlength="8"
              autocomplete="new-password"
              disabled={loading}
            />
          </div>

          <div class="login-field">
            <label class="evx-caption login-label" for="signup-confirm">CONFIRM PASSWORD</label>
            <input
              id="signup-confirm"
              type="password"
              class="login-input"
              placeholder="Repeat password"
              bind:value={confirmPassword}
              required
              minlength="8"
              autocomplete="new-password"
              disabled={loading}
            />
          </div>

          <button type="submit" class="evx-btn evx-btn--primary login-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account →'}
          </button>

          <p class="login-fine evx-caption">
            By creating an account, you agree to our
            <button type="button" class="login-fine__link" on:click={() => navigate('/terms')}>Terms &amp; Conditions</button>
            and
            <button type="button" class="login-fine__link" on:click={() => navigate('/privacy')}>Privacy Policy</button>.
          </p>

          <p class="login-switch evx-caption">
            Already have an account?
            <button type="button" class="login-switch__link" on:click={() => switchMode('login')}>
              Sign in →
            </button>
          </p>
        </form>

      <!-- PASSWORD RESET FORM -->
      {:else}
        <form class="login-form" on:submit={handleReset}>
          <div class="login-field">
            <label class="evx-caption login-label" for="reset-email">EMAIL ADDRESS</label>
            <input
              id="reset-email"
              type="email"
              class="login-input"
              placeholder="you@studio.ie"
              bind:value={email}
              required
              autocomplete="email"
              disabled={loading}
            />
          </div>

          <button type="submit" class="evx-btn evx-btn--primary login-submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link →'}
          </button>

          <p class="login-switch evx-caption">
            Remembered it?
            <button type="button" class="login-switch__link" on:click={() => switchMode('login')}>
              Back to sign in →
            </button>
          </p>
        </form>
      {/if}

    </div>
  </div>
</main>

<Footer />

<style>
  .login-page { flex: 1; display: flex; align-items: flex-start; }

  .login-inner {
    display: flex;
    justify-content: center;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
    width: 100%;
  }

  .login-form-wrap { width: 100%; max-width: 420px; }

  /* Header */
  .login-header { margin-bottom: var(--evx-space-xl); }
  .login-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .login-header__title {
    font-family: var(--evx-font-display);
    font-size: 40px;
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: var(--evx-space-md);
    line-height: 1.05;
  }
  .login-header__sub { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); }

  /* Tabs */
  .login-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
  }
  .login-tab {
    padding: var(--evx-space-sm) 0;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-ink-soft);
    transition: var(--evx-transition);
  }
  .login-tab--active {
    color: var(--evx-warm-black);
    border-bottom-color: var(--evx-fox-orange);
  }
  .login-tab:hover:not(.login-tab--active) { color: var(--evx-warm-black); opacity: 0.70; }

  /* Status messages */
  .login-msg {
    padding: var(--evx-space-md);
    margin-bottom: var(--evx-space-lg);
    border-left: 2px solid;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }
  .login-msg--error {
    background: rgba(232, 116, 44, 0.06);
    border-left-color: var(--evx-fox-orange);
  }
  .login-msg--error .login-msg__label { color: var(--evx-fox-orange); }
  .login-msg--ok {
    background: rgba(74, 140, 91, 0.06);
    border-left-color: #4a8c5b;
  }
  .login-msg--ok .login-msg__label { color: #4a8c5b; }
  .login-msg p {
    font-size: 14px;
    line-height: 1.55;
    color: var(--evx-warm-black);
  }

  /* Form */
  .login-form {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    margin-bottom: var(--evx-space-xl);
  }

  .login-field { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .login-label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .login-label { color: var(--evx-ink-soft); }
  .login-forgot {
    background: none; border: none; padding: 0;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--evx-fox-orange);
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .login-forgot:hover { opacity: 0.70; }

  .login-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 16px;
    color: var(--evx-warm-black);
    outline: none;
    transition: border-color 200ms ease;
  }
  .login-input::placeholder { color: var(--evx-ink-soft); }
  .login-input:focus { border-bottom-color: var(--evx-warm-black); }
  .login-input:disabled { opacity: 0.55; cursor: not-allowed; }

  .login-submit { width: 100%; margin-top: var(--evx-space-sm); }
  .login-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .login-submit:disabled:hover { opacity: 0.55; }

  .login-fine { color: var(--evx-ink-soft); line-height: 1.6; }
  .login-fine__link {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    font-family: inherit;
    font-size: inherit;
    letter-spacing: inherit;
  }

  .login-switch {
    color: var(--evx-ink-soft);
    text-align: center;
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }
  .login-switch__link {
    background: none; border: none; padding: 0;
    color: var(--evx-fox-orange);
    cursor: pointer;
    font-family: inherit;
    font-size: inherit;
    letter-spacing: inherit;
    margin-left: 4px;
    transition: var(--evx-transition);
  }
  .login-switch__link:hover { opacity: 0.70; }
</style>
