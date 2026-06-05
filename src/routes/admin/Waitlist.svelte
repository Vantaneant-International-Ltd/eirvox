<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import { applySeo } from '../../lib/seo';
  import { getAllWaitlist, type WaitlistEntry } from '../../lib/waitlist';

  let loading = true;
  let entries: WaitlistEntry[] = [];
  let search = '';

  onMount(async () => {
    applySeo({ title: 'Admin · Waitlist', description: 'Coming soon waitlist signups.', path: '/admin/waitlist' });
    await refresh();
  });

  async function refresh() {
    loading = true;
    entries = await getAllWaitlist();
    loading = false;
  }

  $: filtered = search.trim()
    ? entries.filter(e =>
        e.email.toLowerCase().includes(search.trim().toLowerCase()) ||
        (e.source ?? '').toLowerCase().includes(search.trim().toLowerCase())
      )
    : entries;

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-IE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function csvEscape(value: string | null | undefined): string {
    const s = value ?? '';
    // Quote if contains comma, quote, or newline. Double internal quotes.
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function exportCSV() {
    const header = ['email', 'source', 'created_at'];
    const lines = [header.join(',')];
    for (const row of filtered) {
      lines.push([
        csvEscape(row.email),
        csvEscape(row.source),
        csvEscape(row.created_at),
      ].join(','));
    }
    const csv = lines.join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `eirvox-waitlist-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
</script>

<AdminLayout title="Waitlist">

  <div class="adm-section">
    <div class="wl-header">
      <div class="wl-count">
        <span class="wl-count__num">{entries.length}</span>
        <span class="wl-count__label">{entries.length === 1 ? 'signup' : 'signups'}</span>
      </div>
      <div class="wl-actions">
        <input
          class="adm-input adm-input--wide"
          type="search"
          placeholder="Search email or source…"
          bind:value={search}
        />
        <button
          class="wl-export"
          on:click={exportCSV}
          disabled={filtered.length === 0}
          title="Download visible rows as CSV"
        >
          Export CSV
        </button>
      </div>
    </div>
  </div>

  {#if loading}
    <div class="adm-state">
      <span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span>
    </div>
  {:else if entries.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No signups yet</h3>
      <p class="adm-state__p">When visitors submit the coming-soon form, they'll appear here.</p>
    </div>
  {:else if filtered.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No matches</h3>
      <p class="adm-state__p">Try a different search.</p>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Source</th>
            <th>Signed up</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as row (row.id)}
            <tr>
              <td class="adm-mono">{row.email}</td>
              <td>
                {#if row.source}
                  <span class="adm-badge adm-badge--neutral">{row.source}</span>
                {:else}
                  <span class="wl-muted">-</span>
                {/if}
              </td>
              <td class="adm-mono">{formatDate(row.created_at)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

</AdminLayout>

<style>
  .wl-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .wl-count {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .wl-count__num {
    font-family: var(--evx-font-display);
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }

  .wl-count__label {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
  }

  .wl-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .wl-export {
    font-family: var(--evx-font-display);
    font-size: 13px;
    font-weight: 500;
    color: var(--evx-paper);
    background: var(--evx-warm-black);
    border: 1px solid var(--evx-warm-black);
    border-radius: 2px;
    padding: 8px 16px;
    cursor: pointer;
    transition: opacity 200ms ease;
  }
  .wl-export:hover:not(:disabled) { opacity: 0.85; }
  .wl-export:disabled { opacity: 0.4; cursor: not-allowed; }

  .wl-muted { color: var(--evx-ink-soft); }
</style>
