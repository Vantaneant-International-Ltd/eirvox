<script lang="ts">
  export let variant: 'primary' | 'champagne' | 'ghost' | 'solid' | 'quiet' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let full = false;
  export let disabled = false;
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let href: string | null = null;
</script>

{#if href}
  <a class="btn btn--{variant} btn--{size}" class:btn--full={full} class:btn--disabled={disabled} {href}>
    <slot />
  </a>
{:else}
  <button class="btn btn--{variant} btn--{size}" class:btn--full={full} {disabled} {type} on:click>
    <slot />
  </button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    font-family: var(--evx-font-display);
    font-weight: 500;
    letter-spacing: 0.005em;
    border: none;
    border-radius: 2px;
    white-space: nowrap;
    cursor: pointer;
    text-decoration: none;
    transition: opacity 180ms ease, background 180ms ease, border-color 180ms ease;
  }
  .btn:hover:not(:disabled):not(.btn--disabled) { opacity: 0.86; }
  .btn:disabled, .btn--disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  .btn--full { width: 100%; }

  .btn--sm { font-size: 12.5px; padding: 10px 16px; }
  .btn--md { font-size: 13.5px; padding: 14px 22px; }
  .btn--lg { font-size: 15px;   padding: 17px 26px; }

  .btn--primary   { background: var(--evx-fox-orange); color: #fff; }
  .btn--champagne { background: var(--evx-champagne); color: #1a150a; }
  .btn--ghost     { background: transparent; color: var(--evx-paper); border: 1px solid var(--evx-rule-strong); }
  .btn--solid     { background: var(--evx-paper); color: var(--evx-black); }
  .btn--quiet     { background: rgba(244,241,236,0.06); color: var(--evx-paper); }
</style>
