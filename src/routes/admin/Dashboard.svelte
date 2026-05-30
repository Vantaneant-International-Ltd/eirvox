<script lang="ts">
  import { onMount } from 'svelte';
  import AdminLayout from '../../components/AdminLayout.svelte';
  import '../../components/admin.css';
  import { getAdminStats, getRecentActivity, type AdminStats, type ActivityRow } from '../../lib/admin';
  import { applySeo } from '../../lib/seo';

  let loading = true;
  let stats: AdminStats | null = null;
  let activity: ActivityRow[] = [];

  onMount(async () => {
    applySeo({ title: 'Admin · Dashboard', description: 'ÉIRVOX admin dashboard.', path: '/admin' });
    [stats, activity] = await Promise.all([getAdminStats(), getRecentActivity(10)]);
    loading = false;
  });

  function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }
</script>

<AdminLayout title="Dashboard">

  {#if loading}
    <div class="adm-state">
      <span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span>
    </div>

  {:else}
    <!-- ─────────── Stats row ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Platform stats</h2>
      <div class="adm-stats">
        <div class="adm-stat">
          <span class="adm-stat__label">Active listings</span>
          <span class="adm-stat__value">{stats?.total_listings ?? 0}</span>
        </div>
        <div class="adm-stat">
          <span class="adm-stat__label">Approved sellers</span>
          <span class="adm-stat__value">{stats?.total_sellers ?? 0}</span>
        </div>
        <div class="adm-stat">
          <span class="adm-stat__label">Reservations</span>
          <span class="adm-stat__value">{stats?.total_reservations ?? 0}</span>
        </div>
        <div class="adm-stat">
          <span class="adm-stat__label">Tradespeople</span>
          <span class="adm-stat__value">{stats?.total_tradespeople ?? 0}</span>
        </div>
        <div class="adm-stat">
          <span class="adm-stat__label">Users</span>
          <span class="adm-stat__value">{stats?.total_users ?? 0}</span>
        </div>
      </div>
    </section>

    <!-- ─────────── Pending items ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Needs your attention</h2>
      <div class="adm-pending-cards">
        <a href="#/admin/listings?status=pending_review" class="adm-pending-card">
          <span class="adm-pending-card__count">{stats?.pending_listings ?? 0}</span>
          <span class="adm-pending-card__label">Listings pending review</span>
          <span class="adm-pending-card__link">Review listings →</span>
        </a>
        <a href="#/admin/sellers?status=pending" class="adm-pending-card">
          <span class="adm-pending-card__count">{stats?.pending_sellers ?? 0}</span>
          <span class="adm-pending-card__label">Seller applications</span>
          <span class="adm-pending-card__link">Review applications →</span>
        </a>
        <a href="#/admin/trade?status=pending" class="adm-pending-card">
          <span class="adm-pending-card__count">{stats?.pending_trade ?? 0}</span>
          <span class="adm-pending-card__label">TRADE applications</span>
          <span class="adm-pending-card__link">Review applications →</span>
        </a>
      </div>
    </section>

    <!-- ─────────── Recent activity ─────────── -->
    <section class="adm-section">
      <h2 class="adm-section__h">Recent activity</h2>
      {#if activity.length === 0}
        <div class="adm-state">
          <p class="adm-state__sub">No activity yet — once sellers post listings and buyers reserve items, they'll show up here.</p>
        </div>
      {:else}
        <div class="adm-activity">
          {#each activity as row}
            <div class="adm-activity__row">
              <span class="adm-activity__kind">{row.kind}</span>
              <span class="adm-activity__label">
                {row.label}
                <span class="adm-muted" style="margin-left: 8px; font-size: 12px;">· {row.status}</span>
              </span>
              <span class="adm-activity__at">{timeAgo(row.at)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

</AdminLayout>
