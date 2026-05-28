<script lang="ts">
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { categories } from '../data/listings';

  let step = 1;
  const TOTAL_STEPS = 6;

  // Step 1
  let category = '';
  // Step 2
  let title = '';
  let subtitle = '';
  let description = '';
  let condition = '';
  // Step 3
  let price: string | number = '';
  let originalPrice: string | number = '';
  let acceptsOffers = true;
  let shipsNationwide = true;
  let collectionAvailable = true;
  let shippingCost = '';
  // Step 4
  type Spec = { label: string; value: string };
  let specs: Spec[] = [];
  // Step 5
  let photos: string[] = []; // Track count only (UI-only)

  // ── Auto-populate specs based on category ──────────────────
  const specTemplates: Record<string, string[]> = {
    automotive:    ['Make', 'Model', 'Year', 'Part Type', 'Fitment'],
    watches:       ['Brand', 'Reference', 'Movement', 'Case Size', 'Year'],
    fashion:       ['Brand', 'Size', 'Material', 'Colour', 'Year'],
    tech:          ['Brand', 'Model', 'Year', 'Specifications', 'Condition Notes'],
    'home-design': ['Designer', 'Manufacturer', 'Material', 'Year', 'Dimensions'],
    'audio-vinyl': ['Brand', 'Model', 'Year', 'Condition', 'Notes'],
    art:           ['Artist', 'Title', 'Edition', 'Year', 'Medium'],
  };

  function populateTemplate() {
    if (category && specTemplates[category]) {
      specs = specTemplates[category].map(label => ({ label, value: '' }));
    }
  }

  function addSpec() {
    specs = [...specs, { label: '', value: '' }];
  }

  function removeSpec(index: number) {
    specs = specs.filter((_, i) => i !== index);
  }

  function addPhoto() {
    if (photos.length < 12) {
      photos = [...photos, `Photo ${photos.length + 1}`];
    }
  }

  function removePhoto(index: number) {
    photos = photos.filter((_, i) => i !== index);
  }

  // ── Validation ─────────────────────────────────────────────
  $: step1Valid = !!category;
  $: step2Valid = title.trim().length >= 3 && description.trim().length >= 30 && condition;
  $: step3Valid = price !== '' && price !== undefined && Number(price) > 0;
  $: step4Valid = true; // optional
  $: step5Valid = photos.length >= 3;

  $: canProceed = (
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid) ||
    (step === 5 && step5Valid)
  );

  function next() {
    if (canProceed && step < TOTAL_STEPS) {
      if (step === 1) populateTemplate();
      step++;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function prev() {
    if (step > 1) {
      step--;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  function submit() {
    step = 6;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const stepLabels = [
    'Category',
    'Details',
    'Pricing',
    'Specs',
    'Photos',
    'Review',
  ];

  const conditionOptions = ['OEM+ New', 'Like New', 'Used — Excellent', 'Used — Good', 'Refinished'];

  function formatPrice(p: string | number): string {
    const n = Number(p);
    return n > 0 ? '€' + n.toLocaleString('en-IE') : '€0';
  }
</script>

<Nav />

<main class="create-page">
  <div class="page-container">

    <!-- Header / context -->
    <header class="create-header">
      <button class="create-back evx-caption" on:click={() => navigate('/sell')}>
        ← Back to seller home
      </button>

      <div class="create-meta">
        <span class="evx-caption create-meta__pre">SELLER · NEW LISTING</span>
      </div>

      {#if step < 6}
        <h1 class="create-title">List a new item.</h1>
        <p class="create-sub">
          Six short steps. You can save and come back, but a strong listing usually takes about ten minutes
          and three or four good photos.
        </p>

        <div class="create-note">
          <span class="evx-caption create-note__label">FOR REVIEW</span>
          <span class="evx-caption create-note__text">
            You'll need an approved seller account to publish. New listings are reviewed before going live — usually within 24 hours.
          </span>
        </div>
      {/if}
    </header>

    <!-- Progress -->
    {#if step < 6}
      <nav class="progress" aria-label="Listing progress">
        {#each stepLabels.slice(0, 5) as label, i}
          {@const stepNum = i + 1}
          <div
            class="progress__step"
            class:progress__step--active={stepNum === step}
            class:progress__step--done={stepNum < step}
          >
            <span class="evx-label progress__num">{String(stepNum).padStart(2, '0')}</span>
            <span class="progress__label">{label}</span>
          </div>
        {/each}
      </nav>
    {/if}

    <!-- ════ STEP 1 · CATEGORY ════ -->
    {#if step === 1}
      <div class="form-wrap form-wrap--wide">
        <div class="form-header">
          <h2 class="form-h2">Which category?</h2>
          <p class="form-sub">
            Pick the one buyers would look in. You can change later if the review team suggests a better fit.
          </p>
        </div>

        <div class="cat-grid">
          {#each categories as cat}
            <button
              type="button"
              class="cat-tile"
              class:cat-tile--selected={category === cat.slug}
              on:click={() => category = cat.slug}
            >
              <span class="cat-tile__bg"></span>
              <span class="cat-tile__name">{cat.label}</span>
              <span class="evx-caption cat-tile__desc">{cat.subcategories.slice(0, 3).join(' · ')}</span>
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

    <!-- ════ STEP 2 · DETAILS ════ -->
    {:else if step === 2}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">Describe the item.</h2>
          <p class="form-sub">
            Be honest about condition. Buyers are more forgiving of an upfront flaw than a hidden one.
          </p>
        </div>

        <div class="form-grid">
          <div class="field">
            <label class="evx-caption field-label" for="f-title">TITLE</label>
            <input id="f-title" type="text" class="field-input field-input--lg" placeholder="Mercedes-AMG GT — carbon steering wheel" bind:value={title} required />
            <span class="field-hint evx-caption">A short, descriptive headline. Mention make and model first.</span>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="f-subtitle">SUBTITLE (OPTIONAL)</label>
            <input id="f-subtitle" type="text" class="field-input" placeholder="Forged carbon · matte · Alcantara" bind:value={subtitle} />
            <span class="field-hint evx-caption">Quick spec summary. Keep it under 80 characters.</span>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="f-condition">CONDITION</label>
            <select id="f-condition" class="field-input field-select" bind:value={condition} required>
              <option value="">Select condition…</option>
              {#each conditionOptions as opt}
                <option value={opt}>{opt}</option>
              {/each}
            </select>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="f-desc">DESCRIPTION</label>
            <textarea
              id="f-desc"
              class="field-input field-textarea"
              placeholder="Tell buyers everything they'd want to know. Origin, history, any wear, what's included, why you're selling…"
              bind:value={description}
              rows="8"
              required
            ></textarea>
            <span class="field-hint evx-caption">
              {description.trim().length} / 30 minimum characters · markdown supported
            </span>
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

    <!-- ════ STEP 3 · PRICING ════ -->
    {:else if step === 3}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">Set your price.</h2>
          <p class="form-sub">
            Prices are in Euro. Don't undercut yourself — Éirvox buyers expect to pay fairly, but they'll walk if it's overpriced.
          </p>
        </div>

        <div class="form-grid">
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-price">ASKING PRICE</label>
              <div class="field-prefix">
                <span class="field-prefix__symbol">€</span>
                <input id="f-price" type="number" class="field-input field-input--lg" placeholder="0" bind:value={price} required />
              </div>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-orig">ORIGINAL RETAIL (OPTIONAL)</label>
              <div class="field-prefix">
                <span class="field-prefix__symbol">€</span>
                <input id="f-orig" type="number" class="field-input field-input--lg" placeholder="0" bind:value={originalPrice} />
              </div>
              <span class="field-hint evx-caption">
                Shows buyers how much they save. Leave blank if not applicable.
              </span>
            </div>
          </div>

          {#if Number(originalPrice) > Number(price) && Number(price) > 0}
            <div class="savings-preview">
              <span class="evx-caption savings-preview__label">PREVIEW</span>
              <div class="savings-preview__row">
                <span class="savings-preview__price">{formatPrice(price)}</span>
                <span class="savings-preview__orig">{formatPrice(originalPrice)}</span>
                <span class="savings-preview__save evx-caption">SAVE {formatPrice(String(Number(originalPrice) - Number(price)))}</span>
              </div>
            </div>
          {/if}

          <div class="toggle-list">
            <label class="toggle">
              <input type="checkbox" bind:checked={acceptsOffers} class="toggle__box" />
              <div class="toggle__body">
                <strong class="toggle__title">Accept offers</strong>
                <span class="toggle__desc evx-caption">Buyers can make offers below your asking price.</span>
              </div>
            </label>

            <label class="toggle">
              <input type="checkbox" bind:checked={collectionAvailable} class="toggle__box" />
              <div class="toggle__body">
                <strong class="toggle__title">Collection available</strong>
                <span class="toggle__desc evx-caption">Buyer can collect from your location.</span>
              </div>
            </label>

            <label class="toggle">
              <input type="checkbox" bind:checked={shipsNationwide} class="toggle__box" />
              <div class="toggle__body">
                <strong class="toggle__title">Ship nationwide</strong>
                <span class="toggle__desc evx-caption">Tracked &amp; insured shipping across Ireland and Northern Ireland.</span>
              </div>
            </label>
          </div>

          {#if shipsNationwide}
            <div class="field">
              <label class="evx-caption field-label" for="f-ship">SHIPPING COST (€)</label>
              <div class="field-prefix">
                <span class="field-prefix__symbol">€</span>
                <input id="f-ship" type="number" class="field-input" placeholder="12" bind:value={shippingCost} />
              </div>
              <span class="field-hint evx-caption">Leave blank for free shipping. DPD Express rates suggested.</span>
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

    <!-- ════ STEP 4 · SPECS ════ -->
    {:else if step === 4}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">Specifications.</h2>
          <p class="form-sub">
            Pre-filled based on your category. Fill in what applies, leave the rest blank, or add your own.
            These appear as a table on your listing.
          </p>
        </div>

        <div class="spec-list">
          {#each specs as spec, i (i)}
            <div class="spec-row">
              <input
                type="text"
                class="spec-row__label"
                placeholder="Label (e.g. Brand)"
                bind:value={spec.label}
              />
              <input
                type="text"
                class="spec-row__value"
                placeholder="Value"
                bind:value={spec.value}
              />
              <button type="button" class="spec-row__remove" on:click={() => removeSpec(i)} aria-label="Remove spec row">×</button>
            </div>
          {/each}

          <button type="button" class="spec-add" on:click={addSpec}>
            + Add specification
          </button>
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

    <!-- ════ STEP 5 · PHOTOS ════ -->
    {:else if step === 5}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">Add photos.</h2>
          <p class="form-sub">
            Three minimum. Up to twelve. The first photo is your cover — make it count.
            Daylight, plain background, 5:6 ratio recommended.
          </p>
        </div>

        <div class="photo-grid">
          {#each photos as photo, i (i)}
            <div class="photo-tile" class:photo-tile--cover={i === 0}>
              {#if i === 0}
                <span class="evx-caption photo-tile__cover">COVER</span>
              {/if}
              <span class="evx-caption photo-tile__num">{String(i + 1).padStart(2, '0')}</span>
              <span class="photo-tile__placeholder">{photo}</span>
              <button type="button" class="photo-tile__remove" on:click={() => removePhoto(i)} aria-label="Remove photo">×</button>
            </div>
          {/each}

          {#if photos.length < 12}
            <button type="button" class="photo-add" on:click={addPhoto}>
              <span class="photo-add__plus">+</span>
              <span class="photo-add__text evx-caption">Add photo</span>
              <span class="photo-add__hint evx-caption">{photos.length} / 12</span>
            </button>
          {/if}
        </div>

        <div class="photo-info">
          <span class="evx-caption photo-info__count">
            {photos.length} of 12 photos
            {#if photos.length < 3}
              <span class="photo-info__warn"> · need {3 - photos.length} more to publish</span>
            {/if}
          </span>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 5 of 5</span>
            <button class="evx-btn evx-btn--primary" on:click={submit} disabled={!step5Valid}>
              Review →
            </button>
          </div>
        </div>
      </div>

    <!-- ════ STEP 6 · REVIEW & PUBLISH ════ -->
    {:else}
      <div class="form-wrap form-wrap--wide">
        <div class="form-header">
          <h2 class="form-h2">Review &amp; submit.</h2>
          <p class="form-sub">
            Check it reads well. You can still edit anything before submitting.
            Once submitted, the review team has 24 hours to approve or come back with notes.
          </p>
        </div>

        <div class="review">
          <div class="review__main">
            <!-- Cover preview -->
            <div class="review__cover">
              {#if photos.length > 0}
                <span class="evx-caption review__cover-label">{photos[0]}</span>
              {:else}
                <span class="review__cover-empty evx-caption">NO COVER</span>
              {/if}
            </div>

            <span class="evx-label review__category">
              {categories.find(c => c.slug === category)?.label ?? '—'}
              {#if condition} · {condition}{/if}
            </span>
            <h3 class="review__title">{title || 'Untitled listing'}</h3>
            {#if subtitle}<p class="review__subtitle">{subtitle}</p>{/if}

            <div class="review__price-block">
              <span class="review__price">{formatPrice(price)}</span>
              {#if Number(originalPrice) > Number(price) && originalPrice}
                <span class="review__orig">{formatPrice(originalPrice)}</span>
              {/if}
            </div>

            {#if description}
              <div class="review__section">
                <span class="evx-label">DESCRIPTION</span>
                <p class="review__desc">{description}</p>
              </div>
            {/if}

            {#if specs.filter(s => s.label && s.value).length > 0}
              <div class="review__section">
                <span class="evx-label">SPECIFICATION</span>
                <table class="review__spec">
                  <tbody>
                    {#each specs.filter(s => s.label && s.value) as spec}
                      <tr>
                        <td class="evx-caption review__spec-label">{spec.label.toUpperCase()}</td>
                        <td class="review__spec-val">{spec.value}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>

          <aside class="review__side">
            <div class="review__side-card">
              <span class="evx-label review__side-label">DELIVERY</span>
              {#if shipsNationwide}
                <p class="review__side-line">
                  <strong>Ship</strong> · DPD Express
                  {#if shippingCost}· €{shippingCost}{:else}· free{/if}
                </p>
              {/if}
              {#if collectionAvailable}
                <p class="review__side-line"><strong>Collection</strong> · by arrangement</p>
              {/if}
              {#if !shipsNationwide && !collectionAvailable}
                <p class="review__side-line review__side-line--warn">No delivery method selected.</p>
              {/if}
            </div>

            <div class="review__side-card">
              <span class="evx-label review__side-label">OFFERS</span>
              <p class="review__side-line">
                {acceptsOffers ? 'Open to offers from buyers' : 'Fixed price · no offers'}
              </p>
            </div>

            <div class="review__side-card">
              <span class="evx-label review__side-label">PHOTOS</span>
              <p class="review__side-line">{photos.length} of 12 added</p>
            </div>
          </aside>
        </div>

        <div class="review__notice">
          <strong>Note on reviews.</strong>
          New listings are reviewed by the ÉIRVOX team before going live — usually within 24 hours.
          You'll get an email when it's approved (or when we have notes to share).
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={() => { step = 1; window.scrollTo(0,0); }}>← Edit from top</button>
          <div class="step-nav__right">
            <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/dashboard')}>
              Save as draft
            </button>
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/dashboard')}>
              Submit for review →
            </button>
          </div>
        </div>
      </div>
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

  .create-meta { margin-bottom: var(--evx-space-md); }
  .create-meta__pre { color: var(--evx-fox-orange); }

  .create-title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .create-sub { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 560px; margin-bottom: var(--evx-space-lg); }

  .create-note {
    display: flex;
    gap: var(--evx-space-md);
    align-items: baseline;
    padding: var(--evx-space-md);
    background: rgba(232, 116, 44, 0.06);
    border-left: 2px solid var(--evx-fox-orange);
    max-width: 640px;
  }
  .create-note__label { color: var(--evx-fox-orange); flex-shrink: 0; }
  .create-note__text { color: var(--evx-warm-black); line-height: 1.6; }

  /* Progress (shared shape with apply) */
  .progress {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0;
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .progress__step {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--evx-space-md) 0;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    opacity: 0.40;
    transition: opacity 200ms ease;
  }

  .progress__step--active {
    opacity: 1;
    border-bottom-color: var(--evx-fox-orange);
  }
  .progress__step--done { opacity: 0.70; }

  .progress__step--active .progress__num { color: var(--evx-fox-orange); }
  .progress__step--done .progress__num { color: var(--evx-warm-black); }
  .progress__num { color: var(--evx-ink-soft); }

  .progress__label {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }

  /* Form (shared) */
  .form-wrap { max-width: 640px; display: flex; flex-direction: column; gap: var(--evx-space-2xl); }
  .form-wrap--wide { max-width: 960px; }

  .form-header { display: flex; flex-direction: column; gap: var(--evx-space-md); }

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

  .field-select { -webkit-appearance: none; cursor: pointer; padding-right: 24px; background-image: linear-gradient(45deg, transparent 50%, var(--evx-ink-soft) 50%), linear-gradient(135deg, var(--evx-ink-soft) 50%, transparent 50%); background-position: calc(100% - 12px) 50%, calc(100% - 8px) 50%; background-size: 4px 4px; background-repeat: no-repeat; }

  .field-textarea { resize: vertical; min-height: 160px; line-height: 1.6; }
  .field-hint { color: var(--evx-ink-soft); margin-top: 2px; }

  .field-prefix { display: flex; align-items: baseline; gap: 4px; border-bottom: 1px solid var(--evx-rule-light); }
  .field-prefix .field-input { border-bottom: none; padding-left: 4px; }
  .field-prefix__symbol { color: var(--evx-ink-soft); font-size: 15px; }

  /* Category tiles */
  .cat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-md);
  }

  .cat-tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--evx-space-sm);
    padding: 0;
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: border-color 200ms ease, opacity 200ms ease;
    text-align: left;
  }

  .cat-tile:hover { opacity: 0.85; }

  .cat-tile--selected {
    border-color: var(--evx-fox-orange);
    border-width: 2px;
  }

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

  .cat-tile__desc {
    color: var(--evx-ink-soft);
    padding: 0 var(--evx-space-md) var(--evx-space-md);
  }

  /* Savings preview */
  .savings-preview {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
  }
  .savings-preview__label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .savings-preview__row { display: flex; gap: var(--evx-space-md); align-items: baseline; }
  .savings-preview__price { font-family: var(--evx-font-display); font-size: 22px; font-weight: 500; }
  .savings-preview__orig { font-size: 14px; color: var(--evx-ink-soft); text-decoration: line-through; }
  .savings-preview__save { color: var(--evx-fox-orange); }

  /* Toggle list */
  .toggle-list { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .toggle {
    display: flex;
    align-items: flex-start;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: border-color 200ms ease;
  }
  .toggle:has(.toggle__box:checked) { border-color: var(--evx-warm-black); }

  .toggle__box {
    width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px;
    accent-color: var(--evx-fox-orange);
  }

  .toggle__body { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .toggle__title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .toggle__desc { color: var(--evx-ink-soft); line-height: 1.5; }

  /* Spec rows */
  .spec-list { display: flex; flex-direction: column; gap: var(--evx-space-sm); }

  .spec-row {
    display: grid;
    grid-template-columns: 200px 1fr 40px;
    gap: var(--evx-space-md);
    align-items: center;
  }

  .spec-row__label,
  .spec-row__value {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    outline: none;
  }
  .spec-row__label::placeholder { color: var(--evx-ink-soft); font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }
  .spec-row__value::placeholder { color: var(--evx-ink-soft); }
  .spec-row__label:focus, .spec-row__value:focus { border-bottom-color: var(--evx-warm-black); }

  .spec-row__remove {
    background: none; border: none; cursor: pointer;
    color: var(--evx-ink-soft); font-size: 22px; line-height: 1;
    padding: 0; transition: var(--evx-transition);
  }
  .spec-row__remove:hover { color: var(--evx-fox-orange); }

  .spec-add {
    background: none;
    border: 1px dashed var(--evx-rule-light);
    color: var(--evx-warm-black);
    padding: var(--evx-space-md);
    cursor: pointer;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    transition: var(--evx-transition);
    margin-top: var(--evx-space-sm);
  }
  .spec-add:hover { border-color: var(--evx-warm-black); }

  /* Photos */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-md);
  }

  .photo-tile {
    position: relative;
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .photo-tile--cover { outline: 2px solid var(--evx-fox-orange); outline-offset: -2px; }

  .photo-tile__cover {
    position: absolute;
    top: var(--evx-space-sm);
    left: var(--evx-space-sm);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 6px;
  }

  .photo-tile__num {
    position: absolute;
    bottom: var(--evx-space-sm);
    left: var(--evx-space-sm);
    color: rgba(245, 242, 237, 0.4);
  }

  .photo-tile__placeholder {
    color: rgba(245, 242, 237, 0.4);
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  .photo-tile__remove {
    position: absolute;
    top: var(--evx-space-sm);
    right: var(--evx-space-sm);
    background: rgba(245, 242, 237, 0.15);
    color: var(--evx-paper);
    border: none;
    width: 24px; height: 24px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: background 200ms ease;
  }
  .photo-tile__remove:hover { background: var(--evx-fox-orange); }

  .photo-add {
    aspect-ratio: 5 / 6;
    background: transparent;
    border: 1px dashed var(--evx-rule-light);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--evx-space-sm);
    transition: var(--evx-transition);
    padding: var(--evx-space-md);
  }
  .photo-add:hover { border-color: var(--evx-warm-black); }

  .photo-add__plus { font-size: 32px; color: var(--evx-ink-soft); line-height: 1; }
  .photo-add__text { color: var(--evx-warm-black); }
  .photo-add__hint { color: var(--evx-ink-soft); }

  .photo-info { display: flex; justify-content: space-between; padding-top: var(--evx-space-md); }
  .photo-info__count { color: var(--evx-ink-soft); }
  .photo-info__warn { color: var(--evx-fox-orange); }

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
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--evx-space-md);
  }
  .review__cover-label, .review__cover-empty { color: rgba(245, 242, 237, 0.4); }

  .review__category { color: var(--evx-ink-soft); display: block; }
  .review__title {
    font-family: var(--evx-font-display);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }

  .review__subtitle {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    color: var(--evx-ink-soft);
  }

  .review__price-block {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    margin: var(--evx-space-md) 0;
  }

  .review__price {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .review__orig { font-size: 15px; color: var(--evx-ink-soft); text-decoration: line-through; }

  .review__section { display: flex; flex-direction: column; gap: var(--evx-space-sm); margin-top: var(--evx-space-md); }
  .review__section span { color: var(--evx-ink-soft); }
  .review__desc { font-size: 14px; line-height: 1.75; color: var(--evx-warm-black); white-space: pre-wrap; }

  .review__spec { width: 100%; border-collapse: collapse; margin-top: var(--evx-space-sm); }
  .review__spec tr { border-bottom: 1px solid var(--evx-rule-light); }
  .review__spec-label { color: var(--evx-ink-soft); padding: var(--evx-space-sm) 0; width: 140px; vertical-align: top; }
  .review__spec-val { padding: var(--evx-space-sm) 0; font-size: 14px; }

  .review__side { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .review__side-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
  }

  .review__side-label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-sm); }
  .review__side-line { font-size: 13px; line-height: 1.6; color: var(--evx-ink-soft); margin-bottom: 4px; }
  .review__side-line strong { color: var(--evx-warm-black); font-weight: 500; }
  .review__side-line--warn { color: var(--evx-fox-orange); }

  .review__notice {
    border-left: 2px solid var(--evx-fox-orange);
    padding: var(--evx-space-md);
    background: rgba(232, 116, 44, 0.04);
    font-size: 13px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
  }
  .review__notice strong { color: var(--evx-warm-black); }

  /* Step nav */
  .step-nav {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }

  .step-nav--split { justify-content: space-between; }

  .step-nav__right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .step-nav__count { color: var(--evx-ink-soft); }

  .evx-btn:disabled { opacity: 0.40; cursor: not-allowed; }
  .evx-btn:disabled:hover { opacity: 0.40; }

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
    .step-nav__right { justify-content: space-between; }
  }
</style>
