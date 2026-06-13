<script lang="ts">
  import { onMount } from 'svelte';
  import Footer from '../lib/Footer.svelte';
  import WheelsMenu from '../lib/WheelsMenu.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { getDriveListings, type ListingWithExtras } from '../lib/api';

  // Render shape used by the card markup below. Both the DB-derived
  // and hardcoded-fallback paths produce this shape.
  type DriveCard = {
    num: string;
    slug: string | null;
    title: string;
    subtitle: string;
    desc: string;
    date: string;
    status: 'open' | 'upcoming' | 'archived';
    price: number | null;
    remaining: number | null;
    total: number | null;
  };

  // Hardcoded fallback. Used ONLY when getDriveListings() returns 0
  // rows, which covers the transition window before the v06 migration
  // and the v06-drive-seed.sql have been applied. After the seed
  // applies, the DB path takes over and this array is dead code (still
  // shipped as a safety net).
  const HARDCODED_FALLBACK: DriveCard[] = [
    { num: '003', slug: '003-mercedes-amg-gt',  title: 'Mercedes-AMG GT',
      subtitle: 'V8 Biturbo · C192',
      desc: 'Forged carbon steering wheel. Eight pieces, Alcantara wrap, champagne stitch.',
      date: 'May MMXXVI', status: 'open',     price: 4250, remaining: 5,    total: 8 },
    { num: '004', slug: null, title: 'Volkswagen Golf R',
      subtitle: 'Mk8 · 2.0T',
      desc: 'Issue 004 in preparation. Details to follow on reservation opening.',
      date: 'Q3 MMXXVI', status: 'upcoming', price: null, remaining: null, total: null },
    { num: '002', slug: null, title: 'Porsche 911 GT3',
      subtitle: '992 · 4.0 Naturally Aspirated',
      desc: 'Forged carbon shift paddle set. Archived - sold out.',
      date: 'Feb MMXXVI', status: 'archived', price: 1850, remaining: 0,    total: 6 },
    { num: '001', slug: null, title: 'BMW M3 Competition',
      subtitle: 'G80 · S58 Biturbo',
      desc: 'Alcantara handbrake grip and gear surrounds. Archived - sold out.',
      date: 'Nov MMXXV', status: 'archived', price: 690, remaining: 0,    total: 10 },
  ];

  function toCard(l: ListingWithExtras): DriveCard {
    // drive_issue_state is the editorial state. Fall back to 'archived'
    // (safest) if missing or unrecognised so the card renders something
    // rather than crashing.
    const s = l.drive_issue_state;
    const status: DriveCard['status'] =
      s === 'open' || s === 'upcoming' || s === 'archived' ? s : 'archived';
    return {
      num:       l.drive_issue ?? '???',
      slug:      l.slug,
      title:     l.title,
      subtitle:  l.subtitle ?? '',
      desc:      l.description ?? '',
      date:      l.drive_issue_date ?? '',
      status,
      price:     status === 'upcoming' ? null : l.price,
      remaining: l.drive_remaining_count ?? null,
      total:     l.drive_made_count ?? null,
    };
  }

  let issues: DriveCard[] = HARDCODED_FALLBACK;
  let loading = true;
  let usingFallback = true;
  let menuOpen = false;

  onMount(async () => {
    applySeo(seo.drive());
    try {
      const rows = await getDriveListings({ limit: 24 });
      if (rows.length > 0) {
        issues = rows.map(toCard);
        usingFallback = false;
      }
    } catch (err) {
      // Defensive: if the DB query fails (e.g. drive_issue_state
      // column absent pre-migration AND the implicit '*' join also
      // errored), keep the hardcoded fallback.
      console.warn('[DriveIndex] getDriveListings failed, using fallback:', err);
    } finally {
      loading = false;
    }
  });
</script>

<div class="di-page">

  <!-- Dark product chrome, consistent with /wheels -->
  <header class="di-top">
    <button class="di-top__home" type="button" on:click={() => navigate('/wheels')} aria-label="ÉIRVOX wheels"
            style="background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center;">
      <img src="/brand/wordmark.png" alt="ÉIRVOX"
           style="height:16px;width:auto;display:block;" />
    </button>
    <button class="di-top__menu" type="button" on:click={() => (menuOpen = true)} aria-label="Open menu">
      <span></span><span></span>
    </button>
  </header>

  <WheelsMenu open={menuOpen} on:close={() => (menuOpen = false)} />

  <main id="main-content" class="drive-index">
    <div class="page-container">

    <header class="di-header">
      <div class="di-header__top">
        <span class="evx-caption di-header__pre">DRIVE ← PLATFORM ÉIRVOX</span>
      </div>
      <h1 class="di-header__title">DRIVE</h1>
      <p class="di-header__desc">
        Limited-run OEM+ pieces, one specification per issue.
        Designed in Ireland, assembled abroad, finished in Dublin.
        Serialised before they leave the house.
        One issue open at a time, no variants, no reprints.
      </p>
    </header>

    <div class="di-issues">
      {#each issues as issue}
        <div
          class="di-issue di-issue--{issue.status}"
          class:di-issue--clickable={issue.slug !== null}
          role="link"
          tabindex={issue.slug ? 0 : undefined}
          on:click={() => issue.slug && navigate(`/wheels/${issue.slug}`)}
          on:keydown={(e) => e.key === 'Enter' && issue.slug && navigate(`/wheels/${issue.slug}`)}
        >
          <div class="di-issue__image">
            <span class="evx-caption di-issue__num">ISSUE {issue.num}</span>
            <span class="evx-caption di-issue__img-text">{issue.title}</span>
            {#if issue.status === 'open'}
              <span class="di-issue__status-badge evx-caption">OPEN</span>
            {:else if issue.status === 'upcoming'}
              <span class="di-issue__status-badge di-issue__status-badge--upcoming evx-caption">UPCOMING</span>
            {:else}
              <span class="di-issue__status-badge di-issue__status-badge--archived evx-caption">ARCHIVED</span>
            {/if}
          </div>

          <div class="di-issue__body">
            <div class="di-issue__meta">
              <span class="evx-label di-issue__issue-num">ISSUE {issue.num} · {issue.date}</span>
            </div>
            <h2 class="di-issue__title">{issue.title}</h2>
            <p class="di-issue__subtitle">{issue.subtitle}</p>

            <div class="di-issue__footer">
              {#if issue.status === 'open' && issue.price !== null}
                <div class="di-issue__price-block">
                  <span class="di-issue__price">€{issue.price.toLocaleString('en-IE')}</span>
                  <span class="evx-caption di-issue__stock">
                    <span class="di-issue__dot"></span>
                    {issue.remaining} OF {issue.total} REMAINING
                  </span>
                </div>
                <button
                  class="evx-btn evx-btn--primary evx-btn--sm"
                  on:click|stopPropagation={() => navigate(`/wheels/${issue.slug}`)}
                >
                  Read issue →
                </button>
              {:else if issue.status === 'upcoming'}
                <span class="evx-caption di-issue__upcoming-note">Announcement to follow</span>
              {:else}
                <span class="evx-caption di-issue__archived-note">Sold out · archived</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- About DRIVE -->
    <section class="di-about">
      <div class="di-about__inner">
        <div class="di-about__text">
          <h2 class="di-about__heading">What is DRIVE?</h2>
          <p class="di-about__para">
            DRIVE is the editorial imprint of ÉIRVOX. Each issue is a single object, made to one specification,
            in a limited run. No variants. No restocks. Once the issue closes, it closes.
          </p>
          <p class="di-about__para">
            The first issues are automotive - carbon, Alcantara, precision-finished in Dublin.
            Future issues will extend into watches, fashion, and objects as the platform grows.
          </p>
        </div>
        <div class="di-about__reserve">
          <h3 class="di-about__reserve-heading">How DRIVE works.</h3>
          <ol class="di-about__steps">
            <li class="di-about__step">
              <span class="evx-label di-about__step-num">01</span>
              <span>Each issue is a single specification, made once. Around ten pieces, never repeated.</span>
            </li>
            <li class="di-about__step">
              <span class="evx-label di-about__step-num">02</span>
              <span>Open issues are purchasable direct from ÉIRVOX. Collection in Dublin, or post nationwide.</span>
            </li>
            <li class="di-about__step">
              <span class="evx-label di-about__step-num">03</span>
              <span>Upcoming issues are announced ahead of opening. Express interest to be notified.</span>
            </li>
            <li class="di-about__step">
              <span class="evx-label di-about__step-num">04</span>
              <span>Each piece is finished in Dublin, serialised, and shipped tracked. We do not reprint.</span>
            </li>
          </ol>
        </div>
      </div>
    </section>

  </div>
  </main>

  <Footer />
</div>

<style>
  /* Warm paper product surface + chrome (existing tokens only). */
  .di-page {
    min-height: 100vh;
    background: var(--evx-paper);
    color: var(--evx-ink);
    font-family: var(--evx-font-display);
    display: flex;
    flex-direction: column;
  }
  .di-top {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 22px;
    padding-top: max(env(safe-area-inset-top), 14px);
    background: rgba(245, 242, 237, 0.92);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--evx-rule-light);
  }
  .di-top__menu {
    display: flex; flex-direction: column; gap: 4px;
    padding: 6px; background: none; border: none; cursor: pointer;
  }
  .di-top__menu span { display: block; width: 19px; height: 1.5px; background: var(--evx-ink); }

  .drive-index { flex: 1; padding-bottom: var(--evx-space-3xl); }

  .di-header {
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .di-header__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }

  .di-header__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 80px;
    letter-spacing: -0.04em;
    line-height: 1;
    color: var(--evx-ink);
    margin-bottom: var(--evx-space-lg);
  }

  .di-header__desc {
    font-size: 16px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    max-width: 520px;
  }

  .di-issues {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--evx-space-xl);
    margin-bottom: var(--evx-space-3xl);
  }

  .di-issue {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--evx-rule-light);
    overflow: hidden;
  }

  .di-issue--clickable {
    cursor: pointer;
    transition: var(--evx-transition);
  }

  .di-issue--clickable:hover { opacity: 0.88; }

  .di-issue__image {
    aspect-ratio: 16 / 9;
    background: rgba(26, 26, 26, 0.045);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .di-issue--upcoming .di-issue__image { background: rgba(26, 26, 26, 0.03); }
  .di-issue--archived .di-issue__image { background: rgba(26, 26, 26, 0.045); opacity: 0.60; }

  .di-issue__num {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    color: rgba(26, 26, 26, 0.40);
  }

  .di-issue__img-text {
    color: rgba(26, 26, 26, 0.30);
    text-align: center;
  }

  .di-issue__status-badge {
    position: absolute;
    top: var(--evx-space-md);
    right: var(--evx-space-md);
    background: var(--evx-fox-orange);
    color: var(--evx-white);
    padding: 3px 8px;
  }

  .di-issue__status-badge--upcoming {
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    color: var(--evx-ink-soft);
  }

  .di-issue__status-badge--archived {
    background: transparent;
    border: 1px solid var(--evx-rule-light);
    color: rgba(26, 26, 26, 0.40);
  }

  .di-issue__body {
    padding: var(--evx-space-xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-sm);
    flex: 1;
  }

  .di-issue__issue-num { color: var(--evx-ink-soft); }

  .di-issue__title {
    font-family: var(--evx-font-display);
    font-size: 22px;
    font-weight: 500;
    letter-spacing: -0.01em;
    color: var(--evx-ink);
  }

  .di-issue__subtitle {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-size: 15px;
    color: var(--evx-ink-soft);
  }

  .di-issue__desc {
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    flex: 1;
  }

  .di-issue__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--evx-space-md);
    padding-top: var(--evx-space-md);
    border-top: 1px solid var(--evx-rule-light);
  }

  .di-issue__price-block {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .di-issue__price {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 20px;
    letter-spacing: -0.01em;
  }

  .di-issue__stock {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--evx-fox-orange);
  }

  .di-issue__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--evx-fox-orange);
  }

  .di-issue__upcoming-note,
  .di-issue__archived-note { color: var(--evx-ink-soft); }

  /* About */
  .di-about {
    border-top: 1px solid var(--evx-rule-light);
    padding-top: var(--evx-space-2xl);
  }

  .di-about__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
  }

  .di-about__heading {
    font-family: var(--evx-font-display);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.015em;
    margin-bottom: var(--evx-space-lg);
  }

  .di-about__para {
    font-size: 15px;
    line-height: 1.75;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-md);
  }

  .di-about__reserve-heading {
    font-family: var(--evx-font-display);
    font-size: 20px;
    font-weight: 500;
    letter-spacing: -0.01em;
    margin-bottom: var(--evx-space-xl);
  }

  .di-about__steps {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    list-style: none;
    margin-bottom: var(--evx-space-xl);
  }

  .di-about__step {
    display: flex;
    gap: var(--evx-space-lg);
    align-items: flex-start;
    font-size: 14px;
    line-height: 1.65;
    color: var(--evx-ink-soft);
    padding-bottom: var(--evx-space-lg);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .di-about__step-num { color: var(--evx-fox-orange); flex-shrink: 0; }

  @media (max-width: 1023px) {
    .di-issues { grid-template-columns: 1fr; }
    .di-about__inner { grid-template-columns: 1fr; }
  }
</style>
