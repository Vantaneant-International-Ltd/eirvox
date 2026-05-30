<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getAllListings,
    getListingDetail,
    adminUpdateListing,
    adminDeleteListing,
    adminBulkSetListingStatus,
    getAllMarketplaceCategories,
    listingStatusBadge,
    type AdminListing,
    type ListingFilters,
    type MarketplaceCategory,
  } from '../../lib/admin';
  import type { ListingStatus, ListingImage, ListingSpec } from '../../lib/listings';
  import { applySeo } from '../../lib/seo';

  // ── State ──
  let loading = true;
  let listings: AdminListing[] = [];
  let categories: MarketplaceCategory[] = [];
  let filters: ListingFilters = { status: 'all', category_slug: 'all', search: '', sort: 'created_desc' };
  let selected = new Set<string>();

  // Detail panel state
  let detailOpen = false;
  let detail: { listing: AdminListing; images: ListingImage[]; specs: ListingSpec[] } | null = null;
  let detailLoading = false;
  let detailError = '';
  let rejectReason = '';

  // ── Init ──
  onMount(async () => {
    applySeo({ title: 'Admin · Listings', description: 'Manage marketplace listings.', path: '/admin/listings' });

    // Honour query params from dashboard pending-cards
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx > -1) {
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      const s = params.get('status') as ListingStatus | null;
      if (s) filters.status = s;
    }

    categories = await getAllMarketplaceCategories();
    await refresh();
  });

  async function refresh() {
    loading = true;
    listings = await getAllListings(filters);
    loading = false;
  }

  // Re-fetch when filters change
  let firstFiltersChange = true;
  $: {
    // Touch reactivity dependencies
    filters.status; filters.category_slug; filters.search; filters.sort;
    if (firstFiltersChange) { firstFiltersChange = false; }
    else { void refresh(); }
  }

  // ── Detail ──
  async function openDetail(id: string) {
    detailOpen = true;
    detailLoading = true;
    detailError = '';
    rejectReason = '';
    const d = await getListingDetail(id);
    if (!d) {
      detailError = 'Could not load this listing.';
      detail = null;
    } else {
      detail = d;
    }
    detailLoading = false;
  }

  function closeDetail() {
    detailOpen = false;
    detail = null;
  }

  // ── Single-row actions ──
  async function setStatus(id: string, status: ListingStatus, reason?: string) {
    const r = await adminUpdateListing(id, { status, ...(reason ? { rejection_reason: reason } : {}) });
    if (!r.ok) { detailError = r.error ?? 'Update failed.'; return; }
    await refresh();
    if (detail?.listing.id === id && r.data) {
      detail = { ...detail, listing: { ...detail.listing, ...r.data } };
    }
  }

  async function toggleFeatured(id: string, featured: boolean) {
    const r = await adminUpdateListing(id, { featured });
    if (!r.ok) { detailError = r.error ?? 'Failed.'; return; }
    await refresh();
    if (detail?.listing.id === id && r.data) {
      detail = { ...detail, listing: { ...detail.listing, ...r.data } };
    }
  }

  async function deleteRow(id: string) {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return;
    const r = await adminDeleteListing(id);
    if (!r.ok) { detailError = r.error ?? 'Delete failed.'; return; }
    closeDetail();
    await refresh();
  }

  // ── Bulk actions ──
  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    selected = next;
  }

  function toggleSelectAll() {
    if (selected.size === listings.length) selected = new Set();
    else selected = new Set(listings.map(l => l.id));
  }

  async function bulkAction(status: ListingStatus) {
    if (selected.size === 0) return;
    const r = await adminBulkSetListingStatus([...selected], status);
    if (!r.ok) { alert(r.error ?? 'Bulk update failed.'); return; }
    selected = new Set();
    await refresh();
  }

  // ── Inline edit (price, title) ──
  let editingField: { id: string; field: 'title' | 'price' } | null = null;
  let editValue = '';

  function startEdit(row: AdminListing, field: 'title' | 'price') {
    editingField = { id: row.id, field };
    editValue = field === 'price' ? String(row.price) : row.title;
  }

  async function commitEdit() {
    if (!editingField) return;
    const { id, field } = editingField;
    const patch: any = field === 'price'
      ? { price: Math.max(0, Math.round(Number(editValue) || 0)) }
      : { title: editValue.trim() };
    editingField = null;
    const r = await adminUpdateListing(id, patch);
    if (!r.ok) { alert(r.error ?? 'Update failed.'); return; }
    await refresh();
  }
</script>

<AdminLayout title="Listings">

  <!-- ─────────── Toolbar ─────────── -->
  <div class="adm-toolbar">
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Status</span>
      <select class="adm-select" bind:value={filters.status}>
        <option value="all">All</option>
        <option value="draft">Draft</option>
        <option value="pending_review">Pending review</option>
        <option value="active">Active</option>
        <option value="reserved">Reserved</option>
        <option value="sold">Sold</option>
        <option value="removed">Removed</option>
      </select>
    </div>

    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Category</span>
      <select class="adm-select" bind:value={filters.category_slug}>
        <option value="all">All</option>
        {#each categories as c}
          <option value={c.slug}>{c.name}</option>
        {/each}
      </select>
    </div>

    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Sort</span>
      <select class="adm-select" bind:value={filters.sort}>
        <option value="created_desc">Newest first</option>
        <option value="created_asc">Oldest first</option>
        <option value="price_desc">Price ↓</option>
        <option value="price_asc">Price ↑</option>
        <option value="views_desc">Most viewed</option>
      </select>
    </div>

    <div class="adm-toolbar__group" style="flex: 1; justify-content: flex-end;">
      <input
        type="search"
        class="adm-input adm-input--wide"
        placeholder="Search title…"
        bind:value={filters.search}
      />
    </div>
  </div>

  <!-- ─────────── Bulk actions ─────────── -->
  {#if selected.size > 0}
    <div class="adm-toolbar" style="background: rgba(232, 116, 44, 0.08); border-color: var(--evx-fox-orange);">
      <span class="adm-toolbar__label" style="color: var(--evx-warm-black);">{selected.size} selected</span>
      <div class="adm-actions" style="margin-left: auto;">
        <button class="adm-btn adm-btn--sm" on:click={() => bulkAction('active')}>Approve</button>
        <button class="adm-btn adm-btn--sm adm-btn--danger" on:click={() => bulkAction('removed')}>Remove</button>
        <button class="adm-btn adm-btn--sm" on:click={() => (selected = new Set())}>Clear</button>
      </div>
    </div>
  {/if}

  <!-- ─────────── Table ─────────── -->
  {#if loading}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
  {:else if listings.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No listings match these filters</h3>
      <p class="adm-state__sub">Try widening the status filter or clearing search.</p>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th style="width: 32px;">
              <input type="checkbox" class="adm-checkbox"
                     checked={selected.size === listings.length && listings.length > 0}
                     on:change={toggleSelectAll} />
            </th>
            <th style="width: 64px;">Image</th>
            <th>Title</th>
            <th>Seller</th>
            <th>Category</th>
            <th>Price</th>
            <th>Status</th>
            <th>Posted</th>
            <th>Views</th>
          </tr>
        </thead>
        <tbody>
          {#each listings as row (row.id)}
            {@const badge = listingStatusBadge[row.status]}
            <tr class:is-selected={selected.has(row.id)} class:adm-row--dim={row.status === 'removed'}>
              <td on:click|stopPropagation>
                <input type="checkbox" class="adm-checkbox"
                       checked={selected.has(row.id)}
                       on:change={() => toggleSelect(row.id)} />
              </td>
              <td on:click={() => openDetail(row.id)}>
                {#if row.cover_image}
                  <img class="adm-table__thumb" src={row.cover_image} alt="" />
                {:else}
                  <div class="adm-table__thumb adm-table__thumb--empty">—</div>
                {/if}
              </td>
              <td on:click={() => openDetail(row.id)}>
                {#if editingField?.id === row.id && editingField.field === 'title'}
                  <input class="adm-input" bind:value={editValue}
                         on:blur={commitEdit}
                         on:keydown={(e) => e.key === 'Enter' && commitEdit()} />
                {:else}
                  <span
                    role="button"
                    tabindex="0"
                    title="Double-click to edit"
                    on:dblclick|stopPropagation={() => startEdit(row, 'title')}>{row.title}</span>
                  {#if row.featured}
                    <span class="adm-badge adm-badge--amber" style="margin-left: 6px;">FEATURED</span>
                  {/if}
                {/if}
              </td>
              <td on:click={() => openDetail(row.id)}>{row.seller?.trading_name ?? '—'}</td>
              <td on:click={() => openDetail(row.id)}>{row.category?.name ?? row.category_slug ?? '—'}</td>
              <td on:click|stopPropagation>
                {#if editingField?.id === row.id && editingField.field === 'price'}
                  <input class="adm-input" type="number" bind:value={editValue} style="width: 100px;"
                         on:blur={commitEdit}
                         on:keydown={(e) => e.key === 'Enter' && commitEdit()} />
                {:else}
                  <span
                    role="button"
                    tabindex="0"
                    title="Double-click to edit"
                    on:dblclick={() => startEdit(row, 'price')}>€{row.price.toLocaleString()}</span>
                {/if}
              </td>
              <td on:click={() => openDetail(row.id)}>
                <span class={`adm-badge adm-badge--${badge.tone}`}>{badge.label}</span>
              </td>
              <td on:click={() => openDetail(row.id)} class="adm-mono">
                {new Date(row.created_at).toLocaleDateString()}
              </td>
              <td on:click={() => openDetail(row.id)} class="adm-mono">{row.views_count}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  <!-- ─────────── Detail panel ─────────── -->
  {#if detailOpen}
    <div class="adm-detail__backdrop" on:click={closeDetail} role="presentation"></div>
    <aside class="adm-detail" aria-label="Listing detail">
      <header class="adm-detail__head">
        <h2 class="adm-detail__h">Listing detail</h2>
        <button class="adm-detail__close" on:click={closeDetail}>CLOSE</button>
      </header>

      <div class="adm-detail__body">
        {#if detailLoading}
          <p class="adm-muted">Loading…</p>
        {:else if detailError}
          <div class="adm-state adm-state--err">
            <p class="adm-state__sub">{detailError}</p>
          </div>
        {:else if detail}
          <!-- Images strip + edit link (image upload/remove lives on /sell/edit/[id]) -->
          <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            {#if detail.images.length > 0}
              <div style="display: flex; gap: 4px; overflow-x: auto; flex: 1;">
                {#each detail.images as img}
                  <img src={img.public_url ?? ''} alt=""
                       style="height: 96px; width: 96px; object-fit: cover; border-radius: 2px; flex-shrink: 0;" />
                {/each}
              </div>
            {:else}
              <span class="adm-muted">No images uploaded.</span>
            {/if}
            <a href={`#/sell/edit/${detail.listing.id}`} target="_blank" rel="noopener"
               style="font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.06em;
                      text-decoration: none; color: var(--evx-warm-black);
                      border: 1px solid var(--evx-rule-light); padding: 8px 12px; border-radius: 2px;
                      flex-shrink: 0; white-space: nowrap;">
              Edit listing →
            </a>
          </div>
          <p class="adm-muted" style="font-size: 11px; margin: -12px 0 20px;">
            Add or remove photos, reorder specs, and edit any field on the dedicated edit page.
          </p>

          <div class="adm-field">
            <span class="adm-field__label">Title</span>
            <input class="adm-field__input" bind:value={detail.listing.title}
                   on:blur={() => adminUpdateListing(detail.listing.id, { title: detail.listing.title })} />
          </div>

          <div class="adm-field--row">
            <div class="adm-field">
              <span class="adm-field__label">Price (€)</span>
              <input type="number" class="adm-field__input" bind:value={detail.listing.price}
                     on:blur={() => adminUpdateListing(detail.listing.id, { price: detail.listing.price })} />
            </div>
            <div class="adm-field">
              <span class="adm-field__label">Category</span>
              <select class="adm-field__select" bind:value={detail.listing.category_slug}
                      on:change={() => adminUpdateListing(detail.listing.id, { category_slug: detail.listing.category_slug })}>
                {#each categories as c}
                  <option value={c.slug}>{c.name}</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="adm-field">
            <span class="adm-field__label">Subtitle</span>
            <input class="adm-field__input" bind:value={detail.listing.subtitle}
                   on:blur={() => adminUpdateListing(detail.listing.id, { subtitle: detail.listing.subtitle })} />
          </div>

          <div class="adm-field">
            <span class="adm-field__label">Description</span>
            <textarea class="adm-field__textarea" bind:value={detail.listing.description}
                      on:blur={() => adminUpdateListing(detail.listing.id, { description: detail.listing.description })}
                      rows="4"></textarea>
          </div>

          <div class="adm-field--row">
            <div class="adm-field">
              <span class="adm-field__label">Condition</span>
              <input class="adm-field__input" bind:value={detail.listing.condition}
                     on:blur={() => adminUpdateListing(detail.listing.id, { condition: detail.listing.condition })} />
            </div>
            <div class="adm-field">
              <span class="adm-field__label">City</span>
              <input class="adm-field__input" bind:value={detail.listing.city}
                     on:blur={() => adminUpdateListing(detail.listing.id, { city: detail.listing.city })} />
            </div>
          </div>

          <div class="adm-field">
            <span class="adm-field__label">Seller</span>
            <div class="adm-mono">{detail.listing.seller?.trading_name ?? '—'} · {detail.listing.seller?.handle ?? ''}</div>
          </div>

          <!-- Specs -->
          {#if detail.specs.length > 0}
            <div class="adm-field">
              <span class="adm-field__label">Specs</span>
              <div style="border: 1px solid var(--evx-rule-light); padding: 12px;">
                {#each detail.specs as s}
                  <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 8px; padding: 4px 0; font-size: 13px;">
                    <span class="adm-muted">{s.label}</span>
                    <span>{s.value}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          {#if detail.listing.status === 'pending_review'}
            <div class="adm-field">
              <span class="adm-field__label">Rejection reason (optional, used if you reject)</span>
              <input class="adm-field__input" bind:value={rejectReason} placeholder="e.g. Image quality below standard" />
            </div>
          {/if}
        {/if}
      </div>

      <footer class="adm-detail__foot">
        {#if detail}
          {#if detail.listing.status === 'pending_review'}
            <button class="adm-btn adm-btn--primary" on:click={() => setStatus(detail.listing.id, 'active')}>
              Approve → active
            </button>
            <button class="adm-btn adm-btn--danger" on:click={() => setStatus(detail.listing.id, 'removed', rejectReason)}>
              Reject
            </button>
          {:else if detail.listing.status === 'active'}
            <button class="adm-btn"
                    on:click={() => toggleFeatured(detail.listing.id, !detail.listing.featured)}>
              {detail.listing.featured ? 'Unfeature' : 'Feature'}
            </button>
            <button class="adm-btn adm-btn--danger" on:click={() => setStatus(detail.listing.id, 'removed')}>
              Remove
            </button>
          {:else if detail.listing.status === 'removed'}
            <button class="adm-btn" on:click={() => setStatus(detail.listing.id, 'active')}>
              Restore → active
            </button>
            <button class="adm-btn adm-btn--danger" on:click={() => deleteRow(detail.listing.id)}>
              Delete permanently
            </button>
          {:else}
            <button class="adm-btn adm-btn--danger" on:click={() => setStatus(detail.listing.id, 'removed')}>
              Remove
            </button>
          {/if}
        {/if}
      </footer>
    </aside>
  {/if}

</AdminLayout>
