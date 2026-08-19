<script lang="ts">
  // ============================================================
  // /, the front door. One light page.
  //
  // Bands, top to bottom:
  //   1 HERO      full-bleed shot, statement, one primary action
  //   2 PROOF     four hairline-divided figures, all live or true
  //   3 THE RANGE featured collection row (live listings)
  //   4 DRIVE     dark editorial band, the limited line, folded in
  //   5 FITMENT   the finder ritual
  //   6 PROCESS   01–04, same copy as /about (single source of truth)
  //   7 MARKET    the marketplace, locked
  //
  // Every figure on this page comes from the database. No invented
  // counts, no stock figures, no countdowns, no ratings.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import ProductCard from '../lib/ProductCard.svelte';
  import WheelFinder from '../lib/WheelFinder.svelte';
  import {
    getDriveListings, getListings, getListingVariants,
    getFitmentChassis, getFitmentFamilies, formatPrice,
    type ListingWithExtras,
  } from '../lib/api';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  const CONSIGNMENT_SLUG = 'bmw-m-sport-carbon-consignment';

  let drive: ListingWithExtras[] = [];
  let range: ListingWithExtras[] = [];
  let consignment: ListingWithExtras | null = null;
  let styleCount = 0;
  let familyCount = 0;
  let chassisCount = 0;
  let loading = true;
  let finderOpen = false;

  onMount(async () => {
    applySeo(seo.home());

    const [driveRows, autoRows, chassis, families] = await Promise.all([
      getDriveListings({ state: 'open', limit: 8 }),
      getListings({ category: 'automotive', limit: 24 }),
      getFitmentChassis(),
      getFitmentFamilies(),
    ]);

    drive = driveRows;
    range = autoRows.filter(l => l.is_drive !== true);
    chassisCount = chassis.length;
    familyCount = families.length;

    consignment = autoRows.find(l => l.slug === CONSIGNMENT_SLUG)
      ?? autoRows.find(l => l.slug?.includes('consignment'))
      ?? autoRows[0] ?? null;

    if (consignment) {
      const variants = await getListingVariants(consignment.id);
      styleCount = new Set(variants.map(v => v.style_key)).size;
    }

    loading = false;
  });

  // Popular-now rail: real listings with a real price, nothing else.
  $: popular = [...range, ...drive].filter(l => l.price > 0).slice(0, 4);

  function go(path: string) {
    const hashIdx = path.indexOf('#');
    if (hashIdx > 0) {
      navigate(path.slice(0, hashIdx));
      const anchor = path.slice(hashIdx + 1);
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
      return;
    }
    navigate(path);
  }
</script>

<Nav />

<main id="main-content">

  <!-- ━━ 1 · HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <!-- Type carries the hero. The right panel is a woven house tile,
       not a photograph: when a real hero shot exists, drop it in and
       delete the woven modifier. Nothing here pretends to be the
       product. -->
  <section class="hero">
    <div class="hero__inner page-container">
      <div class="hero__copy">
        <span class="hero__eyebrow">FOR IRISH DRIVERS · DUBLIN</span>
        <h1 class="hero__title">Carbon wheels,<br />finished in Dublin.</h1>
        <p class="hero__stand evx-editorial">Engineered to be felt before it's seen.</p>
        <p class="hero__lede">
          For the driver who notices the wheel. A fitted BMW range, and DRIVE, a numbered
          line made once. Designed in Ireland, assembled abroad, finished in Dublin.
        </p>
        <div class="hero__actions">
          <button class="evx-btn evx-btn--primary" on:click={() => go('/wheels#fitment')}>Find your fit</button>
          <button class="evx-link" on:click={() => go('/wheels')}>See all wheels</button>
        </div>

        {#if popular.length}
          <div class="hero__popular">
            <span class="hero__popular-head">IN THE SHOP</span>
            <ul>
              {#each popular.slice(0, 3) as p (p.id)}
                <li>
                  <button on:click={() => navigate(`/wheels/${p.slug ?? p.id}`)}>
                    <span class="hero__popular-name">{p.title}</span>
                    <span class="hero__popular-price">{formatPrice(p.price)}</span>
                  </button>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <div class="hero__panel evx-tile evx-tile--woven-ink" aria-hidden="true"></div>
    </div>
  </section>

  <!-- ━━ 2 · PROOF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <!-- Type and hairline rules only. No icons in a proof strip. -->
  <section class="proof">
    <div class="proof__inner page-container">
      {#if chassisCount}
        <div class="proof__cell">
          <span class="proof__fig">{chassisCount}</span>
          <span class="proof__cap">BMW CHASSIS WITH A CONFIRMED FIT</span>
        </div>
      {/if}
      {#if styleCount}
        <div class="proof__cell">
          <span class="proof__fig">{styleCount}</span>
          <span class="proof__cap">FINISHES IN THE FITTED RANGE</span>
        </div>
      {/if}
      <div class="proof__cell">
        <span class="proof__fig">3K</span>
        <span class="proof__cap">TWILL CARBON · SATIN LACQUER</span>
      </div>
      <div class="proof__cell">
        <span class="proof__fig">One price</span>
        <span class="proof__cap">CARD · APPLE PAY · GOOGLE PAY · PAY BY BANK</span>
      </div>
    </div>
  </section>

  <!-- ━━ 3 · THE RANGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="evx-section" id="range">
    <div class="page-container">
      <div class="sec-head">
        <div>
          <span class="evx-label">THE FITTED RANGE</span>
          <h2 class="evx-heading sec-head__h">BMW, fitted.</h2>
          <p class="evx-lede sec-head__lede">
            Tell us the car, we will tell you the wheel that fits it.{#if familyCount}{' '}{familyCount} fitment {familyCount === 1 ? 'group' : 'groups'} across the range.{/if}
          </p>
        </div>
        <button class="evx-link sec-head__all" on:click={() => go('/wheels')}>View all wheels →</button>
      </div>

      {#if loading}
        <div class="grid">
          {#each Array(4) as _, i (i)}<div class="grid__skel"></div>{/each}
        </div>
      {:else if range.length}
        <div class="grid">
          {#each range.slice(0, 8) as l (l.id)}<ProductCard listing={l} />{/each}
        </div>
      {:else}
        <p class="empty">The range opens shortly.</p>
      {/if}
    </div>
  </section>

  <!-- ━━ 4 · DRIVE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <!-- The limited line lives inside the shop now. Champagne is used
       here and nowhere else. -->
  <section class="evx-dark drive" id="drive">
    <div class="page-container evx-section">
      <div class="sec-head sec-head--dark">
        <div>
          <span class="evx-label drive__eyebrow">DRIVE</span>
          <h2 class="evx-heading sec-head__h">Made once. Not reprinted.</h2>
          <p class="evx-lede sec-head__lede">
            A numbered line with integrated LED. Each issue is one specification,
            made once, and then closed for good.
          </p>
        </div>
        <button class="drive__all" on:click={() => go('/wheels')}>See the line →</button>
      </div>

      {#if drive.length}
        <div class="grid grid--dark">
          {#each drive.slice(0, 4) as d (d.id)}
            <button class="dcard" type="button" on:click={() => navigate(`/wheels/${d.slug ?? d.id}`)}>
              <div class="dcard__tile evx-tile" class:evx-tile--woven-ink={!d.cover_image}>
                {#if d.cover_image}
                  <img src={d.cover_image} alt={d.title} loading="lazy" />
                {/if}
              </div>
              <span class="dcard__issue">DRIVE {d.drive_issue ?? ''}</span>
              <span class="dcard__title">{d.title}</span>
              <span class="dcard__price">
                {#if d.price > 0}{formatPrice(d.price)}{:else}Price on enquiry{/if}
              </span>
            </button>
          {/each}
        </div>
      {:else}
        <p class="drive__empty">The next issue is in preparation.</p>
      {/if}
    </div>
  </section>

  <!-- ━━ 5 · FITMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="evx-section evx-band" id="fitment">
    <div class="page-container fit">
      <div class="fit__copy">
        <span class="evx-label">FITMENT</span>
        <h2 class="evx-heading">Will it fit your car?</h2>
        <p class="evx-lede">
          Give us your chassis and we confirm the fit before you pay, not after.
        </p>
        <button class="evx-btn evx-btn--ink fit__cta" on:click={() => (finderOpen = true)} disabled={!consignment}>
          {consignment ? 'Check fitment' : 'Fitment opens with the range'}
        </button>
      </div>
      {#if chassisCount}
        <div class="fit__figure">
          <span class="fit__fig-num">{chassisCount}</span>
          <span class="fit__fig-cap">CHASSIS IN THE FITMENT TABLE</span>
        </div>
      {/if}
    </div>
  </section>

  <!-- ━━ 6 · PROCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="evx-section">
    <div class="page-container">
      <span class="evx-label">THE PROCESS</span>
      <h2 class="evx-heading proc__h">From the drawing to your door.</h2>
      <ol class="proc">
        <li class="proc__step">
          <span class="evx-label proc__num">01</span>
          <strong class="proc__title">Designed</strong>
          <p class="proc__body">In Ireland. Geometry, weave, trim and LED behaviour are specified here.</p>
        </li>
        <li class="proc__step">
          <span class="evx-label proc__num">02</span>
          <strong class="proc__title">Assembled</strong>
          <p class="proc__body">Abroad, by a specialist carbon manufacturer.</p>
        </li>
        <li class="proc__step">
          <span class="evx-label proc__num">03</span>
          <strong class="proc__title">Finished</strong>
          <p class="proc__body">
            In Dublin. Every wheel is inspected, trimmed, LED-fitted, function
            tested and packed here before it goes anywhere.
          </p>
        </li>
        <li class="proc__step">
          <span class="evx-label proc__num">04</span>
          <strong class="proc__title">Fitted &amp; shipped</strong>
          <p class="proc__body">
            Collect it from us in Dublin, or we post it anywhere in Ireland.
          </p>
        </li>
      </ol>
      <p class="proc__line"><span class="evx-editorial">If it isn't right, it doesn't ship.</span></p>
    </div>
  </section>

  <!-- ━━ 7 · MARKETPLACE (locked) ━━━━━━━━━━━━━━━━━━━━━━ -->
  <section class="evx-section evx-dark mk">
    <div class="page-container mk__inner">
      <div>
        <span class="evx-label">NEXT</span>
        <h2 class="evx-heading">The marketplace.</h2>
        <p class="evx-lede">
          A curated market for the things people here collect and drive. It opens one
          category at a time, each one when we can check it with our own hands.
        </p>
      </div>
      <button class="mk__cta" on:click={() => navigate('/marketplace')}>What's coming →</button>
    </div>
  </section>
</main>

<Footer />

{#if finderOpen && consignment}
  <WheelFinder
    consignmentSlug={consignment.slug ?? CONSIGNMENT_SLUG}
    consignmentId={consignment.id}
    basePriceEur={consignment.price}
    on:close={() => (finderOpen = false)}
  />
{/if}

<style>
  /* ── 1 · Hero ── */
  .hero { border-bottom: 1px solid var(--evx-rule-light); }
  .hero__inner {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: var(--evx-space-3xl);
    align-items: stretch;
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }
  .hero__copy { animation: evx-rise 500ms ease both; align-self: center; }
  .hero__eyebrow {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.18em;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-lg);
  }
  .hero__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(36px, 4.8vw, 64px);
    line-height: 1.02;
    letter-spacing: -0.035em;
  }
  .hero__stand {
    margin-top: var(--evx-space-md);
    font-size: clamp(18px, 1.6vw, 22px);
    line-height: 1.35;
    color: var(--evx-ink-soft);
  }
  .hero__lede {
    margin-top: var(--evx-space-lg);
    max-width: 46ch;
    font-size: clamp(15px, 1.15vw, 16.5px);
    line-height: 1.6;
    color: var(--evx-ink-soft);
  }
  .hero__actions {
    display: flex;
    align-items: center;
    gap: var(--evx-space-xl);
    margin-top: var(--evx-space-xl);
    flex-wrap: wrap;
  }

  .hero__popular {
    margin-top: var(--evx-space-2xl);
    max-width: 420px;
  }
  .hero__popular-head {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.18em;
    color: var(--evx-ink-faint);
    margin-bottom: var(--evx-space-sm);
  }
  .hero__popular ul { display: flex; flex-direction: column; }
  .hero__popular button {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--evx-space-lg);
    width: 100%;
    padding: 9px 0;
    background: none;
    border: none;
    border-top: 1px solid var(--evx-rule-hair);
    text-align: left;
    transition: var(--evx-transition);
  }
  .hero__popular button:hover { opacity: 0.6; }
  .hero__popular-name {
    font-size: 13.5px;
    color: var(--evx-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hero__popular-price {
    font-family: var(--evx-font-mono);
    font-size: 12px;
    color: var(--evx-ink-soft);
  }

  .hero__panel { min-height: clamp(380px, 46vw, 560px); }

  /* ── 2 · Proof ── */
  .proof { border-bottom: 1px solid var(--evx-rule-light); }
  .proof__inner {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
  }
  .proof__cell {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding: var(--evx-space-xl) var(--evx-space-lg);
    border-left: 1px solid var(--evx-rule-light);
  }
  .proof__cell:first-child { border-left: none; padding-left: 0; }
  .proof__fig {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(26px, 2.6vw, 36px);
    line-height: 1;
    letter-spacing: -0.03em;
    color: var(--evx-ink);
  }
  .proof__cap {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.12em;
    line-height: 1.5;
    color: var(--evx-ink-soft);
  }

  /* ── Section heads + grid ── */
  .sec-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--evx-space-xl);
    margin-bottom: var(--evx-space-xl);
    flex-wrap: wrap;
  }
  .sec-head__h { margin-top: var(--evx-space-sm); }
  .sec-head__lede { margin-top: var(--evx-space-sm); }
  .sec-head__all { flex-shrink: 0; }
  .sec-head--dark .evx-heading { color: #FFFFFF; }

  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-lg);
  }
  .grid__skel {
    aspect-ratio: 5 / 7;
    background: var(--evx-paper-panel);
    border: 1px solid var(--evx-rule-light);
  }
  .empty { color: var(--evx-ink-soft); font-size: 15px; }

  /* ── 4 · DRIVE ── */
  .drive__eyebrow { color: var(--evx-champagne); }
  .drive__all {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 500;
    color: #FFFFFF;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    padding: 0 0 3px;
    transition: var(--evx-transition);
  }
  .drive__all:hover { opacity: 0.65; }
  .drive__empty { color: rgba(255, 255, 255, 0.6); font-size: 15px; }

  .dcard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    transition: var(--evx-transition);
  }
  .dcard:hover { opacity: 0.82; }
  .dcard__tile {
    aspect-ratio: 5 / 6;
    background: #1B1B1B;
    margin-bottom: var(--evx-space-sm);
  }
  .dcard__tile > img { height: 100%; }
  .dcard__issue {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    color: var(--evx-champagne);
  }
  .dcard__title { font-size: 15px; font-weight: 500; color: #FFFFFF; letter-spacing: -0.01em; }
  .dcard__price { font-family: var(--evx-font-mono); font-size: 12px; color: rgba(255, 255, 255, 0.72); }

  /* ── 5 · Fitment ── */
  .fit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--evx-space-2xl);
    flex-wrap: wrap;
  }
  .fit__copy { max-width: 52ch; }
  .fit__copy .evx-heading { margin-top: var(--evx-space-sm); }
  .fit__copy .evx-lede { margin-top: var(--evx-space-sm); }
  .fit__cta { margin-top: var(--evx-space-lg); }
  .fit__figure {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-left: var(--evx-space-2xl);
    border-left: 1px solid var(--evx-rule-light);
  }
  .fit__fig-num {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(48px, 6vw, 84px);
    line-height: 0.95;
    letter-spacing: -0.04em;
  }
  .fit__fig-cap {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.14em;
    color: var(--evx-ink-soft);
  }

  /* ── 6 · Process ── */
  .proc__h { margin-top: var(--evx-space-sm); margin-bottom: var(--evx-space-2xl); }
  .proc {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-xl);
  }
  .proc__step {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-ink);
  }
  .proc__num { color: var(--evx-ink-faint); }
  .proc__title { font-size: 17px; font-weight: 500; letter-spacing: -0.015em; }
  .proc__body { font-size: 14px; line-height: 1.6; color: var(--evx-ink-soft); }
  .proc__line { margin-top: var(--evx-space-2xl); font-size: 20px; color: var(--evx-ink); }

  /* ── 7 · Marketplace ── */
  .mk__inner {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--evx-space-2xl);
    flex-wrap: wrap;
  }
  .mk .evx-heading { color: #FFFFFF; margin-top: var(--evx-space-sm); }
  .mk .evx-lede { margin-top: var(--evx-space-sm); }
  .mk__cta {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 500;
    color: #FFFFFF;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    padding: 0 0 3px;
    transition: var(--evx-transition);
  }
  .mk__cta:hover { opacity: 0.65; }

  /* ── Responsive ── */
  @media (max-width: 1023px) {
    .hero__inner { flex-direction: column; align-items: flex-start; }
    .hero__popular { min-width: 0; width: 100%; max-width: 380px; }
    .proof__inner { grid-auto-flow: row; grid-template-columns: repeat(2, 1fr); }
    .proof__cell:nth-child(odd) { border-left: none; padding-left: 0; }
    .grid { grid-template-columns: repeat(2, 1fr); }
    .proc { grid-template-columns: repeat(2, 1fr); }
    .fit__figure { padding-left: 0; border-left: none; }
  }

  @media (max-width: 599px) {
    .proof__inner { grid-auto-flow: row; grid-template-columns: 1fr; }
    .proof__cell { border-left: none; padding-left: 0; border-bottom: 1px solid var(--evx-rule-light); }
    .proof__cell:last-child { border-bottom: none; }
    .grid { grid-template-columns: 1fr; }
    .proc { grid-template-columns: 1fr; }
  }
</style>
