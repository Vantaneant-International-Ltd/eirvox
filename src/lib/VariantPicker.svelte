<script lang="ts">
  // ============================================================
  // VariantPicker — buyer-facing 2-axis picker on the wheel detail.
  //
  // The picker logic is unchanged from v20: distinct styles deduped
  // across families, sold-out cells visibly disabled, server is the
  // source of truth for price + stock via payments-create-order +
  // decrement_variant_stock + complete_order. Only the chrome here
  // changed to match the approved Claude Design prototype.
  //
  // Read pre-selection from query params (?chassis=<id>&style=<key>)
  // so the WheelFinder hand-off lands the buyer on the right fit.
  // ============================================================
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    getListingVariants, getFitmentChassis,
    type ListingVariant, type FitmentChassis,
  } from './api';
  import PayButton from './PayButton.svelte';
  import StyleChip from './wheels-ui/StyleChip.svelte';
  import Check from './wheels-ui/Check.svelte';
  import Chevron from './wheels-ui/Chevron.svelte';
  import Money from './wheels-ui/Money.svelte';
  import { currentPath } from './router';

  export let listingId: string;
  export let basePriceEur: number;
  export let originalPriceEur: number | null = null;
  export let listingTitle: string = '';
  export let fulfilment: 'collection' | 'delivery' = 'collection';

  const dispatch = createEventDispatcher<{
    success: { orderId: string };
    error:   { message: string };
    cancel:  undefined;
  }>();

  let variants: ListingVariant[] = [];
  let chassis: FitmentChassis[] = [];
  let loading = true;

  let selectedChassisId: string | null = null;
  let selectedStyleKey:  string | null = null;
  let showFinderOverlay = false;
  let chassisFilter = '';

  onMount(async () => {
    [variants, chassis] = await Promise.all([
      getListingVariants(listingId),
      getFitmentChassis(),
    ]);

    // Pre-select from query params (WheelFinder hand-off).
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const qIdx = hash.indexOf('?');
    if (qIdx >= 0) {
      const qs = new URLSearchParams(hash.slice(qIdx + 1));
      const c = qs.get('chassis');
      const s = qs.get('style');
      if (c && chassis.find(r => r.id === c)) selectedChassisId = c;
      if (s) selectedStyleKey = s;
    }
    loading = false;
  });

  $: selectedChassis = chassis.find(c => c.id === selectedChassisId) ?? null;
  $: selectedFamilyKey = selectedChassis?.family_key ?? null;

  // 7 distinct styles, in matrix sort order.
  $: styles = (() => {
    const seen = new Map<string, { key: string; label: string; sort: number; accent: string | null }>();
    for (const v of variants) {
      if (!seen.has(v.style_key)) {
        seen.set(v.style_key, {
          key: v.style_key,
          label: v.style_label,
          sort: v.sort_order,
          accent: v.accent_hex ?? null,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.sort - b.sort);
  })();

  function variantFor(styleKey: string, familyKey: string | null): ListingVariant | null {
    if (!familyKey) return null;
    return variants.find(v => v.style_key === styleKey && v.family_key === familyKey) ?? null;
  }

  $: selectedVariant = selectedStyleKey && selectedFamilyKey
    ? variantFor(selectedStyleKey, selectedFamilyKey)
    : null;

  $: resolvedPriceEur = selectedVariant
    ? basePriceEur + (selectedVariant.price_delta_eur ?? 0)
    : basePriceEur;

  $: payReady = !!(selectedVariant && selectedVariant.stock_count > 0);

  // If selected style is sold-out under newly chosen family, clear it.
  function pickChassis(id: string) {
    selectedChassisId = id;
    showFinderOverlay = false;
    if (selectedStyleKey) {
      const v = variantFor(selectedStyleKey, chassis.find(c => c.id === id)?.family_key ?? null);
      if (!v || v.stock_count <= 0) selectedStyleKey = null;
    }
  }

  function pickStyle(key: string) {
    const v = variantFor(key, selectedFamilyKey);
    if (!v || v.stock_count <= 0) return;
    selectedStyleKey = key;
  }

  function clearFitment() {
    selectedChassisId = null;
    selectedStyleKey = null;
    chassisFilter = '';
  }

  $: filteredChassis = chassisFilter.trim()
    ? chassis.filter(c => c.display_name.toLowerCase().includes(chassisFilter.trim().toLowerCase()))
    : chassis;
</script>

<section class="vp" aria-label="Choose your fitment and finish">

  {#if loading}
    <p class="vp__loading">Loading.</p>

  {:else if variants.length === 0}
    <p class="vp__empty">No variants configured for this listing yet.</p>

  {:else}

    <!-- Fitment confirmation tag (or call-to-open if not yet picked) -->
    {#if selectedChassis}
      <div class="vp__fit">
        <span class="vp__fit-check" aria-hidden="true">
          <Check size={11} color="#fff" />
        </span>
        <span class="vp__fit-text">Fits your {selectedChassis.chassis_codes}</span>
        <button class="vp__fit-change" type="button" on:click={() => (showFinderOverlay = true)}>change</button>
      </div>
    {:else}
      <button class="vp__fit-prompt" type="button" on:click={() => (showFinderOverlay = true)}>
        <span>Check it fits your car</span>
        <Chevron size={10} color="var(--evx-ink-soft)" />
      </button>
    {/if}

    <!-- Style chips -->
    <div class="vp__finish">
      <span class="evx-label vp__finish-label">{selectedChassis ? 'Choose your finish' : 'Finish'}</span>
      <div class="vp__chip-row" role="radiogroup" aria-label="Finish">
        {#each styles as s (s.key)}
          {@const v = variantFor(s.key, selectedFamilyKey)}
          {@const soldOut = selectedFamilyKey ? (!v || v.stock_count <= 0) : false}
          <StyleChip
            label={s.label}
            accentHex={s.accent}
            active={selectedStyleKey === s.key && !soldOut}
            disabled={soldOut}
            on:click={() => pickStyle(s.key)}
          />
        {/each}
      </div>
      {#if selectedChassis && selectedStyleKey && selectedVariant}
        <p class="vp__finish-stock">{selectedVariant.stock_count} available for your {selectedChassis.chassis_codes}.</p>
      {:else if !selectedChassis}
        <p class="vp__finish-stock">Pick your fitment to see stock and confirm price.</p>
      {/if}
    </div>

    <!-- Sticky buy bar -->
    <div class="vp__buy">
      <div class="vp__buy-meta">
        <div class="vp__buy-style">
          {selectedStyleKey ? styles.find(s => s.key === selectedStyleKey)?.label : 'Choose a finish'}
        </div>
        <Money price={resolvedPriceEur}
               was={originalPriceEur && originalPriceEur > resolvedPriceEur ? originalPriceEur : null}
               size={20} />
      </div>
      <div class="vp__buy-cta">
        {#if payReady}
          <PayButton
            listingId={listingId}
            amountEur={resolvedPriceEur}
            fulfilment={fulfilment}
            isDeposit={false}
            description={`ÉIRVOX · ${listingTitle} · ${selectedVariant?.style_label ?? ''}`}
            variantStyleKey={selectedVariant?.style_key ?? null}
            variantFamilyKey={selectedVariant?.family_key ?? null}
            showRefundLink={true}
            on:success={(e) => dispatch('success', e.detail)}
            on:error={(e) => dispatch('error', e.detail)}
            on:cancel={() => dispatch('cancel')}
          />
        {:else}
          <button class="vp__buy-disabled" type="button" disabled>
            {selectedChassis ? 'Choose a finish' : 'Pick your fitment'}
          </button>
        {/if}
      </div>
    </div>

    <!-- Fitment finder overlay (light-weight inline chassis list) -->
    {#if showFinderOverlay}
      <div class="vp__overlay" role="dialog" tabindex="-1" aria-label="Choose your fitment"
           on:click|self={() => (showFinderOverlay = false)}
           on:keydown={(e) => { if (e.key === 'Escape') showFinderOverlay = false; }}>
        <div class="vp__overlay-panel">
          <header class="vp__overlay-head">
            <span class="evx-label">Find your fit</span>
            <button class="vp__overlay-close" type="button"
                    on:click={() => (showFinderOverlay = false)} aria-label="Close">✕</button>
          </header>
          <input class="vp__overlay-search" type="search"
                 placeholder="e.g. F30, 3 Series, E92"
                 bind:value={chassisFilter} autocomplete="off" />
          <ul class="vp__overlay-list">
            {#each filteredChassis as c (c.id)}
              <li>
                <button class="vp__overlay-row" type="button" on:click={() => pickChassis(c.id)}>
                  <span>{c.display_name}</span>
                  <Chevron size={12} color="var(--evx-ink-soft)" />
                </button>
              </li>
            {:else}
              <li class="vp__overlay-empty">No match. Try a chassis code or model name.</li>
            {/each}
          </ul>
          {#if selectedChassis}
            <button class="vp__overlay-clear" type="button" on:click={clearFitment}>
              Clear fitment
            </button>
          {/if}
        </div>
      </div>
    {/if}

  {/if}
</section>

<style>
  .vp {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    color: var(--evx-ink);
    font-family: var(--evx-font-display);
  }
  .vp__loading, .vp__empty {
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    padding: 14px 0;
  }

  /* Fitment tag */
  .vp__fit {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 9px 13px;
    border-radius: 2px;
    background: rgba(232, 116, 44, 0.08);
    border: 1px solid rgba(232, 116, 44, 0.3);
    align-self: flex-start;
  }
  .vp__fit-check {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: var(--evx-fox-orange);
    display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .vp__fit-text {
    font-weight: 500;
    font-size: 13.5px;
    color: var(--evx-ink);
    white-space: nowrap;
  }
  .vp__fit-change {
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    color: var(--evx-fox-orange);
    text-decoration: underline;
    text-underline-offset: 3px;
    background: none; border: none; cursor: pointer; padding: 0;
  }

  .vp__fit-prompt {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 2px;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    color: var(--evx-ink-soft);
    font-family: var(--evx-font-mono);
    font-size: 12px;
    align-self: flex-start;
    cursor: pointer;
  }
  .vp__fit-prompt:hover { border-color: var(--evx-ink-soft); color: var(--evx-ink); }

  /* Finish picker */
  .vp__finish { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .vp__finish-label { color: var(--evx-ink-soft); }
  .vp__chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }
  .vp__finish-stock {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    color: var(--evx-ink-soft);
  }

  /* Sticky buy bar */
  .vp__buy {
    position: sticky;
    bottom: 0;
    margin: 20px -16px -16px;
    padding: 14px 16px max(20px, env(safe-area-inset-bottom));
    background: rgba(245, 242, 237, 0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid var(--evx-rule-light);
    display: flex;
    align-items: center;
    gap: 14px;
    z-index: 5;
  }
  .vp__buy-meta { flex-shrink: 0; min-width: 110px; }
  .vp__buy-style {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-bottom: 4px;
  }
  .vp__buy-cta { flex: 1; }
  .vp__buy-disabled {
    width: 100%;
    padding: 14px 18px;
    border-radius: 2px;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    color: var(--evx-ink-soft);
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    cursor: not-allowed;
  }

  /* Fitment overlay */
  .vp__overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(26, 26, 26, 0.42);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    animation: evx-fade 220ms ease both;
  }
  .vp__overlay-panel {
    width: 100%;
    max-width: 520px;
    max-height: 86vh;
    background: var(--evx-paper);
    border-top: 1px solid var(--evx-rule-light);
    border-radius: 8px 8px 0 0;
    padding: 18px 18px max(22px, env(safe-area-inset-bottom));
    overflow-y: auto;
    animation: evx-rise 260ms ease both;
  }
  .vp__overlay-head {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 12px;
  }
  .vp__overlay-close {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    color: var(--evx-ink);
    cursor: pointer;
    font-size: 16px;
  }
  .vp__overlay-search {
    width: 100%;
    background: rgba(26, 26, 26, 0.04);
    color: var(--evx-ink);
    border: 1px solid var(--evx-rule-light);
    padding: 12px 14px;
    font-family: var(--evx-font-display);
    font-size: 14px;
    outline: none;
    margin-bottom: 8px;
  }
  .vp__overlay-search:focus { border-color: var(--evx-ink-soft); }
  .vp__overlay-list { list-style: none; margin: 0; padding: 0; }
  .vp__overlay-row {
    width: 100%;
    display: flex; justify-content: space-between; align-items: center;
    text-align: left;
    padding: 14px 4px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    color: var(--evx-ink);
    font-family: var(--evx-font-display);
    font-size: 14px;
    cursor: pointer;
  }
  .vp__overlay-row:hover { background: rgba(26, 26, 26, 0.035); }
  .vp__overlay-empty {
    padding: 14px;
    font-size: 13px;
    color: var(--evx-ink-soft);
    text-align: center;
  }
  .vp__overlay-clear {
    margin-top: 12px;
    width: 100%;
    background: transparent;
    color: var(--evx-ink-soft);
    border: 1px solid var(--evx-rule-light);
    padding: 10px;
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    cursor: pointer;
  }
</style>
