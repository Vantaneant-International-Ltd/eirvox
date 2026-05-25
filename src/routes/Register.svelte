<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Input from '../lib/components/Input.svelte'
  import Button from '../lib/components/Button.svelte'

  let formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  }

  let errors: Record<string, string> = {}
  let showMessage = false

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validate = () => {
    errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    showMessage = true
    setTimeout(() => {
      showMessage = false
    }, 4000)
  }
</script>

<Layout footerVariant="compact">
  <div class="register-container">
    <a href="/#/" class="wordmark">Éirvox</a>

    <div class="form-wrapper">
      <span class="evx-label form-label">CREATE AN ACCOUNT</span>

      <form on:submit={handleSubmit} class="auth-form">
        <div class="form-group">
          <Input
            label="FULL NAME"
            name="name"
            type="text"
            placeholder="your name"
            bind:value={formData.name}
          />
          {#if errors.name}
            <span class="error-message">{errors.name}</span>
          {/if}
        </div>

        <div class="form-group">
          <Input
            label="EMAIL ADDRESS"
            name="email"
            type="email"
            placeholder="name@studio.com"
            bind:value={formData.email}
          />
          {#if errors.email}
            <span class="error-message">{errors.email}</span>
          {/if}
        </div>

        <div class="form-group">
          <Input
            label="PASSWORD"
            name="password"
            type="password"
            placeholder="minimum 8 characters"
            bind:value={formData.password}
          />
          {#if errors.password}
            <span class="error-message">{errors.password}</span>
          {/if}
        </div>

        <div class="form-group">
          <Input
            label="CONFIRM PASSWORD"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            bind:value={formData.confirmPassword}
          />
          {#if errors.confirmPassword}
            <span class="error-message">{errors.confirmPassword}</span>
          {/if}
        </div>

        <Button variant="primary">Create account</Button>
      </form>

      {#if showMessage}
        <div class="message">Registration is not yet available. We'll notify you when it opens.</div>
      {/if}

      <p class="terms">By creating an account, you agree to our terms.</p>

      <div class="separator">
        <span class="evx-caption">or</span>
      </div>

      <p class="login-prompt">
        Already have an account? <a href="/#/login" class="ghost-link">Log in</a>
      </p>
    </div>
  </div>
</Layout>

<style>
  .register-container {
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

  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .error-message {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-fox-orange);
    animation: fadeIn 200ms ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
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

  .terms {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    text-align: center;
    margin: 0;
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

  .login-prompt {
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
    .register-container {
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
