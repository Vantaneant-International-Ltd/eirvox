<script lang="ts">
  export let title: string = 'Something went wrong.';
  export let message: string = 'Try refreshing the page. If the problem keeps happening, get in touch.';
  export let retry: (() => void) | undefined = undefined;
  export let variant: 'soft' | 'block' = 'block';
</script>

<div class="err err--{variant}">
  <span class="evx-label err__pre">ERROR</span>
  <h3 class="err__h">{title}</h3>
  <p class="err__sub">{message}</p>
  {#if retry}
    <button class="evx-btn evx-btn--ghost-paper err__btn" on:click={retry}>
      Try again
    </button>
  {/if}
</div>

<style>
  .err {
    padding: var(--evx-space-2xl) var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--evx-space-sm);
    max-width: 480px;
  }

  .err--block {
    border: 1px solid rgba(198, 40, 40, 0.28);
    background: rgba(198, 40, 40, 0.04);
  }

  .err--soft {
    border: 1px dashed var(--evx-rule-light);
    background: transparent;
  }

  .err__pre {
    color: #C62828;
  }

  .err__h {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    color: var(--evx-warm-black);
    letter-spacing: -0.01em;
    margin: 0;
  }

  .err__sub {
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
  }

  .err__btn {
    margin-top: var(--evx-space-sm);
  }
</style>
