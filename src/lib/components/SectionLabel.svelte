<script lang="ts">
  export let text: string = ''
  export let rule: 'top' | 'bottom' | 'none' = 'none'
</script>

<div class="section-label" class:rule-top={rule === 'top'} class:rule-bottom={rule === 'bottom'}>
  <span class="label-text">{text}</span>
</div>

<style>
  .section-label {
    display: flex;
    flex-direction: column;
  }

  .label-text {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .rule-top {
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-md);
  }

  .rule-bottom {
    border-bottom: 1px solid var(--evx-rule-light);
    padding-bottom: var(--evx-space-md);
  }
</style>
