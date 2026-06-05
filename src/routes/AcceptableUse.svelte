<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Acceptable Use Policy',
    description: 'What you can and can\'t do on ÉIRVOX. Plain rules, transparent enforcement.',
    path: '/acceptable-use',
  }));

  const sections = [
    { num: '01', id: 'au-allowed',    label: 'Allowed' },
    { num: '02', id: 'au-notallowed', label: 'Not allowed' },
    { num: '03', id: 'au-consequences',label: 'Consequences' },
    { num: '04', id: 'au-report',     label: 'Reporting' },
  ];
</script>

<LegalLayout
  title="Acceptable Use."
  {sections}
  intro="ÉIRVOX is a small, curated platform. The rules below keep it that way - clear, honest, and worth participating in."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · ALLOWED</span>
    <h2 id="au-allowed" class="legal-section__h">Allowed.</h2>
    <ul>
      <li><strong>Genuine listings</strong> - items you actually own, accurately described.</li>
      <li><strong>Honest condition reports</strong> - disclose flaws. Buyers reward sellers who do.</li>
      <li><strong>Respectful communication</strong> - to buyers, sellers, tradespeople, the team.</li>
      <li><strong>Fair pricing</strong> - your call, but make it real. Inflating to bargain back wastes everyone's time.</li>
      <li><strong>Constructive feedback</strong> - to us, about the platform. We read every email.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · NOT ALLOWED</span>
    <h2 id="au-notallowed" class="legal-section__h">Not allowed.</h2>
    <ul>
      <li><strong>Counterfeit, replica, or stolen goods.</strong> Zero tolerance, immediate suspension, reported to authorities where required.</li>
      <li><strong>Misleading listings</strong> - fake provenance, hidden defects, wrong reference numbers.</li>
      <li><strong>Harassment, threats, or abuse</strong> - to buyers, sellers, tradespeople, the team.</li>
      <li><strong>Spam, scraping, or bulk listing creation</strong> from automated tools.</li>
      <li><strong>Price manipulation</strong> - shill bidding, fake offers to inflate prices, coordinated listing pumps.</li>
      <li><strong>Fee circumvention</strong> - directing buyers off-platform to avoid commission, after the introduction was made through us.</li>
      <li><strong>Multiple accounts</strong> - one person, one account. Sock-puppet reviews are immediate ban.</li>
      <li><strong>Fake trade profiles</strong> - claiming qualifications you don't have, using stolen photos of work.</li>
      <li><strong>Fake or paid-for reviews</strong> - reviews must come from real transactions.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · CONSEQUENCES</span>
    <h2 id="au-consequences" class="legal-section__h">Consequences.</h2>
    <p>Enforcement is proportionate but firm:</p>
    <ul>
      <li><strong>Warning</strong> - for minor or first-time issues. Documented, with explanation.</li>
      <li><strong>Suspension</strong> - for repeated issues or significant breaches. Account paused pending review.</li>
      <li><strong>Permanent ban</strong> - for serious violations or after a warning + suspension cycle.</li>
      <li><strong>Immediate ban</strong> - for counterfeits, fraud, stolen goods, harassment. No second chances on these.</li>
      <li><strong>Forfeit of deposits and outstanding commissions</strong> may accompany a ban where applicable.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · REPORTING</span>
    <h2 id="au-report" class="legal-section__h">Reporting.</h2>
    <p>
      See something off? Report it. Email <a href="mailto:support@eirvox.ie">support@eirvox.ie</a> with the
      listing or profile URL and what you observed. We review every report and respond within 48 hours.
    </p>
    <p>
      Listings and profiles also carry a <strong>report</strong> link in their meta - same path,
      one click instead of a copy-paste.
    </p>
  </section>
</LegalLayout>
