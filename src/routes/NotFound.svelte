<script lang="ts">
  // ============================================================
  // 404 — self-contained dark error page with an inert collect-the-
  // objects charm. Renders for any unmatched route AND for the
  // notReady gate (/account, /messages, /drive/:slug) via App.svelte.
  //
  // Objects are charm only — they link to nothing, no navigation, no
  // marketing. The only exits are "Back to safety" → "/" (left panel
  // + win state). Every prototype colour maps to an --evx-* token so a
  // future token change carries through. Fox orange appears ONLY on the
  // primary button, the collected-counter digit, and the focus ring.
  // ============================================================
  import { onMount } from 'svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  // Inline line-art SVGs (no external images). {@html} is safe here:
  // every string is a hardcoded literal, never user data.
  const OBJECTS: { name: string; label: string; pos: string; svg: string }[] = [
    { name: 'watches', label: 'Watches', pos: 'o1', svg: '<circle cx="40" cy="42" r="17"/><path d="M40 30v12l8 5"/><path d="M33 25l-2-9h18l-2 9M33 59l-2 9h18l-2-9"/>' },
    { name: 'vinyl', label: 'Vinyl', pos: 'o2', svg: '<path d="M14 16h26v48H14z"/><circle cx="46" cy="40" r="23"/><circle cx="46" cy="40" r="4.5"/><path d="M46 26a14 14 0 0 1 0 28"/>' },
    { name: 'auto', label: 'Auto', pos: 'o3', svg: '<path d="M11 48h58l-6-14H47l-8-8H26l-8 8-7 14z"/><path d="M28 34h14l-6-6h-6z"/><circle cx="26" cy="51" r="6"/><circle cx="56" cy="51" r="6"/>' },
    { name: 'camera', label: 'Camera', pos: 'o4', svg: '<path d="M14 28h13l4-7h18l4 7h13v33H14z"/><circle cx="40" cy="45" r="12"/><circle cx="40" cy="45" r="4.5"/><path d="M56 35h3"/>' },
    { name: 'design', label: 'Design', pos: 'o5', svg: '<path d="M24 41c1-13 27-15 33-4 3 6-2 13-9 13H32c-7 0-9-4-8-9z"/><path d="M20 40h-6v17h17"/><path d="M30 50l-8 15M50 50l8 15M26 65h28"/>' },
    { name: 'jacket', label: 'Jacket', pos: 'o6', svg: '<path d="M30 16l-13 8v42h17l6-30 6 30h17V24l-13-8-11 8z"/><path d="M30 16l10 8 10-8M28 36h10M42 36h10"/>' },
  ];
  const total = OBJECTS.length;

  let reduce = false;
  let count = 0;
  let live = false;
  let showReward = false;

  let btnEls: (HTMLButtonElement | null)[] = OBJECTS.map(() => null);
  let slotEls: (HTMLDivElement | null)[] = OBJECTS.map(() => null);
  let inState: boolean[] = OBJECTS.map(() => false);
  let doneState: boolean[] = OBJECTS.map(() => false);
  let dxdy: { dx: number; dy: number }[] = OBJECTS.map(() => ({ dx: 0, dy: 0 }));
  let filled: (string | null)[] = OBJECTS.map(() => null);

  onMount(() => {
    applySeo(seo.notFound());
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      inState = OBJECTS.map(() => true);
    } else {
      // staggered drift-in, then settle into the calm float
      OBJECTS.forEach((_, i) => setTimeout(() => { inState[i] = true; inState = inState; }, 120 + i * 110));
      setTimeout(() => { live = true; }, 120 + total * 110 + 400);
    }
  });

  function collect(i: number) {
    if (doneState[i]) return;
    const slotIdx = count;            // next empty tray slot
    const btn = btnEls[i];
    const slot = slotEls[slotIdx];
    if (!btn || !slot) return;
    const b = btn.getBoundingClientRect();
    const s = slot.getBoundingClientRect();
    dxdy[i] = {
      dx: s.left + s.width / 2 - (b.left + b.width / 2),
      dy: s.top + s.height / 2 - (b.top + b.height / 2),
    };
    dxdy = dxdy;
    doneState[i] = true; doneState = doneState;
    setTimeout(() => { filled[slotIdx] = OBJECTS[i].svg; filled = filled; }, reduce ? 0 : 170);
    count += 1;
    if (count === total) setTimeout(() => { showReward = true; }, reduce ? 0 : 520);
  }

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); collect(i); }
  }
</script>

<div class="nf-page">
  <header class="nf-top">
    <div class="nf-brand">ÉIRVOX</div>
    <div class="nf-status">Page not found</div>
  </header>

  <main class="nf-main">
    <section class="nf-intro" aria-labelledby="nf-title">
      <div class="nf-kicker">404</div>
      <h1 id="nf-title" class="nf-h1">This page is missing.</h1>
      <p class="nf-sub">The link leads nowhere. Collect a few objects while you are here.</p>
      <p class="nf-italic">A quiet dead end.</p>
      <div class="nf-exits">
        <button class="nf-btn" type="button" on:click={() => navigate('/')}>Back to safety →</button>
      </div>
    </section>

    <section class="nf-game" aria-label="Collect the objects">
      <div class="nf-gamebar">
        <div class="nf-counter">Collected <b>{count}</b> / <span>{total}</span></div>
        <div class="nf-caption">Tap an object</div>
      </div>

      <div class="nf-field" class:live>
        {#each OBJECTS as obj, i (obj.name)}
          <button
            class="nf-object {obj.pos}"
            class:in={inState[i]}
            class:collected={doneState[i]}
            style="--dx:{dxdy[i].dx}px; --dy:{dxdy[i].dy}px"
            bind:this={btnEls[i]}
            type="button"
            aria-label={`Collect ${obj.label}`}
            on:click={() => collect(i)}
            on:keydown={(e) => onKey(e, i)}
          >
            <svg viewBox="0 0 80 80" aria-hidden="true">{@html obj.svg}</svg>
            <span>{obj.label}</span>
          </button>
        {/each}
      </div>

      <div class="nf-tray-wrap">
        <div class="nf-tray-label">Collected objects</div>
        <div class="nf-tray" aria-live="polite">
          {#each OBJECTS as _, i (i)}
            <div class="nf-slot" class:filled={filled[i]} bind:this={slotEls[i]}>
              {#if filled[i]}<svg viewBox="0 0 80 80" aria-hidden="true">{@html filled[i]}</svg>{/if}
            </div>
          {/each}
        </div>
      </div>

      <div class="nf-reward" class:show={showReward}>
        <div class="nf-reward__inner">
          <p><b>Found them all.</b></p>
          <button class="nf-btn nf-btn--primary" type="button" on:click={() => navigate('/')}>Back to safety →</button>
        </div>
      </div>
    </section>
  </main>

  <footer class="nf-foot">ÉIRVOX / 404</footer>
</div>

<style>
  /* Tokens: bg→--evx-black, surface→--evx-surface, surface-2→--evx-surface-2,
     line→--evx-rule, line-2→--evx-rule-strong, text→--evx-paper,
     muted→--evx-ink-soft, faint→--evx-ink-faint, accent→--evx-fox-orange. */
  .nf-page {
    min-height: 100vh;
    background: var(--evx-black);
    color: var(--evx-paper);
    font-family: var(--evx-font-display);
    display: grid;
    grid-template-rows: auto 1fr auto;
  }

  .nf-top {
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 42px;
    border-bottom: 1px solid var(--evx-rule);
  }
  .nf-brand { font-weight: 500; font-size: 18px; letter-spacing: 0.42em; }
  .nf-status {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.22em;
    color: var(--evx-ink-soft);
    text-transform: uppercase;
  }

  .nf-main { display: grid; grid-template-columns: 400px 1fr; min-height: calc(100vh - 152px); }

  .nf-intro {
    padding: 58px 42px;
    border-right: 1px solid var(--evx-rule);
    display: flex;
    flex-direction: column;
  }
  .nf-kicker {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .nf-h1 {
    font-size: 56px;
    line-height: 0.95;
    letter-spacing: -0.045em;
    font-weight: 500;
    margin: 22px 0 20px;
    max-width: 9ch;
  }
  .nf-sub { font-size: 17px; line-height: 1.45; color: var(--evx-ink-soft); max-width: 26ch; margin: 0 0 26px; }
  .nf-italic {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    color: var(--evx-ink-soft);
    font-size: 20px;
    margin: 0 0 auto;
  }
  .nf-exits { display: flex; gap: 14px; margin-top: 40px; }

  .nf-btn {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    font-weight: 500;
    padding: 15px 22px;
    border: 1px solid var(--evx-rule-strong);
    background: none;
    color: var(--evx-paper);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, color 0.2s;
  }
  .nf-btn:hover { border-color: var(--evx-ink-soft); }
  .nf-btn--primary { background: var(--evx-fox-orange); border-color: var(--evx-fox-orange); color: var(--evx-black); }
  .nf-btn--primary:hover { filter: brightness(1.07); }

  .nf-game { position: relative; padding: 42px; display: flex; flex-direction: column; }
  .nf-gamebar { display: flex; justify-content: space-between; align-items: center; }
  .nf-counter, .nf-caption, .nf-tray-label {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }
  .nf-counter b { color: var(--evx-fox-orange); font-weight: 500; }
  .nf-field { position: relative; flex: 1; min-height: 420px; margin-top: 14px; }

  .nf-object {
    position: absolute;
    width: 120px;
    height: 140px;
    border: 1px solid var(--evx-rule);
    background: var(--evx-surface);
    color: var(--evx-paper);
    display: grid;
    grid-template-rows: 1fr auto;
    place-items: center;
    gap: 10px;
    padding: 16px 10px 14px;
    cursor: pointer;
    appearance: none;
    font: inherit;
    opacity: 0;
    transform: translateY(16px);
    transition: transform 0.24s ease, opacity 0.24s ease, border-color 0.2s ease;
  }
  .nf-object.in { opacity: 1; transform: translateY(0); }
  .nf-object:hover, .nf-object:focus-visible { border-color: var(--evx-rule-strong); outline: none; }
  .nf-object:focus-visible { outline: 2px solid var(--evx-fox-orange); outline-offset: 3px; }
  .nf-object svg { width: 72px; height: 72px; stroke: var(--evx-paper); fill: none; stroke-width: 1.35; stroke-linecap: round; stroke-linejoin: round; }
  .nf-object span {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .o1 { left: 5%; top: 16%; }
  .o2 { left: 29%; top: 5%; }
  .o3 { left: 55%; top: 22%; }
  .o4 { right: 5%; top: 11%; }
  .o5 { left: 36%; bottom: 13%; }
  .o6 { right: 15%; bottom: 8%; }

  /* calm slow drift — only after the intro settles */
  .nf-field.live .o1 { animation: nf-floatA 11s ease-in-out infinite; }
  .nf-field.live .o2 { animation: nf-floatB 12.5s ease-in-out infinite; }
  .nf-field.live .o3 { animation: nf-floatA 13s ease-in-out infinite; }
  .nf-field.live .o4 { animation: nf-floatB 11.8s ease-in-out infinite; }
  .nf-field.live .o5 { animation: nf-floatC 12.2s ease-in-out infinite; }
  .nf-field.live .o6 { animation: nf-floatA 13.5s ease-in-out infinite; }
  @keyframes nf-floatA { 50% { transform: translateY(-6px); } }
  @keyframes nf-floatB { 50% { transform: translateY(5px); } }
  @keyframes nf-floatC { 50% { transform: translateY(-4px); } }

  .nf-object.collected {
    pointer-events: none;
    animation: none !important;
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(0.26);
  }

  .nf-tray-wrap { margin-top: 18px; }
  .nf-tray-label { margin-bottom: 12px; }
  .nf-tray { display: flex; gap: 14px; align-items: center; border: 1px solid var(--evx-rule); background: var(--evx-surface); padding: 13px; flex-wrap: wrap; }
  .nf-slot { width: 72px; height: 66px; border: 1px dashed var(--evx-rule-strong); display: grid; place-items: center; transition: border-color 0.2s, background 0.2s; }
  .nf-slot.filled { border-style: solid; border-color: var(--evx-rule); background: var(--evx-surface-2); }
  .nf-slot svg { width: 40px; height: 40px; stroke: var(--evx-paper); fill: none; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }

  .nf-reward { position: absolute; inset: 0; display: none; place-items: center; background: rgba(14, 13, 12, 0.9); text-align: center; }
  .nf-reward.show { display: grid; }
  .nf-reward__inner { display: flex; flex-direction: column; align-items: center; gap: 24px; }
  .nf-reward p { font-family: var(--evx-font-mono); font-size: 13px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--evx-ink-soft); margin: 0; }
  .nf-reward p b { color: var(--evx-paper); font-weight: 400; }

  .nf-foot {
    height: 80px;
    border-top: 1px solid var(--evx-rule);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.24em;
    color: var(--evx-ink-faint);
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .nf-top, .nf-intro, .nf-game { padding-left: 24px; padding-right: 24px; }
    .nf-main { grid-template-columns: 1fr; }
    .nf-intro { border-right: 0; border-bottom: 1px solid var(--evx-rule); padding-top: 40px; padding-bottom: 40px; }
    .nf-italic { margin-bottom: 32px; }
    .nf-exits { margin-top: 0; }
    .nf-h1 { font-size: 42px; }
    .nf-field { min-height: 520px; }
    .nf-object { width: 104px; height: 124px; }
    .o1 { left: 0; } .o2 { left: 34%; top: 3%; } .o3 { left: 6%; top: 42%; }
    .o4 { right: 0; } .o5 { left: 40%; bottom: 16%; } .o6 { right: 4%; bottom: 2%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .nf-object { animation: none !important; transition: none !important; opacity: 1; transform: none; }
  }
</style>
