<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { auth } from '../lib/auth';
  import {
    applyAsSeller,
    getMySeller,
    sellerStatusLabel,
    type Seller,
  } from '../lib/sellers';

  onMount(async () => {
    applySeo(seo.sellApply());

    // Wait for auth to initialise before deciding what to do
    const waitForInit = () => new Promise<void>(resolve => {
      const unsub = auth.subscribe(s => {
        if (s.initialised) { unsub(); resolve(); }
      });
    });
    await waitForInit();

    // If not signed in: stash return path and bounce to login
    const a = $auth;
    if (!a.user) {
      try { sessionStorage.setItem('eirvox-return-to', '/sell/apply'); } catch {}
      navigate('/login');
      return;
    }

    // If they already have a seller record, fetch it and show status
    existing = await getMySeller();
    if (existing) {
      step = 6; // dedicated "already applied" view
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    initialising = false;
  });

  // ── Multi-step state ───────────────────────────────────────
  let step = 1;
  const TOTAL_STEPS = 5;
  let initialising = true;
  let existing: Seller | null = null;
  let submitting = false;
  let submitError = '';

  // Step 1 — Business info
  let tradingName = '';
  let handle = '';
  let email = '';
  let phone = '';
  let city = '';
  let tradingSince = '';

  // Step 2 — Category & inventory
  let primaryCategory = '';
  let whatYouSell = '';
  let inventoryCount = '';
  let priceRangeLow = '';
  let priceRangeHigh = '';
  let sourcingMethod = '';

  // Step 3 — Tier
  let tier: 'verified' | 'atelier' = 'atelier';

  // Step 4 — Agreement
  let agreedId = false;
  let agreedTerms = false;
  let agreedCall = false;

  // ── Validation ─────────────────────────────────────────────
  $: step1Valid = tradingName.trim() && email.trim() && phone.trim() && city.trim();
  $: step2Valid = primaryCategory && whatYouSell.trim().length >= 30 && inventoryCount && sourcingMethod.trim();
  $: step3Valid = tier === 'verified' || tier === 'atelier';
  $: step4Valid = agreedId && agreedTerms && agreedCall;

  $: canProceed = (
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid)
  );

  function next() {
    if (canProceed && step < TOTAL_STEPS) step++;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function prev() {
    if (step > 1) step--;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  async function submit() {
    if (!step4Valid || submitting) return;
    submitError = '';
    submitting = true;

    const result = await applyAsSeller({
      trading_name: tradingName,
      handle: handle.trim() || undefined,
      email,
      phone,
      city,
      trading_since: tradingSince || undefined,
      primary_category: primaryCategory,
      what_they_sell: whatYouSell,
      inventory_count: inventoryCount,
      price_low: priceRangeLow ? Number(priceRangeLow) : null,
      price_high: priceRangeHigh ? Number(priceRangeHigh) : null,
      sourcing_method: sourcingMethod,
      tier,
    });

    submitting = false;

    if (!result.ok) {
      submitError = result.error ?? 'Could not submit your application. Try again.';
      return;
    }
    existing = result.data ?? null;
    step = 5;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const categories = [
    { value: 'automotive',    label: 'Automotive' },
    { value: 'watches',       label: 'Watches' },
    { value: 'fashion',       label: 'Fashion' },
    { value: 'tech',          label: 'Tech' },
    { value: 'home-design',   label: 'Home & Design' },
    { value: 'audio-vinyl',   label: 'Audio & Vinyl' },
    { value: 'art',           label: 'Art' },
  ];

  const inventoryOptions = [
    { value: '1-5',    label: '1–5 items' },
    { value: '6-20',   label: '6–20 items' },
    { value: '21-50',  label: '21–50 items' },
    { value: '50+',    label: '50+ items' },
  ];

  // ── Step labels for progress ───────────────────────────────
  const stepLabels = [
    'Business',
    'Category',
    'Tier',
    'Agreement',
    'Submitted',
  ];
</script>

<Nav />

<main id="main-content" class="apply-page">
  <div class="page-container">

    <!-- Header -->
    <header class="apply-header">
      <button class="apply-back evx-caption" on:click={() => navigate('/sell')}>
        ← Back to seller info
      </button>

      {#if step < 5}
        <div class="apply-meta">
          <span class="evx-caption apply-cohort">COHORT 03 · OPEN UNTIL 14 JUNE</span>
        </div>
        <h1 class="apply-title">Sell on Éirvox.</h1>
        <p class="apply-sub">
          A short application — five steps, about three minutes.
          Cohort 03 reviews close 14 June; approved sellers go live on 01 July.
        </p>
      {/if}
    </header>

    <!-- Progress -->
    {#if step < 5}
      <nav class="progress" aria-label="Application progress">
        {#each stepLabels.slice(0, 4) as label, i}
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

    <!-- ════ STEP 1 · BUSINESS INFO ════ -->
    {#if step === 1}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">Who's selling?</h2>
          <p class="form-sub">
            We use this to set up your seller profile and verify your account.
            Phone and ID verification happens after approval.
          </p>
        </div>

        <div class="form-grid">
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-name">TRADING NAME</label>
              <input id="f-name" type="text" class="field-input" placeholder="Moss &amp; Co." bind:value={tradingName} required />
              <span class="field-hint evx-caption">The name buyers see on your listings.</span>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-handle">HANDLE (OPTIONAL)</label>
              <input id="f-handle" type="text" class="field-input" placeholder="@mossco" bind:value={handle} />
              <span class="field-hint evx-caption">For your future shop URL — /s/your-handle.</span>
            </div>
          </div>

          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-email">EMAIL</label>
              <input id="f-email" type="email" class="field-input" placeholder="hello@moss.co" bind:value={email} required />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-phone">PHONE</label>
              <input id="f-phone" type="tel" class="field-input" placeholder="+353 85 …" bind:value={phone} required />
              <span class="field-hint evx-caption">Irish or Northern Irish number for SMS verification.</span>
            </div>
          </div>

          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-city">CITY / AREA</label>
              <input id="f-city" type="text" class="field-input" placeholder="Dublin 4" bind:value={city} required />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-since">TRADING SINCE (OPTIONAL)</label>
              <input id="f-since" type="text" class="field-input" placeholder="2023" bind:value={tradingSince} />
            </div>
          </div>
        </div>

        <div class="step-nav">
          <span class="evx-caption step-nav__count">Step 1 of 4</span>
          <button class="evx-btn evx-btn--primary" on:click={next} disabled={!step1Valid}>
            Continue →
          </button>
        </div>
      </div>

    <!-- ════ STEP 2 · CATEGORY & INVENTORY ════ -->
    {:else if step === 2}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">What are you selling?</h2>
          <p class="form-sub">
            Tell us about your inventory. The more specific you are, the easier the review.
          </p>
        </div>

        <div class="form-grid">
          <div class="field">
            <label class="evx-caption field-label" for="f-category">PRIMARY CATEGORY</label>
            <select id="f-category" class="field-input field-select" bind:value={primaryCategory} required>
              <option value="">Select a category…</option>
              {#each categories as cat}
                <option value={cat.value}>{cat.label}</option>
              {/each}
            </select>
            <span class="field-hint evx-caption">Your main vertical. You can list across categories once approved.</span>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="f-pitch">WHAT DO YOU SELL, AND WHY DOES IT BELONG ON ÉIRVOX?</label>
            <textarea
              id="f-pitch"
              class="field-input field-textarea"
              placeholder="Modern Tudor, Omega and Cartier with full sets, sourced through a Dublin AD network. Verified service records on every piece…"
              bind:value={whatYouSell}
              rows="5"
              required
            ></textarea>
            <span class="field-hint evx-caption">
              {whatYouSell.trim().length} / 30 minimum characters
            </span>
          </div>

          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-inventory">ESTIMATED INVENTORY</label>
              <select id="f-inventory" class="field-input field-select" bind:value={inventoryCount} required>
                <option value="">Select…</option>
                {#each inventoryOptions as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-source">SOURCING METHOD</label>
              <input id="f-source" type="text" class="field-input" placeholder="e.g. authorised dealer network, personal collection, trade-ins" bind:value={sourcingMethod} required />
            </div>
          </div>

          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-low">PRICE RANGE — FROM (OPTIONAL)</label>
              <div class="field-prefix">
                <span class="field-prefix__symbol">€</span>
                <input id="f-low" type="number" class="field-input" placeholder="100" bind:value={priceRangeLow} />
              </div>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-high">PRICE RANGE — TO (OPTIONAL)</label>
              <div class="field-prefix">
                <span class="field-prefix__symbol">€</span>
                <input id="f-high" type="number" class="field-input" placeholder="5000" bind:value={priceRangeHigh} />
              </div>
            </div>
          </div>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 2 of 4</span>
            <button class="evx-btn evx-btn--primary" on:click={next} disabled={!step2Valid}>
              Continue →
            </button>
          </div>
        </div>
      </div>

    <!-- ════ STEP 3 · TIER ════ -->
    {:else if step === 3}
      <div class="form-wrap form-wrap--wide">
        <div class="form-header">
          <h2 class="form-h2">Pick a tier.</h2>
          <p class="form-sub">
            You can change later. Atelier is the recommended path for most sellers — the €19/mo subscription pays for itself
            on a single sale, and you get a custom shop page and unlimited listings.
          </p>
        </div>

        <div class="tier-pick">
          <button
            type="button"
            class="tier-pick__card"
            class:tier-pick__card--selected={tier === 'verified'}
            on:click={() => tier = 'verified'}
          >
            <div class="tier-pick__head">
              <span class="evx-caption tier-pick__num">TIER 03</span>
              <span class="evx-caption tier-pick__check" aria-hidden="true">
                {tier === 'verified' ? '●' : '○'}
              </span>
            </div>
            <h3 class="tier-pick__name">Verified</h3>
            <p class="tier-pick__price">€0/mo · 7% commission</p>
            <ul class="tier-pick__features">
              <li>+ ID + phone verified</li>
              <li>+ Up to 10 active listings</li>
              <li>+ Reservation deposits on every sale</li>
              <li>+ Standard listing tools</li>
              <li class="tier-pick__neg">— No shop page</li>
            </ul>
            <p class="tier-pick__pitch evx-caption">
              Best for new entrants proving themselves before moving to Atelier.
            </p>
          </button>

          <button
            type="button"
            class="tier-pick__card tier-pick__card--dark"
            class:tier-pick__card--selected={tier === 'atelier'}
            on:click={() => tier = 'atelier'}
          >
            <span class="tier-pick__rec evx-caption">RECOMMENDED</span>
            <div class="tier-pick__head">
              <span class="evx-caption tier-pick__num tier-pick__num--light">TIER 02</span>
              <span class="evx-caption tier-pick__check tier-pick__check--light" aria-hidden="true">
                {tier === 'atelier' ? '●' : '○'}
              </span>
            </div>
            <h3 class="tier-pick__name tier-pick__name--light">Atelier</h3>
            <p class="tier-pick__price tier-pick__price--light">€19/mo · 5% commission</p>
            <ul class="tier-pick__features tier-pick__features--light">
              <li>+ Everything in Verified</li>
              <li>+ Custom shop page · /s/your-handle</li>
              <li>+ Unlimited listings</li>
              <li>+ Bulk listing CSV import</li>
              <li>+ Detailed sales analytics</li>
              <li>+ Priority support</li>
            </ul>
            <p class="tier-pick__pitch evx-caption tier-pick__pitch--light">
              Serious sellers. Pays for itself on the first transaction over €380.
            </p>
          </button>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 3 of 4</span>
            <button class="evx-btn evx-btn--primary" on:click={next}>
              Continue →
            </button>
          </div>
        </div>
      </div>

    <!-- ════ STEP 4 · AGREEMENT ════ -->
    {:else if step === 4}
      <div class="form-wrap">
        <div class="form-header">
          <h2 class="form-h2">Confirm the basics.</h2>
          <p class="form-sub">
            Three checkboxes. Read them carefully — they're how the platform stays clean.
          </p>
        </div>

        <div class="agree-list">
          <label class="agree-item" class:agree-item--checked={agreedId}>
            <input type="checkbox" class="agree-item__box" bind:checked={agreedId} />
            <div class="agree-item__body">
              <strong class="agree-item__title">ID + phone verification.</strong>
              <p class="agree-item__desc">
                You agree to verify your phone number by SMS and provide a government-issued ID before your first listing goes live.
                We do not display either to buyers.
              </p>
            </div>
          </label>

          <label class="agree-item" class:agree-item--checked={agreedTerms}>
            <input type="checkbox" class="agree-item__box" bind:checked={agreedTerms} />
            <div class="agree-item__body">
              <strong class="agree-item__title">ÉIRVOX Seller Terms.</strong>
              <p class="agree-item__desc">
                You agree to the seller terms — accurate listings, honest condition reports, prompt shipping, and dispute resolution
                through the platform. Full terms at the link below.
              </p>
              <button type="button" class="agree-item__link evx-caption" on:click={() => navigate('/trust')}>
                Read Seller Terms →
              </button>
            </div>
          </label>

          <label class="agree-item" class:agree-item--checked={agreedCall}>
            <input type="checkbox" class="agree-item__box" bind:checked={agreedCall} />
            <div class="agree-item__body">
              <strong class="agree-item__title">Short video call.</strong>
              <p class="agree-item__desc">
                If your application is shortlisted, we'll book a 15-minute video call to talk through your inventory.
                This is how we keep the cohort small and the listing quality high.
              </p>
            </div>
          </label>
        </div>

        <!-- Summary -->
        <div class="apply-summary">
          <span class="evx-label apply-summary__label">YOUR APPLICATION</span>
          <dl class="apply-summary__list">
            <dt class="apply-summary__dt">Trading name</dt>
            <dd class="apply-summary__dd">{tradingName || '—'}</dd>

            <dt class="apply-summary__dt">Email</dt>
            <dd class="apply-summary__dd">{email || '—'}</dd>

            <dt class="apply-summary__dt">Location</dt>
            <dd class="apply-summary__dd">{city || '—'}</dd>

            <dt class="apply-summary__dt">Category</dt>
            <dd class="apply-summary__dd">{primaryCategory || '—'}</dd>

            <dt class="apply-summary__dt">Inventory</dt>
            <dd class="apply-summary__dd">{inventoryCount || '—'}</dd>

            <dt class="apply-summary__dt">Tier</dt>
            <dd class="apply-summary__dd">{tier === 'atelier' ? 'Atelier · €19/mo · 5%' : 'Verified · €0/mo · 7%'}</dd>
          </dl>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 4 of 4</span>
            <button class="evx-btn evx-btn--primary" on:click={submit} disabled={!step4Valid || submitting}>
              {submitting ? 'Submitting…' : 'Submit application →'}
            </button>
          </div>
        </div>

        {#if submitError}
          <div class="apply-error" role="alert">
            <span class="evx-label">ERROR</span>
            <p>{submitError}</p>
          </div>
        {/if}
      </div>

    <!-- ════ STEP 5 · CONFIRMATION (just submitted) ════ -->
    {:else if step === 5}
      <div class="confirm">
        <span class="evx-label confirm__label">APPLICATION RECEIVED</span>
        <h2 class="confirm__h">
          We'll be in touch within
          <em class="confirm__italic">48 hours.</em>
        </h2>
        <p class="confirm__body">
          Your application is in front of the cohort review team.
          We respond to every applicant — usually within 48 hours, occasionally up to 5 working days
          during high-volume weeks.
        </p>

        <div class="confirm__next">
          <span class="evx-label confirm__next-label">WHAT HAPPENS NEXT</span>
          <ol class="confirm__steps">
            <li class="confirm__step">
              <span class="evx-label confirm__step-num">01</span>
              <span><strong>Review.</strong> We read your application and look at your sourcing pitch.</span>
            </li>
            <li class="confirm__step">
              <span class="evx-label confirm__step-num">02</span>
              <span><strong>Shortlist call.</strong> If you're shortlisted, we book a 15-minute video call.</span>
            </li>
            <li class="confirm__step">
              <span class="evx-label confirm__step-num">03</span>
              <span><strong>Verification.</strong> Phone SMS + ID upload. Takes 10 minutes.</span>
            </li>
            <li class="confirm__step">
              <span class="evx-label confirm__step-num">04</span>
              <span><strong>Go live.</strong> Cohort 03 sellers go live on 01 July 2026.</span>
            </li>
          </ol>
        </div>

        <div class="confirm__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/dashboard')}>
            View your dashboard →
          </button>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/')}>
            Back to marketplace
          </button>
        </div>
      </div>

    <!-- ════ STEP 6 · ALREADY APPLIED ════ -->
    {:else if existing}
      <div class="confirm">
        <span class="evx-label confirm__label">
          {existing.status === 'approved' ? 'APPROVED' :
           existing.status === 'rejected' ? 'NOT APPROVED' :
           existing.status === 'suspended' ? 'ACCOUNT SUSPENDED' :
           'APPLICATION ON FILE'}
        </span>
        <h2 class="confirm__h">
          {#if existing.status === 'approved'}
            You're in.
            <em class="confirm__italic">Welcome to ÉIRVOX.</em>
          {:else if existing.status === 'rejected'}
            We weren't able to approve this round.
          {:else if existing.status === 'suspended'}
            Your seller account is paused.
          {:else}
            We've already received your application.
          {/if}
        </h2>

        <div class="apply-status">
          <span class="evx-label apply-status__label">STATUS</span>
          <div class="apply-status__row">
            <span class="apply-status__pill apply-status__pill--{existing.status}">
              <span class="apply-status__dot"></span>
              {sellerStatusLabel[existing.status]}
            </span>
            <span class="evx-caption apply-status__date">
              Submitted {new Date(existing.applied_at).toLocaleDateString('en-IE')}
            </span>
          </div>
          <dl class="apply-status__details">
            <dt>Trading name</dt><dd>{existing.trading_name}</dd>
            <dt>Tier</dt><dd>{existing.tier === 'atelier' ? 'Atelier · €19/mo · 5%' : existing.tier === 'verified' ? 'Verified · €0/mo · 7%' : 'House · invite'}</dd>
            <dt>Category</dt><dd>{existing.primary_category ?? '—'}</dd>
            <dt>City</dt><dd>{existing.city ?? '—'}</dd>
          </dl>
        </div>

        {#if existing.status === 'pending'}
          <p class="confirm__body">
            We review every application — usually within 48 hours, occasionally up to 5 working days during
            high-volume weeks. We'll email you the moment there's a decision.
          </p>
        {:else if existing.status === 'rejected'}
          <p class="confirm__body">
            We didn't approve your application this time, but you can apply again in the next cohort.
            If you'd like a quick note on why, email <a href="mailto:renato@eirvox.ie" class="apply-link">renato@eirvox.ie</a>.
          </p>
        {:else if existing.status === 'suspended'}
          <p class="confirm__body">
            Your account is currently paused. Please email <a href="mailto:renato@eirvox.ie" class="apply-link">renato@eirvox.ie</a> to discuss next steps.
          </p>
        {/if}

        <div class="confirm__actions">
          {#if existing.status === 'approved'}
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/dashboard')}>
              Open your dashboard →
            </button>
            <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/create')}>
              Create a listing
            </button>
          {:else}
            <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/dashboard')}>
              View your dashboard →
            </button>
            <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/')}>
              Back to marketplace
            </button>
          {/if}
        </div>
      </div>
    {/if}

  </div>
</main>

<Footer />

<style>
  .apply-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .apply-header { padding-top: var(--evx-space-2xl); margin-bottom: var(--evx-space-xl); }

  .apply-back {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    display: block; margin-bottom: var(--evx-space-xl);
    transition: var(--evx-transition);
  }
  .apply-back:hover { color: var(--evx-warm-black); }

  .apply-meta { margin-bottom: var(--evx-space-md); }
  .apply-cohort { color: var(--evx-fox-orange); }

  .apply-title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .apply-sub {
    font-size: 16px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 560px;
  }

  /* Progress */
  .progress {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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

  /* Form */
  .form-wrap {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
  }

  .form-wrap--wide { max-width: 880px; }

  .form-header { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .form-h2 {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }

  .form-sub { font-size: 15px; line-height: 1.7; color: var(--evx-ink-soft); }

  .form-grid {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
  }

  .form-row {
    display: grid;
    gap: var(--evx-space-xl);
  }
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

  .field-select { -webkit-appearance: none; cursor: pointer; padding-right: 24px; background-image: linear-gradient(45deg, transparent 50%, var(--evx-ink-soft) 50%), linear-gradient(135deg, var(--evx-ink-soft) 50%, transparent 50%); background-position: calc(100% - 12px) 50%, calc(100% - 8px) 50%; background-size: 4px 4px; background-repeat: no-repeat; }

  .field-textarea { resize: vertical; min-height: 120px; line-height: 1.6; }

  .field-hint { color: var(--evx-ink-soft); margin-top: 2px; }

  .field-prefix { display: flex; align-items: baseline; gap: 4px; border-bottom: 1px solid var(--evx-rule-light); }
  .field-prefix .field-input { border-bottom: none; padding-left: 4px; }
  .field-prefix__symbol { color: var(--evx-ink-soft); font-size: 15px; }

  /* Tier picker */
  .tier-pick {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-md);
  }

  .tier-pick__card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    background: transparent;
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: border-color 200ms ease, opacity 200ms ease;
  }

  .tier-pick__card:hover { opacity: 0.92; }

  .tier-pick__card--selected {
    border-color: var(--evx-fox-orange);
    border-width: 2px;
    padding: calc(var(--evx-space-xl) - 1px);
  }

  .tier-pick__card--dark {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    border-color: var(--evx-warm-black);
  }
  .tier-pick__card--dark.tier-pick__card--selected {
    border-color: var(--evx-fox-orange);
  }

  .tier-pick__rec {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 8px;
  }

  .tier-pick__head { display: flex; justify-content: space-between; align-items: center; }
  .tier-pick__num { color: var(--evx-ink-soft); }
  .tier-pick__num--light { color: rgba(245, 242, 237, 0.5); }
  .tier-pick__check { color: var(--evx-fox-orange); font-size: 16px; }
  .tier-pick__check--light { color: var(--evx-fox-orange); }

  .tier-pick__name {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
  }
  .tier-pick__name--light { color: var(--evx-paper); }

  .tier-pick__price { font-size: 14px; color: var(--evx-ink-soft); }
  .tier-pick__price--light { color: rgba(245, 242, 237, 0.6); }

  .tier-pick__features {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    font-size: 13px;
    line-height: 1.5;
    color: var(--evx-warm-black);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    flex: 1;
  }
  .tier-pick__features--light {
    color: var(--evx-paper);
    border-color: var(--evx-rule-dark);
  }

  .tier-pick__neg { opacity: 0.50; }

  .tier-pick__pitch { color: var(--evx-ink-soft); line-height: 1.6; }
  .tier-pick__pitch--light { color: rgba(245, 242, 237, 0.6); }

  /* Agreement step */
  .agree-list { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .agree-item {
    display: flex;
    gap: var(--evx-space-md);
    padding: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    transition: border-color 200ms ease, background 200ms ease;
  }

  .agree-item--checked {
    border-color: var(--evx-fox-orange);
    background: rgba(232, 116, 44, 0.04);
  }

  .agree-item__box {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    accent-color: var(--evx-fox-orange);
    margin-top: 3px;
  }

  .agree-item__body { display: flex; flex-direction: column; gap: var(--evx-space-xs); }

  .agree-item__title {
    font-family: var(--evx-font-display);
    font-size: 15px;
    font-weight: 500;
    color: var(--evx-warm-black);
    display: block;
  }

  .agree-item__desc { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }

  .agree-item__link {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-align: left;
    margin-top: var(--evx-space-xs);
  }

  /* Application summary */
  .apply-summary {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    background: rgba(0, 0, 0, 0.02);
  }

  .apply-summary__label { display: block; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }

  .apply-summary__list {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: var(--evx-space-sm) var(--evx-space-lg);
  }

  .apply-summary__dt { font-family: var(--evx-font-mono); font-size: 11px; color: var(--evx-ink-soft); letter-spacing: 0.04em; padding-top: 2px; }
  .apply-summary__dd { font-size: 14px; color: var(--evx-warm-black); }

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

  /* Submit error */
  .apply-error {
    margin-top: var(--evx-space-md);
    padding: var(--evx-space-md);
    border-left: 2px solid var(--evx-fox-orange);
    background: rgba(232, 116, 44, 0.06);
    display: flex; flex-direction: column;
    gap: var(--evx-space-xs);
  }
  .apply-error span { color: var(--evx-fox-orange); }
  .apply-error p { font-size: 14px; line-height: 1.6; color: var(--evx-warm-black); }

  /* Existing-status panel */
  .apply-status {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
  }
  .apply-status__label { color: var(--evx-ink-soft); }
  .apply-status__row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--evx-space-sm); }
  .apply-status__pill {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    padding: 4px 10px;
    border: 1px solid currentColor;
    color: var(--evx-ink-soft);
  }
  .apply-status__pill--pending   { color: var(--evx-fox-orange); }
  .apply-status__pill--approved  { color: #4a8c5b; }
  .apply-status__pill--rejected  { color: var(--evx-ink-soft); }
  .apply-status__pill--suspended { color: var(--evx-ink-soft); }
  .apply-status__dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }
  .apply-status__date { color: var(--evx-ink-soft); }
  .apply-status__details {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: var(--evx-space-xs) var(--evx-space-md);
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }
  .apply-status__details dt { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--evx-ink-soft); padding-top: 2px; text-transform: uppercase; }
  .apply-status__details dd { font-size: 14px; color: var(--evx-warm-black); }
  .apply-link { color: var(--evx-warm-black); text-decoration: underline; text-underline-offset: 3px; }

  /* Confirmation */
  .confirm {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-2xl);
  }

  .confirm__label { color: var(--evx-fox-orange); }

  .confirm__h {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.1;
    color: var(--evx-warm-black);
  }

  .confirm__italic {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
  }

  .confirm__body { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); }

  .confirm__next {
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-xl);
  }

  .confirm__next-label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-lg); }

  .confirm__steps { display: flex; flex-direction: column; gap: 0; }

  .confirm__step {
    display: flex;
    gap: var(--evx-space-lg);
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px;
    line-height: 1.6;
    color: var(--evx-ink-soft);
  }

  .confirm__step strong { color: var(--evx-warm-black); font-weight: 500; }
  .confirm__step-num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }

  .confirm__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; padding-top: var(--evx-space-md); }

  @media (max-width: 767px) {
    .form-row--2 { grid-template-columns: 1fr; }
    .tier-pick { grid-template-columns: 1fr; }
    .progress { grid-template-columns: repeat(2, 1fr); }
    .step-nav--split { flex-direction: column; align-items: stretch; gap: var(--evx-space-md); }
    .step-nav__right { justify-content: space-between; }
    .apply-summary__list { grid-template-columns: 1fr; gap: var(--evx-space-xs); }
    .apply-summary__dt { padding-top: var(--evx-space-sm); }
  }
</style>
