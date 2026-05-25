<script lang="ts">
  export let label: string = ''
  export let placeholder: string = ''
  export let value: string = ''
  export let name: string = ''
  export let rows: number = 5
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={name}>{label}</label>
  {/if}
  <div class="textarea-wrap">
    <textarea
      {name}
      id={name}
      {placeholder}
      {rows}
      bind:value
    ></textarea>
    <span class="focus-line" aria-hidden="true"></span>
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .field-label {
    font-family: var(--evx-type-label-family);
    font-weight: var(--evx-type-label-weight);
    font-size: var(--evx-type-label-size);
    letter-spacing: var(--evx-type-label-ls);
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .textarea-wrap {
    position: relative;
    border-bottom: 1px solid var(--evx-rule-light);
  }

  textarea {
    width: 100%;
    border: none;
    background: transparent;
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-type-body-family);
    font-weight: var(--evx-type-body-weight);
    font-size: var(--evx-type-body-size);
    line-height: var(--evx-type-body-lh);
    color: var(--evx-warm-black);
    outline: none;
    resize: vertical;
    min-height: 120px;
  }

  textarea::placeholder {
    color: var(--evx-ink-soft);
  }

  .focus-line {
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--evx-warm-black);
    opacity: 0;
    transition: var(--evx-transition);
    pointer-events: none;
  }

  .textarea-wrap:focus-within .focus-line {
    opacity: 1;
  }
</style>
