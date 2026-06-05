<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import { applySeo } from '../../lib/seo';
  import {
    getAllEnquiries,
    updateEnquiryStatus,
    type EnquiryRow,
    type EnquiryStatus,
  } from '../../lib/enquiries';

  let loading = true;
  let entries: EnquiryRow[] = [];
  let statusFilter: EnquiryStatus | 'all' = 'new';
  let selected: EnquiryRow | null = null;
  let actionError = '';

  onMount(async () => {
    applySeo({ title: 'Admin · Enquiries', description: 'Express Interest queue.', path: '/admin/enquiries' });
    await refresh();
  });

  async function refresh() {
    loading = true;
    entries = await getAllEnquiries();
    loading = false;
  }

  $: filtered = statusFilter === 'all'
    ? entries
    : entries.filter(e => e.status === statusFilter);

  async function setStatus(row: EnquiryRow, status: EnquiryStatus) {
    actionError = '';
    const r = await updateEnquiryStatus(row.id, status);
    if (!r.ok) {
      actionError = r.error ?? 'Update failed.';
      return;
    }
    await refresh();
    if (selected?.id === row.id) selected = { ...selected, status };
  }

  function subjectLabel(e: EnquiryRow): string {
    if (e.subject_type === 'listing') return `Listing · ${e.listing_id?.slice(0, 8) ?? '-'}`;
    if (e.subject_type === 'tradesperson') return `TRADE · ${e.tradesperson_id?.slice(0, 8) ?? '-'}`;
    if (e.subject_type === 'drive_issue') return `DRIVE · ${e.drive_issue_slug ?? '-'}`;
    return 'General';
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-IE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function badgeTone(status: EnquiryStatus): string {
    if (status === 'new') return 'amber';
    if (status === 'replied') return 'green';
    if (status === 'closed') return 'neutral';
    return 'red';
  }
</script>

<AdminLayout title="Enquiries">

  <div class="adm-toolbar">
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">STATUS</span>
      <select class="adm-select" bind:value={statusFilter}>
        <option value="new">New ({entries.filter(e => e.status === 'new').length})</option>
        <option value="replied">Replied</option>
        <option value="closed">Closed</option>
        <option value="spam">Spam</option>
        <option value="all">All ({entries.length})</option>
      </select>
    </div>
  </div>

  {#if actionError}
    <div class="adm-state" style="color: var(--evx-fox-orange);">{actionError}</div>
  {/if}

  {#if loading}
    <div class="adm-state">
      <span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span>
    </div>
  {:else if filtered.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No enquiries</h3>
      <p class="adm-state__p">Nothing to triage in this view.</p>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Received</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as row (row.id)}
            <tr on:click={() => selected = row} class:is-selected={selected?.id === row.id}>
              <td>
                <div>{row.name}</div>
                <div class="adm-mono enq-sub">{row.email}</div>
              </td>
              <td>{subjectLabel(row)}</td>
              <td class="enq-msg">{row.message}</td>
              <td class="adm-mono">{formatDate(row.created_at)}</td>
              <td>
                <span class="adm-badge adm-badge--{badgeTone(row.status)}">{row.status}</span>
              </td>
              <td>
                <div class="enq-actions">
                  {#if row.status !== 'replied'}
                    <button type="button" on:click|stopPropagation={() => setStatus(row, 'replied')}>Mark replied</button>
                  {/if}
                  {#if row.status !== 'closed'}
                    <button type="button" on:click|stopPropagation={() => setStatus(row, 'closed')}>Close</button>
                  {/if}
                  {#if row.status !== 'spam'}
                    <button type="button" on:click|stopPropagation={() => setStatus(row, 'spam')}>Spam</button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

</AdminLayout>

<style>
  .enq-sub {
    color: var(--evx-ink-soft);
    font-size: 12px;
  }
  .enq-msg {
    max-width: 420px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .enq-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .enq-actions button {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    color: var(--evx-warm-black);
    padding: 4px 8px;
    border-radius: 2px;
    cursor: pointer;
    transition: opacity 200ms ease;
  }
  .enq-actions button:hover { opacity: 0.7; }
</style>
