<script lang="ts">
  import type { SellerTier } from '../data/listings';

  export let tier: SellerTier;
  export let name: string;
  export let rating: number = 0;
  export let compact: boolean = false;
</script>

<span class="pill pill--{tier.toLowerCase()}" class:pill--compact={compact}>
  {#if tier === 'HOUSE'}
    <span class="pill__tier">{compact ? 'HOUSE' : 'HOUSE ÉIRVOX'}</span>
  {:else if tier === 'ATELIER'}
    <span class="pill__tier">ATELIER</span>
    {#if !compact}
      <span class="pill__sep">·</span>
      <span class="pill__name">{name}</span>
      {#if rating > 0}
        <span class="pill__sep">·</span>
        <span class="pill__rating">{rating.toFixed(2)}</span>
      {/if}
    {/if}
  {:else}
    <span class="pill__tier">VERIFIED</span>
    {#if !compact}
      <span class="pill__sep">·</span>
      <span class="pill__name">{name}</span>
      {#if rating > 0}
        <span class="pill__sep">·</span>
        <span class="pill__rating">{rating.toFixed(2)}</span>
      {/if}
    {/if}
  {/if}
</span>

<style>
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--evx-font-mono);
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    padding: 3px 7px;
    white-space: nowrap;
    line-height: 1.4;
    max-width: 100%;
    overflow: hidden;
  }

  .pill--house {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
  }

  .pill--atelier {
    border: 1px solid var(--evx-warm-black);
    color: var(--evx-warm-black);
    background: transparent;
  }

  .pill--verified {
    border: 1px solid var(--evx-rule-light);
    color: var(--evx-ink-soft);
    background: transparent;
  }

  .pill__name {
    font-weight: 400;
    letter-spacing: 0.03em;
    text-transform: none;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pill__sep { opacity: 0.5; }

  .pill__rating { font-size: 9px; }
</style>
