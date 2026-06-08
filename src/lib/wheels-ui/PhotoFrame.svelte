<script lang="ts">
  // Cinematic photo placeholder. Frames built FOR studio shots not yet
  // taken. `lit` = DRIVE LED-glow mood; `unlit` = standard line.
  // `caption` renders as a small mono note bottom-left. `index` prints
  // a zero-padded prefix (01, 02, ...) for view counters on detail.
  export let caption = '';
  export let lit = false;
  export let led: string | null = null;
  export let index: number | null = null;
  export let radius = 0;
  export let aspect = '4 / 3';
  export let glyph = true;
  export let src: string | null = null;
  export let alt = '';

  $: ledStyle = led ? `--evx-led: ${led};` : '';
</script>

<div class="frame {lit ? 'evx-carbon evx-carbon--lit' : 'evx-carbon'}"
     style="border-radius: {radius}px; aspect-ratio: {aspect}; {ledStyle}">
  {#if src}
    <img class="frame__img" {src} {alt} loading="lazy" />
  {:else if glyph}
    <div class="frame__glyph" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.2" stroke={lit ? 'rgba(201,169,97,0.30)' : 'rgba(244,241,236,0.14)'} stroke-width="1.1" />
        <path d="M12 2.8 12 9 M21.2 12 15 12 M12 21.2 12 15 M2.8 12 9 12"
              stroke={lit ? 'rgba(201,169,97,0.30)' : 'rgba(244,241,236,0.14)'} stroke-width="1.1" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="3" stroke={lit ? 'rgba(201,169,97,0.30)' : 'rgba(244,241,236,0.14)'} stroke-width="1.1" />
      </svg>
    </div>
  {/if}
  {#if caption}
    <div class="frame__cap" style="color: {lit ? 'rgba(201,169,97,0.85)' : 'rgba(199,194,185,0.7)'};">
      {index != null ? String(index).padStart(2, '0') + '  ' : ''}{caption}
    </div>
  {/if}
  <slot name="overlay" />
</div>

<style>
  .frame { position: relative; width: 100%; }
  .frame__img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    filter: brightness(0.92);
  }
  .frame__glyph {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .frame__cap {
    position: absolute;
    left: 12px; bottom: 11px; right: 12px;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    pointer-events: none;
  }
</style>
