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
  import { siteFlags } from '../lib/flags';
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
      getDriveListings({ limit: 8 }),
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

  // In-the-shop rail: only things somebody can actually buy. Listing a
  // sold-out run at its old price is the worst kind of wrong.
  $: popular = [...range, ...drive]
    .filter(l => l.price > 0 && !isSoldOut(l))
    .slice(0, 3);

  // The hero shows a real wheel. Photography exists now, so the woven
  // house tile that used to sit here is the fallback, not the default:
  // a page selling a physical object should open on the object.
  $: driveSoldOut = drive.length > 0 && drive.every(d =>
    d.drive_issue_state === 'archived' || d.drive_remaining_count === 0);

  // Prefer something buyable, but never fall back to a texture while a
  // real photograph exists anywhere. A sold-out wheel still sells the
  // workmanship; a woven placeholder sells nothing.
  const isSoldOut = (l: ListingWithExtras) =>
    l.is_drive === true && (l.drive_issue_state === 'archived' || l.drive_remaining_count === 0);

  /** The second shot, for the hover peek. Sorted, because the join
   *  returns images in no particular order. */
  const secondImage = (l: ListingWithExtras): string | null => {
    const urls = (l.images ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(i => i.public_url)
      .filter(Boolean) as string[];
    return urls.find(u => u !== l.cover_image) ?? null;
  };


  $: heroListing =
    [...range, ...drive].find(l => l.cover_image && !isSoldOut(l))
    ?? [...range, ...drive].find(l => l.cover_image)
    ?? null;
  $: heroSoldOut = !!heroListing && isSoldOut(heroListing);
  // An explicitly chosen banner wins. It is the one image on the site
  // that is about the brand rather than a single product, so it is set
  // in /admin/settings rather than derived.
  $: heroImage = $siteFlags.hero_image_url?.trim() || heroListing?.cover_image || null;
  $: heroIsBanner = !!$siteFlags.hero_image_url?.trim();

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
  <!-- Full-bleed split. The photograph runs to the viewport edge: a page
       selling a physical object opens on the object, not on a headline.
       Falls back to the woven house tile only while no photography
       exists, and never simulates a product shot. -->
  <section class="hero">
    <div class="hero__copy-wrap">
      <div class="hero__copy">
        <span class="hero__eyebrow">FOR IRISH DRIVERS · DUBLIN</span>
        <h1 class="hero__title">Carbon wheels,<br />finished in Dublin.</h1>
        <p class="hero__stand evx-editorial">Engineered to be felt before it's seen.</p>
        <p class="hero__lede">
          For the driver who notices the wheel. A fitted BMW range, and DRIVE, a numbered
          line made once.
        </p>
        <div class="hero__actions">
          <button class="evx-btn evx-btn--primary evx-btn--lg" on:click={() => go('/wheels#fitment')}>Find your fit</button>
          <button class="evx-link" on:click={() => go('/wheels')}>See all wheels</button>
        </div>

        {#if popular.length}
          <div class="hero__popular">
            <span class="hero__popular-head">IN THE SHOP</span>
            <ul>
              {#each popular as p (p.id)}
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
    </div>

    <div class="hero__figure evx-sweep" class:hero__figure--woven={!heroImage}>
      {#if heroImage}
        <img src={heroImage} alt={heroIsBanner ? 'ÉIRVOX carbon steering wheel, fitted' : (heroListing?.title ?? 'ÉIRVOX carbon steering wheel')} />
        {#if !heroIsBanner && heroListing}
        <button class="hero__figure-tag" on:click={() => navigate(`/wheels/${heroListing?.slug ?? ''}`)}>
          <span>{heroListing?.title}</span>
          <span class="hero__figure-price">
            {#if heroSoldOut}Sold out{:else}{formatPrice(heroListing?.price ?? 0)}{/if}
          </span>
        </button>
        {/if}
      {:else}
        <div class="evx-tile evx-tile--woven-ink hero__woven" aria-hidden="true"></div>
      {/if}
    </div>
  </section>

  <!-- ━━ 2 · PROOF ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <!-- Type and hairline rules only. No icons in a proof strip. -->
  <section class="proof evx-dark">
    <div class="proof__inner page-container">
      {#if chassisCount}
        <div class="proof__cell">
          <span class="proof__fig">{chassisCount}</span>
          <span class="proof__cap">BMW CHASSIS WITH A CONFIRMED FIT</span>
        </div>
      {:else}
        <div class="proof__cell">
          <span class="proof__fig">BMW</span>
          <span class="proof__cap">FITTED RANGE, CONFIRMED BEFORE YOU PAY</span>
        </div>
      {/if}
      {#if styleCount}
        <div class="proof__cell">
          <span class="proof__fig">{styleCount}</span>
          <span class="proof__cap">FINISHES IN THE FITTED RANGE</span>
        </div>
      {:else}
        <!-- Stock-independent, so the band is never a cell short. -->
        <div class="proof__cell">
          <span class="proof__fig">Dublin</span>
          <span class="proof__cap">WHERE EVERY WHEEL IS FINISHED</span>
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
  {#if loading || range.length}
  <section class="evx-section" id="range">
    <div class="page-container">
      <div class="sec-head">
        <div>
          <span class="evx-label">THE FITTED RANGE</span>
          <h2 class="evx-heading sec-head__h">BMW, fitted.</h2>
          <p class="evx-lede sec-head__lede">
            Tell us the car, we will tell you the wheel that fits it.{#if familyCount && range.length}{' '}{familyCount} fitment {familyCount === 1 ? 'group' : 'groups'} across the range.{/if}
          </p>
        </div>
        <button class="evx-link sec-head__all" on:click={() => go('/wheels')}>View all wheels →</button>
      </div>

      {#if loading}
        <div class="grid">
          {#each Array(4) as _, i (i)}<div class="grid__skel"></div>{/each}
        </div>
      {:else if range.length >= 3}
        <div class="grid">
          {#each range.slice(0, 8) as l (l.id)}<ProductCard listing={l} />{/each}
        </div>
      {:else}
        <!-- One or two wheels is a feature, not a grid. A single card
             stranded in a four-column row is what makes a shop look
             half-stocked. -->
        <div class="feat">
          {#each range.slice(0, 2) as l (l.id)}
            <button class="feat__item" type="button" on:click={() => navigate(`/wheels/${l.slug ?? l.id}`)}>
              <div class="feat__media evx-tile" class:evx-tile--woven={!l.cover_image}>
                {#if l.cover_image}
                  <img class="feat__img" src={l.cover_image} alt={l.title} />
                  {#if secondImage(l)}
                    <img class="feat__img feat__img--peek" src={secondImage(l)} alt="" aria-hidden="true" />
                  {/if}
                {/if}
              </div>
              <div class="feat__body">
                <span class="evx-label">{l.vehicle_make ?? 'THE RANGE'}</span>
                <span class="feat__title">{l.title}</span>
                {#if l.subtitle}<span class="feat__sub">{l.subtitle}</span>{/if}
                <span class="feat__price">{l.price > 0 ? formatPrice(l.price) : 'Price on enquiry'}</span>
                <span class="feat__cta">See the wheel →</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </section>
  {/if}

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
            {#if driveSoldOut}
              A numbered line with integrated LED. One specification per issue, made
              once, never reprinted. Batch one is gone.
            {:else}
              A numbered line with integrated LED. Each issue is one specification,
              made once, and then closed for good.
            {/if}
          </p>
        </div>
        <button class="drive__all" on:click={() => go('/wheels')}>See the line →</button>
      </div>

      {#if drive.length}
        <div class="grid grid--dark">
          {#each drive.slice(0, 4) as d (d.id)}
            <button class="dcard" type="button" on:click={() => navigate(`/wheels/${d.slug ?? d.id}`)}>
              <div class="dcard__tile evx-tile" class:evx-tile--woven-ink={!d.cover_image}
                   class:dcard__tile--sold={d.drive_issue_state === 'archived' || d.drive_remaining_count === 0}>
                {#if d.cover_image}
                  <img class="dcard__img" src={d.cover_image} alt={d.title} loading="lazy" />
                  {#if secondImage(d)}
                    <img class="dcard__img dcard__img--peek" src={secondImage(d)} alt="" aria-hidden="true" loading="lazy" />
                  {/if}
                {/if}

              </div>
              <span class="dcard__issue">DRIVE {d.drive_issue ?? ''}</span>
              <span class="dcard__title">{d.title}</span>
              <span class="dcard__status" class:dcard__status--sold={d.drive_issue_state === 'archived' || d.drive_remaining_count === 0}>
                <span class="dcard__dot" aria-hidden="true"></span>
                {#if d.drive_issue_state === 'archived' || d.drive_remaining_count === 0}
                  Sold out · {d.drive_made_count ?? 0} of {d.drive_made_count ?? 0}
                {:else if d.price > 0}{formatPrice(d.price)}{:else}On enquiry{/if}
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
    </div>
  </section>

  <!-- ━━ STATEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ -->
  <!-- An approved signature line (lockfile §7), at size. The volume is
       in the type; the claim is the same one the site already makes. -->
  <section class="evx-statement">
    <div class="page-container">
      <p class="evx-statement__line">If it isn't right,<br />it doesn't ship.</p>
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
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
    border-bottom: 1px solid var(--evx-rule-light);
    min-height: min(78vh, 720px);
  }

  /* The copy column keeps the page grid's left edge while the figure
     bleeds to the viewport edge, so nothing looks boxed in. */
  .hero__copy-wrap {
    display: flex;
    align-items: center;
    padding-left: max(var(--evx-page-margin), calc((100vw - var(--evx-max-width)) / 2 + var(--evx-page-margin)));
    padding-right: var(--evx-space-3xl);
    padding-top: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-3xl);
  }
  .hero__copy { width: 100%; max-width: 560px; animation: evx-rise 500ms ease both; }

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
    font-weight: 600;
    font-size: clamp(42px, 5vw, 78px);
    line-height: 0.93;
    letter-spacing: -0.045em;
  }
  .hero__stand {
    margin-top: var(--evx-space-md);
    font-size: clamp(19px, 1.7vw, 24px);
    line-height: 1.3;
    color: var(--evx-ink-soft);
  }
  .hero__lede {
    margin-top: var(--evx-space-lg);
    max-width: 42ch;
    font-size: clamp(15px, 1.1vw, 16.5px);
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

  .hero__popular { margin-top: var(--evx-space-2xl); max-width: 440px; }
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
    min-height: 46px;
    padding: 12px 0;
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
  .hero__popular-price { font-family: var(--evx-font-mono); font-size: 12px; color: var(--evx-ink-soft); }

  /* The figure. Full-bleed right, the product large. */
  .hero__figure {
    position: relative;
    background: var(--evx-paper-tile);
    overflow: hidden;
    min-height: 420px;
  }
  .hero__figure > img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hero__woven { position: absolute; inset: 0; }

  /* Shoppable caption on the hero image, the way a good storefront
     makes the hero itself the first product. */
  .hero__figure-tag {
    position: absolute;
    left: var(--evx-space-lg);
    bottom: var(--evx-space-lg);
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-md);
    max-width: calc(100% - var(--evx-space-2xl));
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid var(--evx-rule-light);
    font-family: var(--evx-font-display);
    font-size: 13.5px;
    font-weight: 500;
    color: var(--evx-ink);
    text-align: left;
    transition: var(--evx-transition);
  }
  .hero__figure-tag:hover { opacity: 0.8; }
  .hero__figure-price { font-family: var(--evx-font-mono); font-size: 12.5px; color: var(--evx-ink-soft); }

  /* ── 2 · Proof ── */
  /* On ink. The hero, the proof strip and the range were three light
     bands in a row, which is most of why the page read timid. */
  .proof__inner {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
  }
  .proof__cell {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    padding: var(--evx-space-2xl) var(--evx-space-lg);
    border-left: 1px solid rgba(255, 255, 255, 0.14);
  }
  .proof__cell:first-child { border-left: none; padding-left: 0; }
  .proof__fig {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: clamp(32px, 3.6vw, 54px);
    line-height: 1;
    letter-spacing: -0.035em;
    color: #FFFFFF;
  }
  .proof__cap {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.12em;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.62);
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--evx-space-lg);
  }
  /* Feature layout: used when the range is one or two wheels deep. */
  .feat { display: grid; gap: var(--evx-space-2xl); }
  .feat__item {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: var(--evx-space-2xl);
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    border-top: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl) 0 0;
    text-align: left;
    transition: var(--evx-transition);
  }
  .feat__item:hover { opacity: 0.88; }
  .feat__media { aspect-ratio: 4 / 3; }
  .feat__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 320ms ease;
  }
  .feat__img--peek { opacity: 0; }
  @media (hover: hover) {
    .feat__item:hover .feat__img--peek { opacity: 1; }
  }
  .feat__body { display: flex; flex-direction: column; gap: var(--evx-space-sm); }
  .feat__title {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: clamp(24px, 2.4vw, 36px);
    line-height: 1.04;
    letter-spacing: -0.03em;
    margin-top: var(--evx-space-xs);
  }
  .feat__sub { font-size: 15px; color: var(--evx-ink-soft); }
  .feat__price {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: 22px;
    margin-top: var(--evx-space-sm);
  }
  .feat__cta {
    font-family: var(--evx-font-display);
    font-size: 14px;
    font-weight: 500;
    border-bottom: 1px solid var(--evx-ink);
    align-self: flex-start;
    padding-bottom: 3px;
    margin-top: var(--evx-space-md);
  }

  .grid__skel {
    aspect-ratio: 5 / 7;
    background: var(--evx-paper-panel);
    border: 1px solid var(--evx-rule-light);
  }

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
    position: relative;
    aspect-ratio: 5 / 6;
    background: #1B1B1B;
    margin-bottom: var(--evx-space-sm);
  }
  .dcard__tile--sold .dcard__img { filter: saturate(0.25) contrast(0.96); }
  .dcard__status {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.72);
  }
  .dcard__dot { width: 6px; height: 6px; flex-shrink: 0; background: var(--evx-fox-orange); }
  .dcard__status--sold .dcard__dot {
    background: transparent;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  }
  .dcard__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 320ms ease;
  }
  .dcard__img--peek { opacity: 0; }
  @media (hover: hover) {
    .dcard:hover .dcard__img--peek { opacity: 1; }
  }
  .dcard__issue {
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.16em;
    color: var(--evx-champagne);
  }
  .dcard__title { font-size: 15px; font-weight: 500; color: #FFFFFF; letter-spacing: -0.01em; }

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
    font-weight: 600;
    font-size: clamp(52px, 7vw, 104px);
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
    .hero { grid-template-columns: 1fr; min-height: 0; }
    /* Image first on a phone, the way a storefront opens. It is a real
       product photograph now, so it earns the top of the page. */
    .hero__figure { order: -1; min-height: 0; aspect-ratio: 4 / 3; }
    .hero__copy-wrap {
      padding: var(--evx-space-2xl) var(--evx-page-margin);
    }
    .hero__copy { max-width: 100%; }
    .hero__popular { max-width: 100%; }
    .proof__inner { grid-auto-flow: row; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .proof__cell:nth-child(odd) { border-left: none; padding-left: 0; }
    .proof__cell { padding-top: var(--evx-space-xl); padding-bottom: var(--evx-space-xl); }
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .proc { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .fit__figure { padding-left: 0; border-left: none; }
  }

  @media (max-width: 599px) {
    /* The woven fallback is atmosphere, not information: it earns no
       space on a phone. A real photograph does, and stays. */
    .hero__figure--woven { display: none; }
    .hero__popular { margin-top: var(--evx-space-xl); }

    /* 2x2 rather than four stacked rows: same facts, a quarter of the
       scroll, and it still reads as a divided bar. */
    .proof__cell { padding: var(--evx-space-lg) var(--evx-space-md); }
    .proof__cell:nth-child(-n+2) { border-bottom: 1px solid rgba(255, 255, 255, 0.14); }
    .proof__fig { font-size: 26px; }
    .proof__cap { font-size: 9px; }

    /* Two cards across reads like a shop. One card across reads like a
       list of very large things. */
    .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--evx-space-sm); }
    .feat__item { grid-template-columns: 1fr; gap: var(--evx-space-lg); }
    .proc { grid-template-columns: 1fr; gap: var(--evx-space-lg); }
    .fit__fig-num { font-size: 56px; }
  }

  /* Last controls under the touch guidance: they are links by
     appearance but actions by function. */
  @media (max-width: 767px) {
    .drive__all { padding-top: 12px; padding-bottom: 12px; }
    .mk__cta { padding-top: 12px; padding-bottom: 12px; }
  }
</style>
