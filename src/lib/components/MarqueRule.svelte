<script lang="ts">
  export let marque: 'audi' | 'mercedes' | 'bmw' | 'volkswagen' = 'mercedes'
  export let text: string = ''

  const colourMap: Record<string, string> = {
    audi:       'var(--evx-audi-red)',
    mercedes:   'var(--evx-mercedes-champagne)',
    bmw:        'var(--evx-bmw-blue)',
    volkswagen: 'var(--evx-vw-red)',
  }

  $: colour = colourMap[marque] ?? 'var(--evx-rule-light)'
</script>

<div class="marque-rule">
  <span class="rule" style="background-color: {colour};" aria-hidden="true"></span>
  <span class="rule-text">{text}</span>
</div>

<style>
  .marque-rule {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
  }

  .rule {
    display: block;
    width: 40px;
    height: 1px;
    flex-shrink: 0;
  }

  .rule-text {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
</style>
