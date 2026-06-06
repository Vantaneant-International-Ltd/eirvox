<script lang="ts">
  // ============================================================
  // Admin-side editor for the 2-axis variant matrix on a listing.
  // 7 styles x 3 fitment families = 21 cells. Each cell carries its
  // own stock_count and price_delta_eur. RLS gates writes to admins
  // (is_admin()); table-level grants give authenticated INSERT/UPDATE/
  // DELETE. The race-safe decrement happens server-side in
  // complete_order; this editor is the manual override / seed UI.
  // ============================================================
  import { onMount } from 'svelte';
  import { supabase } from './supabase';
  import {
    getListingVariants, getFitmentChassis,
    type ListingVariant, type FitmentChassis,
  } from './api';

  export let listingId: string;

  interface Family { key: string; internal_name: string; sort_order: number }

  let families: Family[] = [];
  let chassis: FitmentChassis[] = [];
  let variants: ListingVariant[] = [];
  let loading = true;
  let saving = '';

  // Local style list, derived from existing variants. Empty matrix can
  // be seeded from this UI by adding styles one row at a time.
  let styles: { key: string; label: string; sort_order: number }[] = [];

  // New-style form state
  let newStyleKey = '';
  let newStyleLabel = '';

  async function load() {
    loading = true;
    const [varRows, chassisRows, famRes] = await Promise.all([
      getListingVariants(listingId),
      getFitmentChassis(),
      supabase
        .from('fitment_families')
        .select('key, internal_name, sort_order')
        .order('sort_order', { ascending: true }),
    ]);
    variants = varRows;
    chassis = chassisRows;
    families = ((famRes.data as Family[]) ?? []);

    // Derive distinct styles from current matrix.
    const seen = new Map<string, { key: string; label: string; sort_order: number }>();
    for (const v of variants) {
      if (!seen.has(v.style_key)) {
        seen.set(v.style_key, { key: v.style_key, label: v.style_label, sort_order: v.sort_order });
      }
    }
    styles = Array.from(seen.values()).sort((a, b) => a.sort_order - b.sort_order);
    loading = false;
  }

  onMount(load);

  function cellFor(styleKey: string, familyKey: string): ListingVariant | null {
    return variants.find(v => v.style_key === styleKey && v.family_key === familyKey) ?? null;
  }

  async function upsertCell(styleKey: string, styleLabel: string, familyKey: string,
                            stockCount: number, priceDelta: number, sortOrder: number) {
    saving = `${styleKey}/${familyKey}`;
    const existing = cellFor(styleKey, familyKey);
    if (existing) {
      const { error } = await supabase
        .from('listing_variants')
        .update({
          style_label:     styleLabel,
          stock_count:     stockCount,
          price_delta_eur: priceDelta,
          sort_order:      sortOrder,
        })
        .eq('id', existing.id);
      if (error) { console.error('[variants] update failed:', error); saving = ''; return; }
    } else {
      const { error } = await supabase
        .from('listing_variants')
        .insert({
          listing_id:      listingId,
          style_key:       styleKey,
          style_label:     styleLabel,
          family_key:      familyKey,
          stock_count:     stockCount,
          price_delta_eur: priceDelta,
          sort_order:      sortOrder,
        });
      if (error) { console.error('[variants] insert failed:', error); saving = ''; return; }
    }
    await load();
    saving = '';
  }

  function addStyle() {
    const key = newStyleKey.trim().toLowerCase().replace(/\s+/g, '_');
    const label = newStyleLabel.trim();
    if (!key || !label) return;
    if (styles.some(s => s.key === key)) return;
    const next = (styles[styles.length - 1]?.sort_order ?? 0) + 10;
    styles = [...styles, { key, label, sort_order: next }];
    newStyleKey = '';
    newStyleLabel = '';
  }

  async function removeStyle(styleKey: string) {
    if (!confirm(`Remove all ${families.length} cells for style "${styleKey}"? Stock data will be lost.`)) return;
    const { error } = await supabase
      .from('listing_variants')
      .delete()
      .eq('listing_id', listingId)
      .eq('style_key', styleKey);
    if (error) { console.error('[variants] delete failed:', error); return; }
    await load();
  }

  function totalStock(): number {
    return variants.reduce((sum, v) => sum + (v.stock_count ?? 0), 0);
  }
</script>

<section class="vm">

  <header class="vm__head">
    <div>
      <span class="vm__pre">VARIANT MATRIX</span>
      <h3 class="vm__h">Style × Fitment family</h3>
      <p class="vm__sub">
        Each cell carries its own stock and price delta.
        Total stock now: <strong>{totalStock()}</strong>.
      </p>
    </div>
  </header>

  {#if loading}
    <p class="vm__loading">Loading variants.</p>
  {:else}

    {#if families.length === 0}
      <p class="vm__warn">
        No fitment families exist in the database yet. Apply v20 SQL and seed
        public.fitment_families before editing the matrix.
      </p>
    {:else}

      <table class="vm__table">
        <thead>
          <tr>
            <th class="vm__th vm__th--style">Style</th>
            {#each families as f (f.key)}
              <th class="vm__th">
                {f.key.toUpperCase()}
                <span class="vm__th-sub">{f.internal_name}</span>
              </th>
            {/each}
            <th class="vm__th vm__th--actions"></th>
          </tr>
        </thead>
        <tbody>
          {#each styles as s (s.key)}
            <tr>
              <td class="vm__td vm__td--style">
                <input class="vm__cell-input vm__cell-input--label"
                       bind:value={s.label}
                       on:blur={() => {
                         for (const f of families) {
                           const c = cellFor(s.key, f.key);
                           if (c) void upsertCell(s.key, s.label, f.key, c.stock_count, c.price_delta_eur, s.sort_order);
                         }
                       }} />
                <span class="vm__cell-key">{s.key}</span>
              </td>
              {#each families as f (f.key)}
                {@const c = cellFor(s.key, f.key)}
                <td class="vm__td">
                  <label class="vm__cell">
                    <span class="vm__cell-label">Stock</span>
                    <input type="number" min="0" class="vm__cell-input"
                           value={c?.stock_count ?? 0}
                           on:change={(e) => {
                             const stock = Math.max(0, Number((e.target as HTMLInputElement).value));
                             const delta = c?.price_delta_eur ?? 0;
                             void upsertCell(s.key, s.label, f.key, stock, delta, s.sort_order);
                           }} />
                  </label>
                  <label class="vm__cell">
                    <span class="vm__cell-label">Δ €</span>
                    <input type="number" class="vm__cell-input"
                           value={c?.price_delta_eur ?? 0}
                           on:change={(e) => {
                             const delta = Math.round(Number((e.target as HTMLInputElement).value));
                             const stock = c?.stock_count ?? 0;
                             void upsertCell(s.key, s.label, f.key, stock, delta, s.sort_order);
                           }} />
                  </label>
                  {#if saving === `${s.key}/${f.key}`}
                    <span class="vm__cell-saving">Saving.</span>
                  {/if}
                </td>
              {/each}
              <td class="vm__td vm__td--actions">
                <button class="vm__remove" type="button"
                        on:click={() => removeStyle(s.key)}
                        title="Remove this style + all its cells">
                  Remove
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      <div class="vm__add">
        <span class="vm__add-label">ADD STYLE</span>
        <input class="vm__cell-input"
               bind:value={newStyleKey}
               placeholder="key (e.g. style_01)" />
        <input class="vm__cell-input"
               bind:value={newStyleLabel}
               placeholder="label (e.g. 437M)" />
        <button class="vm__add-btn" type="button" on:click={addStyle}>Add row</button>
      </div>

      <p class="vm__hint">
        New rows appear as empty cells. Enter a stock or Δ € and tab out to save.
        Each cell is a separate row in public.listing_variants.
      </p>

    {/if}

  {/if}

</section>

<style>
  .vm {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px dashed var(--evx-rule-light);
  }

  .vm__head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
  .vm__pre {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
  }
  .vm__h {
    font-family: var(--evx-font-display);
    font-size: 18px;
    font-weight: 500;
    margin: 4px 0 6px;
    color: var(--evx-warm-black);
  }
  .vm__sub { font-size: 12px; color: var(--evx-ink-soft); margin: 0; }
  .vm__sub strong { color: var(--evx-warm-black); }

  .vm__loading, .vm__warn {
    padding: 12px;
    font-size: 12px;
    color: var(--evx-ink-soft);
    background: rgba(0,0,0,0.02);
    border: 1px solid var(--evx-rule-light);
  }

  .vm__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
  }
  .vm__th {
    text-align: left;
    padding: 8px;
    border-bottom: 1px solid var(--evx-rule-light);
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--evx-warm-black);
    vertical-align: bottom;
  }
  .vm__th--style { width: 26%; }
  .vm__th--actions { width: 60px; }
  .vm__th-sub {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 9px;
    color: var(--evx-ink-soft);
    font-weight: normal;
    margin-top: 2px;
    text-transform: none;
  }

  .vm__td {
    padding: 6px 8px;
    border-bottom: 1px solid var(--evx-rule-light);
    vertical-align: top;
  }
  .vm__td--style { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
  .vm__td--actions { text-align: right; }

  .vm__cell { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .vm__cell:last-child { margin-bottom: 0; }
  .vm__cell-label {
    font-family: var(--evx-font-mono);
    font-size: 9px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    width: 30px;
  }
  .vm__cell-input {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    padding: 4px 6px;
    border: 1px solid var(--evx-rule-light);
    background: var(--evx-white, #fff);
    color: var(--evx-warm-black);
    width: 70px;
  }
  .vm__cell-input--label {
    font-family: var(--evx-font-display);
    font-size: 13px;
    width: 100%;
  }
  .vm__cell-key {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    color: var(--evx-ink-soft);
  }
  .vm__cell-saving {
    font-family: var(--evx-font-mono);
    font-size: 9px;
    color: var(--evx-fox-orange);
    margin-top: 4px;
    display: block;
  }

  .vm__remove {
    background: none;
    border: 1px solid var(--evx-rule-light);
    padding: 4px 8px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
    cursor: pointer;
  }
  .vm__remove:hover { color: #C9665A; border-color: #C9665A; }

  .vm__add {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--evx-rule-light);
  }
  .vm__add-label {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
    flex-shrink: 0;
  }
  .vm__add-btn {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border: none;
    padding: 6px 12px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    cursor: pointer;
  }

  .vm__hint {
    font-size: 11px;
    color: var(--evx-ink-soft);
    margin: 12px 0 0;
    line-height: 1.5;
  }
</style>
