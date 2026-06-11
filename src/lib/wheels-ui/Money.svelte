<script lang="ts">
  export let price: number;
  export let was: number | null = null;
  export let size = 17;
  export let dim = false;
</script>

<span class="money" style="font-family: var(--evx-font-mono);">
  <span class="money__price"
        style="font-size: {size}px; color: {dim ? 'var(--evx-paper-soft)' : 'var(--evx-paper)'};">
    €{price}
  </span>
  {#if was && was > price}
    <span class="money__was" style="font-size: {Math.round(size * 0.72)}px;">Was €{was}</span>
  {/if}
</span>

<style>
  .money {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
  }
  .money__price { font-weight: 500; letter-spacing: 0.01em; }
  /* "Was €X" — quiet mono reference price, never a strikethrough
     (lockfile: original price reads as a prior figure, not a deletion). */
  .money__was {
    color: var(--evx-ink-soft);
    letter-spacing: 0.04em;
  }
</style>
