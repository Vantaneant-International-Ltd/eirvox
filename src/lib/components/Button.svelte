<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'ghost' = 'primary'
  export let href: string | undefined = undefined
  export let disabled: boolean = false
</script>

{#if href && !disabled}
  <a class="btn btn-{variant}" href={href}>
    <slot />{#if variant === 'ghost'}<span class="arrow">&nbsp;&rarr;</span>{/if}
    {#if variant === 'ghost'}<span class="underline" aria-hidden="true"></span>{/if}
  </a>
{:else}
  <button class="btn btn-{variant}" {disabled} type="button">
    <slot />{#if variant === 'ghost'}<span class="arrow">&nbsp;&rarr;</span>{/if}
    {#if variant === 'ghost'}<span class="underline" aria-hidden="true"></span>{/if}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    font-family: var(--evx-font-sans);
    font-size: var(--evx-type-body-size);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    cursor: pointer;
    border: none;
    background: none;
    -webkit-appearance: none;
    appearance: none;
    position: relative;
    line-height: 1;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* PRIMARY ─────────────────────────────────────────────────────────────── */

  .btn-primary {
    padding: var(--evx-space-md) var(--evx-space-xl);
    background-color: var(--evx-fox-orange);
    color: var(--evx-white);
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.85;
    transition: var(--evx-transition);
  }

  /* SECONDARY ────────────────────────────────────────────────────────────── */

  .btn-secondary {
    padding: var(--evx-space-md) var(--evx-space-xl);
    background-color: transparent;
    color: var(--evx-warm-black);
    border: 1px solid var(--evx-warm-black);
  }

  .btn-secondary:hover:not(:disabled) {
    opacity: 0.85;
    transition: var(--evx-transition);
  }

  /* GHOST ─────────────────────────────────────────────────────────────────  */

  .btn-ghost {
    padding: 0;
    background-color: transparent;
    color: var(--evx-warm-black);
    border: none;
    letter-spacing: 0;
    text-transform: none;
    font-weight: var(--evx-type-body-weight);
  }

  .arrow {
    display: inline;
  }

  .underline {
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--evx-warm-black);
    opacity: 0;
    transition: var(--evx-transition);
  }

  .btn-ghost:hover .underline {
    opacity: 1;
  }
</style>
