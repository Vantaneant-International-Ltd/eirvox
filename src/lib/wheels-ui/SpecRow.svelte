<script lang="ts">
  // Specs-as-features row used on the wheel detail page. Two columns:
  // label (mono uppercase, ink-soft) and value (display, paper). Thin
  // soft rule between rows; last row drops the rule.
  export let label: string;
  export let value: string;
  export let last = false;
</script>

<div class="spec" class:spec--last={last}>
  <span class="spec__label">{label}</span>
  <span class="spec__value">{value}</span>
</div>

<style>
  .spec {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 0;
    border-bottom: 1px solid var(--evx-rule-soft);
  }
  .spec--last { border-bottom: none; }
  .spec__label {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .spec__value {
    font-size: 14px;
    color: var(--evx-paper);
    text-align: right;
    text-wrap: pretty;
  }
</style>
