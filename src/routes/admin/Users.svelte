<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import {
    getAllUsers,
    setUserRole,
    setUserSuspension,
    type AdminUser,
  } from '../../lib/admin';
  import { supabase, type UserRole } from '../../lib/supabase';
  import { applySeo } from '../../lib/seo';
  import { auth } from '../../lib/auth';

  let loading = true;
  let users: AdminUser[] = [];
  let search = '';
  let selected: AdminUser | null = null;
  let actionError = '';
  let suspensionReason = '';

  // Activity for the selected user
  let activityLoading = false;
  let userReservations: any[] = [];

  onMount(async () => {
    applySeo({ title: 'Admin · Users', description: 'Manage users and roles.', path: '/admin/users' });
    await refresh();
  });

  async function refresh() {
    loading = true;
    users = await getAllUsers(search);
    loading = false;
  }

  let first = true;
  $: { search; if (first) first = false; else void refresh(); }

  async function selectUser(u: AdminUser) {
    selected = u;
    actionError = '';
    activityLoading = true;
    const { data } = await supabase
      .from('reservations')
      .select('id, reference, status, deposit_amount, reserved_at, listing:listings(title)')
      .eq('buyer_id', u.id)
      .order('reserved_at', { ascending: false })
      .limit(20);
    userReservations = data ?? [];
    activityLoading = false;
  }

  async function changeRole(u: AdminUser, role: UserRole) {
    actionError = '';
    // Don't let the current admin demote themselves accidentally
    if (u.id === $auth.user?.id && role !== 'admin') {
      if (!confirm("You're about to demote your own account. You'll lose admin access immediately. Continue?")) return;
    }
    const r = await setUserRole(u.id, role);
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    await refresh();
    if (selected?.id === u.id && r.data) selected = { ...selected, ...r.data };
  }

  async function toggleSuspension(u: AdminUser) {
    actionError = '';
    const r = await setUserSuspension(u.id, !u.suspended, suspensionReason);
    if (!r.ok) { actionError = r.error ?? 'Update failed.'; return; }
    suspensionReason = '';
    await refresh();
    if (selected?.id === u.id && r.data) selected = { ...selected, ...r.data };
  }
</script>

<AdminLayout title="Users">

  <div class="adm-toolbar">
    <div class="adm-toolbar__group" style="flex: 1;">
      <input class="adm-input adm-input--wide" type="search" placeholder="Search name or email…" bind:value={search} />
    </div>
  </div>

  {#if loading}
    <div class="adm-state"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
  {:else if users.length === 0}
    <div class="adm-state">
      <h3 class="adm-state__h">No users</h3>
    </div>
  {:else}
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each users as row (row.id)}
            <tr on:click={() => selectUser(row)}
                class:is-selected={selected?.id === row.id}
                class:adm-row--dim={row.suspended}>
              <td>{row.full_name ?? '-'}</td>
              <td class="adm-mono">{row.email ?? '-'}</td>
              <td><span class="adm-badge adm-badge--neutral">{row.role}</span></td>
              <td class="adm-mono">{new Date(row.created_at).toLocaleDateString()}</td>
              <td>
                {#if row.suspended}
                  <span class="adm-badge adm-badge--red">Suspended</span>
                {:else}
                  <span class="adm-badge adm-badge--green">Active</span>
                {/if}
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
        <h2 class="adm-detail__h">{selected.full_name ?? selected.email ?? 'User'}</h2>
        <button class="adm-detail__close" on:click={() => (selected = null)}>CLOSE</button>
      </header>

      <div class="adm-detail__body">
        {#if actionError}
          <div class="adm-state adm-state--err" style="margin-bottom: 16px;">
            <p class="adm-state__sub">{actionError}</p>
          </div>
        {/if}

        <div class="adm-field"><span class="adm-field__label">Email</span><div class="adm-mono">{selected.email ?? '-'}</div></div>
        <div class="adm-field"><span class="adm-field__label">Phone</span><div class="adm-mono">{selected.phone ?? '-'}</div></div>
        <div class="adm-field--row">
          <div class="adm-field"><span class="adm-field__label">City</span><div>{selected.city ?? '-'}</div></div>
          <div class="adm-field"><span class="adm-field__label">Country</span><div>{selected.country ?? '-'}</div></div>
        </div>

        <div class="adm-field">
          <span class="adm-field__label">Role</span>
          <select class="adm-field__select" bind:value={selected.role}
                  on:change={() => changeRole(selected, selected.role)}>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {#if selected.suspended}
          <div class="adm-field">
            <span class="adm-field__label">Suspended</span>
            <div class="adm-mono">{selected.suspended_at ? new Date(selected.suspended_at).toLocaleString() : ''}</div>
            {#if selected.suspension_reason}
              <div>{selected.suspension_reason}</div>
            {/if}
          </div>
        {:else}
          <div class="adm-field">
            <span class="adm-field__label">Suspension reason (if suspending)</span>
            <input class="adm-field__input" bind:value={suspensionReason} placeholder="Reason for suspension" />
          </div>
        {/if}

        <div class="adm-field">
          <span class="adm-field__label">Reservations</span>
          {#if activityLoading}
            <p class="adm-muted">Loading activity…</p>
          {:else if userReservations.length === 0}
            <p class="adm-muted">No reservations yet.</p>
          {:else}
            <div style="border: 1px solid var(--evx-rule-light); padding: 12px;">
              {#each userReservations as r}
                <div style="display: grid; grid-template-columns: 1fr auto; padding: 4px 0; font-size: 13px;">
                  <span>{r.listing?.title ?? r.reference ?? r.id.slice(0, 8)} · <span class="adm-muted">{r.status}</span></span>
                  <span class="adm-mono adm-muted">€{r.deposit_amount}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <footer class="adm-detail__foot">
        {#if selected.suspended}
          <button class="adm-btn adm-btn--primary" on:click={() => toggleSuspension(selected)}>Unsuspend</button>
        {:else}
          <button class="adm-btn adm-btn--danger" on:click={() => toggleSuspension(selected)}>Suspend</button>
        {/if}
      </footer>
    </aside>
  {/if}

</AdminLayout>
