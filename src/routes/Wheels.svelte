<script lang="ts">
  // ============================================================
  // /wheels — approved homepage build.
  //
  // Design parameters (from approved Claude Design prototype):
  //   * Dark cinematic background; warm-black with graphite accents.
  //   * Serif wordmark and headline; sentence-rhythm copy.
  //   * DRIVE leads. Premium carbon-LED edition cards as the hero
  //     and the section after.
  //   * Standard line is secondary. The consignment shows as a
  //     calm card, with the genuine €399 -> €300 reference.
  //   * Fitment-first: a chassis chooser sits inside the hero so a
  //     visitor can route to the right configuration in one tap.
  //   * Orange surgical: fox-orange used only for the eyebrow label,
  //     "01" markers, and the primary CTA accent.
  //
  // Backend wiring is unchanged:
  //   * Consignment listing pulled by slug 'bmw-m-sport-carbon-
  //     consignment' (status=active gate). Renders the existing
  //     VariantPicker on the listing detail page.
  //   * DRIVE upcoming pulled via getDriveListings (any-status).
  //   * Fitment dropdown pulls from public.fitment_chassis. Picking
  //     a row navigates to the consignment listing; VariantPicker
  //     handles the in-page selection.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { supabase } from '../lib/supabase';
  import {
    getDriveListings,
    getFitmentChassis,
    formatPrice,
    type ListingWithExtras,
    type FitmentChassis,
  } from '../lib/api';

  const CONSIGNMENT_SLUG = 'bmw-m-sport-carbon-consignment';

  let consignment: ListingWithExtras | null = null;
  let driveItems: ListingWithExtras[] = [];
  let chassis: FitmentChassis[] = [];
  let loading = true;
  let chosenChassis = '';

  onMount(async () => {
    applySeo({
      title: 'Carbon Steering Wheels · ÉIRVOX',
      description: 'BMW carbon steering wheels. DRIVE editions and standard consignment line. Made for your chassis. Dublin.',
      path: '/wheels',
    });

    const [{ data: con }, drives, fits] = await Promise.all([
      supabase
        .from('listings')
        .select('*, seller:sellers(id,trading_name,handle,tier,is_house), images:listing_images(id,public_url,sort_order)')
        .eq('slug', CONSIGNMENT_SLUG)
        .eq('status', 'active')
        .maybeSingle(),
      getDriveListings({ limit: 6 }),
      getFitmentChassis(),
    ]);

    consignment = (con as ListingWithExtras | null) ?? null;
    // DRIVE-led: upcoming + open issues, never archived.
    driveItems = (drives ?? []).filter(d => d.drive_issue_state !== 'archived');
    chassis = fits;
    loading = false;
  });

  function openConsignment() {
    navigate(`/listing/${CONSIGNMENT_SLUG}`);
  }

  function openDrive(slugOrId: string) {
    navigate(`/drive/${slugOrId}`);
  }

  function goToFitment() {
    if (!chosenChassis) return;
    // Routes to the consignment listing detail; the VariantPicker
    // there is the fitment-first picker. Pre-selection by query
    // param is a future hook (would need VariantPicker to read it);
    // for now we just hand off to the picker.
    navigate(`/listing/${CONSIGNMENT_SLUG}?chassis=${encodeURIComponent(chosenChassis)}`);
  }
</script>

<Nav />

<main id="main-content" class="wp">

  <!-- ━━━━━━ HERO ━━━━━━ -->
  <section class="wp-hero">
    <div class="wp-hero__bg" aria-hidden="true"></div>
    <div class="wp-hero__inner page-container">

      <div class="wp-hero__head">
        <span class="evx-caption wp-hero__eyebrow">ÉIRVOX · WHEELS · DUBLIN</span>
        <h1 class="wp-hero__title">
          Carbon.<br/>
          <em>Made for your chassis.</em>
        </h1>
        <p class="wp-hero__sub">
          BMW carbon steering wheels. DRIVE editions and a standard line.
          Configured by fitment. Paid direct. Dispatched from Dublin.
        </p>
      </div>

      <div class="wp-hero__panel">
        <span class="evx-caption wp-hero__panel-label">01 · FIND YOUR FITMENT</span>

        {#if chassis.length > 0}
          <div class="wp-hero__fit">
            <select class="wp-hero__select" bind:value={chosenChassis}>
              <option value="" disabled selected>Choose your model.</option>
              {#each chassis as c (c.id)}
                <option value={c.id}>{c.display_name}</option>
              {/each}
            </select>
            <button class="wp-hero__cta wp-hero__cta--primary"
                    type="button"
                    on:click={goToFitment}
                    disabled={!chosenChassis}>
              Configure
            </button>
          </div>
        {:else}
          <p class="wp-hero__fit-empty">
            Fitment catalogue loading. Or open the configurator directly.
          </p>
          <button class="wp-hero__cta wp-hero__cta--primary"
                  type="button"
                  on:click={openConsignment}>
            Open configurator
          </button>
        {/if}

        <p class="wp-hero__panel-sub">
          Pick your model. We route it to the correct fitment group.
          Sold-out combinations are shown but disabled. No surprise pricing.
        </p>
      </div>

    </div>
  </section>

  <!-- ━━━━━━ DRIVE LED ━━━━━━ -->
  <section class="wp-drive">
    <div class="page-container">

      <header class="wp-section__head">
        <span class="evx-caption wp-section__num">02 · DRIVE</span>
        <h2 class="wp-section__h">DRIVE editions.</h2>
        <p class="wp-section__sub">
          Premium carbon. LED. Made to order. Edition numbered.
          One specification per issue. Not reprinted.
        </p>
      </header>

      {#if loading}
        <div class="wp-skel">Loading editions.</div>
      {:else if driveItems.length > 0}
        <ol class="wp-drive__grid" reversed>
          {#each driveItems as d (d.id)}
            <li class="wp-drive__cell">
              <button class="wp-drive__card" type="button"
                      on:click={() => openDrive(d.slug ?? d.id)}>
                <div class="wp-drive__media">
                  {#if d.cover_image || d.images?.[0]?.public_url}
                    <img src={d.cover_image ?? d.images?.[0]?.public_url ?? ''} alt={d.title} loading="lazy" />
                  {:else}
                    <span class="wp-drive__media-empty"><!-- product render --></span>
                  {/if}
                  <span class="wp-drive__plate evx-caption">DRV-{d.drive_issue ?? '???'}</span>
                </div>
                <div class="wp-drive__body">
                  <span class="evx-caption wp-drive__state">
                    {d.drive_issue_state === 'open'
                      ? 'OPEN'
                      : (d.drive_issue_date ?? 'UPCOMING').toString().toUpperCase()}
                  </span>
                  <h3 class="wp-drive__title">{d.title}</h3>
                  {#if d.subtitle}
                    <p class="wp-drive__desc">{d.subtitle}</p>
                  {/if}
                  <div class="wp-drive__foot">
                    {#if d.price > 0}
                      <span class="wp-drive__price">{formatPrice(d.price)}</span>
                    {/if}
                    {#if d.drive_made_count != null && d.drive_remaining_count != null}
                      <span class="evx-caption wp-drive__stock">
                        {d.drive_remaining_count}/{d.drive_made_count} remaining
                      </span>
                    {/if}
                  </div>
                </div>
              </button>
            </li>
          {/each}
        </ol>
      {:else}
        <p class="wp-empty">
          DRIVE editions are upcoming. <a href="#/drive">DRIVE archive</a>.
        </p>
      {/if}

    </div>
  </section>

  <!-- ━━━━━━ STANDARD LINE (secondary) ━━━━━━ -->
  <section class="wp-standard">
    <div class="page-container">

      <header class="wp-section__head">
        <span class="evx-caption wp-section__num wp-section__num--quiet">03 · STANDARD</span>
        <h2 class="wp-section__h">Standard line.</h2>
        <p class="wp-section__sub">
          BMW M Sport carbon. No LED. Configurable by style and fitment.
          Seven styles. Three fitment groups.
        </p>
      </header>

      {#if loading}
        <div class="wp-skel">Loading.</div>
      {:else if consignment}
        <button class="wp-std-card" type="button" on:click={openConsignment}>
          <div class="wp-std-card__media">
            {#if consignment.images?.[0]?.public_url}
              <img src={consignment.images[0].public_url} alt={consignment.title} loading="lazy" />
            {:else}
              <span class="wp-std-card__media-empty"><!-- product render --></span>
            {/if}
          </div>
          <div class="wp-std-card__body">
            <span class="evx-caption wp-std-card__tag">CONSIGNMENT · DUBLIN</span>
            <h3 class="wp-std-card__title">{consignment.title}</h3>
            {#if consignment.subtitle}
              <p class="wp-std-card__sub">{consignment.subtitle}</p>
            {/if}
            <div class="wp-std-card__price">
              {#if consignment.original_price && consignment.original_price > consignment.price}
                <s class="wp-std-card__was">{formatPrice(consignment.original_price)}</s>
              {/if}
              <strong>{formatPrice(consignment.price)}</strong>
            </div>
            <span class="evx-caption wp-std-card__cta">CONFIGURE & BUY →</span>
          </div>
        </button>
      {:else}
        <p class="wp-empty wp-empty--paper">
          Standard line is in preparation. Choose a DRIVE edition above,
          or write to <a href="mailto:support@eirvox.ie">support@eirvox.ie</a>.
        </p>
      {/if}

    </div>
  </section>

  <!-- ━━━━━━ HOW IT WORKS ━━━━━━ -->
  <section class="wp-how">
    <div class="page-container">

      <header class="wp-section__head">
        <span class="evx-caption wp-section__num">04 · HOW IT WORKS</span>
        <h2 class="wp-section__h">Four steps.</h2>
      </header>

      <ol class="wp-how__steps">
        <li>
          <span class="wp-how__num">01</span>
          <div>
            <strong>Find your fitment.</strong>
            <span>Pick the model that matches your car. We route it to the correct group.</span>
          </div>
        </li>
        <li>
          <span class="wp-how__num">02</span>
          <div>
            <strong>Choose a style.</strong>
            <span>Sold-out combinations are visibly disabled, not hidden. No bait.</span>
          </div>
        </li>
        <li>
          <span class="wp-how__num">03</span>
          <div>
            <strong>Pay direct.</strong>
            <span>Card, Apple Pay, Google Pay, or pay-by-bank through Revolut. ÉIRVOX is seller of record.</span>
          </div>
        </li>
        <li>
          <span class="wp-how__num">04</span>
          <div>
            <strong>An Post or collection.</strong>
            <span>Tracked delivery anywhere in Ireland. Or pick up in Dublin.</span>
          </div>
        </li>
      </ol>

    </div>
  </section>

</main>

<Footer />

<style>
  /* ─────────────────────────────────────────────
     Dark cinematic theme, local to /wheels.
     Tokens are reused; the dark surface is composed
     from existing colours (warm-black, graphite,
     paper, fox-orange). No new design tokens added.
     ───────────────────────────────────────────── */

  .wp { flex: 1; background: var(--evx-warm-black); color: var(--evx-paper); }

  /* HERO */
  .wp-hero { position: relative; overflow: hidden; }
  .wp-hero__bg {
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse at 70% 0%, rgba(232,116,44,0.10), transparent 55%),
      radial-gradient(ellipse at 10% 100%, rgba(245,242,237,0.04), transparent 60%),
      linear-gradient(180deg, #0F0E0C 0%, #1A1A1A 100%);
    z-index: 0;
  }
  .wp-hero__inner {
    position: relative; z-index: 1;
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: var(--evx-space-3xl);
    align-items: center;
    padding-top: clamp(64px, 10vw, 140px);
    padding-bottom: clamp(64px, 10vw, 120px);
  }

  .wp-hero__eyebrow {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-xl);
  }

  .wp-hero__title {
    font-family: var(--evx-font-display, Georgia, 'Times New Roman', serif);
    font-weight: 500;
    font-size: clamp(40px, 7vw, 88px);
    line-height: 1.02;
    letter-spacing: -0.03em;
    color: var(--evx-paper);
    margin: 0 0 var(--evx-space-lg);
  }
  .wp-hero__title em {
    font-style: italic;
    font-weight: 400;
    color: rgba(245, 242, 237, 0.86);
  }

  .wp-hero__sub {
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: clamp(16px, 1.6vw, 19px);
    line-height: 1.7;
    color: rgba(245, 242, 237, 0.68);
    max-width: 480px;
    margin: 0;
  }

  /* HERO PANEL — fitment-first */
  .wp-hero__panel {
    background: rgba(245, 242, 237, 0.04);
    border: 1px solid rgba(245, 242, 237, 0.10);
    padding: clamp(20px, 3vw, 32px);
    backdrop-filter: blur(4px);
  }
  .wp-hero__panel-label {
    color: var(--evx-fox-orange);
    display: block;
    margin-bottom: var(--evx-space-md);
  }

  .wp-hero__fit {
    display: flex;
    gap: var(--evx-space-sm);
    margin-bottom: var(--evx-space-md);
  }
  .wp-hero__select {
    flex: 1;
    background: rgba(0,0,0,0.30);
    color: var(--evx-paper);
    border: 1px solid rgba(245, 242, 237, 0.16);
    padding: 14px 12px;
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: 15px;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
  }
  .wp-hero__select:focus { border-color: var(--evx-fox-orange); }
  .wp-hero__select option { color: var(--evx-warm-black); background: var(--evx-paper); }

  .wp-hero__cta {
    font-family: var(--evx-font-mono, 'JetBrains Mono', Menlo, monospace);
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 14px 22px;
    cursor: pointer;
    border: 1px solid transparent;
    background: var(--evx-fox-orange);
    color: var(--evx-warm-black);
    font-weight: 500;
    transition: opacity 200ms ease;
  }
  .wp-hero__cta:hover:not(:disabled) { opacity: 0.88; }
  .wp-hero__cta:disabled { opacity: 0.4; cursor: not-allowed; }

  .wp-hero__panel-sub {
    font-size: 12px;
    line-height: 1.65;
    color: rgba(245, 242, 237, 0.50);
    margin: var(--evx-space-md) 0 0;
  }
  .wp-hero__fit-empty {
    font-size: 13px;
    color: rgba(245, 242, 237, 0.6);
    margin: 0 0 var(--evx-space-md);
  }

  /* SECTION HEADERS */
  .wp-section__head { max-width: 640px; margin-bottom: clamp(28px, 4vw, 48px); }
  .wp-section__num { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }
  .wp-section__num--quiet { color: rgba(245,242,237, 0.45); }
  .wp-section__h {
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: clamp(28px, 4vw, 52px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.08;
    color: var(--evx-paper);
    margin: 0 0 var(--evx-space-md);
  }
  .wp-section__sub {
    font-size: 15px;
    line-height: 1.7;
    color: rgba(245, 242, 237, 0.62);
    margin: 0;
  }

  /* DRIVE GRID — leading section */
  .wp-drive {
    background: #0E0D0B;
    border-top: 1px solid rgba(245,242,237,0.06);
    padding: clamp(56px, 8vw, 96px) 0;
  }

  .wp-drive__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: clamp(16px, 2vw, 32px);
  }
  .wp-drive__cell { padding: 0; }

  .wp-drive__card {
    display: flex;
    flex-direction: column;
    background: rgba(245, 242, 237, 0.03);
    border: 1px solid rgba(245, 242, 237, 0.08);
    cursor: pointer;
    text-align: left;
    overflow: hidden;
    transition: border-color 200ms ease, transform 200ms ease;
    width: 100%;
    padding: 0;
  }
  .wp-drive__card:hover {
    border-color: rgba(232, 116, 44, 0.5);
    transform: translateY(-2px);
  }

  .wp-drive__media {
    position: relative;
    aspect-ratio: 4 / 5;
    background: #1A1612;
    overflow: hidden;
  }
  .wp-drive__media img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(0.92);
  }
  .wp-drive__media-empty { display: block; width: 100%; height: 100%; }
  .wp-drive__plate {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    color: var(--evx-fox-orange);
  }

  .wp-drive__body {
    padding: var(--evx-space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }
  .wp-drive__state { color: rgba(245,242,237, 0.55); }
  .wp-drive__title {
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: 19px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-paper);
    margin: 0;
    line-height: 1.25;
  }
  .wp-drive__desc {
    font-size: 13px;
    line-height: 1.6;
    color: rgba(245, 242, 237, 0.55);
    margin: 0;
  }
  .wp-drive__foot {
    margin-top: var(--evx-space-sm);
    padding-top: var(--evx-space-sm);
    border-top: 1px solid rgba(245,242,237,0.08);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--evx-space-md);
  }
  .wp-drive__price {
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: 18px;
    font-weight: 500;
    color: var(--evx-paper);
  }
  .wp-drive__stock { color: rgba(245,242,237,0.55); }

  /* STANDARD LINE — secondary, calmer */
  .wp-standard {
    background: #131210;
    border-top: 1px solid rgba(245,242,237,0.06);
    padding: clamp(56px, 8vw, 96px) 0;
  }

  .wp-std-card {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 0;
    background: rgba(245, 242, 237, 0.03);
    border: 1px solid rgba(245, 242, 237, 0.08);
    cursor: pointer;
    text-align: left;
    width: 100%;
    padding: 0;
    overflow: hidden;
    transition: border-color 200ms ease;
  }
  .wp-std-card:hover { border-color: rgba(232, 116, 44, 0.4); }

  .wp-std-card__media {
    aspect-ratio: 4 / 3;
    background: #1A1612;
    overflow: hidden;
  }
  .wp-std-card__media img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    filter: brightness(0.92);
  }
  .wp-std-card__media-empty { display: block; width: 100%; height: 100%; }

  .wp-std-card__body {
    padding: clamp(20px, 3vw, 36px);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    justify-content: center;
  }
  .wp-std-card__tag { color: rgba(245, 242, 237, 0.55); }
  .wp-std-card__title {
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: clamp(22px, 2.6vw, 32px);
    font-weight: 500;
    letter-spacing: -0.018em;
    color: var(--evx-paper);
    margin: 0;
    line-height: 1.15;
  }
  .wp-std-card__sub {
    font-size: 14px;
    line-height: 1.65;
    color: rgba(245, 242, 237, 0.55);
    margin: 0;
  }
  .wp-std-card__price {
    display: flex; align-items: baseline; gap: var(--evx-space-sm);
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: clamp(22px, 2.4vw, 28px);
    font-weight: 500;
    color: var(--evx-paper);
    margin-top: var(--evx-space-md);
  }
  .wp-std-card__was { font-size: 14px; color: rgba(245,242,237,0.45); text-decoration: line-through; font-weight: 400; }
  .wp-std-card__cta { color: var(--evx-fox-orange); margin-top: var(--evx-space-md); }

  /* HOW IT WORKS */
  .wp-how {
    background: #0E0D0B;
    border-top: 1px solid rgba(245,242,237,0.06);
    padding: clamp(56px, 8vw, 96px) 0 clamp(72px, 10vw, 120px);
  }
  .wp-how__steps {
    list-style: none;
    margin: 0; padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0;
    border-top: 1px solid rgba(245,242,237,0.08);
  }
  .wp-how__steps li {
    display: flex;
    gap: var(--evx-space-md);
    padding: var(--evx-space-xl) var(--evx-space-lg);
    border-right: 1px solid rgba(245,242,237,0.08);
    border-bottom: 1px solid rgba(245,242,237,0.08);
  }
  .wp-how__num {
    font-family: var(--evx-font-mono, monospace);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
    flex-shrink: 0;
    padding-top: 2px;
  }
  .wp-how__steps strong {
    display: block;
    font-family: var(--evx-font-display, Georgia, serif);
    font-size: 16px;
    font-weight: 500;
    color: var(--evx-paper);
    margin-bottom: 4px;
  }
  .wp-how__steps span {
    font-size: 13px;
    line-height: 1.65;
    color: rgba(245, 242, 237, 0.55);
  }

  /* SHARED */
  .wp-skel, .wp-empty {
    padding: var(--evx-space-2xl);
    font-family: var(--evx-font-mono, monospace);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: rgba(245, 242, 237, 0.55);
  }
  .wp-empty a { color: var(--evx-paper); text-decoration: underline; text-underline-offset: 3px; }
  .wp-empty--paper a { color: var(--evx-paper); }

  /* ─────── RESPONSIVE / MOBILE COSY ─────── */
  @media (max-width: 1023px) {
    .wp-hero__inner { grid-template-columns: 1fr; gap: var(--evx-space-2xl); }
    .wp-std-card { grid-template-columns: 1fr; }
  }
  @media (max-width: 767px) {
    .wp-hero__inner {
      padding-top: clamp(48px, 14vw, 72px);
      padding-bottom: clamp(48px, 14vw, 72px);
    }
    .wp-hero__title { font-size: clamp(36px, 11vw, 56px); line-height: 1.04; }
    .wp-hero__sub { font-size: 16px; }
    .wp-hero__fit { flex-direction: column; gap: var(--evx-space-sm); }
    .wp-hero__cta { width: 100%; }

    .wp-section__h { font-size: clamp(26px, 8vw, 36px); }

    .wp-drive__grid { grid-template-columns: 1fr; }
    .wp-drive__card { max-width: 520px; margin: 0 auto; }

    .wp-how__steps { grid-template-columns: 1fr; }
    .wp-how__steps li { border-right: none; }
  }
</style>
