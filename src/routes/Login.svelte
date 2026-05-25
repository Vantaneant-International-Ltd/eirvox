<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Input from '../lib/components/Input.svelte'
  import Button from '../lib/components/Button.svelte'

  let formData = {
    email: '',
    password: '',
  }

  let submitted = false
  let showMessage = false

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    showMessage = true
    setTimeout(() => {
      showMessage = false
    }, 4000)
  }
</script>

<Layout footerVariant="compact">
  <div class="login-container">
    <a href="/#/" class="wordmark">Éirvox</a>

    <div class="form-wrapper">
      <span class="evx-label form-label">LOG IN</span>

      <form on:submit={handleSubmit} class="auth-form">
        <Input
          label="EMAIL ADDRESS"
          name="email"
          type="email"
          placeholder="name@studio.com"
          bind:value={formData.email}
        />

        <Input
          label="PASSWORD"
          name="password"
          type="password"
          placeholder="••••••••"
          bind:value={formData.password}
        />

        <Button variant="primary">Log in</Button>
      </form>

      {#if showMessage}
        <div class="message">Login is not yet available. We're building this.</div>
      {/if}

      <button type="button" class="forgot-link">Forgot your password?</button>

      <div class="separator">
        <span class="evx-caption">or</span>
      </div>

      <p class="signup-prompt">
        Don't have an account? <a href="/#/register" class="ghost-link">Register</a>
      </p>
    </div>
  </div>
</Layout>

<style>
  .login-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .wordmark {
    font-family: var(--evx-font-sans);
    font-weight: 500;
    font-size: 28px;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-3xl);
    text-decoration: none;
    transition: var(--evx-transition);
  }

  .wordmark:hover {
    opacity: 0.65;
  }

  .form-wrapper {
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
  }

  .form-label {
    text-align: center;
    color: var(--evx-ink-soft);
    display: block;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
  }

  .message {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-fox-orange);
    text-align: center;
    padding: var(--evx-space-md);
    background-color: rgba(232, 116, 44, 0.05);
    border: 1px solid rgba(232, 116, 44, 0.2);
  }

  .forgot-link {
    font-family: var(--evx-font-sans);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    text-align: center;
    text-decoration: underline;
    text-decoration-color: var(--evx-rule-light);
    text-underline-offset: 3px;
    transition: var(--evx-transition);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    appearance: none;
    -webkit-appearance: none;
  }

  .forgot-link:hover {
    opacity: 0.65;
  }

  .separator {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    margin: var(--evx-space-lg) 0;
  }

  .separator::before,
  .separator::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--evx-rule-light);
  }

  .separator .evx-caption {
    color: var(--evx-ink-soft);
  }

  .signup-prompt {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    text-align: center;
    margin: 0;
  }

  .ghost-link {
    font-weight: var(--evx-type-body-weight);
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-decoration-color: var(--evx-rule-light);
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }

  .ghost-link:hover {
    opacity: 0.65;
  }

  @media (max-width: 767px) {
    .login-container {
      padding-top: var(--evx-space-2xl);
    }

    .form-wrapper {
      gap: var(--evx-space-xl);
    }

    .auth-form {
      gap: var(--evx-space-xl);
    }
  }
</style>
