<script lang="ts">
  import { onMount } from 'svelte';
  import {
    submitEnquiry,
    type EnquirySubjectType,
  } from './enquiries';
  import { getCurrentUser } from './auth';

  export let subjectType: EnquirySubjectType;
  export let listingId: string | null = null;
  export let tradespersonId: string | null = null;
  export let driveIssueSlug: string | null = null;
  /** Pre-fill the message field (e.g. "I'm interested in <listing title>"). */
  export let messagePlaceholder: string = "Tell us what you'd like to know…";
  /** Compact (single-row) layout vs full (stacked). */
  export let compact: boolean = false;

  let name = '';
  let email = '';
  let phone = '';
  let message = '';

  let submitting = false;
  let submitted = false;
  let error = '';

  onMount(() => {
    // Pre-fill name only if signed in. Email is intentionally NOT
    // prefilled: the only signed-in users are admins, and prefilling
    // their login email (e.g. renato@vnta.xyz) into a public enquiry
    // form leaks the admin identity into outbound enquiries from
    // that machine. Visitors type their own email.
    const user = getCurrentUser();
    if (user) {
      const meta = user.user_metadata as Record<string, unknown> | null;
      const fullName = (meta?.full_name as string | undefined) ?? '';
      if (fullName) name = fullName;
    }
  });

  async function submit(e: Event) {
    e.preventDefault();
    if (submitting) return;
    error = '';

    submitting = true;
    const user = getCurrentUser();
    const result = await submitEnquiry({
      subject_type: subjectType,
      listing_id: listingId,
      tradesperson_id: tradespersonId,
      drive_issue_slug: driveIssueSlug,
      profile_id: user?.id ?? null,
      name,
      email,
      phone: phone || null,
      message,
    });
    submitting = false;

    if (result.ok) {
      submitted = true;
      return;
    }
    error = result.message;
  }
</script>

{#if submitted}
  <div class="enq-thanks">
    <span class="evx-label enq-thanks__label">RECEIVED</span>
    <h3 class="enq-thanks__h">We'll be in touch.</h3>
    <p class="enq-thanks__body">
      We respond to every enquiry - usually within 24 hours during the week.
    </p>
  </div>
{:else}
  <form class="enq" class:enq--compact={compact} on:submit={submit}>
    <div class="enq__row enq__row--two">
      <label class="enq__field">
        <span class="evx-caption enq__label">Name</span>
        <input type="text" required maxlength="120" bind:value={name} disabled={submitting} />
      </label>
      <label class="enq__field">
        <span class="evx-caption enq__label">Email</span>
        <input type="email" required maxlength="320" bind:value={email} disabled={submitting} />
      </label>
    </div>
    <label class="enq__field">
      <span class="evx-caption enq__label">Phone (optional)</span>
      <input type="tel" maxlength="64" bind:value={phone} disabled={submitting} />
    </label>
    <label class="enq__field">
      <span class="evx-caption enq__label">Message</span>
      <textarea
        required
        rows="4"
        maxlength="4000"
        placeholder={messagePlaceholder}
        bind:value={message}
        disabled={submitting}
      ></textarea>
    </label>

    {#if error}
      <p class="enq__error" role="alert">{error}</p>
    {/if}

    <div class="enq__actions">
      <button type="submit" class="evx-btn evx-btn--primary" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send enquiry'}
      </button>
      <span class="evx-caption enq__assurance">
        No deposit. No commitment.
      </span>
    </div>
  </form>
{/if}

<style>
  .enq {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }
  .enq__row--two {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-md);
  }
  .enq__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .enq__label { color: var(--evx-ink-soft); }
  .enq input, .enq textarea {
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    border-radius: 2px;
    color: var(--evx-warm-black);
    font-family: var(--evx-font-display);
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 200ms ease;
  }
  .enq input:focus, .enq textarea:focus {
    border-color: var(--evx-warm-black);
  }
  .enq textarea { resize: vertical; }
  .enq__error {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    color: #C9665A;
  }
  .enq__actions {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    flex-wrap: wrap;
  }
  .enq__assurance { color: var(--evx-ink-soft); }

  .enq-thanks {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    background: rgba(232, 116, 44, 0.04);
  }
  .enq-thanks__label { color: var(--evx-fox-orange); }
  .enq-thanks__h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--evx-warm-black);
    margin: 0;
  }
  .enq-thanks__body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
  }

  @media (max-width: 600px) {
    .enq__row--two { grid-template-columns: 1fr; }
  }
</style>
