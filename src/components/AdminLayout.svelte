<script lang="ts">
  import { onMount } from 'svelte';
  import { currentPath, navigate, isActive } from '../lib/router';
  import { auth, signOut } from '../lib/auth';
  import { getAdminStats, type AdminStats } from '../lib/admin';
  import { getWaitlistCount } from '../lib/waitlist';
  import { getNewEnquiryCount } from '../lib/enquiries';
  import { getNewReportCount } from '../lib/reports';
  import { getPendingNameChangeCount } from '../lib/nameChanges';

  export let title: string = 'Admin';

  // Pending badges — refresh on mount and on path change so each
  // navigation update the sidebar counts.
  let stats: AdminStats | null = null;
  let waitlistCount = 0;
  let newEnquiryCount = 0;
  let newReportCount = 0;
  let pendingNameChangeCount = 0;

  async function refreshStats() {
    [stats, waitlistCount, newEnquiryCount, newReportCount, pendingNameChangeCount] = await Promise.all([
      getAdminStats(),
      getWaitlistCount(),
      getNewEnquiryCount(),
      getNewReportCount(),
      getPendingNameChangeCount(),
    ]);
  }

  onMount(refreshStats);
  $: if ($currentPath) { void refreshStats(); }

  $: profile = $auth.profile;
  $: user = $auth.user;

  // Sidebar nav items. `badgeSource` resolves to a number at render time.
  type BadgeSource = keyof AdminStats | 'waitlist' | 'new_enquiries' | 'new_reports' | 'pending_name_changes';
  const NAV: Array<{ path: string; label: string; badgeSource?: BadgeSource }> = [
    { path: '/admin',               label: 'Dashboard' },
    { path: '/admin/listings',      label: 'Listings',      badgeSource: 'pending_listings' },
    { path: '/admin/sellers',       label: 'Sellers',       badgeSource: 'pending_sellers' },
    { path: '/admin/name-changes',  label: 'Name changes',  badgeSource: 'pending_name_changes' },
    { path: '/admin/enquiries',     label: 'Enquiries',     badgeSource: 'new_enquiries' },
    { path: '/admin/reports',       label: 'Reports',       badgeSource: 'new_reports' },
    { path: '/admin/reservations',  label: 'Reservations' },
    { path: '/admin/trade',         label: 'TRADE',         badgeSource: 'pending_trade' },
    { path: '/admin/users',         label: 'Users' },
    { path: '/admin/waitlist',      label: 'Waitlist',      badgeSource: 'waitlist' },
    { path: '/admin/categories',    label: 'Categories' },
    { path: '/admin/settings',      label: 'Settings' },
  ];

  function badgeValue(source: BadgeSource | undefined): number {
    if (!source) return 0;
    if (source === 'waitlist') return waitlistCount;
    if (source === 'new_enquiries') return newEnquiryCount;
    if (source === 'new_reports') return newReportCount;
    if (source === 'pending_name_changes') return pendingNameChangeCount;
    return stats?.[source as keyof AdminStats] ?? 0;
  }

  function active(p: string): boolean {
    if (p === '/admin') return $currentPath === '/admin';
    return $currentPath.startsWith(p);
  }

  async function logout() {
    await signOut();
    navigate('/');
  }
</script>

<div class="admin-shell">

  <!-- ──────────── Dark sidebar ──────────── -->
  <aside class="admin-sidebar">
    <div class="admin-sidebar__head">
      <a class="admin-sidebar__brand" href="#/admin" aria-label="ÉIRVOX admin home">
        ÉIRVOX
        <span class="admin-sidebar__sub">ADMIN</span>
      </a>
    </div>

    <nav class="admin-sidebar__nav" aria-label="Admin navigation">
      {#each NAV as item}
        {@const badge = badgeValue(item.badgeSource)}
        <a
          href={`#${item.path}`}
          class="admin-nav-link"
          class:is-active={active(item.path)}
        >
          <span class="admin-nav-link__label">{item.label}</span>
          {#if badge > 0}
            <span class="admin-nav-link__badge">{badge}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <div class="admin-sidebar__foot">
      <a href="#/" class="admin-sidebar__foot-link">View site →</a>
      <button class="admin-sidebar__foot-btn" on:click={logout}>Log out</button>
    </div>
  </aside>

  <!-- ──────────── Main content ──────────── -->
  <div class="admin-main">
    <header class="admin-topbar">
      <div class="admin-topbar__title">
        <span class="evx-label admin-topbar__pre">ADMIN</span>
        <h1 class="admin-topbar__h">{title}</h1>
      </div>
      <div class="admin-topbar__meta">
        <span class="admin-topbar__user">
          {profile?.full_name ?? user?.email ?? 'admin'}
        </span>
        <a href="#/" class="admin-topbar__view">View site →</a>
      </div>
    </header>

    <main id="main-content" class="admin-content">
      <slot />
    </main>
  </div>

</div>

<style>
  /* ── Shell ───────────────────────────────────────── */

  .admin-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 100vh;
    background: var(--evx-paper);
  }

  /* ── Sidebar (dark) ──────────────────────────────── */

  .admin-sidebar {
    background: #1A1A1A;
    color: var(--evx-paper);
    display: flex;
    flex-direction: column;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    position: sticky;
    top: 0;
    height: 100vh;
  }

  .admin-sidebar__head {
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .admin-sidebar__brand {
    font-family: var(--evx-font-display);
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--evx-paper);
    text-decoration: none;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .admin-sidebar__sub {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.15em;
    color: var(--evx-fox-orange);
  }

  .admin-sidebar__nav {
    flex: 1;
    padding: 16px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }

  .admin-nav-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-family: var(--evx-font-display);
    font-size: 13.5px;
    color: rgba(245, 242, 237, 0.72);
    text-decoration: none;
    border-radius: 4px;
    transition: background 120ms ease, color 120ms ease;
  }

  .admin-nav-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--evx-paper);
  }

  .admin-nav-link.is-active {
    background: rgba(232, 116, 44, 0.12);
    color: var(--evx-paper);
    border-left: 2px solid var(--evx-fox-orange);
    padding-left: 12px;
  }

  .admin-nav-link__badge {
    background: var(--evx-fox-orange);
    color: #1A1A1A;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }

  .admin-sidebar__foot {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .admin-sidebar__foot-link {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: rgba(245, 242, 237, 0.6);
    text-decoration: none;
  }
  .admin-sidebar__foot-link:hover { color: var(--evx-paper); }

  .admin-sidebar__foot-btn {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: rgba(245, 242, 237, 0.6);
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }
  .admin-sidebar__foot-btn:hover { color: var(--evx-fox-orange); }

  /* ── Main column ─────────────────────────────────── */

  .admin-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .admin-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 32px;
    background: var(--evx-paper);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .admin-topbar__title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .admin-topbar__pre { color: var(--evx-fox-orange); }

  .admin-topbar__h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-warm-black);
    margin: 0;
  }

  .admin-topbar__meta {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .admin-topbar__user {
    font-size: 13px;
    color: var(--evx-ink-soft);
  }

  .admin-topbar__view {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-warm-black);
    text-decoration: none;
    padding: 6px 12px;
    border: 1px solid var(--evx-rule-light);
    border-radius: 2px;
  }
  .admin-topbar__view:hover { background: var(--evx-warm-black); color: var(--evx-paper); }

  .admin-content {
    padding: 32px;
    flex: 1;
  }

  /* ── Mobile ──────────────────────────────────────── */

  @media (max-width: 900px) {
    .admin-shell {
      grid-template-columns: 1fr;
    }
    .admin-sidebar {
      position: static;
      height: auto;
      width: 100%;
    }
    .admin-sidebar__nav {
      flex-direction: row;
      overflow-x: auto;
      padding: 8px;
    }
    .admin-nav-link {
      white-space: nowrap;
    }
    .admin-content { padding: 20px; }
    .admin-topbar { padding: 16px 20px; }
  }
</style>
