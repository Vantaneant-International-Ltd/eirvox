<script lang="ts">
  // Compact tier tag used on the detail header. DRIVE = champagne pill;
  // STANDARD = quiet outlined chip. Single source of the only champagne
  // chrome on the site.
  export let tier: 'DRIVE' | 'STANDARD' | string = 'STANDARD';
  $: drive = tier === 'DRIVE';
</script>

<span class="tier" class:tier--drive={drive}>
  {#if drive}<span class="tier__dot" aria-hidden="true"></span>{/if}
  {tier}
</span>

<style>
  .tier {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 2px;
    color: var(--evx-paper-soft);
    background: transparent;
    border: 1px solid var(--evx-rule);
  }
  .tier--drive {
    background: var(--evx-champagne);
    color: #1a150a;
    border-color: transparent;
  }
  .tier__dot {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #1a150a;
  }
</style>
