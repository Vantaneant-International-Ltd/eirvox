<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate, currentPath } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { auth } from '../lib/auth';
  import {
    getMySeller,
    updateSellerProfile,
    uploadSellerLogo,
    sellerStatusLabel,
    type Seller,
  } from '../lib/sellers';
  import {
    getSellerListings,
    getSellerStats,
    getSellerReservations,
    setListingStatus,
    deleteListing,
    listingStatusLabel,
    reservationStatusLabel,
    updateReservationStatus,
    type ListingWithExtras,
    type ListingStatus,
    type ReservationWithListing,
    type ReservationStatus,
    type SellerStats,
  } from '../lib/listings';

  onMount(() => applySeo(seo.sellDashboard()));

  // ── Tabs ───────────────────────────────────────────────────
  type Tab = 'overview' | 'listings' | 'reservations' | 'profile';
  let tab: Tab = 'overview';

  // ── State ──────────────────────────────────────────────────
  let seller: Seller | null = null;
  let stats: SellerStats = { activeListings: 0, totalListings: 0, totalViews: 0, totalSales: 0 };
  let listings: ListingWithExtras[] = [];
  let reservations: ReservationWithListing[] = [];
  let loading = true;
  let loadError = '';

  // Profile-tab state
  let editTradingName = '';
  let editHandle = '';
  let editBio = '';
  let editEmail = '';
  let editPhone = '';
  let editCity = '';
  let logoFile: File | null = null;
  let profileSaving = false;
  let profileMsg = '';
  let profileErr = '';

  async function load() {
    loading = true;
    loadError = '';

    seller = await getMySeller();
    if (!seller) {
      loadError = 'No seller record found.';
      loading = false;
      return;
    }

    [stats, listings, reservations] = await Promise.all([
      getSellerStats(seller.id),
      getSellerListings(seller.id),
      getSellerReservations(seller.id),
    ]);

    // Seed profile editor
    editTradingName = seller.trading_name ?? '';
    editHandle      = seller.handle ?? '';
    editBio         = seller.bio ?? '';
    editEmail       = seller.email ?? '';
    editPhone       = seller.phone ?? '';
    editCity        = seller.city ?? '';

    loading = false;
  }

  onMount(async () => {
    // Wait for auth init then load
    const waitForInit = () => new Promise<void>(resolve => {
      const unsub = auth.subscribe(s => {
        if (s.initialised) { unsub(); resolve(); }
      });
    });
    await waitForInit();
    await load();
  });

  // ── Listing actions ────────────────────────────────────────
  async function markSold(id: string) {
    if (!confirm('Mark this listing as sold?')) return;
    const r = await setListingStatus(id, 'sold');
    if (r.ok) load();
  }
  async function removeListing(id: string) {
    if (!confirm('Remove this listing? It will be hidden from the marketplace but kept on file.')) return;
    const r = await deleteListing(id);
    if (r.ok) load();
  }
  async function duplicateListing(_id: string) {
    alert('Duplicate goes to a fresh /sell/create — coming next phase.');
  }

  // ── Reservation actions ────────────────────────────────────
  async function setResStatus(id: string, status: ReservationStatus) {
    const r = await updateReservationStatus(id, status);
    if (r.ok) load();
  }

  // ── Profile save ──────────────────────────────────────────
  async function saveProfile(e: Event) {
    e.preventDefault();
    if (!seller || profileSaving) return;
    profileSaving = true; profileMsg = ''; profileErr = '';

    const r = await updateSellerProfile(seller.id, {
      trading_name: editTradingName.trim() || seller.trading_name,
      handle: editHandle.trim() || null,
      bio: editBio.trim() || null,
      email: editEmail.trim() || null,
      phone: editPhone.trim() || null,
      city: editCity.trim() || null,
    });

    // Optional logo upload
    if (r.ok && logoFile) {
      const up = await uploadSellerLogo(seller.id, logoFile);
      if (!up.ok) { profileErr = up.error ?? 'Logo upload failed.'; profileSaving = false; return; }
      logoFile = null;
    }

    profileSaving = false;
    if (!r.ok) { profileErr = r.error ?? 'Could not save changes.'; return; }
    profileMsg = 'Saved.';
    await load();
  }

  function onLogoPick(e: Event) {
    const input = e.target as HTMLInputElement;
    logoFile = input.files?.[0] ?? null;
  }

  function statusBadgeClass(s: ListingStatus): string {
    return `status status--${s}`;
  }
  function resBadgeClass(s: ReservationStatus): string {
    return `status status--${s}`;
  }

  function formatEuros(n: number | null | undefined): string {
    if (n == null) return '—';
    return '€' + Number(n).toLocaleString('en-IE');
  }
</script>

<Nav />

<main id="main-content" class="dash-page">
  <div class="page-container">

    <!-- ── Header ── -->
    <header class="dash-header">
      <div class="dash-header__left">
        {#if seller?.logo_url}
          <img src={seller.logo_url} alt="" class="dash-header__logo" />
        {:else}
          <div class="dash-header__logo dash-header__logo--placeholder">
            {(seller?.trading_name ?? 'S').charAt(0)}
          </div>
        {/if}
        <div class="dash-header__id">
          {#if seller}
            <h1 class="dash-header__name">{seller.trading_name}</h1>
            <div class="dash-header__meta">
              <span class="status {seller.status === 'approved' ? 'status--active' : seller.status === 'pending' ? 'status--pending_review' : 'status--removed'}">
                <span class="status__dot"></span>
                {sellerStatusLabel[seller.status]}
              </span>
              <span class="evx-caption">
                Tier · <strong>{seller.tier === 'atelier' ? 'Atelier · €19/mo · 5%' : seller.tier === 'verified' ? 'Verified · €0/mo · 7%' : 'House · invite'}</strong>
              </span>
              {#if seller.handle}<span class="evx-caption">@{seller.handle}</span>{/if}
            </div>
          {:else if loading}
            <h1 class="dash-header__name">Loading…</h1>
          {:else}
            <h1 class="dash-header__name">Seller dashboard</h1>
          {/if}
        </div>
      </div>

      <div class="dash-header__cta">
        {#if seller?.status === 'approved'}
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/sell/create')}>
            + Create listing
          </button>
        {/if}
        <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/messages')}>
          Messages
        </button>
      </div>
    </header>

    <!-- ── Tabs ── -->
    <div class="dash-tabs" role="tablist" aria-label="Dashboard sections">
      {#each [
        { id: 'overview',     label: 'Overview'   },
        { id: 'listings',     label: 'My listings', count: stats.totalListings },
        { id: 'reservations', label: 'Reservations', count: reservations.length },
        { id: 'profile',      label: 'Profile'    },
      ] as t}
        <button
          class="dash-tab"
          class:dash-tab--active={tab === t.id}
          role="tab"
          aria-selected={tab === t.id}
          on:click={() => tab = t.id}
        >
          {t.label}
          {#if t.count != null}<span class="dash-tab__count">{t.count}</span>{/if}
        </button>
      {/each}
    </div>

    <!-- ── Loading / error ── -->
    {#if loading && !seller}
      <div class="dash-state">
        <span class="evx-label">LOADING…</span>
        <p>Fetching your seller record.</p>
      </div>

    {:else if loadError}
      <div class="dash-state dash-state--err">
        <span class="evx-label">ERROR</span>
        <p>{loadError}</p>
        <div class="dash-state__actions">
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/sell/apply')}>
            Apply to sell →
          </button>
        </div>
      </div>

    {:else if seller && seller.status === 'pending'}
      <div class="dash-state dash-state--pending">
        <span class="evx-label">UNDER REVIEW</span>
        <h2 class="dash-state__h">We're reviewing your application.</h2>
        <p>
          Applied {new Date(seller.applied_at).toLocaleDateString('en-IE')}.
          Most reviews are wrapped within 48 hours.
          You'll get an email the moment there's a decision.
        </p>
      </div>

    <!-- ════ OVERVIEW ════ -->
    {:else if tab === 'overview'}
      <section class="dash-section">
        <div class="dash-stats">
          <div class="stat">
            <span class="evx-label stat__label">ACTIVE LISTINGS</span>
            <span class="stat__val">{stats.activeListings}</span>
            <span class="evx-caption stat__sub">of {stats.totalListings} total</span>
          </div>
          <div class="stat">
            <span class="evx-label stat__label">TOTAL VIEWS</span>
            <span class="stat__val">{stats.totalViews.toLocaleString('en-IE')}</span>
            <span class="evx-caption stat__sub">Across all listings</span>
          </div>
          <div class="stat stat--accent">
            <span class="evx-label stat__label">TOTAL SALES</span>
            <span class="stat__val">{stats.totalSales}</span>
            <span class="evx-caption stat__sub">Completed reservations</span>
          </div>
          <div class="stat">
            <span class="evx-label stat__label">SELLER RATING</span>
            <span class="stat__val">—</span>
            <span class="evx-caption stat__sub">No reviews yet</span>
          </div>
        </div>

        <div class="dash-actions">
          <button class="action-card" on:click={() => navigate('/sell/create')}>
            <span class="evx-label action-card__label">CREATE</span>
            <strong class="action-card__title">New listing</strong>
            <span class="evx-caption action-card__desc">Draft → submit for review → live within 24h.</span>
            <span class="action-card__arrow">→</span>
          </button>
          <button class="action-card" on:click={() => navigate('/messages')}>
            <span class="evx-label action-card__label">RESPOND</span>
            <strong class="action-card__title">View messages</strong>
            <span class="evx-caption action-card__desc">Buyer enquiries and reservations.</span>
            <span class="action-card__arrow">→</span>
          </button>
          <button class="action-card" on:click={() => tab = 'profile'}>
            <span class="evx-label action-card__label">EDIT</span>
            <strong class="action-card__title">Profile &amp; logo</strong>
            <span class="evx-caption action-card__desc">Trading name, bio, contact, photo.</span>
            <span class="action-card__arrow">→</span>
          </button>
        </div>
      </section>

    <!-- ════ LISTINGS ════ -->
    {:else if tab === 'listings'}
      <section class="dash-section">
        <div class="section-head">
          <div>
            <span class="evx-label">YOUR LISTINGS</span>
            <h2 class="section-head__h">{stats.totalListings} listing{stats.totalListings === 1 ? '' : 's'}</h2>
          </div>
          <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => navigate('/sell/create')}>
            + New listing
          </button>
        </div>

        {#if listings.length === 0}
          <div class="empty">
            <span class="evx-label">NOTHING YET</span>
            <h3 class="empty__h">You haven't created a listing.</h3>
            <p>Most sellers start with three or four — variety lets buyers find you in different searches.</p>
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/create')}>
              Create your first listing →
            </button>
          </div>
        {:else}
          <div class="lst-table">
            <div class="lst-head evx-caption">
              <span>ITEM</span>
              <span>STATUS</span>
              <span class="lst-right">VIEWS</span>
              <span class="lst-right">PRICE</span>
              <span class="lst-right">POSTED</span>
              <span class="lst-right">ACTIONS</span>
            </div>
            {#each listings as l (l.id)}
              <div class="lst-row">
                <div class="lst-item">
                  {#if l.images[0]?.public_url}
                    <img src={l.images[0].public_url} alt="" class="lst-thumb" />
                  {:else}
                    <div class="lst-thumb lst-thumb--empty"></div>
                  {/if}
                  <div class="lst-info">
                    <strong>{l.title}</strong>
                    <span class="evx-caption">{l.subtitle ?? '—'}</span>
                  </div>
                </div>
                <span class={statusBadgeClass(l.status)}>
                  <span class="status__dot"></span>
                  {listingStatusLabel[l.status]}
                </span>
                <span class="lst-right">{l.views_count}</span>
                <span class="lst-right lst-price">{formatEuros(l.price)}</span>
                <span class="lst-right evx-caption">{new Date(l.created_at).toLocaleDateString('en-IE')}</span>
                <span class="lst-right lst-actions">
                  <button class="lst-act" title="Edit" on:click={() => navigate(`/sell/edit/${l.id}`)}>Edit</button>
                  <button class="lst-act" title="Duplicate" on:click={() => duplicateListing(l.id)}>Dup</button>
                  {#if l.status === 'active'}
                    <button class="lst-act" title="Mark as sold" on:click={() => markSold(l.id)}>Sold</button>
                  {/if}
                  <button class="lst-act lst-act--danger" title="Remove" on:click={() => removeListing(l.id)}>Remove</button>
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </section>

    <!-- ════ RESERVATIONS ════ -->
    {:else if tab === 'reservations'}
      <section class="dash-section">
        <div class="section-head">
          <div>
            <span class="evx-label">RESERVATIONS</span>
            <h2 class="section-head__h">{reservations.length} on the books</h2>
          </div>
        </div>

        {#if reservations.length === 0}
          <div class="empty">
            <span class="evx-label">NONE YET</span>
            <h3 class="empty__h">No reservations.</h3>
            <p>When a buyer puts a €49 deposit on one of your listings, it shows up here.</p>
          </div>
        {:else}
          <div class="res-list">
            {#each reservations as r (r.id)}
              <div class="res-card">
                <div class="res-card__top">
                  <div class="res-card__info">
                    <strong class="res-card__title">{r.listing?.title ?? 'Listing'}</strong>
                    <span class="evx-caption">
                      from {r.buyer?.full_name ?? r.buyer?.email ?? 'buyer'} ·
                      reserved {new Date(r.reserved_at).toLocaleDateString('en-IE')}
                    </span>
                  </div>
                  <span class={resBadgeClass(r.status)}>
                    <span class="status__dot"></span>
                    {reservationStatusLabel[r.status]}
                  </span>
                </div>

                <div class="res-card__meta">
                  <span><strong>{formatEuros(r.deposit_amount)}</strong> deposit</span>
                  <span><strong>{formatEuros(r.balance_amount)}</strong> balance</span>
                  {#if r.listing}<span>{formatEuros(r.listing.price)} listing</span>{/if}
                </div>

                {#if r.notes}<p class="res-card__notes">"{r.notes}"</p>{/if}

                <div class="res-card__actions">
                  {#if r.status === 'pending_deposit' || r.status === 'reserved'}
                    <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => setResStatus(r.id, 'confirmed')}>
                      Confirm reservation
                    </button>
                  {/if}
                  {#if r.status === 'confirmed'}
                    <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => setResStatus(r.id, 'shipped')}>
                      Mark as shipped
                    </button>
                  {/if}
                  {#if r.status === 'shipped'}
                    <button class="evx-btn evx-btn--primary evx-btn--sm" on:click={() => setResStatus(r.id, 'completed')}>
                      Mark as completed
                    </button>
                  {/if}
                  <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/messages')}>
                    Message buyer
                  </button>
                  {#if r.status !== 'completed' && r.status !== 'cancelled'}
                    <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => setResStatus(r.id, 'cancelled')}>
                      Cancel
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

    <!-- ════ PROFILE ════ -->
    {:else}
      <section class="dash-section">
        <div class="section-head">
          <div>
            <span class="evx-label">SHOP PROFILE</span>
            <h2 class="section-head__h">Public information.</h2>
          </div>
        </div>

        <form class="profile-form" on:submit={saveProfile}>
          <!-- Logo -->
          <div class="profile-logo">
            <div class="profile-logo__preview">
              {#if seller?.logo_url}
                <img src={seller.logo_url} alt="Logo preview" />
              {:else}
                <span class="profile-logo__initial">{(editTradingName || 'S').charAt(0)}</span>
              {/if}
            </div>
            <div class="profile-logo__upload">
              <span class="evx-caption profile-logo__label">LOGO</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                on:change={onLogoPick}
              />
              <span class="evx-caption profile-logo__hint">Square works best. Under 2 MB.</span>
              {#if logoFile}<span class="evx-caption profile-logo__sel">Selected: {logoFile.name}</span>{/if}
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="evx-caption field-label" for="pf-name">TRADING NAME</label>
              <input id="pf-name" type="text" class="field-input" bind:value={editTradingName} required />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="pf-handle">HANDLE</label>
              <input id="pf-handle" type="text" class="field-input" placeholder="@yourshop" bind:value={editHandle} />
            </div>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="pf-bio">BIO</label>
            <textarea id="pf-bio" class="field-input field-textarea" rows="4" bind:value={editBio}></textarea>
          </div>

          <div class="form-row">
            <div class="field">
              <label class="evx-caption field-label" for="pf-email">EMAIL</label>
              <input id="pf-email" type="email" class="field-input" bind:value={editEmail} />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="pf-phone">PHONE</label>
              <input id="pf-phone" type="tel" class="field-input" bind:value={editPhone} />
            </div>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="pf-city">CITY / AREA</label>
            <input id="pf-city" type="text" class="field-input" bind:value={editCity} />
          </div>

          {#if profileMsg}
            <div class="form-ok"><span class="evx-label">SAVED</span> <p>{profileMsg}</p></div>
          {/if}
          {#if profileErr}
            <div class="form-err"><span class="evx-label">ERROR</span> <p>{profileErr}</p></div>
          {/if}

          <div class="profile-actions">
            <button type="submit" class="evx-btn evx-btn--primary" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save changes →'}
            </button>
          </div>
        </form>
      </section>
    {/if}

  </div>
</main>

<Footer />

<style>
  .dash-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Header */
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-md);
  }
  .dash-header__left { display: flex; gap: var(--evx-space-lg); align-items: center; min-width: 0; }
  .dash-header__logo {
    width: 64px; height: 64px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--evx-graphite);
  }
  .dash-header__logo--placeholder {
    color: var(--evx-paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 28px;
  }
  .dash-header__id { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .dash-header__name {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    line-height: 1;
  }
  .dash-header__meta { display: flex; align-items: center; gap: var(--evx-space-md); flex-wrap: wrap; }
  .dash-header__meta span { color: var(--evx-ink-soft); }
  .dash-header__meta strong { color: var(--evx-warm-black); font-weight: 500; }
  .dash-header__cta { display: flex; gap: var(--evx-space-sm); flex-shrink: 0; }

  /* Tabs */
  .dash-tabs {
    display: flex;
    gap: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-xl);
    overflow-x: auto;
  }
  .dash-tab {
    background: none;
    border: none;
    padding: var(--evx-space-sm) 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    cursor: pointer;
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-ink-soft);
    transition: var(--evx-transition);
    white-space: nowrap;
    display: inline-flex; align-items: center; gap: var(--evx-space-xs);
  }
  .dash-tab__count {
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
    border: 1px solid var(--evx-rule-light);
    padding: 1px 6px;
  }
  .dash-tab--active { color: var(--evx-warm-black); border-bottom-color: var(--evx-fox-orange); }
  .dash-tab--active .dash-tab__count { color: var(--evx-fox-orange); border-color: var(--evx-fox-orange); }
  .dash-tab:hover { opacity: 0.75; }

  /* State panels */
  .dash-state {
    padding: var(--evx-space-2xl);
    border: 1px solid var(--evx-rule-light);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
  }
  .dash-state span:first-child { color: var(--evx-ink-soft); }
  .dash-state--err span:first-child { color: var(--evx-fox-orange); }
  .dash-state--pending span:first-child { color: var(--evx-fox-orange); }
  .dash-state__h {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .dash-state p { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }
  .dash-state__actions { display: flex; gap: var(--evx-space-sm); }

  /* Sections */
  .dash-section { display: flex; flex-direction: column; gap: var(--evx-space-2xl); }

  /* Stats */
  .dash-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-md);
  }
  .stat {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
    display: flex; flex-direction: column;
    gap: var(--evx-space-xs);
  }
  .stat--accent { background: rgba(232, 116, 44, 0.04); border-color: var(--evx-fox-orange); }
  .stat__label { color: var(--evx-ink-soft); }
  .stat--accent .stat__label { color: var(--evx-fox-orange); }
  .stat__val {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    line-height: 1.1;
  }
  .stat__sub { color: var(--evx-ink-soft); }

  /* Action cards */
  .dash-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
  }
  .action-card {
    background: none;
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
    cursor: pointer;
    text-align: left;
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-rows: auto auto auto;
    gap: 4px var(--evx-space-md);
    transition: var(--evx-transition);
  }
  .action-card:hover { border-color: var(--evx-warm-black); }
  .action-card__label { color: var(--evx-fox-orange); }
  .action-card__title {
    font-family: var(--evx-font-display);
    font-size: 15px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .action-card__desc { color: var(--evx-ink-soft); line-height: 1.6; grid-column: 1; }
  .action-card__arrow { grid-row: 1 / span 3; align-self: center; color: var(--evx-ink-soft); font-size: 18px; }

  /* Section head */
  .section-head { display: flex; justify-content: space-between; align-items: flex-end; }
  .section-head span:first-child { color: var(--evx-ink-soft); }
  .section-head__h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-top: var(--evx-space-xs);
  }

  /* Empty */
  .empty {
    padding: var(--evx-space-2xl);
    border: 1px dashed var(--evx-rule-light);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
  }
  .empty span:first-child { color: var(--evx-fox-orange); }
  .empty__h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
  }
  .empty p { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); }

  /* Listings table */
  .lst-table {
    border: 1px solid var(--evx-rule-light);
  }
  .lst-head, .lst-row {
    display: grid;
    grid-template-columns: 2fr 140px 70px 100px 100px 200px;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    align-items: center;
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .lst-head {
    color: var(--evx-ink-soft);
    background: rgba(0,0,0,0.02);
  }
  .lst-row:last-child { border-bottom: none; }
  .lst-right { text-align: right; }
  .lst-item { display: flex; gap: var(--evx-space-sm); align-items: center; min-width: 0; }
  .lst-thumb {
    width: 44px; height: 52px;
    background: var(--evx-graphite);
    object-fit: cover;
    flex-shrink: 0;
  }
  .lst-thumb--empty { background: var(--evx-graphite); }
  .lst-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .lst-info strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }
  .lst-info span { color: var(--evx-ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lst-price { font-family: var(--evx-font-display); font-weight: 500; }
  .lst-actions { display: flex; gap: 4px; justify-content: flex-end; flex-wrap: wrap; }
  .lst-act {
    background: none;
    border: 1px solid var(--evx-rule-light);
    padding: 3px 8px;
    cursor: pointer;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: var(--evx-warm-black);
    transition: var(--evx-transition);
  }
  .lst-act:hover { border-color: var(--evx-warm-black); }
  .lst-act--danger { color: var(--evx-fox-orange); }

  /* Status pills */
  .status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border: 1px solid currentColor;
    white-space: nowrap;
  }
  .status__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .status--draft, .status--removed, .status--cancelled, .status--sold { color: var(--evx-ink-soft); }
  .status--pending_review, .status--reserved, .status--pending_deposit { color: var(--evx-fox-orange); }
  .status--active, .status--confirmed, .status--completed { color: #4a8c5b; }
  .status--shipped { color: #3678b3; }

  /* Reservations */
  .res-list { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .res-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
    display: flex; flex-direction: column;
    gap: var(--evx-space-sm);
  }
  .res-card__top { display: flex; justify-content: space-between; gap: var(--evx-space-md); align-items: flex-start; }
  .res-card__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .res-card__title { font-family: var(--evx-font-display); font-size: 16px; font-weight: 500; }
  .res-card__info span { color: var(--evx-ink-soft); }
  .res-card__meta {
    display: flex;
    gap: var(--evx-space-md);
    flex-wrap: wrap;
    padding-top: var(--evx-space-sm);
    border-top: 1px solid var(--evx-rule-light);
    font-size: 13px;
    color: var(--evx-ink-soft);
  }
  .res-card__meta strong { color: var(--evx-warm-black); font-weight: 500; }
  .res-card__notes {
    padding: var(--evx-space-sm);
    background: rgba(0,0,0,0.02);
    border-left: 2px solid var(--evx-rule-light);
    font-style: italic;
    font-size: 13px;
    color: var(--evx-ink-soft);
  }
  .res-card__actions { display: flex; gap: var(--evx-space-sm); flex-wrap: wrap; }

  /* Profile form */
  .profile-form { display: flex; flex-direction: column; gap: var(--evx-space-xl); max-width: 640px; }
  .profile-logo {
    display: flex;
    gap: var(--evx-space-lg);
    align-items: center;
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .profile-logo__preview {
    width: 96px; height: 96px;
    background: var(--evx-graphite);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .profile-logo__preview img { width: 100%; height: 100%; object-fit: cover; }
  .profile-logo__initial {
    font-family: var(--evx-font-display);
    color: var(--evx-paper);
    font-weight: 500;
    font-size: 40px;
  }
  .profile-logo__upload { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .profile-logo__label { color: var(--evx-ink-soft); }
  .profile-logo__hint, .profile-logo__sel { color: var(--evx-ink-soft); }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--evx-space-xl); }
  .field { display: flex; flex-direction: column; gap: var(--evx-space-xs); }
  .field-label { color: var(--evx-ink-soft); }
  .field-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 15px;
    color: var(--evx-warm-black);
    outline: none;
  }
  .field-input:focus { border-bottom-color: var(--evx-warm-black); }
  .field-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

  .form-ok, .form-err {
    padding: var(--evx-space-md);
    border-left: 2px solid;
    display: flex; flex-direction: column;
    gap: var(--evx-space-xs);
  }
  .form-ok { background: rgba(74,140,91,0.06); border-left-color: #4a8c5b; }
  .form-ok span:first-child { color: #4a8c5b; }
  .form-err { background: rgba(232,116,44,0.06); border-left-color: var(--evx-fox-orange); }
  .form-err span:first-child { color: var(--evx-fox-orange); }
  .form-ok p, .form-err p { font-size: 14px; line-height: 1.55; color: var(--evx-warm-black); }

  .profile-actions { display: flex; gap: var(--evx-space-md); padding-top: var(--evx-space-md); border-top: 1px solid var(--evx-rule-light); }

  .evx-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: 1199px) {
    .dash-stats, .dash-actions { grid-template-columns: 1fr 1fr; }
    .lst-head, .lst-row { grid-template-columns: 2fr 120px 100px 180px; gap: var(--evx-space-sm); }
    .lst-head span:nth-child(3),  /* views */
    .lst-head span:nth-child(5),  /* posted */
    .lst-row > *:nth-child(3),
    .lst-row > *:nth-child(5) { display: none; }
  }
  @media (max-width: 767px) {
    .dash-header { flex-direction: column; align-items: flex-start; }
    .dash-stats, .dash-actions { grid-template-columns: 1fr; }
    .lst-head, .lst-row { grid-template-columns: 1fr 110px; }
    .lst-head span:nth-child(2), .lst-row > *:nth-child(2),
    .lst-head span:nth-child(4), .lst-row > *:nth-child(4) { display: none; }
    .form-row { grid-template-columns: 1fr; }
  }
</style>
