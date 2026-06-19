<script lang="ts">
  // ============================================================
  // /wheels — wheel-specialist homepage (warm paper, lockfile §9 amended).
  //
  // Numbered sections, top to bottom:
  //   01 · IGNITION  — signature hero (statement + designed photo slot)
  //   02 · MATERIAL  — four-tile macro strip (designed slots)
  //   03 · FITMENT   — chassis selector → existing WheelFinder ritual
  //   04 · DRIVE     — live limited series, names + state only (no numerals)
  // …then the shared proof band + imprint footer (already approved).
  //
  // Backend wiring:
  //   * Consignment listing pulled by slug (status=active gate so the
  //     row stays hidden until the reviewer flips it live). The hero CTA
  //     degrades gracefully to the finder when that fetch returns null.
  //   * DRIVE pulled via getDriveListings, archived filtered out.
  //   * Chassis list pulled via getFitmentChassis (live BMW fitment).
  //
  // Photography: real product shots render edge-to-edge on paper; image
  // positions without a photo fall back to a designed paper slot (faint
  // ink tint + mono SHOT annotation). No motion beyond evx-rise.
  //
  // Origin copy lives in the proof band + footer, not the hero. No
  // "made in Dublin/Ireland", no "by hand", no "finished by hand".
  // ============================================================
  import { onMount } from 'svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { supabase } from '../lib/supabase';
  import {
    getDriveListings,
    getFitmentChassis,
    type ListingWithExtras,
    type FitmentChassis,
  } from '../lib/api';
  import WheelFinder from '../lib/WheelFinder.svelte';
  import Footer from '../lib/Footer.svelte';
  import Btn from '../lib/wheels-ui/Btn.svelte';
  import Nav from '../lib/Nav.svelte';

  const CONSIGNMENT_SLUG = 'bmw-m-sport-carbon-consignment';

  const MATERIALS = [
    '2×2 Twill carbon fibre',
    'Alcantara grip',
    'Integrated LED shift lights',
    'Billet aluminium hardware',
  ];

  let consignment: ListingWithExtras | null = null;
  let rangeItems: ListingWithExtras[] = [];
  let driveItems: ListingWithExtras[] = [];
  let chassisList: FitmentChassis[] = [];
  let selectedChassisId = '';
  let loading = true;
  let finderOpen = false;
  let scrolled = false;

  // Jump to an in-page anchor (e.g. "/wheels#fitment") from the hero link.
  function goNav(path: string) {
    const hashIdx = path.indexOf('#');
    if (hashIdx > 0) {
      const route = path.slice(0, hashIdx);
      const anchor = path.slice(hashIdx + 1);
      navigate(route);
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
      return;
    }
    navigate(path);
  }

  onMount(async () => {
    applySeo({
      title: 'Carbon Steering Wheels · ÉIRVOX',
      description: 'BMW carbon steering wheels for Irish drivers. DRIVE limited line and a fitted BMW range. Designed in Ireland, assembled abroad, finished in Dublin.',
      path: '/wheels',
    });

    const [{ data: con }, { data: range }, drives, chassis] = await Promise.all([
      supabase
        .from('listings')
        .select('*, seller:sellers(id,trading_name,handle,tier,is_house), images:listing_images(id,public_url,sort_order)')
        .eq('slug', CONSIGNMENT_SLUG)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('listings')
        .select('*, images:listing_images(id,public_url,sort_order)')
        .eq('status', 'active')
        .eq('is_drive', false)
        .like('slug', 'bmw-m-sport-carbon-%')
        .neq('slug', CONSIGNMENT_SLUG)
        .order('created_at', { ascending: true }),
      getDriveListings({ limit: 6 }),
      getFitmentChassis(),
    ]);

    consignment = (con as ListingWithExtras | null) ?? null;
    rangeItems = (range as ListingWithExtras[] | null) ?? [];
    driveItems = (drives ?? []).filter(d => d.drive_issue_state !== 'archived');
    chassisList = chassis ?? [];
    loading = false;
  });

  function onScroll(e: Event) {
    // Light editorial hero: the bar is ink-on-white throughout. Add the
    // frosted white background as soon as the page moves so the tabs stay
    // legible over imagery.
    scrolled = (e.currentTarget as HTMLElement).scrollTop > 8;
  }

  function openDrive(slugOrId: string) {
    navigate(`/wheels/${slugOrId}`);
  }
  function openConsignment() {
    navigate(`/wheels/${CONSIGNMENT_SLUG}`);
  }

  // The fitment ritual. With a chosen chassis and a live consignment we
  // jump straight to the configurator pre-seeded to that chassis; with
  // no chassis (or no live consignment) we open the full finder.
  function checkFitment() {
    if (selectedChassisId && consignment) {
      navigate(`/wheels/${CONSIGNMENT_SLUG}?chassis=${encodeURIComponent(selectedChassisId)}`);
    } else {
      finderOpen = true;
    }
  }

  function driveState(state: string | null | undefined): string {
    if (state === 'open') return 'Open';
    if (state === 'upcoming') return 'Upcoming';
    if (!state) return 'Upcoming';
    return state.charAt(0).toUpperCase() + state.slice(1);
  }

  // Product shot for a listing, if one has been uploaded. Photos now sit
  // on warm paper and render edge-to-edge so the shot's ground merges
  // with the page; slots remain only where no photo exists.
  function imgOf(l: ListingWithExtras | null): string | null {
    if (!l) return null;
    return l.cover_image ?? l.images?.[0]?.public_url ?? null;
  }
</script>

<div class="wp evx-root" on:scroll={onScroll}>

  <Nav />

  <!-- ━━━━━━ HERO — light editorial (newsroom split) ━━━━━━ -->
  <section class="wp-hero">
    <div class="wp-hero__text">
      <span class="evx-label wp-hero__eyebrow">Ireland's carbon wheel specialist</span>
      <h1 class="wp-hero__h">The two seconds<br/>before ignition.</h1>
      <p class="evx-editorial wp-hero__stand">Engineered to be felt before it's seen.</p>
      <div class="wp-hero__cta">
        {#if consignment}
          <Btn variant="primary" size="md" on:click={openConsignment}>Explore the wheel</Btn>
        {:else}
          <Btn variant="primary" size="md" on:click={() => (finderOpen = true)}>Find your fit</Btn>
        {/if}
        <button class="wp-hero__link" type="button" on:click={() => goNav('/wheels#fitment')}>Find your fit →</button>
      </div>
    </div>
    <!-- Horizon banner image goes here later (wide full-bleed hero band). -->
  </section>

  <!-- ━━━━━━ THE RANGE — BMW wheel listings (marketplace grid) ━━━━━━ -->
  <section class="wp-range">
    <div class="wp-range__head">
      <span class="evx-label wp-section__eyebrow">The range</span>
      <h2 class="wp-range__h">BMW M Sport. Seven styles.</h2>
    </div>
    {#if loading}
      <p class="wp-skel">Loading the range.</p>
    {:else if rangeItems.length > 0}
      <div class="wp-range__grid">
        {#each rangeItems as l (l.id)}
          {@const im = imgOf(l)}
          <button class="wp-card" type="button" on:click={() => navigate(`/wheels/${l.slug}`)}>
            <div class="wp-card__photo" class:wp-card__photo--img={im}>
              {#if im}<img class="wp-card__img" src={im} alt={l.title} />{:else}<span class="wp-slot__cap">SHOT</span>{/if}
            </div>
            <div class="wp-card__body">
              <span class="evx-label wp-card__tag">BMW M Sport</span>
              <h3 class="wp-card__title">{l.title.split('·')[1]?.trim() ?? l.title}</h3>
              <span class="wp-card__price">€{l.price}</span>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <p class="wp-empty">The range is being prepared.</p>
    {/if}
  </section>

  <!-- ━━━━━━ 02 · MATERIAL ━━━━━━ -->
  <section class="wp-material">
    <span class="evx-label wp-section__eyebrow">02 · Material</span>
    <div class="wp-material__grid">
      {#each MATERIALS as m, i}
        <figure class="wp-material__tile">
          <div class="wp-slot" style="aspect-ratio:5/6;">
            <span class="wp-slot__cap">SHOT 0{i + 2}</span>
          </div>
          <figcaption class="wp-material__cap">{m}</figcaption>
        </figure>
      {/each}
    </div>
  </section>

  <!-- ━━━━━━ 03 · FITMENT ━━━━━━ -->
  <section class="wp-fitment" id="fitment">
    <span class="evx-label wp-section__eyebrow">03 · Fitment</span>
    <h2 class="wp-fitment__h">Your car. Your spec. Confirmed.</h2>
    <div class="wp-fitment__row">
      <div class="wp-slot wp-fitment__photo" style="aspect-ratio:16/9;">
        <span class="wp-slot__cap">SHOT · BMW SILHOUETTE</span>
      </div>
      <div class="wp-fitment__control">
        <label class="evx-label wp-fitment__label" for="chassis-select">Select chassis</label>
        <select id="chassis-select" class="wp-fitment__select" bind:value={selectedChassisId}>
          <option value="">All BMW chassis</option>
          {#each chassisList as c (c.id)}
            <option value={c.id}>{c.display_name}</option>
          {/each}
        </select>
        <Btn variant="primary" size="md" on:click={checkFitment}>Check fitment</Btn>
      </div>
    </div>
  </section>

  <!-- ━━━━━━ 04 · DRIVE — names + state only, no edition numerals ━━━━━━ -->
  <section class="wp-drive2">
    <div class="wp-drive2__head">
      <span class="evx-label wp-drive2__eyebrow">04 · DRIVE</span>
      <h2 class="wp-drive2__h">The limited series.</h2>
    </div>

    {#if loading}
      <p class="wp-skel">Loading editions.</p>
    {:else if driveItems.length > 0}
      <div class="wp-drive2__rail">
        {#each driveItems as d (d.id)}
          {@const dImg = imgOf(d)}
          <button class="wp-drive2__card" type="button" on:click={() => openDrive(d.slug ?? d.id)}>
            <div class="wp-slot wp-drive2__photo" class:wp-slot--photo={dImg} style="aspect-ratio:1 / 1;">
              {#if dImg}
                <img class="wp-slot__img" src={dImg} alt={d.title} />
              {:else}
                <span class="wp-slot__cap">SHOT · {d.title}</span>
              {/if}
            </div>
            <div class="wp-drive2__body">
              <h3 class="wp-drive2__title">{d.title}</h3>
              <span class="evx-label wp-drive2__state">{driveState(d.drive_issue_state)}</span>
            </div>
          </button>
        {/each}
        <div class="wp-drive2__rail-pad" aria-hidden="true"></div>
      </div>
    {:else}
      <p class="wp-empty">DRIVE editions are upcoming. <a href="#/drive">DRIVE archive</a>.</p>
    {/if}
  </section>

  <!-- ━━━━━━ PROOF BAND — origin · buying · the company ━━━━━━ -->
  <section class="wp-proof">
    <div class="wp-proof__inner">
      <div class="wp-proof__col">
        <span class="evx-label wp-proof__h">01 · Origin</span>
        <p class="wp-proof__body">
          Designed in Ireland, assembled abroad, <span class="wp-proof__em">finished in Dublin.</span>
        </p>
      </div>
      <div class="wp-proof__col">
        <span class="evx-label wp-proof__h">02 · Buying</span>
        <p class="wp-proof__body">
          Paid direct via Revolut — card, Apple Pay or Google Pay. A deposit holds incoming stock.
        </p>
      </div>
      <div class="wp-proof__col">
        <span class="evx-label wp-proof__h">03 · The company</span>
        <p class="evx-caption wp-proof__registry">
          EIRVOX LIMITED<br/>
          <span class="wp-proof__dim">A VANTANÉANT INTERNATIONAL LTD COMPANY</span><br/>
          REGISTERED IN IRELAND · <a class="wp-proof__verify" href="https://core.cro.ie" target="_blank" rel="noopener noreferrer">CRO 806648</a> · DUBLIN, IRELAND<br/>
          <a class="wp-proof__mail" href="mailto:support@eirvox.ie">SUPPORT@EIRVOX.IE</a>
        </p>
      </div>
    </div>
  </section>

  <!-- ━━━━━━ FOOTER (shared imprint, warm paper) ━━━━━━ -->
  <Footer />

  {#if finderOpen}
    <WheelFinder
      consignmentSlug={CONSIGNMENT_SLUG}
      consignmentId={consignment?.id ?? null}
      basePriceEur={consignment?.price ?? 300}
      on:close={() => (finderOpen = false)}
    />
  {/if}
</div>

<style>
  .wp {
    min-height: 100vh;
    background: var(--evx-paper);
    color: var(--evx-ink);
    font-family: var(--evx-font-display);
  }

  /* ── Designed photo slot (shared). Empty = faint ink tint + hairline;
     with a photo = edge-to-edge, no fill/border (paper merges). ── */
  .wp-slot {
    position: relative;
    width: 100%;
    background: var(--evx-ink);   /* two-tone: black product blocks on white */
    border: none;
    border-radius: 0;
    overflow: hidden;
  }
  .wp-slot--photo { background: transparent; }
  .wp-slot__img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; display: block;
  }
  .wp-slot__cap {
    position: absolute;
    left: 12px;
    bottom: 11px;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }

  .wp-section__eyebrow { display: block; margin-bottom: var(--evx-space-lg); color: var(--evx-ink); }

  /* ── THE RANGE — marketplace grid (white cards, black type, image) ── */
  .wp-range { padding: var(--evx-space-3xl) 22px 8px; max-width: 1440px; margin: 0 auto; }
  .wp-range__head { margin-bottom: var(--evx-space-xl); }
  .wp-range__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(28px, 4vw, 44px);
    letter-spacing: -0.025em;
    line-height: 1;
    margin: 8px 0 0;
    color: var(--evx-ink);
  }
  .wp-range__grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--evx-space-lg) var(--evx-space-md); }
  .wp-card { text-align: left; background: none; border: none; padding: 0; cursor: pointer; color: var(--evx-ink); transition: transform 200ms ease; }
  .wp-card:hover { transform: translateY(-3px); }
  .wp-card__photo {
    position: relative;
    aspect-ratio: 4 / 5;
    background: var(--evx-paper-panel);
    overflow: hidden;
  }
  .wp-card__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .wp-card__body { padding: 14px 2px 0; display: flex; flex-direction: column; gap: 6px; }
  .wp-card__tag { color: var(--evx-ink-soft); }
  .wp-card__title { font-family: var(--evx-font-display); font-weight: 500; font-size: 18px; letter-spacing: -0.01em; line-height: 1.15; margin: 0; }
  .wp-card__price { font-family: var(--evx-font-display); font-weight: 500; font-size: 15px; color: var(--evx-ink); }
  @media (min-width: 600px) { .wp-range__grid { grid-template-columns: repeat(3, 1fr); gap: var(--evx-space-xl); } }
  @media (min-width: 1024px) {
    .wp-range { padding-left: max(48px, 6vw); padding-right: max(48px, 6vw); }
    .wp-range__grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* ── HERO — light editorial split (newsroom). Confident headline +
     standfirst left, large image right, generous air. The sticky bar
     sits ink-on-white above it. ── */
  .wp-hero {
    max-width: 1440px;
    margin: 0 auto;
    padding: clamp(72px, 17vh, 220px) 30px clamp(56px, 11vh, 130px);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .wp-hero__text { animation: evx-rise 700ms ease both; }
  .wp-hero__eyebrow { display: block; color: var(--evx-fox-orange); margin-bottom: 26px; }
  .wp-hero__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(48px, 9vw, 116px);
    line-height: 0.95;
    letter-spacing: -0.035em;
    color: var(--evx-ink);
    margin: 0 0 26px;
  }
  .wp-hero__stand {
    font-size: clamp(18px, 2.2vw, 24px);
    color: var(--evx-ink-soft);
    max-width: 460px;
    margin: 0 0 var(--evx-space-xl);
    line-height: 1.4;
  }
  .wp-hero__cta { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
  .wp-hero__link {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--evx-ink);
    background: none;
    border: none;
    border-bottom: 1px solid var(--evx-ink);
    padding: 0 0 4px;
    cursor: pointer;
    transition: opacity 160ms ease;
  }
  .wp-hero__link:hover { opacity: 0.55; }

  /* ── 02 · Material — fewer, larger tiles, more air ── */
  .wp-material { padding: var(--evx-space-3xl) 22px 8px; }
  .wp-material__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-lg);
  }
  .wp-material__tile { margin: 0; }
  .wp-material__cap {
    display: block;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--evx-ink-soft);
    margin-top: 9px;
  }

  /* ── 03 · Fitment ── */
  .wp-fitment { padding: var(--evx-space-3xl) 22px 8px; }
  .wp-fitment__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 32px;
    letter-spacing: -0.02em;
    line-height: 1.06;
    margin: 0 0 var(--evx-space-xl);
  }
  .wp-fitment__row { display: flex; flex-direction: column; gap: 18px; }
  .wp-fitment__control { display: flex; flex-direction: column; gap: 14px; }
  .wp-fitment__label { display: block; color: var(--evx-ink-soft); }
  .wp-fitment__select {
    width: 100%;
    background: rgba(26, 26, 26, 0.03);
    border: 1px solid var(--evx-rule-light);
    border-radius: 3px;
    color: var(--evx-ink);
    font-family: var(--evx-font-display);
    font-size: 15px;
    padding: 14px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }
  .wp-fitment__select:focus { outline: none; border-color: var(--evx-ink-soft); }

  /* ── 04 · DRIVE ── */
  .wp-drive2 { padding: var(--evx-space-3xl) 0 8px; }
  .wp-drive2__head { padding: 0 22px; margin-bottom: var(--evx-space-lg); }
  /* Champagne is illegible on paper and is reserved for dark DRIVE plate
     elements; the home DRIVE eyebrow uses the standard ink-soft label. */
  .wp-drive2__eyebrow { display: block; color: var(--evx-ink-soft); margin-bottom: 10px; }
  .wp-drive2__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 30px;
    letter-spacing: -0.02em;
    line-height: 1;
    margin: 0;
  }
  .wp-drive2__rail {
    display: flex;
    gap: var(--evx-space-lg);
    overflow-x: auto;
    padding: 0 22px 8px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .wp-drive2__rail::-webkit-scrollbar { display: none; }
  .wp-drive2__rail-pad { flex: 0 0 8px; }
  /* No boxed card — photo slot + name + state, separated by space. */
  .wp-drive2__card {
    flex: 0 0 72%;
    max-width: 300px;
    scroll-snap-align: start;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--evx-ink);
    padding: 0;
    transition: transform 200ms ease;
  }
  .wp-drive2__card:hover { transform: translateY(-2px); }
  .wp-drive2__photo { border-radius: 3px; }
  .wp-drive2__body { padding: 14px 2px 0; display: flex; flex-direction: column; gap: 7px; }
  .wp-drive2__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 19px;
    letter-spacing: -0.01em;
    line-height: 1.2;
    margin: 0;
  }
  .wp-drive2__state { display: inline-block; color: var(--evx-ink-soft); letter-spacing: 0.16em; }

  /* ── Proof band ── */
  .wp-proof { padding: var(--evx-space-3xl) 22px 0; margin: 0 0 var(--evx-space-3xl); }
  .wp-proof__inner {
    border-top: 1px solid var(--evx-rule-light);
    border-bottom: 1px solid var(--evx-rule-light);
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }
  .wp-proof__col {
    padding: 22px 0;
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .wp-proof__col:last-child { border-bottom: none; }
  .wp-proof__h { display: block; margin-bottom: 12px; }
  .wp-proof__body {
    font-size: 16px;
    line-height: 1.5;
    color: var(--evx-ink-soft);
    max-width: 320px;
    margin: 0;
  }
  .wp-proof__em { color: var(--evx-ink); font-weight: 500; }
  .wp-proof__registry {
    color: var(--evx-ink-soft);
    line-height: 1.7;
    margin: 0;
  }
  .wp-proof__mail {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--evx-ink-soft);
    transition: var(--evx-transition);
  }
  .wp-proof__mail:hover { color: var(--evx-ink); }
  .wp-proof__dim { opacity: 0.7; }
  .wp-proof__verify {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: var(--evx-transition);
  }
  .wp-proof__verify:hover { color: var(--evx-ink); }

  /* ── Skeletons / empties ── */
  .wp-skel, .wp-empty {
    padding: 24px 22px;
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    color: var(--evx-ink-soft);
  }
  .wp-empty a { color: var(--evx-ink); text-decoration: underline; text-underline-offset: 3px; }

  /* ── Desktop scaling (mobile-first; widen a touch above 600px) ── */
  @media (min-width: 600px) {
    .wp-material__grid { grid-template-columns: repeat(2, 1fr); gap: var(--evx-space-xl); }
    .wp-fitment__row { flex-direction: row; align-items: stretch; gap: var(--evx-space-2xl); }
    .wp-fitment__photo { flex: 1; }
    .wp-fitment__control { flex: 0 0 280px; justify-content: center; }
    .wp-fitment__h { font-size: 40px; }
    .wp-drive2__card { flex: 0 0 340px; }
    .wp-proof__inner { grid-template-columns: 1fr 1fr 1fr; gap: var(--evx-space-2xl); }
    .wp-proof__col { padding: var(--evx-space-lg) 0; border-bottom: none; }
  }
  @media (min-width: 1024px) {
    .wp-material, .wp-fitment, .wp-drive2__head, .wp-proof {
      padding-left: max(48px, 6vw); padding-right: max(48px, 6vw);
    }
    .wp-drive2__rail { padding-left: max(48px, 6vw); padding-right: max(48px, 6vw); }
  }
</style>
