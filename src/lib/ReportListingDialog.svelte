<script lang="ts">
  // ============================================================
  // Self-contained "Report this listing" trigger + modal.
  // Parent passes listingId (+ optional listingTitle) and drops
  // this component anywhere; it owns its own open/closed state.
  //
  // Submits to /api/report (anonymous, service-role insert).
  // No fake success: only flips to "thanks" when the route
  // returns {ok: true}. Errors surface inline.
  // ============================================================
  import { onMount } from 'svelte';

  export let listingId: string;
  export let listingTitle: string = '';

  type Reason =
    | 'prohibited_illegal'
    | 'scam_fraud'
    | 'counterfeit'
    | 'miscategorised'
    | 'offensive'
    | 'unavailable'
    | 'other';

  const REASONS: ReadonlyArray<{ value: Reason; label: string }> = [
    { value: 'prohibited_illegal', label: 'Prohibited or illegal' },
    { value: 'scam_fraud',         label: 'Scam or fraud' },
    { value: 'counterfeit',        label: 'Counterfeit or replica' },
    { value: 'miscategorised',     label: 'Wrong category' },
    { value: 'offensive',          label: 'Offensive content' },
    { value: 'unavailable',        label: 'No longer available' },
    { value: 'other',              label: 'Other' },
  ];

  let open = false;
  let reason: Reason | '' = '';
  let detail = '';
  let email = '';
  let submitting = false;
  let error = '';
  let done = false;

  function reset() {
    reason = '';
    detail = '';
    email = '';
    submitting = false;
    error = '';
    done = false;
  }

  function openDialog() {
    reset();
    open = true;
  }

  function closeDialog() {
    open = false;
  }

  async function submit(e: Event) {
    e.preventDefault();
    if (submitting) return;
    error = '';

    if (!reason) { error = 'Please choose a reason.'; return; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      error = 'Please enter a valid email or leave it blank.';
      return;
    }

    submitting = true;
    let res: Response;
    try {
      res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          listing_id: listingId,
          reason,
          detail: detail.trim() || null,
          reporter_email: email.trim() ? email.trim().toLowerCase() : null,
        }),
      });
    } catch {
      submitting = false;
      error = 'Could not reach the server. Try again in a moment.';
      return;
    }

    submitting = false;

    const payload = await res.json().catch(() => null) as
      | { ok?: boolean; id?: string; error?: string }
      | null;

    if (res.ok && payload?.id) {
      done = true;
      return;
    }

    if (res.status === 429) {
      error = 'Too many submissions. Wait a moment and try again.';
      return;
    }
    error = payload?.error ?? 'Could not send your report. Try again.';
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) closeDialog();
  }

  onMount(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<button class="rep-trigger evx-caption" on:click={openDialog} type="button">
  Report this listing
</button>

{#if open}
  <div class="rep-back" on:click={closeDialog} role="presentation"></div>
  <div class="rep-dialog" role="dialog" aria-modal="true" aria-labelledby="rep-title">
    <header class="rep-head">
      <div class="rep-head__text">
        <span class="evx-caption rep-pre">REPORT</span>
        <h2 id="rep-title" class="rep-h">
          {#if done}Thanks. We review every report.{:else}Report this listing{/if}
        </h2>
        {#if listingTitle && !done}
          <p class="rep-sub">{listingTitle}</p>
        {/if}
      </div>
      <button class="rep-close" type="button" on:click={closeDialog} aria-label="Close">CLOSE</button>
    </header>

    <div class="rep-body">
      {#if done}
        <p class="rep-done">
          Your report has been logged. We don't always reply individually, but every report is reviewed.
        </p>
        <div class="rep-foot">
          <button type="button" class="evx-btn evx-btn--primary" on:click={closeDialog}>Done</button>
        </div>
      {:else}
        <form on:submit={submit}>
          {#if error}
            <div class="rep-err evx-caption">{error}</div>
          {/if}

          <fieldset class="rep-field">
            <legend class="rep-label evx-caption">Reason</legend>
            <div class="rep-reasons">
              {#each REASONS as r}
                <label class="rep-reason">
                  <input type="radio" bind:group={reason} value={r.value} name="report-reason" />
                  <span>{r.label}</span>
                </label>
              {/each}
            </div>
          </fieldset>

          <div class="rep-field">
            <label class="rep-label evx-caption" for="rep-detail">Details (optional)</label>
            <textarea
              id="rep-detail"
              class="rep-input rep-textarea"
              maxlength="4000"
              bind:value={detail}
              placeholder="What's wrong? Any context helps."
              rows="4"
            ></textarea>
          </div>

          <div class="rep-field">
            <label class="rep-label evx-caption" for="rep-email">Your email (optional)</label>
            <input
              id="rep-email"
              type="email"
              class="rep-input"
              maxlength="320"
              bind:value={email}
              placeholder="you@example.com"
              autocomplete="email"
            />
            <p class="rep-hint evx-caption">Only used if we need to follow up. Leave blank to stay anonymous.</p>
          </div>

          <div class="rep-foot">
            <button type="button" class="evx-btn" on:click={closeDialog} disabled={submitting}>Cancel</button>
            <button type="submit" class="evx-btn evx-btn--primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Submit report'}
            </button>
          </div>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  .rep-trigger {
    background: none;
    border: none;
    padding: 0;
    color: var(--evx-ink-soft);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--evx-rule-light);
    transition: var(--evx-transition);
  }
  .rep-trigger:hover { color: var(--evx-warm-black); text-decoration-color: var(--evx-warm-black); }

  .rep-back {
    position: fixed;
    inset: 0;
    background: rgba(26, 26, 26, 0.55);
    z-index: 90;
  }

  .rep-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, calc(100vw - 32px));
    max-height: calc(100vh - 32px);
    background: var(--evx-paper);
    z-index: 91;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  }

  .rep-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--evx-space-md);
    padding: var(--evx-space-lg) var(--evx-space-lg) var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .rep-head__text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .rep-pre { color: var(--evx-fox-orange); }
  .rep-h {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    line-height: 1.3;
  }
  .rep-sub { font-size: 13px; color: var(--evx-ink-soft); line-height: 1.5; }
  .rep-close {
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    color: var(--evx-ink-soft);
    padding: 4px 0;
    transition: var(--evx-transition);
  }
  .rep-close:hover { color: var(--evx-warm-black); }

  .rep-body {
    padding: var(--evx-space-lg);
    overflow-y: auto;
  }

  .rep-err {
    background: rgba(204, 51, 51, 0.08);
    border: 1px solid rgba(204, 51, 51, 0.25);
    color: #a02929;
    padding: 10px 12px;
    margin-bottom: var(--evx-space-md);
  }

  .rep-field {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
    margin-bottom: var(--evx-space-md);
    border: none;
    padding: 0;
  }

  .rep-label { color: var(--evx-ink-soft); }

  .rep-reasons {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
  }
  .rep-reason {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--evx-warm-black);
    cursor: pointer;
    padding: 4px 0;
  }
  .rep-reason input { margin: 0; cursor: pointer; }

  .rep-input {
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    color: var(--evx-warm-black);
    font-family: var(--evx-font-display);
    font-size: 14px;
    padding: 9px 12px;
    outline: none;
    transition: border-color 200ms ease;
    width: 100%;
  }
  .rep-input:focus { border-color: var(--evx-warm-black); }
  .rep-textarea {
    font-family: var(--evx-font-display);
    line-height: 1.5;
    resize: vertical;
    min-height: 96px;
  }
  .rep-hint { color: var(--evx-ink-soft); margin-top: 4px; }

  .rep-foot {
    display: flex;
    justify-content: flex-end;
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }

  .rep-done {
    font-size: 15px;
    line-height: 1.6;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  @media (max-width: 480px) {
    .rep-dialog { width: calc(100vw - 16px); top: 16px; left: 8px; transform: none; max-height: calc(100vh - 32px); }
  }
</style>
