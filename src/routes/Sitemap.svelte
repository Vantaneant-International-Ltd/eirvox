<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { siteFlags } from '../lib/flags';
  import { getCategories, getRecentListings, type Category, type ListingWithExtras } from '../lib/api';

  // Wheel-specialist scope: list only wheel/DRIVE/account/house/legal
  // routes. getCategories() already filters to the allowlist, so the
  // marketplace rows collapse to the wheel category on their own.
  $: wheelMode = $siteFlags.wheel_specialist_mode;

  let categories: Category[] = [];
  let sampleListings: ListingWithExtras[] = [];

  onMount(async () => {
    applySeo(seo.sitemap());
    [categories, sampleListings] = await Promise.all([
      getCategories(),
      getRecentListings(8),
    ]);
  });

  $: marketplace = [
    { path: '/', label: 'Home', desc: wheelMode
        ? 'Wheel-specialist landing - DRIVE hero, the line, find your fit.'
        : 'Marketplace landing - DRIVE hero, featured, recent.' },
    ...(wheelMode ? [
      { path: '/wheels', label: 'Wheels', desc: 'The carbon wheel line and the BMW consignment piece.' },
    ] : []),
    ...categories.map(c => ({
      path: `/${c.slug}`,
      label: c.name,
      desc: c.description ? `${c.description.split('.')[0]}.` : '',
    })),
  ];

  const drive = [
    { path: '/drive', label: 'DRIVE - all issues', desc: 'Issue index. House-produced enthusiast objects.' },
  ];

  const seller = [
    { path: '/sell',            label: 'Sell on Éirvox',       desc: 'Tier comparison · cohort schedule · what we look for.' },
    { path: '/sell/apply',      label: 'Apply to sell',         desc: 'Five-step application for Cohort 03.' },
    { path: '/sell/create',     label: 'Create a listing',      desc: 'Six-step listing flow.' },
    { path: '/sell/dashboard',  label: 'Seller dashboard',      desc: 'Manage listings + reservations.' },
  ];

  const buyer = [
    { path: '/account',           label: 'Account overview',  desc: 'Welcome strip · stat cards · recent activity.' },
    { path: '/account/orders',    label: 'Reservations',      desc: 'Expandable timeline + per-status actions.' },
    { path: '/account/saved',     label: 'Saved items',       desc: 'Listings you\'ve kept for later.' },
    { path: '/account/settings',  label: 'Settings',          desc: 'Profile · notifications · account actions.' },
    { path: '/login',             label: 'Sign in',           desc: 'Email + password sign-in.' },
  ];

  const transactional = [
    { path: '/search',                                 label: 'Search',                    desc: 'Search listings + tradespeople.' },
  ];

  const trade = [
    { path: '/trade',           label: 'TRADE',                 desc: 'Verified tradespeople directory.' },
    { path: '/trade/apply',     label: 'Apply to TRADE',        desc: 'Application for tradespeople.' },
  ];

  const trust = [
    { path: '/trust',   label: 'Trust & Protection',  desc: 'Deposits · authentication · buyer protection · disputes.' },
    { path: '/about',   label: 'About',                desc: 'Positioning, principles, contact.' },
  ];

  const utility = [
    { path: '/sitemap', label: 'Sitemap (this page)',  desc: 'Every page on the platform.' },
  ];

  // Wheel mode hides the Sellers, TRADE and Transactional (search)
  // sections entirely; flip the flag off to restore the full index.
  $: sections = wheelMode
    ? [
        { title: 'Wheels',  rows: marketplace },
        { title: 'DRIVE',   rows: drive },
        { title: 'Account', rows: buyer },
        { title: 'House',   rows: trust },
        { title: 'Utility', rows: utility },
      ]
    : [
        { title: 'Marketplace', rows: marketplace },
        { title: 'DRIVE',       rows: drive },
        { title: 'Sellers',     rows: seller },
        { title: 'Account',     rows: buyer },
        { title: 'TRADE',       rows: trade },
        { title: 'Transactional', rows: transactional },
        { title: 'House',       rows: trust },
        { title: 'Utility',     rows: utility },
      ];
</script>

<Nav />

<main id="main-content" class="sm-page">
  <div class="page-container">

    <header class="sm-header">
      <span class="evx-caption sm-header__pre">ÉIRVOX · INDEX</span>
      <h1 class="sm-title">Sitemap.</h1>
      <p class="sm-sub">
        Every page on Éirvox - grouped, with a one-line note on what each one's for.
        Useful for QA, crawlers, and finding what you've forgotten about.
      </p>
    </header>

    <div class="sm-sections">
      {#each sections as section}
        <section class="sm-section">
          <h2 class="sm-section__title">{section.title}</h2>
          <ul class="sm-rows">
            {#each section.rows as row}
              <li class="sm-row">
                <button class="sm-row__link" on:click={() => navigate(row.path)}>
                  <span class="evx-caption sm-row__path">{row.path}</span>
                  <span class="sm-row__label">{row.label}</span>
                  <span class="sm-row__desc">{row.desc}</span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/each}

      <!-- Sample listings -->
      <section class="sm-section">
        <h2 class="sm-section__title">Recent listings</h2>
        {#if sampleListings.length === 0}
          <p style="color: var(--evx-ink-soft); font-size: 13px;">
            No listings yet - they'll appear here as soon as Cohort 03 sellers post their first.
          </p>
        {:else}
          <ul class="sm-rows">
            {#each sampleListings as l (l.id)}
              <li class="sm-row">
                <button class="sm-row__link" on:click={() => navigate(`/listing/${l.slug ?? l.id}`)}>
                  <span class="evx-caption sm-row__path">/listing/{l.slug ?? l.id}</span>
                  <span class="sm-row__label">{l.title}</span>
                  <span class="sm-row__desc">
                    {l.subcategory ?? l.category_slug ?? ''}{(l.subcategory || l.category_slug) && l.city ? ' · ' : ''}{l.city ?? ''}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        <button class="evx-caption sm-section__more" on:click={() => navigate('/')}>
          See all categories →
        </button>
      </section>
    </div>

  </div>
</main>

<Footer />

<style>
  .sm-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .sm-header {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
    max-width: 760px;
  }
  .sm-header__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }
  .sm-title {
    font-family: var(--evx-font-display);
    font-size: clamp(40px, 6vw, 72px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-lg);
  }
  .sm-sub { font-size: 16px; line-height: 1.7; color: var(--evx-ink-soft); }

  .sm-sections {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--evx-space-2xl);
  }

  .sm-section { display: flex; flex-direction: column; gap: var(--evx-space-md); }
  .sm-section__title {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--evx-warm-black);
    padding-bottom: var(--evx-space-sm);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .sm-rows { display: flex; flex-direction: column; gap: 0; }

  .sm-row {
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .sm-row:last-child { border-bottom: none; }

  .sm-row__link {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    padding: var(--evx-space-md) 0;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: var(--evx-transition);
  }
  .sm-row__link:hover { opacity: 0.70; }

  .sm-row__path { color: var(--evx-ink-soft); }
  .sm-row__label {
    font-family: var(--evx-font-display);
    font-size: 15px;
    font-weight: 500;
    color: var(--evx-warm-black);
  }
  .sm-row__desc { font-size: 13px; line-height: 1.5; color: var(--evx-ink-soft); }

  .sm-section__more {
    background: none; border: none; padding: var(--evx-space-sm) 0 0;
    color: var(--evx-fox-orange); cursor: pointer;
    text-align: left;
    transition: var(--evx-transition);
  }
  .sm-section__more:hover { opacity: 0.70; }

  @media (max-width: 1023px) {
    .sm-sections { grid-template-columns: 1fr; }
  }
</style>
