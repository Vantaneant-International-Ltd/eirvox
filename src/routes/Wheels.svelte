<script lang="ts">
  // ============================================================
  // /wheels — the focused landing page for ÉIRVOX's wheel line.
  //
  // Surfaces:
  //   * The consignment BMW M Sport line (v20 seed). Wired to
  //     ListingDetail via its slug; landing pulls the listing row
  //     by id and renders a one-card showcase.
  //   * DRIVE upcoming carbon-LED wheels (when seeded).
  //
  // Hero visual is deliberately a TODO marker for a Claude Design
  // pass; nothing fabricated here. Structure + hierarchy only.
  // ============================================================
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo } from '../lib/seo';
  import { supabase } from '../lib/supabase';
  import { getDriveListings, type ListingWithExtras } from '../lib/api';

  let consignment: ListingWithExtras | null = null;
  let driveUpcoming: ListingWithExtras[] = [];
  let loading = true;

  onMount(async () => {
    applySeo({
      title: 'Carbon Steering Wheels · ÉIRVOX',
      description: 'BMW carbon steering wheels. Standard M Sport consignment and DRIVE LED editions. Dublin, Ireland.',
      path: '/wheels',
    });

    // The consignment line is identified by category + title-prefix;
    // we surface the FIRST active automotive listing with "Steering
    // Wheel" in the title. The seed row from v20 matches. This avoids
    // hardcoding a UUID before the matrix is seeded.
    const { data: consignmentRow } = await supabase
      .from('listings')
      .select('*, seller:sellers(id,trading_name,handle,tier,is_house), images:listing_images(id,public_url,sort_order)')
      .eq('status', 'active')
      .eq('category_slug', 'automotive')
      .ilike('title', '%Steering Wheel%')
      .eq('is_drive', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    consignment = (consignmentRow as ListingWithExtras | null) ?? null;

    driveUpcoming = await getDriveListings({ state: 'upcoming', limit: 4 });

    loading = false;
  });

  function openListing(slugOrId: string) {
    navigate(`/listing/${slugOrId}`);
  }
</script>

<Nav />

<main id="main-content" class="wheels-page">
  <div class="page-container">

    <!-- HERO — TODO Claude Design pass.
         Leaving the visual deliberately under-designed; structure and
         hierarchy only. The headline + sub stays as the editorial
         baseline. -->
    <header class="wheels-hero">
      <span class="evx-caption wheels-hero__pre">WHEELS · IRELAND</span>
      <h1 class="wheels-hero__title">
        Carbon steering wheels.<br />
        Made for your chassis.
      </h1>
      <p class="wheels-hero__sub">
        BMW M Sport carbon, configured by fitment and style.
        Stock held in Dublin. Pay direct. An Post or collection.
      </p>
      <!-- TODO(claude-design): hero visual. Keep restraint. No glass,
           no animation. Real product photography only. -->
    </header>

    <!-- CONSIGNMENT — the standard wheel line -->
    <section class="wheels-section">
      <div class="wheels-section__head">
        <span class="evx-caption wheels-section__num">01 · STANDARD</span>
        <h2 class="wheels-section__h">Standard line.</h2>
        <p class="wheels-section__sub">
          BMW M Sport carbon-trim. Seven styles. Three fitment groups. No LED.
        </p>
      </div>

      {#if loading}
        <div class="wheels-skel">Loading.</div>
      {:else if consignment}
        <button class="wheels-card" type="button"
                on:click={() => openListing(consignment?.slug ?? consignment?.id ?? '')}>
          <div class="wheels-card__img">
            {#if consignment.images?.[0]?.public_url}
              <img src={consignment.images[0].public_url} alt={consignment.title} />
            {:else}
              <div class="wheels-card__img-empty">
                <!-- TODO(claude-design): hero product render -->
              </div>
            {/if}
          </div>
          <div class="wheels-card__body">
            <span class="evx-caption wheels-card__tag">STANDARD · CONSIGNMENT</span>
            <h3 class="wheels-card__title">{consignment.title}</h3>
            {#if consignment.subtitle}
              <p class="wheels-card__sub">{consignment.subtitle}</p>
            {/if}
            <div class="wheels-card__price">
              {#if consignment.original_price && consignment.original_price > consignment.price}
                <s class="wheels-card__was">€{consignment.original_price}</s>
              {/if}
              <strong>€{consignment.price}</strong>
            </div>
            <span class="evx-caption wheels-card__cta">CONFIGURE & BUY →</span>
          </div>
        </button>
      {:else}
        <p class="wheels-empty">
          Standard line is in preparation. Join the list for first access.
        </p>
      {/if}
    </section>

    <!-- DRIVE — the premium tier -->
    <section class="wheels-section">
      <div class="wheels-section__head">
        <span class="evx-caption wheels-section__num">02 · DRIVE</span>
        <h2 class="wheels-section__h">DRIVE editions.</h2>
        <p class="wheels-section__sub">
          Premium carbon with LED. Made to order. Edition numbered.
        </p>
      </div>

      {#if loading}
        <div class="wheels-skel">Loading.</div>
      {:else if driveUpcoming.length > 0}
        <div class="wheels-grid">
          {#each driveUpcoming as d (d.id)}
            <button class="wheels-card wheels-card--small" type="button"
                    on:click={() => openListing(d.slug ?? d.id)}>
              <div class="wheels-card__img wheels-card__img--small">
                {#if d.images?.[0]?.public_url}
                  <img src={d.images[0].public_url} alt={d.title} />
                {/if}
              </div>
              <div class="wheels-card__body">
                <span class="evx-caption wheels-card__tag">DRIVE</span>
                <h3 class="wheels-card__title">{d.title}</h3>
                <span class="evx-caption wheels-card__cta">VIEW →</span>
              </div>
            </button>
          {/each}
        </div>
      {:else}
        <p class="wheels-empty">DRIVE editions are upcoming. <a href="#/drive">DRIVE archive</a>.</p>
      {/if}
    </section>

    <!-- HOW IT WORKS -->
    <section class="wheels-section">
      <div class="wheels-section__head">
        <span class="evx-caption wheels-section__num">03 · HOW IT WORKS</span>
        <h2 class="wheels-section__h">How it works.</h2>
      </div>
      <ol class="wheels-steps">
        <li><span class="wheels-step__num">01</span><div><strong>Find your fitment.</strong> Pick the model that matches your car. We route it to the correct group.</div></li>
        <li><span class="wheels-step__num">02</span><div><strong>Choose a style.</strong> Seven styles per group. Sold-out combinations are visibly disabled, not hidden.</div></li>
        <li><span class="wheels-step__num">03</span><div><strong>Pay direct.</strong> Card, Apple Pay, Google Pay, or pay-by-bank through Revolut. ÉIRVOX is seller of record.</div></li>
        <li><span class="wheels-step__num">04</span><div><strong>An Post or collection.</strong> Tracked delivery anywhere in Ireland, or pick up in Dublin.</div></li>
      </ol>
    </section>

  </div>
</main>

<Footer />

<style>
  .wheels-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .wheels-hero {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }
  .wheels-hero__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-lg); }
  .wheels-hero__title {
    font-family: var(--evx-font-display);
    font-size: clamp(36px, 5vw, 64px);
    font-weight: 500;
    letter-spacing: -0.025em;
    line-height: 1.08;
    margin-bottom: var(--evx-space-lg);
  }
  .wheels-hero__sub {
    font-size: 16px;
    line-height: 1.7;
    color: var(--evx-ink-soft);
    max-width: 560px;
  }

  .wheels-section { padding: var(--evx-space-2xl) 0; border-bottom: 1px solid var(--evx-rule-light); }
  .wheels-section__num { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-lg); }
  .wheels-section__h {
    font-family: var(--evx-font-display);
    font-size: clamp(26px, 3.2vw, 36px);
    font-weight: 500;
    letter-spacing: -0.02em;
    margin-bottom: var(--evx-space-md);
  }
  .wheels-section__sub { font-size: 14px; line-height: 1.7; color: var(--evx-ink-soft); margin-bottom: var(--evx-space-xl); max-width: 520px; }

  .wheels-skel, .wheels-empty {
    padding: var(--evx-space-xl) 0;
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--evx-ink-soft);
  }
  .wheels-empty a { color: var(--evx-warm-black); text-decoration: underline; text-underline-offset: 3px; }

  .wheels-card {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--evx-space-xl);
    text-align: left;
    background: var(--evx-paper);
    border: 1px solid var(--evx-rule-light);
    padding: 0;
    cursor: pointer;
    width: 100%;
    overflow: hidden;
    transition: border-color 200ms ease;
  }
  .wheels-card:hover { border-color: var(--evx-warm-black); }
  .wheels-card--small { display: flex; flex-direction: column; gap: 0; }

  .wheels-card__img {
    aspect-ratio: 4 / 3;
    overflow: hidden;
    background: rgba(0,0,0,0.04);
  }
  .wheels-card__img--small { aspect-ratio: 1 / 1; }
  .wheels-card__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .wheels-card__img-empty { width: 100%; height: 100%; }

  .wheels-card__body {
    padding: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    justify-content: space-between;
  }
  .wheels-card__tag { color: var(--evx-fox-orange); }
  .wheels-card__title {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    margin: 0;
  }
  .wheels-card__sub { font-size: 13px; line-height: 1.6; color: var(--evx-ink-soft); margin: 0; }
  .wheels-card__price {
    display: flex; align-items: baseline; gap: var(--evx-space-sm);
    font-family: var(--evx-font-display);
    font-size: 24px;
    font-weight: 500;
    color: var(--evx-warm-black);
    margin-top: var(--evx-space-md);
  }
  .wheels-card__was { font-size: 14px; color: var(--evx-ink-soft); text-decoration: line-through; font-weight: 400; }
  .wheels-card__cta { color: var(--evx-warm-black); }

  .wheels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--evx-space-md);
  }

  .wheels-steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .wheels-steps li {
    display: flex;
    gap: var(--evx-space-xl);
    padding: var(--evx-space-lg) 0;
    border-bottom: 1px solid var(--evx-rule-light);
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
  }
  .wheels-steps li:last-child { border-bottom: none; }
  .wheels-steps strong { color: var(--evx-warm-black); font-weight: 500; }
  .wheels-step__num {
    font-family: var(--evx-font-mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--evx-fox-orange);
    flex-shrink: 0;
    margin-top: 2px;
  }

  @media (max-width: 767px) {
    .wheels-card { grid-template-columns: 1fr; }
  }
</style>
