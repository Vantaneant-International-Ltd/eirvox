<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getAllSellers,
    setSellerStatus,
    setSellerTier,
    sellerStatusBadge,
    type AdminSeller,
    type SellerFilters,
  } from '../../lib/admin';
  import type { SellerStatus, SellerTier } from '../../lib/sellers';
  import { applySeo } from '../../lib/seo';
  import { navigate } from '../../lib/router';

  let loading = true;
  let sellers: AdminSeller[] = [];
  let filters: SellerFilters = { status: 'all', tier: 'all', search: '' };
  let selected: AdminSeller | null = null;
  let actionError = '';
  let rejectReason = '';

  onMount(async () => {
    applySeo({ title: 'Admin · Sellers', description: 'Manage seller applications.', path: '/admin/sellers' });

    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx > -1) {
      const params = new URLSearchParams(hash.slice(qIdx + 1));
      const s = params.get('status') as SellerStatus | null;
      if (s) filters.status = s;
    }

    await refresh();
  });

  async function refresh() {
    loading = true;
    sellers = await getAllSellers(filters);
    loading = false;
  }

  let first = true;
  $: {
    filters.status; filters.tier; filters.search;
    if (first) first = false; else void refresh();
  }

  async function changeStatus(s: AdminSeller, status: SellerStatus) {
    actionError = '';
    const r = await setSellerStatus(s.id, status, status === 'rejected' ? rejectReason : undefined);
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    rejectReason = '';
    await refresh();
    if (selected?.id === s.id && r.data) selected = { ...selected, ...r.data };
  }

  async function changeTier(s: AdminSeller, tier: SellerTier) {
    actionError = '';
    const r = await setSellerTier(s.id, tier);
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    await refresh();
    if (selected?.id === s.id && r.data) selected = { ...selected, ...r.data };
  }
</script>

<AdminLayout title="Sellers">

  <div class="adm-toolbar">
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Status</span>
      <select class="adm-select" bind:value={filters.status}>
        <option value="all">All</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Tier</span>
      <select class="adm-select" bind:value={filters.tier}>
        <option value="all">All</option>
        <option value="verified">Verified</option>
        <option value="atelier">Atelier</option>
        <option value="house">House</option>
      </select>
    </div>
    <div class="adm-toolbar__group" style="flex: 1; justify-content: flex-end;">
      <input class="adm-input adm-input--wide" type="search" placeholder="Search trading name…" bind:value={filters.search} />
    </div>
  </div>

  {#if loading}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
  {:else if sellers.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No sellers match these filters</h3>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Handle</th>
            <th>Tier</th>
            <th>Status</th>
            <th>Listings</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {#each sellers as row (row.id)}
            {@const badge = sellerStatusBadge[row.status]}
            <tr on:click={() => { selected = row; actionError = ''; }}
                class:is-selected={selected?.id === row.id}>
              <td>{row.trading_name}</td>
              <td class="adm-mono">{row.handle ?? '-'}</td>
              <td><span class="adm-badge adm-badge--neutral">{row.tier}</span></td>
              <td><span class={`adm-badge adm-badge--${badge.tone}`}>{badge.label}</span></td>
              <td class="adm-mono">{row.listings_count ?? 0}</td>
              <td class="adm-mono">{new Date(row.created_at).toLocaleDateString()}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if selected}
    <div class="adm-detail__backdrop" on:click={() => (selected = null)} role="presentation"></div>
    <aside class="adm-detail">
      <header class="adm-detail__head">
        <h2 class="adm-detail__h">{selected.trading_name}</h2>
        <button class="adm-detail__close" on:click={() => (selected = null)}>CLOSE</button>
      </header>

      <div class="adm-detail__body">
        {#if actionError}
          <div class="adm-state adm-state--err" style="margin-bottom: 16px;">
            <p class="adm-state__sub">{actionError}</p>
          </div>
        {/if}

        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">Status</span>
            <div><span class={`adm-badge adm-badge--${sellerStatusBadge[selected.status].tone}`}>
              {sellerStatusBadge[selected.status].label}
            </span></div>
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Tier</span>
            <select class="adm-field__select" bind:value={selected.tier}
                    on:change={() => changeTier(selected, selected.tier)}>
              <option value="verified">Verified</option>
              <option value="atelier">Atelier</option>
              <option value="house">House</option>
            </select>
          </div>
        </div>

        <div class="adm-field"><span class="adm-field__label">Handle</span><div class="adm-mono">{selected.handle ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Email</span><div class="adm-mono">{selected.email ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Phone</span><div class="adm-mono">{selected.phone ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">City</span><div>{selected.city ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Primary category</span><div>{selected.primary_category ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">What they sell</span><div>{selected.what_they_sell ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Inventory size</span><div>{selected.inventory_count ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Sourcing method</span><div>{selected.sourcing_method ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Trading since</span><div>{selected.trading_since ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Price range</span>
          <div>€{selected.price_low ?? 0} to €{selected.price_high ?? 0}</div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Applied</span>
          <div class="adm-mono">{new Date(selected.applied_at).toLocaleString()}</div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Listings count</span><div>{selected.listings_count ?? 0}</div></div>

        {#if selected.status === 'pending'}
          <div class="adm-field">
            <span class="adm-field__label">Rejection reason (optional)</span>
            <input class="adm-field__input" bind:value={rejectReason} placeholder="Why this application is being declined" />
          </div>
        {/if}
      </div>

      <footer class="adm-detail__foot">
        {#if selected.status === 'pending'}
          <button class="adm-btn adm-btn--primary" on:click={() => changeStatus(selected, 'approved')}>Approve</button>
          <button class="adm-btn adm-btn--danger" on:click={() => changeStatus(selected, 'rejected')}>Reject</button>
        {:else if selected.status === 'approved'}
          <button class="adm-btn" on:click={() => navigate(`/admin/listings?seller=${selected.id}`)}>View listings</button>
          <button class="adm-btn adm-btn--danger" on:click={() => changeStatus(selected, 'suspended')}>Suspend</button>
        {:else if selected.status === 'suspended'}
          <button class="adm-btn adm-btn--primary" on:click={() => changeStatus(selected, 'approved')}>Unsuspend</button>
        {:else if selected.status === 'rejected'}
          <button class="adm-btn" on:click={() => changeStatus(selected, 'approved')}>Reverse → approve</button>
        {/if}
      </footer>
    </aside>
  {/if}

</AdminLayout>
