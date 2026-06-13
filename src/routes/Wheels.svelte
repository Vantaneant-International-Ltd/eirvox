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
  import WheelsMenu from '../lib/WheelsMenu.svelte';
  import Footer from '../lib/Footer.svelte';
  import Btn from '../lib/wheels-ui/Btn.svelte';

  const CONSIGNMENT_SLUG = 'bmw-m-sport-carbon-consignment';

  const MATERIALS = [
    '2×2 Twill carbon fibre',
    'Alcantara grip',
    'Integrated LED shift lights',
    'Billet aluminium hardware',
  ];

  let consignment: ListingWithExtras | null = null;
  let driveItems: ListingWithExtras[] = [];
  let chassisList: FitmentChassis[] = [];
  let selectedChassisId = '';
  let loading = true;
  let finderOpen = false;
  let menuOpen = false;
  let scrolled = false;

  onMount(async () => {
    applySeo({
      title: 'Carbon Steering Wheels · ÉIRVOX',
      description: 'BMW carbon steering wheels for Irish drivers. DRIVE limited line and a fitted BMW range. Designed in Ireland, assembled abroad, finished in Dublin.',
      path: '/wheels',
    });

    const [{ data: con }, drives, chassis] = await Promise.all([
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
    driveItems = (drives ?? []).filter(d => d.drive_issue_state !== 'archived');
    chassisList = chassis ?? [];
    loading = false;
  });

  function onScroll(e: Event) {
    scrolled = (e.currentTarget as HTMLElement).scrollTop > 14;
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
  $: heroImg = imgOf(consignment);
</script>

<div class="wp evx-root" on:scroll={onScroll}>

  <!-- ━━━━━━ TOP BAR (sticky over hero, blurs on scroll) ━━━━━━ -->
  <header class="wp-top" class:wp-top--scrolled={scrolled}>
    <button class="wp-top__home" type="button" on:click={() => navigate('/')} aria-label="ÉIRVOX home"
            style="background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center;">
      <img src="/brand/wordmark.png" alt="ÉIRVOX"
           style="height:16px;width:auto;display:block;" />
    </button>
    <button class="wp-top__menu" type="button"
            on:click={() => (menuOpen = true)} aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>

  <WheelsMenu open={menuOpen} on:close={() => (menuOpen = false)} />

  <!-- ━━━━━━ 01 · IGNITION ━━━━━━ -->
  <section class="wp-ignition">
    <div class="wp-ig__inner">
      <span class="evx-label wp-ig__eyebrow">01 · Ignition</span>
      <h1 class="wp-ig__h">The two seconds<br/>before ignition.</h1>
      <p class="evx-editorial wp-ig__stand">Engineered to be felt before it's seen.</p>
      <div class="wp-ig__cta">
        {#if consignment}
          <Btn variant="primary" size="md" on:click={openConsignment}>Explore the wheel</Btn>
        {:else}
          <Btn variant="primary" size="md" on:click={() => (finderOpen = true)}>Find your fit</Btn>
        {/if}
      </div>
    </div>
    <div class="wp-slot wp-ig__photo" class:wp-slot--photo={heroImg}
         style="aspect-ratio:{heroImg ? '1 / 1' : '16 / 9'};">
      {#if heroImg}
        <img class="wp-slot__img" src={heroImg} alt={consignment?.title ?? 'ÉIRVOX carbon wheel'} />
      {:else}
        <span class="wp-slot__cap">SHOT 01 · ¾ FRONT</span>
      {/if}
    </div>
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
          ÉIRVOX SYSTEMS LTD · CRO 712304<br/>
          DUBLIN, IRELAND<br/>
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

  /* ── Top bar ── */
  .wp-top {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 22px 12px;
    padding-top: max(env(safe-area-inset-top), 18px);
    background: transparent;
    transition: background 240ms ease, border-color 240ms ease, backdrop-filter 240ms ease;
    border-bottom: 1px solid transparent;
  }
  .wp-top--scrolled {
    background: rgba(245, 242, 237, 0.82);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom-color: var(--evx-rule-light);
  }
  .wp-top__menu {
    display: flex; flex-direction: column; gap: 4px;
    padding: 6px;
    background: none; border: none;
    cursor: pointer;
  }
  .wp-top__menu span { display: block; width: 19px; height: 1.5px; background: var(--evx-ink); }

  /* ── Designed photo slot (shared). Empty = faint ink tint + hairline;
     with a photo = edge-to-edge, no fill/border (paper merges). ── */
  .wp-slot {
    position: relative;
    width: 100%;
    background: rgba(26, 26, 26, 0.045);
    border: 1px solid var(--evx-rule-light);
    border-radius: 3px;
    overflow: hidden;
  }
  .wp-slot--photo { background: transparent; border: none; }
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
    color: var(--evx-ink-soft);
  }

  .wp-section__eyebrow { display: block; margin-bottom: var(--evx-space-lg); color: var(--evx-ink-soft); }

  /* ── 01 · Ignition ── */
  .wp-ignition {
    padding: var(--evx-space-xl) 22px 8px;
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-2xl);
  }
  .wp-ig__inner { animation: evx-rise 700ms ease both; }
  .wp-ig__eyebrow { display: block; color: var(--evx-ink-soft); margin-bottom: 18px; }
  .wp-ig__h {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: 44px;
    line-height: 0.98;
    letter-spacing: -0.026em;
    color: var(--evx-ink);
    margin: 0 0 16px;
  }
  .wp-ig__stand {
    font-size: 17px;
    color: var(--evx-ink-soft);
    max-width: 340px;
    margin: 0 0 var(--evx-space-xl);
    line-height: 1.4;
  }
  .wp-ig__cta { display: flex; gap: 10px; flex-wrap: wrap; }

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
    .wp-ig__h { font-size: 60px; }
    .wp-ig__stand { font-size: 19px; max-width: 460px; }
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
    .wp-ig__h { font-size: 84px; }
    .wp-ig__stand { font-size: 21px; }
    .wp-ignition, .wp-material, .wp-fitment, .wp-drive2__head, .wp-proof {
      padding-left: max(48px, 6vw); padding-right: max(48px, 6vw);
    }
    .wp-drive2__rail { padding-left: max(48px, 6vw); padding-right: max(48px, 6vw); }
  }
</style>
