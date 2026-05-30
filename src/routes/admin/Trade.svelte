<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getAllTradespeople,
    getAllTradeCategories,
    setTradesPersonStatus,
    setTradesPersonTier,
    tradeStatusBadge,
    type Tradesperson,
    type TradesFilters,
    type TradeCategoryRow,
    type TradesPersonStatus,
    type TradesPersonTier,
  } from '../../lib/admin';
  import { applySeo } from '../../lib/seo';

  let loading = true;
  let people: Tradesperson[] = [];
  let categories: TradeCategoryRow[] = [];
  let filters: TradesFilters = { status: 'all', tier: 'all', trade: 'all', search: '' };
  let selected: Tradesperson | null = null;
  let actionError = '';

  onMount(async () => {
    applySeo({ title: 'Admin · TRADE', description: 'Manage tradesperson applications and directory.', path: '/admin/trade' });

    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx > -1) {
      const p = new URLSearchParams(hash.slice(qIdx + 1));
      const s = p.get('status') as TradesPersonStatus | null;
      if (s) filters.status = s;
    }

    categories = await getAllTradeCategories();
    await refresh();
  });

  async function refresh() {
    loading = true;
    people = await getAllTradespeople(filters);
    loading = false;
  }

  let first = true;
  $: { filters.status; filters.tier; filters.trade; filters.search;
       if (first) first = false; else void refresh(); }

  async function changeStatus(t: Tradesperson, status: TradesPersonStatus) {
    actionError = '';
    const r = await setTradesPersonStatus(t.id, status);
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    await refresh();
    if (selected?.id === t.id && r.data) selected = { ...selected, ...r.data };
  }

  async function changeTier(t: Tradesperson, tier: TradesPersonTier) {
    actionError = '';
    const r = await setTradesPersonTier(t.id, tier);
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    await refresh();
    if (selected?.id === t.id && r.data) selected = { ...selected, ...r.data };
  }
</script>

<AdminLayout title="TRADE">

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
        <option value="listed">Listed</option>
        <option value="pro">Pro</option>
      </select>
    </div>
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Trade</span>
      <select class="adm-select" bind:value={filters.trade}>
        <option value="all">All</option>
        {#each categories as c}
          <option value={c.slug}>{c.name}</option>
        {/each}
      </select>
    </div>
    <div class="adm-toolbar__group" style="flex: 1; justify-content: flex-end;">
      <input class="adm-input adm-input--wide" type="search" placeholder="Search name…" bind:value={filters.search} />
    </div>
  </div>

  {#if loading}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
  {:else if people.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No tradespeople match these filters</h3>
      <p class="adm-state__sub">Applications submitted via /trade/apply will appear here.</p>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Trade</th>
            <th>Location</th>
            <th>Tier</th>
            <th>Status</th>
            <th>Rating</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {#each people as row (row.id)}
            {@const badge = tradeStatusBadge[row.status]}
            <tr on:click={() => { selected = row; actionError = ''; }}
                class:is-selected={selected?.id === row.id}>
              <td>{row.name}</td>
              <td>{categories.find(c => c.slug === row.trade)?.name ?? row.trade}</td>
              <td>{row.town ?? '—'}{row.county ? `, ${row.county}` : ''}</td>
              <td><span class="adm-badge adm-badge--neutral">{row.tier}</span></td>
              <td><span class={`adm-badge adm-badge--${badge.tone}`}>{badge.label}</span></td>
              <td class="adm-mono">{row.rating ?? '—'}</td>
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
        <h2 class="adm-detail__h">{selected.name}</h2>
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
            <div><span class={`adm-badge adm-badge--${tradeStatusBadge[selected.status].tone}`}>
              {tradeStatusBadge[selected.status].label}
            </span></div>
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Tier</span>
            <select class="adm-field__select" bind:value={selected.tier}
                    on:change={() => changeTier(selected, selected.tier)}>
              <option value="listed">Listed (free)</option>
              <option value="pro">Pro (€49/mo)</option>
            </select>
          </div>
        </div>

        <div class="adm-field"><span class="adm-field__label">Trade</span><div>{selected.trade}</div></div>
        <div class="adm-field"><span class="adm-field__label">Tagline</span><div>{selected.tagline ?? '—'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Bio</span><div style="white-space: pre-wrap;">{selected.bio ?? '—'}</div></div>
        <div class="adm-field--row">
          <div class="adm-field"><span class="adm-field__label">County</span><div>{selected.county ?? '—'}</div></div>
          <div class="adm-field"><span class="adm-field__label">Town</span><div>{selected.town ?? '—'}</div></div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Coverage areas</span>
          <div>{(selected.coverage_areas ?? []).join(', ') || '—'}</div>
        </div>
        <div class="adm-field--row">
          <div class="adm-field"><span class="adm-field__label">Years experience</span><div>{selected.years_experience ?? '—'}</div></div>
          <div class="adm-field"><span class="adm-field__label">Completed jobs</span><div>{selected.completed_jobs}</div></div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Qualifications</span>
          <div>{(selected.qualifications ?? []).join(', ') || '—'}</div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Phone</span><div class="adm-mono">{selected.phone ?? '—'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Email</span><div class="adm-mono">{selected.email ?? '—'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Response time</span><div>{selected.response_time ?? '—'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Applied</span>
          <div class="adm-mono">{new Date(selected.applied_at).toLocaleString()}</div>
        </div>
      </div>

      <footer class="adm-detail__foot">
        {#if selected.status === 'pending'}
          <button class="adm-btn adm-btn--primary" on:click={() => changeStatus(selected, 'approved')}>Approve</button>
          <button class="adm-btn adm-btn--danger" on:click={() => changeStatus(selected, 'rejected')}>Reject</button>
        {:else if selected.status === 'approved'}
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
