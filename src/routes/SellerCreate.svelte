<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { auth } from '../lib/auth';
  import { supabase, withTimeout } from '../lib/supabase';
  import { type Seller } from '../lib/sellers';
  import {
    getCategories,
    createListing,
    updateListing,
    uploadListingImage,
    deleteListingImage,
    reorderImages,
    setListingSpecs,
    specTemplates,
    type Category,
    type ListingImage,
  } from '../lib/listings';

  // ── Init ──────────────────────────────────────────────────
  let seller: Seller | null = null;
  let categories: Category[] = [];
  let categoriesError = '';
  let booting = true;
  type BootStatus = 'ok' | 'no-seller' | 'not-approved' | 'db-error' | 'timeout';
  let bootStatus: BootStatus = 'ok';
  let bootError = '';

  onMount(async () => {
    applySeo(seo.sellCreate());

    // Short-circuit if already initialised. Otherwise subscribe with
    // `let unsub` so the callback doesn't reference an uninitialised
    // const when Svelte fires it synchronously on subscribe().
    const waitForInit = () => new Promise<void>(resolve => {
      if (get(auth).initialised) { resolve(); return; }
      let unsub: (() => void) | null = null;
      unsub = auth.subscribe(s => {
        if (s.initialised) { unsub?.(); resolve(); }
      });
    });
    await waitForInit();

    const a = $auth;
    if (!a.user) {
      try { sessionStorage.setItem('eirvox-return-to', '/sell/create'); } catch {}
      navigate('/login');
      return;
    }

    // Fetch the seller row with a 10-second timeout.
    const sellerR = await withTimeout(
      supabase
        .from('sellers')
        .select('*')
        .eq('profile_id', a.user.id)
        .maybeSingle(),
      10_000,
      'sellers'
    );

    if (!sellerR.ok) {
      bootStatus = sellerR.reason === 'timeout' ? 'timeout' : 'db-error';
      bootError = sellerR.reason === 'timeout'
        ? 'Supabase didn\'t reply in 10 seconds. Run supabase/v04-rls-reset.sql to clear the schema cache.'
        : 'Database error.';
      booting = false;
      return;
    }

    if (sellerR.value.error) {
      const m = (sellerR.value.error.message ?? '').toLowerCase();
      bootStatus = 'db-error';
      bootError = m.includes('infinite recursion')
        ? 'A profiles RLS policy is recursing. Run supabase/v04-rls-reset.sql in Supabase SQL Editor.'
        : (m.includes('does not exist') || m.includes('schema cache'))
          ? 'A required table is missing. Run supabase/v04-marketplace-schema.sql.'
          : sellerR.value.error.message;
      booting = false;
      return;
    }

    seller = (sellerR.value.data as Seller | null) ?? null;

    // v1 model (HANDOFF locked decision): "v1 is admin-curated — admin
    // creates listings and uploads images; seller self-serve comes later."
    // If an admin loads this page without an attached sellers row,
    // auto-create a house seller for them so they can list directly.
    // The sellers_admin_all RLS policy permits the insert.
    if (!seller && a.profile?.role === 'admin') {
      const fullName = (a.profile.full_name ?? a.user.email ?? 'ÉIRVOX House').toString();
      const houseR = await withTimeout(
        supabase
          .from('sellers')
          .insert({
            profile_id: a.user.id,
            trading_name: fullName,
            email: a.user.email ?? null,
            tier: 'house',
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .select('*')
          .single(),
        10_000,
        'house-seller-create'
      );
      if (!houseR.ok || (houseR.ok && houseR.value.error)) {
        bootStatus = 'db-error';
        bootError = houseR.ok
          ? (houseR.value.error?.message ?? 'Could not create the house seller row.')
          : 'Could not create the house seller row in 10s.';
        booting = false;
        return;
      }
      seller = houseR.value.data as Seller;
    }

    if (!seller) {
      bootStatus = 'no-seller';
      booting = false;
      return;
    }
    if (seller.status !== 'approved') {
      bootStatus = 'not-approved';
      booting = false;
      return;
    }

    // Fetch categories (also timeout-protected)
    const catR = await withTimeout(Promise.resolve(getCategories()), 10_000, 'categories');
    categories = catR.ok ? catR.value : [];

    if (categories.length === 0) {
      categoriesError = 'No categories were returned from Supabase. Run supabase/v04-marketplace-schema.sql to seed them.';
    }

    booting = false;
  });

  // ── Form state ────────────────────────────────────────────
  let step = 1;
  const TOTAL_STEPS = 6;

  // Step 1 — Category
  let categoryId = '';
  let categorySlug = '';

  // Step 2 — Details
  let title = '';
  let subtitle = '';
  let description = '';
  let condition = '';
  const conditionOptions = ['OEM+ New', 'Like New', 'Used — Excellent', 'Used — Good', 'Refinished'];

  // Step 3 — Pricing
  let price: number | string = '';
  let originalPrice: number | string = '';
  let acceptsOffers = true;
  let shipsNationwide = true;
  let collectionAvailable = true;
  let shippingCost: number | string = '';

  // Step 4 — Specs
  type Spec = { label: string; value: string };
  let specs: Spec[] = [];
  function autopopSpecs() {
    if (categorySlug && specTemplates[categorySlug]) {
      specs = specTemplates[categorySlug].map(label => ({ label, value: '' }));
    } else if (specs.length === 0) {
      specs = [{ label: '', value: '' }];
    }
  }
  function addSpec() { specs = [...specs, { label: '', value: '' }]; }
  function removeSpec(i: number) { specs = specs.filter((_, idx) => idx !== i); }

  // Step 5 — Images (kept in memory until step 6 final save)
  type PendingImage = { id: string; file: File; previewUrl: string };
  let pending: PendingImage[] = [];
  let uploadedRows: ListingImage[] = []; // populated during final save

  function onPickFiles(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    for (const f of Array.from(input.files)) {
      if (pending.length + uploadedRows.length >= 12) break;
      pending = [...pending, {
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      }];
    }
    input.value = '';
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    if (!e.dataTransfer) return;
    for (const f of Array.from(e.dataTransfer.files)) {
      if (pending.length >= 12) break;
      if (!f.type.startsWith('image/')) continue;
      pending = [...pending, {
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
      }];
    }
  }
  function removePending(id: string) {
    const img = pending.find(p => p.id === id);
    if (img) URL.revokeObjectURL(img.previewUrl);
    pending = pending.filter(p => p.id !== id);
  }
  function movePending(id: string, dir: -1 | 1) {
    const idx = pending.findIndex(p => p.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= pending.length) return;
    const copy = [...pending];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    pending = copy;
  }

  // ── Save flow ─────────────────────────────────────────────
  let saving = false;
  let saveError = '';
  let uploadProgress = { current: 0, total: 0 };

  async function persist(finalStatus: 'draft' | 'pending_review') {
    if (!seller || saving) return;
    saveError = '';
    saving = true;

    // 1. Create listing row
    const create = await createListing({
      seller_id: seller.id,
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
      city: seller.city ?? null,
      status: finalStatus,
    });

    if (!create.ok || !create.data) {
      saving = false;
      saveError = create.error ?? 'Could not save the listing.';
      return;
    }
    const listing = create.data;

    // 2. Specs
    if (specs.length > 0) {
      const r = await setListingSpecs(listing.id, specs);
      if (!r.ok) console.warn('[create] specs error', r.error);
    }

    // 3. Upload images
    uploadProgress = { current: 0, total: pending.length };
    for (let i = 0; i < pending.length; i++) {
      uploadProgress = { current: i + 1, total: pending.length };
      const up = await uploadListingImage(seller.id, listing.id, pending[i].file, i);
      if (!up.ok) {
        saveError = `Image ${i + 1} upload failed: ${up.error}. Listing saved as draft; finish uploads from the edit page.`;
        // Switch to draft if we were submitting for review
        if (finalStatus === 'pending_review') {
          await updateListing(listing.id, { status: 'draft' });
        }
        saving = false;
        navigate(`/sell/edit/${listing.id}`);
        return;
      }
    }

    saving = false;
    // Done — go to dashboard
    navigate('/sell/dashboard');
  }

  // ── Validation ────────────────────────────────────────────
  $: step1Valid = !!categoryId;
  $: step2Valid = title.trim().length >= 3 && description.trim().length >= 30 && condition;
  $: step3Valid = price !== '' && Number(price) > 0;
  $: step4Valid = true;
  $: step5Valid = pending.length >= 1; // require at least 1 image to submit; draft can have 0
  $: canProceed = (
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid) ||
    (step === 5 && (pending.length > 0 || true))
  );

  function next() {
    if (!canProceed) return;
    if (step === 1) autopopSpecs();
    if (step < TOTAL_STEPS) step++;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function prev() {
    if (step > 1) {
      step--;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function pickCategory(c: Category) {
    categoryId = c.id;
    categorySlug = c.slug;
  }

  const stepLabels = ['Category', 'Details', 'Pricing', 'Specs', 'Photos', 'Review'];

  function formatEuros(n: number | string): string {
    const v = Number(n);
    return v > 0 ? '€' + v.toLocaleString('en-IE') : '€0';
  }
</script>

<Nav />

<main id="main-content" class="create-page">
  <div class="page-container">

    <!-- ── Header ── -->
    <header class="create-header">
      <button class="create-back evx-caption" on:click={() => navigate('/sell/dashboard')}>
        ← Back to dashboard
      </button>
      <span class="evx-caption create-meta">SELLER · NEW LISTING</span>
      {#if step < 6}
        <h1 class="create-title">List a new item.</h1>
        <p class="create-sub">
          Six short steps. You can save as draft at any time.
          New listings are reviewed before going live — usually within 24 hours.
        </p>
      {/if}
    </header>

    <!-- ── Boot state ── -->
    {#if booting}
      <div class="cs-state">
        <span class="evx-label">LOADING…</span>
        <p>Fetching your seller record and categories.</p>
      </div>

    {:else if bootStatus === 'timeout' || bootStatus === 'db-error'}
      <div class="cs-state cs-state--err">
        <span class="evx-label">
          {bootStatus === 'timeout' ? 'SUPABASE TIMED OUT' : 'DATABASE ERROR'}
        </span>
        <h2>We couldn't reach your seller record.</h2>
        <p>{bootError}</p>
        <div class="cs-state__actions">
          <a class="evx-btn evx-btn--primary"
             href="https://github.com/Vantaneant-International-Ltd/eirvox/blob/renato/supabase/v04-rls-reset.sql"
             target="_blank" rel="noopener noreferrer"
             style="text-decoration:none;">View the SQL fix →</a>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/dashboard')}>
            Back to dashboard
          </button>
        </div>
      </div>

    {:else if bootStatus === 'no-seller'}
      <div class="cs-state cs-state--err">
        <span class="evx-label">NOT A SELLER YET</span>
        <h2>You need an approved seller account to create listings.</h2>
        <p>Apply through Cohort 03 — five steps, three minutes. We respond within 48 hours.</p>
        <div class="cs-state__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
            Apply to sell →
          </button>
        </div>
      </div>

    {:else if bootStatus === 'not-approved' && seller}
      <div class="cs-state">
        <span class="evx-label">PENDING APPROVAL</span>
        <h2>Your seller account is {seller.status}.</h2>
        <p>You can browse the platform, but creating listings opens up after approval.</p>
        <div class="cs-state__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/dashboard')}>
            Back to dashboard →
          </button>
        </div>
      </div>

    {:else if categoriesError}
      <div class="cs-state cs-state--err">
        <span class="evx-label">DATABASE NOT READY</span>
        <p>{categoriesError}</p>
      </div>

    {:else}

      <!-- ── Progress ── -->
      {#if step < 6}
        <nav class="progress" aria-label="Listing progress">
          {#each stepLabels.slice(0, 5) as label, i}
            {@const n = i + 1}
            <div
              class="progress__step"
              class:progress__step--active={n === step}
              class:progress__step--done={n < step}
            >
              <span class="evx-label progress__num">{String(n).padStart(2, '0')}</span>
              <span class="progress__label">{label}</span>
            </div>
          {/each}
        </nav>
      {/if}

      <!-- ═══ STEP 1 · CATEGORY ═══ -->
      {#if step === 1}
        <div class="form-wrap form-wrap--wide">
          <div class="form-h">
            <h2 class="form-h2">Which category?</h2>
            <p class="form-sub">Pick the one buyers would look in.</p>
          </div>

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
                <span class="evx-caption cat-tile__desc">{c.description ?? ''}</span>
              </button>
            {/each}
          </div>

          <div class="step-nav">
            <span class="evx-caption step-nav__count">Step 1 of 5</span>
            <button class="evx-btn evx-btn--primary" on:click={next} disabled={!step1Valid}>
              Continue →
            </button>
          </div>
        </div>

      <!-- ═══ STEP 2 · DETAILS ═══ -->
      {:else if step === 2}
        <div class="form-wrap">
          <div class="form-h">
            <h2 class="form-h2">Describe the item.</h2>
            <p class="form-sub">Be honest about condition. Buyers reward sellers who are upfront about flaws.</p>
          </div>

          <div class="form-grid">
            <div class="field">
              <label class="evx-caption field-label" for="d-title">TITLE</label>
              <input id="d-title" type="text" class="field-input field-input--lg" placeholder="Mercedes-AMG GT — carbon steering wheel" bind:value={title} required />
              <span class="field-hint evx-caption">Mention make and model first.</span>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="d-subtitle">SUBTITLE (OPTIONAL)</label>
              <input id="d-subtitle" type="text" class="field-input" placeholder="Forged carbon · matte · Alcantara" bind:value={subtitle} />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="d-cond">CONDITION</label>
              <select id="d-cond" class="field-input field-select" bind:value={condition} required>
                <option value="">Select condition…</option>
                {#each conditionOptions as opt}<option value={opt}>{opt}</option>{/each}
              </select>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="d-desc">DESCRIPTION</label>
              <textarea id="d-desc" class="field-input field-textarea" rows="8" bind:value={description} required></textarea>
              <span class="field-hint evx-caption">{description.trim().length} / 30 minimum characters</span>
            </div>
          </div>

          <div class="step-nav step-nav--split">
            <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
            <div class="step-nav__right">
              <span class="evx-caption step-nav__count">Step 2 of 5</span>
              <button class="evx-btn evx-btn--primary" on:click={next} disabled={!step2Valid}>
                Continue →
              </button>
            </div>
          </div>
        </div>

      <!-- ═══ STEP 3 · PRICING ═══ -->
      {:else if step === 3}
        <div class="form-wrap">
          <div class="form-h">
            <h2 class="form-h2">Set your price.</h2>
            <p class="form-sub">Prices are in Euro.</p>
          </div>

          <div class="form-grid">
            <div class="form-row form-row--2">
              <div class="field">
                <label class="evx-caption field-label" for="p-price">ASKING PRICE</label>
                <div class="field-prefix">
                  <span class="field-prefix__sym">€</span>
                  <input id="p-price" type="number" class="field-input field-input--lg" placeholder="0" bind:value={price} required />
                </div>
              </div>
              <div class="field">
                <label class="evx-caption field-label" for="p-orig">ORIGINAL RETAIL (OPTIONAL)</label>
                <div class="field-prefix">
                  <span class="field-prefix__sym">€</span>
                  <input id="p-orig" type="number" class="field-input field-input--lg" placeholder="0" bind:value={originalPrice} />
                </div>
              </div>
            </div>

            {#if Number(originalPrice) > Number(price) && Number(price) > 0}
              <div class="savings">
                <span class="evx-caption savings__label">PREVIEW</span>
                <div class="savings__row">
                  <span class="savings__price">{formatEuros(price)}</span>
                  <span class="savings__orig">{formatEuros(originalPrice)}</span>
                  <span class="evx-caption savings__save">SAVE {formatEuros(Number(originalPrice) - Number(price))}</span>
                </div>
              </div>
            {/if}

            <div class="toggle-list">
              <label class="toggle">
                <input type="checkbox" bind:checked={acceptsOffers} class="toggle__box" />
                <div class="toggle__body">
                  <strong>Accept offers</strong>
                  <span class="toggle__desc evx-caption">Buyers can make offers below your asking price.</span>
                </div>
              </label>
              <label class="toggle">
                <input type="checkbox" bind:checked={collectionAvailable} class="toggle__box" />
                <div class="toggle__body">
                  <strong>Collection available</strong>
                  <span class="toggle__desc evx-caption">Buyer can collect from your location.</span>
                </div>
              </label>
              <label class="toggle">
                <input type="checkbox" bind:checked={shipsNationwide} class="toggle__box" />
                <div class="toggle__body">
                  <strong>Ship nationwide</strong>
                  <span class="toggle__desc evx-caption">Tracked &amp; insured shipping across Ireland and Northern Ireland.</span>
                </div>
              </label>
            </div>

            {#if shipsNationwide}
              <div class="field">
                <label class="evx-caption field-label" for="p-ship">SHIPPING COST (€)</label>
                <div class="field-prefix">
                  <span class="field-prefix__sym">€</span>
                  <input id="p-ship" type="number" class="field-input" placeholder="12" bind:value={shippingCost} />
                </div>
                <span class="field-hint evx-caption">Leave blank for free shipping.</span>
              </div>
            {/if}
          </div>

          <div class="step-nav step-nav--split">
            <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
            <div class="step-nav__right">
              <span class="evx-caption step-nav__count">Step 3 of 5</span>
              <button class="evx-btn evx-btn--primary" on:click={next} disabled={!step3Valid}>
                Continue →
              </button>
            </div>
          </div>
        </div>

      <!-- ═══ STEP 4 · SPECS ═══ -->
      {:else if step === 4}
        <div class="form-wrap">
          <div class="form-h">
            <h2 class="form-h2">Specifications.</h2>
            <p class="form-sub">Pre-filled based on your category. Fill what applies, leave the rest blank, or add your own.</p>
          </div>

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

          <div class="step-nav step-nav--split">
            <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
            <div class="step-nav__right">
              <span class="evx-caption step-nav__count">Step 4 of 5 · optional</span>
              <button class="evx-btn evx-btn--primary" on:click={next}>
                Continue →
              </button>
            </div>
          </div>
        </div>

      <!-- ═══ STEP 5 · PHOTOS ═══ -->
      {:else if step === 5}
        <div class="form-wrap">
          <div class="form-h">
            <h2 class="form-h2">Add photos.</h2>
            <p class="form-sub">
              Three or more recommended. Up to twelve. The first photo is your cover.
              Files upload to Supabase Storage when you save in step 6.
            </p>
          </div>

          <div
            class="drop-zone"
            on:dragover|preventDefault
            on:drop={onDrop}
            role="region"
            aria-label="Photo upload"
          >
            <span class="drop-zone__plus">+</span>
            <strong>Drag photos here or</strong>
            <label class="drop-zone__pick">
              <span>browse</span>
              <input type="file" accept="image/*" multiple on:change={onPickFiles} hidden />
            </label>
            <span class="evx-caption drop-zone__hint">JPG / PNG / WEBP · up to 6 MB each</span>
          </div>

          {#if pending.length > 0}
            <div class="photo-grid">
              {#each pending as p, i (p.id)}
                <div class="photo-tile" class:photo-tile--cover={i === 0}>
                  {#if i === 0}<span class="evx-caption photo-tile__cover">COVER</span>{/if}
                  <img src={p.previewUrl} alt="" />
                  <div class="photo-tile__bar">
                    <button on:click={() => movePending(p.id, -1)} disabled={i === 0} aria-label="Move up">←</button>
                    <button on:click={() => movePending(p.id, 1)} disabled={i === pending.length - 1} aria-label="Move down">→</button>
                    <button on:click={() => removePending(p.id)} aria-label="Remove">×</button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}

          <span class="evx-caption photo-count">
            {pending.length} of 12 photos
            {#if pending.length < 1}<span class="photo-count__warn"> · add at least one to submit for review</span>{/if}
          </span>

          <div class="step-nav step-nav--split">
            <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
            <div class="step-nav__right">
              <span class="evx-caption step-nav__count">Step 5 of 5</span>
              <button class="evx-btn evx-btn--primary" on:click={next}>
                Review →
              </button>
            </div>
          </div>
        </div>

      <!-- ═══ STEP 6 · REVIEW ═══ -->
      {:else}
        <div class="form-wrap form-wrap--wide">
          <div class="form-h">
            <h2 class="form-h2">Review &amp; submit.</h2>
            <p class="form-sub">
              Final check. "Save as draft" stores it on your dashboard.
              "Submit for review" puts it in front of the ÉIRVOX team — usually live within 24 hours.
            </p>
          </div>

          <div class="review">
            <div class="review__main">
              <div class="review__cover">
                {#if pending.length > 0}
                  <img src={pending[0].previewUrl} alt="Cover preview" />
                {:else}
                  <span class="review__cover-empty evx-caption">NO COVER</span>
                {/if}
              </div>

              <span class="evx-label review__category">
                {categories.find(c => c.id === categoryId)?.name ?? '—'}
                {#if condition} · {condition}{/if}
              </span>
              <h3 class="review__title">{title || 'Untitled listing'}</h3>
              {#if subtitle}<p class="review__subtitle">{subtitle}</p>{/if}

              <div class="review__price-block">
                <span class="review__price">{formatEuros(price)}</span>
                {#if Number(originalPrice) > Number(price) && originalPrice !== ''}
                  <span class="review__orig">{formatEuros(originalPrice)}</span>
                {/if}
              </div>

              {#if description}
                <div class="review__section">
                  <span class="evx-label">DESCRIPTION</span>
                  <p>{description}</p>
                </div>
              {/if}

              {#if specs.filter(s => s.label.trim() && s.value.trim()).length > 0}
                <div class="review__section">
                  <span class="evx-label">SPECIFICATION</span>
                  <table>
                    <tbody>
                      {#each specs.filter(s => s.label.trim() && s.value.trim()) as s}
                        <tr><td class="evx-caption review__spec-l">{s.label.toUpperCase()}</td><td class="review__spec-v">{s.value}</td></tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              {/if}
            </div>

            <aside class="review__side">
              <div class="review__side-card">
                <span class="evx-label">DELIVERY</span>
                {#if shipsNationwide}<p><strong>Ship</strong> · {shippingCost ? `€${shippingCost}` : 'free'}</p>{/if}
                {#if collectionAvailable}<p><strong>Collection</strong> · by arrangement</p>{/if}
              </div>
              <div class="review__side-card">
                <span class="evx-label">OFFERS</span>
                <p>{acceptsOffers ? 'Open to offers' : 'Fixed price'}</p>
              </div>
              <div class="review__side-card">
                <span class="evx-label">PHOTOS</span>
                <p>{pending.length} of 12 to upload</p>
              </div>
            </aside>
          </div>

          {#if saveError}
            <div class="form-err"><span class="evx-label">ERROR</span><p>{saveError}</p></div>
          {/if}

          {#if saving && uploadProgress.total > 0}
            <div class="upload-progress">
              <span class="evx-caption">Uploading image {uploadProgress.current} of {uploadProgress.total}…</span>
              <div class="upload-progress__bar">
                <div class="upload-progress__fill" style="width: {(uploadProgress.current / uploadProgress.total) * 100}%"></div>
              </div>
            </div>
          {/if}

          <div class="step-nav step-nav--split">
            <button class="evx-btn evx-btn--ghost" on:click={() => { step = 1; window.scrollTo(0,0); }} disabled={saving}>← Edit from top</button>
            <div class="step-nav__right">
              <button class="evx-btn evx-btn--ghost" on:click={() => persist('draft')} disabled={saving}>
                {saving ? 'Saving…' : 'Save as draft'}
              </button>
              <button class="evx-btn evx-btn--primary" on:click={() => persist('pending_review')} disabled={saving || pending.length === 0}>
                {saving ? 'Submitting…' : 'Submit for review →'}
              </button>
            </div>
          </div>
        </div>
      {/if}

    {/if}

  </div>
</main>

<Footer />

<style>
  .create-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .create-header { padding-top: var(--evx-space-2xl); margin-bottom: var(--evx-space-xl); }
  .create-back {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    display: block; margin-bottom: var(--evx-space-xl);
    transition: var(--evx-transition);
  }
  .create-back:hover { color: var(--evx-warm-black); }
  .create-meta { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .create-title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }
  .create-sub { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 560px; }

  /* State panels */
  .cs-state {
    padding: var(--evx-space-2xl);
    border: 1px solid var(--evx-rule-light);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
    max-width: 560px;
  }
  .cs-state span:first-child { color: var(--evx-ink-soft); }
  .cs-state--err span:first-child { color: var(--evx-fox-orange); }
  .cs-state h2 {
    font-family: var(--evx-font-display);
    font-size: 24px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
  }
  .cs-state p { font-size: 14px; line-height: 1.65; color: var(--evx-ink-soft); }
  .cs-state__actions { display: flex; gap: var(--evx-space-sm); }

  /* Progress */
  .progress {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .progress__step {
    display: flex; flex-direction: column; gap: 4px;
    padding: var(--evx-space-md) 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    opacity: 0.40;
    transition: opacity 200ms ease;
  }
  .progress__step--active { opacity: 1; border-bottom-color: var(--evx-fox-orange); }
  .progress__step--done { opacity: 0.70; }
  .progress__step--active .progress__num { color: var(--evx-fox-orange); }
  .progress__step--done .progress__num { color: var(--evx-warm-black); }
  .progress__num { color: var(--evx-ink-soft); }
  .progress__label { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }

  /* Form base */
  .form-wrap { max-width: 640px; display: flex; flex-direction: column; gap: var(--evx-space-2xl); }
  .form-wrap--wide { max-width: 960px; }
  .form-h { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .form-h2 {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .form-sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  .form-grid { display: flex; flex-direction: column; gap: var(--evx-space-xl); }
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
    width: 100%;
    transition: border-color 200ms ease;
  }
  .field-input:focus { border-bottom-color: var(--evx-warm-black); }
  .field-input::placeholder { color: var(--evx-ink-soft); }
  .field-input--lg { font-size: 18px; }
  .field-select { -webkit-appearance: none; cursor: pointer; padding-right: 24px; }
  .field-textarea { resize: vertical; min-height: 160px; line-height: 1.6; }
  .field-hint { color: var(--evx-ink-soft); margin-top: 2px; }

  .field-prefix { display: flex; align-items: baseline; gap: 4px; border-bottom: 1px solid var(--evx-rule-light); }
  .field-prefix .field-input { border-bottom: none; padding-left: 4px; }
  .field-prefix__sym { color: var(--evx-ink-soft); font-size: 15px; }

  /* Category tiles */
  .cat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-md); }
  .cat-tile {
    display: flex; flex-direction: column; align-items: flex-start;
    gap: var(--evx-space-sm);
    padding: 0;
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: border-color 200ms ease, opacity 200ms ease;
    text-align: left;
  }
  .cat-tile:hover { opacity: 0.85; }
  .cat-tile--selected { border-color: var(--evx-fox-orange); border-width: 2px; }
  .cat-tile__bg {
    width: 100%;
    aspect-ratio: 4 / 3;
    background: var(--evx-graphite);
    display: block;
  }
  .cat-tile__name {
    font-family: var(--evx-font-display);
    font-size: 16px;
    font-weight: 500;
    color: var(--evx-warm-black);
    padding: var(--evx-space-md) var(--evx-space-md) 0;
  }
  .cat-tile__desc { color: var(--evx-ink-soft); padding: 0 var(--evx-space-md) var(--evx-space-md); }

  /* Pricing extras */
  .savings { border: 1px solid var(--evx-rule-light); padding: var(--evx-space-md); }
  .savings__label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .savings__row { display: flex; gap: var(--evx-space-md); align-items: baseline; }
  .savings__price { font-family: var(--evx-font-display); font-size: 22px; font-weight: 500; }
  .savings__orig { font-size: 14px; color: var(--evx-ink-soft); text-decoration: line-through; }
  .savings__save { color: var(--evx-fox-orange); }

  .toggle-list { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .toggle {
    display: flex; align-items: flex-start;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: border-color 200ms ease;
  }
  .toggle:has(.toggle__box:checked) { border-color: var(--evx-warm-black); }
  .toggle__box { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; accent-color: var(--evx-fox-orange); }
  .toggle__body { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .toggle__body strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }
  .toggle__desc { color: var(--evx-ink-soft); line-height: 1.5; }

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
  .spec-row__label::placeholder { color: var(--evx-ink-soft); font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }
  .spec-row__rm { background: none; border: none; cursor: pointer; color: var(--evx-ink-soft); font-size: 22px; padding: 0; transition: var(--evx-transition); }
  .spec-row__rm:hover { color: var(--evx-fox-orange); }
  .spec-add {
    background: none;
    border: 1px dashed var(--evx-rule-light);
    color: var(--evx-warm-black);
    padding: var(--evx-space-md);
    cursor: pointer;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    margin-top: var(--evx-space-sm);
    transition: var(--evx-transition);
  }
  .spec-add:hover { border-color: var(--evx-warm-black); }

  /* Photos */
  .drop-zone {
    border: 2px dashed var(--evx-rule-light);
    padding: var(--evx-space-2xl);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: var(--evx-space-sm);
    text-align: center;
    transition: border-color 200ms ease;
  }
  .drop-zone:hover { border-color: var(--evx-warm-black); }
  .drop-zone__plus {
    font-size: 36px;
    color: var(--evx-ink-soft);
    line-height: 1;
  }
  .drop-zone strong { font-family: var(--evx-font-display); font-size: 16px; font-weight: 500; color: var(--evx-warm-black); }
  .drop-zone__pick { color: var(--evx-fox-orange); cursor: pointer; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
  .drop-zone__hint { color: var(--evx-ink-soft); }

  .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--evx-space-sm); }
  .photo-tile {
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    position: relative;
    overflow: hidden;
  }
  .photo-tile--cover { outline: 2px solid var(--evx-fox-orange); outline-offset: -2px; }
  .photo-tile img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .photo-tile__cover {
    position: absolute; top: 8px; left: 8px;
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 6px;
    z-index: 2;
  }
  .photo-tile__bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    display: flex; justify-content: space-between;
    padding: 6px;
    background: rgba(26,26,26,0.55);
  }
  .photo-tile__bar button {
    background: none; border: none;
    color: var(--evx-paper);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 4px 6px;
  }
  .photo-tile__bar button:disabled { opacity: 0.30; cursor: not-allowed; }

  .photo-count { color: var(--evx-ink-soft); }
  .photo-count__warn { color: var(--evx-fox-orange); }

  /* Review */
  .review {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: var(--evx-space-2xl);
  }
  .review__main { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .review__cover {
    aspect-ratio: 5 / 6;
    max-width: 360px;
    background: var(--evx-graphite);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: var(--evx-space-md);
  }
  .review__cover img { width: 100%; height: 100%; object-fit: cover; }
  .review__cover-empty { color: rgba(245,242,237,0.4); }
  .review__category { color: var(--evx-ink-soft); display: block; }
  .review__title {
    font-family: var(--evx-font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  .review__subtitle {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    color: var(--evx-ink-soft);
  }
  .review__price-block {
    display: flex; align-items: baseline;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    margin: var(--evx-space-md) 0;
  }
  .review__price { font-family: var(--evx-font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }
  .review__orig { font-size: 15px; color: var(--evx-ink-soft); text-decoration: line-through; }
  .review__section { display: flex; flex-direction: column; gap: var(--evx-space-sm); margin-top: var(--evx-space-md); }
  .review__section span:first-child { color: var(--evx-ink-soft); }
  .review__section p { font-size: 14px; line-height: 1.75; color: var(--evx-warm-black); white-space: pre-wrap; }
  .review__section table { width: 100%; border-collapse: collapse; margin-top: var(--evx-space-sm); }
  .review__section tr { border-bottom: 1px solid var(--evx-rule-light); }
  .review__spec-l { color: var(--evx-ink-soft); padding: var(--evx-space-sm) 0; width: 140px; vertical-align: top; }
  .review__spec-v { padding: var(--evx-space-sm) 0; font-size: 14px; }

  .review__side { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .review__side-card { border: 1px solid var(--evx-rule-light); padding: var(--evx-space-md); }
  .review__side-card span { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .review__side-card p { font-size: 13px; line-height: 1.6; color: var(--evx-ink-soft); margin-bottom: 4px; }
  .review__side-card strong { color: var(--evx-warm-black); font-weight: 500; }

  /* Save state */
  .form-err {
    padding: var(--evx-space-md);
    border-left: 2px solid var(--evx-fox-orange);
    background: rgba(232,116,44,0.06);
    display: flex; flex-direction: column;
    gap: var(--evx-space-xs);
  }
  .form-err span:first-child { color: var(--evx-fox-orange); }
  .form-err p { font-size: 14px; line-height: 1.55; color: var(--evx-warm-black); }

  .upload-progress { display: flex; flex-direction: column; gap: var(--evx-space-xs); padding: var(--evx-space-md); border: 1px solid var(--evx-rule-light); }
  .upload-progress span { color: var(--evx-ink-soft); }
  .upload-progress__bar { height: 4px; background: var(--evx-rule-light); position: relative; overflow: hidden; }
  .upload-progress__fill { height: 100%; background: var(--evx-fox-orange); transition: width 200ms ease; }

  /* Step nav (shared) */
  .step-nav { display: flex; justify-content: flex-end; align-items: center; gap: var(--evx-space-md); padding-top: var(--evx-space-xl); border-top: 1px solid var(--evx-rule-light); }
  .step-nav--split { justify-content: space-between; }
  .step-nav__right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .step-nav__count { color: var(--evx-ink-soft); }
  .evx-btn:disabled { opacity: 0.40; cursor: not-allowed; }

  @media (max-width: 1023px) {
    .cat-grid { grid-template-columns: repeat(3, 1fr); }
    .photo-grid { grid-template-columns: repeat(3, 1fr); }
    .review { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .cat-grid { grid-template-columns: repeat(2, 1fr); }
    .photo-grid { grid-template-columns: repeat(2, 1fr); }
    .form-row--2 { grid-template-columns: 1fr; }
    .progress { grid-template-columns: repeat(3, 1fr); }
    .spec-row { grid-template-columns: 1fr 40px; }
    .spec-row__label { grid-column: 1 / -1; }
    .step-nav--split { flex-direction: column; align-items: stretch; gap: var(--evx-space-md); }
  }
</style>
