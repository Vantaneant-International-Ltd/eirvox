<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import { applySeo } from '../../lib/seo';
  import {
    listNameChangeRequests, approveNameChange, rejectNameChange,
    type NameChangeRequest, type NameChangeStatus,
  } from '../../lib/nameChanges';

  let loading = true;
  let rows: NameChangeRequest[] = [];
  let statusFilter: NameChangeStatus | 'all' = 'pending';
  let actionBusy: string | null = null;
  let actionErr = '';
  let noteByRow: Record<string, string> = {};

  async function refresh() {
    loading = true;
    rows = await listNameChangeRequests(statusFilter);
    loading = false;
  }

  let first = true;
  $: { statusFilter; if (first) first = false; else void refresh(); }

  onMount(async () => {
    applySeo({ title: 'Admin · Name changes', description: 'Seller name change request queue.', path: '/admin/name-changes' });
    await refresh();
  });

  async function approve(id: string) {
    actionBusy = id; actionErr = '';
    const r = await approveNameChange(id, noteByRow[id]?.trim() || null);
    actionBusy = null;
    if (!r.ok) { actionErr = r.error; return; }
    await refresh();
  }

  async function reject(id: string) {
    actionBusy = id; actionErr = '';
    const r = await rejectNameChange(id, noteByRow[id]?.trim() || null);
    actionBusy = null;
    if (!r.ok) { actionErr = r.error; return; }
    await refresh();
  }

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString('en-IE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<AdminLayout title="Name changes">
  <header class="adm-head">
    <h1 class="adm-h">Name changes</h1>
    <div class="adm-toolbar">
      <select class="adm-select" bind:value={statusFilter}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="all">All</option>
      </select>
    </div>
  </header>

  {#if actionErr}<p class="adm-banner adm-banner--err">{actionErr}</p>{/if}

  {#if loading}
    <p class="adm-mono">Loading…</p>
  {:else if rows.length === 0}
    <p class="adm-mono">No requests in this view.</p>
  {:else}
    <ul class="ncq">
      {#each rows as r (r.id)}
        <li class="ncq-row">
          <div class="ncq-row__head">
            <div>
              <span class="ncq-row__from">{r.current_name}</span>
              <span class="ncq-row__arrow">→</span>
              <span class="ncq-row__to">{r.requested_name}</span>
            </div>
            <span class="adm-badge adm-badge--{r.status === 'pending' ? 'amber' : r.status === 'approved' ? 'green' : 'grey'}">{r.status.toUpperCase()}</span>
          </div>
          <div class="ncq-row__meta">
            Seller: <code>{r.seller?.trading_name ?? '—'}{r.seller?.handle ? ' · @' + r.seller.handle : ''}</code>
            · Submitted {fmtDate(r.created_at)}
          </div>
          {#if r.reason}
            <p class="ncq-row__reason"><strong>Reason:</strong> {r.reason}</p>
          {/if}
          {#if r.admin_note}
            <p class="ncq-row__note"><strong>Admin note:</strong> {r.admin_note}</p>
          {/if}
          {#if r.status === 'pending'}
            <div class="ncq-row__actions">
              <input
                type="text"
                class="ncq-row__note-input"
                placeholder="Optional admin note (shown to seller on next request)"
                bind:value={noteByRow[r.id]}
                maxlength="2000"
              />
              <div class="ncq-row__btns">
                <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => reject(r.id)} disabled={actionBusy === r.id}>
                  Reject
                </button>
                <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => approve(r.id)} disabled={actionBusy === r.id}>
                  {actionBusy === r.id ? 'Working…' : 'Approve →'}
                </button>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</AdminLayout>

<style>
  .adm-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .adm-h { font-family: var(--evx-font-display); font-size: 28px; font-weight: 500; }
  .adm-toolbar { display: flex; gap: 12px; align-items: center; }
  .adm-select { background: var(--evx-paper-warm); border: 1px solid var(--evx-rule-light); padding: 6px 10px; font-family: var(--evx-font-mono); font-size: 11px; }
  .adm-banner { padding: 10px 14px; margin-bottom: 14px; font-size: 13px; }
  .adm-banner--err { background: rgba(220,38,38,0.08); border-left: 3px solid #DC2626; color: #DC2626; }
  .ncq { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .ncq-row { padding: 18px 20px; background: var(--evx-paper-warm); border: 1px solid var(--evx-rule-light); display: flex; flex-direction: column; gap: 10px; }
  .ncq-row__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  .ncq-row__from { font-family: var(--evx-font-mono); color: var(--evx-ink-soft); font-size: 13px; }
  .ncq-row__arrow { color: var(--evx-ink-soft); margin: 0 8px; }
  .ncq-row__to { font-family: var(--evx-font-display); font-weight: 500; font-size: 18px; }
  .ncq-row__meta { font-family: var(--evx-font-mono); font-size: 11px; color: var(--evx-ink-soft); }
  .ncq-row__reason, .ncq-row__note { font-size: 13px; line-height: 1.6; color: var(--evx-warm-black); margin: 0; }
  .ncq-row__actions { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--evx-rule-light); }
  .ncq-row__note-input { background: var(--evx-paper); border: 1px solid var(--evx-rule-light); padding: 8px 10px; font-size: 13px; color: var(--evx-warm-black); outline: none; }
  .ncq-row__note-input:focus { border-color: var(--evx-warm-black); }
  .ncq-row__btns { display: flex; gap: 8px; justify-content: flex-end; }
</style>
