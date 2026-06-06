<script lang="ts">
  // ============================================================
  // Buyer-facing 2-axis variant picker for wheel-consignment listings.
  //
  // Fitment-first UX: the buyer picks their actual model/chassis from a
  // searchable list; we map that to one of the three internal family
  // keys (m3 / m5 / e9d). They never see the codes. Then they pick a
  // style; sold-out cells visibly disabled.
  //
  // Server is the source of truth for price and stock. This component
  // only routes the (style, family) selection to PayButton, which sends
  // it to payments-create-order. The server re-resolves price + stock.
  // ============================================================
  import { onMount, createEventDispatcher } from 'svelte';
  import {
    getListingVariants, getFitmentChassis,
    type ListingVariant, type FitmentChassis,
  } from './api';
  import PayButton from './PayButton.svelte';
  import { formatPrice } from './api';

  export let listingId: string;
  export let basePriceEur: number;          // listings.price (sale price)
  export let originalPriceEur: number | null = null;  // "was" reference
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
  let chassisFilter = '';

  onMount(async () => {
    [variants, chassis] = await Promise.all([
      getListingVariants(listingId),
      getFitmentChassis(),
    ]);
    loading = false;
  });

  // Derived view-state.
  $: selectedChassis = chassis.find(c => c.id === selectedChassisId) ?? null;
  $: selectedFamilyKey = selectedChassis?.family_key ?? null;

  // Distinct styles (deduped across families), in matrix sort order.
  $: styles = (() => {
    const seen = new Map<string, { key: string; label: string; sort: number }>();
    for (const v of variants) {
      if (!seen.has(v.style_key)) {
        seen.set(v.style_key, { key: v.style_key, label: v.style_label, sort: v.sort_order });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.sort - b.sort);
  })();

  // For each style, find the variant row matching the selected family
  // (if any). Used to grey out sold-out cells and show price_delta.
  function variantFor(styleKey: string, familyKey: string | null): ListingVariant | null {
    if (!familyKey) return null;
    return variants.find(v => v.style_key === styleKey && v.family_key === familyKey) ?? null;
  }

  $: selectedVariant = (selectedStyleKey && selectedFamilyKey)
    ? variantFor(selectedStyleKey, selectedFamilyKey)
    : null;

  $: resolvedPriceEur = selectedVariant
    ? basePriceEur + (selectedVariant.price_delta_eur ?? 0)
    : basePriceEur;

  $: payReady = !!(selectedVariant && selectedVariant.stock_count > 0);

  $: filteredChassis = chassisFilter.trim()
    ? chassis.filter(c => c.display_name.toLowerCase().includes(chassisFilter.trim().toLowerCase()))
    : chassis;

  function pickChassis(id: string) {
    selectedChassisId = id;
    // If currently selected style is sold-out under the new family, clear it.
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

  function clearAll() {
    selectedChassisId = null;
    selectedStyleKey = null;
    chassisFilter = '';
  }
</script>

<section class="vp" aria-label="Choose your fitment and style">

  {#if loading}
    <div class="vp__loading">Loading fitments and styles.</div>

  {:else if variants.length === 0}
    <div class="vp__empty">No variants configured for this listing yet.</div>

  {:else}

    <!-- Step 1: fitment by real model name -->
    <div class="vp__step">
      <header class="vp__step-head">
        <span class="vp__step-num">01</span>
        <span class="vp__step-label">FIND YOUR FITMENT</span>
      </header>

      {#if !selectedChassis}
        <p class="vp__step-sub">Pick the model that matches your car. We will route it to the correct fitment group.</p>

        <input type="search"
               class="vp__search"
               bind:value={chassisFilter}
               placeholder="e.g. F30, 3-Series, E92"
               autocomplete="off" />

        <ul class="vp__chassis">
          {#each filteredChassis as c (c.id)}
            <li>
              <button type="button"
                      class="vp__chassis-row"
                      on:click={() => pickChassis(c.id)}>
                <span class="vp__chassis-name">{c.display_name}</span>
              </button>
            </li>
          {:else}
            <li class="vp__chassis-empty">No match. Try a chassis code or model name.</li>
          {/each}
        </ul>
      {:else}
        <div class="vp__chassis-chosen">
          <div>
            <span class="vp__chassis-chosen-label">FITMENT</span>
            <div class="vp__chassis-chosen-name">{selectedChassis.display_name}</div>
          </div>
          <button type="button" class="vp__change" on:click={clearAll}>Change</button>
        </div>
      {/if}
    </div>

    <!-- Step 2: style grid -->
    {#if selectedChassis}
      <div class="vp__step">
        <header class="vp__step-head">
          <span class="vp__step-num">02</span>
          <span class="vp__step-label">CHOOSE A STYLE</span>
        </header>
        <p class="vp__step-sub">Each style ships in your selected fitment. Sold-out combinations are visibly disabled.</p>

        <div class="vp__styles">
          {#each styles as s (s.key)}
            {@const v = variantFor(s.key, selectedFamilyKey)}
            {@const soldOut = !v || v.stock_count <= 0}
            {@const delta = v?.price_delta_eur ?? 0}
            <button type="button"
                    class="vp__style"
                    class:vp__style--selected={selectedStyleKey === s.key && !soldOut}
                    class:vp__style--soldout={soldOut}
                    disabled={soldOut}
                    aria-pressed={selectedStyleKey === s.key}
                    on:click={() => pickStyle(s.key)}>
              <span class="vp__style-label">{s.label}</span>
              <span class="vp__style-meta">
                {#if soldOut}
                  Sold out
                {:else}
                  {delta > 0 ? `+${formatPrice(delta)}` : delta < 0 ? `−${formatPrice(Math.abs(delta))}` : 'No upcharge'}
                {/if}
              </span>
              <span class="vp__style-stock">
                {#if !soldOut && v}{v.stock_count} left{/if}
              </span>
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Step 3: pay -->
    {#if selectedChassis && selectedStyleKey && selectedVariant}
      <div class="vp__pay">
        <div class="vp__pay-line">
          <span class="vp__pay-label">TOTAL</span>
          <span class="vp__pay-price">
            {#if originalPriceEur && originalPriceEur > resolvedPriceEur}
              <s class="vp__was">{formatPrice(originalPriceEur)}</s>
            {/if}
            <strong>{formatPrice(resolvedPriceEur)}</strong>
          </span>
        </div>
        <div class="vp__pay-sub">
          {selectedChassis.display_name} · {selectedVariant.style_label}
        </div>

        {#if payReady}
          <PayButton
            listingId={listingId}
            amountEur={resolvedPriceEur}
            fulfilment={fulfilment}
            isDeposit={false}
            description={`ÉIRVOX — ${listingTitle} · ${selectedVariant.style_label}`}
            variantStyleKey={selectedVariant.style_key}
            variantFamilyKey={selectedVariant.family_key}
            showRefundLink={true}
            on:success={(e) => dispatch('success', e.detail)}
            on:error={(e) => dispatch('error', e.detail)}
            on:cancel={() => dispatch('cancel')}
          />
        {/if}
      </div>
    {/if}

  {/if}
</section>

<style>
  .vp { display: flex; flex-direction: column; gap: var(--evx-space-xl); }

  .vp__loading, .vp__empty {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    padding: var(--evx-space-md);
  }

  .vp__step {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .vp__step:last-of-type { border-bottom: none; }

  .vp__step-head { display: flex; align-items: baseline; gap: var(--evx-space-sm); }
  .vp__step-num {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
  }
  .vp__step-label {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-warm-black);
  }

  .vp__step-sub {
    font-size: 13px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
    margin: 0;
  }

  .vp__search {
    font-family: var(--evx-font-display);
    font-size: 15px;
    padding: 12px 14px;
    border: 1px solid var(--evx-rule-light);
    background: var(--evx-white, #fff);
    color: var(--evx-warm-black);
    outline: none;
  }
  .vp__search:focus { border-color: var(--evx-warm-black); }

  .vp__chassis {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 260px;
    overflow-y: auto;
    border: 1px solid var(--evx-rule-light);
  }
  .vp__chassis-row {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: 12px 14px;
    cursor: pointer;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    transition: background 150ms ease;
  }
  .vp__chassis-row:hover { background: rgba(0, 0, 0, 0.03); }
  .vp__chassis-row:last-child { border-bottom: none; }

  .vp__chassis-empty {
    padding: 14px;
    font-size: 13px;
    color: var(--evx-ink-soft);
    text-align: center;
  }

  .vp__chassis-chosen {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px;
    border: 1px solid var(--evx-rule-light);
    background: rgba(232, 116, 44, 0.03);
  }
  .vp__chassis-chosen-label {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: 4px;
  }
  .vp__chassis-chosen-name {
    font-family: var(--evx-font-display);
    font-size: 15px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .vp__change {
    background: none;
    border: none;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    text-decoration: underline;
    cursor: pointer;
  }
  .vp__change:hover { color: var(--evx-warm-black); }

  .vp__styles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--evx-space-sm);
  }
  .vp__style {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    padding: 14px;
    border: 1px solid var(--evx-rule-light);
    background: var(--evx-white, #fff);
    cursor: pointer;
    text-align: left;
    transition: border-color 150ms ease, background 150ms ease;
    min-height: 84px;
  }
  .vp__style:hover:not(:disabled) { border-color: var(--evx-warm-black); }
  .vp__style--selected {
    border-color: var(--evx-warm-black);
    background: rgba(232, 116, 44, 0.05);
  }
  .vp__style--soldout {
    opacity: 0.45;
    cursor: not-allowed;
    background: rgba(0, 0, 0, 0.02);
  }
  .vp__style-label {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .vp__style-meta {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
  }
  .vp__style-stock {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    color: var(--evx-fox-orange);
    margin-top: 4px;
  }

  .vp__pay {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding: var(--evx-space-lg);
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
  }
  .vp__pay-line {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .vp__pay-label {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-ink-soft);
  }
  .vp__pay-price {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    color: var(--evx-warm-black);
    display: inline-flex;
    align-items: baseline;
    gap: var(--evx-space-sm);
  }
  .vp__was {
    font-size: 14px;
    color: var(--evx-ink-soft);
    text-decoration: line-through;
  }
  .vp__pay-sub {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
  }
</style>
