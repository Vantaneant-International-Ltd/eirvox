<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { getTradeCategories, type TradeCategory } from '../lib/api';

  let tradeCategories: TradeCategory[] = [];

  onMount(async () => {
    applySeo({
      title: 'List your trade · TRADE',
      description: 'Apply to list on ÉIRVOX TRADE. Five steps, three minutes. ID + credentials verified. Flat monthly fee.',
      path: '/trade/apply',
    });
    tradeCategories = await getTradeCategories();
  });

  let step = 1;
  const TOTAL_STEPS = 5;

  // Step 1 — personal
  let fullName = '';
  let phone = '';
  let email = '';
  let county = '';
  let town = '';

  // Step 2 — trade
  let tradeSlug = '';
  let years = '';
  let qualifications: string[] = [];
  let qualificationOther = '';
  let bio = '';
  let insuranceProvider = '';

  const commonQuals = [
    'Safe Electric Registered',
    'RECI Registered',
    'Gas Networks Ireland (RGI)',
    'SEAI Approved',
    'SOLAS QQI Level 6',
    'City & Guilds',
    'Coded Welder',
    'WaterMark Approved',
  ];

  function toggleQual(q: string) {
    if (qualifications.includes(q)) qualifications = qualifications.filter(x => x !== q);
    else qualifications = [...qualifications, q];
  }

  // Step 3 — plan
  let plan: 'listed' | 'pro' = 'pro';

  // Step 4 — agreement
  let agreedId = false;
  let agreedCreds = false;
  let agreedTerms = false;

  // ── Validation ─────
  $: step1Valid = fullName.trim() && phone.trim() && email.trim() && county.trim() && town.trim();
  $: step2Valid = tradeSlug && years && qualifications.length > 0 && bio.trim().length >= 30;
  $: step3Valid = !!plan;
  $: step4Valid = agreedId && agreedCreds && agreedTerms;

  $: canProceed = (
    (step === 1 && step1Valid) ||
    (step === 2 && step2Valid) ||
    (step === 3 && step3Valid) ||
    (step === 4 && step4Valid)
  );

  function next() {
    if (canProceed && step < TOTAL_STEPS) {
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
    if (step4Valid) step = 5;
  }

  const stepLabels = ['Personal', 'Trade', 'Plan', 'Verification', 'Submitted'];
</script>

<Nav />

<main id="main-content" class="ta-page">
  <div class="page-container">

    <!-- Header -->
    <header class="ta-header">
      <button class="ta-back evx-caption" on:click={() => navigate('/trade')}>
        ← Back to TRADE
      </button>

      {#if step < 5}
        <span class="evx-caption ta-meta">TRADE · APPLICATION · 5 STEPS</span>
        <h1 class="ta-title">List your trade.</h1>
        <p class="ta-sub">
          ÉIRVOX TRADE is a verified directory — ID-checked, credential-verified, admitted by application.
          Five short steps, then a 15-minute video call to confirm your identity and qualifications.
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

    <!-- ═══ STEP 1 · PERSONAL ═══ -->
    {#if step === 1}
      <div class="form-wrap">
        <div class="form-h">
          <h2 class="form-h2">About you.</h2>
          <p class="form-sub">
            We use this to verify your identity. None of it appears on your profile unless you choose.
          </p>
        </div>

        <div class="form-grid">
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-name">FULL NAME</label>
              <input id="f-name" type="text" class="field-input" placeholder="Seán Murphy" bind:value={fullName} required />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-phone">PHONE</label>
              <input id="f-phone" type="tel" class="field-input" placeholder="085 123 4567" bind:value={phone} required />
            </div>
          </div>
          <div class="field">
            <label class="evx-caption field-label" for="f-email">EMAIL</label>
            <input id="f-email" type="email" class="field-input" placeholder="hello@your-trade.ie" bind:value={email} required />
          </div>
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-county">COUNTY</label>
              <input id="f-county" type="text" class="field-input" placeholder="Dublin" bind:value={county} required />
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-town">TOWN / AREA</label>
              <input id="f-town" type="text" class="field-input" placeholder="Stillorgan" bind:value={town} required />
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

    <!-- ═══ STEP 2 · TRADE ═══ -->
    {:else if step === 2}
      <div class="form-wrap">
        <div class="form-h">
          <h2 class="form-h2">Your trade.</h2>
          <p class="form-sub">
            Be specific about your work and your qualifications. Buyers respect detail; the review
            team need it to verify.
          </p>
        </div>

        <div class="form-grid">
          <div class="form-row form-row--2">
            <div class="field">
              <label class="evx-caption field-label" for="f-trade">TRADE CATEGORY</label>
              <select id="f-trade" class="field-input field-select" bind:value={tradeSlug} required>
                <option value="">Select…</option>
                {#each tradeCategories as cat}
                  <option value={cat.slug}>{cat.name}</option>
                {/each}
              </select>
            </div>
            <div class="field">
              <label class="evx-caption field-label" for="f-years">YEARS OF EXPERIENCE</label>
              <input id="f-years" type="number" class="field-input" placeholder="12" bind:value={years} required />
            </div>
          </div>

          <div class="field">
            <span class="evx-caption field-label">QUALIFICATIONS / CERTIFICATIONS</span>
            <div class="quals-grid">
              {#each commonQuals as q}
                <label class="qual-chip" class:qual-chip--checked={qualifications.includes(q)}>
                  <input
                    type="checkbox"
                    class="qual-chip__box"
                    checked={qualifications.includes(q)}
                    on:change={() => toggleQual(q)}
                  />
                  <span>{q}</span>
                </label>
              {/each}
            </div>
            <input
              type="text"
              class="field-input"
              placeholder="Other qualifications — comma separated"
              bind:value={qualificationOther}
              style="margin-top: 8px;"
            />
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="f-bio">BIO / DESCRIPTION OF YOUR WORK</label>
            <textarea
              id="f-bio"
              class="field-input field-textarea"
              bind:value={bio}
              placeholder="What you specialise in, the kinds of jobs you do, what makes you worth hiring. Plain English — buyers can tell."
              rows="5"
              required
            ></textarea>
            <span class="field-hint evx-caption">{bio.trim().length} / 30 minimum characters</span>
          </div>

          <div class="field">
            <label class="evx-caption field-label" for="f-ins">INSURANCE PROVIDER (OPTIONAL)</label>
            <input id="f-ins" type="text" class="field-input" placeholder="e.g. AXA, Allianz" bind:value={insuranceProvider} />
            <span class="field-hint evx-caption">Required for jobs over €5,000. Verified at admission.</span>
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

    <!-- ═══ STEP 3 · PLAN ═══ -->
    {:else if step === 3}
      <div class="form-wrap form-wrap--wide">
        <div class="form-h">
          <h2 class="form-h2">Pick a plan.</h2>
          <p class="form-sub">
            Pro pays for itself the first time you win a job from the platform.
            Listed is for tradespeople testing the directory.
          </p>
        </div>

        <div class="plan-pick">
          <button
            type="button"
            class="plan-card"
            class:plan-card--selected={plan === 'listed'}
            on:click={() => plan = 'listed'}
          >
            <div class="plan-card__head">
              <span class="evx-caption plan-card__num">LISTED</span>
              <span class="evx-caption plan-card__check">{plan === 'listed' ? '●' : '○'}</span>
            </div>
            <h3 class="plan-card__name">€9 <em>/mo</em></h3>
            <ul class="plan-card__list">
              <li>+ Profile page · verification badge</li>
              <li>+ Up to 4 work photos</li>
              <li>+ One county coverage</li>
              <li>+ Customer reviews</li>
              <li>+ Masked phone contact</li>
              <li class="plan-card__neg">— No featured placement</li>
              <li class="plan-card__neg">— No quote request form</li>
            </ul>
          </button>

          <button
            type="button"
            class="plan-card plan-card--dark"
            class:plan-card--selected={plan === 'pro'}
            on:click={() => plan = 'pro'}
          >
            <span class="plan-card__rec evx-caption">RECOMMENDED</span>
            <div class="plan-card__head">
              <span class="evx-caption plan-card__num plan-card__num--light">PRO</span>
              <span class="evx-caption plan-card__check plan-card__check--light">{plan === 'pro' ? '●' : '○'}</span>
            </div>
            <h3 class="plan-card__name plan-card__name--light">€29 <em>/mo</em></h3>
            <ul class="plan-card__list plan-card__list--light">
              <li>+ Everything in Listed</li>
              <li>+ Up to 12 work photos</li>
              <li>+ Unlimited county coverage</li>
              <li>+ Featured in category</li>
              <li>+ Quote request form</li>
              <li>+ Priority in search</li>
            </ul>
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

    <!-- ═══ STEP 4 · VERIFICATION ═══ -->
    {:else if step === 4}
      <div class="form-wrap">
        <div class="form-h">
          <h2 class="form-h2">Verification.</h2>
          <p class="form-sub">
            Three boxes. Read them carefully — they're how TRADE stays a directory worth being on.
          </p>
        </div>

        <div class="agree-list">
          <label class="agree-item" class:agree-item--checked={agreedId}>
            <input type="checkbox" class="agree-item__box" bind:checked={agreedId} />
            <div class="agree-item__body">
              <strong>ID verification.</strong>
              <p>I agree to upload a government-issued ID and a brief video call to confirm my identity before going live.</p>
            </div>
          </label>

          <label class="agree-item" class:agree-item--checked={agreedCreds}>
            <input type="checkbox" class="agree-item__box" bind:checked={agreedCreds} />
            <div class="agree-item__body">
              <strong>Credential check.</strong>
              <p>I agree to provide certificates, registration numbers, or other evidence for the qualifications I've claimed.</p>
            </div>
          </label>

          <label class="agree-item" class:agree-item--checked={agreedTerms}>
            <input type="checkbox" class="agree-item__box" bind:checked={agreedTerms} />
            <div class="agree-item__body">
              <strong>ÉIRVOX TRADE terms.</strong>
              <p>
                I've read and agree to the
                <button type="button" class="agree-item__link" on:click={() => navigate('/terms')}>TRADE terms</button>,
                including the directory model: ÉIRVOX is not my employer, agent, or contractor.
              </p>
            </div>
          </label>
        </div>

        <!-- Summary -->
        <div class="apply-summary">
          <span class="evx-label apply-summary__label">YOUR APPLICATION</span>
          <dl class="apply-summary__list">
            <dt class="apply-summary__dt">Name</dt><dd class="apply-summary__dd">{fullName || '—'}</dd>
            <dt class="apply-summary__dt">Trade</dt><dd class="apply-summary__dd">{tradeCategories.find(c => c.slug === tradeSlug)?.name || '—'}</dd>
            <dt class="apply-summary__dt">Location</dt><dd class="apply-summary__dd">{town}{town && county ? ', ' : ''}{county || '—'}</dd>
            <dt class="apply-summary__dt">Experience</dt><dd class="apply-summary__dd">{years ? `${years} years` : '—'}</dd>
            <dt class="apply-summary__dt">Plan</dt><dd class="apply-summary__dd">{plan === 'pro' ? 'Pro · €29/mo' : 'Listed · €9/mo'}</dd>
            <dt class="apply-summary__dt">Qualifications</dt><dd class="apply-summary__dd">{qualifications.join(' · ') || '—'}</dd>
          </dl>
        </div>

        <div class="step-nav step-nav--split">
          <button class="evx-btn evx-btn--ghost" on:click={prev}>← Back</button>
          <div class="step-nav__right">
            <span class="evx-caption step-nav__count">Step 4 of 4</span>
            <button class="evx-btn evx-btn--primary" on:click={submit} disabled={!step4Valid}>
              Submit application →
            </button>
          </div>
        </div>
      </div>

    <!-- ═══ STEP 5 · CONFIRMATION ═══ -->
    {:else}
      <div class="confirm">
        <span class="evx-label confirm__label">APPLICATION RECEIVED</span>
        <h2 class="confirm__h">
          Application sent.
          <em class="confirm__italic">We review within 48 hours.</em>
        </h2>
        <p class="confirm__body">
          Your application is in front of the TRADE review team. We respond to every applicant —
          usually within 48 hours. If you're shortlisted, we'll book a 15-minute video call to confirm
          your identity and run through your qualifications.
        </p>

        <div class="confirm__next">
          <span class="evx-label confirm__next-label">WHAT HAPPENS NEXT</span>
          <ol class="confirm__steps">
            <li><span class="evx-label confirm__step-num">01</span><span><strong>Review.</strong> We read your application and check your trade against the directory standards.</span></li>
            <li><span class="evx-label confirm__step-num">02</span><span><strong>Video call.</strong> 15 minutes. ID confirmation and a quick chat through your qualifications.</span></li>
            <li><span class="evx-label confirm__step-num">03</span><span><strong>Credential check.</strong> We verify your registrations directly with the issuing body.</span></li>
            <li><span class="evx-label confirm__step-num">04</span><span><strong>Profile build.</strong> Photo uploads, bio polish, listing goes live within 24 hours of approval.</span></li>
          </ol>
        </div>

        <div class="confirm__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => navigate('/trade')}>
            Browse TRADE →
          </button>
          <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/')}>
            Back to marketplace
          </button>
        </div>
      </div>
    {/if}

  </div>
</main>

<Footer />

<style>
  .ta-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .ta-header { padding-top: var(--evx-space-2xl); margin-bottom: var(--evx-space-xl); }
  .ta-back {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    display: block; margin-bottom: var(--evx-space-xl);
    transition: var(--evx-transition);
  }
  .ta-back:hover { color: var(--evx-warm-black); }

  .ta-meta { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .ta-title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 500;
    letter-spacing: -0.025em;
    margin-bottom: var(--evx-space-md);
  }
  .ta-sub { font-size: 16px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 560px; }

  /* Progress (shared) */
  .progress {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
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

  /* Form */
  .form-wrap { max-width: 640px; display: flex; flex-direction: column; gap: var(--evx-space-2xl); }
  .form-wrap--wide { max-width: 880px; }
  .form-h { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .form-h2 {
    font-family: var(--evx-font-display);
    font-size: 28px; font-weight: 500;
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
  .field-select { cursor: pointer; -webkit-appearance: none; }
  .field-textarea { resize: vertical; min-height: 100px; line-height: 1.6; }
  .field-hint { color: var(--evx-ink-soft); margin-top: 2px; }

  /* Quals chips */
  .quals-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--evx-space-sm);
    margin-top: var(--evx-space-sm);
  }
  .qual-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--evx-rule-light);
    cursor: pointer;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-ink-soft);
    transition: var(--evx-transition);
  }
  .qual-chip:hover { color: var(--evx-warm-black); border-color: var(--evx-warm-black); }
  .qual-chip--checked {
    background: var(--evx-fox-orange);
    border-color: var(--evx-fox-orange);
    color: var(--evx-white);
  }
  .qual-chip__box { display: none; }

  /* Plan picker (reuses tier-pick shape) */
  .plan-pick { display: grid; grid-template-columns: 1fr 1fr; gap: var(--evx-space-md); }
  .plan-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
    background: transparent;
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: border-color 200ms ease, opacity 200ms ease;
  }
  .plan-card:hover { opacity: 0.92; }
  .plan-card--selected {
    border-color: var(--evx-fox-orange);
    border-width: 2px;
    padding: calc(var(--evx-space-xl) - 1px);
  }
  .plan-card--dark { background: var(--evx-warm-black); color: var(--evx-paper); border-color: var(--evx-warm-black); }
  .plan-card--dark.plan-card--selected { border-color: var(--evx-fox-orange); }

  .plan-card__rec {
    position: absolute; top: var(--evx-space-md); right: var(--evx-space-md);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 2px 8px;
  }
  .plan-card__head { display: flex; justify-content: space-between; align-items: center; }
  .plan-card__num { color: var(--evx-ink-soft); }
  .plan-card__num--light { color: rgba(245,242,237,0.6); }
  .plan-card__check { color: var(--evx-fox-orange); font-size: 16px; }
  .plan-card__check--light { color: var(--evx-fox-orange); }

  .plan-card__name {
    font-family: var(--evx-font-display);
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
  }
  .plan-card__name em { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; font-size: 18px; color: var(--evx-ink-soft); }
  .plan-card__name--light { color: var(--evx-paper); }
  .plan-card__name--light em { color: rgba(245,242,237,0.6); }

  .plan-card__list {
    flex: 1; display: flex; flex-direction: column;
    gap: var(--evx-space-sm);
    font-size: 13px; line-height: 1.5;
    color: var(--evx-warm-black);
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .plan-card__list--light { color: var(--evx-paper); border-color: var(--evx-rule-dark); }
  .plan-card__neg { opacity: 0.50; }

  /* Agreement */
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
    width: 18px; height: 18px; flex-shrink: 0;
    accent-color: var(--evx-fox-orange);
    margin-top: 3px;
  }
  .agree-item__body { display: flex; flex-direction: column; gap: 4px; }
  .agree-item__body strong { font-family: var(--evx-font-display); font-size: 15px; font-weight: 500; color: var(--evx-warm-black); }
  .agree-item__body p { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }
  .agree-item__link {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Summary */
  .apply-summary { border: 1px solid var(--evx-rule-light); padding: var(--evx-space-lg); background: rgba(0,0,0,0.02); }
  .apply-summary__label { display: block; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-md); }
  .apply-summary__list { display: grid; grid-template-columns: 160px 1fr; gap: var(--evx-space-sm) var(--evx-space-lg); }
  .apply-summary__dt { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--evx-ink-soft); padding-top: 2px; }
  .apply-summary__dd { font-size: 14px; color: var(--evx-warm-black); }

  /* Step nav */
  .step-nav {
    display: flex; justify-content: flex-end; align-items: center;
    gap: var(--evx-space-md);
    padding-top: var(--evx-space-xl);
    border-top: 1px solid var(--evx-rule-light);
  }
  .step-nav--split { justify-content: space-between; }
  .step-nav__right { display: flex; align-items: center; gap: var(--evx-space-md); }
  .step-nav__count { color: var(--evx-ink-soft); }
  .evx-btn:disabled { opacity: 0.40; cursor: not-allowed; }
  .evx-btn:disabled:hover { opacity: 0.40; }

  /* Confirmation */
  .confirm { max-width: 640px; display: flex; flex-direction: column; gap: var(--evx-space-xl); padding-top: var(--evx-space-2xl); }
  .confirm__label { color: var(--evx-fox-orange); }
  .confirm__h {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.05;
  }
  .confirm__italic { font-family: var(--evx-font-editorial); font-style: italic; font-weight: 400; }
  .confirm__body { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); }

  .confirm__next { padding-top: var(--evx-space-xl); border-top: 1px solid var(--evx-rule-light); }
  .confirm__next-label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-lg); }
  .confirm__steps { display: flex; flex-direction: column; }
  .confirm__steps li {
    display: flex; gap: var(--evx-space-lg); align-items: flex-start;
    padding: var(--evx-space-md) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px; line-height: 1.6;
  }
  .confirm__steps li:last-child { border-bottom: none; }
  .confirm__steps strong { color: var(--evx-warm-black); font-weight: 500; }
  .confirm__steps span:not(.confirm__step-num) { color: var(--evx-ink-soft); }
  .confirm__step-num { color: var(--evx-fox-orange); flex-shrink: 0; margin-top: 2px; }

  .confirm__actions { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; padding-top: var(--evx-space-md); }

  @media (max-width: 767px) {
    .form-row--2 { grid-template-columns: 1fr; }
    .plan-pick { grid-template-columns: 1fr; }
    .progress { grid-template-columns: repeat(2, 1fr); }
    .apply-summary__list { grid-template-columns: 1fr; gap: var(--evx-space-xs); }
    .step-nav--split { flex-direction: column; align-items: stretch; gap: var(--evx-space-md); }
  }
</style>
