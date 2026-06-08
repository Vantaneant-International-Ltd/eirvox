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
    <span class="money__was" style="font-size: {Math.round(size * 0.74)}px;">€{was}</span>
  {/if}
</span>

<style>
  .money {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
  }
  .money__price { font-weight: 500; letter-spacing: 0.01em; }
  .money__was {
    color: var(--evx-ink-soft);
    text-decoration: line-through;
    text-decoration-color: rgba(140, 134, 124, 0.6);
  }
</style>
