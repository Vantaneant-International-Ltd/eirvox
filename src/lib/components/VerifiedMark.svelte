<script lang="ts">
  export let compact: boolean = false
</script>

<div class="verified">
  <div class="badge-row">
    <span class="mark" aria-hidden="true"></span>
    <span class="badge-text">Sold by ÉIRVOX · Verified</span>
  </div>
  {#if !compact}
    <p class="escrow-text">Payment held in escrow until delivery confirmed.</p>
  {/if}
</div>

<style>
  .verified {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .badge-row {
    display: flex;
    align-items: center;
    gap: var(--evx-space-sm);
  }

  .mark {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: var(--evx-fox-orange);
    flex-shrink: 0;
  }

  .badge-text {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-warm-black);
  }

  .escrow-text {
    font-family: var(--evx-type-caption-family);
    font-weight: var(--evx-type-caption-weight);
    font-size: var(--evx-type-caption-size);
    line-height: var(--evx-type-caption-lh);
    letter-spacing: var(--evx-type-caption-ls);
    color: var(--evx-ink-soft);
    padding-left: calc(8px + var(--evx-space-sm));
    margin: 0;
  }
</style>
