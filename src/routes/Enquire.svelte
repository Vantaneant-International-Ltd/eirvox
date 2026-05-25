<script lang="ts">
  import Layout from '../lib/components/Layout.svelte'
  import Input from '../lib/components/Input.svelte'
  import Textarea from '../lib/components/Textarea.svelte'
  import Button from '../lib/components/Button.svelte'

  let formData = {
    name: '',
    email: '',
    issue: '',
    message: '',
  }

  let errors: Record<string, string> = {}
  let submitted = false

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validate = () => {
    errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email'
    }

    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: Event) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    submitted = true
  }

  const handleReset = () => {
    submitted = false
    formData = {
      name: '',
      email: '',
      issue: '',
      message: '',
    }
    errors = {}
  }
</script>

<Layout breadcrumb={['House', 'Enquire']} footerVariant="compact">
  <div class="page-container enquire-container">
    {#if !submitted}
      <div class="enquire-layout">
        <!-- LEFT COLUMN: LETTERHEAD -->
        <div class="left-column">
          <span class="evx-label">TO · ÉIRVOX</span>
          <h1 class="letterhead-headline">Renato and Kevin review every enquiry directly.</h1>
          <p class="letterhead-body">
            We don't run a chat widget. We don't send auto-replies. Renato or Kevin will reply. Allow 48 hours.
          </p>

          <div class="contact-block">
            <span class="evx-label">DIRECT</span>
            <a href="mailto:support@eirvox.ie" class="contact-link">support@eirvox.ie</a>
          </div>

          <div class="contact-block">
            <span class="evx-label">ADDRESS</span>
            <p class="contact-text">ÉirVox Systems Ltd</p>
            <p class="contact-text">Dublin, Ireland</p>
          </div>
        </div>

        <!-- RIGHT COLUMN: FORM -->
        <div class="right-column">
          <div class="form-header">
            <span class="evx-label">ENQUIRY</span>
            <span class="evx-caption form-ref">EIRVOX-ENQ-001</span>
          </div>

          <form on:submit={handleSubmit} class="enquiry-form">
            <div class="form-group">
              <Input
                label="NAME"
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
                label="EMAIL"
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
                label="WHICH ISSUE"
                name="issue"
                type="text"
                placeholder="e.g. Issue 001 · Mercedes-AMG GT"
                bind:value={formData.issue}
              />
            </div>

            <div class="form-group">
              <Textarea
                label="MESSAGE"
                name="message"
                placeholder="tell us briefly which piece, and which car."
                bind:value={formData.message}
              />
            </div>

            <div class="form-actions">
              <Button variant="primary" type="submit">Send the enquiry</Button>
              <p class="form-note">We aim to reply within 48 hours during the working week.</p>
            </div>
          </form>
        </div>
      </div>
    {:else}
      <div class="confirmation">
        <h2 class="confirmation-headline">Thank you. We'll reply within 48 hours.</h2>
        <Button variant="ghost" href="/">Back to the house</Button>
      </div>
    {/if}
  </div>
</Layout>

<style>
  .enquire-container {
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }

  .enquire-layout {
    display: grid;
    grid-template-columns: 1fr 1.25fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  /* ── LEFT COLUMN ─────────────────────────────────────────────────────── */

  .left-column {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
  }

  .left-column > .evx-label {
    color: var(--evx-ink-soft);
  }

  .letterhead-headline {
    font-family: var(--evx-type-h1-family);
    font-weight: var(--evx-type-h1-weight);
    font-size: var(--evx-type-h1-size);
    line-height: var(--evx-type-h1-lh);
    letter-spacing: var(--evx-type-h1-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .letterhead-body {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  .contact-block {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .contact-block > .evx-label {
    color: var(--evx-ink-soft);
  }

  .contact-link {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    text-decoration: underline;
    text-decoration-color: var(--evx-rule-light);
    text-underline-offset: 3px;
    transition: var(--evx-transition);
  }

  .contact-link:hover {
    opacity: 0.65;
  }

  .contact-text {
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── RIGHT COLUMN ────────────────────────────────────────────────────── */

  .right-column {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
    max-width: 500px;
  }

  .form-header {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .form-header > .evx-label {
    color: var(--evx-ink-soft);
  }

  .form-ref {
    color: var(--evx-ink-soft);
  }

  .enquiry-form {
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
  }

  .form-actions {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    margin-top: var(--evx-space-md);
  }

  .form-note {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    margin: 0;
  }

  /* ── CONFIRMATION ────────────────────────────────────────────────────── */

  .confirmation {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
    max-width: 500px;
  }

  .confirmation-headline {
    font-family: var(--evx-type-h2-family);
    font-weight: var(--evx-type-h2-weight);
    font-size: var(--evx-type-h2-size);
    line-height: var(--evx-type-h2-lh);
    letter-spacing: var(--evx-type-h2-ls);
    color: var(--evx-warm-black);
    margin: 0;
  }

  /* ── RESPONSIVE ──────────────────────────────────────────────────────── */

  @media (max-width: 1023px) {
    .enquire-layout {
      grid-template-columns: 1fr;
      gap: var(--evx-space-2xl);
    }

    .left-column {
      gap: var(--evx-space-xl);
    }

    .letterhead-headline {
      font-size: 32px;
    }
  }

  @media (max-width: 767px) {
    .enquire-container {
      padding-top: var(--evx-space-2xl);
      padding-bottom: var(--evx-space-2xl);
    }

    .left-column {
      gap: var(--evx-space-lg);
      margin-bottom: var(--evx-space-xl);
    }

    .letterhead-headline {
      font-size: 28px;
    }

    .enquiry-form {
      gap: var(--evx-space-xl);
    }
  }
</style>
