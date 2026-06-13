<script lang="ts">
  // Style chip used in the wheel detail finish picker and the finder
  // result panel. Optionally renders a small accent_hex swatch on the
  // left. accent_hex comes from listing_variants.accent_hex (blue / red
  // / null); it is a PRODUCT-FINISH indicator only and must never bleed
  // into UI accent colour.
  export let label: string;
  export let accentHex: string | null = null;   // wheel finish colour, e.g. #2E5BBA
  export let active = false;
  export let disabled = false;
</script>

<button class="chip" class:chip--active={active} class:chip--disabled={disabled}
        type="button" {disabled} on:click>
  {#if accentHex}
    <span class="chip__swatch" style="background: {accentHex};" aria-hidden="true"></span>
  {/if}
  <span class="chip__label">{label}</span>
  {#if disabled}
    <span class="chip__soldout">Sold out</span>
  {/if}
</button>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    border-radius: 2px;
    font-family: var(--evx-font-display);
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    color: var(--evx-ink-soft);
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
  }
  .chip:hover:not(:disabled):not(.chip--disabled) {
    border-color: var(--evx-ink-soft);
    color: var(--evx-ink);
  }
  .chip--active {
    background: var(--evx-ink);
    color: var(--evx-paper);
    border-color: var(--evx-ink);
  }
  .chip--disabled { opacity: 0.4; cursor: not-allowed; }

  .chip__swatch {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.18);
    box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.4);
  }
  .chip--active .chip__swatch { border-color: rgba(0, 0, 0, 0.25); }

  .chip__label { line-height: 1; }
  .chip__soldout {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-faint);
  }
</style>
