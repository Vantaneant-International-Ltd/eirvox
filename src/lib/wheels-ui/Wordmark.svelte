<script lang="ts">
  // ÉIRVOX wordmark. Fox-orange fada dot is the brand's only logo accent.
  export let size = 16;
  export let color = 'var(--evx-paper)';
</script>

<span class="evx-wordmark" style="font-size: {size}px; color: {color};">
  <span class="wm-e">É<span class="wm-dot" aria-hidden="true"></span></span>IRVOX
</span>

<style>
  .evx-wordmark { line-height: 1; white-space: nowrap; display: inline-block; }
  .wm-e { position: relative; display: inline-block; }
  .wm-dot {
    position: absolute;
    top: -0.04em;
    left: 0.08em;
    width: 3px;
    height: 3px;
    background: var(--evx-fox-orange);
    border-radius: 50%;
  }
</style>
