<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getAllMarketplaceCategories,
    getAllTradeCategories,
    upsertMarketplaceCategory,
    upsertTradeCategory,
    deleteMarketplaceCategory,
    deleteTradeCategory,
    reorderCategories,
    type MarketplaceCategory,
    type TradeCategoryRow,
  } from '../../lib/admin';
  import { applySeo } from '../../lib/seo';

  type Tab = 'marketplace' | 'trade';
  let tab: Tab = 'marketplace';

  let loading = true;
  let marketCategories: MarketplaceCategory[] = [];
  let tradeCategories: TradeCategoryRow[] = [];
  let actionError = '';

  // New category form (uses tab to know which table)
  let newSlug = '';
  let newName = '';
  let newDesc = '';

  // Inline edit
  let editingId: string | null = null;
  let editName = '';
  let editDesc = '';

  // Drag state for reorder
  let dragId: string | null = null;

  onMount(async () => {
    applySeo({ title: 'Admin · Categories', description: 'Manage marketplace + trade categories.', path: '/admin/categories' });
    await refresh();
  });

  async function refresh() {
    loading = true;
    [marketCategories, tradeCategories] = await Promise.all([
      getAllMarketplaceCategories(),
      getAllTradeCategories(),
    ]);
    loading = false;
  }

  function activeList(): (MarketplaceCategory | TradeCategoryRow)[] {
    return tab === 'marketplace' ? marketCategories : tradeCategories;
  }

  async function addCategory() {
    actionError = '';
    if (!newSlug.trim() || !newName.trim()) {
      actionError = 'Slug and name are required.'; return;
    }
    const payload = {
      slug: newSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newName.trim(),
      description: newDesc.trim() || null,
      sort_order: activeList().length + 1,
      active: true,
    };
    const r = tab === 'marketplace'
      ? await upsertMarketplaceCategory(payload)
      : await upsertTradeCategory(payload);
    if (!r.ok) { actionError = r.error ?? 'Failed.'; return; }
    newSlug = ''; newName = ''; newDesc = '';
    await refresh();
  }

  function startEdit(row: MarketplaceCategory | TradeCategoryRow) {
    editingId = row.id;
    editName = row.name;
    editDesc = row.description ?? '';
  }

  async function saveEdit(row: MarketplaceCategory | TradeCategoryRow) {
    const patch = { slug: row.slug, name: editName.trim(), description: editDesc.trim() || null };
    const r = tab === 'marketplace'
      ? await upsertMarketplaceCategory(patch as any)
      : await upsertTradeCategory(patch as any);
    if (!r.ok) { actionError = r.error ?? 'Failed.'; return; }
    editingId = null;
    await refresh();
  }

  async function toggleActive(row: MarketplaceCategory | TradeCategoryRow) {
    const patch = { slug: row.slug, name: row.name, active: !row.active };
    const r = tab === 'marketplace'
      ? await upsertMarketplaceCategory(patch as any)
      : await upsertTradeCategory(patch as any);
    if (!r.ok) { actionError = r.error ?? 'Failed.'; return; }
    await refresh();
  }

  async function removeCategory(row: MarketplaceCategory | TradeCategoryRow) {
    actionError = '';
    if (!confirm(`Delete category "${row.name}"? This cannot be undone.`)) return;
    const r = tab === 'marketplace'
      ? await deleteMarketplaceCategory(row.id)
      : await deleteTradeCategory(row.id, row.slug);
    if (!r.ok) { actionError = r.error ?? 'Failed.'; return; }
    await refresh();
  }

  // Drag handlers
  function dragStart(id: string) { dragId = id; }
  function dragOver(e: DragEvent) { e.preventDefault(); }

  async function dropOn(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const list = activeList();
    const fromIdx = list.findIndex(c => c.id === dragId);
    const toIdx = list.findIndex(c => c.id === targetId);
    if (fromIdx < 0 || toIdx < 0) { dragId = null; return; }

    const reordered = [...list];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    const orderedIds = reordered.map(c => c.id);
    dragId = null;
    const r = await reorderCategories(tab === 'marketplace' ? 'categories' : 'trade_categories', orderedIds);
    if (!r.ok) { actionError = r.error ?? 'Reorder failed.'; return; }
    await refresh();
  }
</script>

<AdminLayout title="Categories">

  <!-- Tabs -->
  <div class="adm-tabs">
    <button class="adm-tab" class:is-active={tab === 'marketplace'} on:click={() => (tab = 'marketplace')}>
      Marketplace ({marketCategories.length})
    </button>
    <button class="adm-tab" class:is-active={tab === 'trade'} on:click={() => (tab = 'trade')}>
      Trade ({tradeCategories.length})
    </button>
  </div>

  {#if actionError}
    <div class="adm-state adm-state--err" style="margin-bottom: 16px;">
      <p class="adm-state__sub">{actionError}</p>
    </div>
  {/if}

  {#if loading}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
  {:else}
    <!-- Add new -->
    <section class="adm-section">
      <h2 class="adm-section__h">Add new {tab === 'marketplace' ? 'marketplace' : 'trade'} category</h2>
      <div class="adm-toolbar" style="margin-bottom: 0;">
        <input class="adm-input" placeholder="slug" bind:value={newSlug} style="width: 140px;" />
        <input class="adm-input" placeholder="Name" bind:value={newName} style="width: 200px;" />
        <input class="adm-input" placeholder="Description" bind:value={newDesc} style="flex: 1; min-width: 240px;" />
        <button class="adm-btn adm-btn--primary" on:click={addCategory}>Add</button>
      </div>
    </section>

    <!-- Table with drag-to-reorder -->
    <section class="adm-section">
      <h2 class="adm-section__h">Order &amp; visibility</h2>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width: 24px;">↕</th>
              <th style="width: 60px;">Order</th>
              <th>Slug</th>
              <th>Name</th>
              <th>Description</th>
              <th>Active</th>
              <th class="adm-table__cell--right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each activeList() as row (row.id)}
              <tr draggable="true"
                  on:dragstart={() => dragStart(row.id)}
                  on:dragover={dragOver}
                  on:drop={() => dropOn(row.id)}
                  class:adm-row--dim={!row.active}>
                <td class="adm-muted" style="cursor: grab;">≡</td>
                <td class="adm-mono">{row.sort_order}</td>
                <td class="adm-mono">{row.slug}</td>
                <td>
                  {#if editingId === row.id}
                    <input class="adm-input" bind:value={editName} />
                  {:else}
                    {row.name}
                  {/if}
                </td>
                <td>
                  {#if editingId === row.id}
                    <input class="adm-input" bind:value={editDesc} style="min-width: 240px;" />
                  {:else}
                    <span class="adm-muted">{row.description ?? '-'}</span>
                  {/if}
                </td>
                <td>
                  <input type="checkbox" class="adm-checkbox"
                         checked={row.active}
                         on:change={() => toggleActive(row)} />
                </td>
                <td class="adm-table__cell--right">
                  <div class="adm-actions" style="justify-content: flex-end;">
                    {#if editingId === row.id}
                      <button class="adm-btn adm-btn--sm adm-btn--primary" on:click={() => saveEdit(row)}>Save</button>
                      <button class="adm-btn adm-btn--sm" on:click={() => (editingId = null)}>Cancel</button>
                    {:else}
                      <button class="adm-btn adm-btn--sm" on:click={() => startEdit(row)}>Edit</button>
                      <button class="adm-btn adm-btn--sm adm-btn--danger" on:click={() => removeCategory(row)}>Delete</button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="adm-muted" style="font-size: 12px; margin-top: 8px;">
        Drag a row by its handle to reorder. Categories with listings/tradespeople can't be deleted - toggle them off instead.
      </p>
    </section>
  {/if}

</AdminLayout>
