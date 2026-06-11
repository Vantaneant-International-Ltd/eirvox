<script lang="ts">
  // ============================================================
  // FactNeeded — renders a [FACT NEEDED: …] token visibly so an
  // unresolved fact is impossible to miss in review and impossible to
  // mistake for final copy. Never invent the value; render the token.
  //
  // Mono, uppercase, fox-orange on a thin dashed rule. No new tokens:
  // dashed is a border-style on the existing --evx-rule-light /
  // --evx-fox-orange. `dark` switches the rule colour for dark surfaces.
  // ============================================================
  export let label: string;
  export let dark = false;
</script>

<span class="fact" class:fact--dark={dark}>[FACT NEEDED: {label}]</span>

<style>
  .fact {
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-fox-orange);
    border-bottom: 1px dashed var(--evx-rule-light);
    padding-bottom: 1px;
    line-height: 1.5;
  }
  .fact--dark { border-bottom-color: var(--evx-rule); }
</style>
