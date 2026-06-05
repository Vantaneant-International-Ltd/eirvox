<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import { applySeo } from '../../lib/seo';
  import { navigate } from '../../lib/router';
  import { auth } from '../../lib/auth';
  import {
    getAllReports,
    updateReport,
    reasonLabel,
    statusBadge,
    type ReportRow,
    type ReportStatus,
    type ReportReason,
    type ReportFilters,
  } from '../../lib/reports';

  let loading = true;
  let rows: ReportRow[] = [];
  let filters: ReportFilters = { status: 'new', reason: 'all' };
  let selected: ReportRow | null = null;
  let actionError = '';
  let savingPatch = false;

  onMount(async () => {
    applySeo({ title: 'Admin · Reports', description: 'Listing report queue.', path: '/admin/reports' });
    await refresh();
  });

  async function refresh() {
    loading = true;
    rows = await getAllReports(filters);
    loading = false;
  }

  // Refresh whenever filters change (after first render).
  let first = true;
  $: {
    filters.status; filters.reason;
    if (first) first = false; else void refresh();
  }

  async function applyPatch(
    row: ReportRow,
    patch: { status?: ReportStatus; assigned_to?: string | null; resolution_note?: string | null },
  ) {
    actionError = '';
    savingPatch = true;
    const r = await updateReport(row.id, patch, $auth.profile?.id ?? null);
    savingPatch = false;
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    if (r.data) {
      // Local update so UI is responsive; full refresh runs in the
      // background for any cross-row side-effects.
      rows = rows.map(x => (x.id === row.id ? { ...x, ...(r.data as ReportRow) } : x));
      if (selected?.id === row.id) selected = { ...selected, ...(r.data as ReportRow) };
    }
    void refresh();
  }

  function badgeTone(status: ReportStatus): 'amber' | 'neutral' | 'green' | 'red' | 'grey' {
    return statusBadge[status].tone;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-IE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function listingHref(listingId: string | null): string {
    if (!listingId) return '#/admin/listings';
    return `#/admin/listings?id=${listingId}`;
  }
</script>

<AdminLayout title="Reports">

  <div class="adm-toolbar">
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">STATUS</span>
      <select class="adm-select" bind:value={filters.status}>
        <option value="new">New</option>
        <option value="reviewing">Reviewing</option>
        <option value="actioned">Actioned</option>
        <option value="dismissed">Dismissed</option>
        <option value="all">All</option>
      </select>
    </div>
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">REASON</span>
      <select class="adm-select" bind:value={filters.reason}>
        <option value="all">All reasons</option>
        <option value="prohibited_illegal">Prohibited or illegal</option>
        <option value="scam_fraud">Scam or fraud</option>
        <option value="counterfeit">Counterfeit</option>
        <option value="miscategorised">Wrong category</option>
        <option value="offensive">Offensive</option>
        <option value="unavailable">No longer available</option>
        <option value="other">Other</option>
      </select>
    </div>
  </div>

  {#if actionError}
    <div class="adm-state adm-state--err" style="margin-bottom: 16px;">
      <p class="adm-state__sub">{actionError}</p>
    </div>
  {/if}

  {#if loading}
    <div class="adm-state">
      <span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span>
    </div>
  {:else if rows.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No reports in this view</h3>
      <p class="adm-state__sub">Nothing to triage. Switch the filter to see other statuses.</p>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Reason</th>
            <th>Listing</th>
            <th>Detail</th>
            <th>Reporter</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row (row.id)}
            {@const badge = statusBadge[row.status]}
            <tr on:click={() => { selected = row; actionError = ''; }}
                class:is-selected={selected?.id === row.id}>
              <td class="adm-mono">{formatDate(row.created_at)}</td>
              <td>{reasonLabel[row.reason]}</td>
              <td class="adm-mono">
                {#if row.listing_id}
                  <a href={listingHref(row.listing_id)}
                     on:click|stopPropagation
                     style="color: inherit; text-decoration: underline; text-decoration-color: var(--evx-rule-light);">
                    {row.listing_id.slice(0, 8)}…
                  </a>
                {:else}
                  <span class="adm-muted">deleted</span>
                {/if}
              </td>
              <td class="rep-cell-detail">{row.detail ?? '-'}</td>
              <td class="adm-mono">{row.reporter_email ?? '-'}</td>
              <td>
                <span class="adm-badge adm-badge--{badge.tone}">{badge.label}</span>
              </td>
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
        <h2 class="adm-detail__h">Report · {reasonLabel[selected.reason]}</h2>
        <button class="adm-detail__close" on:click={() => (selected = null)}>CLOSE</button>
      </header>

      <div class="adm-detail__body">
        <div class="adm-field">
          <span class="adm-field__label">Status</span>
          <select class="adm-field__select"
                  value={selected.status}
                  on:change={(e) => applyPatch(selected!, { status: (e.currentTarget as HTMLSelectElement).value as ReportStatus })}
                  disabled={savingPatch}>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="actioned">Actioned</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Reason</span>
          <div>{reasonLabel[selected.reason]} <span class="adm-mono adm-muted" style="margin-left: 8px;">({selected.reason})</span></div>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Reported listing</span>
          <div>
            {#if selected.listing_id}
              <a href={listingHref(selected.listing_id)} style="text-decoration: underline;">
                Open in admin Listings →
              </a>
              <div class="adm-mono adm-muted" style="margin-top: 4px;">{selected.listing_id}</div>
            {:else}
              <span class="adm-muted">Listing was deleted (FK set null on delete).</span>
            {/if}
          </div>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Reporter email</span>
          <div class="adm-mono">{selected.reporter_email ?? '-'}</div>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Detail from reporter</span>
          <div style="white-space: pre-wrap; line-height: 1.55;">{selected.detail ?? '-'}</div>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Resolution note (admin)</span>
          <textarea class="adm-field__input" rows="3"
                    bind:value={selected.resolution_note}
                    on:blur={() => applyPatch(selected!, { resolution_note: selected!.resolution_note || null })}
                    disabled={savingPatch}></textarea>
        </div>

        <div class="adm-field--row">
          <div class="adm-field">
            <span class="adm-field__label">Created</span>
            <div class="adm-mono">{formatDate(selected.created_at)}</div>
          </div>
          <div class="adm-field">
            <span class="adm-field__label">Reviewed</span>
            <div class="adm-mono">{selected.reviewed_at ? formatDate(selected.reviewed_at) : '-'}</div>
          </div>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Triage metadata</span>
          <div class="adm-mono adm-muted" style="font-size: 11px; line-height: 1.6;">
            ip_hash: {selected.ip_hash ?? '-'}<br/>
            user_agent: {selected.user_agent ?? '-'}
          </div>
        </div>
      </div>

      <footer class="adm-detail__foot">
        {#if selected.status !== 'reviewing'}
          <button class="adm-btn" on:click={() => applyPatch(selected!, { status: 'reviewing' })} disabled={savingPatch}>
            Mark reviewing
          </button>
        {/if}
        {#if selected.status !== 'actioned'}
          <button class="adm-btn adm-btn--primary" on:click={() => applyPatch(selected!, { status: 'actioned' })} disabled={savingPatch}>
            Mark actioned
          </button>
        {/if}
        {#if selected.status !== 'dismissed'}
          <button class="adm-btn adm-btn--danger" on:click={() => applyPatch(selected!, { status: 'dismissed' })} disabled={savingPatch}>
            Dismiss
          </button>
        {/if}
      </footer>
    </aside>
  {/if}

</AdminLayout>

<style>
  .rep-cell-detail {
    max-width: 360px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--evx-ink-soft);
  }
</style>
