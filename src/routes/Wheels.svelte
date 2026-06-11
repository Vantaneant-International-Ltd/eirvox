<script lang="ts">
  // ============================================================
  // /wheels — approved homepage (dark cinematic, DRIVE-led).
  //
  // Faithful translation of the approved prototype. Backend wiring:
  //   * Consignment listing pulled by slug (status=active gate so the
  //     row stays hidden until the reviewer flips it live).
  //   * DRIVE pulled via getDriveListings, archived filtered out.
  //   * Fitment chooser opens the new WheelFinder modal (live data).
  //
  // Origin copy is the honest Apple-style framing per the brief:
  //   short: "Designed in Ireland. Finished in Dublin."
  //   full:  "Designed in Ireland, assembled abroad, finished in
  //          Dublin."
  // No "made in Dublin/Ireland", no "by hand", no "finished by hand".
  // ============================================================
  import { onMount } from 'svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { supabase } from '../lib/supabase';
  import {
    getDriveListings,
    type ListingWithExtras,
  } from '../lib/api';
  import WheelFinder from '../lib/WheelFinder.svelte';
  import WheelsMenu from '../lib/WheelsMenu.svelte';
  import Footer from '../lib/Footer.svelte';
  import PhotoFrame from '../lib/wheels-ui/PhotoFrame.svelte';
  import Btn from '../lib/wheels-ui/Btn.svelte';
  import Money from '../lib/wheels-ui/Money.svelte';
  import Chevron from '../lib/wheels-ui/Chevron.svelte';

  const CONSIGNMENT_SLUG = 'bmw-m-sport-carbon-consignment';

  let consignment: ListingWithExtras | null = null;
  let driveItems: ListingWithExtras[] = [];
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

    const [{ data: con }, drives] = await Promise.all([
      supabase
        .from('listings')
        .select('*, seller:sellers(id,trading_name,handle,tier,is_house), images:listing_images(id,public_url,sort_order)')
        .eq('slug', CONSIGNMENT_SLUG)
        .eq('status', 'active')
        .maybeSingle(),
      getDriveListings({ limit: 6 }),
    ]);

    consignment = (con as ListingWithExtras | null) ?? null;
    driveItems = (drives ?? []).filter(d => d.drive_issue_state !== 'archived');
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
</script>

<div class="wp evx-root" on:scroll={onScroll}>

  <!-- ━━━━━━ TOP BAR (sticky over hero, blurs on scroll) ━━━━━━ -->
  <header class="wp-top" class:wp-top--scrolled={scrolled}>
    <button class="wp-top__home" type="button" on:click={() => navigate('/')} aria-label="ÉIRVOX home"
            style="background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center;">
      <img src="/brand/wordmark.png" alt="ÉIRVOX"
           style="height:16px;width:auto;display:block;filter:invert(1) brightness(1.05);" />
    </button>
    <button class="wp-top__menu" type="button"
            on:click={() => (menuOpen = true)} aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>

  <WheelsMenu open={menuOpen} on:close={() => (menuOpen = false)} />

  <!-- ━━━━━━ HERO — full-bleed carbon-weave, DRIVE-led ━━━━━━ -->
  <section class="wp-hero evx-carbon evx-carbon--lit">
    <div class="wp-hero__shade" aria-hidden="true"></div>
    <span class="wp-hero__plate-cap">Photo · DRIVE BMW M Sport, LED lit</span>

    <div class="wp-hero__inner">
      <span class="evx-label wp-hero__eyebrow">Dublin · Carbon · LED</span>
      <h1 class="wp-hero__h">
        Carbon.<br/>
        Designed in Ireland.<br/>
        <span class="evx-editorial">Finished in Dublin.</span>
      </h1>
      <p class="wp-hero__sub">
        Limited-run carbon steering wheels. DRIVE editions and a fitted BMW range.
        Designed in Ireland, assembled abroad, finished in Dublin. Find the one that fits your car.
      </p>
      <div class="wp-hero__cta">
        <Btn variant="primary" size="md" on:click={() => (finderOpen = true)}>Find your fit</Btn>
        <Btn variant="ghost" size="md"
             on:click={() => driveItems[0] && openDrive(driveItems[0].slug ?? driveItems[0].id)}>
          Explore DRIVE
        </Btn>
      </div>
    </div>
  </section>

  <!-- ━━━━━━ FIT BAND (target of the "How it works" nav link) ━━━━━━ -->
  <section class="wp-fit" id="how">
    <button class="wp-fit__card" type="button" on:click={() => (finderOpen = true)}>
      <div class="wp-fit__head">
        <span class="evx-label">Fitment finder</span>
        <span class="wp-fit__icon">
          <Chevron size={12} color="var(--evx-paper)" />
        </span>
      </div>
      <h2 class="wp-fit__h">Will it fit your BMW?</h2>
      <p class="wp-fit__sub">Pick your series, then your model. We do the rest. No part codes.</p>
    </button>
  </section>

  <!-- ━━━━━━ DRIVE LED ━━━━━━ -->
  <section class="wp-drive">
    <div class="wp-drive__head">
      <div>
        <span class="evx-label wp-drive__eyebrow">DRIVE · Limited</span>
        <h2 class="wp-drive__h">The carbon line</h2>
      </div>
      <span class="evx-meta wp-drive__count">
        {String(driveItems.length).padStart(2, '0')} {driveItems.length === 1 ? 'piece' : 'pieces'}
      </span>
    </div>
    <p class="evx-editorial wp-drive__pull">
      Designed in Ireland, finished in Dublin. Ten of each, then gone.
    </p>

    {#if loading}
      <p class="wp-skel">Loading editions.</p>
    {:else if driveItems.length > 0}
      <div class="wp-drive__rail">
        {#each driveItems as d (d.id)}
          <button class="wp-drive__card" type="button"
                  on:click={() => openDrive(d.slug ?? d.id)}>
            <PhotoFrame
              lit
              aspect="4 / 3"
              caption={`${d.title} · LED lit`}
              src={d.cover_image ?? d.images?.[0]?.public_url ?? null}
              alt={d.title}
            />
            <div class="wp-drive__body">
              <div class="wp-drive__meta">
                <span class="evx-label wp-drive__marque">DRV-{d.drive_issue ?? '???'}</span>
                <span class="evx-label wp-drive__arriving">
                  {d.drive_issue_date ? d.drive_issue_date.toUpperCase() : 'UPCOMING'} · {d.drive_made_count ?? 10} made
                </span>
              </div>
              <h3 class="wp-drive__title">{d.title}</h3>
              {#if d.subtitle}<p class="wp-drive__desc">{d.subtitle}</p>{/if}
              <div class="wp-drive__foot">
                <Money price={d.price} was={d.original_price ?? null} size={16} />
                <span class="wp-drive__view">View <Chevron size={11} color="var(--evx-paper)" /></span>
              </div>
            </div>
          </button>
        {/each}
        <div class="wp-drive__rail-pad" aria-hidden="true"></div>
      </div>
    {:else}
      <p class="wp-empty">DRIVE editions are upcoming. <a href="#/drive">DRIVE archive</a>.</p>
    {/if}
  </section>

  <!-- ━━━━━━ STANDARD — secondary billing ━━━━━━ -->
  <section class="wp-std">
    <div class="wp-std__inner">
      <span class="evx-label wp-std__pre">Also available</span>
      <div class="wp-std__row">
        <div class="wp-std__media">
          <PhotoFrame aspect="3 / 4" radius={2} caption="BMW wheel · carbon, unlit" />
        </div>
        <div class="wp-std__body">
          {#if consignment}
            <h3 class="wp-std__title">{consignment.title}</h3>
            <p class="wp-std__sub">
              The accessible range. Carbon and Alcantara, fitted to your chassis.
              Seven finishes, three fitment groups.
            </p>
            <Money price={consignment.price} was={consignment.original_price ?? null} size={15} />
            <div class="wp-std__cta">
              <Btn variant="ghost" size="sm" on:click={openConsignment}>
                Choose & buy <Chevron size={11} color="var(--evx-paper)" />
              </Btn>
            </div>
          {:else}
            <h3 class="wp-std__title">BMW Carbon Sport Wheel</h3>
            <p class="wp-std__sub">
              The accessible range. Carbon and Alcantara, fitted to your chassis.
              Currently in preparation; the configurator opens when stock is checked in.
            </p>
            <Money price={300} was={399} size={15} />
            <div class="wp-std__cta">
              <Btn variant="ghost" size="sm" on:click={() => (finderOpen = true)}>
                Find your fit <Chevron size={11} color="var(--evx-paper)" />
              </Btn>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </section>

  <!-- ━━━━━━ THE HOUSE ━━━━━━ -->
  <section class="wp-house">
    <div class="wp-house__inner">
      <span class="evx-label wp-house__pre">The house</span>
      <p class="evx-editorial wp-house__pull">
        Designed in Ireland, assembled abroad, finished in Dublin. We frame every photograph,
        choose every supplier, and ship every wheel ourselves.
      </p>
    </div>
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

  <!-- ━━━━━━ FOOTER (shared imprint, dark surface) ━━━━━━ -->
  <Footer dark={true} />

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
    background: var(--evx-black);
    color: var(--evx-paper);
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
    background: rgba(14, 13, 12, 0.82);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom-color: var(--evx-rule-soft);
  }
  .wp-top__menu {
    display: flex; flex-direction: column; gap: 4px;
    padding: 6px;
    background: none; border: none;
    cursor: pointer;
  }
  .wp-top__menu span { display: block; width: 19px; height: 1.5px; background: var(--evx-paper); }

  /* ── Hero ── */
  .wp-hero {
    position: relative;
    min-height: 92vh;
    padding: 0 22px 38px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    margin-top: -72px;
    padding-top: 100px;
    --evx-led: rgba(232, 116, 44, 0.45);
  }
  .wp-hero__shade {
    position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(to bottom,
      rgba(14, 13, 12, 0.55) 0%,
      transparent 22%,
      transparent 48%,
      rgba(14, 13, 12, 0.92) 92%);
  }
  .wp-hero__plate-cap {
    position: absolute;
    left: 22px;
    top: 110px;
    font-family: var(--evx-font-mono);
    font-size: 9.5px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(201, 169, 97, 0.7);
  }
  .wp-hero__inner {
    position: relative;
    z-index: 1;
    animation: evx-rise 700ms ease both;
    padding-bottom: 16px;
  }
  .wp-hero__eyebrow { color: var(--evx-champagne); margin-bottom: 18px; display: block; }
  .wp-hero__h {
    font-family: var(--evx-font-display);
    font-weight: 600;
    font-size: 48px;
    line-height: 0.98;
    letter-spacing: -0.026em;
    color: var(--evx-paper);
    margin-bottom: 18px;
  }
  .wp-hero__h .evx-editorial { font-weight: 500; font-size: 0.92em; }
  .wp-hero__sub {
    font-size: 14.5px;
    color: var(--evx-paper-soft);
    max-width: 320px;
    margin: 0 0 24px;
    line-height: 1.55;
  }
  .wp-hero__cta { display: flex; gap: 10px; flex-wrap: wrap; }

  /* ── Fit band ── */
  .wp-fit { padding: 0 18px; margin: 38px 0; }
  .wp-fit__card {
    display: block;
    width: 100%;
    text-align: left;
    border: 1px solid var(--evx-rule);
    border-radius: 3px;
    padding: 22px 22px 24px;
    background: linear-gradient(180deg, var(--evx-surface-2), var(--evx-surface));
    color: var(--evx-paper);
    cursor: pointer;
    transition: border-color 200ms ease;
  }
  .wp-fit__card:hover { border-color: var(--evx-rule-strong); }
  .wp-fit__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .wp-fit__icon {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: 1px solid var(--evx-rule-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .wp-fit__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 25px;
    letter-spacing: -0.015em;
    line-height: 1.08;
  }
  .wp-fit__sub {
    font-size: 13.5px;
    color: var(--evx-ink-soft);
    margin-top: 9px;
    max-width: 300px;
    line-height: 1.55;
  }

  /* ── DRIVE ── */
  .wp-drive { margin-bottom: 8px; }
  .wp-drive__head {
    padding: 0 22px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .wp-drive__eyebrow { color: var(--evx-champagne); margin-bottom: 9px; display: block; }
  .wp-drive__h {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 27px;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .wp-drive__count { color: var(--evx-ink-soft); white-space: nowrap; }
  .wp-drive__pull {
    font-size: 16.5px;
    color: var(--evx-paper-soft);
    padding: 0 22px;
    margin: 0 0 20px;
    max-width: 330px;
  }
  .wp-drive__rail {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding: 0 22px 8px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .wp-drive__rail::-webkit-scrollbar { display: none; }
  .wp-drive__rail-pad { flex: 0 0 8px; }

  .wp-drive__card {
    flex: 0 0 78%;
    max-width: 320px;
    scroll-snap-align: start;
    background: var(--evx-surface);
    border: 1px solid var(--evx-rule);
    border-radius: 3px;
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    color: var(--evx-paper);
    padding: 0;
    transition: border-color 200ms ease, transform 200ms ease;
  }
  .wp-drive__card:hover { border-color: rgba(232, 116, 44, 0.45); transform: translateY(-2px); }
  .wp-drive__body { padding: 15px 16px 17px; }
  .wp-drive__meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .wp-drive__marque { color: var(--evx-champagne); letter-spacing: 0.18em; }
  .wp-drive__arriving { color: var(--evx-ink-soft); }
  .wp-drive__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 19px;
    letter-spacing: -0.01em;
    margin: 9px 0 2px;
    line-height: 1.2;
  }
  .wp-drive__desc { font-size: 12.5px; color: var(--evx-ink-soft); margin-bottom: 14px; }
  .wp-drive__foot { display: flex; align-items: center; justify-content: space-between; }
  .wp-drive__view {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    color: var(--evx-paper);
  }

  /* ── Standard ── */
  .wp-std { padding: 0 18px; margin: 46px 0 10px; }
  .wp-std__inner { border-top: 1px solid var(--evx-rule); padding-top: 26px; }
  .wp-std__pre { display: block; margin-bottom: 16px; }
  .wp-std__row { display: flex; gap: 16px; align-items: stretch; }
  .wp-std__media { flex: 0 0 38%; }
  .wp-std__body { flex: 1; display: flex; flex-direction: column; justify-content: center; }
  .wp-std__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    letter-spacing: -0.01em;
    line-height: 1.15;
    margin: 0;
  }
  .wp-std__sub { font-size: 12.5px; color: var(--evx-ink-soft); margin: 8px 0 13px; line-height: 1.5; }
  .wp-std__cta { margin-top: 16px; }

  /* ── House ── */
  .wp-house { padding: 0 22px; margin: 52px 0 40px; }
  .wp-house__inner { border-top: 1px solid var(--evx-rule); padding-top: 30px; }
  .wp-house__pre { display: block; margin-bottom: 16px; }
  .wp-house__pull {
    font-size: 22px;
    line-height: 1.32;
    color: var(--evx-paper);
    text-wrap: pretty;
    margin: 0;
  }
  /* ── Proof band ── */
  .wp-proof { padding: 0 22px; margin: 0 0 46px; }
  .wp-proof__inner {
    border-top: 1px solid var(--evx-rule);
    border-bottom: 1px solid var(--evx-rule);
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }
  .wp-proof__col {
    padding: 22px 0;
    border-bottom: 1px solid var(--evx-rule-soft);
  }
  .wp-proof__col:last-child { border-bottom: none; }
  .wp-proof__h { display: block; margin-bottom: 12px; }
  .wp-proof__body {
    font-size: 16px;
    line-height: 1.5;
    color: var(--evx-paper-soft);
    max-width: 320px;
    margin: 0;
  }
  .wp-proof__em { color: var(--evx-paper); font-weight: 500; }
  .wp-proof__registry {
    color: var(--evx-paper-soft);
    line-height: 1.7;
    margin: 0;
  }
  .wp-proof__mail {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--evx-paper-soft);
    transition: var(--evx-transition);
  }
  .wp-proof__mail:hover { color: var(--evx-paper); }

  /* ── Skeletons / empties ── */
  .wp-skel, .wp-empty {
    padding: 24px 22px;
    font-family: var(--evx-font-mono);
    font-size: 11.5px;
    color: var(--evx-ink-soft);
  }
  .wp-empty a { color: var(--evx-paper); text-decoration: underline; text-underline-offset: 3px; }

  /* ── Desktop scaling (mobile-first; widen a touch above 600px) ── */
  @media (min-width: 600px) {
    .wp-hero__h { font-size: 64px; }
    .wp-hero__sub { font-size: 16px; max-width: 460px; }
    .wp-fit__h { font-size: 30px; }
    .wp-drive__card { flex: 0 0 380px; }
    .wp-house__pull { font-size: 24px; max-width: 540px; }
    .wp-proof__inner { grid-template-columns: 1fr 1fr 1fr; gap: var(--evx-space-2xl); }
    .wp-proof__col { padding: 26px 0; border-bottom: none; }
  }
  @media (min-width: 1024px) {
    .wp-hero__h { font-size: 88px; }
    .wp-hero__sub { font-size: 18px; }
    .wp-hero, .wp-fit, .wp-drive__head, .wp-drive__pull, .wp-std,
    .wp-house, .wp-proof { padding-left: max(48px, 6vw); padding-right: max(48px, 6vw); }
    .wp-drive__rail { padding-left: max(48px, 6vw); padding-right: max(48px, 6vw); }
  }
</style>
