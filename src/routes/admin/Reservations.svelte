<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getAllReservations,
    adminUpdateReservation,
    reservationStatusBadge,
    type AdminReservation,
  } from '../../lib/admin';
  import type { ReservationStatus } from '../../lib/listings';
  import { applySeo } from '../../lib/seo';

  let loading = true;
  let reservations: AdminReservation[] = [];
  let filterStatus: ReservationStatus | 'all' = 'all';
  let selected: AdminReservation | null = null;
  let actionError = '';
  let cancellationReason = '';

  // status flow order
  const STATUS_FLOW: ReservationStatus[] = ['pending_deposit', 'reserved', 'confirmed', 'shipped', 'completed'];

  onMount(async () => {
    applySeo({ title: 'Admin · Reservations', description: 'Manage reservations and deposits.', path: '/admin/reservations' });
    await refresh();
  });

  async function refresh() {
    loading = true;
    reservations = await getAllReservations(filterStatus);
    loading = false;
  }

  let first = true;
  $: { filterStatus; if (first) first = false; else void refresh(); }

  async function setStatus(r: AdminReservation, status: ReservationStatus) {
    actionError = '';
    const patch: any = { status };
    if (status === 'cancelled' && cancellationReason.trim()) {
      patch.cancellation_reason = cancellationReason.trim();
    }
    const res = await adminUpdateReservation(r.id, patch);
    if (!res.ok) { actionError = res.error ?? 'Update failed.'; return; }
    cancellationReason = '';
    await refresh();
    if (selected?.id === r.id && res.data) selected = { ...selected, ...res.data };
  }

  function nextStatus(s: ReservationStatus): ReservationStatus | null {
    const i = STATUS_FLOW.indexOf(s);
    if (i < 0 || i === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[i + 1];
  }

  function refKey(r: AdminReservation): string {
    return r.reference ?? 'EVX-' + r.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  }
</script>

<AdminLayout title="Reservations">

  <div class="adm-toolbar">
    <div class="adm-toolbar__group">
      <span class="adm-toolbar__label">Status</span>
      <select class="adm-select" bind:value={filterStatus}>
        <option value="all">All</option>
        <option value="pending_deposit">Pending deposit</option>
        <option value="reserved">Reserved</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  </div>

  {#if loading}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
  {:else if reservations.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No reservations yet</h3>
      <p class="adm-state__sub">Once buyers place €49 deposits on listings, they'll appear here.</p>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Item</th>
            <th>Buyer</th>
            <th>Seller</th>
            <th>Deposit</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {#each reservations as row (row.id)}
            {@const badge = reservationStatusBadge[row.status]}
            <tr on:click={() => { selected = row; actionError = ''; }}
                class:is-selected={selected?.id === row.id}
                class:adm-row--dim={row.status === 'cancelled'}>
              <td class="adm-mono">{refKey(row)}</td>
              <td>{row.listing?.title ?? '-'}</td>
              <td>{row.buyer?.full_name ?? row.buyer?.email ?? '-'}</td>
              <td>{row.seller?.trading_name ?? '-'}</td>
              <td class="adm-mono">€{row.deposit_amount}</td>
              <td><span class={`adm-badge adm-badge--${badge.tone}`}>{badge.label}</span></td>
              <td class="adm-mono">{new Date(row.reserved_at).toLocaleDateString()}</td>
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
        <h2 class="adm-detail__h">{refKey(selected)}</h2>
        <button class="adm-detail__close" on:click={() => (selected = null)}>CLOSE</button>
      </header>

      <div class="adm-detail__body">
        {#if actionError}
          <div class="adm-state adm-state--err" style="margin-bottom: 16px;">
            <p class="adm-state__sub">{actionError}</p>
          </div>
        {/if}

        <div class="adm-field"><span class="adm-field__label">Listing</span>
          <div>{selected.listing?.title ?? '-'}</div>
        </div>
        <div class="adm-field--row">
          <div class="adm-field"><span class="adm-field__label">List price</span>
            <div class="adm-mono">€{selected.listing?.price?.toLocaleString() ?? '-'}</div>
          </div>
          <div class="adm-field"><span class="adm-field__label">Deposit</span>
            <div class="adm-mono">€{selected.deposit_amount}</div>
          </div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Buyer</span>
          <div>{selected.buyer?.full_name ?? '-'}</div>
          <div class="adm-mono adm-muted">{selected.buyer?.email ?? ''}</div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Seller</span>
          <div>{selected.seller?.trading_name ?? '-'}</div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Status</span>
          <div><span class={`adm-badge adm-badge--${reservationStatusBadge[selected.status].tone}`}>
            {reservationStatusBadge[selected.status].label}
          </span></div>
        </div>
        <div class="adm-field"><span class="adm-field__label">Notes</span>
          <textarea class="adm-field__textarea" bind:value={selected.notes}
                    on:blur={() => adminUpdateReservation(selected.id, { notes: selected.notes })}
                    rows="3"></textarea>
        </div>
        <div class="adm-field"><span class="adm-field__label">Reserved at</span>
          <div class="adm-mono">{new Date(selected.reserved_at).toLocaleString()}</div>
        </div>

        {#if selected.status !== 'cancelled' && selected.status !== 'completed'}
          <div class="adm-field">
            <span class="adm-field__label">Cancellation reason (if cancelling)</span>
            <input class="adm-field__input" bind:value={cancellationReason} placeholder="Reason for cancelling / refunding" />
          </div>
        {/if}

        {#if selected.cancellation_reason}
          <div class="adm-field">
            <span class="adm-field__label">Cancellation reason</span>
            <div>{selected.cancellation_reason}</div>
          </div>
        {/if}
      </div>

      <footer class="adm-detail__foot">
        {#if nextStatus(selected.status)}
          {@const next = nextStatus(selected.status)}
          {#if next}
            <button class="adm-btn adm-btn--primary" on:click={() => setStatus(selected, next)}>
              Advance → {reservationStatusBadge[next].label}
            </button>
          {/if}
        {/if}
        {#if selected.status !== 'cancelled' && selected.status !== 'completed'}
          <button class="adm-btn adm-btn--danger" on:click={() => setStatus(selected, 'cancelled')}>
            Cancel + refund deposit
          </button>
        {/if}
      </footer>
    </aside>
  {/if}

</AdminLayout>
