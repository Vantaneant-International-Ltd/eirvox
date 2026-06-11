<script lang="ts">
  // ============================================================
  // WheelFinder — stepped fitment modal
  //
  // Step 1: list distinct BMW series from fitment_chassis.
  // Step 2: list ALL chassis rows for the chosen series, regardless of
  //         family. The same model name (1 Series, 3 Series, X5, X6)
  //         spans E-chassis (e9d) and F-chassis (m3) eras, so we MUST
  //         show every generation row under that series or buyers
  //         with an E-chassis car cannot find their fit.
  // Step 3: confirmation banner ("Fits your <chassis_codes>") + 7
  //         standard styles filtered to the chosen row's family.
  //         Sold-out cells visibly disabled. Selecting a style routes
  //         to the consignment listing detail with the picked variant.
  //
  // No internal family codes are displayed to buyers anywhere.
  // ============================================================
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    getFitmentChassis, getListingVariants,
    type FitmentChassis, type ListingVariant,
  } from './api';
  import { navigate } from './router';
  import Chevron from './wheels-ui/Chevron.svelte';
  import Check from './wheels-ui/Check.svelte';
  import StyleChip from './wheels-ui/StyleChip.svelte';
  import PhotoFrame from './wheels-ui/PhotoFrame.svelte';

  export let consignmentSlug: string;
  export let consignmentId: string | null = null;
  export let basePriceEur = 300;

  const dispatch = createEventDispatcher<{ close: undefined }>();

  let chassis: FitmentChassis[] = [];
  let variants: ListingVariant[] = [];
  let loading = true;

  // Step state. step 0 = pick series, 1 = pick generation, 2 = result.
  let pickedSeries: string | null = null;
  let pickedGen: FitmentChassis | null = null;

  $: step = pickedGen ? 2 : pickedSeries ? 1 : 0;

  onMount(async () => {
    const calls: Promise<unknown>[] = [getFitmentChassis()];
    if (consignmentId) calls.push(getListingVariants(consignmentId));
    const [chassisRes, variantsRes] = await Promise.all(calls);
    chassis = (chassisRes as FitmentChassis[]) ?? [];
    variants = (variantsRes as ListingVariant[]) ?? [];
    loading = false;
  });

  // Distinct series names in order of first-occurrence sort_order.
  $: seriesList = (() => {
    const seen = new Map<string, number>();
    for (const c of chassis) {
      if (!seen.has(c.series) || (seen.get(c.series) ?? 0) > c.sort_order) {
        seen.set(c.series, c.sort_order);
      }
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);
  })();

  // ALL generation rows for the picked series, sorted by sort_order.
  // Crucial: do NOT filter by family. 1 Series, 3 Series, X5, X6 each
  // span two families and the buyer needs to see both eras.
  $: gensForSeries = pickedSeries
    ? chassis
        .filter(c => c.series === pickedSeries)
        .sort((a, b) => a.sort_order - b.sort_order)
    : [];

  // 7 distinct styles from the matrix, in matrix sort order. Each
  // style's family-specific cell (stock_count, accent_hex, delta) is
  // looked up against pickedGen.family_key on render.
  $: styles = (() => {
    const seen = new Map<string, { key: string; label: string; sort: number; accent: string | null }>();
    for (const v of variants) {
      if (!seen.has(v.style_key)) {
        seen.set(v.style_key, {
          key: v.style_key,
          label: v.style_label,
          sort: v.sort_order,
          accent: (v as ListingVariant & { accent_hex?: string | null }).accent_hex ?? null,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.sort - b.sort);
  })();

  function variantFor(styleKey: string, familyKey: string | null) {
    if (!familyKey) return null;
    return variants.find(v => v.style_key === styleKey && v.family_key === familyKey) ?? null;
  }

  function back() {
    if (pickedGen) pickedGen = null;
    else if (pickedSeries) pickedSeries = null;
    else dispatch('close');
  }

  function pickStyle(styleKey: string) {
    if (!pickedGen) return;
    const v = variantFor(styleKey, pickedGen.family_key);
    if (!v || v.stock_count <= 0) return;
    // Hand off to the consignment listing. Query string carries the
    // chassis + style; the detail page picks it up.
    const params = new URLSearchParams({
      chassis: pickedGen.id,
      style: styleKey,
    });
    navigate(`/wheels/${consignmentSlug}?${params.toString()}`);
    dispatch('close');
  }

  // Money helper, mono, no extra component dependency.
  function eur(n: number): string { return `€${n}`; }
</script>

<div class="finder evx-root">
  <!-- Sticky header with back / label / close -->
  <header class="finder__head">
    <div class="finder__head-row">
      <button class="finder__icon-btn" type="button" on:click={back} aria-label="Back">
        <Chevron dir="left" size={13} color="var(--evx-paper)" />
      </button>
      <div class="finder__head-meta">
        <img src="/brand/wordmark.png" alt="ÉIRVOX" class="finder__logo" />
        <span class="evx-label" style="margin-top: 4px;">Find your fit</span>
      </div>
      <button class="finder__icon-btn" type="button" on:click={() => dispatch('close')} aria-label="Close">
        <span class="finder__close-x">✕</span>
      </button>
    </div>
    <div class="finder__progress">
      {#each Array(3) as _, i (i)}
        <div class="finder__bar" class:finder__bar--on={i <= step}></div>
      {/each}
    </div>
  </header>

  {#if loading}
    <div class="finder__loading">Loading.</div>

  {:else if step === 0}
    <div class="finder__step" data-step="0">
      <div class="finder__heading">
        <span class="evx-label">Step 1 of 3</span>
        <h2 class="finder__h">Which BMW do you drive?</h2>
        <p class="finder__sub">Pick your series. You will recognise it from the badge on the boot.</p>
      </div>
      <ul class="finder__list">
        {#each seriesList as name (name)}
          {@const count = chassis.filter(c => c.series === name).length}
          <li>
            <button class="finder__row" type="button" on:click={() => pickedSeries = name}>
              <span class="finder__row-main">
                <span class="finder__row-title">{name}</span>
                <span class="finder__row-meta">{count} generation{count === 1 ? '' : 's'}</span>
              </span>
              <Chevron size={13} color="var(--evx-ink-soft)" />
            </button>
          </li>
        {/each}
      </ul>
    </div>

  {:else if step === 1}
    <div class="finder__step" data-step="1">
      <div class="finder__heading">
        <span class="evx-label">{pickedSeries} · Step 2 of 3</span>
        <h2 class="finder__h">Which model year?</h2>
        <p class="finder__sub">Pick the one that matches your car. The code is on your registration or the door sill.</p>
      </div>
      <ul class="finder__list">
        {#each gensForSeries as gen (gen.id)}
          <li>
            <button class="finder__row" type="button" on:click={() => pickedGen = gen}>
              <span class="finder__row-main">
                <span class="finder__row-title">{gen.chassis_codes}</span>
                <span class="finder__row-meta">{gen.years_label ?? ''}</span>
              </span>
              <Chevron size={13} color="var(--evx-ink-soft)" />
            </button>
          </li>
        {/each}
      </ul>
      <p class="finder__hint">Not sure? The F / G / E letter is the generation. Most cars after 2012 are F or G.</p>
    </div>

  {:else if step === 2 && pickedGen}
    <div class="finder__step" data-step="2">
      <!-- Fit confirmation -->
      <div class="finder__fit">
        <div class="finder__fit-row">
          <span class="finder__fit-check" aria-hidden="true">
            <Check size={11} color="#fff" />
          </span>
          <span class="finder__fit-text">Fits your {pickedGen.chassis_codes}</span>
        </div>
        <p class="finder__fit-sub">{pickedSeries} · {pickedGen.years_label ?? ''}. These finishes are confirmed for your chassis.</p>
      </div>

      <div class="finder__heading">
        <h2 class="finder__h">Choose your finish</h2>
        <p class="finder__sub">One wheel, your way. Seven finishes, matched to your fitment.</p>
      </div>

      <ul class="finder__styles">
        {#each styles as s (s.key)}
          {@const v = variantFor(s.key, pickedGen?.family_key ?? null)}
          {@const soldOut = !v || v.stock_count <= 0}
          {@const resolved = basePriceEur + (v?.price_delta_eur ?? 0)}
          <li>
            <button class="finder__style" type="button" disabled={soldOut} on:click={() => pickStyle(s.key)}>
              <span class="finder__style-thumb">
                <PhotoFrame caption="" aspect="1 / 1" radius={2} glyph={true} />
              </span>
              <span class="finder__style-body">
                <span class="finder__style-title">
                  {#if s.accent}
                    <span class="finder__style-swatch" style="background: {s.accent};" aria-hidden="true"></span>
                  {/if}
                  {s.label}
                </span>
                <span class="finder__style-note">
                  {#if soldOut}Sold out for this fitment{:else if v}{v.stock_count} available{/if}
                </span>
              </span>
              <span class="finder__style-meta">
                <span class="finder__style-price">{eur(resolved)}</span>
                <Chevron size={11} color="var(--evx-ink-soft)" />
              </span>
            </button>
          </li>
        {/each}
      </ul>

      <p class="finder__hint">Matched automatically. You never need the part code.</p>
    </div>
  {/if}
</div>

<style>
  .finder {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--evx-black);
    color: var(--evx-paper);
    overflow-y: auto;
    overflow-x: hidden;
    animation: evx-fade 220ms ease both;
    font-family: var(--evx-font-display);
  }

  /* Header */
  .finder__head {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--evx-black);
    padding-top: max(env(safe-area-inset-top), 14px);
  }
  .finder__head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px 12px;
  }
  .finder__head-meta { display: flex; flex-direction: column; align-items: center; }
  /* Canonical miniature wordmark (brand PNG), inverted on the dark finder. */
  .finder__logo { height: 14px; width: auto; display: block; filter: invert(1) brightness(1.05); }
  .finder__icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid var(--evx-rule);
    background: transparent;
    color: var(--evx-paper);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .finder__icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .finder__close-x { font-size: 17px; line-height: 1; }

  .finder__progress {
    display: flex;
    gap: 6px;
    padding: 0 18px 14px;
  }
  .finder__bar {
    flex: 1;
    height: 2.5px;
    border-radius: 2px;
    background: var(--evx-rule);
    transition: background 280ms ease;
  }
  .finder__bar--on { background: var(--evx-fox-orange); }

  /* Step shared */
  .finder__step { animation: evx-rise 380ms ease both; padding-bottom: calc(40px + env(safe-area-inset-bottom)); }
  .finder__heading { padding: 22px 18px 10px; }
  .finder__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 30px;
    letter-spacing: -0.02em;
    line-height: 1.04;
    color: var(--evx-paper);
    margin-top: 12px;
  }
  .finder__sub {
    font-size: 13.5px;
    color: var(--evx-ink-soft);
    margin-top: 10px;
    max-width: 320px;
    line-height: 1.55;
  }
  .finder__hint {
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    color: var(--evx-ink-faint);
    padding: 18px;
    line-height: 1.55;
  }
  .finder__loading {
    padding: 28px 18px;
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    color: var(--evx-ink-soft);
  }

  /* Option rows */
  .finder__list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--evx-rule); }
  .finder__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
    text-align: left;
    padding: 20px 18px;
    border-bottom: 1px solid var(--evx-rule-soft);
    background: transparent;
    color: var(--evx-paper);
    cursor: pointer;
    transition: background 140ms ease;
  }
  .finder__row:hover { background: rgba(244, 241, 236, 0.035); }
  .finder__row-main { flex: 1; min-width: 0; }
  .finder__row-title {
    display: block;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 19px;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .finder__row-meta {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    color: var(--evx-ink-soft);
    margin-top: 4px;
    letter-spacing: 0.02em;
  }

  /* Fit confirmation */
  .finder__fit {
    margin: 20px 18px 8px;
    border: 1px solid rgba(232, 116, 44, 0.35);
    border-radius: 3px;
    padding: 16px 18px;
    background: rgba(232, 116, 44, 0.06);
  }
  .finder__fit-row { display: flex; align-items: center; gap: 9px; }
  .finder__fit-check {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--evx-fox-orange);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .finder__fit-text {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 16px;
    color: var(--evx-paper);
  }
  .finder__fit-sub {
    font-size: 12.5px;
    color: var(--evx-paper-soft);
    padding-left: 27px;
    margin-top: 4px;
    line-height: 1.55;
  }

  /* Style list */
  .finder__styles { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--evx-rule); }
  .finder__style {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    text-align: left;
    padding: 14px 18px;
    border-bottom: 1px solid var(--evx-rule-soft);
    background: transparent;
    color: var(--evx-paper);
    cursor: pointer;
    transition: background 140ms ease, opacity 140ms ease;
  }
  .finder__style:hover:not(:disabled) { background: rgba(244, 241, 236, 0.035); }
  .finder__style:disabled { opacity: 0.4; cursor: not-allowed; }
  .finder__style-thumb { flex: 0 0 60px; height: 60px; display: block; }
  .finder__style-body { flex: 1; min-width: 0; }
  .finder__style-title {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 15.5px;
    line-height: 1.2;
    color: var(--evx-paper);
  }
  .finder__style-swatch {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.4);
  }
  .finder__style-note {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 10.5px;
    color: var(--evx-ink-soft);
    margin-top: 3px;
    letter-spacing: 0.02em;
  }
  .finder__style-meta {
    text-align: right;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
  }
  .finder__style-price {
    font-family: var(--evx-font-mono);
    font-size: 14px;
    color: var(--evx-paper);
  }
</style>
