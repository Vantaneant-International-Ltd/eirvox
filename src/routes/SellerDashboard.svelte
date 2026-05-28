<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';

  onMount(() => applySeo(seo.sellDashboard()));
</script>

<Nav />

<main id="main-content" class="dash-page">
  <div class="page-container">

    <!-- Header -->
    <header class="dash-header">
      <div class="dash-header__left">
        <span class="evx-caption dash-header__pre">SELLER · DASHBOARD PREVIEW</span>
        <h1 class="dash-header__title">Your seller dashboard.</h1>
        <p class="dash-header__sub">
          Coming with Cohort 03 on 01 July 2026. This is what you'll see once your seller account is live.
          For now, it's read-only — a preview of the surface you'll spend most of your time on.
        </p>
      </div>
      <div class="dash-header__right">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
          Apply to sell →
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell/create')}>
          Try the listing flow
        </button>
      </div>
    </header>

    <!-- Mock dashboard -->
    <div class="dash">
      <!-- Sidebar -->
      <aside class="dash__side">
        <div class="dash__profile">
          <div class="dash__avatar">M</div>
          <div class="dash__profile-info">
            <div class="dash__profile-name">Moss &amp; Co.</div>
            <span class="evx-caption dash__profile-meta">@mossco · ATELIER</span>
            <span class="evx-caption dash__profile-since">Dublin 4 · since '23</span>
          </div>
        </div>

        <nav class="dash__nav">
          {#each [
            { label: 'Overview', count: null, active: true },
            { label: 'Buying', count: 1 },
            { label: 'Selling', count: 6 },
            { label: 'Offers', count: 4, warn: '2 expire' },
            { label: 'Saved', count: 12 },
            { label: 'Settings', count: null },
          ] as item}
            <button class="dash__nav-item" class:dash__nav-item--active={item.active}>
              <span>{item.label}</span>
              {#if item.count !== null}
                <span class="evx-caption dash__nav-count" class:dash__nav-count--warn={item.warn}>
                  {item.count}{#if item.warn} · {item.warn}{/if}
                </span>
              {/if}
            </button>
          {/each}
        </nav>

        <div class="dash__upgrade">
          <span class="evx-caption dash__upgrade-label">UPGRADE</span>
          <strong class="dash__upgrade-title">Become House.</strong>
          <p class="dash__upgrade-desc">By invitation. Editorial features &amp; DRIVE collaboration.</p>
          <button class="evx-caption dash__upgrade-link">Learn more →</button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="dash__main">
        <!-- Stats -->
        <div class="dash__stats">
          <div class="dash__stat">
            <span class="evx-label dash__stat-label">ACTIVE LISTINGS</span>
            <span class="dash__stat-val">6</span>
            <span class="evx-caption dash__stat-sub">+2 this week · 14 views/day avg</span>
          </div>
          <div class="dash__stat">
            <span class="evx-label dash__stat-label">SALES · 30D</span>
            <span class="dash__stat-val">€2,450</span>
            <span class="evx-caption dash__stat-sub">3 sold · 1 pending payout</span>
          </div>
          <div class="dash__stat dash__stat--accent">
            <span class="evx-label dash__stat-label dash__stat-label--accent">OPEN OFFERS</span>
            <span class="dash__stat-val">4</span>
            <span class="evx-caption dash__stat-sub">2 expire in &lt; 24h</span>
          </div>
          <div class="dash__stat">
            <span class="evx-label dash__stat-label">SELLER RATING</span>
            <span class="dash__stat-val">★ 4.94</span>
            <span class="evx-caption dash__stat-sub">312 sales lifetime</span>
          </div>
        </div>

        <!-- In transit order -->
        <section class="dash__section">
          <div class="dash__section-head">
            <span class="evx-label">IN TRANSIT · 1 ORDER</span>
            <button class="evx-caption dash__section-link">All orders →</button>
          </div>
          <div class="dash__order">
            <div class="dash__order-head">
              <div class="dash__order-thumb"></div>
              <div class="dash__order-info">
                <strong>Tudor Black Bay 58</strong>
                <span class="evx-caption">Order EIR-294018 · from Moss &amp; Co. · paid 26 May</span>
              </div>
              <span class="evx-caption dash__order-status">● IN TRANSIT</span>
            </div>
            <div class="dash__order-steps">
              {#each [
                { num: '01', label: 'PAID', detail: '26 May 11:04', done: true },
                { num: '02', label: 'CHECKED', detail: '26 May 16:48', done: true },
                { num: '03', label: 'SHIPPED', detail: '27 May 09:12', done: true },
                { num: '04', label: 'OUT FOR DELIVERY', detail: 'est. today 14:00–18:00', active: true },
                { num: '05', label: 'DELIVERED', detail: '—' },
              ] as step}
                <div
                  class="dash__order-step"
                  class:dash__order-step--done={step.done}
                  class:dash__order-step--active={step.active}
                >
                  <span class="evx-caption dash__order-step-num">{step.num}</span>
                  <span class="dash__order-step-label">{step.label}</span>
                  <span class="evx-caption dash__order-step-detail">{step.detail}</span>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <!-- Active listings -->
        <section class="dash__section">
          <div class="dash__section-head">
            <span class="evx-label">ACTIVE LISTINGS · 6</span>
            <button class="evx-btn evx-btn--ghost evx-btn--sm" on:click={() => navigate('/sell/create')}>
              + List new item
            </button>
          </div>

          <div class="dash__listings">
            <div class="dash__listings-head evx-caption">
              <span>ITEM</span>
              <span class="dash__listings-right">VIEWS</span>
              <span class="dash__listings-right">OFFERS</span>
              <span class="dash__listings-right">PRICE</span>
              <span>STATUS</span>
            </div>

            {#each [
              { title: 'Audi RS3 8Y — HJS downpipe', meta: 'L-2087 · Automotive · Exhaust', views: 142, offers: '3 ↑', price: '€1,450', status: 'ACTIVE' },
              { title: 'AMG GT R — front carbon splitter', meta: 'L-2076 · Automotive · Exterior', views: 98, offers: '1', price: '€1,420', status: 'ACTIVE' },
              { title: 'BMW M3 G80 — Akrapovič Slip-On', meta: 'L-2055 · Automotive · Exhaust', views: 214, offers: '—', price: '€3,200', status: 'ACTIVE' },
              { title: 'Barbour Bedale — re-waxed 2025', meta: 'L-2042 · Fashion · Outerwear', views: 61, offers: '1 OPEN', price: '€165', status: 'ACTIVE' },
              { title: 'AMG GT C Roadster — document set', meta: 'L-2031 · Automotive · Documentation', views: 22, offers: '—', price: '€180', status: 'ACTIVE' },
              { title: 'Vitsœ 606 shelving — 5 bays', meta: 'L-2008 · Home & Design · Storage', views: 412, offers: '3 OPEN', price: '€1,850', status: 'ACTIVE' },
            ] as item}
              <div class="dash__listing">
                <div class="dash__listing-item">
                  <div class="dash__listing-thumb"></div>
                  <div class="dash__listing-info">
                    <strong>{item.title}</strong>
                    <span class="evx-caption">{item.meta}</span>
                  </div>
                </div>
                <span class="dash__listing-cell dash__listing-cell--right">{item.views}</span>
                <span class="dash__listing-cell dash__listing-cell--right">{item.offers}</span>
                <span class="dash__listing-cell dash__listing-cell--right dash__listing-price">{item.price}</span>
                <span class="evx-caption dash__listing-status">● {item.status}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- What's coming -->
        <section class="dash__section">
          <div class="dash__section-head">
            <span class="evx-label">COMING WITH COHORT 03</span>
          </div>
          <div class="dash__coming">
            {#each [
              { title: 'Custom shop page', desc: 'Your own page at /s/your-handle with all listings, bio, and trust signals.' },
              { title: 'Sales analytics', desc: 'Views by listing, conversion rates, traffic sources, and offer-to-sale ratios.' },
              { title: 'Messages inbox', desc: 'Buyer messages, offers, counter-offers — threaded by listing.' },
              { title: 'Payout tracking', desc: 'Stripe Connect dashboard. Sales, holds, payouts, and disputes — H2 2026.' },
              { title: 'Bulk listing CSV', desc: 'Upload up to 100 listings at once. Atelier tier only.' },
              { title: 'Priority support', desc: 'Direct line to the seller team. Atelier tier only.' },
            ] as item}
              <div class="dash__coming-card">
                <strong class="dash__coming-title">{item.title}</strong>
                <p class="dash__coming-desc">{item.desc}</p>
                <span class="evx-caption dash__coming-status">COMING SOON</span>
              </div>
            {/each}
          </div>
        </section>
      </div>
    </div>

    <!-- CTA bottom -->
    <div class="dash-cta">
      <h2 class="dash-cta__h">Want to be one of the first sellers?</h2>
      <p class="dash-cta__sub">Cohort 03 closes 14 June. Approved sellers go live on 01 July 2026.</p>
      <div class="dash-cta__actions">
        <button class="evx-btn evx-btn--primary" on:click={() => navigate('/sell/apply')}>
          Apply to sell →
        </button>
        <button class="evx-btn evx-btn--ghost" on:click={() => navigate('/sell')}>
          Read the tiers
        </button>
      </div>
    </div>

  </div>
</main>

<Footer />

<style>
  .dash-page { flex: 1; padding-bottom: var(--evx-space-3xl); }

  /* Header */
  .dash-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: var(--evx-space-xl);
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .dash-header__pre { color: var(--evx-fox-orange); display: block; margin-bottom: var(--evx-space-md); }

  .dash-header__title {
    font-family: var(--evx-font-display);
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 500;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-md);
  }

  .dash-header__sub { font-size: 15px; line-height: 1.65; color: var(--evx-ink-soft); max-width: 560px; }

  .dash-header__right { display: flex; gap: var(--evx-space-md); flex-shrink: 0; }

  /* Mock dashboard */
  .dash {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--evx-space-2xl);
    opacity: 0.85;
    position: relative;
  }

  .dash::after {
    content: 'PREVIEW · NOT YET LIVE';
    position: absolute;
    top: -10px;
    right: 0;
    font-family: var(--evx-font-mono);
    font-size: 10px;
    letter-spacing: 0.1em;
    color: var(--evx-fox-orange);
  }

  /* Sidebar */
  .dash__side { display: flex; flex-direction: column; gap: var(--evx-space-xl); position: sticky; top: 80px; align-self: start; }

  .dash__profile { display: flex; align-items: center; gap: var(--evx-space-md); padding-bottom: var(--evx-space-md); border-bottom: 1px solid var(--evx-rule-light); }

  .dash__avatar {
    width: 44px; height: 44px;
    background: var(--evx-graphite);
    color: var(--evx-paper);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    flex-shrink: 0;
  }

  .dash__profile-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .dash__profile-name { font-family: var(--evx-font-display); font-weight: 500; font-size: 15px; }
  .dash__profile-meta { color: var(--evx-ink-soft); }
  .dash__profile-since { color: var(--evx-ink-soft); }

  .dash__nav { display: flex; flex-direction: column; gap: 0; }

  .dash__nav-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--evx-space-sm) var(--evx-space-md);
    background: none;
    border: none;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    cursor: pointer;
    transition: var(--evx-transition);
    text-align: left;
  }

  .dash__nav-item:hover { opacity: 0.70; }
  .dash__nav-item--active {
    background: var(--evx-warm-black);
    color: var(--evx-paper);
  }
  .dash__nav-item--active .dash__nav-count { color: rgba(245,242,237,0.6); }

  .dash__nav-count { color: var(--evx-ink-soft); }
  .dash__nav-count--warn { color: var(--evx-fox-orange); }

  .dash__upgrade {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
  }

  .dash__upgrade-label { color: var(--evx-ink-soft); }
  .dash__upgrade-title { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; color: var(--evx-warm-black); }
  .dash__upgrade-desc { font-size: 12px; line-height: 1.5; color: var(--evx-ink-soft); }
  .dash__upgrade-link {
    background: none; border: none; padding: 0;
    color: var(--evx-warm-black); cursor: pointer;
    text-align: left; margin-top: var(--evx-space-sm);
    transition: var(--evx-transition);
  }
  .dash__upgrade-link:hover { color: var(--evx-fox-orange); }

  /* Main */
  .dash__main { display: flex; flex-direction: column; gap: var(--evx-space-2xl); }

  .dash__stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-md);
  }

  .dash__stat {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-xs);
    padding: var(--evx-space-md);
    border: 1px solid var(--evx-rule-light);
  }

  .dash__stat-label { color: var(--evx-ink-soft); }
  .dash__stat-label--accent { color: var(--evx-fox-orange); }

  .dash__stat-val {
    font-family: var(--evx-font-display);
    font-size: 32px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    line-height: 1.2;
  }

  .dash__stat-sub { color: var(--evx-ink-soft); line-height: 1.5; }

  .dash__section { display: flex; flex-direction: column; gap: var(--evx-space-md); }

  .dash__section-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dash__section-head span { color: var(--evx-ink-soft); }

  .dash__section-link {
    background: none; border: none; padding: 0;
    color: var(--evx-ink-soft); cursor: pointer;
    transition: var(--evx-transition);
  }
  .dash__section-link:hover { color: var(--evx-warm-black); }

  /* Order */
  .dash__order {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
  }

  .dash__order-head {
    display: flex;
    align-items: center;
    gap: var(--evx-space-md);
    margin-bottom: var(--evx-space-md);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .dash__order-thumb { width: 40px; height: 40px; background: var(--evx-graphite); flex-shrink: 0; }
  .dash__order-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
  .dash__order-info strong { font-family: var(--evx-font-display); font-size: 14px; font-weight: 500; }
  .dash__order-info span { color: var(--evx-ink-soft); }

  .dash__order-status { color: var(--evx-fox-orange); }

  .dash__order-steps {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--evx-space-md);
  }

  .dash__order-step {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--evx-space-sm);
    border: 1px solid var(--evx-rule-light);
    opacity: 0.50;
  }

  .dash__order-step--done { opacity: 1; border-color: var(--evx-warm-black); }
  .dash__order-step--active { opacity: 1; border-color: var(--evx-fox-orange); background: rgba(232, 116, 44, 0.04); }

  .dash__order-step-num { color: var(--evx-ink-soft); }
  .dash__order-step--done .dash__order-step-num { color: var(--evx-warm-black); }
  .dash__order-step--active .dash__order-step-num { color: var(--evx-fox-orange); }

  .dash__order-step-label { font-family: var(--evx-font-display); font-size: 12px; font-weight: 500; color: var(--evx-warm-black); }
  .dash__order-step-detail { color: var(--evx-ink-soft); font-size: 10px; }

  /* Listings table */
  .dash__listings { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--evx-rule-light); }

  .dash__listings-head, .dash__listing {
    display: grid;
    grid-template-columns: 2.2fr 80px 80px 100px 120px;
    gap: var(--evx-space-md);
    padding: var(--evx-space-md);
    align-items: center;
  }

  .dash__listings-head { color: var(--evx-ink-soft); border-bottom: 1px solid var(--evx-rule-light); background: rgba(0,0,0,0.02); }

  .dash__listings-right { text-align: right; }

  .dash__listing { border-bottom: 1px solid var(--evx-rule-light); }
  .dash__listing:last-child { border-bottom: none; }

  .dash__listing-item { display: flex; gap: var(--evx-space-md); align-items: center; min-width: 0; }
  .dash__listing-thumb { width: 36px; height: 36px; background: var(--evx-graphite); flex-shrink: 0; }
  .dash__listing-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .dash__listing-info strong { font-family: var(--evx-font-display); font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dash__listing-info span { color: var(--evx-ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .dash__listing-cell { font-size: 13px; color: var(--evx-warm-black); }
  .dash__listing-cell--right { text-align: right; }
  .dash__listing-price { font-family: var(--evx-font-display); font-weight: 500; }

  .dash__listing-status { color: var(--evx-warm-black); }

  /* Coming soon cards */
  .dash__coming {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--evx-space-md);
  }

  .dash__coming-card {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-md);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
  }

  .dash__coming-title { font-family: var(--evx-font-display); font-size: 15px; font-weight: 500; color: var(--evx-warm-black); }
  .dash__coming-desc { font-size: 13px; line-height: 1.6; color: var(--evx-ink-soft); flex: 1; }
  .dash__coming-status { color: var(--evx-fox-orange); margin-top: var(--evx-space-sm); }

  /* Bottom CTA */
  .dash-cta {
    margin-top: var(--evx-space-3xl);
    padding: var(--evx-space-2xl);
    background: var(--evx-warm-black);
    color: var(--evx-paper);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
    align-items: flex-start;
  }

  .dash-cta__h {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
  }

  .dash-cta__sub { font-size: 14px; color: rgba(245,242,237,0.7); }
  .dash-cta__actions { display: flex; gap: var(--evx-space-md); margin-top: var(--evx-space-md); }

  @media (max-width: 1199px) {
    .dash__stats { grid-template-columns: 1fr 1fr; }
    .dash__coming { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 1023px) {
    .dash { grid-template-columns: 1fr; }
    .dash__side { position: static; }
    .dash-header { flex-direction: column; align-items: flex-start; }
    .dash__order-steps { grid-template-columns: repeat(2, 1fr); }
    .dash__listings-head, .dash__listing { grid-template-columns: 2fr 60px 80px 100px; }
    .dash__listings-head span:nth-child(2), .dash__listing-cell:nth-child(2) { display: none; }
  }

  @media (max-width: 767px) {
    .dash__stats { grid-template-columns: 1fr; }
    .dash__coming { grid-template-columns: 1fr; }
    .dash__order-steps { grid-template-columns: 1fr; }
    .dash__listings-head, .dash__listing { grid-template-columns: 2fr 80px; }
    .dash__listings-head span:nth-child(2),
    .dash__listings-head span:nth-child(3),
    .dash__listing-cell:nth-child(2),
    .dash__listing-cell:nth-child(3) { display: none; }
  }
</style>
