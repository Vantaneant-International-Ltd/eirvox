<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import FactNeeded from '../lib/FactNeeded.svelte';
  import {
    getDriveListings,
    getListings,
    getListingVariants,
    getFitmentChassis,
    getFitmentFamilies,
    getMarketplaceFees,
    formatPrice,
    type ListingWithExtras,
    type MarketplaceFees,
  } from '../lib/api';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { siteFlags } from '../lib/flags';
  import Wheels from './Wheels.svelte';

  // Full-vision homepage (dark, house-led commercial front door). Renders
  // when wheel_specialist_mode is OFF. Flipping it back on in
  // /admin/settings restores the focused <Wheels/> landing — nothing here
  // is destructive. Lockfile §13 dark-homepage exception (19 Jun 2026).
  $: wheelMode = $siteFlags.wheel_specialist_mode;

  let drive: ListingWithExtras[] = [];
  let bmw: ListingWithExtras | null = null;
  let bmwStyles = 0;
  let families: { label: string; codes: string; count: number }[] = [];
  let chassisTotal = 0;
  let fees: MarketplaceFees | null = null;

  // Buyer-facing family labels are derived from the internal name's
  // leading phrase (before the parenthetical), never the internal key.
  function familyLabel(internal: string): string {
    return internal.split('(')[0].trim();
  }
  function familyCodes(internal: string): string {
    const m = internal.match(/\(([^)]+)\)/);
    return m ? m[1] : '';
  }

  onMount(async () => {
    applySeo(seo.home());
    if (wheelMode) return;

    const [driveRows, autoRows, chassis, fams, feeRows] = await Promise.all([
      getDriveListings({ state: 'open', limit: 4 }),
      getListings({ category: 'automotive', limit: 24 }),
      getFitmentChassis(),
      getFitmentFamilies(),
      getMarketplaceFees(),
    ]);

    drive = driveRows;
    fees = feeRows;
    chassisTotal = chassis.length;

    // The BMW fitted product is the consignment listing carrying variants;
    // fall back to the first automotive listing. Styles = distinct variant
    // style_key on it (live, never a hardcoded "7").
    bmw = autoRows.find(l => l.slug?.includes('consignment')) ?? autoRows[0] ?? null;
    if (bmw) {
      const variants = await getListingVariants(bmw.id);
      bmwStyles = new Set(variants.map(v => v.style_key)).size;
    }

    // Find-by-car groups: one per live fitment family, chassis counted from
    // live fitment_chassis. Buyer-facing label = internal_name leading
    // phrase; codes = its parenthetical. No invented groups or counts.
    const counts = new Map<string, number>();
    for (const c of chassis) counts.set(c.family_key, (counts.get(c.family_key) ?? 0) + 1);
    families = fams.map(f => ({
      label: f.internal_name,
      codes: '',
      count: counts.get(f.key) ?? 0,
    }));
  });
</script>

{#if wheelMode}
  <Wheels />
{:else}

<Nav dark />

<main class="hx">

  <!-- HERO ─────────────────────────────────────────────── -->
  <section class="hx-hero page-container">
    <div class="hx-hero__left">
      <span class="hx-eyebrow">
        <span class="hx-badge hx-badge--champ"><span class="hx-dot hx-dot--champ"></span>DRIVE</span>
        A small line, made once
      </span>
      <h1 class="hx-hero__h">Carbon steering wheels, finished in Dublin.</h1>
      <p class="hx-hero__sub">
        <span class="hx-italic">Engineered to be felt before it's seen.</span>
        Four limited DRIVE wheels with integrated LED, and a BMW fitted range across seven styles.
      </p>
      <div class="hx-chips">
        <span class="hx-chip-label">Jump to</span>
        <a href="#drive" class="hx-chip">DRIVE line</a>
        <a href="#bmw" class="hx-chip">BMW · {bmwStyles || 7} styles</a>
        <a href="#bmw" class="hx-chip">Find your fit</a>
      </div>
    </div>

    <button class="hx-spotlight" type="button" on:click={() => navigate('/wheels')}>
      <div class="hx-slot hx-spotlight__img">
        <span class="hx-anno">4:3 · LED LIT · RAKING KEY · HARDWARE SHOT</span>
      </div>
      <div class="hx-spotlight__tag">
        <span class="hx-pick">Most fitted</span>
        {#if chassisTotal}<span class="hx-badge hx-badge--fox"><span class="hx-dot hx-dot--fox"></span>{chassisTotal}+ chassis</span>{/if}
      </div>
      <div class="hx-spotlight__body">
        <div class="hx-price-row">
          <span class="hx-price">{formatPrice(bmw?.price ?? 300)}</span>
          {#if bmw?.original_price && bmw.original_price > bmw.price}
            <span class="hx-was">Was {formatPrice(bmw.original_price)}</span>
          {/if}
        </div>
        <div class="hx-spotlight__title">BMW M Sport carbon wheel</div>
        <div class="hx-spotlight__fit">{bmwStyles || 7} styles · {families.length || 3} fitments</div>
        <div class="hx-spotlight__meta"><span>Finished in Dublin</span><span>Deposit or full</span></div>
      </div>
    </button>
  </section>

  <!-- DRIVE LINE ───────────────────────────────────────── -->
  <section class="hx-section page-container" id="drive">
    <div class="hx-sec-head">
      <div>
        <h2 class="hx-h2">The DRIVE line</h2>
        <div class="hx-sub-line">Four designs with integrated LED. Each made once, limited to 10.</div>
      </div>
      <button class="hx-seeall" type="button" on:click={() => navigate('/drive')}>View the line →</button>
    </div>
    <div class="hx-grid4">
      {#each drive as d (d.id)}
        <button class="hx-card" type="button" on:click={() => navigate(`/wheels/${d.slug}`)}>
          <div class="hx-slot hx-card__img">
            <span class="hx-badge hx-badge--champ hx-card__led"><span class="hx-dot hx-dot--champ"></span>LED</span>
            <span class="hx-anno">5:6 · LED LIT · RAKING KEY</span>
          </div>
          <div class="hx-card__body">
            <div class="hx-card__num">DRIVE {d.drive_issue ?? '—'} · LIMITED TO 10</div>
            <div class="hx-card__title">{d.title}</div>
            <div class="hx-card__price">
              {#if d.price > 0}
                {formatPrice(d.price)}
                {#if d.original_price && d.original_price > d.price}<span class="hx-card__was">Was {formatPrice(d.original_price)}</span>{/if}
              {:else}<FactNeeded label="DRIVE {d.drive_issue} PRICE" dark />{/if}
            </div>
            <div class="hx-card__meta"><span>Fits various</span><span>Finished in Dublin</span></div>
          </div>
        </button>
      {/each}
      {#if drive.length === 0}
        {#each Array(4) as _, i (i)}
          <div class="hx-card hx-card--skel"><div class="hx-slot hx-card__img"></div></div>
        {/each}
      {/if}
    </div>
  </section>

  <!-- BMW FITTED FEATURE ───────────────────────────────── -->
  <section class="hx-section page-container" id="bmw">
    <div class="hx-feature">
      <div class="hx-slot hx-feature__img">
        <span class="hx-anno">4:3 · LED LIT · HARDWARE SHOT MANDATORY</span>
      </div>
      <div class="hx-feature__body">
        <div class="hx-kick">BMW fitted range</div>
        <h3 class="hx-h3">BMW M Sport carbon.</h3>
        <p class="hx-feature__line">
          <span class="hx-italic">{bmwStyles || 7} styles, {families.length || 3} fitments.</span>
          Pick your chassis, get the one that fits.
        </p>
        <div class="hx-matrix">
          <span><b>{bmwStyles || 7}</b> styles</span>
          <span><b>{families.length || 3}</b> fitment groups</span>
          <span><b>{chassisTotal || 20}+</b> chassis</span>
        </div>
        <div class="hx-price-row hx-price-row--feature">
          <span class="hx-price">{formatPrice(bmw?.price ?? 300)}</span>
          {#if bmw?.original_price && bmw.original_price > bmw.price}
            <span class="hx-was">Was {formatPrice(bmw.original_price)}</span>
          {/if}
        </div>
        <button class="hx-btn-line" type="button" on:click={() => navigate('/wheels#fitment')}>Find your fit <span class="hx-a">→</span></button>
      </div>
    </div>
  </section>

  <!-- FIND BY CAR ──────────────────────────────────────── -->
  <section class="hx-section page-container" id="finder">
    <div class="hx-sec-head">
      <div>
        <h2 class="hx-h2">Find by car</h2>
        <div class="hx-sub-line">{families.length || 3} fitment groups across the BMW range.</div>
      </div>
      <button class="hx-seeall" type="button" on:click={() => navigate('/wheels#fitment')}>All chassis →</button>
    </div>
    <div class="hx-cars">
      {#each families as f}
        <button class="hx-ctile" type="button" on:click={() => navigate('/wheels#fitment')}>
          <div class="hx-cq">{familyLabel(f.label)}</div>
          <div class="hx-cc">{#if familyCodes(f.label)}{familyCodes(f.label)} · {/if}{f.count} chassis</div>
        </button>
      {/each}
    </div>
  </section>

  <!-- MARKETPLACE TIERS ────────────────────────────────── -->
  <section class="hx-section page-container" id="marketplace">
    <div class="hx-sec-head">
      <div>
        <h2 class="hx-h2">The marketplace</h2>
        <div class="hx-sub-line">A curated marketplace, by verification. Not a feed.</div>
      </div>
      <button class="hx-seeall" type="button" on:click={() => navigate('/sell')}>How selling works →</button>
    </div>
    <div class="hx-tiers">
      <div class="hx-tier">
        <div class="hx-tnum">Tier 03</div>
        <div class="hx-tname">Verified</div>
        <div class="hx-tprice">{fees ? `${fees.verifiedCommissionPct}% commission · €0/mo` : '—'}</div>
        <ul class="hx-tlist">
          <li>Verified seller status</li>
          <li>List in any open category</li>
          <li>Direct payouts, no held funds</li>
          <li class="hx-neg">No shop page</li>
        </ul>
        <button class="hx-tcta" type="button" on:click={() => navigate('/sell/apply')}>Apply as Verified</button>
      </div>
      <div class="hx-tier hx-tier--rec">
        <span class="hx-rec">Recommended</span>
        <div class="hx-tnum">Tier 02</div>
        <div class="hx-tname">Atelier</div>
        <div class="hx-tprice">{fees ? `${fees.atelierCommissionPct}% commission · €${fees.atelierMonthlyEur}/mo` : '—'}</div>
        <ul class="hx-tlist">
          <li>Everything in Verified</li>
          <li>Custom shop page</li>
          <li>Unlimited listings</li>
          <li>Sales analytics</li>
          <li>Priority support</li>
        </ul>
        <button class="hx-tcta hx-tcta--rec" type="button" on:click={() => navigate('/sell/apply')}>Apply as Atelier</button>
      </div>
      <div class="hx-tier">
        <div class="hx-tnum">Tier 01 · Invite</div>
        <div class="hx-tname">House</div>
        <div class="hx-tprice">By arrangement · invite only</div>
        <ul class="hx-tlist">
          <li>Homepage editorial features</li>
          <li>DRIVE issue scheduling</li>
          <li>ÉIRVOX photography &amp; copy</li>
          <li class="hx-neg">By invitation only</li>
        </ul>
        <span class="hx-tcta hx-tcta--dis">By invitation</span>
      </div>
    </div>
    <p class="hx-mkt-note">Applications open · every applicant gets a reply within five working days, and a short call.</p>
  </section>

  <!-- ÉIRVOX TRADE ─────────────────────────────────────── -->
  <section class="hx-trade">
    <div class="hx-trade__inner page-container">
      <div class="hx-trade__left">
        <div class="hx-kick">ÉIRVOX TRADE</div>
        <h3 class="hx-h3"><span class="hx-e">Verified</span> tradespeople.</h3>
        <p class="hx-trade__lead">
          <span class="hx-italic">ID-checked, credential-verified, admitted by application.</span>
          A flat monthly fee{#if fees} ({`€${fees.tradeListedMonthlyEur} or €${fees.tradeProMonthlyEur} a month`}){/if}, no per-lead charge, no commission, no race to the bottom.
        </p>
        <div class="hx-trade__cta">
          <button class="hx-btn-primary" type="button" on:click={() => navigate('/trade/apply')}>List your trade</button>
          <button class="hx-seeall" type="button" on:click={() => navigate('/trade')}>Browse trades →</button>
        </div>
      </div>
      <div class="hx-trade__points">
        <div class="hx-tp">
          <div class="hx-tp__n">01</div>
          <h4 class="hx-tp__h">ID &amp; credential verified</h4>
          <p class="hx-tp__p">Government ID, trade qualifications, and a short video call before anyone is listed.</p>
        </div>
        <div class="hx-tp">
          <div class="hx-tp__n">02</div>
          <h4 class="hx-tp__h">Flat monthly fee</h4>
          <p class="hx-tp__p">{#if fees}€{fees.tradeListedMonthlyEur} or €{fees.tradeProMonthlyEur} a month.{:else}A flat monthly fee.{/if} No charge per lead, no commission on work won.</p>
        </div>
        <div class="hx-tp">
          <div class="hx-tp__n">03</div>
          <h4 class="hx-tp__h">Reviews from verified jobs only</h4>
          <p class="hx-tp__p">Reviews come only from real, verified jobs. No paid-for ratings, no fake profiles.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- VERIFICATION THESIS ──────────────────────────────── -->
  <section class="hx-why">
    <div class="hx-why__grid page-container">
      <div class="hx-why__intro">
        <h3 class="hx-h3-sm">One standard, across everything.</h3>
        <p class="hx-why__p">Wheels, sellers, and trades all clear the same bar: verified before listed, honest condition, direct payment, no race to the bottom.</p>
      </div>
      <div class="hx-why__item">
        <div class="hx-wi-n">01 &nbsp;Finished in Dublin</div>
        <h4 class="hx-wi-h">Designed in Ireland</h4>
        <p class="hx-wi-p">Designed in Ireland, assembled abroad, finished in Dublin. If it isn't right, it doesn't ship.</p>
      </div>
      <div class="hx-why__item">
        <div class="hx-wi-n">02 &nbsp;Fitment</div>
        <h4 class="hx-wi-h">The right one, confirmed</h4>
        <p class="hx-wi-p">Every wheel states its exact chassis fitment. Enter your car and the finder confirms before you pay.</p>
      </div>
      <div class="hx-why__item">
        <div class="hx-wi-n">03 &nbsp;Payment</div>
        <h4 class="hx-wi-h">Pay direct, or deposit</h4>
        <p class="hx-wi-p">Card, Apple Pay, Google Pay, straight through. A deposit holds incoming stock, balance on collection.</p>
      </div>
    </div>
  </section>

  <!-- FITTING BAND ─────────────────────────────────────── -->
  <section class="hx-band page-container">
    <div class="hx-band__inner">
      <div>
        <h3 class="hx-h3">Collected and fitted in Dublin.</h3>
        <p class="hx-band__p">Buy online, or collect from us and have it fitted. <FactNeeded label="FITTING OFFER / PRICE" dark /></p>
      </div>
      <div class="hx-band__cta">
        <button class="hx-btn-primary hx-btn-primary--lg" type="button" on:click={() => navigate('/wheels#fitment')}>Find your fit</button>
        <span class="hx-band__note">Deposit available · finished in Dublin</span>
      </div>
    </div>
  </section>
</main>

<Footer dark />
{/if}

<style>
  /* Dark house-front homepage. Locked warm-black token set; fox orange is
     the only UI accent; champagne is DRIVE-only (eyebrow + LED badges). */
  .hx { background: var(--evx-black); color: var(--evx-paper); }
  .hx :global(a) { color: inherit; }

  .hx-italic { font-family: var(--evx-font-editorial); font-style: italic; color: var(--evx-paper); }

  /* Shared bits */
  .hx-badge { display: inline-flex; align-items: center; gap: 6px; font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; padding: 4px 8px; border-radius: 2px; }
  .hx-badge--champ { color: var(--evx-champagne); background: rgba(201,169,97,0.12); border: 1px solid rgba(201,169,97,0.40); }
  .hx-badge--fox { color: #F0B49E; background: rgba(232,116,44,0.12); border: 1px solid rgba(232,116,44,0.42); }
  .hx-dot { width: 6px; height: 6px; flex: none; }
  .hx-dot--champ { background: var(--evx-champagne); }
  .hx-dot--fox { background: var(--evx-fox-orange); }

  .hx-slot { position: relative; overflow: hidden; background: var(--evx-surface-2); border: 1px solid var(--evx-rule); }
  .hx-slot::before { content: ""; position: absolute; inset: 0; background: radial-gradient(70% 80% at 30% 18%, rgba(255,255,255,0.10), transparent 55%); pointer-events: none; }
  .hx-anno { position: absolute; left: 13px; bottom: 11px; font-family: var(--evx-font-mono); font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-ink-faint); z-index: 1; }

  .hx-price-row { display: flex; align-items: baseline; gap: 13px; margin-bottom: 5px; flex-wrap: wrap; }
  .hx-price { font-family: var(--evx-font-display); font-size: 26px; font-weight: 500; letter-spacing: -0.01em; }
  .hx-was { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--evx-ink-faint); }

  /* HERO */
  .hx-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: stretch; padding-top: 44px; padding-bottom: 10px; }
  .hx-hero__left { display: flex; flex-direction: column; justify-content: center; padding: 8px 0; }
  .hx-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-ink-soft); margin-bottom: 22px; }
  .hx-hero__h { font-family: var(--evx-font-display); font-weight: 500; font-size: clamp(36px, 4.6vw, 58px); line-height: 1.0; letter-spacing: -0.025em; margin-bottom: 18px; }
  .hx-hero__sub { font-size: 16px; color: var(--evx-ink-soft); max-width: 32em; margin-bottom: 26px; line-height: 1.55; }
  .hx-chips { display: flex; flex-wrap: wrap; gap: 9px; align-items: center; }
  .hx-chip-label { width: 100%; font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.12em; color: var(--evx-ink-faint); text-transform: uppercase; margin-bottom: 4px; }
  .hx-chip { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--evx-ink-soft); border: 1px solid var(--evx-rule); padding: 8px 13px; transition: border-color 0.18s, color 0.18s; }
  .hx-chip:hover { color: var(--evx-paper); border-color: var(--evx-ink-soft); }

  .hx-spotlight { position: relative; border: 1px solid var(--evx-rule); overflow: hidden; min-height: 400px; display: flex; flex-direction: column; text-align: left; background: none; padding: 0; cursor: pointer; color: inherit; }
  .hx-spotlight__img { flex: 1; min-height: 260px; border: none; }
  .hx-spotlight__tag { position: absolute; top: 15px; left: 15px; display: flex; gap: 8px; align-items: center; }
  .hx-pick { font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.08em; color: var(--evx-paper); background: rgba(14,13,12,0.72); border: 1px solid var(--evx-rule); padding: 4px 8px; text-transform: uppercase; }
  .hx-spotlight__body { padding: 20px 22px 22px; background: var(--evx-surface); border-top: 1px solid var(--evx-rule); }
  .hx-spotlight__title { font-size: 16px; margin-bottom: 5px; }
  .hx-spotlight__fit { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--evx-ink-faint); margin-bottom: 15px; }
  .hx-spotlight__meta { display: flex; gap: 14px; font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--evx-ink-soft); }

  /* SECTION */
  .hx-section { padding: 52px 0; }
  .hx-sec-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 26px; gap: 20px; }
  .hx-h2 { font-family: var(--evx-font-display); font-weight: 500; font-size: 24px; letter-spacing: -0.015em; }
  .hx-sub-line { font-size: 13px; color: var(--evx-ink-faint); margin-top: 5px; }
  .hx-seeall { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--evx-fox-orange); background: none; border: none; cursor: pointer; padding: 0; }
  .hx-seeall:hover { filter: brightness(1.15); }

  /* DRIVE grid */
  .hx-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .hx-card { background: var(--evx-surface); border: 1px solid var(--evx-rule); overflow: hidden; transition: border-color 0.18s, transform 0.18s; text-align: left; cursor: pointer; padding: 0; color: inherit; }
  .hx-card:hover { border-color: var(--evx-rule-strong); transform: translateY(-3px); }
  .hx-card__img { aspect-ratio: 5 / 6; border: none; border-bottom: 1px solid var(--evx-rule); }
  .hx-card__led { position: absolute; top: 11px; left: 11px; z-index: 1; }
  .hx-card__body { padding: 15px 16px 17px; }
  .hx-card__num { font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-champagne); margin-bottom: 9px; }
  .hx-card__title { font-size: 15px; font-weight: 500; margin-bottom: 7px; line-height: 1.25; }
  .hx-card__price { font-family: var(--evx-font-display); font-weight: 500; font-size: 16px; margin-bottom: 13px; display: flex; gap: 9px; align-items: baseline; }
  .hx-card__was { font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--evx-ink-faint); }
  .hx-card__meta { display: flex; align-items: center; justify-content: space-between; font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--evx-ink-soft); padding-top: 12px; border-top: 1px solid var(--evx-rule); }
  .hx-card--skel { pointer-events: none; opacity: 0.5; }
  .hx-card--skel .hx-card__img { aspect-ratio: 5 / 6; }

  /* BMW feature */
  .hx-feature { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; background: var(--evx-surface); border: 1px solid var(--evx-rule); padding: 32px; }
  .hx-feature__img { aspect-ratio: 4 / 3; }
  .hx-kick { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--evx-fox-orange); margin-bottom: 16px; }
  .hx-h3 { font-family: var(--evx-font-display); font-weight: 500; font-size: 30px; letter-spacing: -0.02em; margin-bottom: 8px; }
  .hx-feature__line { font-size: 17px; color: var(--evx-ink-soft); margin-bottom: 20px; }
  .hx-matrix { display: flex; gap: 22px; font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--evx-ink-soft); margin-bottom: 22px; flex-wrap: wrap; }
  .hx-matrix b { color: var(--evx-paper); font-weight: 500; }
  .hx-price-row--feature { margin-bottom: 22px; }
  .hx-price-row--feature .hx-price { font-size: 30px; }
  .hx-btn-line { display: inline-flex; align-items: center; gap: 11px; font-family: var(--evx-font-mono); font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--evx-paper); border: none; border-bottom: 1px solid var(--evx-fox-orange); padding: 0 0 8px; background: none; cursor: pointer; transition: gap 0.2s; }
  .hx-btn-line .hx-a { color: var(--evx-fox-orange); }
  .hx-btn-line:hover { gap: 16px; }

  /* find by car */
  .hx-cars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .hx-ctile { border: 1px solid var(--evx-rule); background: var(--evx-surface); padding: 24px 20px; text-align: left; cursor: pointer; color: inherit; transition: border-color 0.18s, background 0.18s; }
  .hx-ctile:hover { border-color: var(--evx-rule-strong); background: var(--evx-surface-2); }
  .hx-cq { font-family: var(--evx-font-display); font-weight: 500; font-size: 17px; margin-bottom: 5px; }
  .hx-cc { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--evx-ink-faint); }

  /* tiers */
  .hx-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .hx-tier { position: relative; border: 1px solid var(--evx-rule); background: var(--evx-surface); padding: 30px 26px; display: flex; flex-direction: column; }
  .hx-tier--rec { border-color: rgba(232,116,44,0.42); }
  .hx-rec { position: absolute; top: -1px; right: -1px; font-family: var(--evx-font-mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: #fff; background: var(--evx-fox-orange); padding: 5px 10px; }
  .hx-tnum { font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-ink-faint); margin-bottom: 14px; }
  .hx-tname { font-family: var(--evx-font-display); font-weight: 500; font-size: 23px; letter-spacing: -0.01em; margin-bottom: 6px; }
  .hx-tprice { font-family: var(--evx-font-mono); font-size: 12px; letter-spacing: 0.04em; color: var(--evx-paper); margin-bottom: 22px; }
  .hx-tlist { list-style: none; margin: 0 0 26px; padding: 0; flex: 1; }
  .hx-tlist li { font-size: 13.5px; color: var(--evx-ink-soft); padding: 7px 0; border-top: 1px solid var(--evx-rule); line-height: 1.4; }
  .hx-tlist li:first-child { border-top: none; }
  .hx-tlist li.hx-neg { color: var(--evx-ink-faint); }
  .hx-tcta { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--evx-paper); border: 1px solid var(--evx-rule-strong); padding: 11px 0; text-align: center; transition: border-color 0.18s; background: none; cursor: pointer; }
  .hx-tcta:hover { border-color: var(--evx-ink-soft); }
  .hx-tcta--rec { background: var(--evx-fox-orange); color: #fff; border-color: var(--evx-fox-orange); }
  .hx-tcta--rec:hover { filter: brightness(1.08); }
  .hx-tcta--dis { color: var(--evx-ink-faint); border-color: var(--evx-rule); cursor: default; }
  .hx-mkt-note { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--evx-ink-faint); margin-top: 22px; }

  /* TRADE band */
  .hx-trade { background: var(--evx-surface); border-top: 1px solid var(--evx-rule); border-bottom: 1px solid var(--evx-rule); }
  .hx-trade__inner { display: grid; grid-template-columns: 1fr 1.1fr; gap: 56px; align-items: center; padding-top: 52px; padding-bottom: 52px; }
  .hx-trade__lead { font-size: 15px; color: var(--evx-ink-soft); line-height: 1.6; max-width: 34em; margin: 14px 0 26px; }
  .hx-e { font-weight: 600; }
  .hx-trade__cta { display: flex; gap: 24px; align-items: center; }
  .hx-trade__points { display: grid; gap: 1px; background: var(--evx-rule); border: 1px solid var(--evx-rule); }
  .hx-tp { background: var(--evx-black); padding: 24px 26px; }
  .hx-tp__n { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--evx-fox-orange); margin-bottom: 10px; }
  .hx-tp__h { font-family: var(--evx-font-display); font-weight: 500; font-size: 16px; margin-bottom: 7px; }
  .hx-tp__p { font-size: 13px; color: var(--evx-ink-soft); line-height: 1.55; }

  /* why */
  .hx-why { background: var(--evx-surface); border-bottom: 1px solid var(--evx-rule); }
  .hx-why__grid { display: grid; grid-template-columns: 1.1fr 1fr 1fr 1fr; gap: 40px; align-items: start; padding-top: 52px; padding-bottom: 52px; }
  .hx-h3-sm { font-family: var(--evx-font-display); font-weight: 500; font-size: 22px; letter-spacing: -0.015em; margin-bottom: 12px; line-height: 1.15; }
  .hx-why__p { font-size: 14px; color: var(--evx-ink-soft); line-height: 1.6; max-width: 24em; }
  .hx-wi-n { font-family: var(--evx-font-mono); font-size: 12px; letter-spacing: 0.1em; color: var(--evx-fox-orange); margin-bottom: 18px; display: flex; align-items: center; gap: 10px; }
  .hx-wi-n::after { content: ""; flex: 1; height: 1px; background: var(--evx-rule-strong); }
  .hx-wi-h { font-family: var(--evx-font-display); font-weight: 500; font-size: 16px; margin-bottom: 9px; }
  .hx-wi-p { font-size: 13.5px; color: var(--evx-ink-soft); line-height: 1.6; }

  /* fitting band */
  .hx-band { padding-top: 54px; padding-bottom: 54px; }
  .hx-band__inner { border: 1px solid var(--evx-rule-strong); background: radial-gradient(120% 160% at 88% 10%, rgba(232,116,44,0.14), transparent 50%), var(--evx-surface); padding: 42px 46px; display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
  .hx-band__p { font-size: 15px; color: var(--evx-ink-soft); max-width: 36em; margin-top: 8px; }
  .hx-band__cta { display: flex; flex-direction: column; gap: 11px; flex: none; }
  .hx-band__note { font-family: var(--evx-font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--evx-ink-faint); text-align: center; }

  /* buttons */
  .hx-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: var(--evx-fox-orange); color: #fff; font-family: var(--evx-font-display); font-weight: 500; font-size: 13.5px; height: 40px; padding: 0 18px; border: none; cursor: pointer; transition: filter 0.18s; border-radius: 2px; }
  .hx-btn-primary:hover { filter: brightness(1.08); }
  .hx-btn-primary--lg { height: 50px; padding: 0 30px; font-size: 15px; }

  @media (max-width: 1080px) {
    .hx-grid4 { grid-template-columns: repeat(2, 1fr); }
    .hx-cars { grid-template-columns: 1fr; }
    .hx-feature { grid-template-columns: 1fr; gap: 28px; }
    .hx-tiers { grid-template-columns: 1fr; }
    .hx-trade__inner { grid-template-columns: 1fr; gap: 32px; }
    .hx-why__grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 860px) {
    .hx-hero { grid-template-columns: 1fr; gap: 26px; }
  }
  @media (max-width: 600px) {
    .hx-grid4 { grid-template-columns: 1fr 1fr; gap: 12px; }
    .hx-why__grid { grid-template-columns: 1fr; }
  }
</style>
