<script lang="ts">
  import { onMount } from 'svelte';
  import Nav from '../lib/Nav.svelte';
  import Footer from '../lib/Footer.svelte';
  import { navigate } from '../lib/router';
  import { applySeo, seo } from '../lib/seo';
  import { getMarketplaceFees, type MarketplaceFees } from '../lib/api';

  // Tier pricing is read live from site_settings.fees (single source of
  // truth) — never hardcoded. Verified carries no monthly fee (free
  // tier); House is invite / by-arrangement, no figure.
  let fees: MarketplaceFees | null = null;

  onMount(async () => {
    applySeo(seo.sell());
    fees = await getMarketplaceFees();
  });

  const lookFor = [
    { n: '01', h: 'Genuine stock', p: 'Real items you hold, accurately described. No drop-ship, no stock photos.' },
    { n: '02', h: 'Honest condition', p: 'Condition stated plainly. Faults shown, not hidden.' },
    { n: '03', h: 'Fast dispatch', p: 'Orders out quickly, tracked, and packed properly.' },
    { n: '04', h: 'Responsive', p: 'You answer buyers. Slow sellers don’t stay.' },
  ];
  const applySteps = [
    { n: '01', h: 'Apply', p: 'Tell us what you sell and the door you want.' },
    { n: '02', h: 'Review & call', p: 'We review and have a short call, usually within five working days.' },
    { n: '03', h: 'Onboard & list', p: 'Approved sellers are set up and listing the same week.' },
  ];
</script>

<Nav dark />

<main class="sx">
  <div class="page-container">

    <!-- HERO -->
    <section class="sx-hero">
      <div class="sx-kick">Sell on ÉIRVOX</div>
      <h1 class="sx-h1">Three doors<br />into the house.</h1>
      <p class="sx-stand">
        <span class="sx-italic">A curated marketplace, not a feed.</span>
        Selling is by application — we admit sellers who clear the same bar as everything else here, then hand them the right door.
      </p>
    </section>

    <!-- TIERS -->
    <section class="sx-tiers" id="tiers">
      <div class="sx-tier">
        <div class="sx-tnum">Tier 03 · The threshold</div>
        <div class="sx-tname">Verified</div>
        <div class="sx-tprice">{fees ? `${fees.verifiedCommissionPct}% commission · €0/mo` : '—'}</div>
        <p class="sx-tdesc">The way in. Verified status, list and sell — no monthly cost.</p>
        <ul class="sx-tlist">
          <li>Verified seller status</li>
          <li>List in any open category</li>
          <li>Direct payouts, no held funds</li>
          <li class="sx-neg">No shop page</li>
        </ul>
        <button class="sx-tcta" type="button" on:click={() => navigate('/sell/apply')}>Apply as Verified</button>
      </div>

      <div class="sx-tier sx-tier--rec">
        <span class="sx-rec">Recommended</span>
        <div class="sx-tnum">Tier 02 · The room</div>
        <div class="sx-tname">Atelier</div>
        <div class="sx-tprice">{fees ? `${fees.atelierCommissionPct}% commission · €${fees.atelierMonthlyEur}/mo` : '—'}</div>
        <p class="sx-tdesc">For sellers building a name. Your own shop page, lower commission.</p>
        <ul class="sx-tlist">
          <li>Everything in Verified</li>
          <li>Custom shop page</li>
          <li>Unlimited listings</li>
          <li>Sales analytics</li>
          <li>Priority support</li>
        </ul>
        <button class="sx-tcta sx-tcta--rec" type="button" on:click={() => navigate('/sell/apply')}>Apply as Atelier</button>
      </div>

      <div class="sx-tier">
        <div class="sx-tnum">Tier 01 · Invite</div>
        <div class="sx-tname">House</div>
        <div class="sx-tprice">By arrangement · invite only</div>
        <p class="sx-tdesc">The front of house. Editorial features, ÉIRVOX photography and copy.</p>
        <ul class="sx-tlist">
          <li>Homepage editorial features</li>
          <li>DRIVE issue scheduling</li>
          <li>ÉIRVOX photography &amp; copy</li>
          <li class="sx-neg">By invitation only</li>
        </ul>
        <span class="sx-tcta sx-tcta--dis">By invitation</span>
      </div>
    </section>
    <p class="sx-note">Applications open · every applicant gets a reply within five working days, and a short call.</p>

    <!-- WHAT WE LOOK FOR -->
    <section class="sx-look">
      <div class="sx-look__head">
        <div class="sx-eyebrow">What we look for</div>
        <h2 class="sx-h2">The same bar as everything else here.</h2>
      </div>
      <div class="sx-look__grid">
        {#each lookFor as item}
          <div class="sx-look__item">
            <div class="sx-rulenum">{item.n}<span class="sx-rule"></span></div>
            <h4 class="sx-ih">{item.h}</h4>
            <p class="sx-ip">{item.p}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- HOW APPLYING WORKS -->
    <section class="sx-how">
      <div class="sx-how__head"><div class="sx-eyebrow">How applying works</div></div>
      <div class="sx-how__grid">
        {#each applySteps as s}
          <div class="sx-how__cell">
            <div class="sx-stepn">{s.n}</div>
            <h4 class="sx-ih">{s.h}</h4>
            <p class="sx-ip">{s.p}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- APPLY BAND -->
    <section class="sx-band" id="apply">
      <div class="sx-band__inner">
        <div>
          <h3 class="sx-h3">Apply to sell.</h3>
          <p class="sx-band__p">Tell us what you sell and the door you want. We reply within five working days, with a short call before anything goes live.</p>
        </div>
        <div class="sx-band__cta">
          <button class="sx-btn-primary" type="button" on:click={() => navigate('/sell/apply')}>Apply to sell →</button>
          <span class="sx-band__note">Reply in five working days · a call before live</span>
        </div>
      </div>
    </section>

  </div>
</main>

<Footer dark />

<style>
  .sx { flex: 1; background: var(--evx-black); color: var(--evx-paper); padding-bottom: 58px; }

  .sx-italic { font-family: var(--evx-font-editorial); font-style: italic; color: var(--evx-paper); }
  .sx-eyebrow { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-ink-faint); margin-bottom: 16px; }
  .sx-kick { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-ink-soft); margin-bottom: 18px; }

  /* hero */
  .sx-hero { padding: 58px 0 38px; max-width: 50em; }
  .sx-h1 { font-family: var(--evx-font-display); font-weight: 500; font-size: clamp(36px, 4.8vw, 58px); line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 18px; }
  .sx-stand { font-size: 17px; color: var(--evx-ink-soft); line-height: 1.55; max-width: 38em; }

  /* tiers */
  .sx-tiers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: stretch; }
  .sx-tier { position: relative; border: 1px solid var(--evx-rule); background: var(--evx-surface); padding: 32px 28px; display: flex; flex-direction: column; }
  .sx-tier--rec { border-color: var(--evx-rule-strong); }
  .sx-rec { position: absolute; top: -1px; right: -1px; font-family: var(--evx-font-mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--evx-paper-soft); background: rgba(244,241,236,0.08); border: 1px solid var(--evx-rule); padding: 6px 11px; }
  .sx-tnum { font-family: var(--evx-font-mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--evx-ink-faint); margin-bottom: 16px; }
  .sx-tname { font-family: var(--evx-font-display); font-weight: 500; font-size: 26px; letter-spacing: -0.01em; margin-bottom: 8px; }
  .sx-tprice { font-family: var(--evx-font-mono); font-size: 12px; letter-spacing: 0.04em; color: var(--evx-paper); margin-bottom: 6px; }
  .sx-tdesc { font-size: 13px; color: var(--evx-ink-soft); line-height: 1.55; margin-bottom: 24px; }
  .sx-tlist { list-style: none; margin: 0 0 28px; padding: 0; flex: 1; }
  .sx-tlist li { font-size: 13.5px; color: var(--evx-ink-soft); padding: 9px 0; border-top: 1px solid var(--evx-rule); line-height: 1.4; }
  .sx-tlist li:first-child { border-top: none; }
  .sx-tlist li.sx-neg { color: var(--evx-ink-faint); }
  .sx-tcta { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--evx-paper); border: 1px solid var(--evx-rule-strong); padding: 13px 0; text-align: center; background: none; cursor: pointer; transition: border-color 0.18s; }
  .sx-tcta:hover { border-color: var(--evx-ink-soft); }
  .sx-tcta--rec { background: var(--evx-fox-orange); color: #fff; border-color: var(--evx-fox-orange); }
  .sx-tcta--rec:hover { filter: brightness(1.08); }
  .sx-tcta--dis { color: var(--evx-ink-faint); border-color: var(--evx-rule); cursor: default; }
  .sx-note { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--evx-ink-faint); margin-top: 22px; }

  /* what we look for */
  .sx-look { padding: 54px 0; border-top: 1px solid var(--evx-rule); margin-top: 36px; display: grid; grid-template-columns: 0.9fr 2.1fr; gap: 56px; align-items: start; }
  .sx-h2 { font-family: var(--evx-font-display); font-weight: 500; font-size: 26px; letter-spacing: -0.02em; line-height: 1.12; }
  .sx-look__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 36px 48px; }
  .sx-rulenum { font-family: var(--evx-font-mono); font-size: 12px; letter-spacing: 0.1em; color: var(--evx-ink-soft); margin-bottom: 14px; display: flex; align-items: center; gap: 11px; }
  .sx-rule { flex: 1; height: 1px; background: var(--evx-rule); }
  .sx-ih { font-family: var(--evx-font-display); font-weight: 500; font-size: 16px; margin-bottom: 9px; }
  .sx-ip { font-size: 13.5px; color: var(--evx-ink-soft); line-height: 1.6; }

  /* how applying works */
  .sx-how { padding: 0 0 54px; }
  .sx-how__head { padding: 0 0 22px; }
  .sx-how__grid { border: 1px solid var(--evx-rule); background: var(--evx-surface); display: grid; grid-template-columns: repeat(3, 1fr); }
  .sx-how__cell { padding: 30px 28px 32px; border-right: 1px solid var(--evx-rule); }
  .sx-how__cell:last-child { border-right: none; }
  .sx-stepn { font-family: var(--evx-font-mono); font-size: 11px; letter-spacing: 0.1em; color: var(--evx-ink-soft); margin-bottom: 16px; }

  /* apply band */
  .sx-band { padding: 0 0 8px; }
  .sx-band__inner { border: 1px solid var(--evx-rule-strong); background: radial-gradient(120% 160% at 88% 10%, rgba(232,116,44,0.14), transparent 50%), var(--evx-surface); padding: 46px 48px; display: flex; align-items: center; justify-content: space-between; gap: 40px; flex-wrap: wrap; }
  .sx-h3 { font-family: var(--evx-font-display); font-weight: 500; font-size: 30px; letter-spacing: -0.02em; margin-bottom: 11px; line-height: 1.1; }
  .sx-band__p { font-size: 15px; color: var(--evx-ink-soft); max-width: 40em; }
  .sx-band__cta { display: flex; flex-direction: column; gap: 11px; flex: none; }
  .sx-band__note { font-family: var(--evx-font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--evx-ink-faint); text-align: center; }
  .sx-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: var(--evx-fox-orange); color: #fff; border: none; font-family: var(--evx-font-display); font-weight: 500; font-size: 15px; height: 52px; padding: 0 34px; cursor: pointer; transition: filter 0.18s; border-radius: 2px; }
  .sx-btn-primary:hover { filter: brightness(1.08); }

  @media (max-width: 1080px) {
    .sx-tiers { grid-template-columns: 1fr; }
    .sx-look { grid-template-columns: 1fr; gap: 28px; }
    .sx-how__grid { grid-template-columns: 1fr; }
    .sx-how__cell { border-right: none; border-bottom: 1px solid var(--evx-rule); }
    .sx-how__cell:last-child { border-bottom: none; }
  }
  /* Cosy mobile: trim desktop padding so phones don't feel dense. */
  @media (max-width: 767px) {
    .sx-hero { padding: 38px 0 26px; }
    .sx-look { padding: 40px 0; margin-top: 28px; }
    .sx-how { padding: 0 0 40px; }
    .sx-how__cell { padding: 24px 22px; }
    .sx-tier { padding: 26px 22px; }
    .sx-band__inner { padding: 30px 24px; }
  }
  @media (max-width: 600px) {
    .sx-look__grid { grid-template-columns: 1fr; }
    .sx-band__inner { flex-direction: column; align-items: flex-start; gap: 20px; }
  }
</style>
