<script lang="ts">
  export let label: string = ''
  export let type: string = 'text'
  export let placeholder: string = ''
  export let value: string = ''
  export let name: string = ''
</script>

<div class="field">
  {#if label}
    <label class="field-label" for={name}>{label}</label>
  {/if}
  <div class="input-wrap">
    <input
      {type}
      {name}
      id={name}
      {placeholder}
      bind:value
    />
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

  .input-wrap {
    position: relative;
    border-bottom: 1px solid var(--evx-rule-light);
  }

  input {
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
  }

  input::placeholder {
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

  .input-wrap:focus-within .focus-line {
    opacity: 1;
  }
</style>
