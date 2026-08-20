<script lang="ts">
  // ============================================================
  // WhatsApp, done as part of the site rather than bolted onto it.
  //
  // Deliberately NOT the green circle every Shopify store ships. Green
  // is not in the palette (lockfile §3: one accent, and it is orange),
  // and a foreign brand colour parked over the corner of every page is
  // the loudest off-brand thing a site can do. This is an ink pill in
  // the house type, with the glyph carried in white.
  //
  // The part that actually beats a plugin: it knows the page. On a
  // product it opens with that wheel and its price already typed, so
  // the first message is about the thing they were looking at.
  //
  // Hidden until the visitor scrolls past the hero, so it never covers
  // the first thing they see.
  // ============================================================
  import { onMount } from 'svelte';
  import { waContext, waHref } from './whatsapp';

  let shown = false;
  let expanded = false;

  onMount(() => {
    const onScroll = () => {
      const past = window.scrollY > 420;
      if (past !== shown) shown = past;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  $: href = waHref($waContext);
  $: label = $waContext.label ?? 'Ask on WhatsApp';
</script>

<a
  class="wa"
  class:wa--shown={shown}
  {href}
  target="_blank"
  rel="noopener noreferrer"
  aria-label={`${label} on WhatsApp`}
  on:mouseenter={() => (expanded = true)}
  on:mouseleave={() => (expanded = false)}
  on:focus={() => (expanded = true)}
  on:blur={() => (expanded = false)}
>
  <svg class="wa__glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.15 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z"/>
  </svg>
  <span class="wa__label" class:wa__label--open={expanded}>{label}</span>
</a>

<style>
  .wa {
    position: fixed;
    right: var(--evx-space-lg);
    bottom: var(--evx-space-lg);
    z-index: 90;

    display: inline-flex;
    align-items: center;
    gap: 0;
    height: 52px;
    padding: 0 16px;

    /* A light pill on the dark page: it has to be found without
       shouting, and inverted is the quietest way to be obvious. */
    background: var(--evx-ink);
    color: var(--evx-invert-ink);
    border: 1px solid var(--evx-ink);
    text-decoration: none;

    opacity: 0;
    transform: translateY(10px);
    pointer-events: none;
    transition: opacity 220ms ease, transform 220ms ease;
  }
  .wa--shown { opacity: 1; transform: translateY(0); pointer-events: auto; }
  .wa:hover { background: var(--evx-fox-orange); border-color: var(--evx-fox-orange); color: #FFFFFF; }

  .wa__glyph { width: 21px; height: 21px; flex-shrink: 0; }

  /* The label opens on hover so the resting state stays quiet, and is
     always present for a screen reader. */
  .wa__label {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-width 260ms ease, opacity 200ms ease, margin-left 260ms ease;
  }
  .wa__label--open { max-width: 220px; opacity: 1; margin-left: 10px; }

  @media (max-width: 767px) {
    .wa {
      right: var(--evx-space-md);
      bottom: var(--evx-space-md);
      height: 48px;
      padding: 0 14px;
    }
    /* No hover on touch, so the label simply shows. */
    .wa__label { max-width: 220px; opacity: 1; margin-left: 9px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .wa, .wa__label { transition: none; }
  }
</style>
