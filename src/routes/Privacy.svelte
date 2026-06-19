<script lang="ts">
  import { onMount } from 'svelte';
  import LegalLayout from '../lib/LegalLayout.svelte';
  import { applySeo } from '../lib/seo';

  onMount(() => applySeo({
    title: 'Privacy Policy',
    description: 'How ÉIRVOX collects, uses, and protects your personal data. GDPR-aligned, Ireland-based.',
    path: '/privacy',
  }));

  const sections = [
    { num: '01', id: 'p-who',         label: 'Who we are' },
    { num: '02', id: 'p-collect',     label: 'What we collect' },
    { num: '03', id: 'p-why',         label: 'Why we collect it' },
    { num: '04', id: 'p-basis',       label: 'Legal basis' },
    { num: '05', id: 'p-share',       label: 'Who we share with' },
    { num: '06', id: 'p-retention',   label: 'Retention' },
    { num: '07', id: 'p-rights',      label: 'Your rights (GDPR)' },
    { num: '08', id: 'p-cookies',     label: 'Cookies' },
    { num: '09', id: 'p-security',    label: 'Security' },
    { num: '10', id: 'p-children',    label: 'Children' },
    { num: '11', id: 'p-international',label: 'International transfers' },
    { num: '12', id: 'p-changes',     label: 'Changes' },
    { num: '13', id: 'p-contact',     label: 'Contact &amp; complaints' },
  ];
</script>

<LegalLayout
  title="Privacy Policy."
  {sections}
  intro="How ÉIRVOX handles your personal data. We collect what we need, hold it only as long as we need it, and we do not sell your data, to anyone, ever. Effective 1 June 2026. Pending final legal review before public launch."
>
  <section class="legal-section">
    <span class="legal-section__num">01 · WHO WE ARE</span>
    <h2 id="p-who" class="legal-section__h">Who we are.</h2>
    <p>
      <strong>EIRVOX LIMITED</strong> (CRO 806648), registered in Dublin, Ireland, is the
      <strong>data controller</strong> for personal information collected through eirvox.ie and associated services.
      We're part of the Vantaneant International Ltd group.
    </p>
    <p>Contact: <a href="mailto:support@eirvox.ie">support@eirvox.ie</a></p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">02 · WHAT WE COLLECT</span>
    <h2 id="p-collect" class="legal-section__h">What we collect.</h2>
    <ul>
      <li><strong>Account information:</strong> name, email, phone number, city, country.</li>
      <li><strong>Delivery information:</strong> shipping address (provided at reservation).</li>
      <li><strong>Payment information:</strong> processed by third-party providers (Stripe, Revolut, banks). We do not store full card numbers.</li>
      <li><strong>Seller / Tradesperson information:</strong> trading name, qualifications, certificates, photographs of work, references.</li>
      <li><strong>Verification documents:</strong> where requested for a specific applicant, a government-issued ID is held securely and used only to confirm identity and eligibility. We do not run background checks or financial verification.</li>
      <li><strong>Device &amp; usage data:</strong> IP address, browser type, pages visited, basic interaction events.</li>
      <li><strong>Communications:</strong> messages between buyers, sellers, tradespeople, and the platform.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">03 · WHY</span>
    <h2 id="p-why" class="legal-section__h">Why we collect it.</h2>
    <ul>
      <li>To operate your account and process reservations.</li>
      <li>To verify sellers and tradespeople - identity, qualifications, eligibility.</li>
      <li>To facilitate communication between users.</li>
      <li>To improve the platform - anonymous analytics, feature usage patterns.</li>
      <li>To prevent fraud, abuse, and platform misuse.</li>
      <li>To comply with legal obligations - tax, anti-money-laundering where applicable, court orders.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">04 · LEGAL BASIS</span>
    <h2 id="p-basis" class="legal-section__h">Legal basis.</h2>
    <p>Under the GDPR, we process your data under one or more of the following bases:</p>
    <ul>
      <li><strong>Contract</strong> - to provide the service you've signed up for.</li>
      <li><strong>Consent</strong> - for optional services like newsletters, where you've opted in.</li>
      <li><strong>Legitimate interest</strong> - running the platform securely, preventing fraud.</li>
      <li><strong>Legal obligation</strong> - tax records, regulatory compliance.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">05 · SHARE</span>
    <h2 id="p-share" class="legal-section__h">Who we share with.</h2>
    <ul>
      <li><strong>Sellers and tradespeople</strong> - when you reserve an item or request a quote, the relevant party receives the contact details needed to fulfil the transaction.</li>
      <li><strong>Payment providers</strong> - Stripe, Revolut, and similar, to process payments.</li>
      <li><strong>Shipping providers</strong> - An Post and similar, when an item is shipped from Dublin.</li>
      <li><strong>Legal authorities</strong> - where required by law or court order.</li>
    </ul>
    <p>
      We do <strong>not sell your data to third parties</strong>, ever. We do not run behavioural advertising
      and we do not share data with advertisers.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">06 · RETENTION</span>
    <h2 id="p-retention" class="legal-section__h">Retention.</h2>
    <ul>
      <li><strong>Active accounts:</strong> retained for the life of the account plus 2 years.</li>
      <li><strong>Transaction records:</strong> 7 years (tax and accounting requirements under Irish law).</li>
      <li><strong>Messages:</strong> 1 year after the conversation ends.</li>
      <li><strong>Deleted accounts:</strong> personal data deleted within 30 days, except where legal retention applies.</li>
      <li><strong>Verification documents:</strong> deleted within 90 days of account termination.</li>
    </ul>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">07 · YOUR RIGHTS</span>
    <h2 id="p-rights" class="legal-section__h">Your rights (GDPR).</h2>
    <p>You have the right to:</p>
    <ul>
      <li><strong>Access</strong> - request a copy of the data we hold about you.</li>
      <li><strong>Rectification</strong> - correct inaccurate data.</li>
      <li><strong>Erasure</strong> - request deletion of your data ("right to be forgotten").</li>
      <li><strong>Restriction</strong> - limit how we process your data.</li>
      <li><strong>Portability</strong> - receive your data in a structured, machine-readable format.</li>
      <li><strong>Objection</strong> - object to processing for legitimate interest reasons.</li>
      <li><strong>Withdraw consent</strong> - for processing based on consent.</li>
    </ul>
    <p>
      To exercise any of these rights, email <a href="mailto:support@eirvox.ie">support@eirvox.ie</a>.
      We respond within <strong>30 days</strong>. You also have the right to complain to the
      Irish Data Protection Commission: <a href="https://dataprotection.ie" target="_blank" rel="noopener">dataprotection.ie</a>.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">08 · COOKIES</span>
    <h2 id="p-cookies" class="legal-section__h">Cookies.</h2>
    <p>
      See our <a href="#/cookies">Cookie Policy</a> for the full breakdown. In short: essential cookies only,
      no behavioural advertising, no cross-site tracking.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">09 · SECURITY</span>
    <h2 id="p-security" class="legal-section__h">Security.</h2>
    <p>
      We use TLS for all data in transit, role-based access controls for the team, and regular security review.
      No system is 100% secure. If we discover a breach affecting your data, we'll notify you and the Irish
      Data Protection Commission within 72 hours, as required by the GDPR.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">10 · CHILDREN</span>
    <h2 id="p-children" class="legal-section__h">Children.</h2>
    <p>
      ÉIRVOX is not intended for use by anyone under 18. We do not knowingly collect data from minors.
      If we discover an account belongs to a minor, we delete it.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">11 · INTERNATIONAL</span>
    <h2 id="p-international" class="legal-section__h">International transfers.</h2>
    <p>
      Personal data is processed primarily within the Republic of Ireland and the European Economic Area.
      Where processing requires transfer outside the EEA (for example, some technical service providers),
      we use <strong>Standard Contractual Clauses</strong> approved by the European Commission.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">12 · CHANGES</span>
    <h2 id="p-changes" class="legal-section__h">Changes.</h2>
    <p>
      Material changes to this policy will be notified by email at least <strong>30 days</strong> before
      they take effect. The "last updated" date at the top reflects the most recent revision.
    </p>
  </section>

  <section class="legal-section">
    <span class="legal-section__num">13 · CONTACT</span>
    <h2 id="p-contact" class="legal-section__h">Contact &amp; complaints.</h2>
    <p>
      Privacy questions: <a href="mailto:support@eirvox.ie">support@eirvox.ie</a> - 30 day response.
    </p>
    <p>
      To complain to the regulator:
      <a href="https://dataprotection.ie" target="_blank" rel="noopener">dataprotection.ie</a> (Irish DPC).
    </p>
  </section>
</LegalLayout>
