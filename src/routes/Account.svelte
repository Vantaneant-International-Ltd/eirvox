<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ListingCard from '../lib/ListingCard.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import {
    currentUser,
    orders,
    savedItems,
    conversations,
    activity,
    getActiveReservations,
    getOrderListing,
    getOrderSeller,
    getUnreadCount,
    statusLabel,
    type OrderStatus,
  } from '../data/user';
  import { getListingBySlug, formatPrice } from '../data/listings';

  export let tab: string = 'overview';

  $: if (typeof document !== 'undefined' && tab) applySeo(seo.account(tab));

  $: activeReservations = getActiveReservations();
  $: unreadCount = getUnreadCount();
  $: savedListings = savedItems
    .map(slug => getListingBySlug(slug))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);

  // Settings form state
  let editingProfile = false;
  let editName = `${currentUser.firstName} ${currentUser.lastName}`;
  let editEmail = currentUser.email;
  let editPhone = currentUser.phone;
  let editCity = currentUser.city;

  let notif = { ...currentUser.notifications };

  // Track which saved item is "removed" (visual only)
  let removedSaved: Set<string> = new Set();
  function toggleRemove(slug: string) {
    if (removedSaved.has(slug)) removedSaved.delete(slug);
    else removedSaved.add(slug);
    removedSaved = new Set(removedSaved);
  }

  // Expanded order rows
  let expandedOrders: Set<string> = new Set();
  function toggleOrder(id: string) {
    if (expandedOrders.has(id)) expandedOrders.delete(id);
    else expandedOrders.add(id);
    expandedOrders = new Set(expandedOrders);
  }

  // Timeline data per order status
  type TimelineStep = { key: string; label: string; date?: string };
  function getTimeline(status: OrderStatus, reservedAt: string): TimelineStep[] {
    const base: TimelineStep[] = [
      { key: 'reserved',  label: 'Reserved',       date: reservedAt },
      { key: 'paid',      label: 'Deposit paid',   date: status !== 'reserved' ? reservedAt : undefined },
      { key: 'confirmed', label: 'Seller confirmed' },
      { key: 'arranged',  label: 'Deal arranged' },
      { key: 'completed', label: 'Completed' },
    ];
    if (status === 'confirmed') { base[2].date = reservedAt; }
    if (status === 'shipped')   { base[2].date = '2026-05-16'; base[3].date = '2026-05-22'; }
    if (status === 'completed') {
      base[2].date = '2026-04-29';
      base[3].date = '2026-05-02';
      base[4].date = '2026-05-05';
    }
    return base;
  }
  function currentStepIndex(status: OrderStatus): number {
    if (status === 'reserved')  return 1;  // awaiting payment confirmation
    if (status === 'confirmed') return 2;
    if (status === 'shipped')   return 3;
    if (status === 'completed') return 4;
    return 0;
  }
  // Actions per status
  function statusActions(status: OrderStatus): { label: string; href: string; primary?: boolean }[] {
    switch (status) {
      case 'reserved':  return [
        { label: 'Pay deposit', href: '/messages', primary: true },
        { label: 'Message seller', href: '/messages' },
      ];
      case 'confirmed': return [
        { label: 'Pay balance', href: '/messages', primary: true },
        { label: 'Message seller', href: '/messages' },
      ];
      case 'shipped':   return [
        { label: 'Confirm receipt', href: '/messages', primary: true },
        { label: 'Track shipment', href: '/messages' },
      ];
      case 'completed': return [
        { label: 'Leave review', href: '/messages', primary: true },
        { label: 'View listing', href: '/automotive' },
      ];
      case 'cancelled': return [
        { label: 'Browse marketplace', href: '/automotive', primary: true },
      ];
    }
  }

  function statusColor(s: OrderStatus): string {
    switch (s) {
      case 'reserved':  return 'status--reserved';
      case 'confirmed': return 'status--confirmed';
      case 'shipped':   return 'status--shipped';
      case 'completed': return 'status--completed';
      case 'cancelled': return 'status--cancelled';
    }
  }

  const tabRoutes = [
    { id: 'overview', label: 'Overview', path: '/account' },
    { id: 'orders',   label: 'Reservations', path: '/account/orders' },
    { id: 'saved',    label: 'Saved items',  path: '/account/saved' },
    { id: 'settings', label: 'Settings',     path: '/account/settings' },
  ];
</script>

<Nav />

<main id="main-content" class="acct-page">
  <div class="page-container">

    <!-- Header -->
    <header class="acct-header">
      <div>
        <span class="evx-caption acct-header__pre">ACCOUNT · {currentUser.memberSince}</span>
        {#if tab === 'overview'}
          <h1 class="acct-title">
            Welcome back, <em class="acct-title__italic">{currentUser.firstName}.</em>
          </h1>
        {:else if tab === 'orders'}
          <h1 class="acct-title">Your reservations.</h1>
        {:else if tab === 'saved'}
          <h1 class="acct-title">Saved items.</h1>
        {:else if tab === 'settings'}
          <h1 class="acct-title">Settings.</h1>
        {/if}
      </div>

      <div class="acct-header__actions">
        <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/messages')}>
          Messages
          {#if unreadCount > 0}
            <span class="acct-header__badge">{unreadCount}</span>
          {/if}
        </button>
      </div>
    </header>

    <div class="acct-body">
      <!-- Sidebar -->
      <aside class="acct-side">
        <div class="acct-side__profile">
          <div class="acct-side__avatar">{currentUser.firstName.charAt(0)}</div>
          <div class="acct-side__profile-info">
            <span class="acct-side__name">{currentUser.firstName} {currentUser.lastName}</span>
            <span class="evx-caption acct-side__city">{currentUser.city}</span>
          </div>
        </div>

        <nav class="acct-nav" aria-label="Account sections">
          {#each tabRoutes as t}
            <button
              class="acct-nav__item"
              class:acct-nav__item--active={tab === t.id}
              on:click={() => navigate(t.path)}
            >
              <span>{t.label}</span>
              {#if t.id === 'orders'}
                <span class="evx-caption acct-nav__count">{activeReservations.length}</span>
              {:else if t.id === 'saved'}
                <span class="evx-caption acct-nav__count">{savedItems.length}</span>
              {/if}
            </button>
          {/each}
          {#if currentUser.isSeller}
            <button class="acct-nav__item acct-nav__item--seller" on:click={() => navigate('/sell/dashboard')}>
              <span>Seller dashboard</span>
              <span class="evx-caption acct-nav__count">→</span>
            </button>
          {:else}
            <div class="acct-nav__cta">
              <span class="evx-caption acct-nav__cta-label">SELLING ON ÉIRVOX?</span>
              <p class="acct-nav__cta-text">Cohort 03 open until 14 June.</p>
              <button class="evx-caption acct-nav__cta-link" on:click={() => navigate('/sell')}>
                Apply to sell →
              </button>
            </div>
          {/if}
        </nav>
      </aside>

      <!-- Main content -->
      <section class="acct-main">

        <!-- ════ OVERVIEW ════ -->
        {#if tab === 'overview'}
          <!-- Stats -->
          <div class="acct-stats">
            <button class="acct-stat" on:click={() => navigate('/account/orders')}>
              <span class="evx-label acct-stat__label">ACTIVE RESERVATIONS</span>
              <span class="acct-stat__val">{activeReservations.length}</span>
              <span class="evx-caption acct-stat__sub">€{activeReservations.reduce((s, o) => s + o.deposit, 0)} on deposit</span>
            </button>
            <button class="acct-stat" on:click={() => navigate('/account/saved')}>
              <span class="evx-label acct-stat__label">SAVED ITEMS</span>
              <span class="acct-stat__val">{savedItems.length}</span>
              <span class="evx-caption acct-stat__sub">Across {new Set(savedListings.map(l => l.category)).size} categories</span>
            </button>
            <button class="acct-stat acct-stat--accent" on:click={() => navigate('/messages')}>
              <span class="evx-label acct-stat__label acct-stat__label--accent">UNREAD MESSAGES</span>
              <span class="acct-stat__val">{unreadCount}</span>
              <span class="evx-caption acct-stat__sub">Across {conversations.filter(c => c.unread > 0).length} conversations</span>
            </button>
          </div>

          <!-- Activity feed -->
          <section class="acct-section">
            <div class="acct-section__head">
              <span class="evx-label">RECENT ACTIVITY</span>
            </div>
            <div class="activity">
              {#each activity as item}
                <button class="activity__row" on:click={() => item.link && navigate(item.link)}>
                  <span class="evx-caption activity__time">{item.timestamp}</span>
                  <div class="activity__body">
                    <strong class="activity__title">{item.title}</strong>
                    <span class="activity__detail">{item.detail}</span>
                  </div>
                  <span class="activity__arrow">→</span>
                </button>
              {/each}
            </div>
          </section>

          <!-- Quick links -->
          <section class="acct-section">
            <div class="acct-section__head">
              <span class="evx-label">SHORTCUTS</span>
            </div>
            <div class="shortcuts">
              <button class="shortcut" on:click={() => navigate('/automotive')}>
                <strong class="shortcut__title">Browse marketplace</strong>
                <span class="shortcut__detail evx-caption">31 listings across 7 categories</span>
                <span class="shortcut__arrow">→</span>
              </button>
              <button class="shortcut" on:click={() => navigate('/messages')}>
                <strong class="shortcut__title">View messages</strong>
                <span class="shortcut__detail evx-caption">{unreadCount} unread · {conversations.length} threads</span>
                <span class="shortcut__arrow">→</span>
              </button>
              <button class="shortcut" on:click={() => navigate('/account/saved')}>
                <strong class="shortcut__title">Manage saved items</strong>
                <span class="shortcut__detail evx-caption">{savedItems.length} items kept for later</span>
                <span class="shortcut__arrow">→</span>
              </button>
              <button class="shortcut" on:click={() => navigate('/drive')}>
                <strong class="shortcut__title">DRIVE issues</strong>
                <span class="shortcut__detail evx-caption">Issue 003 open · 5 of 8 remaining</span>
                <span class="shortcut__arrow">→</span>
              </button>
            </div>
          </section>

        <!-- ════ ORDERS / RESERVATIONS ════ -->
        {:else if tab === 'orders'}
          {#if orders.length === 0}
            <div class="empty">
              <span class="evx-label empty__label">NO RESERVATIONS YET</span>
              <h2 class="empty__h">Nothing reserved yet.</h2>
              <p class="empty__sub">Browse the marketplace to find something worth keeping.</p>
              <button class="evx-btn evx-btn--primary" on:click={() => navigate('/automotive')}>
                Browse marketplace →
              </button>
            </div>
          {:else}
            <p class="acct-intro">
              Your reservations across the marketplace and DRIVE. Deposits are €49 per item, fully refundable until the item ships.
            </p>

            <div class="orders">
              <div class="orders__head evx-caption">
                <span>ITEM</span>
                <span>STATUS</span>
                <span class="orders__right">DEPOSIT</span>
                <span class="orders__right">BALANCE</span>
                <span class="orders__right">RESERVED</span>
              </div>

              {#each orders as order}
                {@const listing = getOrderListing(order)}
                {@const seller = getOrderSeller(order)}
                {@const isOpen = expandedOrders.has(order.id)}
                {#if listing && seller}
                  <div class="orders__group">
                    <button
                      class="orders__row"
                      class:orders__row--open={isOpen}
                      on:click={() => toggleOrder(order.id)}
                      aria-expanded={isOpen}
                    >
                      <div class="orders__item">
                        <div class="orders__thumb"></div>
                        <div class="orders__info">
                          <strong>{listing.title}</strong>
                          <span class="evx-caption">{order.id} · from {seller.name}</span>
                          {#if order.notes}
                            <span class="evx-caption orders__note">{order.notes}</span>
                          {/if}
                        </div>
                      </div>
                      <span class="status {statusColor(order.status)}">
                        <span class="status__dot"></span>
                        {statusLabel[order.status]}
                      </span>
                      <span class="orders__right orders__deposit">€{order.deposit}</span>
                      <span class="orders__right">{formatPrice(order.balance)}</span>
                      <span class="orders__right evx-caption">
                        {order.reservedAt}
                        <span class="orders__chev" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                      </span>
                    </button>

                    {#if isOpen}
                      {@const timeline = getTimeline(order.status, order.reservedAt)}
                      {@const currentIdx = currentStepIndex(order.status)}
                      {@const actions = statusActions(order.status)}
                      <div class="orders__expand">
                        <!-- Timeline -->
                        <div class="timeline">
                          <span class="evx-label timeline__label">PROGRESS</span>
                          <div class="timeline__steps">
                            {#each timeline as step, i}
                              <div
                                class="timeline__step"
                                class:timeline__step--done={i < currentIdx}
                                class:timeline__step--active={i === currentIdx}
                              >
                                <span class="timeline__dot"></span>
                                <div class="timeline__body">
                                  <span class="timeline__step-label">{step.label}</span>
                                  {#if step.date}
                                    <span class="evx-caption timeline__step-date">{step.date}</span>
                                  {:else if i === currentIdx}
                                    <span class="evx-caption timeline__step-date timeline__step-date--pending">In progress</span>
                                  {:else}
                                    <span class="evx-caption timeline__step-date timeline__step-date--upcoming">—</span>
                                  {/if}
                                </div>
                              </div>
                            {/each}
                          </div>
                        </div>

                        <!-- Actions -->
                        <div class="orders__actions">
                          <span class="evx-label orders__actions-label">NEXT STEPS</span>
                          <div class="orders__actions-row">
                            {#each actions as act}
                              <button
                                class="evx-btn {act.primary ? 'evx-btn--primary' : 'evx-btn--ghost'} evx-btn--sm"
                                on:click|stopPropagation={() => navigate(act.href)}
                              >
                                {act.label}
                              </button>
                            {/each}
                            <button
                              class="evx-btn evx-btn--ghost evx-btn--sm"
                              on:click|stopPropagation={() => navigate(`/listing/${listing.slug}`)}
                            >
                              View item
                            </button>
                          </div>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>

            <div class="orders__legend">
              <span class="evx-caption orders__legend-label">STATUS GUIDE</span>
              <div class="orders__legend-list">
                <span class="status status--reserved"><span class="status__dot"></span>Reserved · awaiting confirmation</span>
                <span class="status status--confirmed"><span class="status__dot"></span>Confirmed · ready to pay balance</span>
                <span class="status status--shipped"><span class="status__dot"></span>Shipped · in transit</span>
                <span class="status status--completed"><span class="status__dot"></span>Completed</span>
              </div>
            </div>
          {/if}

        <!-- ════ SAVED ITEMS ════ -->
        {:else if tab === 'saved'}
          {#if savedListings.length === 0}
            <div class="empty">
              <span class="evx-label empty__label">NOTHING SAVED</span>
              <h2 class="empty__h">Nothing saved yet.</h2>
              <p class="empty__sub">Tap the bookmark icon on any listing to save it for later.</p>
              <button class="evx-btn evx-btn--primary" on:click={() => navigate('/automotive')}>
                Browse listings →
              </button>
            </div>
          {:else}
            <p class="acct-intro">
              {savedListings.length} items kept for later. Sorted by date saved — newest first.
            </p>

            <div class="saved-grid">
              {#each savedListings as listing}
                <div class="saved-card" class:saved-card--removed={removedSaved.has(listing.slug)}>
                  <ListingCard {listing} />
                  <button class="saved-card__remove evx-caption" on:click|stopPropagation={() => toggleRemove(listing.slug)}>
                    {removedSaved.has(listing.slug) ? 'Undo' : 'Remove'}
                  </button>
                </div>
              {/each}
            </div>
          {/if}

        <!-- ════ SETTINGS ════ -->
        {:else if tab === 'settings'}
          <p class="acct-intro">
            Profile, notification preferences, and account actions. Email
            <a href="mailto:renato@eirvox.ie" class="acct-intro__link">renato@eirvox.ie</a>
            for anything not on this page.
          </p>

          <!-- Profile -->
          <section class="acct-section">
            <div class="acct-section__head">
              <span class="evx-label">PROFILE</span>
              <button class="evx-caption acct-section__edit" on:click={() => editingProfile = !editingProfile}>
                {editingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div class="profile-form">
              <div class="profile-row">
                <div class="profile-field">
                  <span class="evx-caption profile-field__label">NAME</span>
                  {#if editingProfile}
                    <input type="text" class="profile-field__input" bind:value={editName} />
                  {:else}
                    <span class="profile-field__value">{editName}</span>
                  {/if}
                </div>
                <div class="profile-field">
                  <span class="evx-caption profile-field__label">EMAIL</span>
                  {#if editingProfile}
                    <input type="email" class="profile-field__input" bind:value={editEmail} />
                  {:else}
                    <span class="profile-field__value">{editEmail}</span>
                  {/if}
                </div>
              </div>
              <div class="profile-row">
                <div class="profile-field">
                  <span class="evx-caption profile-field__label">PHONE</span>
                  {#if editingProfile}
                    <input type="tel" class="profile-field__input" bind:value={editPhone} />
                  {:else}
                    <span class="profile-field__value">{editPhone}</span>
                  {/if}
                </div>
                <div class="profile-field">
                  <span class="evx-caption profile-field__label">LOCATION</span>
                  {#if editingProfile}
                    <input type="text" class="profile-field__input" bind:value={editCity} />
                  {:else}
                    <span class="profile-field__value">{editCity}, {currentUser.country}</span>
                  {/if}
                </div>
              </div>
              {#if editingProfile}
                <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => editingProfile = false}>
                  Save changes
                </button>
              {/if}
            </div>
          </section>

          <!-- Notifications -->
          <section class="acct-section">
            <div class="acct-section__head">
              <span class="evx-label">NOTIFICATIONS</span>
            </div>
            <div class="settings-list">
              {#each [
                { key: 'newMessages',  label: 'New messages',   desc: 'When a seller replies or sends you a new message.' },
                { key: 'priceDrops',   label: 'Price drops',    desc: 'On items you\'ve saved — emailed weekly.' },
                { key: 'driveReleases',label: 'DRIVE releases', desc: 'When a new DRIVE issue opens for reservation.' },
                { key: 'weeklyDigest', label: 'Weekly digest',  desc: 'A summary of new listings in your saved categories.' },
              ] as item}
                <label class="setting">
                  <input type="checkbox" bind:checked={notif[item.key]} class="setting__box" />
                  <div class="setting__body">
                    <strong class="setting__title">{item.label}</strong>
                    <span class="setting__desc evx-caption">{item.desc}</span>
                  </div>
                </label>
              {/each}
            </div>
          </section>

          <!-- Account actions -->
          <section class="acct-section">
            <div class="acct-section__head">
              <span class="evx-label">ACCOUNT</span>
            </div>
            <div class="settings-actions">
              <div class="action">
                <div class="action__body">
                  <strong class="action__title">Download my data</strong>
                  <p class="action__desc">A copy of your profile, reservations, messages, and saved items in JSON format.</p>
                </div>
                <a href="mailto:renato@eirvox.ie?subject=Data%20export%20request" class="action__link evx-caption">
                  Request export →
                </a>
              </div>
              <div class="action action--danger">
                <div class="action__body">
                  <strong class="action__title">Delete account</strong>
                  <p class="action__desc">Removes your profile and all data. Active reservations must be cancelled first.</p>
                </div>
                <a href="mailto:renato@eirvox.ie?subject=Account%20deletion%20request" class="action__link evx-caption">
                  Contact us →
                </a>
              </div>
            </div>
          </section>

          <!-- Sign out -->
          <div class="signout">
            <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/login')}>
              Sign out
            </button>
          </div>
        {/if}

      </section>
    </div>

  </div>
</main>

<Footer />

<style>
  .acct-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Header */
  .acct-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .acct-header__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }

  .acct-title {
    font-family: var(--evx-font-display);
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    line-height: 1.05;
  }

  .acct-title__italic {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
  }

  .acct-header__actions { display: flex; gap: var(--evx-space-md); flex-shrink: 0; }

  .acct-header__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px; height: 18px;
    padding: 0 6px;
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    margin-left: 6px;
  }

  /* Body layout */
  .acct-body {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--evx-space-2xl);
    align-items: start;
  }

  /* Sidebar */
  .acct-side { display: flex; flex-direction: column; gap: var(--evx-space-xl); position: sticky; top: 80px; }

  .acct-side__profile {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .acct-side__avatar {
    width: 44px; height: 44px;
    background: var(--evx-graphite);
    color: var(--evx-paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    flex-shrink: 0;
  }

  .acct-side__profile-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .acct-side__name { font-family: var(--evx-font-display); font-weight: 500; font-size: 15px; }
  .acct-side__city { color: var(--evx-ink-soft); }

  .acct-nav { display: flex; flex-direction: column; gap: 0; }

  .acct-nav__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--evx-space-sm) var(--evx-space-md);
    background: none;
    border: none;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    cursor: pointer;
    transition: var(--evx-transition);
    text-align: left;
  }

  .acct-nav__item:hover { opacity: 0.70; }

  .acct-nav__item--active {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
  }
  .acct-nav__item--active .acct-nav__count { color: rgba(245,242,237,0.6); }

  .acct-nav__item--seller {
    margin-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-md);
    color: var(--evx-fox-orange);
  }

  .acct-nav__count { color: var(--evx-ink-soft); }

  .acct-nav__cta {
    margin-top: var(--evx-space-md);
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .acct-nav__cta-label { color: var(--evx-fox-orange); }
  .acct-nav__cta-text { font-size: 13px; line-height: 1.55; color: var(--evx-ink-soft); }
  .acct-nav__cta-link {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black); cursor: pointer;
    text-align: left; margin-top: var(--evx-space-xs);
    transition: var(--evx-transition);
  }
  .acct-nav__cta-link:hover { color: var(--evx-fox-orange); }

  /* Main */
  .acct-main { display: flex; flex-direction: column; gap: var(--evx-space-2xl); min-width: 0; }

  .acct-intro { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); max-width: 640px; }
  .acct-intro__link { color: var(--evx-warm-black); text-decoration: underline; text-underline-offset: 3px; }

  /* Stats */
  .acct-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
  }

  .acct-stat {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
    padding: var(--evx-space-md) var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .acct-stat:hover { border-color: var(--evx-warm-black); }
  .acct-stat--accent { border-color: var(--evx-fox-orange); background: rgba(232,116,44,0.04); }

  .acct-stat__label { color: var(--evx-ink-soft); }
  .acct-stat__label--accent { color: var(--evx-fox-orange); }

  .acct-stat__val {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    line-height: 1.2;
  }

  .acct-stat__sub { color: var(--evx-ink-soft); line-height: 1.5; }

  /* Sections */
  .acct-section { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .acct-section__head { display: flex; justify-content: space-between; align-items: center; }
  .acct-section__head span { color: var(--evx-ink-soft); }
  .acct-section__edit {
    background: none; border: none; padding: 0;
    color: var(--evx-fox-orange); cursor: pointer;
    transition: var(--evx-transition);
  }
  .acct-section__edit:hover { opacity: 0.70; }

  /* Activity */
  .activity { display: flex; flex-direction: column; border: 1px solid var(--evx-rule-light); }

  .activity__row {
    display: grid;
    grid-template-columns: 120px 1fr 24px;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    background: none;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    align-items: center;
    transition: var(--evx-transition);
  }
  .activity__row:last-child { border-bottom: none; }
  .activity__row:hover { background: rgba(0,0,0,0.02); }

  .activity__time { color: var(--evx-ink-soft); }
  .activity__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .activity__title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .activity__detail { font-size: 13px; color: var(--evx-ink-soft); line-height: 1.5; }
  .activity__arrow { color: var(--evx-ink-soft); font-size: 14px; }

  /* Shortcuts */
  .shortcuts {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--evx-space-md);
  }

  .shortcut {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto;
    gap: 2px var(--evx-space-md);
    padding: var(--evx-space-md);
    background: none;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
    align-items: center;
  }
  .shortcut:hover { border-color: var(--evx-warm-black); }
  .shortcut__title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .shortcut__detail { color: var(--evx-ink-soft); grid-column: 1; }
  .shortcut__arrow { grid-row: 1 / span 2; color: var(--evx-ink-soft); font-size: 16px; }

  /* Orders table */
  .orders {
    border: 1px solid var(--evx-rule-light);
    display: flex;
    flex-direction: column;
  }

  .orders__head,
  .orders__row {
    display: grid;
    grid-template-columns: 2fr 140px 80px 110px 110px;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    align-items: center;
  }

  .orders__head {
    color: var(--evx-ink-soft);
    background: rgba(0,0,0,0.02);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .orders__right { text-align: right; }

  .orders__row {
    background: none;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
    font-size: 13px;
    color: var(--evx-warm-black);
  }
  .orders__row:last-child { border-bottom: none; }
  .orders__row:hover { background: rgba(0,0,0,0.02); }

  .orders__item { display: flex; gap: var(--evx-space-md); align-items: flex-start; min-width: 0; }
  .orders__thumb { width: 44px; height: 52px; background: var(--evx-graphite); flex-shrink: 0; }
  .orders__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .orders__info strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }
  .orders__info span { color: var(--evx-ink-soft); }

  .orders__note { font-style: italic; line-height: 1.5; padding-top: 2px; }

  .orders__deposit { font-family: var(--evx-font-display); font-weight: 500; }

  /* Expanded row + timeline */
  .orders__group {
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .orders__group:last-child { border-bottom: none; }
  .orders__row { border-bottom: none; }
  .orders__row--open {
    background: rgba(0,0,0,0.02);
  }
  .orders__chev {
    display: inline-block;
    margin-left: var(--evx-space-sm);
    color: var(--evx-ink-soft);
    font-size: 14px;
  }

  .orders__expand {
    padding: var(--evx-space-lg) var(--evx-space-md) var(--evx-space-lg);
    border-top: 1px solid var(--evx-rule-light);
    background: rgba(0,0,0,0.02);
    display: flex; flex-direction: column;
    gap: var(--evx-space-xl);
  }

  /* Timeline */
  .timeline { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .timeline__label { color: var(--evx-ink-soft); }
  .timeline__steps {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--evx-space-md);
    position: relative;
  }
  .timeline__step {
    display: flex; flex-direction: column;
    gap: var(--evx-space-sm);
    padding-left: var(--evx-space-md);
    border-left: 2px solid var(--evx-rule-light);
    opacity: 0.40;
  }
  .timeline__step--done { opacity: 1; border-left-color: var(--evx-warm-black); }
  .timeline__step--active {
    opacity: 1;
    border-left-color: var(--evx-fox-orange);
  }
  .timeline__dot {
    width: 8px; height: 8px;
    background: var(--evx-rule-light);
    border-radius: 50%;
    margin-left: -19px;
    margin-bottom: 2px;
  }
  .timeline__step--done .timeline__dot { background: var(--evx-warm-black); }
  .timeline__step--active .timeline__dot { background: var(--evx-fox-orange); }

  .timeline__body { display: flex; flex-direction: column; gap: 2px; }
  .timeline__step-label {
    font-family: var(--evx-font-display);
    font-size: 13px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .timeline__step-date { color: var(--evx-ink-soft); }
  .timeline__step-date--pending { color: var(--evx-fox-orange); }
  .timeline__step-date--upcoming { color: var(--evx-rule-light); }

  /* Actions */
  .orders__actions { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .orders__actions-label { color: var(--evx-ink-soft); }
  .orders__actions-row { display: flex; flex-wrap: wrap; gap: var(--evx-space-sm); }

  .orders__legend {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-lg);
  }
  .orders__legend-label { color: var(--evx-ink-soft); }
  .orders__legend-list { display: flex; flex-wrap: wrap; gap: var(--evx-space-md); }

  /* Status pills */
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    padding: 4px 8px;
    border: 1px solid currentColor;
    white-space: nowrap;
  }
  .status__dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .status--reserved  { color: var(--evx-fox-orange); }
  .status--confirmed { color: #4a8c5b; }
  .status--shipped   { color: #3678b3; }
  .status--completed { color: var(--evx-warm-black); }
  .status--cancelled { color: var(--evx-ink-soft); }

  /* Saved grid */
  .saved-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-xl);
  }

  .saved-card {
    position: relative;
    display: flex;
    flex-direction: column;
    transition: opacity 200ms ease;
  }
  .saved-card--removed { opacity: 0.35; }

  .saved-card__remove {
    background: none;
    border: 1px solid var(--evx-rule-light);
    padding: 6px 12px;
    cursor: pointer;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-sm);
    align-self: flex-start;
    transition: var(--evx-transition);
  }
  .saved-card__remove:hover { color: var(--evx-fox-orange); border-color: var(--evx-fox-orange); }

  /* Empty state */
  .empty {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
    padding: var(--evx-space-3xl) 0;
    max-width: 480px;
  }
  .empty__label { color: var(--evx-fox-orange); }
  .empty__h {
    font-family: var(--evx-font-display);
    font-size: 32px; font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .empty__sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }

  /* Settings — profile */
  .profile-form { display: flex; flex-direction: column; gap: var(--evx-space-lg); }

  .profile-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-xl);
  }

  .profile-field { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .profile-field__label { color: var(--evx-ink-soft); }
  .profile-field__value {
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-warm-black);
    padding: var(--evx-space-sm) 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .profile-field__input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-warm-black);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-warm-black);
    outline: none;
  }

  /* Settings — list */
  .settings-list { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--evx-rule-light); }

  .setting {
    display: flex;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: background 200ms ease;
  }
  .setting:last-child { border-bottom: none; }
  .setting:hover { background: rgba(0,0,0,0.02); }

  .setting__box {
    width: 18px; height: 18px;
    accent-color: var(--evx-fox-orange);
    margin-top: 2px; flex-shrink: 0;
  }
  .setting__body { display: flex; flex-direction: column; gap: 2px; }
  .setting__title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .setting__desc { color: var(--evx-ink-soft); line-height: 1.5; }

  /* Settings — actions */
  .settings-actions { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--evx-rule-light); }

  .action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-lg);
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .action:last-child { border-bottom: none; }
  .action--danger { background: rgba(232,116,44,0.03); }
  .action__title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); display: block; }
  .action__desc { font-size: 13px; color: var(--evx-ink-soft); line-height: 1.5; margin-top: 2px; }
  .action__link {
    color: var(--evx-warm-black);
    text-decoration: none;
    white-space: nowrap;
    transition: var(--evx-transition);
  }
  .action__link:hover { color: var(--evx-fox-orange); }

  .signout { padding-top: var(--evx-space-md); }

  @media (max-width: 1023px) {
    .acct-body { grid-template-columns: 1fr; }
    .acct-side { position: static; }
    .acct-side__profile { padding-bottom: 0; border-bottom: none; }
    .acct-nav {
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 0;
      overflow-x: auto;
      border-bottom: 1px solid var(--evx-rule-light);
      scrollbar-width: none;
    }
    .acct-nav::-webkit-scrollbar { display: none; }
    .acct-nav__item {
      flex-shrink: 0;
      padding: var(--evx-space-sm) var(--evx-space-md);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      gap: var(--evx-space-sm);
    }
    .acct-nav__item--active {
      background: transparent;
      color: var(--evx-warm-black);
      border-bottom-color: var(--evx-fox-orange);
    }
    .acct-nav__item--active .acct-nav__count { color: var(--evx-fox-orange); }
    .acct-nav__item--seller {
      margin-top: 0; padding-top: var(--evx-space-sm);
      border-top: none; border-left: 1px solid var(--evx-rule-light);
      padding-left: var(--evx-space-lg);
    }
    .acct-nav__cta { width: 100%; margin-top: var(--evx-space-md); }
    .saved-grid { grid-template-columns: repeat(2, 1fr); }
    .shortcuts { grid-template-columns: 1fr; }
    .acct-stats { grid-template-columns: 1fr; }
    .orders__head, .orders__row { grid-template-columns: 1.5fr 120px 80px 100px; }
    .orders__head span:nth-child(5), .orders__row > *:nth-child(5) { display: none; }
    .timeline__steps { grid-template-columns: repeat(2, 1fr); gap: var(--evx-space-md); }
    .profile-row { grid-template-columns: 1fr; }
  }

  @media (max-width: 767px) {
    .acct-header { flex-direction: column; align-items: flex-start; }
    .acct-side__profile { display: none; }
    .saved-grid { grid-template-columns: 1fr; }
    .orders__head, .orders__row { grid-template-columns: 1fr 110px; }
    .orders__head span:nth-child(3), .orders__head span:nth-child(4),
    .orders__row > *:nth-child(3), .orders__row > *:nth-child(4) { display: none; }
    .timeline__steps { grid-template-columns: 1fr; }
    .activity__row { grid-template-columns: 1fr; }
    .activity__time { font-size: 10px; }
  }
</style>
