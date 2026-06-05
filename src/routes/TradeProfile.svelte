<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import {
    getTradespersonBySlug,
    getTradeCategories,
    type Tradesperson,
    type TradeCategory,
  } from '../lib/api';

  export let categorySlug: string;
  export let slug: string;

  let t: Tradesperson | null = null;
  let cat: TradeCategory | null = null;
  let loading = true;

  async function load() {
    loading = true;
    const [person, cats] = await Promise.all([
      getTradespersonBySlug(slug),
      getTradeCategories(),
    ]);
    t = person;
    cat = cats.find(c => c.slug === categorySlug) ?? null;
    if (t && cat) {
      applySeo({
        title: `${t.name} · ${cat.name}`,
        description: `${t.tagline ?? ''} · ${t.years_experience ?? '-'}+ years experience · ÉIRVOX TRADE verified.`,
        path: `/trade/${categorySlug}/${slug}`,
      });
    }
    loading = false;
  }

  $: if (categorySlug && slug) void load();
  onMount(load);

  // Quote form state
  let qName = '';
  let qEmail = '';
  let qPhone = '';
  let qDescription = '';
  let qDates = '';
  let qSubmitted = false;
  let phoneRevealed = false;

  function submitQuote(e: Event) {
    e.preventDefault();
    if (qName.trim() && qEmail.trim() && qDescription.trim().length >= 20) {
      qSubmitted = true;
    }
  }
</script>

<Nav />

<main id="main-content" class="tp-page">
  <div class="page-container">

    {#if loading}
      <div class="tp-404"><span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span></div>
    {:else if !t || !cat}
      <div class="tp-404">
        <span class="evx-label">PROFILE NOT FOUND</span>
        <h1 class="tp-404__h">No matching tradesperson.</h1>
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/trade')}>All trades →</button>
      </div>
    {:else}

      <!-- Breadcrumb -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <button class="breadcrumb__item" on:click={() => navigate('/')}>HOME</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <button class="breadcrumb__item" on:click={() => navigate('/trade')}>TRADE</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <button class="breadcrumb__item" on:click={() => navigate(`/trade/${categorySlug}`)}>{cat.name}</button>
        <span class="breadcrumb__sep evx-caption">/</span>
        <span class="breadcrumb__item breadcrumb__item--current evx-caption">{t.name}</span>
      </nav>

      <!-- Profile header -->
      <header class="tp-header">
        <div class="tp-header__avatar">{t.name.charAt(0)}</div>
        <div class="tp-header__id">
          <div class="tp-header__title-row">
            <h1 class="tp-header__name">{t.name}</h1>
            {#if t.tier === 'pro'}<span class="evx-caption tp-header__pro">PRO</span>{/if}
            {#if t.verified}<span class="evx-caption tp-header__verified">VERIFIED</span>{/if}
          </div>
          {#if t.tagline}<p class="tp-header__tagline">{t.tagline}</p>{/if}
          <div class="tp-header__loc">
            {#if t.town || t.county}
              <span class="evx-caption">{[t.town, t.county].filter(Boolean).join(', ')}</span>
            {/if}
            {#if t.available_now}
              <span class="evx-caption tp-header__avail">● Available now</span>
            {/if}
          </div>
        </div>
        <div class="tp-header__cta">
          <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate(`/trade/${categorySlug}`)}>
            ← All {cat.name.toLowerCase()}
          </button>
        </div>
      </header>

      <!-- Stats row -->
      <div class="tp-stats">
        {#if t.years_experience}
          <div class="tp-stat">
            <span class="tp-stat__val">{t.years_experience}+</span>
            <span class="evx-caption tp-stat__label">YEARS</span>
          </div>
        {/if}
        <div class="tp-stat">
          <span class="tp-stat__val">{t.completed_jobs.toLocaleString('en-IE')}</span>
          <span class="evx-caption tp-stat__label">COMPLETED JOBS</span>
        </div>
        {#if typeof t.rating === 'number' && t.rating > 0}
          <div class="tp-stat">
            <span class="tp-stat__val">★ {t.rating.toFixed(2)}</span>
            <span class="evx-caption tp-stat__label">{t.review_count} REVIEWS</span>
          </div>
        {/if}
        {#if t.response_time}
          <div class="tp-stat">
            <span class="tp-stat__val">{t.response_time}</span>
            <span class="evx-caption tp-stat__label">RESPONSE TIME</span>
          </div>
        {/if}
      </div>

      <!-- Main grid -->
      <div class="tp-body">
        <div class="tp-main">

          <!-- Bio -->
          {#if t.bio}
            <section class="tp-section">
              <h2 class="tp-h">About.</h2>
              <p class="tp-bio">{t.bio}</p>
            </section>
          {/if}

          <!-- Qualifications -->
          {#if t.qualifications.length > 0}
            <section class="tp-section">
              <h2 class="tp-h">Qualifications &amp; certifications.</h2>
              <ul class="tp-quals">
                {#each t.qualifications as q}
                  <li class="tp-qual">
                    <span class="tp-qual__check" aria-hidden="true">✓</span>
                    {q}
                  </li>
                {/each}
              </ul>
            </section>
          {/if}

          <!-- Coverage -->
          {#if t.coverage_areas.length > 0}
            <section class="tp-section">
              <h2 class="tp-h">Coverage areas.</h2>
              <div class="tp-coverage">
                {#each t.coverage_areas as c}
                  <span class="tp-coverage__county">{c}</span>
                {/each}
              </div>
            </section>
          {/if}

        </div>

        <!-- Sidebar: Contact -->
        <aside class="tp-side">

          <!-- v1 is hands-off: ÉIRVOX is the directory, not the broker.
               Tradesperson contact shows directly, buyer reaches out
               off-platform. Same pattern as marketplace listings. -->
          <div class="tp-contact">
            <span class="evx-label tp-contact__label">CONTACT</span>
            <p class="tp-contact__listed-sub">
              Reach {t.name.split(' ')[0]} directly. ÉIRVOX doesn't take messages on their behalf.
            </p>

            <dl class="tp-contact__details">
              {#if t.phone}
                <div class="tp-contact__row">
                  <dt>Phone</dt>
                  <dd><a href={`tel:${t.phone.replace(/\s+/g, '')}`}>{t.phone}</a></dd>
                </div>
              {/if}
              {#if t.email}
                <div class="tp-contact__row">
                  <dt>Email</dt>
                  <dd><a href={`mailto:${t.email}`}>{t.email}</a></dd>
                </div>
              {/if}
              {#if t.town || t.county}
                <div class="tp-contact__row">
                  <dt>Based in</dt>
                  <dd>{[t.town, t.county].filter(Boolean).join(', ')}</dd>
                </div>
              {/if}
              {#if t.response_time}
                <div class="tp-contact__row">
                  <dt>Replies</dt>
                  <dd>{t.response_time.toLowerCase()}</dd>
                </div>
              {/if}
            </dl>

            {#if !t.phone && !t.email}
              <p class="tp-contact__fine evx-caption">
                No contact details on file. Profile is incomplete.
              </p>
            {/if}
          </div>
          {#if false}<!-- legacy form state kept below to silence unused-var warnings -->
            <span>{qName}{qEmail}{qPhone}{qDescription}{qDates}{qSubmitted}{phoneRevealed}</span>
          {/if}

          <!-- Why TRADE? -->
          <div class="tp-side-card">
            <span class="evx-label tp-side-card__label">WHY ÉIRVOX TRADE?</span>
            <ul class="tp-side-card__list">
              <li>+ ID and credentials verified before listing.</li>
              <li>+ Reviews come from real, verified jobs.</li>
              <li>+ Flat monthly fee - no per-lead charges.</li>
              <li>+ ÉIRVOX is a directory, not a contractor.</li>
            </ul>
            <button class="evx-caption tp-side-card__link" on:click={() => navigate('/trade')}>
              About TRADE →
            </button>
          </div>

          <!-- Report -->
          <button class="evx-caption tp-report" on:click={() => navigate('/acceptable-use')}>
            Report this profile →
          </button>
        </aside>
      </div>

    {/if}

  </div>
</main>

<Footer />

<style>
  .tp-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .tp-404 { padding: var(--evx-space-3xl) 0; display: flex; flex-direction: column; gap: var(--evx-space-md); align-items: flex-start; }
  .tp-404 span:first-child { color: var(--evx-fox-orange); }
  .tp-404__h { font-family: var(--evx-font-display); font-size: 32px; font-weight: 500; letter-spacing: -0.02em; }

  /* Breadcrumb (shared style) */
  .breadcrumb {
    display: flex;
    gap: var(--evx-space-sm);
    align-items: center;
    padding-top: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
    flex-wrap: wrap;
  }
  .breadcrumb__item {
    font-family: var(--evx-font-mono);
    font-size: 10px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--evx-ink-soft);
    background: none; border: none; padding: 0; cursor: pointer;
    transition: var(--evx-transition);
  }
  .breadcrumb__item:hover { color: var(--evx-warm-black); }
  .breadcrumb__item--current { color: var(--evx-warm-black); cursor: default; }
  .breadcrumb__sep { color: var(--evx-rule-light); }

  /* Header */
  .tp-header {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    gap: var(--evx-space-lg);
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-lg);
    align-items: flex-start;
  }
  .tp-header__avatar {
    width: 80px; height: 80px;
    background: var(--evx-graphite);
    color: var(--evx-paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 36px;
  }
  .tp-header__id { display: flex; flex-direction: column; gap: var(--evx-space-xs); min-width: 0; }
  .tp-header__title-row { display: flex; align-items: center; gap: var(--evx-space-sm); flex-wrap: wrap; }
  .tp-header__name {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    line-height: 1;
  }
  .tp-header__pro {
    color: var(--evx-fox-orange);
    border: 1px solid var(--evx-fox-orange);
    padding: 2px 6px;
  }
  .tp-header__verified {
    color: var(--evx-ink-soft);
    border: 1px solid var(--evx-rule-light);
    padding: 2px 6px;
  }
  .tp-header__tagline {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 17px;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-xs);
  }
  .tp-header__loc {
    display: flex;
    gap: var(--evx-space-md);
    align-items: center;
    margin-top: var(--evx-space-xs);
  }
  .tp-header__loc span:first-child { color: var(--evx-ink-soft); }
  .tp-header__avail { color: var(--evx-fox-orange); }

  /* Stats */
  .tp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-md);
    padding: var(--evx-space-md) 0;
    margin-bottom: var(--evx-space-2xl);
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .tp-stat { display: flex; flex-direction: column; gap: 4px; }
  .tp-stat__val {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    line-height: 1.1;
  }
  .tp-stat__label { color: var(--evx-ink-soft); }

  /* Body grid */
  .tp-body {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--evx-space-2xl);
    align-items: start;
  }

  .tp-main { display: flex; flex-direction: column; gap: var(--evx-space-2xl); min-width: 0; }

  .tp-section { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .tp-h {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
  }
  .tp-section__sub { color: var(--evx-ink-soft); }

  .tp-bio { font-size: 15px; line-height: 1.75; color: var(--evx-ink); }

  .tp-quals {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-sm);
  }
  .tp-qual {
    display: flex; align-items: center;
    gap: var(--evx-space-sm);
    font-size: 14px;
    line-height: 1.5;
    color: var(--evx-warm-black);
    padding: var(--evx-space-sm);
    background: rgba(0,0,0,0.02);
  }
  .tp-qual__check { color: var(--evx-fox-orange); font-weight: 500; }

  .tp-coverage {
    display: flex;
    flex-wrap: wrap;
    gap: var(--evx-space-sm);
  }
  .tp-coverage__county {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: var(--evx-warm-black);
    border: 1px solid var(--evx-rule-light);
    padding: 4px 10px;
  }

  /* Gallery */
  .tp-gallery {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-sm);
  }
  .tp-photo {
    aspect-ratio: 1;
    background: var(--evx-graphite);
    position: relative;
  }
  .tp-photo__num {
    position: absolute;
    bottom: 8px; left: 8px;
    color: rgba(245,242,237,0.4);
  }

  /* Reviews */
  .tp-reviews { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--evx-rule-light); }
  .tp-review {
    padding: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
    display: flex; flex-direction: column;
    gap: var(--evx-space-sm);
  }
  .tp-review:last-child { border-bottom: none; }
  .tp-review__head { display: flex; justify-content: space-between; align-items: flex-start; }
  .tp-review__id { display: flex; flex-direction: column; gap: 2px; }
  .tp-review__id strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }
  .tp-review__id span { color: var(--evx-ink-soft); }
  .tp-review__rating { color: var(--evx-fox-orange); font-size: 13px; letter-spacing: 1px; }
  .tp-review__text { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); }

  /* Sidebar */
  .tp-side { display: flex; flex-direction: column; gap: var(--evx-space-md); position: sticky; top: 80px; }

  .tp-contact {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
  }
  .tp-contact__label { color: var(--evx-fox-orange); }
  .tp-contact__listed-sub { font-size: 13px; line-height: 1.65; color: var(--evx-ink-soft); }

  .tp-contact__form { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .tp-contact__btn { width: 100%; }
  .tp-contact__fine { color: var(--evx-ink-soft); line-height: 1.5; margin-top: var(--evx-space-sm); }

  .tp-field { display: flex; flex-direction: column; gap: 2px; }
  .tp-field__label { color: var(--evx-ink-soft); }
  .tp-field__input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xs) 0;
    font-family: var(--evx-font-display);
    font-size: 13px;
    color: var(--evx-warm-black);
    outline: none;
  }
  .tp-field__input:focus { border-bottom-color: var(--evx-warm-black); }
  .tp-field__input::placeholder { color: var(--evx-ink-soft); }
  .tp-field__textarea { resize: vertical; min-height: 80px; line-height: 1.5; }

  .tp-contact__ok { display: flex; flex-direction: column; gap: var(--evx-space-sm); padding: var(--evx-space-md) 0; }
  .tp-contact__ok span { color: var(--evx-fox-orange); }
  .tp-contact__ok p { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }

  .tp-phone {
    display: flex; flex-direction: column;
    gap: 2px;
    padding: var(--evx-space-md) 0;
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .tp-phone__label { color: var(--evx-ink-soft); }
  .tp-phone__val {
    font-family: var(--evx-font-display);
    font-size: 18px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }

  /* Why TRADE card */
  .tp-side-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-lg);
    display: flex; flex-direction: column;
    gap: var(--evx-space-md);
  }
  .tp-side-card__label { color: var(--evx-ink-soft); }
  .tp-side-card__list { display: flex; flex-direction: column; gap: var(--evx-space-sm); font-size: 13px; line-height: 1.6; color: var(--evx-ink-soft); }
  .tp-side-card__link {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black);
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-align: left;
    transition: var(--evx-transition);
  }
  .tp-side-card__link:hover { opacity: 0.70; }

  .tp-report {
    background: none; border: none; padding: var(--evx-space-md) 0 0;
    color: var(--evx-ink-soft);
    cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
  }
  .tp-report:hover { color: var(--evx-warm-black); }

  @media (max-width: 1023px) {
    .tp-body { grid-template-columns: 1fr; }
    .tp-side { position: static; }
    .tp-header { grid-template-columns: 64px 1fr; }
    .tp-header__cta { grid-column: 1 / -1; }
    .tp-stats { grid-template-columns: 1fr 1fr; }
    .tp-gallery { grid-template-columns: repeat(3, 1fr); }
    .tp-quals { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .tp-gallery { grid-template-columns: 1fr 1fr; }
  }
</style>
