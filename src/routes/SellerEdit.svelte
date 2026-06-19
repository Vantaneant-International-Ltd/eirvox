<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { auth } from '../lib/auth';
  import { getMySeller, type Seller } from '../lib/sellers';
  import {
    getCategories,
    getListingFull,
    updateListing,
    uploadListingImage,
    deleteListingImage,
    reorderImages,
    setListingSpecs,
    setListingStatus,
    deleteListing,
    listingStatusLabel,
    specTemplates,
    type Category,
    type ListingWithExtras,
    type ListingStatus,
    type ListingImage,
    type DriveIssueState,
  } from '../lib/listings';

  export let listingId: string;

  // ── State ────────────────────────────────────────────────
  let seller: Seller | null = null;
  let categories: Category[] = [];
  let listing: ListingWithExtras | null = null;
  let booting = true;
  let bootError = '';

  // Form values
  let categoryId = '';
  let categorySlug = '';
  let title = '';
  let subtitle = '';
  let description = '';
  let condition = '';
  let price: number | string = '';
  let originalPrice: number | string = '';
  let acceptsOffers = true;
  let shipsNationwide = true;
  let collectionAvailable = true;
  let shippingCost: number | string = '';
  type Spec = { label: string; value: string };
  let specs: Spec[] = [];
  let existingImages: ListingImage[] = [];

  // DRIVE editorial fields. Admin-only block in the form; hydrated
  // on load, persisted per-field on blur/change via updateListing().
  let isDrive = false;
  let driveIssue = '';
  let driveIssueState: DriveIssueState | '' = '';
  let driveMadeCount: number | string = '';
  let driveRemainingCount: number | string = '';
  let driveIssueDate = '';

  // Same shape as SellerCreate: value=DB enum, label=UI text.
  const conditionOptions: Array<{ value: string; label: string }> = [
    { value: 'new',        label: 'OEM+ New' },
    { value: 'like_new',   label: 'Like New' },
    { value: 'excellent',  label: 'Used - Excellent' },
    { value: 'good',       label: 'Used - Good' },
    { value: 'refinished', label: 'Refinished' },
  ];

  let saving = false;
  let saveMsg = '';
  let saveErr = '';

  // Image upload state
  let uploading = false;
  let uploadCount = 0;

  onMount(async () => {
    applySeo({
      title: 'Edit listing',
      description: 'Edit your ÉIRVOX listing.',
      path: `/sell/edit/${listingId}`,
    });

    const waitForInit = () => new Promise<void>(resolve => {
      if (get(auth).initialised) { resolve(); return; }
      let unsub: (() => void) | null = null;
      unsub = auth.subscribe(s => { if (s.initialised) { unsub?.(); resolve(); } });
    });
    await waitForInit();

    if (!$auth.user) {
      try { sessionStorage.setItem('eirvox-return-to', `/sell/edit/${listingId}`); } catch {}
      navigate('/login');
      return;
    }

    seller = await getMySeller();
    if (!seller) {
      bootError = 'No seller account found.';
      booting = false;
      return;
    }

    categories = await getCategories();
    listing = await getListingFull(listingId);

    if (!listing) {
      bootError = 'Listing not found or you don\'t have permission to edit it.';
      booting = false;
      return;
    }

    if (listing.seller_id !== seller.id) {
      bootError = 'This listing belongs to another seller.';
      booting = false;
      return;
    }

    // Hydrate form fields
    categoryId    = listing.category_id ?? '';
    categorySlug  = listing.category_slug ?? '';
    title         = listing.title;
    subtitle      = listing.subtitle ?? '';
    description   = listing.description ?? '';
    condition     = listing.condition ?? '';
    price         = listing.price;
    originalPrice = listing.original_price ?? '';
    acceptsOffers       = listing.accepts_offers;
    shipsNationwide     = listing.shipping_available;
    collectionAvailable = listing.collection_available;
    shippingCost  = listing.shipping_cost ?? '';
    specs         = listing.specs.length > 0
      ? listing.specs.map(s => ({ label: s.label, value: s.value }))
      : (categorySlug && specTemplates[categorySlug]
          ? specTemplates[categorySlug].map(label => ({ label, value: '' }))
          : []);
    existingImages = [...listing.images];

    isDrive             = listing.is_drive === true;
    driveIssue          = listing.drive_issue ?? '';
    driveIssueState     = (listing.drive_issue_state as DriveIssueState | null) ?? '';
    driveMadeCount      = listing.drive_made_count ?? '';
    driveRemainingCount = listing.drive_remaining_count ?? '';
    driveIssueDate      = listing.drive_issue_date ?? '';

    booting = false;
  });

  // Per-field DRIVE patch. Used on:blur / on:change so each edit
  // saves immediately (matches the admin Listings detail panel
  // pattern). Errors surface via saveErr.
  async function saveDrivePatch(patch: Record<string, unknown>) {
    if (!listing) return;
    const r = await updateListing(listing.id, patch);
    if (!r.ok) {
      saveErr = r.error ?? 'Could not save DRIVE field.';
      scrollToBanner();
    }
  }

  // ── Save details ────────────────────────────────────────

  function scrollToBanner() {
    // Run after the DOM updates so the banner element exists.
    queueMicrotask(() => {
      document.querySelector('.form-ok, .form-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /** intent === 'submit' means "make this listing public". For admin
   *  that's status='active' immediately; for sellers (later phase)
   *  it's status='pending_review'. intent === undefined just saves the
   *  current draft state without flipping status. */
  async function save(intent?: 'submit' | ListingStatus) {
    if (!listing || saving) return;
    saving = true; saveMsg = ''; saveErr = '';

    const isAdmin = $auth.profile?.role === 'admin';
    let nextStatus: ListingStatus | undefined;
    if (intent === 'submit') {
      nextStatus = isAdmin ? 'active' : 'pending_review';
    } else if (intent) {
      // Caller passed an explicit status (e.g. 'sold' from markSold).
      nextStatus = intent as ListingStatus;
    }

    const patch = {
      category_id: categoryId || null,
      category_slug: categorySlug || null,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim() || null,
      condition: condition || null,
      price: Number(price) || 0,
      original_price: originalPrice !== '' ? Number(originalPrice) : null,
      accepts_offers: acceptsOffers,
      shipping_available: shipsNationwide,
      collection_available: collectionAvailable,
      shipping_cost: shippingCost !== '' ? Number(shippingCost) : null,
      ...(nextStatus ? { status: nextStatus } : {}),
    };

    const upd = await updateListing(listing.id, patch);
    if (!upd.ok) { saving = false; saveErr = upd.error ?? 'Could not save.'; scrollToBanner(); return; }

    const specRes = await setListingSpecs(listing.id, specs);
    if (!specRes.ok) console.warn('[edit] specs', specRes.error);

    if (existingImages.length > 0) {
      await reorderImages(existingImages.map(i => i.id));
    }

    saving = false;
    if (nextStatus === 'active') saveMsg = 'Published.';
    else if (nextStatus === 'pending_review') saveMsg = 'Submitted for review.';
    else if (nextStatus === 'sold') saveMsg = 'Marked as sold.';
    else saveMsg = 'Changes saved.';
    scrollToBanner();

    listing = await getListingFull(listing.id);
    if (listing) existingImages = [...listing.images];
  }

  // ── Image actions ───────────────────────────────────────
  async function onUploadFiles(e: Event) {
    if (!listing || !seller) return;
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    uploading = true;
    uploadCount = 0;
    saveErr = '';
    const startOrder = existingImages.length;

    try {
      for (let i = 0; i < input.files.length; i++) {
        if (existingImages.length >= 12) break;
        uploadCount = i + 1;
        const f = input.files[i];
        const r = await uploadListingImage(seller.id, listing.id, f, startOrder + i);
        if (r.ok && r.data) {
          existingImages = [...existingImages, r.data];
        } else {
          saveErr = r.error ?? 'Upload failed.';
          scrollToBanner();
          break;
        }
      }
    } catch (err) {
      console.error('[SellerEdit.onUploadFiles] unhandled:', err);
      saveErr = err instanceof Error ? err.message : 'Upload failed unexpectedly.';
      scrollToBanner();
    } finally {
      input.value = '';
      uploading = false;
    }
  }

  async function removeImage(img: ListingImage) {
    if (!confirm('Remove this photo?')) return;
    const r = await deleteListingImage(img);
    if (r.ok) existingImages = existingImages.filter(x => x.id !== img.id);
  }

  function moveImage(idx: number, dir: -1 | 1) {
    const next = idx + dir;
    if (next < 0 || next >= existingImages.length) return;
    const copy = [...existingImages];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    existingImages = copy;
  }

  // Pin an image as the cover (sort_order = 0). Persists immediately
  // (unlike moveImage / ←→ which only commit on Save). One click,
  // definitive action -- the buyer page reads the first image by
  // sort_order, so this is what changes the hero on the listing.
  async function setAsCover(idx: number) {
    if (idx <= 0 || idx >= existingImages.length) return;
    saveErr = '';
    const picked = existingImages[idx];
    const rest   = existingImages.filter((_, i) => i !== idx);
    const reordered = [picked, ...rest];
    existingImages = reordered;
    const r = await reorderImages(reordered.map(i => i.id));
    if (!r.ok) {
      saveErr = r.error ?? 'Could not pin cover.';
      scrollToBanner();
    }
  }

  async function markSold() {
    if (!confirm('Mark this listing as sold?')) return;
    await save('sold');
  }
  async function archive() {
    if (!confirm('Remove this listing? It will be hidden from the marketplace.')) return;
    if (!listing) return;
    const r = await deleteListing(listing.id);
    if (r.ok) navigate('/sell/dashboard');
  }

  function pickCategory(c: Category) {
    categoryId = c.id;
    categorySlug = c.slug;
  }

  function addSpec()   { specs = [...specs, { label: '', value: '' }]; }
  function removeSpec(i: number) { specs = specs.filter((_, idx) => idx !== i); }

  function formatEuros(n: number | string | null): string {
    const v = Number(n);
    return v > 0 ? '€' + v.toLocaleString('en-IE') : '€0';
  }
</script>

<Nav />

<main id="main-content" class="edit-page">
  <div class="page-container">

    <header class="edit-header">
      <button class="edit-back evx-caption" on:click={() => navigate('/sell/dashboard')}>
        ← Back to dashboard
      </button>
      <span class="evx-caption edit-meta">SELLER · EDIT LISTING</span>
      <h1 class="edit-title">
        {listing ? listing.title : 'Edit listing'}
      </h1>
      {#if listing}
        <span class="status status--{listing.status}">
          <span class="status__dot"></span>
          {listingStatusLabel[listing.status]}
        </span>
      {/if}
    </header>

    {#if booting}
      <div class="state"><span class="evx-label">LOADING…</span></div>

    {:else if bootError}
      <div class="state state--err">
        <span class="evx-label">ERROR</span>
        <p>{bootError}</p>
        <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/sell/dashboard')}>
          ← Dashboard
        </button>
      </div>

    {:else if listing}

      <!-- Save messages -->
      {#if saveMsg}<div class="form-ok"><span class="evx-label">OK</span><p>{saveMsg}</p></div>{/if}
      {#if saveErr}<div class="form-err" role="alert" aria-live="assertive"><span class="evx-label">ERROR</span><p>{saveErr}</p></div>{/if}

      <!-- Category -->
      <section class="edit-section">
        <h2 class="edit-h">Category.</h2>
        <div class="cat-grid">
          {#each categories as c}
            <button
              type="button"
              class="cat-tile"
              class:cat-tile--selected={categoryId === c.id}
              on:click={() => pickCategory(c)}
            >
              <span class="cat-tile__bg"></span>
              <span class="cat-tile__name">{c.name}</span>
            </button>
          {/each}
        </div>
      </section>

      <!-- Details -->
      <section class="edit-section">
        <h2 class="edit-h">Details.</h2>
        <div class="form-grid">
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="e-title">TITLE</label>
              <input id="e-title" type="text" class="field-input" bind:value={title} required />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="e-cond">CONDITION</label>
              <select id="e-cond" class="field-input" bind:value={condition}>
                <option value="">-</option>
                {#each conditionOptions as opt}<option value={opt.value}>{opt.label}</option>{/each}
              </select>
            </div>
          </div>
          <div class="field">
            <label class="evx-caption field-label" for="e-sub">SUBTITLE</label>
            <input id="e-sub" type="text" class="field-input" bind:value={subtitle} />
          </div>
          <div class="field">
            <label class="evx-caption field-label" for="e-desc">DESCRIPTION</label>
            <textarea id="e-desc" class="field-input field-textarea" rows="8" bind:value={description}></textarea>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section class="edit-section">
        <h2 class="edit-h">Pricing &amp; delivery.</h2>
        <div class="form-grid">
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="e-price">ASKING PRICE</label>
              <div class="field-prefix"><span class="field-prefix__sym">€</span><input id="e-price" type="number" class="field-input" bind:value={price} /></div>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="e-orig">ORIGINAL RETAIL</label>
              <div class="field-prefix"><span class="field-prefix__sym">€</span><input id="e-orig" type="number" class="field-input" bind:value={originalPrice} /></div>
            </div>
          </div>
          <div class="toggle-list">
            <label class="toggle"><input type="checkbox" bind:checked={acceptsOffers} /><span><strong>Accept offers</strong></span></label>
            <label class="toggle"><input type="checkbox" bind:checked={collectionAvailable} /><span><strong>Collection available</strong></span></label>
            <label class="toggle"><input type="checkbox" bind:checked={shipsNationwide} /><span><strong>Ship nationwide</strong></span></label>
          </div>
          {#if shipsNationwide}
            <div class="field">
              <label class="evx-caption field-label" for="e-ship">SHIPPING COST (€)</label>
              <div class="field-prefix"><span class="field-prefix__sym">€</span><input id="e-ship" type="number" class="field-input" bind:value={shippingCost} /></div>
            </div>
          {/if}
        </div>
      </section>

      <!-- Specs -->
      <section class="edit-section">
        <h2 class="edit-h">Specifications.</h2>
        <div class="spec-list">
          {#each specs as spec, i (i)}
            <div class="spec-row">
              <input type="text" class="spec-row__label" placeholder="Label" bind:value={spec.label} />
              <input type="text" class="spec-row__value" placeholder="Value" bind:value={spec.value} />
              <button type="button" class="spec-row__rm" on:click={() => removeSpec(i)} aria-label="Remove">×</button>
            </div>
          {/each}
          <button type="button" class="spec-add" on:click={addSpec}>+ Add specification</button>
        </div>
      </section>

      <!-- DRIVE editorial fields (admin only). Centralises issue
           metadata here so admins don't have to context-switch
           between /sell/edit and /admin/listings. is_drive toggle
           lets admin convert a regular listing into a DRIVE issue. -->
      {#if $auth.profile?.role === 'admin'}
        <section class="edit-section">
          <h2 class="edit-h">DRIVE. <span class="evx-caption">admin only</span></h2>
          <div class="field-row" style="margin-bottom: 12px;">
            <label class="evx-checkbox">
              <input type="checkbox" bind:checked={isDrive}
                     on:change={() => saveDrivePatch({ is_drive: isDrive })} />
              <span>This listing is a DRIVE issue</span>
            </label>
          </div>

          {#if isDrive}
            <div class="field-row" style="grid-template-columns: 1fr 1fr 1fr; gap: var(--evx-space-md);">
              <div class="field">
                <label class="field-label" for="d-issue">Issue number</label>
                <input id="d-issue" type="text" class="field-input" placeholder="003"
                       bind:value={driveIssue}
                       on:blur={() => saveDrivePatch({ drive_issue: driveIssue || null })} />
              </div>
              <div class="field">
                <label class="field-label" for="d-state">Issue state</label>
                <select id="d-state" class="field-input"
                        bind:value={driveIssueState}
                        on:change={() => saveDrivePatch({ drive_issue_state: driveIssueState || null })}>
                  <option value="">-</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="open">Open</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label" for="d-date">Issue date (display)</label>
                <input id="d-date" type="text" class="field-input" placeholder="June 2026"
                       bind:value={driveIssueDate}
                       on:blur={() => saveDrivePatch({ drive_issue_date: driveIssueDate || null })} />
              </div>
            </div>

            <div class="field-row" style="grid-template-columns: 1fr 1fr; gap: var(--evx-space-md); margin-top: 12px;">
              <div class="field">
                <label class="field-label" for="d-made">Made count</label>
                <input id="d-made" type="number" min="0" class="field-input"
                       bind:value={driveMadeCount}
                       on:blur={() => saveDrivePatch({ drive_made_count: driveMadeCount === '' ? null : Number(driveMadeCount) })} />
              </div>
              <div class="field">
                <label class="field-label" for="d-remain">Remaining count</label>
                <input id="d-remain" type="number" min="0" class="field-input"
                       bind:value={driveRemainingCount}
                       on:blur={() => saveDrivePatch({ drive_remaining_count: driveRemainingCount === '' ? null : Number(driveRemainingCount) })} />
              </div>
            </div>
          {/if}
        </section>
      {/if}

      <!-- Photos -->
      <section class="edit-section">
        <h2 class="edit-h">Photos. <span class="evx-caption">{existingImages.length} / 12</span></h2>

        {#if existingImages.length > 0}
          <div class="photo-grid">
            {#each existingImages as img, i (img.id)}
              <div class="photo-tile" class:photo-tile--cover={i === 0}>
                {#if i === 0}<span class="evx-caption photo-tile__cover">COVER</span>{/if}
                {#if img.public_url}<img src={img.public_url} alt="" />{:else}<span class="photo-tile__missing">missing</span>{/if}
                <div class="photo-tile__bar">
                  {#if i !== 0}
                    <button on:click={() => setAsCover(i)} title="Set as cover" aria-label="Set as cover">★</button>
                  {/if}
                  <button on:click={() => moveImage(i, -1)} disabled={i === 0}>←</button>
                  <button on:click={() => moveImage(i, 1)} disabled={i === existingImages.length - 1}>→</button>
                  <button on:click={() => removeImage(img)}>×</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        {#if existingImages.length < 12}
          <label class="add-photos">
            <input type="file" multiple accept="image/*,.heic,.heif" on:change={onUploadFiles} hidden />
            <span class="add-photos__plus">+</span>
            <span><strong>Upload photos</strong> · JPG / PNG / WEBP · up to 6 MB each</span>
            {#if uploading}<span class="evx-caption">Uploading {uploadCount}…</span>{/if}
          </label>
        {/if}
      </section>

      <!-- Actions -->
      <section class="edit-actions">
        <div class="edit-actions__left">
          {#if listing.status === 'active'}
            <button class="evx-btn evx-btn--ghost" on:click={markSold} disabled={saving}>
              Mark as sold
            </button>
          {/if}
          <button class="evx-btn evx-btn--ghost" on:click={archive} disabled={saving}>
            Remove listing
          </button>
        </div>
        <div class="edit-actions__right">
          {#if listing.status === 'draft' || listing.status === 'pending_review'}
            <button class="evx-btn evx-btn--ghost" on:click={() => save('draft')} disabled={saving}>
              Save as draft
            </button>
            <button class="evx-btn evx-btn--primary" on:click={() => save('submit')} disabled={saving}>
              {saving
                ? ($auth.profile?.role === 'admin' ? 'Publishing…' : 'Saving…')
                : ($auth.profile?.role === 'admin' ? 'Publish →' : 'Submit for review →')}
            </button>
          {:else}
            <button class="evx-btn evx-btn--primary" on:click={() => save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes →'}
            </button>
          {/if}
        </div>
      </section>

    {/if}

  </div>
</main>

<Footer />

<style>
  .edit-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .edit-header { padding-top: var(--evx-space-2xl); margin-bottom: var(--evx-space-xl); display: flex; flex-direction: column; align-items: flex-start; gap: var(--evx-space-md); }
  .edit-back { background: none; border: none; padding: 0; color: var(--evx-ink-soft); cursor: pointer; transition: var(--evx-transition); }
  .edit-back:hover { color: var(--evx-warm-black); }
  .edit-meta { color: var(--evx-fox-orange); }
  .edit-title { font-family: var(--evx-font-display); font-size: clamp(28px, 4vw, 44px); font-weight: 500; letter-spacing: -0.025em; color: var(--evx-warm-black); }

  .state { padding: var(--evx-space-2xl); border: 1px solid var(--evx-rule-light); display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .state span:first-child { color: var(--evx-ink-soft); }
  .state--err span:first-child { color: var(--evx-fox-orange); }

  .edit-section {
    padding-bottom: var(--evx-space-2xl);
    margin-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    display: flex; flex-direction: column;
    gap: var(--evx-space-lg);
  }
  .edit-h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    display: flex; gap: var(--evx-space-sm); align-items: baseline;
  }
  .edit-h span { color: var(--evx-ink-soft); }

  /* Categories (reuse styling) */
  .cat-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: var(--evx-space-sm); }
  .cat-tile { display: flex; flex-direction: column; background: transparent; border: 1px solid var(--evx-rule-light); cursor: pointer; padding: 0; transition: var(--evx-transition); }
  .cat-tile--selected { border-color: var(--evx-fox-orange); border-width: 2px; }
  .cat-tile__bg { width: 100%; aspect-ratio: 1; background: var(--evx-graphite); display: block; }
  .cat-tile__name { font-family: var(--evx-font-display); font-size: 13px; font-weight: 500; padding: var(--evx-space-sm); color: var(--evx-warm-black); }

  /* Form */
  .form-grid { display: flex; flex-direction: column; gap: var(--evx-space-lg); }
  .form-row { display: grid; gap: var(--evx-space-xl); }
  .form-row--2 { grid-template-columns: 1fr 1fr; }
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
    transition: border-color 200ms ease;
  }
  .field-input:focus { border-bottom-color: var(--evx-warm-black); }
  .field-textarea { resize: vertical; min-height: 140px; line-height: 1.6; }
  .field-prefix { display: flex; align-items: baseline; gap: 4px; border-bottom: 1px solid var(--evx-rule-light); }
  .field-prefix .field-input { border-bottom: none; padding-left: 4px; }
  .field-prefix__sym { color: var(--evx-ink-soft); }

  .toggle-list { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .toggle { display: flex; gap: var(--evx-space-md); padding: var(--evx-space-sm) var(--evx-space-md); border: 1px solid var(--evx-rule-light); align-items: center; cursor: pointer; }
  .toggle input { accent-color: var(--evx-fox-orange); }
  .toggle strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }

  /* Specs */
  .spec-list { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .spec-row { display: grid; grid-template-columns: 200px 1fr 40px; gap: var(--evx-space-md); align-items: center; }
  .spec-row__label, .spec-row__value {
    background: transparent; border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    outline: none;
  }
  .spec-row__rm { background: none; border: none; cursor: pointer; color: var(--evx-ink-soft); font-size: 20px; padding: 0; }
  .spec-row__rm:hover { color: var(--evx-fox-orange); }
  .spec-add { background: none; border: 1px dashed var(--evx-rule-light); padding: var(--evx-space-sm); cursor: pointer; font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--evx-warm-black); margin-top: var(--evx-space-xs); }
  .spec-add:hover { border-color: var(--evx-warm-black); }

  /* Photos */
  .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-sm); }
  .photo-tile {
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    position: relative;
    overflow: hidden;
  }
  .photo-tile--cover { outline: 2px solid var(--evx-fox-orange); outline-offset: -2px; }
  .photo-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .photo-tile__cover { position: absolute; top: 8px; left: 8px; background: var(--evx-fox-orange); color: var(--evx-white); padding: 2px 6px; z-index: 2; }
  .photo-tile__missing { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); color: rgba(245,242,237,0.4); font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; }
  .photo-tile__bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    display: flex; justify-content: space-between;
    padding: 6px;
    background: rgba(26,26,26,0.55);
  }
  .photo-tile__bar button { background: none; border: none; color: var(--evx-paper); cursor: pointer; font-size: 14px; padding: 4px 6px; }
  .photo-tile__bar button:disabled { opacity: 0.30; cursor: not-allowed; }

  .add-photos {
    display: flex; align-items: center; gap: var(--evx-space-md);
    padding: var(--evx-space-md) var(--evx-space-lg);
    border: 1px dashed var(--evx-rule-light);
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .add-photos:hover { border-color: var(--evx-warm-black); }
  .add-photos__plus { font-size: 24px; color: var(--evx-ink-soft); }
  .add-photos strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .add-photos span:last-child { color: var(--evx-ink-soft); }

  /* Status pills */
  .status {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    padding: 3px 8px;
    border: 1px solid currentColor;
  }
  .status__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .status--draft, .status--removed, .status--sold { color: var(--evx-ink-soft); }
  .status--pending_review, .status--reserved { color: var(--evx-fox-orange); }
  .status--active { color: #4a8c5b; }

  /* Save state */
  .form-ok, .form-err {
    padding: var(--evx-space-md);
    border-left: 2px solid;
    display: flex; flex-direction: column;
    gap: var(--evx-space-xs);
    margin-bottom: var(--evx-space-lg);
  }
  .form-ok { background: rgba(74,140,91,0.06); border-left-color: #4a8c5b; }
  .form-err { background: rgba(232,116,44,0.06); border-left-color: var(--evx-fox-orange); }
  .form-ok span:first-child { color: #4a8c5b; }
  .form-err span:first-child { color: var(--evx-fox-orange); }
  .form-ok p, .form-err p { font-size: 14px; line-height: 1.55; color: var(--evx-warm-black); }

  /* Actions row */
  .edit-actions {
    display: flex; justify-content: space-between;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
    flex-wrap: wrap;
  }
  .edit-actions__left, .edit-actions__right { display: flex; gap: var(--evx-space-sm); flex-wrap: wrap; }

  .evx-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: 1023px) {
    .cat-grid { grid-template-columns: repeat(4, 1fr); }
    .photo-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 767px) {
    .cat-grid { grid-template-columns: repeat(2, 1fr); }
    .photo-grid { grid-template-columns: repeat(2, 1fr); }
    .form-row--2 { grid-template-columns: 1fr; }
    .spec-row { grid-template-columns: 1fr 40px; }
    .spec-row__label { grid-column: 1 / -1; }
    .edit-actions { flex-direction: column; }
    .edit-actions__right { justify-content: space-between; }
  }
</style>
