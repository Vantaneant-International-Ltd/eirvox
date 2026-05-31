<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import EnquiryForm from '../lib/EnquiryForm.svelte';
  import { getListingBySlug, formatPrice, type ListingWithExtras } from '../lib/api';

  export let issueSlug: string;

  // DB-driven path: try to load the listing for this slug. Falls back
  // to the hardcoded JSX below ONLY for the 003 slug (the
  // pre-seed-applied transition window). All other slugs that miss
  // in DB get a 404.
  let dbListing: ListingWithExtras | null = null;
  let loading = true;

  $: useFallback = !loading && !dbListing && (issueSlug === '003-mercedes-amg-gt' || !issueSlug);
  $: notFound = !loading && !dbListing && !useFallback;

  // Hero eyebrow expects just the year-style suffix ("MMXXVI"). The
  // editorial date string is "May MMXXVI" / "Q3 MMXXVI" / "Nov MMXXV";
  // grab the last token.
  function eyebrowYear(date: string | null | undefined): string {
    if (!date) return '';
    const parts = date.trim().split(/\s+/);
    return parts[parts.length - 1] ?? '';
  }

  onMount(async () => {
    applySeo(seo.driveIssue(issueSlug));
    try {
      const r = await getListingBySlug(issueSlug);
      if (r && r.is_drive) dbListing = r;
    } catch (err) {
      console.warn('[DriveIssue] getListingBySlug failed:', err);
    } finally {
      loading = false;
    }
  });

  function scrollToEnquiry() {
    document.getElementById('enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>

<Nav />

<main id="main-content" class="drive-issue">

{#if loading}
  <div class="page-container" style="padding: 80px 0;">
    <span class="evx-label" style="color: var(--evx-fox-orange);">LOADING…</span>
  </div>

{:else if dbListing}
  <!-- ── DB-driven DRIVE issue ──────────────────────────
       Renders when the seed has been applied and the slug matches a
       listings row with is_drive=true. Layout mirrors the hardcoded
       fallback below; the pull quote is a template-level constant
       for all DRIVE issues this phase (per-issue quotes deferred). -->

  <div class="di-bar page-container">
    <button class="di-bar__drive evx-caption" on:click={() => navigate('/drive')}>
      DRIVE ← INDEX OF ISSUES
    </button>
    <span class="evx-caption di-bar__issue">
      ISSUE {dbListing.drive_issue ?? '???'}{#if dbListing.drive_issue_date} · {dbListing.drive_issue_date.toUpperCase()}{/if} · DRV-{dbListing.drive_issue ?? '???'}
    </span>
    {#if dbListing.drive_issue_state === 'archived'}
      <span class="evx-caption di-bar__next">ARCHIVED</span>
    {:else if dbListing.drive_issue_state === 'upcoming'}
      <span class="evx-caption di-bar__next">UPCOMING</span>
    {/if}
  </div>

  <div class="di-hero page-container">
    <div class="di-hero__left">
      <span class="evx-caption di-hero__eyebrow">
        ISSUE {dbListing.drive_issue ?? '???'}{#if dbListing.drive_issue_date} · {eyebrowYear(dbListing.drive_issue_date)}{/if}
      </span>

      <h1 class="di-hero__title">
        {dbListing.title}.
        {#if dbListing.subtitle}
          <em class="di-hero__sub">{dbListing.subtitle}</em>
        {/if}
      </h1>

      <div class="di-hero__price-block">
        {#if dbListing.drive_issue_state !== 'upcoming'}
          <span class="di-hero__price">{formatPrice(dbListing.price)}</span>
        {/if}
        {#if dbListing.drive_remaining_count != null && dbListing.drive_made_count != null}
          <span class="di-hero__stock">
            <span class="di-hero__dot"></span>
            <span class="evx-caption">
              {dbListing.drive_remaining_count} OF {dbListing.drive_made_count} REMAINING
            </span>
          </span>
        {/if}
      </div>

      <p class="di-hero__deposit evx-caption">
        {#if dbListing.drive_issue_state === 'archived'}
          Archived. This issue is closed.
        {:else if dbListing.drive_issue_state === 'upcoming'}
          Upcoming. Express interest below to be notified when this issue opens.
        {:else}
          Express interest below · we confirm by email
        {/if}
      </p>

      <div class="di-hero__ctas">
        <button class="evx-btn evx-btn--primary" on:click={scrollToEnquiry}>
          Express interest
        </button>
      </div>
    </div>

    <div class="di-hero__plate">
      <span class="evx-caption di-hero__plate-label">
        DRV-{dbListing.drive_issue ?? '???'} · PLATE 01
      </span>
      <div class="di-hero__plate-img">
        {#if dbListing.images && dbListing.images.length > 0 && dbListing.images[0].public_url}
          <img src={dbListing.images[0].public_url} alt="" style="width:100%; height:100%; object-fit:cover;" />
        {:else}
          <span class="evx-caption di-hero__plate-text">{dbListing.title}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="page-container di-content">
    <section class="di-spec">
      <div class="di-spec__left">
        <span class="evx-caption di-spec__pre">THE SPECIFICATION</span>
        <h2 class="di-spec__heading">At a glance.</h2>
        <p class="di-spec__sub">One specification — no variants. Each piece serialised in Dublin before it leaves the house.</p>

        {#if dbListing.specs && dbListing.specs.length > 0}
          <table class="di-spec__table">
            <tbody>
              {#each dbListing.specs as spec}
                <tr class="di-spec__row">
                  <td class="di-spec__label evx-caption">{spec.label}</td>
                  <td class="di-spec__val">{spec.value}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <p style="font-size: 13px; color: var(--evx-ink-soft);">Specification published soon.</p>
        {/if}
      </div>

      <div class="di-spec__right">
        <span class="evx-caption di-spec__quote-label">ON THE ISSUE</span>
        <!-- Template-level quote for all DRIVE issues this phase.
             Per-issue quotes would need drive_quote /
             drive_quote_attribution columns; deferred. -->
        <blockquote class="di-spec__quote">
          "No variants. No restocks. No exceptions."
        </blockquote>
        <cite class="di-spec__cite evx-caption">— RENATO G., CURATOR</cite>

        {#if dbListing.description}
          {#each dbListing.description.split('\n\n') as para}
            {#if para.trim()}
              <p class="di-spec__body">{para}</p>
            {/if}
          {/each}
        {/if}
      </div>
    </section>

    {#if dbListing.images && dbListing.images.length > 1}
      <section class="di-plates">
        <span class="evx-caption di-plates__label">
          PHOTOGRAPHY · PLATES 02–{String(dbListing.images.length).padStart(2, '0')}
        </span>
        <div class="di-plates__grid">
          {#each dbListing.images.slice(1) as plate, i}
            <div class="di-plate">
              <div class="di-plate__img">
                {#if plate.public_url}
                  <img src={plate.public_url} alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
                {/if}
                <span class="evx-caption di-plate__text">{plate.alt_text ?? ''}</span>
                <span class="evx-caption di-plate__num">PLATE {String(i + 2).padStart(2, '0')}</span>
              </div>
            </div>
          {/each}
        </div>
      </section>
    {/if}

    <section class="di-reserve" id="enquiry">
      <div class="di-reserve__inner">
        <div class="di-reserve__left">
          <span class="evx-caption di-reserve__pre">TO EXPRESS INTEREST</span>
          <h2 class="di-reserve__heading">
            {#if dbListing.drive_made_count}{dbListing.drive_made_count} will be made.<br/>One could be yours.{:else}Express interest in this issue.{/if}
          </h2>
          <div class="di-reserve__how">
            <p class="di-reserve__how-body">
              Tell us about your car. We'll confirm fitment and timing detail, and walk you through next steps.
              No deposit at this stage.
            </p>
            <p class="di-reserve__how-body">
              We respond within 48 hours.
            </p>
          </div>
        </div>

        <div class="di-reserve__form-wrap">
          <EnquiryForm
            subjectType="drive_issue"
            driveIssueSlug={dbListing.slug ?? issueSlug}
            messagePlaceholder="Your car (year, trim), and anything we should know about fitment, finish, or timing."
          />
        </div>
      </div>
    </section>
  </div>

{:else if notFound}
  <div class="page-container" style="padding: 80px 0; text-align: center; display: flex; flex-direction: column; gap: 16px; align-items: center;">
    <span class="evx-label" style="color: var(--evx-fox-orange);">404</span>
    <h1 class="evx-heading">Issue not found.</h1>
    <p style="font-size: 15px; color: var(--evx-ink-soft); max-width: 480px;">
      The slug "{issueSlug}" doesn't match any DRIVE issue. Browse the index for current and archived issues.
    </p>
    <button class="evx-btn evx-btn--primary" on:click={() => navigate('/drive')}>
      Back to DRIVE index →
    </button>
  </div>

{:else}
  <!-- ── HARDCODED FALLBACK (issue 003 only) ──────────────
       Kept verbatim from before this commit. Renders during the
       transition window after this code deploys but before the
       v06-stock-state-drive-fields.sql + v06-drive-seed.sql have
       been applied. Once the seed lands, the dbListing branch
       above takes over and this block becomes dead code. -->

  <!-- DRIVE nav bar -->
  <div class="di-bar page-container">
    <button class="di-bar__drive evx-caption" on:click={() => navigate('/drive')}>
      DRIVE ← INDEX OF ISSUES
    </button>
    <span class="evx-caption di-bar__issue">ISSUE 003 · MAY MMXXVI · DRV-003</span>
    <span class="evx-caption di-bar__next">NEXT: 004 · VOLKSWAGEN GOLF R · Q3</span>
  </div>

  <div class="di-hero page-container">
    <!-- LEFT: Editorial text -->
    <div class="di-hero__left">
      <span class="evx-caption di-hero__eyebrow">ISSUE 003 · MMXXVI</span>

      <h1 class="di-hero__title">
        Mercedes-AMG GT.
        <em class="di-hero__sub">V8 Biturbo · C192. Eight pieces, no variants, no exceptions.</em>
      </h1>

      <div class="di-hero__price-block">
        <span class="di-hero__price">€4,250</span>
        <span class="di-hero__stock">
          <span class="di-hero__dot"></span>
          <span class="evx-caption">5 OF 8 REMAINING</span>
        </span>
      </div>

      <p class="di-hero__deposit evx-caption">
        Express interest below · we confirm allocation by email
      </p>

      <div class="di-hero__ctas">
        <button class="evx-btn evx-btn--primary" on:click={scrollToEnquiry}>
          Express interest
        </button>
      </div>
    </div>

    <!-- RIGHT: Plate 01 -->
    <div class="di-hero__plate">
      <span class="evx-caption di-hero__plate-label">DRV-003 · PLATE 01</span>
      <div class="di-hero__plate-img">
        <span class="evx-caption di-hero__plate-text">AMG GT · 3/4 angle<br/>forged carbon shell · matte</span>
      </div>
    </div>
  </div>

  <div class="page-container di-content">
    <!-- Specification -->
    <section class="di-spec">
      <div class="di-spec__left">
        <span class="evx-caption di-spec__pre">THE SPECIFICATION</span>
        <h2 class="di-spec__heading">At a glance.</h2>
        <p class="di-spec__sub">One specification — no variants. Each piece serialised in Dublin before it leaves the house.</p>

        <table class="di-spec__table">
          <tbody>
            <tr class="di-spec__row">
              <td class="di-spec__label evx-caption">01 SHELL</td>
              <td class="di-spec__val">One-piece forged carbon · matte</td>
            </tr>
            <tr class="di-spec__row">
              <td class="di-spec__label evx-caption">02 WRAP</td>
              <td class="di-spec__val">Alcantara · pre-stretched</td>
            </tr>
            <tr class="di-spec__row di-spec__row--accent">
              <td class="di-spec__label evx-caption">03 STITCH</td>
              <td class="di-spec__val di-spec__val--champagne">Champagne · twelve-o'clock mark</td>
            </tr>
            <tr class="di-spec__row">
              <td class="di-spec__label evx-caption">04 ELECTRONICS</td>
              <td class="di-spec__val">OEM · full pass-through</td>
            </tr>
            <tr class="di-spec__row">
              <td class="di-spec__label evx-caption">05 FINISH</td>
              <td class="di-spec__val">Dublin · serialised</td>
            </tr>
            <tr class="di-spec__row">
              <td class="di-spec__label evx-caption">06 EDITION</td>
              <td class="di-spec__val">Eight pieces · one specification</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="di-spec__right">
        <span class="evx-caption di-spec__quote-label">ON THE ISSUE</span>
        <blockquote class="di-spec__quote">
          "No variants. No restocks. No exceptions."
        </blockquote>
        <cite class="di-spec__cite evx-caption">— RENATO G., CURATOR</cite>

        <p class="di-spec__body">
          The wheel is a one-piece forged-carbon shell, hand-trimmed and wrapped in Alcantara.
          Champagne stitching runs the twelve-o'clock mark. Underneath, OEM electronics —
          no aftermarket switching, no warning lights, no compromises with the car.
        </p>
        <p class="di-spec__body">
          Each piece is finished in Dublin and serialised.
          Issue 003 is limited to eight pieces. When they're gone, the issue closes. We do not reprint.
        </p>
      </div>
    </section>

    <!-- Plates 02–05 -->
    <section class="di-plates">
      <span class="evx-caption di-plates__label">PHOTOGRAPHY · PLATES 02–05</span>
      <div class="di-plates__grid">
        {#each [
          { n: '02', caption: 'Forged weave macro' },
          { n: '03', caption: 'Champagne stitch detail' },
          { n: '04', caption: 'Serial plate obverse' },
          { n: '05', caption: 'Mounted on customer car' },
        ] as plate}
          <div class="di-plate">
            <div class="di-plate__img">
              <span class="evx-caption di-plate__text">{plate.caption}</span>
              <span class="evx-caption di-plate__num">PLATE {plate.n}</span>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Enquiry form -->
    <section class="di-reserve" id="enquiry">
      <div class="di-reserve__inner">
        <div class="di-reserve__left">
          <span class="evx-caption di-reserve__pre">TO EXPRESS INTEREST</span>
          <h2 class="di-reserve__heading">Eight will be made.<br/>One could be yours.</h2>

          <div class="di-reserve__how">
            <p class="di-reserve__how-body">
              Tell us about your car. We'll confirm whether your spec is within the
              allocation, share fitment and timing detail, and walk you through next steps.
              No deposit at this stage.
            </p>
            <p class="di-reserve__how-body">
              We respond within 48 hours.
            </p>
          </div>
        </div>

        <div class="di-reserve__form-wrap">
          <EnquiryForm
            subjectType="drive_issue"
            driveIssueSlug={issueSlug || '003-mercedes-amg-gt'}
            messagePlaceholder="Your car (year, trim), and anything we should know about fitment, finish, or timing."
          />
        </div>
      </div>
    </section>
  </div>
{/if}
</main>

<Footer />

<style>
  .drive-issue { flex: 1; }

  /* Nav bar */
  .di-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: var(--evx-space-md);
    padding-bottom: var(--evx-space-md);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .di-bar__drive {
    background: none;
    border: none;
    color: var(--evx-ink-soft);
    cursor: pointer;
    padding: 0;
    transition: var(--evx-transition);
  }

  .di-bar__drive:hover { color: var(--evx-warm-black); }
  .di-bar__issue { color: var(--evx-warm-black); }
  .di-bar__next { color: var(--evx-ink-soft); }

  /* Hero */
  .di-hero {
    display: grid;
    grid-template-columns: 1fr 480px;
    gap: var(--evx-space-3xl);
    align-items: center;
    padding-top: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .di-hero__eyebrow {
    display: block;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-lg);
  }

  .di-hero__title {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: clamp(36px, 5vw, 64px);
    line-height: 1.08;
    letter-spacing: -0.025em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-xl);
  }

  .di-hero__sub {
    font-family: var(--evx-font-editorial);
    font-style: italic;
    font-weight: 400;
    display: block;
    font-size: 0.60em;
    color: var(--evx-ink-soft);
    margin-top: var(--evx-space-sm);
  }

  .di-hero__price-block {
    display: flex;
    align-items: baseline;
    gap: var(--evx-space-lg);
    margin-bottom: var(--evx-space-sm);
  }

  .di-hero__price {
    font-family: var(--evx-font-display);
    font-weight: 500;
    font-size: 40px;
    letter-spacing: -0.02em;
  }

  .di-hero__stock {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .di-hero__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--evx-fox-orange);
    flex-shrink: 0;
  }

  .di-hero__deposit {
    color: var(--evx-ink-soft);
    display: block;
    margin-bottom: var(--evx-space-xl);
  }

  .di-hero__ctas { display: flex; gap: var(--evx-space-md); flex-wrap: wrap; }
  .di-hero__ctas a { text-decoration: none; }

  .di-hero__plate {
    position: relative;
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .di-hero__plate-label {
    position: absolute;
    top: var(--evx-space-md);
    left: var(--evx-space-md);
    color: var(--evx-fox-orange);
  }

  .di-hero__plate-text {
    color: rgba(245, 242, 237, 0.25);
    text-align: center;
    line-height: 1.8;
  }

  /* Content */
  .di-content { padding-top: var(--evx-space-2xl); }

  /* Spec */
  .di-spec {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
    margin-bottom: var(--evx-space-2xl);
  }

  .di-spec__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }

  .di-spec__heading {
    font-family: var(--evx-font-display);
    font-size: 36px;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
  }

  .di-spec__sub {
    font-size: 14px;
    color: var(--evx-ink-soft);
    line-height: 1.65;
    margin-bottom: var(--evx-space-xl);
  }

  .di-spec__table { width: 100%; border-collapse: collapse; }

  .di-spec__row { border-bottom: 1px solid var(--evx-rule-light); }
  .di-spec__row--accent { border-bottom-color: var(--evx-champagne); }

  .di-spec__label {
    color: var(--evx-ink-soft);
    padding: var(--evx-space-md) 0;
    width: 140px;
    vertical-align: middle;
  }

  .di-spec__val {
    font-size: 14px;
    padding: var(--evx-space-md) 0;
    color: var(--evx-warm-black);
  }

  .di-spec__val--champagne { color: var(--evx-champagne); }

  .di-spec__quote-label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-lg); }

  .di-spec__quote {
    font-family: var(--evx-font-display);
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 500;
    letter-spacing: -0.01em;
    line-height: 1.2;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-sm);
    quotes: none;
  }

  .di-spec__cite { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-xl); }

  .di-spec__body {
    font-size: 15px;
    line-height: 1.75;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-md);
  }

  /* Plates */
  .di-plates {
    margin-bottom: var(--evx-space-2xl);
    padding-bottom: var(--evx-space-2xl);
    border-bottom: 1px solid var(--evx-rule-light);
  }

  .di-plates__label { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-xl); }

  .di-plates__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--evx-space-md);
  }

  .di-plate__img {
    aspect-ratio: 5 / 6;
    background: var(--evx-graphite);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .di-plate__text { color: rgba(245, 242, 237, 0.25); text-align: center; }

  .di-plate__num {
    position: absolute;
    bottom: var(--evx-space-md);
    left: var(--evx-space-md);
    color: rgba(245, 242, 237, 0.35);
  }

  /* Reservation */
  .di-reserve { margin-bottom: var(--evx-space-3xl); }

  .di-reserve__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-3xl);
    align-items: start;
  }

  .di-reserve__pre { color: var(--evx-ink-soft); display: block; margin-bottom: var(--evx-space-md); }

  .di-reserve__heading {
    font-family: var(--evx-font-display);
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.1;
    color: var(--evx-warm-black);
    margin-bottom: var(--evx-space-xl);
  }

  .di-reserve__how-body {
    font-size: 15px;
    line-height: 1.75;
    color: var(--evx-ink-soft);
    margin-bottom: var(--evx-space-md);
  }

  .di-reserve__form {
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-lg);
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-xl);
  }

  .di-reserve__form-title { color: var(--evx-ink-soft); }

  .di-reserve__success {
    border: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-2xl);
    display: flex;
    flex-direction: column;
    gap: var(--evx-space-md);
  }

  .di-reserve__success-body { font-size: 14px; color: var(--evx-ink-soft); line-height: 1.65; }

  .di-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--evx-space-md);
  }

  .di-form-group { display: flex; flex-direction: column; gap: var(--evx-space-xs); }

  .di-form-label { color: var(--evx-ink-soft); }

  .di-form-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--evx-rule-light);
    padding: var(--evx-space-sm) 0;
    font-family: var(--evx-font-display);
    font-size: 14px;
    color: var(--evx-warm-black);
    outline: none;
    width: 100%;
  }

  .di-form-input:focus { border-bottom-color: var(--evx-warm-black); }
  .di-form-input::placeholder { color: var(--evx-ink-soft); }

  .di-form-textarea { resize: vertical; min-height: 80px; }

  .di-form-submit { width: 100%; }

  .di-form-fine {
    color: var(--evx-ink-soft);
    line-height: 1.6;
  }

  .di-form-fine-link {
    background: none;
    border: none;
    color: var(--evx-warm-black);
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 1023px) {
    .di-hero { grid-template-columns: 1fr; }
    .di-hero__plate { display: none; }
    .di-spec { grid-template-columns: 1fr; }
    .di-reserve__inner { grid-template-columns: 1fr; }
    .di-plates__grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 767px) {
    .di-bar { flex-direction: column; align-items: flex-start; gap: var(--evx-space-xs); }
    .di-form-row { grid-template-columns: 1fr; }
    .di-plates__grid { grid-template-columns: 1fr 1fr; }
  }
</style>
